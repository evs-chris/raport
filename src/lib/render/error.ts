import { Displayed, Placement } from '../report';
import { Context } from '../data/index';

export interface RenderContext {
  parent?: RenderContext;
  report: Displayed;
  styles: StyleRegistry;
  styleMap: StyleMap;
  context: Context;
  commit?: { [name: string]: any };
}

export interface StyleRegistry {
  [id: string]: string;
}

interface StyleMap {
  ids: { [id: string]: number };
  styles: StyleRegistry;
}

export function addStyle(context: RenderContext, id: string, style: string) {
  if (!context.styles[id]) context.styles[id] = style;
}

export function error(context: RenderContext, placement: Placement, message: string = 'Widget overflow error') {
  addStyle(context, 'error', `.error { position: absolute; box-sizing: border-box; color: red; border: 1px dotted; width: 100%; height: 2rem; padding: 0.5rem; }`);
  return { output: `<div class="error" style="top: ${placement.y}rem;">${message}</div>`, height: 2 };
}
