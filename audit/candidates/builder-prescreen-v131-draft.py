#!/usr/bin/env python3
"""Pathways content-audit rubric v1.3 -- script stage (S) + verbatim-anchor verifier + cue-asymmetry report.
PROPOSED, uncertified. Every screen row is a CANDIDATE for model/human review, never a verdict.

Usage:
  python3 prescreen-v1.3.py screen    bank.json            > script-flags.jsonl   # candidate rows (stage S); bank report on stderr
  python3 prescreen-v1.3.py verify    bank.json flags.jsonl [--inventory tag-inventory.csv]
  python3 prescreen-v1.3.py cues      bank.json [--min-count 20] [--stratum-min 8]  # per-track cue-asymmetry report (JSON)
  python3 prescreen-v1.3.py numbers   "some text"                                  # show what the number normaliser reads
  python3 prescreen-v1.3.py fixtures                                               # built-in regression fixtures

bank.json: {"items":[...]} in the published Pathways item schema. No network calls, no spend.

Changes vs prescreen v1.2 (rubric-v1.3.md):
  [P5] number normalisation (item 1638 class). v1.2's number check read digits only, so "Three call-outs is within her
       limit of 4" was seen as {4} and compared against a digit key. v1.3 reads number words 0-20, tens, hundred
       ("one hundred and twenty", "a hundred"), hyphenated and spaced compounds ("twenty-five"), ordinals (first/1st,
       twenty-first/21st), percentages ("forty percent" / "40 percent" / "40%"), and the safe fractions only:
       half / a half / one half, a third of / one third / two thirds, "X and a half"; digit fractions 1/2 also count as 0.5.
       Values compare after normalisation (Fraction values; ordinals, percents and plain numbers are kept apart where it
       matters). Ambiguous readings are WEAK: bare "one" (pronoun), "second" (time unit), "a third" not followed by "of",
       "half" before hour/day/session, and digit-fraction values. Weak readings can SUPPRESS a numeric divergence but can
       never RAISE one. "a" alone is never a number.
  [P6] 5.1 format-equivalence cap. Item explanation vs keyed option explanation is classified:
         identical -> no row;  format_only (case, whitespace, quote marks, dashes, number form) -> LOW;
         crossref_only (the only difference is a parenthetical "(see also Section(s) ...)" whose section numbers all
           appear in the item's citation) -> LOW;  crossref_not_in_citation -> HIGH, routed to citation check;
         text (anything else, e.g. a paraphrase) -> HIGH candidate; the model/SME applies 5.1 (a0) vs (a).
       A difference that is pure format can never produce a blocker: the numeric blocker fires only on a value
       disagreement AFTER normalisation, and the fixtures assert this over a set of format-variant pairs.
  [P7] cue asymmetry, generic and per track: phrase families x (key rate vs distractor rate), ratio R and
       P(key | cue) = hits on keys / all hits; flag when R >= 2 or R <= 0.5 with at least min-count hits; "watch"
       band 1.5-2 and 0.5-0.67. One-sided binomial tail reported for the SME, not used as a gate.
  Items 44, 46, 93 (exact texts supplied by the builder 2026-10-26) are now real regression fixtures.
"""
import json, re, sys, math, itertools, difflib, unicodedata
from fractions import Fraction as F
from collections import Counter, defaultdict

STOP = set("""a an the and or of to in on for with at by from as is are was were be been being it its this that
these those he she him his her they them their you your we our what which who whom do does did should would can could
will may might must not no than then so if when while before after during into about over under again more most less
very just only also each any all some such own same other""".split())
ABSOLUTE = re.compile(r"\b(always|never|clearly|guarantee[sd]?|impossible|completely|cannot|all of|none of|invalid)\b", re.I)

# [P3] contrast lexicon: explicit connectives plus the contrastive constructions the bank's why_tempting prose uses
CONTRAST_V2 = re.compile(r"""\b(but|however|yet|although|though|whereas|while|instead|rather\s+than|except|unless|
    only\s+if|only\s+when|not\s+(?:the|a|an|what|enough|necessarily|by\s+itself|on\s+its\s+own)|
    that\s+would|that\s+does\s+not|that\s+doesn't|that\s+is\s+not|that\s+isn't|does\s+not|doesn't|is\s+not|isn't|
    cannot|can't|misses|ignores|skips|overlooks|outside|here|this\s+(?:plan|item|case|stem|scenario|question)|
    in\s+this\s+case)\b""", re.I | re.X)
SELF_KEY = re.compile(r"\b(is (?:the )?correct|is (?:the )?best|right answer|is what you should)\b", re.I)
CONDITIONAL = re.compile(r"\b(in an?|under|for an?|if|when|would be|would|with an?)\b", re.I)

# [P2] Cooper, Heron & Heward (2020) 3rd ed.: distinctive title tokens per chapter (citation self-consistency only).
CHH3_TOKENS = {
 1: {"definition", "characteristics"}, 2: {"basic", "concepts", "principles"}, 3: {"selecting", "defining", "target"},
 4: {"measuring", "measurement"}, 5: {"quality", "accuracy", "reliability", "validity", "interobserver", "improving", "assessing"},
 6: {"graphic", "graphs", "graphing", "displays", "constructing", "interpreting"}, 7: {"analyzing", "assumptions", "strategies"},
 8: {"reversal", "multielement", "alternating"}, 9: {"multiple", "baseline", "changing", "criterion"},
 10: {"planning", "evaluating", "research"}, 11: {"positive", "reinforcement"}, 12: {"negative", "reinforcement"},
 13: {"schedules"}, 14: {"positive", "punishment"}, 15: {"negative", "punishment"}, 16: {"motivating", "operations"},
 17: {"stimulus", "control"}, 18: {"verbal"}, 19: {"equivalence"}, 20: {"nonequivalence", "emergent"},
 21: {"imitation", "modeling", "observational"}, 22: {"shaping"}, 23: {"chaining"}, 24: {"extinction"},
 25: {"differential"}, 26: {"antecedent"}, 27: {"functional", "assessment"}, 28: {"token", "economy", "group", "contingencies", "contracting"},
 29: {"self-management", "self"}, 30: {"generalization", "maintenance"}, 31: {"ethical", "ethics", "professional", "responsibilities"},
}
# tokens shared by several chapters are not evidence of a specific chapter
_tokcount = Counter(t for s in CHH3_TOKENS.values() for t in s)
CHH3_DISTINCT = {n: {t for t in s if _tokcount[t] == 1} or s for n, s in CHH3_TOKENS.items()}

def words(s):
    return [w for w in re.findall(r"[a-z0-9']+", (s or "").lower()) if w not in STOP and len(w) > 2]

def row(iid, flag, sev, why, opt=None, route=None, scope="item", anchors=None):
    return {"item_id": iid, "flag": flag, "severity": sev, "rationale": why, "option": opt, "route": route,
            "detector": "script", "scope": scope, "affected_option_id": None if opt is None else str(opt),
            "hold_inference": False, "anchors": anchors or [], "verification_status": "unverified",
            "adjudication_status": "pending"}

