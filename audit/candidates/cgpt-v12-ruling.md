
NAVARA PATHWAYS

FINAL CROSS-AUDIT | EVIDENCE CONTRACT v1.2, RUBRIC v1.2, AND LIVE-BANK FINDINGS

Conditional approval for staging
Executive ruling

Accept v1.2 as the new engineering baseline. Reject it as production-ready.

Tab has materially improved the evidence contract. The distinction between item lineage and exposure independence, scoped quality holds, per-tag reserve suitability, source-anchored audit flags, and explicit treatment of unknown exposure history are all significant improvements.

The 79 passing synthetic assertions are useful evidence of implementation progress. The builder's independent live-bank verification makes the content-audit workflow more credible.

However, I identify one major unresolved evidence-accounting defect, two important audit-classification errors, and several integration weaknesses that the current test suite does not adequately exercise.

The biggest new finding comes from the exact text of items 44, 46, and 93.

1. The three supposed explanation divergences are not substantive contradictions

The builder has verified that the question-level and keyed-option explanations contain different text. That is a valid mechanical finding.

But the supplied explanations agree on the answer and its rationale in all three cases.

Item

	

What actually differs

	

My ruling




44

	

Item explanation adds a parenthetical reference to Section 3.02

	

Citation/reference difference; not substantive divergence




46

	

Minor wording differences about supervision; same conclusion

	

Equivalent explanation




93

	

Item explanation adds parenthetical references to Sections 1.08 and 2.03

	

Citation/reference difference; not substantive divergence

For example, item 44's two explanations both identify recording nonexistent trials as dishonest and a violation of integrity. The additional section reference does not change the conclusion.

Item 46's statements also agree that an RBT should not provide the described services without qualifying supervision in place. The specific regulatory accuracy still warrants independent source verification, but the two explanations are mutually consistent.

Item 93's explanations express the same principle of dignity and respect.

What this changes

Tab's new key_explanation_divergence detector correctly finds text differences. But its calibration requirement that items 44, 46, and 93 must all produce divergence flags is not appropriate if the flag is supposed to represent a material instructional conflict.

I recommend separating the output into two classifications:

explanation_text_difference: A mechanical difference. Useful for content consistency reports.

explanation_semantic_conflict: A material contradiction, unsupported key, or substantively different instructional rule. Requires SME review and potentially an evidence hold.

On the evidence supplied, all three items belong in the first category, not the second.

Do not train or calibrate a detector to classify harmless wording differences as instructional defects just to achieve 3/3 recall.

The builder's findings establish that these are differences worth checking, not that they are incorrect explanations.

This is exactly why source verification and substantive adjudication must remain separate.

2. Evidence contract v1.2: what passes and what does not

Taxonomy and stable display labels

Accept

Additive proposals, SME verdicts, historical decisions, and stable labels are implemented coherently.

Scoped quality holds

Accept with safeguards

Item-level versus option-tag holds are correctly separated. Verification authority still needs protection.

Exposure and freshness

Incomplete

Reserve inventory accounts for presentation events, but the actual first-encounter inference function does not.

Practice versus reassessment pools

Accept

Disjoint pools and item-tag-specific reserve suitability address the previous design conflict.

Resolved status

Correctly disabled

No delayed-resolution mechanism is being presented as shipped.

Member-facing RPCs

Not authorized

The SQL grants authenticated execution. That contradicts the owner's explicit prohibition on public exposure at this stage.

Critical defect E1: Presentation history is not integrated into personal evidence inference

Tab fixed the reserve-inventory calculation, but not the entire evidence contract.

In member_reserve_remaining(), v1.2 checks presentation events and submitted attempts. Good.

However, first_encounters() still calculates item_rank and cluster_rank using only pathways_adapter.source_attempts.

Its eligibility condition then allows a first submitted answer to count if the attempt is unaided, the content version matches, and the item is approved.

Consider this scenario:

Monday: A member opens question A, reads it, and exits without answering.

Tuesday: The member receives teaching or discussion about the same scenario.

