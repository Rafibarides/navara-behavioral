import React from 'react';
import { Arcs } from './Chrome';
import { signOut } from '../lib/auth';

const ITEMS = [
  ['dashboard', 'Dashboard'], ['practice', 'Practice'], ['mock', 'Timed sets'],
  ['book', 'Book a 1:1'], ['account', 'Account'],
];
export default function AppNav({ active, role }) {
  const v2 = true;
  const items = role === 'admin' ? [...ITEMS, ['admin', 'Admin']] : ITEMS;
  return (
    <nav className={'nav app-nav' + (v2 ? ' v2' : '')} style={{ position: 'sticky' }}>
      <div className="wrap nav-inner">
        <a className="brand" href="/pathways">
          <Arcs />
          <span className="brand-name">Navara<small>Pathways</small></span>
        </a>
        <div className="nav-links">
          {items.map(([id, label]) => (
            <a key={id} href={'/pathways/app/' + id}
               style={id === active ? { color: '#fff', borderBottom: '2px solid var(--sage)' } : undefined}>{label}</a>
          ))}
          <a className="btn btn-ghost btn-sm" href="/pathways/login"
             onClick={(e) => { e.preventDefault(); signOut().then(() => { window.location.href = '/pathways/login'; }); }}>Log out</a>
        </div>
      </div>
    </nav>
  );
}