# ---------------------------------------------------------------- [P3]
def why_tempting_conflict(wt):
    """Return a reason string if why_tempting looks like it argues for the option, else None."""
    if not wt:
        return None
    sents = [s for s in re.split(r"(?<=[.!?])\s+", wt.strip()) if s]
    for i, s in enumerate(sents):
        m = SELF_KEY.search(s)
        if not m:
            continue
        qualified = bool(CONDITIONAL.search(s[m.end():])) or bool(CONDITIONAL.search(s[:m.start()]))
        contrast_after = any(CONTRAST_V2.search(t) for t in sents[i + 1:]) or bool(CONTRAST_V2.search(s[m.end():]))
        if not qualified and not contrast_after:
            return "unqualified correctness claim with no contrast after it"
    if not CONTRAST_V2.search(wt):
        return "no contrast at all"
    return None

# ---------------------------------------------------------------- [P2]
def chapter_mismatch(n, title):
    toks = set(re.findall(r"[a-z\-]+", title.lower()))
    if n not in CHH3_TOKENS:
        return None
    if toks & CHH3_TOKENS[n]:
        return None
    others = [k for k, s in CHH3_DISTINCT.items() if k != n and toks & s]
    return others or None


# ---------------------------------------------------------------- [P5] number normalisation
ONES = {w: i for i, w in enumerate("zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen "
                                    "fifteen sixteen seventeen eighteen nineteen".split())}
TENS = {w: 10 * (i + 2) for i, w in enumerate("twenty thirty forty fifty sixty seventy eighty ninety".split())}
ORD_ONES = {w: i + 1 for i, w in enumerate("first second third fourth fifth sixth seventh eighth ninth tenth eleventh twelfth "
                                            "thirteenth fourteenth fifteenth sixteenth seventeenth eighteenth nineteenth".split())}
ORD_TENS = {w: 10 * (i + 2) for i, w in enumerate("twentieth thirtieth fortieth fiftieth sixtieth seventieth eightieth ninetieth".split())}
HALF_WEAK_NEXT = {"hour", "hours", "day", "days", "session", "sessions", "way", "time", "an"}
_TOK = re.compile(r"\d+/\d+|\d{1,3}(?:,\d{3})+(?:\.\d+)?(?:st|nd|rd|th)?|\d+(?:\.\d+)?(?:st|nd|rd|th)?|%|[a-z]+")

def _tokens(s):
    """Lower-cased tokens with a break flag: True when the gap before the token holds anything but spaces/hyphens."""
    s = unicodedata.normalize("NFKC", s or "").lower().replace("\u2010", "-").replace("\u2011", "-").replace("\u2013", "-")
    out = []; last = 0
    for m in _TOK.finditer(s):
        gap = s[last:m.start()]
        out.append((m.group(0), bool(gap.strip(" \t\n-")) or not out, m.start(), m.end())); last = m.end()
    return out

def num_values(s):
    """[(value: Fraction, kind: 'num'|'ord'|'pct', strength: 'strong'|'weak', start, end)]"""
    T = _tokens(s); n = len(T); out = []; i = 0
    tok = lambda j: T[j][0] if j < n else None
    joined = lambda j: j < n and not T[j][1]          # token j continues the phrase (no punctuation break before it)
    def pct_after(j):
        if joined(j) and tok(j) in ("%", "percent"): return j + 1
        if joined(j) and tok(j) == "per" and joined(j + 1) and tok(j + 1) == "cent": return j + 2
        return None
    while i < n:
        t = tok(i); start = T[i][2]
        # ---- digits
        m = re.fullmatch(r"(\d+)/(\d+)", t)
        if m:
            a, b = int(m.group(1)), int(m.group(2))
            out += [(F(a), "num", "strong", start, T[i][3]), (F(b), "num", "strong", start, T[i][3])]
            if b: out.append((F(a, b), "num", "weak", start, T[i][3]))
            i += 1; continue
        m = re.fullmatch(r"([\d,]+(?:\.\d+)?)(st|nd|rd|th)?", t)
        if m and t[0].isdigit():
            v = F(m.group(1).replace(",", ""))
            if m.group(2):
                out.append((v, "ord", "strong", start, T[i][3])); i += 1; continue
            j = pct_after(i + 1)
            if j:
                out.append((v, "pct", "strong", start, T[j - 1][3])); i = j; continue
            out.append((v, "num", "strong", start, T[i][3])); i += 1; continue
        # ---- "a" only as a multiplier: a hundred / a half / a third of
        if t == "a" and joined(i + 1) and tok(i + 1) in ("hundred", "half", "third"):
            nx = tok(i + 1)
            if nx == "half":
                weak = joined(i + 2) and tok(i + 2) in HALF_WEAK_NEXT
                out.append((F(1, 2), "num", "weak" if weak else "strong", start, T[i + 1][3])); i += 2; continue
            if nx == "third":
                if joined(i + 2) and tok(i + 2) == "of":
                    out.append((F(1, 3), "num", "strong", start, T[i + 1][3]))
                else:
                    out.append((F(3), "ord", "weak", start, T[i + 1][3]))
                i += 2; continue
            cur = 1; j = i + 1                    # "a hundred"
        else:
            # ---- word ordinals standing alone
            if t in ORD_ONES or t in ORD_TENS or t == "hundredth":
                v = ORD_ONES.get(t) or ORD_TENS.get(t) or 100
                weak = t == "second"
                if t == "third" and joined(i + 1) and tok(i + 1) == "of":
                    weak = True                   # "third of" without a/one: ambiguous, keep weak
                out.append((F(v), "ord", "weak" if weak else "strong", start, T[i][3])); i += 1; continue
            if t == "half":
                weak = joined(i + 1) and tok(i + 1) in HALF_WEAK_NEXT
                out.append((F(1, 2), "num", "weak" if weak else "strong", start, T[i][3])); i += 1; continue
            if t in ONES:
                cur = ONES[t]; j = i + 1
            elif t in TENS:
                cur = TENS[t]; j = i + 1
                if joined(j) and tok(j) in ONES and 1 <= ONES[tok(j)] <= 9:
                    cur += ONES[tok(j)]; j += 1
                elif joined(j) and tok(j) in ORD_ONES and ORD_ONES[tok(j)] <= 9:
                    out.append((F(cur + ORD_ONES[tok(j)]), "ord", "strong", start, T[j][3])); i = j + 1; continue
            elif t == "hundred":
                cur = 1; j = i
            else:
                i += 1; continue
        lone_one = (t == "one")
        # ---- hundreds
        if joined(j) and tok(j) == "hundred" and cur <= 9:
            cur *= 100; j += 1; lone_one = False
            k = j + 1 if (joined(j) and tok(j) == "and" and joined(j + 1) and (tok(j + 1) in ONES or tok(j + 1) in TENS)) else j
            if joined(k) and tok(k) in TENS:
                cur += TENS[tok(k)]; k += 1
                if joined(k) and tok(k) in ONES and 1 <= ONES[tok(k)] <= 9:
                    cur += ONES[tok(k)]; k += 1
                j = k
            elif joined(k) and tok(k) in ONES and ONES[tok(k)] >= 1:
                cur += ONES[tok(k)]; j = k + 1
        end = T[j - 1][3]
        # ---- fractions: one/two thirds, one half, X and a half
        if joined(j) and tok(j) in ("third", "thirds") and 1 <= cur <= 9 and t != "a":
            out.append((F(cur, 3), "num", "strong", start, T[j][3])); i = j + 1; continue
        if joined(j) and tok(j) in ("half", "halves") and cur in (1,) and t != "a":
            out.append((F(1, 2), "num", "strong", start, T[j][3])); i = j + 1; continue
        if joined(j) and tok(j) == "and" and joined(j + 1) and tok(j + 1) == "a" and joined(j + 2) and tok(j + 2) == "half":
            out.append((cur + F(1, 2), "num", "strong", start, T[j + 2][3])); i = j + 3; continue
        p = pct_after(j)
        if p:
            out.append((F(cur), "pct", "strong", start, T[p - 1][3])); i = p; continue
        out.append((F(cur), "num", "weak" if lone_one else "strong", start, end)); i = j
    return out

