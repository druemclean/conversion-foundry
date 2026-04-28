import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

export type CursorPos = { x: number; y: number };

type State = {
  selectedId: string | null;
  hoveredId: string | null;
  cursor: CursorPos | null;
};

type Action =
  | { type: 'select'; id: string | null }
  | { type: 'hover'; id: string | null }
  | { type: 'cursor'; pos: CursorPos | null };

const initial: State = { selectedId: null, hoveredId: null, cursor: null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'select':
      return { ...state, selectedId: action.id };
    case 'hover':
      return { ...state, hoveredId: action.id };
    case 'cursor':
      return { ...state, cursor: action.pos };
  }
}

type Ctx = {
  state: State;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setCursor: (pos: CursorPos | null) => void;
};

const SelectionCtx = createContext<Ctx | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  const select = useCallback((id: string | null) => dispatch({ type: 'select', id }), []);
  const hover = useCallback((id: string | null) => dispatch({ type: 'hover', id }), []);
  const setCursor = useCallback(
    (pos: CursorPos | null) => dispatch({ type: 'cursor', pos }),
    [],
  );

  const value = useMemo(
    () => ({ state, select, hover, setCursor }),
    [state, select, hover, setCursor],
  );

  return <SelectionCtx.Provider value={value}>{children}</SelectionCtx.Provider>;
}

export function useSelection() {
  const ctx = useContext(SelectionCtx);
  if (!ctx) throw new Error('SelectionProvider missing');
  return ctx;
}
