import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { TOUR_STOPS } from '../data/tour';

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
};

type Action =
  | { type: 'select'; id: string | null }
  | { type: 'hover'; id: string | null }
  | { type: 'hoverRoute'; id: string | null }
  | { type: 'cursor'; pos: CursorPos | null }
  | { type: 'tourStart' }
  | { type: 'tourStop' }
  | { type: 'tourGoto'; index: number };

const initial: State = {
  selectedId: null,
  hoveredId: null,
  hoveredRouteId: null,
  cursor: null,
  tour: { active: false, index: 0 },
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

  const value = useMemo(
    () => ({ state, select, hover, hoverRoute, setCursor, tourStart, tourStop, tourGoto }),
    [state, select, hover, hoverRoute, setCursor, tourStart, tourStop, tourGoto],
  );

  return <SelectionCtx.Provider value={value}>{children}</SelectionCtx.Provider>;
}

export function useSelection() {
  const ctx = useContext(SelectionCtx);
  if (!ctx) throw new Error('SelectionProvider missing');
  return ctx;
}