def _vals(vs, strong_only=False):
    return {v for v, k, s, *_ in vs if (s == "strong" or not strong_only)}

def _typed(vs):
    return {(v, k) for v, k, s, *_ in vs if s == "strong"}

def _fmt(v):
    return str(v.numerator) if v.denominator == 1 else (f"{float(v):g}" if v.denominator in (2, 4, 5, 8, 10) else f"{v.numerator}/{v.denominator}")

def nums(s):
    """Back-compat helper: normalised numeric values in s as display strings (strong and weak)."""
    return [_fmt(v) for v in sorted(_vals(num_values(s)))]

def format_key(s):
    """Text with every format-only difference removed: NFKC, quote marks, dashes, case, whitespace, final punctuation,
    and every number phrase replaced by its normalised value. Equal format_key == pure format equivalence."""
    s = unicodedata.normalize("NFKC", s or "")
    s = s.translate({0x2018: "'", 0x2019: "'", 0x201C: '"', 0x201D: '"', 0x2013: "-", 0x2014: "-", 0x2010: "-", 0x2011: "-"})
    low = s.lower()
    parts = []; last = 0
    for v, k, st, a, b in sorted(num_values(s), key=lambda x: x[3]):
        if a < last: continue
        parts.append(low[last:a]); parts.append(f"<{_fmt(v)}{'%' if k == 'pct' else ('th' if k == 'ord' else '')}>"); last = b
    parts.append(low[last:])
    out = "".join(parts)
    out = re.sub(r"\s*-\s*", "-", out); out = re.sub(r"\s+", " ", out).strip()
    return out.rstrip(" .;:!")

CROSSREF = re.compile(r"\s*\((?:see(?:\s+also)?|cf\.?|also\s+see)\s+[^()]*\)", re.I)

def divergence_class(ie, ke, citation=""):
    """identical | format_only | crossref_only | crossref_not_in_citation | text  (+ the cross-reference spans)"""
    if ie == ke:
        return "identical", []
    if format_key(ie) == format_key(ke):
        return "format_only", []
    refs = [m.group(0).strip() for m in CROSSREF.finditer(ie)] + [m.group(0).strip() for m in CROSSREF.finditer(ke)]
    if refs and format_key(CROSSREF.sub("", ie)) == format_key(CROSSREF.sub("", ke)):
        cited = set(re.findall(r"\d+\.\d+", citation or ""))
        secs = {s for r in refs for s in re.findall(r"\d+\.\d+", r)}
        return ("crossref_only" if secs and secs <= cited else "crossref_not_in_citation"), refs
    return "text", []

# ---------------------------------------------------------------- [P4]+[P5]+[P6] reconciliation

# ===== builder v1.3.1 DRAFT: referent-aware numeric comparison =====
_STOP = set("a an the is are was were to of in on for with and or not no it its his her their this that he she they we at by from as be been has have had do does did will would can could should may might must than then so such into about after before during within without per each every any all both few more most other some own same only very just also now when if because since while once begins begin started starts".split())
_UNITS = set("s sec secs second seconds minute minutes min mins hour hours hr hrs day days week weeks ms millisecond milliseconds % percent session sessions trial trials interval intervals opportunity opportunities step steps token tokens call-out call-outs point points".split())
_ATTR_RE = re.compile(r"\bis the (total|middle|median|mean|range|sum|average|count)\b|\bwould give\b", re.I)
_COMPUTED_RE = re.compile(r"(?:=|leaves|equals|gives)\s*([\d,]+(?:\.\d+)?)")

def _content_toks(s):
    return [t for t in re.findall(r"[a-z][a-z-]*", s.lower()) if t not in _STOP]

def _head_noun(text, start, end):
    """Referent head for a number span: nearest content noun after (skip units/of) or before."""
    after = text[end:end+60]; before = text[max(0,start-60):start]
    toks_a = re.findall(r"[a-z%][a-z-]*", after.lower())
    skip = {"of", "and", "or", "a", "an", "the"} | _UNITS
    for t in toks_a[:3]:
        if t in skip: continue
        return t
    toks_b = re.findall(r"[a-z][a-z-]*", before.lower())
    for t in reversed(toks_b[-3:]):
        if t in {"of","through","thru","to","and","or","a","an","the"}: continue
        return t
    return None

def _key_referents(key_text):
    """Strong non-ordinal key numbers with content-noun heads; plus range-implied counts."""
    out = {}
    for v, knd, st, a, b in num_values(key_text):
        if st != "strong" or knd == "ord": continue
        h = _head_noun(key_text, a, b)
        if h and h not in _UNITS:
            out.setdefault(h, set()).add(v)
    for m in re.finditer(r"(\d+)\s*(?:through|thru|to|--)\s*(\d+)", key_text):
        lo, hi = int(m.group(1)), int(m.group(2))
        if 0 < hi - lo + 1 <= 50:
            out.setdefault("_range", set()).add(F(hi - lo + 1))
    return out

def _computed_results(text):
    return {F(m.group(1).replace(",", "")) for m in _COMPUTED_RE.finditer(text)}

def _hyphen_demoted(text, parsed):
    """Demote to weak any number that is part of an attributive hyphenated compound (two-opportunity, 2-minute)."""
    out = []
    for v, knd, st, a, b in parsed:
        if st == "strong" and b < len(text) and text[b:b+1] == "-" and re.match(r"[a-zA-Z]", text[b+1:b+2] or ""):
            out.append((v, knd, "weak", a, b))
        else:
            out.append((v, knd, st, a, b))
    return out
# ===== end builder v1.3.1 helpers =====

