/**
 * Tiny registry that lets AnchorController write CSS transforms directly to
 * each station's label pill without going through React state. Avoids
 * per-frame re-renders for what is fundamentally a positioning concern.
 */

const labels = new Map<string, HTMLDivElement>();

export function registerLabel(id: string, el: HTMLDivElement | null) {
  if (el) labels.set(id, el);
  else labels.delete(id);
}

export function getRegisteredLabels(): Map<string, HTMLDivElement> {
  return labels;
}
