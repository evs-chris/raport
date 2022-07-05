const lasts: { [name: string]: HTMLElement } = {};

export function getLastFocus(slot?: string): HTMLElement {
  return lasts[slot || ''];
}

export function trackfocus(node: HTMLElement, slot?: string) {
  function listen(ev: FocusEvent) {
    const el = ev.target;
    if ('selectionStart' in el) lasts[slot || ''] = el as any;
  }

  node.addEventListener('focus', listen, { capture: true });

  return {
    teardown() { node.removeEventListener('focus', listen, { capture: true }); }
  };
}
