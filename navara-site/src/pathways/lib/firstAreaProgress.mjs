// Proposed reducer only. Not imported by the app, no publish.
export function firstAreaProgress(rows, {memberId, track} = {}) {
  if (!memberId || !['rbt','bcba'].includes(track)) throw new Error('member and track required');
  rows = rows.filter(r => r.user_id === memberId && r.questions?.track === track);
  const unknown = new Set(rows.filter(r => r.question_id != null && r.created_at == null).map(r=>r.question_id));
  const ordered = rows.filter(r=>r.question_id != null && !unknown.has(r.question_id)).slice().sort((a,b)=>{
    const t=Date.parse(a.created_at)-Date.parse(b.created_at);
    if (t) return t;
    const x=BigInt(a.id), y=BigInt(b.id); return x<y ? -1 : x>y ? 1 : 0;
  });
  const seen=new Set(), agg={};
  for (const r of ordered) {
    if(seen.has(r.question_id)) continue;
    seen.add(r.question_id);
    if(r.correct !== true && r.correct !== false) continue; // non-graded first row cannot promote a later retake
    const area=r.questions?.area || 'General';
    agg[area] ||= {n:0,c:0}; agg[area].n++; if(r.correct) agg[area].c++;
  }
  return Object.entries(agg).map(([area,v])=>({area,n:v.n,c:v.c,pct:Math.round(100*v.c/v.n)}));
}
