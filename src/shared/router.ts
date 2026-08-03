import { useEffect, useState } from 'react';

export type ViewId = 'foundry' | 'waterworks';

/**
 * Parse a location hash into a view id. Tolerates a missing leading slash,
 * mixed case, and a trailing query string. Anything unrecognised falls back
 * to the foundry, which is the view that existed first.
 */
export function parseRoute(hash: string): ViewId {
  const clean = hash.replace(/^#\/?/, '').split('?')[0].trim().toLowerCase();
  return clean === 'waterworks' ? 'waterworks' : 'foundry';
}

/** Current view, kept in sync with the address bar. */
export function useRoute(): ViewId {
  const [view, setView] = useState<ViewId>(() =>
    typeof window === 'undefined' ? 'foundry' : parseRoute(window.location.hash),
  );

  useEffect(() => {
    const onHashChange = () => setView(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return view;
}
