// Data layer: demo data now, Supabase when config is present. Schema in /supabase/schema.sql.
import { CFG, DEMO } from '../config';

let client = null;
export function getClient() {
  if (DEMO) throw new Error('Supabase not configured');
  if (!client) {
    // Loaded lazily so the demo build never ships the SDK weight.
    return import('@supabase/supabase-js').then(m => {
      client = m.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
      return client;
    });
  }
  return Promise.resolve(client);
}

export async function fetchQuestions({ track, area, limit }) {
  if (DEMO) {
    const { RBT_QUESTIONS, BCBA_QUESTIONS } = await import('../data/questions.js');
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
  return data;
}

export async function recordAttempt(attempt) {
  if (DEMO) return; // demo does not persist
  const sb = await getClient();
  const { error } = await sb.from('attempts').insert(attempt);
  if (error) throw error;
}

export async function sessionCredits() {
  if (DEMO) return 2;
  const sb = await getClient();
  const { data, error } = await sb.from('session_credits').select('credits_remaining').single();
  if (error) throw error;
  return data?.credits_remaining ?? 0;
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
  if (DEMO) {
    const { RBT_QUESTIONS, BCBA_QUESTIONS } = await import('../data/questions.js');
    const qs = track === 'bcba' ? BCBA_QUESTIONS : RBT_QUESTIONS;
    const hit = qs.filter(q => q.opts.some((o, k) => k !== q.a && misconceptions.includes(o.misc)));
    return (hit.length ? hit : qs).slice(0, limit);
  }
  const sb = await getClient();
  const { data, error } = await sb.rpc('adaptive_set', { p_track: track, p_tags: misconceptions, p_limit: limit });
  if (error) throw error;
  return data;
}