Wednesday: The member submits their first answer to question A.

The reserve availability function knows the item was previously displayed.

But first_encounters() can still mark Wednesday's answer as an eligible first encounter because it has no earlier submitted answer.

This produces two conflicting interpretations of the same evidence.

Required correction: Use one authoritative exposure-eligibility function for all personal evidence, not separate notions of freshness for practice patterns and reserves.

For a first scored encounter, distinguish the initial presentation associated with that same answer session from any earlier presentation. Prior displays, answer reveals, and exposure to overlapping clusters must be considered.

The exact rule should be:

Plain text
eligible_independent_attempt =
    quality_approved
    AND construct_approved
    AND first_scored_item_encounter
    AND no_prior_disqualifying_exposure
    AND current_version_valid
    AND unaided
    AND no_active_hold

For newly instrumented sessions, bind the presentation event to the answer attempt using an immutable presentation_id or equivalent server-side identifier.

For historical attempts, preserve an unknown_exposure_history classification where the available evidence cannot establish freshness.

This is the most important remaining correctness issue in v1.2.

Critical defect E2: The proposed presentation logger is not yet trustworthy as an exposure authority

The function public.pathways_log_presentation() accepts p_track, p_item_id, p_content_version, and p_context from the caller.

It correctly derives member identity server-side.

But it does not verify that:

The caller was actually authorized to view that question.

The item was delivered as part of a legitimate practice or reassessment set.

The submitted content version matches the current item version.

The item is published and eligible for that member's track.

The event corresponds to a genuine presentation rather than an arbitrary client call.

This is less a cross-member confidentiality vulnerability than an evidence-integrity vulnerability.

A client-provided statement that an item was shown is not proof that it was shown.

I recommend logging presentation when the authorized server delivers the item, using a server-issued set/session identifier. The member should not choose arbitrary item IDs or content versions for an authoritative exposure event.

The logging epoch should not be activated until this mechanism is working reliably across every route that displays questions.

Critical defect E3: SQL-level source verification is not enforced

Tab's byte-exact verification work is a genuine improvement. The independent 24/24 live-bank result supports that the pilot anchors now match the source.

However, the database only checks whether source_anchors is a nonempty JSON array when verification_status='source_verified'.

It does not itself validate the anchors against the actual question content.

For example, the acceptance tests insert a supposedly verified model flag with a synthetic anchor. The SQL accepts the verification state without checking the quoted content.

That may be acceptable in a trusted ingestion pipeline, but only if the application role cannot directly set verification fields.

The correction is to separate flag submission from flag verification. Only a privileged verifier should be able to promote verification_status to source_verified, after checking the exact immutable source snapshot.

Likewise, reviewer IDs should be derived from authorized reviewer identity, not merely supplied as arbitrary existing UUIDs.

The current schema establishes review-record relationships. It does not, on its own, prove that the person issuing an approval is the reviewer named in the row.

Critical defect E4: The migration still enables member-facing functions

The owner explicitly stated that no member RPC is authorized for public exposure.

Yet the SQL includes:

SQL
GRANT EXECUTE
ON FUNCTION public.pathways_my_patterns()
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.pathways_log_presentation(
  text, text, text, text
)
TO authenticated;

For the staging branch, these grants should be removed or replaced with staging-only configuration that is guaranteed not to reach the public environment.

A function in an exposed Supabase schema with authenticated execution rights is an API surface. Passing synthetic authorization tests does not make its exposure approved.

I would test the RPCs internally using appropriate isolated roles, then authorize deployment separately.

Critical defect E5: Transfer counts can include practice items

The v1.2 coverage manifest calculates:

SQL
COUNT(DISTINCT ci.surface_cluster_id)
FILTER (
  WHERE ci.eligible
    AND ci.transfer_status='approved'
) AS transfer_approved_clusters

This includes transfer-approved items in the practice pool.

That is not necessarily incorrect if the metric means all items capable of supporting transfer questions.

But it is misleading if downstream systems interpret it as available independent transfer reserves.

The manifest should report two separate fields:

