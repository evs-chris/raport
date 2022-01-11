import { Displayed, Layout, Placement, Widget, Margin, MeasureFont, Computed } from '../report';
import { extend as extendContext, Context, ExtendOptions as ContextExtendOptions, evaluate, isValueOrExpr } from '../data/index';

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
  ids: { [id: string]: number };
  styles: StyleRegistry;
}

export function addStyle(context: RenderContext, id: string, style: string) {
  if (!context.styles[id]) context.styles[id] = style;
}

export function isComputed(v: any): v is Computed {
  return typeof v === 'object' && isValueOrExpr(v.x);
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
  const avg = (((font && font.metric) || ((family === 'mono' || /fixed|mono/i.test(family) ? avgs.mono :
    family === 'narrow' || /narrow|condensed/i.test(family) ? avgs.narrow :
      family === 'sans' || /sans|arial|helvetica/i.test(family) ? avgs.sans :
        avgs.serif))) * size) / 16;
  
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
  }, 0) * size;
}

/** Text height measurement function for the given text, font, available width in rem, and line height in rem.
 * The text is assumed to be rendered as white-space: pre-wrap.
 */
export let measure: (text: string, width: number, font?: MeasureFont) => number = measureEstimate;

export interface RenderContinuation<T = any> {
  output: string;
  continue?: RenderState<T>;
  height?: number;
  width?: number;
  cancel?: boolean;
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
  if (!renderer || (w.hide && evaluate(context, w.hide))) return { output: '' };

  if (!('height' in w) && renderer.container) w.height = 'auto'; 
  const h = getHeightWithMargin(w, placement, context);

  if (placement.maxY && !isNaN(h) && h > placement.maxY) {
    addStyle(context, 'error', `.error { position: absolute; box-sizing: border-box; color: red; border: 1px dotted; width: 100%; height: 2rem; padding: 0.5rem; }`);
    return { output: `<div class="error" style="top: ${placement.y}rem;">Widget overflow error</div>`, height: 2 };
  }

  if (placement.availableY && h > placement.availableY) return { output: '', continue: { offset: 0 }, cancel: true };

  let extraHeight = 0;

  if (w.margin) {
    const m = expandMargin(w, context);
    extraHeight += m[0] + m[2];
    if (placement.availableX) {
      placement.availableX -= m[1] + m[3];
    }
    if (placement.availableY) {
      placement.availableY -= m[0] + m[2];
    }
  }

  const r = renderer.render(w, context, placement, state);
  if (typeof r === 'string') return { output: r, height: h, width: getWidthWithMargin(w, placement, context) };
  
  if (placement.maxY && r.height > placement.maxY) {
    addStyle(context, 'error', `.error { position: absolute; box-sizing: border-box; color: red; border: 1px dotted; width: 100%; height: 2rem; padding: 0.5rem; }`);
    return { output: `<div class="error" style="top: ${placement.y}rem;">Widget overflow error</div>`, height: 2 };
  }
  if (isNaN(h) && placement.availableY && r.height > placement.availableY) return { output: '', continue: { offset: 0 }, height: r.height, cancel: true };

  r.height += extraHeight;

  return r;
}

const layouts: { [name: string]: (widget: Widget, offset: number, margin: [number, number, number, number], placement: Placement, placements: Array<[number, number, number, number]>, context: RenderContext) => Placement } = {};

export function registerLayout(name: string, layout: (widget: Widget, offset: number, margin: [number, number, number, number], placement: Placement, placements: Array<[number, number, number, number]>, context: RenderContext) => Placement) {
  layouts[name] = layout;
}

registerLayout('row', (w, o, m, p, ps, context) => {
  let n: Placement;
  const nw = getWidthWithMargin(w, p, context);
  const br = isComputed(w.br) ? evaluate(context, w.br.x) : w.br;
  if (p.availableX && ps[0][0] + ps[0][2] + nw > p.availableX) {
    n = { x: m[3], y: maxYOffset(ps), availableX: br ? 0 : p.availableX && (p.availableX - m[3]), maxX: p.maxX };
  } else {
    n = { x: ps[0][0] + ps[0][2], y: ps[0][1], maxX: p.maxX };
    if (p.availableX) n.availableX = br ? 0 : p.availableX - (ps[0][0] + ps[0][2]) - nw;
  }

  n.y -= o;

  if (p.availableY) n.availableY = p.availableY - ps[0][1];

  return n;
});

