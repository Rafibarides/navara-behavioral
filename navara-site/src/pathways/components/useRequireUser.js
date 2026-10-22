import { useEffect, useState } from 'react';
import { currentUser, signInDemo, getSessionUser } from '../lib/auth';

// App pages need a session. ?demo=1 signs into the demo account; otherwise
// resolve the live Supabase session, bouncing to login when there is none.
export function useRequireUser() {
  const [user, setUser] = useState(currentUser());
  useEffect(() => {
    // Back-button / bfcache: a restored page must re-prove its session.
    const onShow = (e) => {
      if (!e.persisted) return;
      getSessionUser().then((u) => { if (!u) window.location.replace('/pathways/login'); }).catch(() => window.location.replace('/pathways/login'));
    };
    window.addEventListener('pageshow', onShow);
    if (user) return;
    if (new URLSearchParams(window.location.search).get('demo') === '1') {
      setUser(signInDemo());
      return;
    }
    let live = true;
    getSessionUser().then((u) => {
      if (!live) return;
      if (u) setUser(u);
      else window.location.href = '/pathways/login';
    }).catch(() => { if (live) window.location.href = '/pathways/login'; });
    return () => { live = false; window.removeEventListener('pageshow', onShow); };
  }, []);
  return user;
}
