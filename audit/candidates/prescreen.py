#!/usr/bin/env python3
"""Pathways content-audit rubric v1 -- script pre-screen (stage S).
Usage: python3 prescreen.py bank.json > script-flags.jsonl
bank.json: {"items":[...]} in the published Pathways item schema.
Emits candidate rows {item_id, flag, severity, rationale, option, route, detector:"script"}.
Every row is a CANDIDATE for model/human review, not a verdict. No network calls.
"""
import json, re, sys, math, itertools
from collections import Counter, defaultdict

STOP = set("""a an the and or of to in on for with at by from as is are was were be been being it its this that
these those he she him his her they them their you your we our what which who whom do does did should would can could
will may might must not no than then so if when while before after during into about over under again more most less
very just only also each any all some such own same other""".split())
ABSOLUTE = re.compile(r"\b(always|never|clearly|guarantee[sd]?|impossible|completely|cannot|all of|none of|invalid)\b", re.I)
CONTRAST = re.compile(r"\b(but|however|yet|that would|that does not|that doesn't)\b", re.I)
SELF_KEY = re.compile(r"\b(is (the )?correct|is (the )?best|right answer|is what you should)\b", re.I)
# Cooper, Heron & Heward (2020) 3rd ed. chapter -> title keyword (for citation self-consistency only)
CHH3 = {1:"definition",2:"basic concepts",3:"selecting and defining",4:"measuring behavior",5:"quality of measurement",
 6:"graphic",7:"analyzing behavior change",8:"reversal",9:"multiple baseline",10:"planning and evaluating",
 11:"positive reinforcement",12:"negative reinforcement",13:"schedules",14:"positive punishment",15:"negative punishment",
 16:"motivating operations",17:"stimulus control",18:"verbal behavior",19:"equivalence",20:"nonequivalence",
 21:"imitation",22:"shaping",23:"chaining",24:"extinction",25:"differential reinforcement",26:"antecedent",
 27:"functional behavior assessment",28:"token economy",29:"self-management",30:"generalization",31:"ethical"}

def words(s):
    return [w for w in re.findall(r"[a-z0-9']+", (s or "").lower()) if w not in STOP and len(w) > 2]

def row(iid, flag, sev, why, opt=None, route=None):
    return {"item_id": iid, "flag": flag, "severity": sev, "rationale": why, "option": opt, "route": route, "detector": "script"}

def screen_item(it):
    out = []; iid = it["id"]; opts = it["options"]; k = it["answer"]
    # schema / role consistency
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
        if i != k and wt and (SELF_KEY.search(wt) or not CONTRAST.search(wt)):
            out.append(row(iid, "why_tempting_role_conflict_candidate", "high",
                f"why_tempting lacks a contrast clause or asserts correctness: \"{wt[:90]}\"", i, "model_then_human"))
    if (it.get("explanation") or "").strip() != (opts[k].get("explanation") or "").strip():
        out.append(row(iid, "explanation_mismatch_key", "high", "item explanation differs from keyed option explanation", k, "sme_verify_key"))
    # length cue
    L = [len(o["text"]) for o in opts]; d = [L[i] for i in range(len(L)) if i != k]
    if L[k] > 1.25 * max(d):
        out.append(row(iid, "cue_key_longest", "low", f"key {L[k]} chars vs longest distractor {max(d)}", k, "editor_fix"))
    # lexical overlap cue
    stem = set(words(it["body"]))
    ov = [len(stem & set(words(o["text"]))) for o in opts]
    if ov[k] >= 2 and ov[k] > max(ov[i] for i in range(len(ov)) if i != k):
        out.append(row(iid, "cue_key_echoes_stem", "low", f"key shares {ov[k]} content words with stem, best distractor {max(ov[i] for i in range(len(ov)) if i!=k)}", k, "editor_fix"))
    # absolute-word cue (only in distractors)
    abs_hits = [i for i, o in enumerate(opts) if ABSOLUTE.search(o["text"])]
    if abs_hits and k not in abs_hits:
        out.append(row(iid, "cue_absolute_terms_in_distractors", "low", "absolute terms only in distractors: " + "; ".join(f"[{i}] {ABSOLUTE.search(opts[i]['text']).group(0)}" for i in abs_hits), None, "editor_fix"))
    # grammatical-form cue: distractors share first word, key does not
    fw = [o["text"].split()[0].lower() for o in opts]
    dfw = {fw[i] for i in range(len(fw)) if i != k}
    if len(dfw) == 1 and fw[k] not in dfw:
        out.append(row(iid, "cue_key_breaks_parallel_form", "low", f"all distractors start \"{dfw.pop()}\", key starts \"{fw[k]}\"", k, "editor_fix"))
    # remediation pointer reused across different tags within item
    ptr = defaultdict(set)
    for o in opts:
        if o.get("remediation_pointer"): ptr[o["remediation_pointer"]].add(o.get("misconception_tag"))
    for p, tags in ptr.items():
        if len(tags) > 1:
            out.append(row(iid, "remediation_pointer_generic", "low", f"pointer \"{p}\" serves {len(tags)} different tags: {sorted(tags)}", None, "sme_retag"))
    # same tag on several distractors (diagnostic power)
    tc = Counter(o.get("misconception_tag") for i, o in enumerate(opts) if i != k)
    for t, c in tc.items():
        if t and c >= 2:
            out.append(row(iid, "tag_repeated_across_distractors", "low", f"tag {t} on {c} distractors; wrong answers cannot be told apart", None, "sme_retag"))
    # citation self-consistency (CHH3 chapter/title) and format
    cit = it.get("citation") or ""
    for m in re.finditer(r"Ch\.\s*(\d+)\s*\(([^)]+)\)", cit):
        n, title = int(m.group(1)), m.group(2).lower()
        if n in CHH3 and CHH3[n] not in title:
            out.append(row(iid, "citation_chapter_title_mismatch", "high", f"Ch. {n} titled \"{m.group(2)}\"", None, "sme_verify_citation"))
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
    """Bank-level checks; print to stderr as a report, not per-item rows."""
    pos = Counter(it["answer"] for it in items)
    sup = re.compile(r"\b(supervisor|bcba)\b", re.I)
    k_sup = sum(1 for it in items if sup.search(it["options"][it["answer"]]["text"]))
    d_sup = sum(1 for it in items for i, o in enumerate(it["options"]) if i != it["answer"] and sup.search(o["text"]))
    keylong = sum(1 for it in items if len(it["options"][it["answer"]]["text"]) == max(len(o["text"]) for o in it["options"]))
    return {"answer_position_counts": dict(sorted(pos.items())), "keys_mentioning_supervisor_or_bcba": k_sup,
            "distractors_mentioning_supervisor_or_bcba": d_sup, "items_where_key_is_longest": keylong, "n_items": len(items)}

if __name__ == "__main__":
    bank = json.load(open(sys.argv[1])); items = bank["items"] if isinstance(bank, dict) else bank
    for it in items:
        for r in screen_item(it): print(json.dumps(r, ensure_ascii=False))
    for a, b, s in tfidf_pairs(items):
        print(json.dumps(row(a, "near_duplicate_stem_candidate", "high", f"stem TF-IDF cosine {s} with item {b}", None, "dedupe_review"), ensure_ascii=False))
    print(json.dumps(bank_level(items)), file=sys.stderr)
