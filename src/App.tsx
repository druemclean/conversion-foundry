import Scene from './scene/Scene';
import Hud from './ui/Hud';

export default function App() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Scene />
      <Hud />
    </div>
  );
}
