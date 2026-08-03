import type { ViewId } from '../shared/router';

/**
 * Corner affordance between the two explainers. Deliberately not a tab —
 * spec §8: a tab implies they are panes of one thing; they are two
 * experiences of the same content.
 */
export default function ViewSwitch({ current }: { current: ViewId }) {
  const other: ViewId = current === 'waterworks' ? 'foundry' : 'waterworks';
  const label = other === 'waterworks' ? 'The Waterworks' : 'The Foundry';

  return (
    <a
      href={`#/${other}`}
      className="pointer-events-auto absolute bottom-5 right-5 z-20 rounded-sm border border-black/20 bg-white/70 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-black/70 backdrop-blur-sm transition-colors hover:bg-white/90 hover:text-black"
    >
      {label} →
    </a>
  );
}
