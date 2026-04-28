import { useCallback, useEffect } from 'react';
import Scene from './scene/Scene';
import Hud from './ui/Hud';
import InfoPanel from './ui/InfoPanel';
import Tooltip from './ui/Tooltip';
import { SelectionProvider, useSelection } from './state/selection';

function AppInner() {
  const { setCursor, select } = useSelection();

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('station');
    if (id) select(id);
  }, [select]);

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
