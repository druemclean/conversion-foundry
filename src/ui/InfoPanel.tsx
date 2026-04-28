import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useSelection } from '../state/selection';
import { getStation } from '../data/stations';

export default function InfoPanel() {
  const { state, select } = useSelection();
  const station = getStation(state.selectedId);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') select(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [select]);

  return (
    <AnimatePresence>
      {station && (
        <motion.aside
          key={station.id}
          initial={{ x: 64, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 64, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 220, mass: 0.8 }}
          className="pointer-events-auto absolute right-6 top-1/2 z-30 w-[420px] max-w-[92vw] -translate-y-1/2"
          aria-modal="false"
          role="complementary"
        >
          <div
            className="relative overflow-hidden rounded-2xl border border-white/10"
            style={{
              background: 'rgba(13, 20, 36, 0.82)',
              backdropFilter: 'blur(22px) saturate(135%)',
              WebkitBackdropFilter: 'blur(22px) saturate(135%)',
              boxShadow:
                '0 20px 60px -20px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1) inset',
            }}
          >
            {/* Accent stripe */}
            <div
              className="absolute left-0 top-0 h-full w-[3px]"
              style={{ background: station.accent, boxShadow: `0 0 18px ${station.accent}` }}
            />

            {/* Close button */}
            <button
              onClick={() => select(null)}
              aria-label="Close panel"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/10 text-ink-dim transition hover:border-white/30 hover:text-ink"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1.5 1.5L12.5 12.5M12.5 1.5L1.5 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>

            <div className="p-7 pl-9">
              <div
                className="font-mono uppercase text-ink-dim"
                style={{ fontSize: '10px', letterSpacing: '0.22em', color: station.accent }}
              >
                {station.categoryLabel} · {station.tag}
              </div>

              <h2
                className="mt-3 font-serif text-ink"
                style={{ fontSize: '32px', lineHeight: 1.05, letterSpacing: '-0.01em' }}
              >
                {station.name}
              </h2>

              <p className="mt-4 text-ink-dim" style={{ fontSize: '14px', lineHeight: 1.55 }}>
                {station.fn}
              </p>

              <div className="mt-6">
                <div
                  className="font-mono uppercase text-ink-dim"
                  style={{ fontSize: '10px', letterSpacing: '0.22em' }}
                >
                  Flow
                </div>
                <ul className="mt-3 space-y-2">
                  {station.flow.map(([k, v]) => (
                    <li key={k} className="flex items-baseline gap-3">
                      <span
                        className="shrink-0 font-mono text-ink"
                        style={{ fontSize: '11px', letterSpacing: '0.06em' }}
                      >
                        {k}
                      </span>
                      <span
                        className="text-ink-dim"
                        style={{ fontSize: '13px', lineHeight: 1.45 }}
                      >
                        {v}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className="mt-6 rounded-lg border border-white/5 p-4"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div
                  className="font-mono uppercase text-ink-dim"
                  style={{ fontSize: '10px', letterSpacing: '0.22em' }}
                >
                  Takeaway
                </div>
                <p
                  className="mt-2 text-ink"
                  style={{ fontSize: '14px', lineHeight: 1.5, fontStyle: 'italic' }}
                >
                  {station.takeaway}
                </p>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
