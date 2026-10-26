// Data layer: demo data now, Supabase live. Schema in /supabase/schema.sql.
import { CFG, DEMO } from '../config';

let client = null;
export function getClient() {
  if (DEMO) throw new Error('Supabase not configured');
  if (!client) {
    return import('@supabase/supabase-js').then(m => {
      client = m.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
      return client;
    });
  }
  return Promise.resolve(client);
}

// Map a bank row to the Quiz component's shape.
export function toQuiz(q) {
  return {
    id: q.id,
    area: q.area,
    q: q.body,
    a: q.answer,
    opts: q.options.map((o) => ({
      t: o.text,
      exp: o.explanation,
      why: o.explanation,
      tempt: o.why_tempting,
      conf: o.confuses_with,
      rem: (o.remediation_pointer || '').replace(/^review\s+/i, '') || null,
      misc: o.misconception_tag,
    })),
  };
}

export async function fetchQuestions({ track, area, limit }) {
  const { RBT_QUESTIONS, BCBA_QUESTIONS } = await import('../data/questions.js');
  if (DEMO) {
    let qs = track === 'bcba' ? BCBA_QUESTIONS : RBT_QUESTIONS;
    if (area) qs = qs.filter(q => q.area === area);
    return qs.slice(0, limit || qs.length);
  }
  const sb = await getClient();
  let q = sb.from('questions').select('*').eq('track', track).eq('published', true);
  if (area) q = q.eq('area', area);
  if (limit) {
    // Vary which questions come first: start from a random point in the bank, then shuffle the page.
    let offset = 0;
    try {
      let c = sb.from('questions').select('id', { count: 'exact', head: true }).eq('track', track).eq('published', true);
      if (area) c = c.eq('area', area);
      const { count } = await c;
      if (count && count > limit) offset = Math.floor(Math.random() * (count - limit + 1));
    } catch { /* fall back to the first page */ }
    q = q.order('id', { ascending: true }).range(offset, offset + limit - 1);
  }
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data || []).slice();
  if (limit) for (let i = rows.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rows[i], rows[j]] = [rows[j], rows[i]]; }
  return rows.map(toQuiz);
}

// Sample bank (bundled, clearly labeled) - used as fallback before the live
// bank clears clinical review.
export async function fetchSample({ track, limit = 10, skip = 0 }) {
  const { RBT_QUESTIONS, BCBA_QUESTIONS } = await import('../data/questions.js');
  const qs = track === 'bcba' ? BCBA_QUESTIONS : RBT_QUESTIONS;
  return qs.slice(skip, skip + limit);
}

export async function recordAttempt({ questionId = null, area = null, chosenOption = null, correct, misconception = null, confusesWith = null, ms = null, kind = 'practice' }) {
  if (DEMO) return;
  try {
    const sb = await getClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return; // anonymous sample-quiz attempts are not persisted
    const { error } = await sb.from('attempts').insert({
      user_id: session.user.id,
      question_id: questionId,
      correct,
      kind,
      chosen_option: chosenOption,
      misconception,
      confuses_with: confusesWith,
      ms,
    });
    if (error) throw error;
  } catch { /* telemetry must never break the quiz */ }
}

export async function sessionCredits() {
  if (DEMO) return 2;
  try {
    const sb = await getClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return 0;
    const { data } = await sb.from('session_credits').select('credits_remaining').eq('user_id', session.user.id).single();
    return data ? data.credits_remaining : 0;
  } catch { return 0; }
}

// Correct-rate per content area from the member's own attempts.
export async function fetchAreaProgress() {
  if (DEMO) return null;
  try {
    const sb = await getClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return [];
    const { data, error } = await sb.from('attempts').select('question_id, correct, created_at, questions(area)').eq('user_id', session.user.id).order('created_at', { ascending: true });
    if (error) throw error;
    const agg = {};
    const seen = new Set();
    (data || []).forEach((r) => {
      // First response per bank question only - retakes are practice, not fresh
      // evidence (same rule as member_evidence). Sample-bank answers carry no
      // question id and are excluded: placeholders, not exam-bank items.
      if (r.question_id == null || seen.has(r.question_id)) return;
      seen.add(r.question_id);
      const area = (r.questions && r.questions.area) || 'General';
      agg[area] = agg[area] || { n: 0, c: 0 };
      agg[area].n += 1;
      if (r.correct) agg[area].c += 1;
    });
    return Object.entries(agg).map(([area, v]) => ({ area, pct: Math.round((v.c / v.n) * 100), n: v.n }));
  } catch { return []; }
}

