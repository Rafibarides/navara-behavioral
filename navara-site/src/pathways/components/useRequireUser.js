import { useEffect, useState } from 'react';
import { currentUser, signInDemo, getSessionUser } from '../lib/auth';

// App pages need a session. ?demo=1 signs into the demo account; otherwise
// resolve the live Supabase session, bouncing to login when there is none.
export function useRequireUser() {
  const [user, setUser] = useState(currentUser());
  useEffect(() => {
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
    return () => { live = false; };
  }, []);
  return user;
}
