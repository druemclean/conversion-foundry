import { useEffect, useState } from 'react';
import { STATIONS } from '../data/stations';
import { ROUTES } from '../data/routes';

const SCENE_COUNTS = `${STATIONS.length} stations · ${ROUTES.length} routes`;

export default function Hud() {
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

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between">
      <header className="flex items-start justify-between p-8">
        <div className="hud-plate hud-title-plate max-w-[480px]">
          {/* OPGO wordmark — separate, more designed than the eyebrow */}
          <div className="flex items-center gap-2.5">
            <span
              className="block h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--accent-cyan)', boxShadow: '0 0 8px var(--accent-cyan)' }}
            />
            <span
              className="font-serif text-ink"
              style={{ fontSize: '20px', letterSpacing: '0.06em', lineHeight: 1 }}
            >
              OPGO
            </span>
          </div>
          <div
            className="mt-3 font-mono uppercase text-ink-dim"
            style={{ fontSize: '10px', letterSpacing: '0.24em', opacity: 0.7 }}
          >
            Internal training
          </div>
          <h1
            className="mt-2 font-serif text-ink"
            style={{ fontSize: '44px', lineHeight: 1.05, letterSpacing: '-0.01em' }}
          >
            Conversion Tracking Foundry
          </h1>
          <p className="mt-2 text-[14px] text-ink-dim">
            A 3D explainer of how a click becomes a measured conversion — and the
            machinery that carries it across browsers, servers, and ad platforms.
          </p>
        </div>

        {/* Scene counts — replaces the previous v0.1 dev metadata plate */}
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
            opacity: hintVisible ? 1 : 0,
            transform: hintVisible ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 380ms ease-out, transform 380ms ease-out',
          }}
        >
          drag to orbit · click a station · esc to close · ▶ guided
        </div>
        {/* Bottom-right deliberately left empty — was dev-step metadata. */}
        <div />
      </footer>
    </div>
  );
}
