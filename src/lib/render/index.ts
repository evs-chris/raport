import { Displayed, Layout, Placement, Widget, MeasureFont } from '../report';
import { extend as extendContext, Context, ExtendOptions as ContextExtendOptions, evaluate } from '../data/index';

export interface RenderContext {
  report: Displayed;
  styles: StyleRegistry;
  styleMap: StyleMap;
  context: Context;
}

export interface StyleRegistry {
  [id: string]: string;
}

interface StyleMap {
  id: number;
  styles: StyleRegistry;
}

export function addStyle(context: RenderContext, id: string, style: string) {
  if (!context.styles[id]) context.styles[id] = style;
}

export interface ExtendOptions extends ContextExtendOptions {}

export function extend(context: RenderContext, opts: ExtendOptions): RenderContext {
  return { report: context.report, context: extendContext(context.context, opts), styles: context.styles, styleMap: context.styleMap };
}

const htmlChars = /\>\<\&/g;
const htmlReplace = { '<': '&lt;', '>': '&gt;', '&': '&amp;' };
export function escapeHTML(html: string): string {
  return html.replace(htmlChars, m => htmlReplace[m] || '');
}

const renderers: { [type: string]: Renderer } = {};
export function registerRenderer<T extends Widget = Widget, S = any>(type: string, renderer: ((widget: T, context: RenderContext, placement: Placement, state?: RenderState<S>) => RenderResult<S>) | Renderer<T, S>, options?: RendererOptions) {
  renderers[type] = typeof renderer === 'function' ? { render: renderer } : renderer;
  if (options) Object.assign(renderers[type], options);
}

/** Decent guesstimates for char width at 16px/em */
const avgs = {
  sans: 7.4,
  serif: 6.7,
  mono: 7.85,
  narrow: 5.9,
}

/** Text height measurement function for the given text, font, available width in rem, and line height in rem.
 * The text is assumed to be rendered as white-space: pre-wrap.
 */
export function measureEstimate(text: string, width: number, font?: MeasureFont): number {
  const family = (font && font.family) || 'sans';
  const size = (font && font.size) || 0.83;
  const line = (font && font.line) || 1;
  const avg = ((family === 'mono' || /fixed|mono/i.test(family) ? avgs.mono :
    family === 'narrow' || /narrow|condensed/i.test(family) ? avgs.narrow :
      family === 'sans' || /sans/i.test(family) ? avgs.sans :
        avgs.serif) * size) / 16;
  
  const lines = text.split(/\r?\n/g);
  return lines.reduce((a, c) => {
    const [word, lines] = c.split(/\s/g).reduce((a, c) => {
      const wlen = (c.length + 1) * avg;
      if (a[0] + wlen > width) {
        a[0] = wlen;
        a[1]++;
      } else {
        a[0] += wlen;
      }
      return a;
    }, [0, 0]);
    return a + ((lines + (word > 0 ? 1 : 0)) || 1);
  }, 0) * line;
}

/** Text height measurement function for the given text, font, available width in rem, and line height in rem.
 * The text is assumed to be rendered as white-space: pre-wrap.
 */
export let measure: (text: string, width: number, font?: MeasureFont) => number = measureEstimate;

export interface RenderContinuation<T = any> {
  output: string;
  continue?: RenderState<T>;
  height: number;
}

export type RenderResult<T = any> = string|RenderContinuation<T>;

export interface Renderer<T extends Widget = Widget, S = any> extends RendererOptions {
  render(widget: T, context: RenderContext, placement: Placement, state?: RenderState<S>): RenderResult;
}

export interface RendererOptions {
  container?: boolean;
}

export interface RenderState<T = any> {
  child?: RenderState;
  last?: number;
  state?: T;
  offset: number;
}

/** Render the given widget to string or a continuation using a registered renderer */
export function renderWidget(w: Widget, context: RenderContext, placement: Placement, state?: RenderState): RenderContinuation {
  const renderer = renderers[w.type];
  if (!renderer || (w.hide && evaluate(context, w.hide))) return { output: '', height: 0 };

  if (!('height' in w) && renderer.container) w.height = 'auto'; 
  const h = getHeightWithMargin(w, placement);
  // TODO: allow for components that allow breaking
  if (placement.availableY && h > placement.availableY) return { output: '', height: 0, continue: { offset: 0 } };

  let extraHeight = 0;

  if (w.margin) {
    const m = expandMargin(w);
    extraHeight += m[0] + m[2];
    if (placement.availableX) {
      placement.availableX -= m[1] + m[3];
    }
    if (placement.availableY) {
      placement.availableY -= m[0] + m[2];
    }
  }

  const r = renderer.render(w, context, placement, state);
  if (typeof r === 'string') return { output: r, height: h };
  else r.height = r.height + extraHeight;
  
  return r;
}

