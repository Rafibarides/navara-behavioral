// Data layer: demo data now, Supabase live. Schema in /supabase/schema.sql.
import { CFG, DEMO } from '../config';
import { evidenceState } from './evidenceState.mjs';
import { firstAreaProgress } from './firstAreaProgress.mjs';

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
// Candidate loader: one response must contain every counted row or we refuse partial progress.
// This is NOT a server snapshot/version-provenance or timestamp-authenticity repair.
export async function fetchAreaProgressState(user) {
  return evidenceState(user, async () => {
    const sb = await getClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session || session.user.id !== user.id) throw new Error('Session changed');
    const { data, error, count } = await sb.from('attempts')
      .select('id,user_id,question_id,correct,created_at,questions(area,track)', { count: 'exact' })
      .eq('user_id', user.id).order('created_at', { ascending: true }).order('id', { ascending: true });
    if (error) throw error;
    if (!Array.isArray(data) || !Number.isSafeInteger(count) || count !== data.length) throw new Error('Complete history unavailable');
    return firstAreaProgress(data, { memberId: user.id, track: user.track });
  });
}

// Legacy callers retain the original contract; Dashboard uses the explicit-state API.
export async function fetchAreaProgress() {
  if (DEMO) return null;
  const sb = await getClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('Sign-in required');
  const { data, error } = await sb.from('profiles').select('track').eq('id', session.user.id).single();
  if (error) throw error;
  const state = await fetchAreaProgressState({ id: session.user.id, track: data?.track });
  if (state.status === 'unavailable') throw state.error;
  return state.rows;
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
  // Matches the RBT sample bank: three questions carry this assigned option tag.
  // Live member_evidence counts first responses only (one row per question), so
  // misses always equals items. Verified against the function's exact SQL:
  // 3 missed first responses over 2 days + 2 correct on questions carrying the
  // tag on a wrong option -> misses 3, items 3, days 2, opportunities 5,
  // miss_rate 60, status emerging (opportunities < 6 keeps it out of recurring).
  { tag: 'procedure_name_swap', label: 'procedure names', misses: 3, items: 3, days: 2, opportunities: 5, miss_rate: 60, areas: ['Behavior Acquisition', 'Behavior Reduction'], last_seen: null, status: 'emerging' },
];
export { DEMO_EVIDENCE };

export async function fetchMemberEvidence() {
  if (DEMO) return DEMO_EVIDENCE;
  const sb = await getClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('Sign-in required');
  const { data, error } = await sb.rpc('member_evidence');
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error('Invalid evidence response');
  return data;
}
export async function fetchMemberEvidenceState(user) {
  return evidenceState(user, async () => {
    const sb = await getClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session || session.user.id !== user.id) throw new Error('Session changed');
    return sb.rpc('member_evidence');
  });
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
