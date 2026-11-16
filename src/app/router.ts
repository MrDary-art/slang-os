import { useEffect, useState } from 'react';
export const go = (path: string) => { window.location.hash = path; };
export function useRoute() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || '/');
  useEffect(() => {
    function change() { setRoute(window.location.hash.slice(1) || '/'); window.scrollTo(0, 0); }
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  return route;
}