def reconcile(it):
    out = []; iid = it["id"]; opts = it["options"]; k = it["answer"]
    ie = (it.get("explanation") or "").strip(); ke = (opts[k].get("explanation") or "").strip()
    anchors = [{"field": "explanation", "quote": ie[:120]}] if ie else []
    cls, refs = divergence_class(ie, ke, it.get("citation") or "")
    if cls != "identical":
        ratio = difflib.SequenceMatcher(None, ie, ke).ratio()
        kanch = [{"field": f"options[{k}].explanation", "quote": ke[:120]}] if ke else []
        if cls == "format_only":
            r = row(iid, "key_explanation_divergence", "low",
                f"item and keyed option {k} explanations differ only in format (case/space/punctuation/number form); sync the texts", k,
                "editor_sync_explanations", anchors=anchors + kanch)
        elif cls == "crossref_only":
            src_field = "explanation" if any(x in ie for x in refs) else f"options[{k}].explanation"
            r = row(iid, "key_explanation_divergence", "low",
                f"the only difference is a cross-reference {refs}, and its sections are in the citation; sync the texts", k,
                "editor_sync_explanations", anchors=[{"field": src_field, "quote": refs[0]}] + kanch)
        elif cls == "crossref_not_in_citation":
            src_field = "explanation" if any(x in ie for x in refs) else f"options[{k}].explanation"
            r = row(iid, "key_explanation_divergence", "high",
                f"the only difference is a cross-reference {refs} naming a section the citation field does not list", k,
                "sme_verify_citation", anchors=[{"field": src_field, "quote": refs[0]}, {"field": "citation", "quote": (it.get("citation") or "")[:120]}] if it.get("citation") else [{"field": src_field, "quote": refs[0]}])
        else:
            r = row(iid, "key_explanation_divergence", "high",
                f"item explanation and keyed option {k} explanation differ in wording (similarity {ratio:.2f}); model/SME applies 5.1 (a0) same conclusion -> low, (a) different conclusion -> high",
                k, "sme_reconcile_key_explanation", anchors=anchors + kanch)
        r["divergence_class"] = cls
        out.append(r)
    ew = set(words(ie))
    ov = [len(ew & set(words(o["text"]))) for o in opts]
    best_d = max((ov[i], i) for i in range(len(opts)) if i != k)
    if best_d[0] >= 3 and best_d[0] >= ov[k] + 2:   # margin 2: explanations legitimately reuse a distractor's words to rebut it (pilot 2025)
        out.append(row(iid, "key_explanation_divergence", "high",
            f"item explanation shares {best_d[0]} content words with option {best_d[1]} but {ov[k]} with the key; it may justify a distractor",
            best_d[1], "sme_reconcile_key_explanation", anchors=anchors))
    # [P5.1 builder draft] referent-aware numbers, AFTER normalisation.
    # (c) fires only when an explanation number shares the key number's referent
    # head noun and disagrees, or an explicit computation result disagrees.
    k_refs = _key_referents(opts[k]["text"])
    k_all = _vals(_hyphen_demoted(opts[k]["text"], num_values(opts[k]["text"])))
    k_vals = set().union(*k_refs.values()) if k_refs else set()
    if k_vals:
        E = _hyphen_demoted(ie, num_values(ie))
        bad = set()
        for v, knd, st, a, b in E:
            if st != "strong": continue
            h = _head_noun(ie, a, b)
            if h and h in k_refs and v not in k_refs[h]:
                bad.add(v)
        for r in _computed_results(ie):
            if r not in k_vals:
                bad.add(r)
        if bad:
            out.append(row(iid, "key_explanation_divergence", "blocker",
                f"key states {sorted(_fmt(v) for v in k_vals)} but the explanation states/computes {sorted(_fmt(v) for v in bad)} for the same referent (after normalisation)",
                k, "pull_and_sme_rewrite", anchors=anchors))
        last = re.split(r"(?<=[.!?])\s+", ie)[-1] if ie else ""
        Lv = _hyphen_demoted(last, num_values(last)); l_typed = _typed(Lv); l_all = _vals(Lv)
        hit = [] if _ATTR_RE.search(last) else [i for i, o in enumerate(opts) if i != k and (_typed(num_values(o["text"])) & l_typed) and not (k_all & l_all)]
        if hit:
            out.append(row(iid, "key_explanation_divergence", "blocker",
                f"explanation's final sentence gives a number matching option(s) {hit}, not the key (after normalisation)", hit[0], "pull_and_sme_rewrite", anchors=anchors))
    for i, o in enumerate(opts):
        if i != k and SELF_KEY.search(o.get("explanation") or "") and not CONTRAST_V2.search(o.get("explanation") or ""):
            out.append(row(iid, "key_explanation_divergence", "high", f"distractor {i}'s explanation calls it correct", i,
                "sme_reconcile_key_explanation", anchors=[{"field": f"options[{i}].explanation", "quote": (o.get('explanation') or '')[:120]}]))
    return out

def screen_item(it):
    out = []; iid = it["id"]; opts = it["options"]; k = it["answer"]
    if not (0 <= k < len(opts)):
        return [row(iid, "keyed_answer_invalid", "blocker", f"answer index {k} out of range", None, "pull_and_sme_rewrite")]
    if len(opts) != 4:
        out.append(row(iid, "schema_option_count", "high", f"{len(opts)} options (expected 4)", None, "editor_fix"))
    for i, o in enumerate(opts):
        meta = [o.get(f) for f in ("why_tempting", "misconception_tag", "confuses_with", "remediation_pointer")]
        if i == k and any(m not in (None, "", "None") for m in meta):
            out.append(row(iid, "role_metadata_on_key", "high", "keyed option carries distractor metadata", i, "sme_retag"))
        if i != k and any(m in (None, "", "None") for m in meta):
            out.append(row(iid, "distractor_metadata_missing", "high", "distractor missing why_tempting/tag/confuses_with/remediation", i, "sme_retag"))
        wt = o.get("why_tempting") or ""
        why = why_tempting_conflict(wt) if i != k else None
        if why:
            out.append(row(iid, "why_tempting_role_conflict_candidate", "high", f"why_tempting: {why}", i, "model_then_human",
                           scope="option_tag", anchors=[{"field": f"options[{i}].why_tempting", "quote": wt}]))
    out += reconcile(it)                                                     # [P4]
    L = [len(o["text"]) for o in opts]; d = [L[i] for i in range(len(L)) if i != k]
    if L[k] > 1.25 * max(d):
        out.append(row(iid, "cue_key_longest", "low", f"key {L[k]} chars vs longest distractor {max(d)}", k, "editor_fix"))
    stem = set(words(it["body"]))
    ov = [len(stem & set(words(o["text"]))) for o in opts]
    if ov[k] >= 2 and ov[k] > max(ov[i] for i in range(len(ov)) if i != k):
        out.append(row(iid, "cue_key_echoes_stem", "low", f"key shares {ov[k]} content words with stem, best distractor {max(ov[i] for i in range(len(ov)) if i!=k)}", k, "editor_fix"))
    abs_hits = [i for i, o in enumerate(opts) if ABSOLUTE.search(o["text"])]
    if abs_hits and k not in abs_hits:
        out.append(row(iid, "cue_absolute_terms_in_distractors", "low", "absolute terms only in distractors: " + "; ".join(f"[{i}] {ABSOLUTE.search(opts[i]['text']).group(0)}" for i in abs_hits), None, "editor_fix"))
    fw = [o["text"].split()[0].lower() for o in opts]
    dfw = {fw[i] for i in range(len(fw)) if i != k}
    if len(dfw) == 1 and fw[k] not in dfw:
        out.append(row(iid, "cue_key_breaks_parallel_form", "low", f"all distractors start \"{dfw.pop()}\", key starts \"{fw[k]}\"", k, "editor_fix"))
    ptr = defaultdict(set)
    for o in opts:
        if o.get("remediation_pointer"): ptr[o["remediation_pointer"]].add(o.get("misconception_tag"))
    for p, tags in ptr.items():
        if len(tags) > 1:
            out.append(row(iid, "remediation_pointer_generic", "low", f"pointer \"{p}\" serves {len(tags)} different tags: {sorted(tags)}", None, "sme_retag"))
    tc = Counter(o.get("misconception_tag") for i, o in enumerate(opts) if i != k)
    for t, c in tc.items():
        if t and c >= 2:
            out.append(row(iid, "tag_repeated_across_distractors", "low", f"tag {t} on {c} distractors; wrong answers cannot be told apart", None, "sme_retag"))
    cit = it.get("citation") or ""
    for m in re.finditer(r"Ch\.\s*(\d+)\s*\(([^)]+)\)", cit):                 # [P2]
        n, title = int(m.group(1)), m.group(2)
        other = chapter_mismatch(n, title)
        if other:
            out.append(row(iid, "citation_chapter_title_mismatch", "low",
                f"Ch. {n} titled \"{title}\" reads like chapter(s) {other}", None, "sme_verify_citation",
                anchors=[{"field": "citation", "quote": m.group(0)}]))
    if re.search(r"Section \d+\.\d+,\s*\d", cit):
        out.append(row(iid, "citation_format", "low", "\"Section\" with several section numbers (should be \"Sections\")", None, "editor_fix"))
    if not cit.strip():
        out.append(row(iid, "citation_missing", "high", "no citation", None, "sme_verify_citation"))
    return out

