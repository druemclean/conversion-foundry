import { AnimatePresence, motion } from 'framer-motion';
import { useProgress } from '@react-three/drei';
import { useEffect, useState } from 'react';

/**
 * Visibility is derived from progress directly so a stuck setTimeout in
 * virtual-time environments can't trap it. A separate hard-timeout effect
 * also force-hides the loader if progress never reaches 100 (e.g. when
 * nothing routes through Three's LoadingManager).
 */
export default function Loader() {
  const { progress } = useProgress();
  const [forceHidden, setForceHidden] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setForceHidden(true), 6500);
    return () => clearTimeout(t);
  }, []);

  const visible = !forceHidden && progress < 100;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 z-50 grid place-items-center"
          style={{
            background:
              'radial-gradient(ellipse at 50% 35%, #0d1424 0%, #02030a 70%)',
          }}
        >
          <div className="text-center">
            <div
              className="font-mono uppercase text-ink-dim"
              style={{ fontSize: '11px', letterSpacing: '0.3em' }}
            >
              OpGo · Internal training
            </div>
            <div
              className="mt-3 font-serif text-ink"
              style={{ fontSize: '32px', lineHeight: 1.1, letterSpacing: '-0.01em' }}
            >
              Conversion Tracking Foundry
            </div>

            <div
              className="mx-auto mt-7 h-px overflow-hidden"
              style={{ width: '220px', background: 'rgba(255,255,255,0.08)' }}
            >
              <motion.div
                className="h-full"
                style={{ background: '#5fd4ff', boxShadow: '0 0 12px #5fd4ff' }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              />
            </div>

            <div
              className="mt-3 font-mono uppercase text-ink-dim"
              style={{ fontSize: '10px', letterSpacing: '0.22em' }}
            >
              Building stage · {Math.round(progress)}%
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