const layouts: { [name: string]: (widget: Widget, offset: number, margin: [number, number, number, number], placement: Placement, placements: Array<[number, number, number, number]>) => Placement } = {
  row: (w, o, m, p, ps) => {
    let n: Placement;
    if (w.br || (p.availableX && ps[0][0] + ps[0][2] + getWidthWithMargin(w, p) > p.availableX)) {
      n = { x: m[3], y: maxOffset(ps), availableX: p.availableX && (p.availableX - m[3]) };
    } else {
      n = { x: ps[0][0] + ps[0][2], y: ps[0][1] };
      if (p.availableX) n.availableX = p.availableX - (ps[0][0] + ps[0][2]);
    }

    n.y -= o;

    if (p.availableY) n.availableY = p.availableY - ps[0][1];

    return n;
  }
};
export function registerLayout(name: string, layout: (widget: Widget, offset: number, margin: [number, number, number, number], placement: Placement, placements: Array<[number, number, number, number]>) => Placement) {
  layouts[name] = layout;
}

/** Render child widgets handling continuation across pages */
export function renderWidgets(widget: Widget, context: RenderContext, placement: Placement, state?: RenderState, layout?: Layout): RenderContinuation {
  if (Array.isArray(widget.widgets)) {
    let s = '';
    const offset = (state || { offset: 0 }).offset;
    const ps: Array<[number, number, number, number]> = [[0, offset, 0, 0]];

    const m = expandMargin(widget);
    ps[0][0] += m[3];
    ps[0][1] += m[0];

    for (let i = state && state.state && state.state.last || 0; i < widget.widgets.length; i++) {
      const w: Widget = widget.widgets[i];
      if (w.hide && evaluate(context, w.hide)) continue;

      if (placement && placement.availableY && getHeightWithMargin(w, placement) > placement.availableY) {
        state = state || { offset: maxOffset(ps) };
        state.last = i;
        return { output: s, continue: state, height: ps.map(([y, h]) => y + h).reduce((a, c) => c > a ? c : a, 0) };
      } else {
        const lp = Array.isArray(layout) && layout[i];
        let p = Array.isArray(lp) ? { x: lp[0] + m[3], y: lp[1] + m[0] } : (lp || placement);

        if (!layout || typeof layout === 'string') {
          const l = layout ? layouts[layout as string] || layouts.row : layouts.row;
          p = l(w, offset, m, placement, ps);
        }

        const { x, y } = p;
        const r = renderWidget(w, context, p, state && state.child);

        // skip empty output
        if (typeof r === 'string' && !r || (!r.output && !r.height)) continue;

        if (typeof r === 'string') {
          s += r;
          ps.unshift([x, y, getWidthWithMargin(w, placement), getHeightWithMargin(w, placement)]);
        } else {
          s += r.output;
          ps.unshift([x, y, getWidthWithMargin(w, placement), r.height]);
          if (r.continue) {
            state = state || { offset: 0 };
            state.child = r.continue;
            state.last = i;
            state.offset = maxOffset(ps);
            return { output: s, continue: state, height: maxOffset(ps) };
          }
        }
      }
    }

    return { output: s, height: getHeightWithMargin(widget, placement) || maxOffset(ps) - m[0] };
  }
  return { output: '', height: 0 };
}

// TODO: make base width settable
const base = 51;
// TODO: account for margins
export function getWidth(w: Widget, placement: Placement): number {
  const width = w.width;
  if (!width) return base;
  else if (typeof width === 'number') return width;
  else return (width.percent / 100) * (placement.availableX || base);
}

export function getWidthWithMargin(w: Widget, placement: Placement): number {
  let r = getWidth(w, placement);
  if (w.margin) {
    const m = expandMargin(w);
    r += m[1] + m[3];
  } else if (w.font && w.font.right) {
    r += w.font.right;
  }
  return r;
}

export function getHeight(w: Widget, placement: Placement, computed?: number): number {
  let r = 1;
  if (typeof w.height === 'number') r = w.height;
  else if (typeof w.height === 'object' && w.height.percent && placement.availableY) r = placement.availableY * (w.height.percent / 100);
  else if (w.height === 'auto' || (computed && !w.height)) return computed || NaN;
  return r;
}

export function getHeightWithMargin(w: Widget, placement: Placement, computed?: number): number {
  let h = getHeight(w, placement, computed);
  if (w.margin) {
    const m = expandMargin(w);
    h += m[0] + m[2];
  }
  return h;
}

function maxOffset(points: Array<[number, number, number, number]>): number {
  return points.reduce((a, c) => a > c[1] + c[3] ? a : c[1] + c[3], 0);
}

export function expandMargin(w: Widget): [number, number, number, number] {
  if (w.margin) {
    const m = w.margin;
    if (Array.isArray(m)) {
      if (m.length === 4) return m.map(e => +e) as [number, number, number, number];
      else if (m.length === 2) return [+m[0], +m[1], +m[0], +m[1]];
    } else if (typeof m === 'number') return [m, m, m, m];
  }

  return [0, 0, 0, 0];
}
