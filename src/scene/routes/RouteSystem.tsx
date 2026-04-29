import { useMemo } from 'react';
import { ROUTES } from '../../data/routes';
import { routeCurve } from './curves';
import RouteTube from './RouteTube';
import Capsules from './Capsules';

export default function RouteSystem() {
  // Pre-compute each route's curve once at mount; station positions are static.
  const routes = useMemo(
    () => ROUTES.map((r) => ({ data: r, curve: routeCurve(r.from, r.to) })),
    [],
  );

  return (
    <group>
      {routes.map(({ data, curve }) => (
        <group key={data.id}>
          <RouteTube route={data} curve={curve} />
          {data.density > 0 && <Capsules route={data} curve={curve} />}
          {data.returnFlow && data.density > 0 && (
            <Capsules route={data} curve={curve} reverse />
          )}
        </group>
      ))}
    </group>
  );
}
