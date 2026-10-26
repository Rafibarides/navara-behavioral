import { getClient } from './db';
// Explicit approved endpoint only. Never falls back to legacy get_booking_url.
export const GUIDED_PRODUCTION=import.meta.env.VITE_GUIDED_BOOKING_PRODUCTION === 'true';
const endpoint=GUIDED_PRODUCTION?'https://tvvoauvtrgziwxtzlluq.supabase.co/functions/v1/guided-member':import.meta.env.VITE_GUIDED_BOOKING_ENDPOINT;
export function guidedBookingConfigured(){return !!endpoint;}
export async function guidedRequest(action,body={}){
 if(endpoint&&new URL(endpoint).protocol!=='https:')throw Error('Secure booking endpoint required.');
 if(!endpoint)throw Error('Booking is not enabled here. No session has been used.');
 const sb=await getClient(),{data:{session}}=await sb.auth.getSession();
 if(!session)throw Error('Sign in to view your session.');
 const response=await fetch(endpoint,{method:'POST',redirect:'error',headers:{apikey:(await import('../config')).CFG.supabaseAnonKey,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({action,...body})});
 let result;try{result=await response.json()}catch{throw Error('We could not read the booking status. Keep this request and check it again before booking.');}
 if(!response.ok)throw Error(result.message||result.error||'We could not verify this booking. No new booking will be started.');
 return result;
}
