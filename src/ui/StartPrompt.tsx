import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useProgress } from '@react-three/drei';
import { useSelection } from '../state/selection';
import { TOUR_STOPS } from '../data/tour';
import { INTRO_DURATION_S } from '../state/intro';

/**
 * First-run hero prompt. Appears once the loader clears and the intro
 * fly-through settles, and offers the guided tour as the front door.
 * Deep links never see it (welcomeDismissed starts true for them).
 *
 * The overlay intentionally captures all pointer input: until the viewer
 * picks a door, the only interactive thing on screen is this choice.
 */
export default function StartPrompt() {
  const { state, tourStart, dismissWelcome } = useSelection();
  const { active: loading } = useProgress();
  const [settled, setSettled] = useState(false);

  // Reveal after the intro fly-through lands (+ a beat), with a hard
  // fallback in case loading progress never resolves (mirrors Loader).
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => setSettled(true), (INTRO_DURATION_S + 0.6) * 1000);
    return () => clearTimeout(t);
  }, [loading]);
  useEffect(() => {
    const t = setTimeout(() => setSettled(true), 9000);
    return () => clearTimeout(t);
  }, []);

  const visible = settled && !state.welcomeDismissed;

  useEffect(() => {
    if (!visible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dismissWelcome();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, dismissWelcome]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="pointer-events-auto absolute inset-0 z-40 grid place-items-center"
          style={{
            background:
              'radial-gradient(ellipse at 50% 42%, rgba(2,3,10,0.12) 0%, rgba(2,3,10,0.55) 100%)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            className="mx-4 w-full max-w-[440px] rounded-xl border border-white/10 p-8 text-center"
            style={{
              background: 'rgba(13, 20, 36, 0.74)',
              backdropFilter: 'blur(18px) saturate(130%)',
              WebkitBackdropFilter: 'blur(18px) saturate(130%)',
              boxShadow: '0 24px 80px -24px rgba(0,0,0,0.7), 0 0 1px rgba(255,255,255,0.12) inset',
            }}
          >
            <div
              className="font-mono uppercase text-ink-dim"
              style={{ fontSize: '10px', letterSpacing: '0.26em', opacity: 0.75 }}
            >
              OPGO · Internal training
            </div>
            <h1
              className="mt-3 font-serif text-ink"
              style={{ fontSize: '34px', lineHeight: 1.08, letterSpacing: '-0.01em' }}
            >
              Conversion Tracking Foundry
            </h1>
            <p
              className="mx-auto mt-3 max-w-[340px] text-ink-dim"
              style={{ fontSize: '14px', lineHeight: 1.55 }}
            >
              How does a click become a reported conversion? Follow one form
              submission through the machinery, one stop at a time.
            </p>

            <button
              onClick={tourStart}
              className="group mt-7 flex w-full items-center justify-between gap-4 rounded-lg border border-white/15 px-5 py-4 text-left transition hover:border-white/40"
              style={{ background: 'rgba(95, 212, 255, 0.07)' }}
            >
              <span className="flex items-center gap-4">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 transition group-hover:border-white/50"
                  style={{ background: 'rgba(95, 212, 255, 0.12)' }}
                >
                  <svg width="11" height="13" viewBox="0 0 9 11" fill="none">
                    <path d="M0.75 0.5L8.25 5.5L0.75 10.5V0.5Z" fill="currentColor" className="text-ink" />
                  </svg>
                </span>
                <span className="font-serif text-ink" style={{ fontSize: '19px' }}>
                  Follow an event
                </span>
              </span>
              <span
                className="shrink-0 font-mono uppercase text-ink-dim opacity-70 transition group-hover:opacity-100"
                style={{ fontSize: '10px', letterSpacing: '0.16em' }}
              >
                {TOUR_STOPS.length} stops
              </span>
            </button>

            <button
              onClick={dismissWelcome}
              className="mt-4 font-mono uppercase text-ink-dim transition hover:text-ink"
              style={{ fontSize: '11px', letterSpacing: '0.18em' }}
            >
              or explore on your own →
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