/** Render child widgets handling continuation across pages */
export function renderWidgets(widget: Widget, context: RenderContext, placement: Placement, state?: RenderState, layout?: Layout): RenderContinuation {
  if (Array.isArray(widget.widgets)) {
    let s = '';
    const offset = (state || { offset: 0 }).offset;
    const ps: Array<[number, number, number, number]> = [[0, offset, 0, 0]];

    const m = expandMargin(widget, context);
    ps[0][0] += m[3];
    ps[0][1] += m[0];

    for (let i = state && state.state && state.state.last || 0; i < widget.widgets.length; i++) {
      const w: Widget = widget.widgets[i];
      if (w.hide && evaluate(context, w.hide)) continue;

      // allow widgets that are taller than max height to be dropped
      let h = placement && getHeightWithMargin(w, placement, context);
      if (h > placement.maxY) h = 1;

      if (placement && placement.availableY && h > placement.availableY) {
        state = state || { offset: maxYOffset(ps) };
        state.last = i;
        return { output: s, continue: state, height: h + ps.map(([y, h]) => y + h).reduce((a, c) => c > a ? c : a, 0) };
      } else {
        const lp = Array.isArray(layout) && (layout[i] || [0, 0]);
        let p = Array.isArray(lp) ? { x: lp[0] + m[3], y: lp[1] + m[0], maxX: placement.maxX } : (lp || placement);

        if (!layout || typeof layout === 'string') {
          const l = layout ? layouts[layout as string] || layouts.row : layouts.row;
          p = l(w, offset, m, placement, ps, context);
        }

        p.maxX = p.maxX || placement.maxX;
        p.maxY = p.maxY || placement.maxY;

        const { x, y } = p;
        const r = renderWidget(w, context, p, state && state.child);

        // skip empty output
        if (typeof r === 'string' && !r || (!r.cancel && !r.output && !r.height)) continue;

        if (typeof r === 'string') {
          s += r;
          ps.unshift([x, y, getWidthWithMargin(w, placement, context), getHeightWithMargin(w, placement, context)]);
        } else {
          if (r.cancel && !ps.length) return { output: '', cancel: true };
          s += r.output;
          ps.unshift([x, y, r.width || getWidthWithMargin(w, placement, context), r.height || getHeightWithMargin(w, placement, context)]);
          if (r.continue) {
            state = state || { offset: 0 };
            state.child = r.continue;
            state.last = i;
            state.offset = maxYOffset(ps);
            return { output: s, continue: state, height: maxYOffset(ps), width: maxXOffset(ps) };
          }
        }

        if (p.availableX === 0) ps[0][2] = p.maxX;
      }
    }

    return { output: s, height: getHeightWithMargin(widget, placement, context) || maxYOffset(ps) - m[0], width: getWidthWithMargin(widget, placement, context) || maxXOffset(ps) - m[3] };
  }
  return { output: '' };
}

export function getWidth(w: Widget, placement: Placement, context: RenderContext): number {
  let width = isComputed(w.width) ? evaluate(context, w.width.x) : w.width;
  if (!width) return placement.maxX || 51;
  else if (typeof width === 'number') return width;
  else return +((width.percent / 100) * (placement.maxX || 51)).toFixed(4);
}

export function getInnerWidth(w: Widget, placement: Placement, context: RenderContext): number {
  let width = getWidth(w, placement, context);
  if (w.margin) {
    const m = expandMargin(w, context);
    width -= m[1] + m[3];
  }
  return width;
}

export function getWidthWithMargin(w: Widget, placement: Placement, context: RenderContext): number {
  let r = getWidth(w, placement, context);
  if (w.margin) {
    const m = expandMargin(w, context);
    r += m[1] + m[3];
  } else if (w.font && w.font.right) {
    r += w.font.right;
  }
  return r;
}

function maxFontSize(w: Widget) {
  let n = w.height || 1;
  if (w.font && w.font.size > n) n = w.font.size;
  if ('text' in w && Array.isArray(w.text)) {
    for (let i = 0; i < w.text.length; i++) {
      if (typeof w.text[i] === 'object' && w.text[i].font && w.text[i].font.size > n) n = w.text[i].font.size;
    }
  }
  return n;
}

export function getHeight(w: Widget, placement: Placement, context: RenderContext, computed?: number, linesize?: boolean): number {
  let r = 1;
  let h = isComputed(w.height) ? evaluate(context, w.height.x) : w.height;
  if (h == null && linesize) h = maxFontSize(w);
  if (typeof h === 'number') r = h;
  else if (typeof h === 'object' && 'percent' in h && h.percent && placement.availableY) r = +(placement.availableY * (h.percent / 100)).toFixed(4);
  else if (h === 'auto' || (computed && !h)) return computed || NaN;
  return r;
}

export function getHeightWithMargin(w: Widget, placement: Placement, context: RenderContext, computed?: number, linesize?: boolean): number {
  let h = getHeight(w, placement, context, computed, linesize);
  if (w.margin) {
    const m = expandMargin(w, context);
    h += m[0] + m[2];
  }
  return h;
}

function maxYOffset(points: Array<[number, number, number, number]>): number {
  return points.reduce((a, c) => a > c[1] + c[3] ? a : c[1] + c[3], 0);
}

function maxXOffset(points: Array<[number, number, number, number]>): number {
  return points.reduce((a, c) => a > c[0] + c[2] ? a : c[0] + c[2], 0);
}

export function expandMargin(w: { margin?: Margin|Computed }, context: RenderContext): [number, number, number, number] {
  if (w.margin) {
    const m = isComputed(w.margin) ? evaluate(context, w.margin.x) : w.margin;
    if (Array.isArray(m)) {
      if (m.length === 4) return m.map(e => +e) as [number, number, number, number];
      else if (m.length === 2) return [+m[0], +m[1], +m[0], +m[1]];
    } else if (typeof m === 'number') return [m, m, m, m];
  }

  return [0, 0, 0, 0];
}
