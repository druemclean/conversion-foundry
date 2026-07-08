import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { TOUR_STOPS } from '../data/tour';
import { ROUTES, getConnections } from '../data/routes';

export type CursorPos = { x: number; y: number };

export type TourState = {
  active: boolean;
  /** Stop index into TOUR_STOPS. */
  index: number;
};

type State = {
  selectedId: string | null;
  hoveredId: string | null;
  hoveredRouteId: string | null;
  cursor: CursorPos | null;
  tour: TourState;
  /** False until the first-run welcome prompt is answered. Deep links
   *  (?station, ?tour) pre-dismiss it — those visitors chose a destination. */
  welcomeDismissed: boolean;
};

type Action =
  | { type: 'select'; id: string | null }
  | { type: 'hover'; id: string | null }
  | { type: 'hoverRoute'; id: string | null }
  | { type: 'cursor'; pos: CursorPos | null }
  | { type: 'tourStart' }
  | { type: 'tourStop' }
  | { type: 'tourGoto'; index: number }
  | { type: 'dismissWelcome' };

function isDeepLink(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('station') || params.has('tour');
}

const initial: State = {
  selectedId: null,
  hoveredId: null,
  hoveredRouteId: null,
  cursor: null,
  tour: { active: false, index: 0 },
  welcomeDismissed: isDeepLink(),
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'select':
      // Manual selection (canvas click, Escape, ×) ends the guided tour.
      // Programmatic tour navigation goes through tourGoto and skips this.
      return {
        ...state,
        selectedId: action.id,
        tour: state.tour.active ? { ...state.tour, active: false } : state.tour,
      };
    case 'hover':
      return { ...state, hoveredId: action.id };
    case 'hoverRoute':
      return { ...state, hoveredRouteId: action.id };
    case 'cursor':
      return { ...state, cursor: action.pos };
    case 'tourStart':
      return {
        ...state,
        tour: { active: true, index: 0 },
        selectedId: TOUR_STOPS[0]?.id ?? null,
        welcomeDismissed: true,
      };
    case 'tourStop':
      return { ...state, tour: { ...state.tour, active: false } };
    case 'tourGoto': {
      const idx = Math.max(0, Math.min(TOUR_STOPS.length - 1, action.index));
      const stop = TOUR_STOPS[idx];
      return {
        ...state,
        tour: { ...state.tour, index: idx },
        selectedId: stop?.id ?? state.selectedId,
      };
    }
    case 'dismissWelcome':
      return { ...state, welcomeDismissed: true };
  }
}

type Ctx = {
  state: State;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  hoverRoute: (id: string | null) => void;
  setCursor: (pos: CursorPos | null) => void;
  tourStart: () => void;
  tourStop: () => void;
  tourGoto: (index: number) => void;
  dismissWelcome: () => void;
};

const SelectionCtx = createContext<Ctx | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  const select = useCallback((id: string | null) => dispatch({ type: 'select', id }), []);
  const hover = useCallback((id: string | null) => dispatch({ type: 'hover', id }), []);
  const hoverRoute = useCallback(
    (id: string | null) => dispatch({ type: 'hoverRoute', id }),
    [],
  );
  const setCursor = useCallback(
    (pos: CursorPos | null) => dispatch({ type: 'cursor', pos }),
    [],
  );
  const tourStart = useCallback(() => dispatch({ type: 'tourStart' }), []);
  const tourStop = useCallback(() => dispatch({ type: 'tourStop' }), []);
  const tourGoto = useCallback(
    (index: number) => dispatch({ type: 'tourGoto', index }),
    [],
  );
  const dismissWelcome = useCallback(() => dispatch({ type: 'dismissWelcome' }), []);

  const value = useMemo(
    () => ({ state, select, hover, hoverRoute, setCursor, tourStart, tourStop, tourGoto, dismissWelcome }),
    [state, select, hover, hoverRoute, setCursor, tourStart, tourStop, tourGoto, dismissWelcome],
  );

  return <SelectionCtx.Provider value={value}>{children}</SelectionCtx.Provider>;
}

export function useSelection() {
  const ctx = useContext(SelectionCtx);
  if (!ctx) throw new Error('SelectionProvider missing');
  return ctx;
}

export type Focus = {
  /** True when any station/route is focused (hover, selection, or route hover). */
  active: boolean;
  /** Stations that should render at full intensity. */
  stations: Set<string>;
  /** Routes that should render at full intensity. */
  routes: Set<string>;
  /** Whether `id` should be dimmed. */
  isStationDimmed: (id: string) => boolean;
  /** Whether route `id` should be dimmed. */
  isRouteDimmed: (id: string) => boolean;
};

const EMPTY_FOCUS: Focus = {
  active: false,
  stations: new Set(),
  routes: new Set(),
  isStationDimmed: () => false,
  isRouteDimmed: () => false,
};

/**
 * Derived view of selection/hover state for the attentional-dimming system.
 * Hover takes precedence over selection so cursor activity always wins. Route
 * hover focuses both endpoints + the route itself.
 */
export function useFocus(): Focus {
  const { state } = useSelection();
  return useMemo(() => {
    const { hoveredId, hoveredRouteId, selectedId } = state;

    if (hoveredId) {
      const conn = getConnections(hoveredId);
      conn.stations.add(hoveredId);
      return makeFocus(conn.stations, conn.routes);
    }
    if (hoveredRouteId) {
      const route = ROUTES.find((r) => r.id === hoveredRouteId);
      if (route) {
        return makeFocus(new Set([route.from, route.to]), new Set([route.id]));
      }
    }
    if (selectedId) {
      const conn = getConnections(selectedId);
      conn.stations.add(selectedId);
      return makeFocus(conn.stations, conn.routes);
    }
    return EMPTY_FOCUS;
  }, [state]);
}

function makeFocus(stations: Set<string>, routes: Set<string>): Focus {
  return {
    active: true,
    stations,
    routes,
    isStationDimmed: (id) => !stations.has(id),
    isRouteDimmed: (id) => !routes.has(id),
  };
}
