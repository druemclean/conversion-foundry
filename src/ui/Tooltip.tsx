import { AnimatePresence, motion } from 'framer-motion';
import { useSelection } from '../state/selection';
import { getStation } from '../data/stations';

export default function Tooltip() {
  const { state } = useSelection();
  const station = getStation(state.hoveredId);
  const cursor = state.cursor;

  const visible = !!station && !!cursor && state.selectedId !== state.hoveredId;

  return (
    <AnimatePresence>
      {visible && station && cursor && (
        <motion.div
          key={station.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
          className="pointer-events-none fixed z-40 rounded-md border border-white/10 px-3 py-2"
          style={{
            left: cursor.x + 18,
            top: cursor.y + 18,
            background: 'rgba(13, 20, 36, 0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <div className="text-ink" style={{ fontSize: '12px', letterSpacing: '0.01em' }}>
            {station.name}
          </div>
          <div
            className="font-mono uppercase text-ink-dim"
            style={{
              fontSize: '10px',
              letterSpacing: '0.2em',
              marginTop: 2,
              color: station.accent,
            }}
          >
            {station.categoryLabel}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
