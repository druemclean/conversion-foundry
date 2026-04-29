import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSelection } from '../state/selection';
import { TOUR_STOPS, TOUR_AUTO_ADVANCE_MS } from '../data/tour';
import { getStation } from '../data/stations';

export default function SideRail() {
  const { state, tourStart, tourStop, tourGoto } = useSelection();
  const { tour } = state;

  // Auto-advance: every TOUR_AUTO_ADVANCE_MS, step forward; stop when last.
  useEffect(() => {
    if (!tour.active) return;
    if (tour.index >= TOUR_STOPS.length - 1) {
      // Last stop: hold here, don't auto-stop, so the user can read.
      return;
    }
    const timer = setTimeout(() => {
      tourGoto(tour.index + 1);
    }, TOUR_AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [tour.active, tour.index, tourGoto]);

  // Keyboard nav while tour is active: arrow keys to step.
  useEffect(() => {
    if (!tour.active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        tourGoto(Math.min(tour.index + 1, TOUR_STOPS.length - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        tourGoto(Math.max(tour.index - 1, 0));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tour.active, tour.index, tourGoto]);

  const currentStop = tour.active ? TOUR_STOPS[tour.index] : null;

  return (
    <aside
      className="side-rail pointer-events-auto absolute left-8 z-20 w-[280px]"
      style={{ top: 220 }}
    >
      <div className="hud-plate" style={{ padding: 18 }}>
        {/* Header — toggles between "Follow an event" CTA and tour controls */}
        <AnimatePresence mode="wait" initial={false}>
          {!tour.active ? (
            <motion.div
              key="cta"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
            >
              <button
                onClick={tourStart}
                className="group flex w-full items-center justify-between gap-3 rounded-md border border-white/10 px-3 py-2 text-left transition hover:border-white/30"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <span className="flex items-center gap-3">
                  <PlayGlyph />
                  <span>
                    <span
                      className="block font-mono uppercase text-ink-dim"
                      style={{ fontSize: '10px', letterSpacing: '0.22em' }}
                    >
                      Guided
                    </span>
                    <span className="block font-serif text-ink" style={{ fontSize: '17px' }}>
                      Follow an event
                    </span>
                  </span>
                </span>
                <span className="font-mono text-ink-dim opacity-60 group-hover:opacity-100" style={{ fontSize: '10px' }}>
                  {TOUR_STOPS.length} stops
                </span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="font-mono uppercase"
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.22em',
                    color: getStation(currentStop?.id ?? null)?.accent ?? 'var(--ink-dim)',
                  }}
                >
                  Step {tour.index + 1} / {TOUR_STOPS.length}
                </div>
                <button
                  onClick={tourStop}
                  aria-label="Exit guided tour"
                  className="rounded-md border border-white/10 px-2 py-1 font-mono uppercase text-ink-dim transition hover:border-white/30 hover:text-ink"
                  style={{ fontSize: '10px', letterSpacing: '0.18em' }}
                >
                  Exit
                </button>
              </div>
              {/* Prev / Next */}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => tourGoto(tour.index - 1)}
                  disabled={tour.index === 0}
                  aria-label="Previous step"
                  className="flex-1 rounded-md border border-white/10 px-2 py-1.5 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowGlyph dir="left" />
                </button>
                <button
                  onClick={() => tourGoto(tour.index + 1)}
                  disabled={tour.index === TOUR_STOPS.length - 1}
                  aria-label="Next step"
                  className="flex-1 rounded-md border border-white/10 px-2 py-1.5 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowGlyph dir="right" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stops list */}
        <ol className="mt-5 space-y-1">
          {TOUR_STOPS.map((stop, i) => {
            const station = getStation(stop.id);
            const isCurrent = tour.active && i === tour.index;
            const isVisited = tour.active && i < tour.index;
            return (
              <li key={stop.id}>
                <button
                  onClick={() => tourGoto(i)}
                  className="flex w-full items-center gap-3 rounded-sm py-1.5 pl-1 pr-2 text-left transition hover:bg-white/[0.04]"
                >
                  {/* Stop dot */}
                  <span
                    className="grid h-3 w-3 shrink-0 place-items-center rounded-full"
                    style={{
                      background: isCurrent
                        ? station?.accent ?? '#fff'
                        : isVisited
                          ? 'rgba(255,255,255,0.45)'
                          : 'transparent',
                      boxShadow: isCurrent ? `0 0 10px ${station?.accent}` : undefined,
                      border: '1px solid rgba(255,255,255,0.18)',
                    }}
                  />
                  <span
                    className="font-mono uppercase transition"
                    style={{
                      fontSize: '11px',
                      letterSpacing: '0.14em',
                      color: isCurrent ? '#fff' : isVisited ? 'var(--ink-dim)' : 'rgba(168, 179, 200, 0.55)',
                    }}
                  >
                    {station?.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Narrative subtitle for the current stop */}
        <AnimatePresence mode="wait">
          {currentStop && (
            <motion.p
              key={currentStop.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22 }}
              className="mt-4 border-t border-white/5 pt-3 text-ink-dim"
              style={{ fontSize: '12px', lineHeight: 1.45 }}
            >
              {currentStop.narrative}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}

function PlayGlyph() {
  return (
    <span
      className="grid h-7 w-7 place-items-center rounded-full border border-white/15"
      style={{ background: 'rgba(95, 212, 255, 0.08)' }}
    >
      <svg width="9" height="11" viewBox="0 0 9 11" fill="none">
        <path d="M0.75 0.5L8.25 5.5L0.75 10.5V0.5Z" fill="currentColor" className="text-ink" />
      </svg>
    </span>
  );
}

function ArrowGlyph({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      width="14"
      height="10"
      viewBox="0 0 14 10"
      fill="none"
      style={{
        transform: dir === 'left' ? 'scaleX(-1)' : undefined,
        margin: '0 auto',
        display: 'block',
      }}
      className="text-ink"
    >
      <path d="M1 5H13M13 5L9 1M13 5L9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
