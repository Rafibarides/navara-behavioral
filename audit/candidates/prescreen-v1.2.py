#!/usr/bin/env python3
"""Pathways content-audit rubric v1.2 -- script stage (S) + verbatim-anchor verifier. PROPOSED, uncertified.

Usage:
  python3 prescreen-v1.2.py screen  bank.json            > script-flags.jsonl   # candidate rows (stage S)
  python3 prescreen-v1.2.py verify  bank.json flags.jsonl [--inventory tag-inventory.csv]
  python3 prescreen-v1.2.py fixtures                                            # built-in regression fixtures

bank.json: {"items":[...]} in the published Pathways item schema. No network calls, no spend.
Every screen row is a CANDIDATE for model/human review, never a verdict.

Changes vs prescreen v1 (rubric-v1.2.md section 7):
  [P1] verify: every flag row must carry anchors [{field, quote}] whose quote is a BYTE-EXACT substring of that field of
       that item (no case, whitespace or quote-mark normalisation: the pilot's curly-apostrophe miss is exactly what this
       catches). Cross-item text goes in related_anchors with its own item_id. Every "..." span in a rationale must be a
       substring of one of the row's anchor quotes. Proposed rewrites live in suggested_fix, never in quote marks.
  [P2] citation chapter check: the v1 map required one exact keyword per chapter ("quality of measurement" for Cooper,
       Heron & Heward 3rd ed. Ch. 5), so the book's own title wording ("...Quality of Behavioral Measurement") was flagged.
       v1.2 matches on distinctive tokens and fires only on POSITIVE evidence of a different chapter (the title shares no
       distinctive token with its own chapter and does share one with another). Severity lowered to low (registry check).
  [P3] why_tempting: v1 flagged any field without "but/however/yet/that would/that does not", and any "is correct",
       even when conditional ("is correct in a resetting DRO. But this plan..."). v1.2 recognises a wider contrast
       lexicon and conditional correctness, and fires only when there is no contrast at all, or an UNQUALIFIED
       correctness claim that nothing afterwards contrasts.
  [P4] key/explanation reconciliation (new criterion key_explanation_divergence): item explanation vs keyed option
       explanation, explanation pointing at a distractor more than at the key, numeric results that the key does not
       carry, and distractor explanations that call themselves correct. Items 44, 46, 93 are the builder-confirmed
       regression fixtures; their text is not in Tab's files, so they are listed as pending in `fixtures`.
"""
import json, re, sys, math, itertools, difflib
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

# ---------------------------------------------------------------- [P4]
def nums(s):
    return re.findall(r"\b\d+(?:\.\d+)?\b", s or "")

def reconcile(it):
    out = []; iid = it["id"]; opts = it["options"]; k = it["answer"]
    ie = (it.get("explanation") or "").strip(); ke = (opts[k].get("explanation") or "").strip()
    anchors = [{"field": "explanation", "quote": ie[:120]}] if ie else []
    if ie != ke:
        ratio = difflib.SequenceMatcher(None, ie, ke).ratio()
        out.append(row(iid, "key_explanation_divergence", "high",
            f"item explanation and keyed option {k} explanation differ (similarity {ratio:.2f}); model/SME to decide whether they assert the same action",
            k, "sme_reconcile_key_explanation", anchors=anchors + ([{"field": f"options[{k}].explanation", "quote": ke[:120]}] if ke else [])))
    ew = set(words(ie))
    ov = [len(ew & set(words(o["text"]))) for o in opts]
    best_d = max((ov[i], i) for i in range(len(opts)) if i != k)
    if best_d[0] >= 3 and best_d[0] >= ov[k] + 2:   # margin 2: explanations legitimately reuse a distractor's words to rebut it (pilot 2025)
        out.append(row(iid, "key_explanation_divergence", "high",
            f"item explanation shares {best_d[0]} content words with option {best_d[1]} but {ov[k]} with the key; it may justify a distractor",
            best_d[1], "sme_reconcile_key_explanation", anchors=anchors))
    kn = set(nums(opts[k]["text"]))
    if kn:
        last = re.split(r"(?<=[.!?])\s+", ie)[-1] if ie else ""
        en = set(nums(ie))
        if en and not (kn & en):
            out.append(row(iid, "key_explanation_divergence", "blocker",
                f"key states {sorted(kn)} but the explanation's numbers are {sorted(en)}", k, "pull_and_sme_rewrite", anchors=anchors))
        dn = {i: set(nums(o["text"])) for i, o in enumerate(opts) if i != k}
        hit = [i for i, s in dn.items() if s and (s & set(nums(last))) and not (kn & set(nums(last)))]
        if hit:
            out.append(row(iid, "key_explanation_divergence", "blocker",
                f"explanation's final sentence gives a number matching option(s) {hit}, not the key", hit[0], "pull_and_sme_rewrite", anchors=anchors))
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
                                          for s, v in sorted(strata.items(), key=lambda kv: str(kv[0]))}}

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
def fixtures():
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
    # [P4] reconciliation, synthetic (items 44/46/93 pending builder text)
    base = {"id": "fx1", "body": "A client starts with 4 tokens, earns 3 and spends 2. What balance carries forward?", "answer": 0, "citation": "x",
            "options": [{"text": "Carry 5 tokens", "explanation": "4 + 3 - 2 leaves 5."}, {"text": "Carry 7 tokens", "explanation": "e"},
                        {"text": "Carry 0 tokens", "explanation": "e"}, {"text": "Carry 9 tokens", "explanation": "e"}]}
    same = dict(base, explanation="4 + 3 - 2 leaves 5.")
    check("P4a consistent explanation: no divergence", [r["flag"] for r in reconcile(same)], [])
    wrongnum = dict(base, explanation="4 + 3 leaves 7.")
    check("P4b explanation number matches a distractor: blocker", any(r["severity"] == "blocker" for r in reconcile(wrongnum)), True)
    drift = dict(base, explanation="Keep the balance and tell the supervisor.")
    check("P4c item explanation differs from key explanation: candidate", any(r["flag"] == "key_explanation_divergence" for r in reconcile(drift)), True)
    for name, ok_, got, want in res:
        print(json.dumps({"fixture": name, "pass": ok_, "got": got, "want": want}, ensure_ascii=False))
    print(json.dumps({"fixture": "P4 regression items 44, 46, 93", "pass": None,
                      "note": "builder-confirmed key/explanation divergences; text not in Tab's files. Add the three items to a bank file and assert >=1 key_explanation_divergence row each (script or model stage)."}))
    passed = sum(1 for r in res if r[1]); print(f"fixtures: {passed}/{len(res)} passed", file=sys.stderr)
    return passed == len(res)

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "screen"
    if cmd == "fixtures":
        sys.exit(0 if fixtures() else 1)
    bank = json.load(open(sys.argv[2])); items = bank["items"] if isinstance(bank, dict) else bank
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