transfer_approved_total_clusters

transfer_approved_reserve_clusters

Only the second should feed a future reserve-based delayed-resolution capacity check.

resolution_capable=false currently prevents this from creating false Resolved states, so this is not an immediate production inference bug. It is a schema correction needed before P2 reassessment work.

3. Rubric v1.2: updated ruling using the live bank

The builder's live-bank audit changes my assessment substantially.

24/24
Live pilot flags source-anchored
1,381
Prescreen candidates
834
Items with candidates
All figures from the builder's supplied live-bank audit. They describe screening outputs, not certified defects.
What I now accept

The provenance problem is substantially repaired. The 24 pilot rows have been independently re-anchored against the live bank, not merely the original packet.

The citation chapter-map correction also appears successful for the previously identified false-positive class, which fell from 30 to zero.

The new explanation reconciliation logic detects the three specified text differences. However, as established above, detecting those differences should not be confused with identifying three substantive contradictions.

New defect: numeric word-form equivalence

Item 1638 reveals another important prescreen weakness.

The statement "Three call-outs is within her limit of 4" is numerically compatible with a limit of four, assuming no additional condition changes the interpretation.

A detector that treats Three and 3 as different quantities can generate false numerical-conflict flags.

Required correction: Add controlled word-to-number normalization for comparisons, while preserving the original source text unchanged.

The checker should handle ordinary cardinals, ordinals, decimals, percentages, fractions, and units where relevant. It should avoid silently resolving ambiguous expressions.

The verification process should separate:

Literal source quotation, which remains byte-exact.

Semantic numeric interpretation, which uses normalized numerical values.

These are distinct operations.

I would not certify item 1638's entire keyed answer without its complete stem and options. The evidence supplied establishes a flaw in the numerical screening logic, not the full clinical correctness of the item.

The 1,381-candidate queue is too large to treat uniformly

With 834 of 1,000 questions generating at least one candidate, an SME cannot realistically treat every flag as equally urgent.

The remaining 52 contrast-prose false positives reinforce the need for triage.

I recommend the review queue prioritize source-verified suspected key defects, substantive explanation conflicts, and option-to-misconception misattributions before cosmetic cues and wording consistency.

Keep the script's broader reports, but do not force every low-confidence candidate through the same expensive SME workflow.

The supervisor cue deserves targeted investigation

The track-level data is revealing.

Track

	

Keys mentioning supervisor/BCBA

	

Distractors mentioning supervisor/BCBA




RBT

	

120/500 (24.0%)

	

44/1,500 (2.9%)




BCBA

	

6/500 (1.2%)

	

35/1,500 (2.3%)

The asymmetry concentrates in RBT, which is unsurprising given the role's supervision requirements.

That is why I would not classify the wording imbalance alone as a defect.

The next useful test is a supervisor-keyword-only answer heuristic, stratified by content area and question type, particularly RBT judgment items.

Ask whether a learner selecting the only answer mentioning the supervisor can consistently identify the key without understanding the tested principle.

If so, SME review should determine whether the cue compromises the construct. Do not indiscriminately insert supervisor distractors just to balance wording.

Queue status: accept the builder's state

The builder reports 1,405 open flags, all non-holding.

That is consistent with a conservative audit phase.

I would not activate Tab's proposed 1439 evidence hold or accept its 37/40 severity downgrade as an SME disposition. Both remain pending.

The fact that 24 pilot flags pass source verification establishes that the supporting quotations exist. It does not certify the underlying judgments.

4. What the 79 acceptance assertions actually prove

The tests are materially stronger than v1, but several critical behaviors are still untested.

Area

	

Evidence from tests

	

Remaining gap




First answer and retakes

	

T03–T05

	

Prior display without an answer is not tested against first_encounters()




Exposure clusters

	

T06–T07, N06

	

Cluster reassignment is tested for reserve counts, not retrospective personal-pattern counting




Scoped flags

	

N03–N04

	

Verification-state authority and real SME identity are not enforced by these fixtures




Reserve exhaustion

	

T15, N01, B04

	

