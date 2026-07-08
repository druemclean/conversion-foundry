import { useEffect, useState } from 'react';
import { STATIONS, COLORS } from '../data/stations';
import { ROUTES } from '../data/routes';
import { useSelection } from '../state/selection';

const SCENE_COUNTS = `${STATIONS.length} stations · ${ROUTES.length} routes`;

/** Color key for the scene's accent language, in plain marketing terms. */
const LEGEND: Array<[string, string]> = [
  [COLORS.cyan, 'Google / browser'],
  [COLORS.magenta, 'Meta'],
  [COLORS.green, 'Offline / CRM'],
  [COLORS.amber, 'Consent'],
];

export default function Hud() {
  const { state } = useSelection();
  const [hintVisible, setHintVisible] = useState(true);

  // Controls hint fades out after the user has been actively moving the
  // mouse for ~5s, then fades back in if they go idle for ~2.5s. Lingering
  // hint chrome reads amateur once a user has clearly oriented themselves.
  useEffect(() => {
    let firstMoveAt: number | null = null;
    let idleTimer: number | null = null;
    let hideTimer: number | null = null;

    function onMove() {
      if (firstMoveAt === null) {
        firstMoveAt = Date.now();
        hideTimer = window.setTimeout(() => setHintVisible(false), 5000);
      }
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        if (hideTimer) clearTimeout(hideTimer);
        firstMoveAt = null;
        hideTimer = null;
        setHintVisible(true);
      }, 2500);
    }

    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (idleTimer) clearTimeout(idleTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  // While the welcome prompt is up, the prompt is the only voice on screen.
  const chromeVisible = state.welcomeDismissed;

  return (
    <div className="pointer-events-none absolute inset-0 z-[25] flex flex-col justify-between">
      <header className="flex items-start justify-between p-8">
        {/* Compact wordmark — the full title lives in the start prompt now,
            so the resting chrome stays out of the scene's way. */}
        <div
          className="hud-plate hud-title-plate flex items-center gap-3"
          style={{ padding: '12px 18px' }}
        >
          <span
            className="block h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: 'var(--accent-cyan)', boxShadow: '0 0 8px var(--accent-cyan)' }}
          />
          <span
            className="font-serif text-ink"
            style={{ fontSize: '17px', letterSpacing: '0.05em', lineHeight: 1 }}
          >
            OPGO
          </span>
          <span
            className="block h-3 w-px shrink-0"
            style={{ background: 'rgba(255,255,255,0.14)' }}
          />
          <span
            className="font-mono uppercase text-ink-dim"
            style={{ fontSize: '10px', letterSpacing: '0.2em' }}
          >
            Conversion Tracking Foundry
          </span>
        </div>

        <div
          className="hud-plate hud-meta-plate hidden font-mono uppercase text-ink-dim md:block"
          style={{ fontSize: '10px', letterSpacing: '0.22em', padding: '12px 16px' }}
        >
          {SCENE_COUNTS}
        </div>
      </header>

      <footer className="flex items-end justify-between p-8">
        <div
          className="hud-plate hud-hint-plate font-mono text-ink-dim"
          style={{
            fontSize: '11px',
            letterSpacing: '0.18em',
            opacity: chromeVisible && hintVisible ? 1 : 0,
            transform: chromeVisible && hintVisible ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 380ms ease-out, transform 380ms ease-out',
          }}
        >
          drag to orbit · click a station · esc to close · ▶ guided
        </div>

        {/* Color legend — the scene's accent language, decoded. */}
        <div
          className="hud-plate hud-legend-plate flex items-center gap-4"
          style={{
            padding: '10px 16px',
            opacity: chromeVisible ? 1 : 0,
            transition: 'opacity 380ms ease-out',
          }}
        >
          {LEGEND.map(([color, label]) => (
            <span key={label} className="flex items-center gap-2">
              <span
                className="block h-1.5 w-1.5 rounded-full"
                style={{ background: color, boxShadow: `0 0 6px ${color}` }}
              />
              <span
                className="font-mono uppercase text-ink-dim"
                style={{ fontSize: '10px', letterSpacing: '0.14em' }}
              >
                {label}
              </span>
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
