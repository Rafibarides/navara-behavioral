// PLACEHOLDER SAMPLE QUESTIONS ONLY - stand-ins for the real banks Nisan supplies.
// Nothing here is from BACB materials. Marked SAMPLE in the UI.
// Field shape matches the Tab content brief (see INTEGRATION.md):
//   opts[]: t (text), exp (why right/wrong), misc (misconception tag, wrong options only),
//           why (why it is tempting - real-time feedback), conf (concept it confuses with),
//           rem (remediation pointer: TCO section + line)
export const RBT_QUESTIONS = [
  {area:'Measurement', type:'recall', q:'You are recording how many times a client raises their hand during a 30-minute session. Which measurement dimension are you using?',
   opts:[
    {t:'Duration', exp:'Duration measures how long a behavior lasts, not how many times it occurs.', misc:'count_vs_time_measures', why:'Hand-raising lasts some amount of time, so duration feels plausible. But you are counting occurrences, not timing them.', conf:'duration_recording', rem:'Review: duration vs frequency.'},
    {t:'Frequency', exp:'Frequency is a count of how many times a behavior occurs.'},
    {t:'Latency', exp:'Latency is the time between a cue and the start of the response.', misc:'confuses_latency_with_duration', why:'There is an implied instruction before the hand-raising, but nothing here measures the gap after it.', conf:'latency_recording', rem:'Review: latency starts at the cue.'},
    {t:'Interresponse time', exp:'Interresponse time measures the gap between two instances of the behavior.', misc:'count_vs_time_measures', why:'With repeated hand-raising there IS a gap between instances - but the question asks what you record by counting, and IRT is a time measure, not a count.', conf:'frequency', rem:'Review: IRT vs frequency.'}
   ], a:1},
  {area:'Assessment', type:'scenario', q:'Your supervising BCBA asks you to hand a client two toys and record which one the client plays with first. This is closest to which type of preference assessment?',
   opts:[
    {t:'Free operant', exp:'Free operant means open access to many items at once, not two at a time.', misc:'assessment_procedure_mixup', why:'The child plays freely, which sounds like free operant - but free operant has no paired presentation and no item removal.', conf:'paired_choice', rem:'Review: preference assessment formats.'},
    {t:'Multiple stimulus with replacement', exp:'MSW presents an array of more than two items and replaces chosen items.', misc:'assessment_procedure_mixup', why:'Multiple stimulus sounds right whenever more than one item appears - but MSW uses a full array, not two items.', conf:'paired_choice', rem:'Review: MSW vs paired choice.'},
    {t:'Paired choice', exp:'A paired choice (forced choice) assessment presents two items at a time and records which one the learner selects.'},
    {t:'Single stimulus', exp:'Single stimulus presents one item at a time.', misc:'assessment_procedure_mixup', why:'One item ends up chosen, but the presentation was two at once.', conf:'paired_choice', rem:'Review: single vs paired presentation.'}
   ], a:2},
  {area:'Skill Acquisition', type:'scenario', q:'You give full physical guidance for every step of a handwashing routine, then gradually reduce your help over sessions. This procedure is called:',
   opts:[
    {t:'Forward chaining', exp:'Chaining teaches steps in order; it says nothing about reducing prompts.', misc:'prompting_vs_chaining', why:'Handwashing is a chain, so chaining feels right. The question is about reducing HELP over time - that is prompt fading, not chaining.', conf:'prompt_fading', rem:'Review: chaining vs prompt fading.'},
    {t:'Prompt fading', exp:'Prompt fading means systematically reducing the level of assistance so the learner responds to natural cues instead of the prompt.'},
    {t:'Shaping', exp:'Shaping reinforces closer approximations of one behavior, not reductions in prompts across steps.', misc:'prompting_vs_chaining', why:'Gradual change over sessions sounds like shaping - but shaping changes the RESPONSE, here you are changing the PROMPT.', conf:'prompt_fading', rem:'Review: shaping definition.'},
    {t:'Incidental teaching', exp:'Incidental teaching uses naturally occurring opportunities, not a structured routine with physical guidance.', misc:'procedure_name_swap', why:'Handwashing happens naturally in the day, but the procedure described is planned and prompt-driven.', conf:'naturalistic_teaching', rem:'Review: naturalistic teaching.'}
   ], a:1},
  {area:'Skill Acquisition', type:'recall', q:'Reinforcing closer and closer approximations of a target behavior, while earlier approximations are no longer reinforced, describes:',
   opts:[
    {t:'Shaping', exp:'Shaping builds a new behavior by reinforcing successive approximations toward the final form.'},
    {t:'Chaining', exp:'Chaining links already-known steps in a fixed order; it does not mold new forms of one behavior.', misc:'prompting_vs_chaining', why:'Both build skills gradually. The key phrase is "approximations of a target behavior" - one behavior changing form, not steps in a sequence.', conf:'shaping', rem:'Review: shaping vs chaining.'},
    {t:'Modeling', exp:'Modeling is demonstrating the behavior; no demonstration is described.', misc:'procedure_name_swap', why:'Approximations could follow a model, but nothing here is demonstrated.', conf:'prompting', rem:'Review: imitation/modeling.'},
    {t:'Discrete trial teaching', exp:'DTT is a teaching format (cue, response, consequence), not a procedure for molding approximations.', misc:'procedure_name_swap', why:'Reinforcement appears in DTT too, but DTT is a format, not the procedure named here.', conf:'shaping', rem:'Review: DTT structure.'}
   ], a:0},
  {area:'Behavior Reduction', type:'judgment', q:'A client tantrums to escape nonpreferred tasks. The plan says to no longer allow escape after tantrums, while still allowing breaks after appropriate requests. Ending the escape that follows tantrums is an example of:',
   opts:[
    {t:'Extinction', exp:'Extinction means withholding the reinforcer that previously maintained the behavior. Here, escape no longer follows tantrums.'},
    {t:'Positive reinforcement', exp:'Reinforcement ADDS or delivers a consequence to increase behavior; this removes a consequence to decrease it.', misc:'confuses_reinforcement_and_extinction', why:'Breaks are still given sometimes, so reinforcement is in the scenario - but the question asks about ENDING escape after tantrums specifically.', conf:'extinction', rem:'Review: extinction vs reinforcement.'},
    {t:'Punishment by adding a stimulus', exp:'Nothing is added after the tantrum; an existing reinforcer is withheld.', misc:'confuses_extinction_with_punishment', why:'The goal is to reduce tantrums, which sounds like punishment. But punishment adds or removes a stimulus to suppress; extinction simply stops delivering what maintained it.', conf:'extinction', rem:'Review: extinction vs punishment.'},
    {t:'Generalization', exp:'Generalization is behavior spreading across settings or people, unrelated to withholding escape.', misc:'procedure_name_swap', why:'The plan applies across tasks, which sounds like generalization - but the question targets the consequence change, not spread of behavior.', conf:'extinction', rem:'Review: generalization definition.'}
   ], a:0},
  {area:'Behavior Reduction', type:'judgment', q:'Before a known trigger, you offer the client a choice of tasks and praise on-task behavior richly. This is best described as a(n):',
   opts:[
    {t:'Consequence intervention', exp:'The moves happen BEFORE the behavior, so they are not consequences.', misc:'antecedent_vs_consequence', why:'Praise is a consequence when it follows behavior - but both moves here are arranged before the trigger. Timing is the tell.', conf:'antecedent_intervention', rem:'Review: antecedent vs consequence interventions.'},
    {t:'Antecedent intervention', exp:'Antecedent interventions arrange the environment before the behavior occurs to make the target behavior less likely and appropriate behavior more likely.'},
    {t:'Emergency procedure', exp:'No crisis or safety event is described.', misc:'severity_misread', why:'A "known trigger" sounds urgent, but routine pre-arrangement is not an emergency procedure.', conf:'antecedent_intervention', rem:'Review: crisis procedures.'},
    {t:'Discontinuous measurement', exp:'Nothing here is a recording method.', misc:'measurement_vs_intervention', why:'Time sampling sometimes uses intervals arranged before observation - but this scenario describes changing the environment, not measuring.', conf:'antecedent_intervention', rem:'Review: discontinuous measurement.'}
   ], a:1},
  {area:'Documentation', type:'judgment', q:'After a session you write: "Client was in a bad mood and uncooperative today." What is the main problem with this note?',
   opts:[
    {t:'It is too short', exp:'Length is not the issue; a one-line objective note is fine.', misc:'style_over_substance', why:'Short notes get flagged in trainings, but brevity is not the problem - subjectivity is.', conf:'objective_writing', rem:'Review: objective session notes.'},
    {t:'It is subjective and not observable', exp:'Session notes should describe observable, measurable behavior. "Bad mood" and "uncooperative" are interpretations, not descriptions of what the client did.'},
    {t:'It should not mention mood at all', exp:'Notes can mention reported mood when written objectively (e.g., quotes or observed signs).', misc:'overcorrection', why:'Banning mood words feels safe, but the rule is objectivity, not censorship.', conf:'objective_writing', rem:'Review: observable vs inferential language.'},
    {t:'It lacks a signature', exp:'Signatures matter, but the content problem comes first.', misc:'form_over_content', why:'Checklist thinking: signatures are required - but the question asks about the note itself.', conf:'documentation_requirements', rem:'Review: note content requirements.'}
   ], a:1},
  {area:'Professional Conduct', type:'judgment', q:'A parent posts a photo of your session on social media and tags you. What is the most appropriate response?',
   opts:[
    {t:'Repost it to build rapport', exp:'Reposting client content risks confidentiality violations regardless of rapport.', misc:'rapport_over_confidentiality', why:'The parent posted first, so it feels permitted. Consent to post is not consent to repost, and client confidentiality rules still bind you.', conf:'social_media_policy', rem:'Review: confidentiality and social media.'},
    {t:'Comment with session details', exp:'Session details are confidential even when the parent shares publicly.', misc:'rapport_over_confidentiality', why:'Responding warmly seems polite, but any client detail in a public comment is a breach.', conf:'social_media_policy', rem:'Review: confidentiality and social media.'},
    {t:'Do not engage with client content online and follow your organization\u2019s social media policy', exp:'RBTs follow their organization\u2019s social media and confidentiality policies. Engaging publicly with client content risks confidentiality violations.'},
    {t:'Ask the parent to send you the photo directly', exp:'Private channels do not make client photos appropriate to hold or share.', misc:'private_channel_loophole', why:'Moving to DM feels safer, but the issue is engaging with client content at all, not the channel.', conf:'social_media_policy', rem:'Review: confidentiality and social media.'}
   ], a:2},
  {area:'Professional Conduct', type:'judgment', q:'A family offers you $50 cash after a great session and says "you earned this, not the company." What should you do FIRST?',
   opts:[
    {t:'Accept it once, since refusing would hurt rapport', exp:'Accepting gifts of value violates professional boundaries regardless of rapport concerns.', misc:'rapport_over_ethics', why:'The rapport argument is real, and families mean well - but the boundary rule does not bend for good intentions.', conf:'gift_policy', rem:'Review: professional boundaries and gifts.'},
    {t:'Politely decline and explain the gift policy, then tell your supervisor', exp:'Decline kindly, explain the policy, and report to your supervisor. Transparency protects everyone.'},
    {t:'Accept and report it to your BCBA later', exp:'Accepting first and reporting later is still accepting the gift.', misc:'reporting_as_absolution', why:'Reporting feels like it cleans it up - but the violation happened at acceptance.', conf:'gift_policy', rem:'Review: gifts must be declined, not disclosed.'},
    {t:'Suggest the family tip the company instead', exp:'Redirecting the money keeps the boundary problem alive in another form.', misc:'technicality_over_ethics', why:'It solves the "not the company" line, but brokering money from clients is not your role.', conf:'gift_policy', rem:'Review: professional boundaries.'}
   ], a:1},
  {area:'Documentation', type:'judgment', q:'Midway through a session you realize you forgot to record trial data for the first 20 minutes. What should you do?',
   opts:[
    {t:'Reconstruct the missing data from memory at the end of the session', exp:'Backfilled data from memory is not reliable recorded data.', misc:'reconstruction_as_data', why:'You were there and remember it roughly - but remembered numbers written later are estimates, and notes must say so.', conf:'late_recording', rem:'Review: timely, accurate data recording.'},
    {t:'Leave the section blank and say nothing', exp:'Omitting the gap hides a data-quality problem your BCBA needs to know about.', misc:'omission_as_neatness', why:'A clean sheet feels professional - but silence about a gap misleads whoever reads the data.', conf:'late_recording', rem:'Review: reporting recording issues.'},
    {t:'Mark the gap clearly in the notes and tell your supervising BCBA', exp:'Record honestly: mark the gap, note why, and inform your supervisor so the data are interpreted correctly.'},
    {t:'Discard the whole session\u2019s data', exp:'The rest of the session\u2019s data are valid; discarding them loses real information.', misc:'overcorrection', why:'Scorched earth feels safe, but the valid data you did collect still matter.', conf:'late_recording', rem:'Review: handling partial data.'}
   ], a:2},
];
export const BCBA_QUESTIONS = [
  {area:'Experimental Design', type:'judgment', q:'A reversal design shows behavior changing when the intervention is withdrawn and returning when it is reinstated. What does this pattern BEST demonstrate?',
   opts:[
    {t:'Generalization', exp:'Generalization is spread across conditions, not control by the intervention.', misc:'design_vs_outcome_confusion', why:'The behavior appears across phases, which resembles spread - but the phases differ by intervention, not setting.', conf:'experimental_control', rem:'Review: reversal design logic.'},
    {t:'Social validity', exp:'Social validity is about the social importance of goals and outcomes, not control.', misc:'concept_name_swap', why:'The outcome matters to the client, which feels socially valid - but the question asks what the PATTERN demonstrates.', conf:'experimental_control', rem:'Review: social validity.'},
    {t:'Experimental control', exp:'Behavior tracking the introduction and withdrawal of the intervention demonstrates a functional relation - experimental control.'},
    {t:'Treatment integrity', exp:'Integrity is whether the intervention was delivered as designed, not what the data pattern shows.', misc:'concept_name_swap', why:'Consistent delivery matters, but the described pattern is about the data relation.', conf:'experimental_control', rem:'Review: procedural fidelity.'}
   ], a:2},
  {area:'Concepts & Principles', type:'recall', q:'A child learns to say "dog" when seeing a dog, then says "dog" when seeing a cat. This is an example of:',
   opts:[
    {t:'Stimulus discrimination', exp:'Discrimination would be responding differently to dog vs cat; here the response spread.', misc:'generalization_vs_discrimination', why:'The child IS treating them differently from other things - but the error is responding the SAME to a new stimulus, which is generalization.', conf:'stimulus_generalization', rem:'Review: discrimination vs generalization.'},
    {t:'Stimulus generalization', exp:'The response trained to one stimulus (dog) occurred in the presence of a similar untrained stimulus (cat).' },
    {t:'Response generalization', exp:'Response generalization is one stimulus evoking different (untrained) responses, not a new stimulus evoking the trained response.', misc:'stimulus_vs_response_generalization', why:'"Generalization" is right, and the response varies in the child\u2019s world - but what changed here is the STIMULUS (dog to cat), same response.', conf:'stimulus_generalization', rem:'Review: stimulus vs response generalization.'},
    {t:'Overselectivity', exp:'Overselectivity is responding to a restricted range of stimulus features, the opposite pattern.', misc:'concept_name_swap', why:'Calling a cat "dog" seems like selective attention - but the child responded to the shared features, which is breadth, not restriction.', conf:'stimulus_generalization', rem:'Review: stimulus control concepts.'}
   ], a:1},
  {area:'Measurement', type:'scenario', q:'You graph a client\u2019s data and the level, trend, and variability all change when a new phase begins. The STRONGEST next step for demonstrating a functional relation is to:',
   opts:[
    {t:'Collect more baseline data indefinitely', exp:'Baseline is already established; indefinite baselines delay treatment without adding control.', misc:'more_data_as_caution', why:'More data feels rigorous. But baseline stability exists; the design needs replication, not endless baseline.', conf:'replication_logic', rem:'Review: baseline logic and prediction.'},
    {t:'Replicate the effect by withdrawing and reintroducing the intervention', exp:'Replication of the effect (e.g., reversal or another phase change) strengthens the demonstration of a functional relation.'},
    {t:'Switch to a nonconcurrent multiple baseline', exp:'Changing designs mid-stream is unnecessary when replication is available in the current design.', misc:'design_shopping', why:'Multiple baselines are powerful, but you already have a phase change to replicate.', conf:'replication_logic', rem:'Review: choosing and using designs.'},
    {t:'Report the results as conclusive', exp:'One phase change is demonstration, not proof; replication comes first.', misc:'overclaiming', why:'The change is striking, but a single demonstration is the weakest evidence in single-case design.', conf:'replication_logic', rem:'Review: verification and replication.'}
   ], a:1},
  {area:'Ethics', type:'judgment', q:'A school asks you, the BCBA, to design a restraint procedure for a student you have never assessed. What is the MOST ethical first step?',
   opts:[
    {t:'Design the procedure using published protocols', exp:'Protocols cannot substitute for assessment of this individual; restraint without assessment violates the Ethics Code.', misc:'protocol_over_assessment', why:'Published protocols feel safe and efficient - but restraint is restrictive and must follow individual assessment and least-restrictive ordering.', conf:'assessment_before_intervention', rem:'Review the Ethics Code on assessment and least restrictiveness.'},
    {t:'Decline and refer the school to another provider', exp:'Immediate referral skips your responsibility to offer appropriate help within scope.', misc:'overcorrection', why:'Declining feels safe, but the ethical move is to insist on proper assessment first, not to walk away.', conf:'scope_of_competence', rem:'Review the Ethics Code.'},
    {t:'Conduct an assessment of the student before any procedure is considered', exp:'Assessment must precede intervention, and restrictive procedures additionally require justification and least-restrictive review.'},
    {t:'Have the school psychologist sign off on the plan', exp:'Another professional\u2019s sign-off does not replace a behavior-analytic assessment.', misc:'authority_substitution', why:'A sign-off looks like cover - but it does not create the assessment the Code requires.', conf:'assessment_before_intervention', rem:'Review the Ethics Code.'}
   ], a:2},
  {area:'Personnel Supervision', type:'judgment', q:'During supervision, your RBT implements a procedure incorrectly for the second week in a row. What should you do FIRST?',
   opts:[
    {t:'Document the error and move on', exp:'Documentation alone does not change performance.', misc:'documentation_as_action', why:'Documentation is part of supervision, but the first job is to fix the performance, not just record it.', conf:'performance_management', rem:'Review: supervision and feedback.'},
    {t:'Retrain using behavioral skills training with rehearsal and feedback', exp:'BST (instruction, modeling, rehearsal, feedback) is the evidence-based supervision method for performance errors.'},
    {t:'Reduce the RBT\u2019s caseload', exp:'Caseload changes do not address the skill deficit.', misc:'environment_fix_first', why:'Workload can contribute, but nothing indicates overload; the skill error needs training.', conf:'performance_management', rem:'Review: performance management.'},
    {t:'Report the RBT to the BACB', exp:'A trainable performance error is a supervision issue, not an ethics report.', misc:'severity_misread', why:'Client welfare matters and reporting can be required for violations - but an implementation error is corrected through supervision first.', conf:'ethics_reporting_threshold', rem:'Review the Ethics Code on supervision; reporting standards..'}
   ], a:1},
  {area:'Assessment', type:'scenario', q:'A functional analysis shows elevated problem behavior only in the escape condition. The most defensible conclusion is that the behavior is maintained by:',
   opts:[
    {t:'Automatic reinforcement', exp:'The alone/ignore condition, not escape, isolates automatic reinforcement.', misc:'fa_condition_mixup', why:'"Only one condition elevated" tempts you to pick the private one - but the ELEVATED condition was escape.', conf:'negative_reinforcement', rem:'Review: FA conditions and interpretation.'},
    {t:'Positive reinforcement by attention', exp:'The attention condition was not elevated.', misc:'fa_condition_mixup', why:'Attention is the most common function clinically, but this FA did not show it.', conf:'negative_reinforcement', rem:'Review: FA interpretation.'},
    {t:'Negative reinforcement by escape', exp:'Elevation isolated to the escape condition indicates the behavior is maintained by escape (negative reinforcement).'},
    {t:'Multiple functions', exp:'A single elevated condition supports one function, not several.', misc:'hedging_as_rigor', why:'Multiple functions feel humble and thorough - but the data show one clear function.', conf:'negative_reinforcement', rem:'Review: interpreting FA outcomes.'}
   ], a:2},
  {area:'Concepts & Principles', type:'recall', q:'A student has had no access to attention all morning. When group work starts, attention now functions as a stronger reinforcer and the student works hard to get it. The morning without attention is an example of:',
   opts:[
    {t:'An abolishing operation', exp:'An abolishing operation DECREASES the effectiveness of a reinforcer; deprivation increases it.', misc:'ao_vs_eo', why:'Both are motivating operations and both change reinforcer effectiveness - but deprivation raises value, which is the establishing direction.', conf:'establishing_operation', rem:'Review: motivating operations.'},
    {t:'An establishing operation', exp:'Deprivation of attention increases its effectiveness as a reinforcer and evokes behavior that produces it - an establishing operation.'},
    {t:'A discriminative stimulus', exp:'An SD signals that reinforcement is available for a response; deprivation is a motivating operation, not a signal.', misc:'sd_vs_mo', why:'The group work setting does signal attention is available - but the question describes the DEPRIVATION, which is a value-altering event.', conf:'establishing_operation', rem:'Review: SD vs motivating operation.'},
    {t:'A conditioned punisher', exp:'Nothing here decreases future behavior; deprivation increased the value of a reinforcer.', misc:'concept_name_swap', why:'"No attention" sounds aversive - but its effect was to strengthen attention as a reinforcer, not to punish anything.', conf:'establishing_operation', rem:'Review: motivating operations.'}
   ], a:1},
  {area:'Concepts & Principles', type:'recall', q:'A child says "dog" when shown a picture of a dog, with no history of getting anything specific for saying it. Which verbal operant is this?',
   opts:[
    {t:'Mand', exp:'A mand is a request that specifies its own reinforcer; the child is labeling, not requesting.', misc:'verbal_operant_mixup', why:'If the child wanted the dog, "dog" could be a mand - but nothing here suggests motivation to GET the dog.', conf:'tact', rem:'Review: the verbal operants.'},
    {t:'Echoic', exp:'An echoic repeats someone else\u2019s vocal model; no one modeled "dog" here.', misc:'verbal_operant_mixup', why:'Echoics need a verbal model to repeat, and none appears in the scenario.', conf:'tact', rem:'Review: echoic vs tact.'},
    {t:'Tact', exp:'A tact is a label evoked by a nonverbal stimulus (the picture), maintained by generalized social reinforcement.'},
    {t:'Intraverbal', exp:'An intraverbal is a response to another verbal stimulus (like answering a question), not to a picture.', misc:'verbal_operant_mixup', why:'Answering "what is this?" aloud would involve a verbal stimulus - but the picture here is nonverbal, which makes it a tact.', conf:'tact', rem:'Review: intraverbal vs tact.'}
   ], a:2},
  {area:'Assessment', type:'scenario', q:'You place two toys in front of a client, let them play with the one they choose, and repeat across several pairs, ranking the toys by how often each is picked. Which preference assessment are you running?',
   opts:[
    {t:'Free-operant observation', exp:'Free-operant observation watches engagement with many items available at once, not structured pairs.', misc:'assessment_format_mixup', why:'Letting the client roam a room of toys is free-operant - this scenario presents two at a time.', conf:'paired_choice', rem:'Review: preference assessment formats.'},
    {t:'Single-stimulus presentation', exp:'Single-stimulus presents one item at a time and records approach or engagement; here items come in pairs.', misc:'assessment_format_mixup', why:'One-at-a-time presentation avoids position biases but loses the direct comparison - this scenario uses pairs.', conf:'paired_choice', rem:'Review: preference assessment formats.'},
    {t:'Multiple stimulus without replacement', exp:'MSW presents an array and removes chosen items; this scenario presents two at a time with replacement across pairs.', misc:'assessment_format_mixup', why:'An array that shrinks as items are chosen is MSW - the two-at-a-time structure is the paired-choice hallmark.', conf:'paired_choice', rem:'Review: MSW vs paired choice.'},
    {t:'Paired-choice (forced-choice) assessment', exp:'Presenting two items at a time and ranking by selection across pairs is the paired-choice method.'}
   ], a:3},
  {area:'Measurement', type:'scenario', q:'You and a second observer independently count occurrences during the same 20-minute session. You count 40, the second observer counts 50. Using total-count IOA (smaller divided by larger), what is your agreement?',
   opts:[
    {t:'90%', exp:'90% would come from averaging the counts rather than dividing smaller by larger.', misc:'wrong_ioa_formula', why:'(40+50)/2 compared to either count looks close to 90 - but total-count IOA is strictly smaller/larger.', conf:'total_count_ioa', rem:'Review: IOA formulas.'},
    {t:'125%', exp:'Dividing larger by smaller inverts the formula; IOA cannot exceed 100%.', misc:'inverted_ratio', why:'50/40 = 125% feels like a ratio of the counts - but agreement is always the smaller over the larger.', conf:'total_count_ioa', rem:'Review: IOA formulas.'},
    {t:'20%', exp:'20% is the size of the difference relative to your count, not an agreement figure.', misc:'difference_as_agreement', why:'The counts differ by 10, which is 20% of 50 - but disagreement size is not the IOA metric.', conf:'total_count_ioa', rem:'Review: IOA formulas.'},
    {t:'80%', exp:'Total-count IOA = smaller/larger = 40/50 = 80%.'}
   ], a:3},
];
