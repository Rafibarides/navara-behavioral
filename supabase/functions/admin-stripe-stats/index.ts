// Owner-only revenue snapshot. Caller must be a signed-in user whose
// profiles.role = 'admin'. Same guard style as create-checkout-session.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
  try {
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    if (!token) return json({ error: 'missing token' }, 401)
    const url = Deno.env.get('SUPABASE_URL')!
    const ures = await fetch(url + '/auth/v1/user', {
      headers: { apikey: Deno.env.get('SUPABASE_ANON_KEY')!, Authorization: 'Bearer ' + token },
    })
    if (!ures.ok) return json({ error: 'bad token' }, 401)
    const u = await ures.json()
    const sr = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const pres = await fetch(`${url}/rest/v1/profiles?id=eq.${u.id}&select=role`, {
      headers: { apikey: sr, Authorization: 'Bearer ' + sr },
    })
    const prof = (await pres.json())[0]
    if (!prof || prof.role !== 'admin') return json({ error: 'not authorized' }, 403)

    const H = { Authorization: 'Bearer ' + Deno.env.get('STRIPE_SK')! }
    const since90 = Math.floor(Date.now() / 1000) - 90 * 86400
    const [bal, ch, subs] = await Promise.all([
      fetch('https://api.stripe.com/v1/balance', { headers: H }).then((r) => r.json()),
      fetch(`https://api.stripe.com/v1/charges?limit=100&created[gte]=${since90}`, { headers: H }).then((r) => r.json()),
      fetch('https://api.stripe.com/v1/subscriptions?limit=100&status=active', { headers: H }).then((r) => r.json()),
    ])
    const charges = ch.data || []
    const paid = charges.filter((c: any) => c.paid && !c.refunded)
    const byPrice: Record<string, { count: number; amount: number }> = {}
    for (const s of subs.data || []) {
      const p = s.items?.data?.[0]?.price
      const key = p?.nickname || p?.id || 'unknown'
      byPrice[key] = byPrice[key] || { count: 0, amount: (p?.unit_amount || 0) / 100 }
      byPrice[key].count += 1
    }
    return json({
      available_usd: (bal.available || []).filter((b: any) => b.currency === 'usd').map((b: any) => b.amount / 100)[0] ?? null,
      pending_usd: (bal.pending || []).filter((b: any) => b.currency === 'usd').map((b: any) => b.amount / 100)[0] ?? null,
      revenue_90d_usd: paid.reduce((s: number, c: any) => s + c.amount, 0) / 100,
      charges_90d: paid.length,
      active_subscriptions: (subs.data || []).length,
      subscriptions_by_price: byPrice,
      recent_charges: charges.slice(0, 15).map((c: any) => ({
        amount_usd: c.amount / 100,
        created: c.created,
        status: c.paid ? (c.refunded ? 'refunded' : 'paid') : 'failed',
        name: c.billing_details?.name || null,
      })),
    })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
