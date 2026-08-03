import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSelection } from '../state/selection';
import { TOUR_STOPS } from '../data/tour';
import { STATIONS, getStation } from '../data/stations';

/** Stations in render order: tour path first (the eight stops, in tour order),
 *  then the four off-path stations. The order is also the visual order in
 *  the rail. */
const RAIL_ORDER = (() => {
  const tourIds = TOUR_STOPS.map((s) => s.id);
  const rest = STATIONS.map((s) => s.id).filter((id) => !tourIds.includes(id));
  return [...tourIds, ...rest];
})();

const TOUR_INDEX_BY_ID = new Map(TOUR_STOPS.map((s, i) => [s.id, i]));

export default function SideRail() {
  const { state, select, tourStart, tourStop, tourGoto } = useSelection();
  const { tour } = state;

  // The tour advances only when the viewer asks it to — Next button, arrow
  // keys, or clicking a stop in the list. No auto-advance: readers set the pace.

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

  // The rail joins the chrome only after the welcome prompt is answered —
  // before that, the prompt is the sole call to action.
  if (!state.welcomeDismissed) return null;

  function onClick(id: string) {
    const tourIdx = TOUR_INDEX_BY_ID.get(id);
    if (tour.active && tourIdx !== undefined) {
      tourGoto(tourIdx);
    } else {
      select(id);
    }
  }

  return (
    <aside
      className="side-rail pointer-events-auto absolute left-8 z-[26] w-[280px]"
      style={{ top: 104 }}
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
              {/* Prev / Next — self-paced, so Next is the hero control */}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => tourGoto(tour.index - 1)}
                  disabled={tour.index === 0}
                  aria-label="Previous step"
                  className="grid place-items-center rounded-md border border-white/10 px-3 py-1.5 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowGlyph dir="left" />
                </button>
                {tour.index < TOUR_STOPS.length - 1 ? (
                  <button
                    onClick={() => tourGoto(tour.index + 1)}
                    aria-label="Next step"
                    className="flex flex-1 items-center justify-center gap-2 rounded-md border border-white/15 px-2 py-1.5 transition hover:border-white/40"
                    style={{ background: 'rgba(95, 212, 255, 0.07)' }}
                  >
                    <span
                      className="font-mono uppercase text-ink"
                      style={{ fontSize: '10px', letterSpacing: '0.18em' }}
                    >
                      Next stop
                    </span>
                    <ArrowGlyph dir="right" />
                  </button>
                ) : (
                  <button
                    onClick={tourStop}
                    aria-label="Finish tour"
                    className="flex-1 rounded-md border border-white/15 px-2 py-1.5 font-mono uppercase text-ink transition hover:border-white/40"
                    style={{
                      fontSize: '10px',
                      letterSpacing: '0.18em',
                      background: 'rgba(95, 212, 255, 0.07)',
                    }}
                  >
                    Finish tour
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section label */}
        <div
          className="mt-5 mb-2 font-mono uppercase text-ink-dim"
          style={{ fontSize: '9px', letterSpacing: '0.24em', opacity: 0.6 }}
        >
          The path · {TOUR_STOPS.length} stops
        </div>

        {/* Stations list — tour stops first, then off-path stations */}
        <ol className="space-y-[3px]">
          {RAIL_ORDER.map((id) => {
            const station = getStation(id);
            if (!station) return null;
            const tourIdx = TOUR_INDEX_BY_ID.get(id);
            const isTour = tourIdx !== undefined;
            const isCurrent = tour.active && tourIdx !== undefined && tourIdx === tour.index;
            const isVisited = tour.active && tourIdx !== undefined && tourIdx < tour.index;
            const isSelected = state.selectedId === id;
            const isFirstNonTour = id === RAIL_ORDER[TOUR_STOPS.length];
            return (
              <li key={id}>
                {isFirstNonTour && (
                  <div
                    className="mt-3 mb-2 font-mono uppercase text-ink-dim"
                    style={{ fontSize: '9px', letterSpacing: '0.24em', opacity: 0.45 }}
                  >
                    Off-path
                  </div>
                )}
                <button
                  onClick={() => onClick(id)}
                  className="flex w-full items-center gap-3 rounded-sm py-[5px] pl-1 pr-2 text-left transition hover:bg-white/[0.04]"
                >
                  {/* Marker dot */}
                  <span
                    className="grid shrink-0 place-items-center rounded-full"
                    style={{
                      width: isTour ? 10 : 6,
                      height: isTour ? 10 : 6,
                      background: isCurrent
                        ? station.accent
                        : isTour && (isVisited || !tour.active)
                          ? station.accent
                          : 'transparent',
                      boxShadow: isCurrent ? `0 0 10px ${station.accent}` : undefined,
                      border: isTour
                        ? `1px solid ${isCurrent || (!tour.active) ? station.accent : 'rgba(255,255,255,0.22)'}`
                        : '1px solid rgba(255,255,255,0.18)',
                      opacity: isTour ? (isCurrent ? 1 : isVisited || !tour.active ? 0.95 : 0.55) : 0.5,
                      marginLeft: isTour ? 0 : 2,
                    }}
                  />
                  <span
                    className="font-mono uppercase transition truncate"
                    style={{
                      fontSize: isTour ? '11px' : '10px',
                      letterSpacing: '0.14em',
                      color: isCurrent || isSelected
                        ? '#fff'
                        : isTour
                          ? 'var(--ink-dim)'
                          : 'rgba(168, 179, 200, 0.5)',
                      fontWeight: isCurrent ? 500 : 400,
                    }}
                  >
                    {station.name}
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
        display: 'block',
      }}
      className="shrink-0 text-ink"
    >
      <path d="M1 5H13M13 5L9 1M13 5L9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
