import React, { useState } from 'react';
import { signOut } from '../lib/auth';
import ArcMark from './ArcMark';
import{getSessionUser}from'../lib/auth';
import { GUIDED_PRODUCTION } from '../lib/guidedBooking';

const ITEMS = [
  ['dashboard', 'Dashboard'], ['practice', 'Practice'], ['timed-sets', 'Timed practice'],
  ['account', 'Account'],
];
const logout = (e) => {
  e.preventDefault();
  signOut().then(() => { window.location.replace('/pathways/login?mode=signin&signedout=1'); })
    .catch(() => { alert('Sign-out did not complete. Check your connection and try again.'); });
};

export default function AppNav({ active, role }) {
  const [open, setOpen] = useState(false);const[threadEligible,setThreadEligible]=useState(false);React.useEffect(()=>{let active=true;getSessionUser().then(u=>{if(active)setThreadEligible(!!u&&!u.demo&&u.plan==='guided'&&u.track==='rbt')}).catch(()=>{});return()=>{active=false}},[]);
  const learningItems=import.meta.env.VITE_LEARNING_THREAD_CANDIDATE==='true'&&threadEligible?[...ITEMS,['learning-thread','Learning Thread']]:ITEMS;const baseItems=GUIDED_PRODUCTION?[...learningItems,['book','Coaching']]:learningItems;
  const items = role === 'admin' ? [...baseItems, ['admin', 'Admin'], ...(GUIDED_PRODUCTION?[['coaching-staff','Coaching staff']]:[])] : baseItems;
  return (
    <div className="pw-unified pw-app">
      <div className="pw-subnav">
        <div className="wrap pw-subnav-inner">
          <a className="pw-subnav-tag" href="/pathways/app/dashboard"><ArcMark />Pathways</a>
          <div className="pw-subnav-links">
            {items.map(([id, label]) => (
              <a key={id} href={'/pathways/app/' + id}
                 style={id === active ? { color: '#fff', borderBottom: '2px solid var(--sage)' } : undefined}>{label}</a>
            ))}
            <a className="btn btn-ghost btn-sm" href="/pathways/login" onClick={logout}>Log out</a>
          </div>
          <button className="pw-mmenu-btn" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}</button>
        </div>
        {open && (
          <div className="pw-mmenu">
            {items.map(([id, label]) => (
              <a key={id} href={'/pathways/app/' + id} style={id === active ? { color: '#fff', fontWeight: 800 } : undefined}>{label}</a>
            ))}
            <a href="/pathways/login" onClick={logout}>Log out</a>
          </div>
        )}
      </div>
    </div>
  );
}
