// NEW reconstruction, 2026-10-26. Not the missing overnight adapter bytes.
export async function evidenceState(user, load) {
  if (!user?.id) return { status: 'unavailable', rows: [], error: new Error('Sign-in required') };
  if (user.trackSet === false || !['rbt', 'bcba'].includes(user.track)) return { status: 'track_required', rows: [] };
  try {
    const result = await load();
    if (result?.error) throw result.error;
    const rows = Array.isArray(result) ? result : result?.data;
    if (!Array.isArray(rows)) throw new Error('Invalid evidence response');
    return { status: rows.length ? 'ready' : 'empty', rows };
  } catch (error) { return { status: 'unavailable', rows: [], error }; }
}
