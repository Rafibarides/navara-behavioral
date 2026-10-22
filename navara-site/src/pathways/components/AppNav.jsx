import React, { useState } from 'react';
import MainSiteNav from '../../Components/NavBarMenu';
import { signOut } from '../lib/auth';

const ITEMS = [
  ['dashboard', 'Dashboard'], ['practice', 'Practice'], ['mock', 'Timed sets'],
  ['book', 'Book a 1:1'], ['account', 'Account'],
];
const logout = (e) => {
  e.preventDefault();
  signOut().then(() => { window.location.replace('/pathways/login'); })
    .catch(() => { alert('Sign-out did not complete. Check your connection and try again.'); });
};

export default function AppNav({ active, role }) {
  const [open, setOpen] = useState(false);
  const items = role === 'admin' ? [...ITEMS, ['admin', 'Admin']] : ITEMS;
  return (
    <div className="pw-unified pw-app">
      <MainSiteNav isDarkMode={false} forceSolidPill />
      <div className="pw-subnav">
        <div className="wrap pw-subnav-inner">
          <a className="pw-subnav-tag" href="/pathways/app/dashboard">Pathways</a>
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