def tfidf_pairs(items, thresh=0.35):
    docs = [words(it["body"]) for it in items]; N = len(docs)
    dfc = Counter(w for d in docs for w in set(d))
    vec = []
    for d in docs:
        tf = Counter(d); v = {w: (c / len(d)) * math.log((1 + N) / (1 + dfc[w])) for w, c in tf.items()} if d else {}
        n = math.sqrt(sum(x * x for x in v.values())) or 1; vec.append({w: x / n for w, x in v.items()})
    out = []
    for i, j in itertools.combinations(range(N), 2):
        s = sum(vec[i][w] * vec[j].get(w, 0) for w in vec[i])
        if s >= thresh:
            out.append((items[i]["id"], items[j]["id"], round(s, 3)))
    return out

def bank_level(items):
    """Bank-level report (stderr). The supervisor cue is a STRATIFIED-INVESTIGATION candidate, never a defect by itself:
    report it per track x question_type x outline area so an SME can see where the imbalance lives."""
    pos = Counter(it["answer"] for it in items)
    sup = re.compile(r"\b(supervisor|bcba)\b", re.I)
    strata = defaultdict(lambda: [0, 0, 0, 0])   # keys_sup, keys, distractors_sup, distractors
    for it in items:
        s = (it.get("track"), it.get("question_type"), (it.get("outline_tag") or "?")[:1])
        for i, o in enumerate(it["options"]):
            if i == it["answer"]:
                strata[s][1] += 1; strata[s][0] += bool(sup.search(o["text"]))
            else:
                strata[s][3] += 1; strata[s][2] += bool(sup.search(o["text"]))
    k_sup = sum(v[0] for v in strata.values()); d_sup = sum(v[2] for v in strata.values())
    keylong = sum(1 for it in items if len(it["options"][it["answer"]]["text"]) == max(len(o["text"]) for o in it["options"]))
    return {"answer_position_counts": dict(sorted(pos.items())), "keys_mentioning_supervisor_or_bcba": k_sup,
            "distractors_mentioning_supervisor_or_bcba": d_sup, "items_where_key_is_longest": keylong, "n_items": len(items),
            "supervisor_cue_by_stratum": {"|".join(map(str, s)): {"keys": f"{v[0]}/{v[1]}", "distractors": f"{v[2]}/{v[3]}"}
                                          for s, v in sorted(strata.items(), key=lambda kv: str(kv[0]))},
            "cue_asymmetry_by_track": {f: v.get("track", {}) for f, v in cue_asymmetry(items).items()}}


# ---------------------------------------------------------------- [P7] cue asymmetry (generic, per track / stratum)
CUE_FAMILIES = {
    "supervisor": r"\b(?:supervisor|supervisors|bcba)\b",
    "consult_refer_collaborate": r"\b(?:consult\w*|refer|refers|referral|referring|collaborat\w*|seek(?:ing)?\s+(?:supervision|consultation|guidance))\b",
    "more_data": r"\b(?:more\s+data|additional\s+data|collect(?:ing)?\s+(?:more\s+|additional\s+)?data|continu\w*\s+(?:to\s+)?collect\w*|gather\w*\s+(?:more\s+)?(?:data|information)|wait\w*\s+(?:for|until)\s+(?:more|additional))\b",
    "notify_report": r"\b(?:tell|tells|inform|informs|notify|notifies|report(?:s|ing)?\s+(?:it\s+|this\s+)?to|let\s+\w+(?:\s+\w+)?\s+know)\b",
    "absolute": ABSOLUTE.pattern,
}

def _binom_tail(k, n, p, lower):
    """One-sided exact binomial tail P(X<=k) or P(X>=k); reported for the SME, not a gate."""
    if n == 0: return 1.0
    rng = range(0, k + 1) if lower else range(k, n + 1)
    return min(1.0, sum(math.comb(n, i) * p ** i * (1 - p) ** (n - i) for i in rng))

def cue_stat(k_hit, k_n, d_hit, d_n, min_count, hi=2.0, lo=0.5, watch_hi=1.5, watch_lo=0.67, n_opts=4):
    kr = k_hit / k_n if k_n else 0.0; dr = d_hit / d_n if d_n else 0.0
    ratio = (kr / dr) if dr else (math.inf if kr else None)
    hits = k_hit + d_hit
    p_key = k_hit / hits if hits else None
    base = 1 / n_opts
    if hits < min_count or ratio is None:
        status = "below_min_count" if hits < min_count else "no_hits"
    elif ratio >= hi:
        status = "flag_key_cue"          # "pick the option with this phrase" beats the item
    elif ratio <= lo:
        status = "flag_distractor_cue"   # "never pick the option with this phrase" beats the item
    elif ratio >= watch_hi or ratio <= watch_lo:
        status = "watch"
    else:
        status = "ok"
    tail = _binom_tail(k_hit, hits, base, lower=(p_key is not None and p_key < base)) if hits else None
    return {"keys": f"{k_hit}/{k_n}", "distractors": f"{d_hit}/{d_n}", "key_rate": round(kr, 4), "distractor_rate": round(dr, 4),
            "ratio": (None if ratio is None else ("inf" if ratio == math.inf else round(ratio, 3))),
            "p_key_given_cue": None if p_key is None else round(p_key, 3), "baseline": base,
            "binom_one_sided_p": None if tail is None else round(tail, 4), "hits": hits, "status": status}

