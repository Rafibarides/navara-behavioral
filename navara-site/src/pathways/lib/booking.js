// 1:1 booking. The private Calendly URLs never ship to the browser and are not
// readable through the API: they sit in a no-policy table, and the only way out
// is the get_booking_url RPC, which verifies the member (JWT -> plan 'guided',
// matching track) and spends one session credit server-side before returning it.
// Demo mode: returns null, and the Book page shows the placeholder modal.
import { DEMO } from '../config';
import { getClient } from './db';

export async function requestBookingUrl(track) {
  if (DEMO) return null;
  const sb = await getClient();
  const { data, error } = await sb.rpc('get_booking_url', { p_track: track });
  if (error || !data) return null; // not guided / no credits / error: UI explains via modal
  return data;
}