Authentic server delivery and pre-epoch exposure completeness remain unverified




Member-local day spacing

	

T12–T13, N02, B01

	

Owner has not approved the timezone fallback policy




Transfer suitability

	

N08

	

Does not establish meaningful transfer validity




Member authorization

	

T20–T21, N09

	

Synthetic roles and simulated JWT context, not Supabase deployment authorization

The 800-call parallel result is reassuring for the tested simulation. It is not a substitute for live-role authorization checks.

The scratch adapters also omit important real-world constraints, including relationships between published options, the actual question-serving process, subscription authorization, and how immutable content versions are produced.

Three tests I would add before staging acceptance

Test A: Display without answer, followed by a submitted answer.

The first submitted answer must not automatically qualify as independent evidence when an earlier presentation occurred.

Test B: Untrusted verifier promotion.

A role capable of submitting audit candidates must not be able to promote its own flag to source_verified or approve a review simply by supplying the appropriate fields.

Test C: Stale content version in the presentation logger.

A caller providing a nonexistent, outdated, or unauthorized question version must not produce an authoritative valid exposure event for that claimed version.

These three test gaps matter more than increasing the total assertion count.

5. Additional schema problem: content-version semantics

Tab's adapter contract says content_version hashes only the stem, options, and key. It explicitly excludes explanation revisions and retagging.

I understand the rationale. Correcting a citation or tag should not automatically discard every historical response to an unchanged question.

However, the review tables use content_version as their certification key.

That means an explanation could change while the item retained a previous quality certification, unless the builder separately invalidates and reissues the relevant review.

I would define three version identifiers:

Field

	

Changes when




assessment_version

	

Stem, choices, key, or other content affecting the assessed decision changes




instructional_version

	

Explanations, rationales, citations, or remediation content changes




mapping_version

	

Misconception tags, construct associations, or option attributions change

Historical first-answer validity primarily depends on the assessment version.

Current instructional approval depends on the instructional version.

Misconception inference depends on the mapping version and current SME-approved interpretation.

This allows corrected metadata to support retrospective evidence recalculation without accidentally treating newly edited explanations as previously reviewed content.

I would incorporate this into the adapter contract before large-scale content corrections begin.

6. Final decision

Rubric v1.2

Accept as audit baseline
Source anchoring is now independently demonstrated. Correct the numeric-word detector and separate text differences from substantive explanation conflicts before using the rubric to prioritize clinical defects.

Evidence SQL v1.2

Accept with amendments
Use it as the starting staging branch. Fix presentation-aware first-encounter eligibility, harden verifier and logger authority, and separate instructional/mapping versions from assessment versions.

79 acceptance assertions

Accept as baseline suite
Keep them. Add negative tests for the three missing trust-boundary behaviors and repeat the suite with real adapters.

Public/member RPC deployment

Not authorized
Remove execution grants from the deployment candidate until the owner explicitly authorizes member access and Supabase authorization testing succeeds.
Immediate builder order

Correct the presentation-aware eligibility logic and test it against the same exposure history used by reserve selection.

Fix the audit-classification regressions: items 44/46/93 should be recognized as compatible explanations unless a separate substantive defect is demonstrated; handle numeric word forms in item 1638.

Establish trusted verifier and reviewer boundaries, with explicit version separation.

Run the revised migration against the actual adapter views in isolated staging, with member RPC access disabled.

Produce a coverage manifest from real SME-approved records. Do not treat the 1,405 open flags or 523 track-tag pairs as validated instructional concepts.

The one change I would insist on above all others

Use a single authoritative exposure history for both member misconception evidence and fresh reassessment selection.

Right now, v1.2 is close to that architecture, but its two functions still answer related freshness questions using different underlying histories.

That inconsistency can allow the system to count evidence as independent in one place while acknowledging that the same content has already been seen in another.

Fixing it will make the adaptive engine substantially more trustworthy.

Final verdict: v1.2 is a credible staging foundation, not a finished evidence engine. The next step should be a narrow v1.2.1 correction, not another architectural redesign.

