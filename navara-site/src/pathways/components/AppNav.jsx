import React, { useEffect, useState } from 'react';
import { Arcs } from './Chrome';
import { signOut } from '../lib/auth';

const ITEMS = [
  ['dashboard', 'Dashboard'], ['practice', 'Practice'], ['mock', 'Timed sets'],
  ['book', 'Book a 1:1'], ['account', 'Account'],
];
const logout = (e) => {
  e.preventDefault();
  signOut().then(() => { window.location.href = '/pathways/login'; })
    .catch(() => { alert('Sign-out did not complete. Check your connection and try again.'); });
};

export default function AppNav({ active, role }) {
  const v2 = true;
  const items = role === 'admin' ? [...ITEMS, ['admin', 'Admin']] : ITEMS;
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const on = () => setIsMobile(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return (
    <nav className={'nav app-nav' + (v2 ? ' v2' : '')} style={{ position: 'sticky' }}>
      <div className="wrap nav-inner">
        <a className="brand" href="/pathways">
          <Arcs />
          <span className="brand-name">Navara<small>Pathways</small></span>
        </a>
        {isMobile ? (<>
          <button className="pw-burger" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open}
                  onClick={() => setOpen(!open)}>
            <span></span><span></span><span></span>
          </button>
          {open && (
            <div className="pw-app-menu">
              {items.map(([id, label]) => (
                <a key={id} href={'/pathways/app/' + id}
                   style={id === active ? { color: 'var(--sage)', fontWeight: 800 } : undefined}
                   onClick={() => setOpen(false)}>{label}</a>
              ))}
              <a href="/pathways/login" onClick={(e) => { setOpen(false); logout(e); }}>Log out</a>
            </div>
          )}
        </>) : (
          <div className="nav-links">
            {items.map(([id, label]) => (
              <a key={id} href={'/pathways/app/' + id}
                 style={id === active ? { color: '#fff', borderBottom: '2px solid var(--sage)' } : undefined}>{label}</a>
            ))}
            <a className="btn btn-ghost btn-sm" href="/pathways/login" onClick={logout}>Log out</a>
          </div>
        )}
      </div>
    </nav>
  );
}
