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
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(toQuiz);
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
    const { data, error } = await sb.from('attempts').select('correct, questions(area)').eq('user_id', session.user.id);
    if (error) throw error;
    const agg = {};
    (data || []).forEach((r) => {
      const area = (r.questions && r.questions.area) || 'General';
      agg[area] = agg[area] || { n: 0, c: 0 };
      agg[area].n += 1;
      if (r.correct) agg[area].c += 1;
    });
    return Object.entries(agg).map(([area, v]) => ({ area, pct: Math.round((v.c / v.n) * 100), n: v.n }));
  } catch { return []; }
}

const DEMO_PATTERNS = [
  { tag: 'intervention_before_assessment', plain: 'Picks the intervention before the assessment', n: 6, trend: 'improving', areas: 'Behavior Reduction, Skill Acquisition', pressure: false },
  { tag: 'confuses_latency_with_duration', plain: 'Confuses latency with duration', n: 4, trend: 'steady', areas: 'Measurement', pressure: true },
  { tag: 'rapport_over_ethics', plain: 'Lets rapport override an ethics boundary', n: 2, trend: 'new', areas: 'Professional Conduct', pressure: false },
];

// Specialist view: internal only. Live mode is gated on profiles.role = 'staff'.
export async function fetchPatterns(userId) {
  if (DEMO) return DEMO_PATTERNS;
  const sb = await getClient();
  const { data, error } = await sb.from('pattern_summary').select('*').eq('user_id', userId);
  if (error) throw error;
  return data;
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
