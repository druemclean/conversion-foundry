export default function Hud() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between">
      <header className="flex items-start justify-between p-8">
        <div className="hud-plate max-w-[480px]">
          <div
            className="font-mono uppercase text-ink-dim"
            style={{ fontSize: '11px', letterSpacing: '0.18em' }}
          >
            OpGo · Internal training
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

        <div
          className="hud-plate hidden font-mono uppercase text-ink-dim md:block"
          style={{ fontSize: '11px', letterSpacing: '0.18em' }}
        >
          v0.1 · scaffold
        </div>
      </header>

      <footer className="flex items-end justify-between p-8">
        <div
          className="hud-plate font-mono text-ink-dim"
          style={{ fontSize: '11px', letterSpacing: '0.18em' }}
        >
          drag to orbit · click gtm to inspect · esc to close
        </div>
        <div
          className="hud-plate font-mono text-ink-dim"
          style={{ fontSize: '11px', letterSpacing: '0.18em' }}
        >
          step 06 / 08 — guided "follow an event"
        </div>
      </footer>
    </div>
  );
}