const DEMO_PATTERNS = [
  { tag: 'intervention_before_assessment', plain: 'Picks the intervention before the assessment', n: 6, trend: 'improving', areas: 'Behavior Reduction, Behavior Acquisition', pressure: false },
  { tag: 'confuses_latency_with_duration', plain: 'Confuses latency with duration', n: 4, trend: 'steady', areas: 'Data Collection and Graphing', pressure: true },
  { tag: 'rapport_over_ethics', plain: 'Lets rapport override an ethics boundary', n: 2, trend: 'new', areas: 'Ethics', pressure: false },
];

// Specialist view: internal only. Live mode is gated on profiles.role = 'staff'.
export async function fetchPatterns(userId) {
  if (DEMO) return DEMO_PATTERNS;
  const sb = await getClient();
  const { data, error } = await sb.from('pattern_summary').select('*').eq('user_id', userId);
  if (error) throw error;
  return data;
}

// Member pattern evidence: rolling 30 days, first responses only, fail-closed
// server-side (nothing returns until a tag has 2+ misses on 2+ distinct questions).
const DEMO_EVIDENCE = [
  { tag: 'intervention_before_assessment', label: 'functional assessment', misses: 4, items: 3, days: 2, opportunities: 5, miss_rate: 80, areas: ['Behavior Assessment'], last_seen: null, status: 'emerging' },
  { tag: 'confuses_latency_with_duration', label: 'duration', misses: 3, items: 2, days: 2, opportunities: 4, miss_rate: 75, areas: ['Data Collection and Graphing'], last_seen: null, status: 'emerging' },
];
export { DEMO_EVIDENCE };

export async function fetchMemberEvidence() {
  if (DEMO) return DEMO_EVIDENCE;
  try {
    const sb = await getClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return [];
    const { data, error } = await sb.rpc('member_evidence');
    if (error) throw error;
    return data || [];
  } catch { return []; }
}

// Review mode: the exact first-response questions the member missed on a tag (rolling 30d),
// most recent first. Observed history only - same evidence class as member_evidence.
export async function fetchMissedQuestions(tag) {
  if (DEMO) return [];
  const sb = await getClient();
  const { data, error } = await sb.rpc('member_missed_questions', { p_tag: tag });
  if (error) throw error;
  const ids = (data || []).map((r) => r.question_id);
  if (!ids.length) return [];
  const { data: qs, error: qErr } = await sb.from('questions').select('*').in('id', ids).eq('published', true);
  if (qErr) throw qErr;
  const byId = Object.fromEntries((qs || []).map((q) => [q.id, q]));
  return ids.map((id) => byId[id]).filter(Boolean).map(toQuiz);
}

// Owner console: per-track misconception coverage for the content audit.
export async function fetchTagCoverage() {
  if (DEMO) return [];
  const sb = await getClient();
  const { data, error } = await sb.rpc('admin_tag_coverage');
  if (error) throw error;
  return data || [];
}

// Adaptive practice: next set targets the member's active misconceptions.
export async function fetchAdaptiveSet({ track, misconceptions, limit = 10 }) {
  const { RBT_QUESTIONS, BCBA_QUESTIONS } = await import('../data/questions.js');
  if (DEMO) {
    const qs = track === 'bcba' ? BCBA_QUESTIONS : RBT_QUESTIONS;
    const hit = qs.filter(q => q.opts.some((o, k) => k !== q.a && misconceptions.includes(o.misc)));
    return (hit.length ? hit : qs).slice(0, limit);
  }
  const sb = await getClient();
  const { data, error } = await sb.rpc('adaptive_set', { p_track: track, p_tags: misconceptions, p_limit: limit });
  if (error) throw error;
  return (data || []).map(toQuiz);
}

// Join the enrollment waitlist (anon insert; RLS allows insert-only).
export async function joinWaitlist({ email, track, plan }) {
  const sb = await getClient();
  const { error } = await sb.from('waitlist').insert({ email, track, plan });
  if (error) throw error;
}
