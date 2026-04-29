import { useCallback, useEffect } from 'react';
import Scene from './scene/Scene';
import Hud from './ui/Hud';
import InfoPanel from './ui/InfoPanel';
import Tooltip from './ui/Tooltip';
import SideRail from './ui/SideRail';
import { SelectionProvider, useSelection } from './state/selection';

function AppInner() {
  const { setCursor, select, tourStart, tourGoto } = useSelection();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('station');
    if (id) select(id);
    const tourStep = params.get('tour');
    if (tourStep !== null) {
      const idx = parseInt(tourStep, 10);
      if (!Number.isNaN(idx)) {
        tourStart();
        if (idx > 0) tourGoto(idx);
      }
    }
  }, [select, tourStart, tourGoto]);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setCursor({ x: e.clientX, y: e.clientY });
    },
    [setCursor],
  );
  const onLeave = useCallback(() => setCursor(null), [setCursor]);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <Scene />
      <Hud />
      <SideRail />
      <InfoPanel />
      <Tooltip />
    </div>
  );
}

export default function App() {
  return (
    <SelectionProvider>
      <AppInner />
    </SelectionProvider>
  );
}