def cue_asymmetry(items, families=None, min_count=20, stratum_min=8):
    """Per family: per track and per track x question_type x outline area. A report for the SME, never a row."""
    fam = {n: re.compile(p, re.I) for n, p in (families or CUE_FAMILIES).items()}
    agg = defaultdict(lambda: [0, 0, 0, 0])   # (family, level_key) -> k_hit, k_n, d_hit, d_n
    for it in items:
        tr = it.get("track") or "?"
        st = f"{tr}|{it.get('question_type')}|{(it.get('outline_tag') or '?')[:1]}"
        for i, o in enumerate(it["options"]):
            key = i == it["answer"]
            for n, rx in fam.items():
                hit = bool(rx.search(o.get("text") or ""))
                for lvl in (("track", tr), ("stratum", st)):
                    a = agg[(n, lvl)]
                    if key: a[0] += hit; a[1] += 1
                    else: a[2] += hit; a[3] += 1
    rep = {}
    for (n, (lvl, name)), (kh, kn, dh, dn) in sorted(agg.items(), key=lambda x: (x[0][0], x[0][1])):
        s = cue_stat(kh, kn, dh, dn, min_count if lvl == "track" else stratum_min)
        if lvl == "stratum" and s["hits"] == 0: continue
        rep.setdefault(n, {}).setdefault(lvl, {})[name] = s
    return rep

# ---------------------------------------------------------------- [P1] verbatim-anchor verifier
def resolve(item, path):
    m = re.fullmatch(r"options\[(\d+)\]\.(\w+)", path)
    if m:
        i = int(m.group(1))
        return None if i >= len(item["options"]) else item["options"][i].get(m.group(2))
    v = item.get(path)
    return None if v is None else str(v)

def verify(bank_items, flags, inventory_text=None):
    by = {it["id"]: it for it in bank_items}; results = []
    for n, f in enumerate(flags):
        problems = []; quotes = []
        anchors = f.get("anchors") or []
        if not anchors:
            problems.append("no anchors")
        for a in anchors + (f.get("related_anchors") or []):
            q = a.get("quote")
            if not q:
                problems.append(f"empty quote in {a}"); continue
            quotes.append(q)
            if a.get("source") == "tag-inventory.csv":
                if inventory_text is None or q not in inventory_text:
                    problems.append(f"inventory quote not found: {q!r}")
                continue
            iid = a.get("item_id", f["item_id"])
            item = by.get(iid)
            if item is None:
                problems.append(f"item {iid} not in bank"); continue
            val = resolve(item, a.get("field", ""))
            if val is None:
                problems.append(f"item {iid} field {a.get('field')!r} missing/null")
            elif q not in val:
                problems.append(f"NOT VERBATIM item {iid} {a['field']}: {q!r}")
        for span in re.findall(r'"([^"]+)"', f.get("rationale", "")):
            if not any(span in q for q in quotes):
                problems.append(f"rationale quotes text no anchor carries: {span!r}")
        results.append({"row": n, "item_id": f["item_id"], "flag": f["flag"], "anchors": len(anchors),
                        "related_anchors": len(f.get("related_anchors") or []), "rationale_quotes": len(re.findall(r'"([^"]+)"', f.get("rationale", ""))),
                        "ok": not problems, "problems": problems})
    return results

# ---------------------------------------------------------------- fixtures
EXACT_44_46_93 = {44: {'answer': 0, 'options': ['Behave with integrity', 'Treat others with compassion, dignity, and respect', 'Benefit others', 'Ensure their own competence'], 'explanation': 'Recording data for trials that never happened is dishonest. Behaving with integrity covers being truthful and accurate in what you document (see also Section 3.02).', 'key_explanation': 'Recording data for trials that never happened is dishonest. Behaving with integrity covers being truthful and accurate in what you document.', 'citation_excerpt': 'Sections 1.01, 2.02, 3.02'}, 46: {'answer': 0, 'options': ['Explain that you cannot provide behavior-technician services until a qualified supervisor is in place, and ask the company to assign one', 'Keep working, since it is only for a week', "Ask a teacher at the client's school to supervise you", 'Keep working, but save your data to give to the new supervisor later'], 'explanation': 'RBTs may provide behavior-technician services only under close, ongoing supervision from a supervisor who meets BACB requirements. With no qualified supervisor on record, services pause until one is assigned.', 'key_explanation': 'RBTs may only provide services under close, ongoing supervision from a supervisor who meets BACB requirements. Without one, they should not provide behavior-technician services.', 'citation_excerpt': 'Section 1.03'}, 93: {'answer': 0, 'options': ['Treat others with compassion, dignity, and respect', 'Benefit others', 'Ensure their own competence', 'Behave with integrity'], 'explanation': "Mocking a client's behavior is disrespectful and undermines the client's dignity, which is the core of this principle (see also Sections 1.08 and 2.03).", 'key_explanation': "Mocking a client's behavior is disrespectful and undermines the client's dignity, which is the core of this principle.", 'citation_excerpt': 'Sections 1.02, 1.08, 2.03'}}

def _exact_item(iid):
    e = EXACT_44_46_93[iid]
    opts = [{"text": t, "explanation": (e["key_explanation"] if i == e["answer"] else "")} for i, t in enumerate(e["options"])]
    return {"id": iid, "track": "rbt", "answer": e["answer"], "options": opts, "explanation": e["explanation"], "citation": e["citation_excerpt"]}

def _synthetic_cue_bank(track, k_hit, d_hit, n_items=500, phrase="tell your supervisor"):
    items = []; dleft = d_hit
    for n in range(n_items):
        opts = [{"text": "Follow the written plan"}, {"text": "Do something else"}, {"text": "Another option"}, {"text": "A fourth option"}]
        if n < k_hit: opts[0]["text"] += " and " + phrase
        for j in (1, 2, 3):
            if dleft > 0 and (n * 3 + j) % 3 == j % 3 and dleft > 0:
                opts[j]["text"] += " and " + phrase; dleft -= 1; break
        items.append({"id": n, "track": track, "question_type": "judgment", "outline_tag": "E.1", "answer": 0, "options": opts})
    return items

