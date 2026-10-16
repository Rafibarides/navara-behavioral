import { useEffect, useState } from 'react';
import { currentUser, signIn } from '../lib/auth';

// App pages need a session. ?demo=1 signs into the demo account; otherwise bounce to login.
export function useRequireUser() {
  const [user, setUser] = useState(currentUser());
  useEffect(() => {
    if (user) return;
    if (new URLSearchParams(window.location.search).get('demo') === '1') {
      signIn().then(setUser);
    } else {
      window.location.href = '/pathways/login';
    }
  }, []);
  return user;
}
