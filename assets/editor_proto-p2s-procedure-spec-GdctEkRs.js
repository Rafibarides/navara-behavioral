const e=`<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>P2 procedure spec</title>
<style>
body{font-family:system-ui,sans-serif;max-width:860px;margin:20px auto;padding:0 16px;color:#222}
h1{font-size:19px} h2{font-size:15px;margin-top:18px}
.banner{background:#fff3cd;border:1px solid #e0a800;padding:6px 10px;border-radius:6px;font-size:13px}
.boundary{background:#e8f1f8;border:1px solid #1a5276;padding:6px 10px;border-radius:6px;font-size:13px;margin-top:10px}
table{border-collapse:collapse;margin:8px 0} td,th{border:1px solid #bbb;padding:3px 9px;font-size:13px;text-align:center}
.field{margin-top:10px;font-size:13px;display:flex;flex-direction:column;gap:2px}
input[type=text],textarea,select{padding:4px 6px;font-size:13px;width:100%;box-sizing:border-box}
textarea{min-height:44px}
button{margin-top:14px;padding:8px 16px;font-size:14px}
#results{margin-top:14px;font-size:14px}
.pass{color:#1a7a1a}.fail{color:#b00020}.note{color:#1a5276}
pre{background:#f5f5f5;padding:8px;font-size:11px;overflow:auto}
.human{font-size:13px;color:#444}
.tablewrap{overflow-x:auto;max-width:100%;-webkit-overflow-scrolling:touch}
.scrollhint{font-size:12px;color:#666;margin:8px 0 0}
</style></head><body>
<div class="banner">Optional practice exercise with a synthetic scenario.</div>
<h1>Task: Procedure specification with parameter defense (P2)</h1>
<p>A functional assessment of a 10-year-old's work refusal (leaving the desk, tearing worksheets) during independent math concludes the behavior is maintained by access to preferred items: refusal reliably produces the timer-controlled activity box the teacher then offers to re-engage him. Classroom conditions are otherwise unchanged.</p>
<p><b>Write a complete procedure specification and a one-to-two-sentence defense of each parameter.</b></p>
<div class="field">Operational target definition <textarea id="f_target"></textarea></div>
<div class="field">Reinforcer (what the alternative response produces) <input type="text" id="f_reinforcer"></div>
<div class="field">Schedule <select id="f_schedule"><option value="">(choose)</option><option>FR1</option><option>FR2</option><option>VR2</option><option>VR3</option><option>other</option></select></div>
<div class="field">Schedule density / thinning plan <input type="text" id="f_schedule_detail"></div>
<div class="field">Extinction component (or "none" with reason) <textarea id="f_extinction"></textarea></div>
<div class="field">Alternative behavior <input type="text" id="f_alternative"></div>
<div class="field"><label><input type="checkbox" id="f_dro"> DRO by design (no alternative topography trained)</label></div>
<div class="field">Measurement dimension <select id="f_dimension"><option value="">(choose)</option><option>count</option><option>duration</option><option>latency</option><option>percent intervals</option><option>rate</option></select></div>
<div class="field">Integrity-probe plan <input type="text" id="f_integrity"></div>
<h2>Risks and handling (at least two)</h2>
<div class="field">Risk 1 <input type="text" id="f_risk1"> Handling 1 <input type="text" id="f_handling1"></div>
<div class="field">Risk 2 <input type="text" id="f_risk2"> Handling 2 <input type="text" id="f_handling2"></div>
<div class="field">Risk 3 (optional) <input type="text" id="f_risk3"> Handling 3 (optional) <input type="text" id="f_handling3"></div>
<h2>Parameter defenses (1-2 sentences each)</h2>
<div class="field">Target defense <textarea id="f_def_target"></textarea></div>
<div class="field">Reinforcer defense <textarea id="f_def_reinforcer"></textarea></div>
<div class="field">Schedule defense <textarea id="f_def_schedule"></textarea></div>
<div class="field">Extinction defense <textarea id="f_def_extinction"></textarea></div>
<div class="field">Alternative defense <textarea id="f_def_alternative"></textarea></div>
<div class="field">Measurement defense <textarea id="f_def_measurement"></textarea></div>
<button onclick="scoreNow()">Run mechanical checks</button>
<div id="results"></div>
<div class="boundary">These are MECHANICAL completeness checks only. They are not rubric v0.4.1 row scores and say nothing about clinical adequacy or competence.</div>
<h2>What these checks don't cover</h2>
<div class="human">Use this list to review your own answer: Is the procedure complete and clearly written? Does each defense hold against the assessed function? Is the procedure choice right, including a correct DRO with no alternative? Are the risks specific and the handling plans real? Is the measurement plan appropriate, including the integrity probes? The automatic checks above cannot judge any of these.</div>
<script>
// P2 procedure-spec PRE-FLIGHT mechanical completeness checker (JS port of p2s_scorer.py).
// MECHANICAL presence/consistency checks only - NOT rubric v0.4.1 scores, no clinical-adequacy claim.
const P2_DIMENSIONS = ["count", "duration", "latency", "percent intervals", "rate"];
function score(sub) {
  const out = {};
  const missing = [];
  for (const f of ["target", "reinforcer", "schedule", "measurement_dimension", "integrity_plan"]) {
    const v = sub[f];
    if (typeof v !== 'string' || !v.trim()) missing.push(f);
  }
  const alt = sub.alternative, dro = sub.dro_declared === true;
  if ((typeof alt !== 'string' || !alt.trim()) && !dro) missing.push("alternative (or declare DRO-by-design)");
  out.m1_complete = missing.length
    ? ["FAIL", "required field(s) empty: " + missing.join(", ")]
    : ["PASS", "all required fields present (incl. alternative named or DRO declared)"];
  const sched = sub.schedule, detail = sub.schedule_detail;
  out.m2_schedule_detail = (typeof sched === 'string' && sched.trim() && typeof detail === 'string' && detail.trim())
    ? ["PASS", "schedule named with density/thinning detail stated"]
    : ["FAIL", "schedule or its density/thinning detail missing"];
  const risks = sub.risks;
  let nOk = 0;
  if (Array.isArray(risks)) for (const r of risks) {
    if (r && typeof r.risk === 'string' && r.risk.trim() && typeof r.handling === 'string' && r.handling.trim()) nOk++;
  }
  out.m3_risks = (Array.isArray(risks) && nOk >= 2)
    ? ["PASS", \`\${nOk} risk entries each with handling (breadth convention: at least two)\`]
    : ["FAIL", \`only \${nOk} risk entr\${nOk===1?'y':'ies'} with both risk and handling (need at least two)\`];
  const dim = sub.measurement_dimension, integ = sub.integrity_plan;
  if (P2_DIMENSIONS.includes(dim) && typeof integ === 'string' && integ.trim())
    out.m4_measurement_integrity = ["PASS", \`dimension '\${dim}' named and integrity-probe plan present\`];
  else if (P2_DIMENSIONS.includes(dim))
    out.m4_measurement_integrity = ["FAIL", "dimension named but no integrity-probe plan"];
  else
    out.m4_measurement_integrity = ["FAIL", \`measurement dimension missing or unrecognized: \${JSON.stringify(dim === undefined ? null : dim)}\`];
  const defenses = sub.defenses;
  const need = ["target", "reinforcer", "schedule", "extinction", "measurement"];
  if (!dro) need.push("alternative");
  let undef = [];
  if (!defenses || typeof defenses !== 'object') undef = need.slice();
  else for (const k of need) { const v = defenses[k]; if (typeof v !== 'string' || !v.trim()) undef.push(k); }
  out.m5_defenses_present = undef.length
    ? ["FAIL", "no defense text for: " + undef.join(", ") + " (presence only; defense quality is not checked in this mode)"]
    : ["PASS", "defense text present for every stipulated parameter (presence only; not checked in this mode)"];
  out._boundary = ["NOTE", "Mechanical completeness checks only - they do not assess clinical quality. Clinical quality is not reviewed in this self-practice mode."];
  return out;
}
if (typeof module !== 'undefined') module.exports = { score };

function val(id){ return document.getElementById(id).value; }
function buildSubmission(){
  const risks=[];
  for(const i of [1,2,3]){ const r=val('f_risk'+i), h=val('f_handling'+i); if(r.trim()||h.trim()) risks.push({risk:r,handling:h}); }
  return { target: val('f_target'), reinforcer: val('f_reinforcer'), schedule: val('f_schedule'),
    schedule_detail: val('f_schedule_detail'), extinction: val('f_extinction'), alternative: val('f_alternative'),
    dro_declared: document.getElementById('f_dro').checked, measurement_dimension: val('f_dimension'),
    integrity_plan: val('f_integrity'), risks: risks,
    defenses: { target: val('f_def_target'), reinforcer: val('f_def_reinforcer'), schedule: val('f_def_schedule'),
      extinction: val('f_def_extinction'), alternative: val('f_def_alternative'), measurement: val('f_def_measurement') } };
}
function scoreNow(){
  const sub=buildSubmission(); const res=score(sub);
  let h='<b>Mechanical pre-flight checks:</b><br>';
  for(const [row,[sc,why]] of Object.entries(res)){
    const cls = sc==='PASS'?'pass':sc==='FAIL'?'fail':'note';
    h+='<span class="'+cls+'"><b>'+row+': '+sc+'</b></span> - '+why+'<br>';
  }
  h+='<div style="margin-top:8px;font-size:13px"><b>No one reviews this submission. Use it to check your own work.</b></div>';
  document.getElementById('results').innerHTML=h;
}

<\/script></body></html>
`;export{e as default};