def fixtures(exact_path=None):
    res = []
    def check(name, got, want):
        res.append((name, got == want, got, want))
    # [P2] chapter map
    check("P2a Ch.5 book title not flagged", chapter_mismatch(5, "Improving and Assessing the Quality of Behavioral Measurement"), None)
    check("P2b Ch.5 short title not flagged", chapter_mismatch(5, "Quality of Measurement"), None)
    check("P2c Ch.5 interobserver wording not flagged", chapter_mismatch(5, "Interobserver Agreement"), None)
    check("P2d Ch.5 titled Extinction IS flagged", chapter_mismatch(5, "Extinction"), [24])
    check("P2e Ch.9 pilot title not flagged", chapter_mismatch(9, "Multiple Baseline and Changing Criterion Designs"), None)
    check("P2f unknown/odd title with no evidence not flagged", chapter_mismatch(10, "Overview"), None)
    # [P3] why_tempting: valid contrast prose must pass, real conflicts must fire
    ok = ["Restarting a timer after spitting is correct in a resetting DRO. But this plan explicitly uses nonresetting intervals with unchanged boundaries.",
          "The sticker has a stated 2-token value. That value is its cost, however, so it reduces the balance rather than adding to it.",
          "Seven correctly includes the starting balance and new earnings. Only 5 remain once the 2 spent tokens are removed, although 7 were earned.",
          "Pausing feels kind. Here the plan says to keep going while you contact the supervisor.",
          "Absence at the end matters in momentary DRO, whereas this whole-interval rule also counts the earlier spitting.",
          "Repeating sounds like a mild prompt, yet it is not in the hierarchy."]
    for i, s in enumerate(ok):
        check(f"P3 ok[{i}] contrastive why_tempting passes", why_tempting_conflict(s), None)
    check("P3 bad[0] unqualified correctness fires", why_tempting_conflict("This is the correct response because it follows the plan."), "unqualified correctness claim with no contrast after it")
    check("P3 bad[1] pure endorsement fires", why_tempting_conflict("Giving attention calms the client quickly and keeps everyone safe."), "no contrast at all")
    # [P4] reconciliation, synthetic
    base = {"id": "fx1", "body": "A client starts with 4 tokens, earns 3 and spends 2. What balance carries forward?", "answer": 0, "citation": "x",
            "options": [{"text": "Carry 5 tokens", "explanation": "4 + 3 - 2 leaves 5."}, {"text": "Carry 7 tokens", "explanation": "e"},
                        {"text": "Carry 0 tokens", "explanation": "e"}, {"text": "Carry 9 tokens", "explanation": "e"}]}
    same = dict(base, explanation="4 + 3 - 2 leaves 5.")
    check("P4a consistent explanation: no divergence", [r["flag"] for r in reconcile(same)], [])
    wrongnum = dict(base, explanation="4 + 3 leaves 7.")
    check("P4b explanation number matches a distractor: blocker", any(r["severity"] == "blocker" for r in reconcile(wrongnum)), True)
    drift = dict(base, explanation="Keep the balance and tell the supervisor.")
    check("P4c item explanation differs from key explanation: candidate", any(r["flag"] == "key_explanation_divergence" for r in reconcile(drift)), True)

    # [P5] number normaliser units
    V = lambda s: sorted(_fmt(v) + ("%" if k == "pct" else "th" if k == "ord" else "") + ("~" if st == "weak" else "") for v, k, st, *_ in num_values(s))
    check("P5u01 zero..twenty words", V("zero, seven, twelve and twenty"), sorted(["0", "7", "12", "20"]))
    check("P5u02 hyphenated tens", V("twenty-five trials"), ["25"])
    check("P5u03 spaced tens", V("forty two intervals"), ["42"])
    check("P5u04 hundred with and", V("one hundred and twenty responses"), ["120"])
    check("P5u05 a hundred", V("a hundred trials"), ["100"])
    check("P5u06 'a' alone is not a number", V("a client earned a token"), [])
    check("P5u07 bare 'one' is weak", V("the one who runs the session"), ["1~"])
    check("P5u08 ordinals word and digit agree", (V("the first trial"), V("the 1st trial")), (["1th"], ["1th"]))
    check("P5u09 compound ordinal", V("the twenty-first session"), ["21th"])
    check("P5u10 'second' is weak (time unit)", V("wait a second"), ["2th~"])
    check("P5u11 percent forms agree", (V("forty percent"), V("40%"), V("40 percent"), V("forty-percent"), V("40 per cent")), (["40%"],) * 5)
    check("P5u12 half / a half / one half", (V("half of the trials"), V("a half"), V("one half")), (["0.5"],) * 3)
    check("P5u13 half-hour is weak", V("a half-hour session"), ["0.5~"])
    check("P5u14 a third of / one third / two thirds", (V("a third of sessions"), V("one third"), V("two thirds")), (["1/3"], ["1/3"], ["2/3"]))
    check("P5u15 'a third' not followed by 'of' is a weak ordinal", V("a third trial"), ["3th~"])
    check("P5u16 digit fraction keeps both numbers, value weak", V("1/2 of trials"), sorted(["1", "2", "0.5~"]))
    check("P5u17 X and a half", V("two and a half minutes"), ["2.5"])
    check("P5u18 punctuation breaks a compound", V("She earned twenty. Five were spent."), sorted(["20", "5"]))
    check("P5u19 decimals and commas", V("0.5 and 1,000"), sorted(["0.5", "1000"]))

    # [P5] item 1638 class (explanation sentence verbatim from Instinct's mail; key text RECONSTRUCTED, not supplied)
    s1638 = "Three call-outs is within her limit of 4"
    v12_digits = lambda s: set(re.findall(r"\b\d+(?:\.\d+)?\b", s))
    key1638 = "No action yet: 3 call-outs is within the limit"
    check("P5r1638-v12 v1.2 digit-only logic reproduces the false positive", (v12_digits(s1638), bool(v12_digits(key1638)) and not (v12_digits(key1638) & v12_digits(s1638))), ({"4"}, True))
    it1638 = {"id": 1638, "answer": 0, "explanation": s1638 + ".", "citation": "x",
              "options": [{"text": key1638, "explanation": s1638 + "."}, {"text": "Issue a written warning now", "explanation": "e"},
                          {"text": "Remove her from the schedule", "explanation": "e"}, {"text": "Report 5 call-outs to HR", "explanation": "e"}]}
    check("P5r1638 regression: word-form vs digit gives no row", [r["severity"] for r in reconcile(it1638)], [])
    mirror = dict(it1638, explanation="3 call-outs is within her limit of 4.", options=[dict(it1638["options"][0], text="No action yet: three call-outs is within the limit", explanation="3 call-outs is within her limit of 4.")] + it1638["options"][1:])
    check("P5r1638m mirror (word key, digit explanation): no row", [r["severity"] for r in reconcile(mirror)], [])
    tp = dict(it1638, explanation="Five call-outs exceeds her limit of 4.", options=[dict(it1638["options"][0], explanation="Five call-outs exceeds her limit of 4.")] + it1638["options"][1:])
    check("P5t1 true numeric divergence in word form still blocks", any(r["severity"] == "blocker" for r in reconcile(tp)), True)
    wk = dict(base, explanation="4 + 3 leaves 7.", options=[dict(base["options"][0], text="Carry five tokens", explanation="4 + 3 leaves 7.")] + base["options"][1:])
    check("P5t2 word-number key is now checked (new reach)", any(r["severity"] == "blocker" for r in reconcile(wk)), True)
    pct = dict(base, explanation="Forty percent of intervals met the criterion.", options=[{"text": "40% of intervals", "explanation": "Forty percent of intervals met the criterion."}, {"text": "60% of intervals", "explanation": "e"}, {"text": "4 intervals", "explanation": "e"}, {"text": "10 intervals", "explanation": "e"}])
    check("P5t3 forty percent == 40%: no row", [r["severity"] for r in reconcile(pct)], [])
    frac = dict(base, explanation="One third of sessions met criterion.", options=[{"text": "About a third of sessions", "explanation": "One third of sessions met criterion."}, {"text": "Two sessions", "explanation": "e"}, {"text": "All 9 sessions", "explanation": "e"}, {"text": "No sessions", "explanation": "e"}])
    check("P5t4 a third == one third: no row", [r["severity"] for r in reconcile(frac)], [])
    ordi = dict(base, explanation="Prompt on the first trial.", options=[{"text": "On the 1st trial", "explanation": "Prompt on the first trial."}, {"text": "On the 3rd trial", "explanation": "e"}, {"text": "After 5 errors", "explanation": "e"}, {"text": "Never", "explanation": "e"}])
    check("P5t5 first == 1st: no row", [r["severity"] for r in reconcile(ordi)], [])
    weak = dict(base, explanation="5 remain. Pick the one that matches the plan.", options=[{"text": "Carry 5 tokens", "explanation": "5 remain. Pick the one that matches the plan."}, {"text": "Carry 1 token", "explanation": "e"}, {"text": "Carry 2 tokens", "explanation": "e"}, {"text": "Carry 9 tokens", "explanation": "e"}])
    check("P5t6 weak 'one' in the final sentence cannot raise a distractor-match blocker", [r["severity"] for r in reconcile(weak)], [])

    # [P6] format-equivalence cap: pure format differences never reach blocker
    pairs = [("Three call-outs is within her limit of 4.", "3 call-outs is within her limit of four."),
             ("Forty percent met criterion.", "40% met criterion"),
             ("It\u2019s the first trial \u2013 prompt now.", "It's the 1st trial - prompt now."),
             ("Keep  the plan.\nRecord it.", "keep the plan. record it.")]
    for n, (a, b) in enumerate(pairs):
        it = {"id": f"fmt{n}", "answer": 0, "explanation": a, "citation": "",
              "options": [{"text": "Follow the plan", "explanation": b}, {"text": "x", "explanation": ""}, {"text": "y", "explanation": ""}, {"text": "z", "explanation": ""}]}
        rows = reconcile(it)
        check(f"P6f{n} format-only pair -> one LOW format_only row, no blocker", [(r["severity"], r.get("divergence_class")) for r in rows], [("low", "format_only")])

    # [P6] items 44, 46, 93: exact live texts (builder, 2026-10-26)
    recall = 0
    for iid, want_cls, want_sev in ((44, "crossref_only", "low"), (46, "text", "high"), (93, "crossref_only", "low")):
        it = _exact_item(iid); rows = reconcile(it)
        div = [r for r in rows if r["flag"] == "key_explanation_divergence"]
        recall += bool(div)
        check(f"P6x{iid} exact text -> {want_cls}/{want_sev}, no blocker", [(r["severity"], r.get("divergence_class")) for r in div], [(want_sev, want_cls)])
        vr = verify([it], rows)
        check(f"P6v{iid} its anchors verify byte-exact", all(r["ok"] for r in vr), True)
    check("P6 recall floor on 44/46/93 (>=1 row each)", recall, 3)
    bad44 = dict(_exact_item(44), citation="Section 1.01")
    check("P6c cross-reference to a section the citation lacks -> HIGH citation route", [(r["severity"], r.get("divergence_class"), r["route"]) for r in reconcile(bad44) if r["flag"] == "key_explanation_divergence"], [("high", "crossref_not_in_citation", "sme_verify_citation")])

    # [P7] cue asymmetry
    rbt = cue_asymmetry(_synthetic_cue_bank("rbt", 120, 44))["supervisor"]["track"]["rbt"]
    check("P7a RBT 120/500 vs 44/1500 -> flag_key_cue, ratio 8.182, P(key|cue) 0.732", (rbt["keys"], rbt["distractors"], rbt["ratio"], rbt["p_key_given_cue"], rbt["status"]), ("120/500", "44/1500", 8.182, 0.732, "flag_key_cue"))
    bc = cue_asymmetry(_synthetic_cue_bank("bcba", 6, 35))["supervisor"]["track"]["bcba"]
    check("P7b BCBA 6/500 vs 35/1500 -> ratio 0.514, P(key|cue) 0.146, watch (not flag)", (bc["keys"], bc["distractors"], bc["ratio"], bc["p_key_given_cue"], bc["status"]), ("6/500", "35/1500", 0.514, 0.146, "watch"))
    small = cue_stat(3, 3, 0, 9, min_count=8)
    check("P7c 3 keys vs 0 distractors is below the min count", small["status"], "below_min_count")
    bal = cue_stat(30, 500, 90, 1500, min_count=20)
    check("P7d balanced 6% vs 6% -> ok", (bal["ratio"], bal["status"]), (1.0, "ok"))
    rev = cue_stat(5, 500, 60, 1500, min_count=20)
    check("P7e reverse cue 1% vs 4% -> flag_distractor_cue", rev["status"], "flag_distractor_cue")

    for name, ok_, got, want in res:
        print(json.dumps({"fixture": name, "pass": ok_, "got": got, "want": want}, ensure_ascii=False, default=str))
    if exact_path:
        raw = open(exact_path, "rb").read()
        strings = [s for e in EXACT_44_46_93.values() for s in [e["explanation"], e["key_explanation"], e["citation_excerpt"]] + e["options"]]
        miss = [s for s in strings if s.encode() not in raw]
        print(json.dumps({"fixture": "embedded 44/46/93 strings are byte-exact in the builder's file", "pass": not miss, "checked": len(strings), "missing": miss}))
        res.append(("exact-file", not miss, None, None))
    passed = sum(1 for r in res if r[1]); print(f"fixtures: {passed}/{len(res)} passed", file=sys.stderr)
    return passed == len(res)

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "screen"
    if cmd == "fixtures":
        sys.exit(0 if fixtures(sys.argv[sys.argv.index("--exact-texts") + 1] if "--exact-texts" in sys.argv else None) else 1)
    if cmd == "numbers":
        for v, k, st, a, b in num_values(sys.argv[2]):
            print(json.dumps({"value": _fmt(v), "kind": k, "strength": st, "span": sys.argv[2][a:b]}))
        sys.exit(0)
    bank = json.load(open(sys.argv[2])); items = bank["items"] if isinstance(bank, dict) else bank
    if cmd == "cues":
        mc = int(sys.argv[sys.argv.index("--min-count") + 1]) if "--min-count" in sys.argv else 20
        sm = int(sys.argv[sys.argv.index("--stratum-min") + 1]) if "--stratum-min" in sys.argv else 8
        print(json.dumps(cue_asymmetry(items, min_count=mc, stratum_min=sm), indent=1)); sys.exit(0)
    if cmd == "verify":
        flags = [json.loads(l) for l in open(sys.argv[3]) if l.strip()]
        inv = open(sys.argv[sys.argv.index("--inventory") + 1]).read() if "--inventory" in sys.argv else None
        res = verify(items, flags, inv)
        for r in res: print(json.dumps(r, ensure_ascii=False))
        ok = sum(r["ok"] for r in res)
        nq = sum(r["anchors"] + r["related_anchors"] for r in res)
        print(f"verbatim check: {ok}/{len(res)} rows pass; {nq} anchors checked byte-exact", file=sys.stderr)
        sys.exit(0 if ok == len(res) else 1)
    for it in items:
        for r in screen_item(it): print(json.dumps(r, ensure_ascii=False))
    for a, b, s in tfidf_pairs(items):
        print(json.dumps(row(a, "near_duplicate_stem_candidate", "high", f"stem TF-IDF cosine {s} with item {b}", None, "dedupe_review"), ensure_ascii=False))
    print(json.dumps(bank_level(items)), file=sys.stderr)
