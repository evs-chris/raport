import { Displayed, Layout, Placement, Widget, Margin, MeasureFont, Computed, Borders } from '../report';
import { extend as extendContext, Context, ExtendOptions as ContextExtendOptions, evaluate, isValueOrExpr } from '../data/index';
import { error, RenderContext, addStyle } from './error';

export { RenderContext, error, addStyle } from './error';

export function isComputed(v: any): v is Computed {
  return v && typeof v === 'object' && isValueOrExpr(v.x);
}

export function maybeComputed<V, T = Exclude<V, Computed>>(v: V, context: RenderContext): T {
  if (!isComputed(v)) return v as any;
  else if (v.x) return evaluate(context, v.x);
}

export interface ExtendOptions extends ContextExtendOptions {
  commit?: { [key: string]: any };
}

export function extend(context: RenderContext, opts: ExtendOptions): RenderContext {
  return { parent: context, report: context.report, context: extendContext(context.context, opts), styles: context.styles, styleMap: context.styleMap, commit: opts.commit };
}

const htmlChars = /[><&]/g;
const htmlReplace = { '<': '&lt;', '>': '&gt;', '&': '&amp;' };
export function escapeHTML(html: string): string {
  return ('' + html).replace(htmlChars, m => htmlReplace[m] || '');
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
export function measureEstimate(text: string, width: number, context: RenderContext, font?: MeasureFont): number {
  const family = (font && maybeComputed(font.family, context)) || 'sans';
  const size = (font && maybeComputed(font.size, context)) || 0.83;
  const line = (font && maybeComputed(font.line, context)) || size;
  const brw = font && 'break-word' in font ? font['break-word'] : true;
  const avg = (((font && maybeComputed(font.metric, context)) || ((family === 'mono' || /fixed|mono/i.test(family) ? avgs.mono :
    family === 'narrow' || /narrow|condensed/i.test(family) ? avgs.narrow :
      family === 'sans' || /sans|arial|helvetica/i.test(family) ? avgs.sans :
        avgs.serif))) * size) / 16;
  
  const lines = text.split(/\r?\n/g);
  return lines.reduce((a, c) => {
    const [word, lines] = c.split(/\s|-/g).reduce((a, c) => {
      const wlen = (c.length + 1) * avg;
      if (a[0] + wlen > width) {
        if (a[0] === 0 || wlen > width) {
          if (brw) {
            a[0] = (wlen - (width - a[0])) % width;
            if (wlen > width) a[1] += Math.floor(wlen / width);
          }
          a[1]++;
        } else {
          a[0] = wlen;
          a[1]++;
        }
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
export let measure: (text: string, width: number, context: RenderContext, font?: MeasureFont) => number = measureEstimate;

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
  attempt?: number;
}

/** Render the given widget to string or a continuation using a registered renderer */
export function renderWidget(w: Widget, context: RenderContext, placement: Placement, state?: RenderState): RenderContinuation {
  const renderer = renderers[w.type];
  if (!renderer || (w.hide && evaluate(extendContext(context.context, { special: { widget: w, placement } }), w.hide))) return { output: '', height: 0 };

  if (!('height' in w) && renderer.container) w.height = 'auto'; 
  const h = getHeightWithMargin(w, placement, context);

  if (placement.maxY && !isNaN(h) && h > placement.maxY) return error(context, placement);

  if (placement.availableY != null && h > placement.availableY) return { output: '', continue: { offset: 0 }, cancel: true };

  let extraHeight = 0;

  if (w.margin) {
    const m = expandMargin(w, context, placement);
    extraHeight += m[0] + m[2];
    if (placement.availableY != null) placement.availableY -= m[0] + m[2];
  }

  if (w.border && !h && w.box === 'expand') {
    const b = expandBorder(w, context, placement)
    extraHeight += b[0] + b[2];
    if (placement.availableY != null) placement.availableY -= b[0] + b[2];
  }

  const r = renderer.render(w, context, placement, state);
  if (typeof r === 'string') return { output: r, height: h, width: getWidthWithMargin(w, placement, context) };

  if (typeof r.height === 'number') r.height = +r.height.toFixed(6);
  if (typeof r.width === 'number') r.width = +r.width.toFixed(6);
  if (placement.availableY != null) placement.availableY = +placement.availableY.toFixed(6);
  
  if (placement.maxY && r.height > placement.maxY) return error(context, placement);

  if (isNaN(h) && placement.availableY != null && r.height > placement.availableY) return { output: '', continue: { offset: 0 }, height: r.height || 0, cancel: true };

  r.height = r.height || 0;

  r.height += extraHeight;

  r.height = +(r.height.toFixed(6));

  return r;
}

const layouts: { [name: string]: (widget: Widget, offset: number, margin: [number, number, number, number], placement: Placement, placements: Array<[number, number, number, number]>, context: RenderContext) => Placement } = {};

export function registerLayout(name: string, layout: (widget: Widget, offset: number, margin: [number, number, number, number], placement: Placement, placements: Array<[number, number, number, number]>, context: RenderContext) => Placement) {
  layouts[name] = layout;
}

registerLayout('row', (w, o, m, p, ps, context) => {
  let n: Placement;
  let br = isComputed(w.br) ? evaluate(extendContext(context.context, { special: { placement: p, widget: w } }), w.br.x) : w.br;
  let availableX = p.maxX - ps[0][0] - ps[0][2] + ps[ps.length - 1][0];
  if (availableX <= 0) {
    availableX = p.maxX;
    br = true;
  }
  if (br || ps[0][0] + ps[0][2] + getWidthWithMargin(w, { x: p.x, y: p.y, maxX: p.maxX, maxY: p.maxY, availableY: p.availableY, availableX }, context) - ps[ps.length - 1][0] > p.maxX) {
    n = { x: m[3], y: maxYOffset(ps), availableX: p.maxX, maxX: p.maxX };
    n.availableY = p.availableY - (n.y - o);
  } else {
    n = { x: ps[0][0] + ps[0][2], y: ps[0][1], availableX, maxX: p.maxX, availableY: p.availableY };
  }

  n.y -= o;

  return n;
});

/** Render child widgets handling continuation across pages */
export function renderWidgets(widget: Widget, context: RenderContext, placement: Placement, state?: RenderState, layout?: Layout): RenderContinuation {
  if (Array.isArray(widget.widgets)) {
    let s = '';
    const offset = (state || { offset: 0 }).offset;
    const ps: Array<[number, number, number, number]> = [[0, offset, 0, 0]];

    const m = expandMargin(widget, context, placement);
    ps[0][0] += m[3];
    ps[0][1] += m[0];

    // placement starts with availableY shrunk for margins, so offset y by the top margin
    const yo = m[0] || 0;

    if (widget.border && widget.box === 'expand') {
      const b = expandBorder(widget, context, placement);
      if (placement.availableX != null) placement.availableX -= b[1] + b[3];
      if (placement.availableY != null) placement.availableY -= b[0] + b[2];
    }

    for (let i = state && state.last || 0; i < widget.widgets.length; i++) {
      let w: Widget = widget.widgets[i];
      if (w.macro) w = expandMacro(w.macro, w, context, placement, state);
      if (w.hide && evaluate(extendContext(context.context, { special: { widget: w, placement } }), w.hide)) continue;

      // allow widgets that are taller than max height to be dropped
      let h = placement && getHeightWithMargin(w, placement, context);
      if (h > placement.maxY) h = 1;

      if (placement && placement.availableY != null && h > placement.availableY) {
        const offset = maxYOffset(ps);
        state = state || { offset };
        state.last = i;
        return { output: s, continue: state, height: offset };
      } else {
        let lp = Array.isArray(layout) && (layout[i] || [0, 0]);
        if (!lp || !Array.isArray(lp)) lp = [0, 0];
        if (!lp[0]) lp[0] = 0;
        if (!lp[1]) lp[1] = 0;
        let p: Placement = Array.isArray(lp) ? { x: lp[0] < 0 ? lp[0] : lp[0] + m[3], y: lp[1] < 0 ? lp[1] : lp[1] + m[0], maxX: placement.maxX } : (lp || placement);
        if (Array.isArray(lp)) p.availableX = p.maxX;

        if (!layout || typeof layout === 'string') {
          const l = layout ? layouts[layout as string] || layouts.row : layouts.row;
          p = l(w, offset, m, placement, ps, context);
          if (h > p.availableY) {
            if (w.height === 'grow') h = getHeightWithMargin(w, p, context);
            if (h > p.availableY) {
              const offset = maxYOffset(ps);
              state = state || { offset };
              state.last = i;
              return { output: s, continue: state, height: offset };
            }
          }
        }

        p.maxX = p.maxX || placement.maxX;
        p.maxY = p.maxY || placement.maxY;

        if (p.x < 0) {
          p.offsetX = m[3];
          p.x = (placement.availableX || 1) + p.x - getWidthWithMargin(w, placement, context) + 1;
        }
        if (p.y < 0) {
          p.offsetY = m[0];
          if (placement.availableY == null) p.y = 0;
          else p.y = (placement.availableY || 1) + p.y - h + 1;
        }

        const { x, y } = p;
        const r = renderWidget(w, context, p, state && state.child);

        // skip empty output
        if (typeof r === 'string' && !r || (!r.cancel && !r.output && !r.continue && !r.height)) continue;

        if (typeof r === 'string') {
          s += r;
          ps.unshift([x, y, getWidthWithMargin(w, placement, context), getHeightWithMargin(w, placement, context)]);
        } else {
          if (r.cancel) return { output: '', cancel: true };
          const h = r.height || getHeightWithMargin(w, placement, context) || 0;
          if (y - yo + h > placement.availableY) {
            const offset = maxYOffset(ps);
            state = state || { offset };
            state.last = i;
            state.attempt = (+state.attempt || 0) + 1;
            if (state.attempt > 1) return error(context, placement);
            return { output: s, continue: state, height: offset };
          }
          s += r.output;
          ps.unshift([x, y, r.width || getWidthWithMargin(w, placement, context), h]);
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
  return { output: '', height: 0 };
}

export function getWidth(w: Widget, placement: Placement, context: RenderContext): number {
  let width = isComputed(w.width) ? evaluate(extendContext(context.context, { special: { widget: w, placement} }), w.width.x) : w.width;
  const m = w.margin && expandMargin(w, context, placement);
  let pct = false;
  if (width === 'grow') width = placement.availableX || placement.maxX;
  else if (!width && width !== 0) width = placement.maxX || 51;
  else if (typeof width === 'number') width;
  else {
    width = +((width.percent / 100) * (placement.maxX || 51)).toFixed(4);
    pct = true;
  }
  if (typeof width === 'number' && (w.box === 'contain' || (pct || width === placement.availableX) && w.box !== 'expand')) {
    if (m) width -= m[1] + m[3];
    else if (w.font && w.font.right) width -= w.font.right;
  }
  return width;
}

export function getWidthWithMargin(w: Widget, placement: Placement, context: RenderContext): number {
  let r = getWidth(w, placement, context);
  if (w.margin) {
    const m = expandMargin(w, context, placement);
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
      const t = w.text[i];
      if (typeof t === 'object' && 'font' in t && t.font && t.font.size > n) n = t.font.size;
    }
  }
  return n;
}

export function getHeight(w: Widget, placement: Placement, context: RenderContext, computed?: number, linesize?: boolean): number {
  let r = 1;
  let h = isComputed(w.height) ? evaluate(extendContext(context.context, { special: { widget: w, placement, computed, linesize } }), w.height.x) : w.height;
  const m = w.margin && expandMargin(w, context, placement);
  const b = w.border && expandBorder(w, context, placement);
  let pct = false;
  if (h == null && linesize) h = maxFontSize(w);

  if (typeof h === 'number') r = h;
  else if (h && typeof h === 'object' && 'percent' in h && h.percent && placement.maxY) {
    r = +(placement.maxY * (h.percent / 100)).toFixed(4);
    pct = true;
  } else if (h === 'grow') {
    r = placement.availableY || 0;
  } else if (h === 'auto' || typeof h === 'string' || (h == null && w.type === 'container') || (computed && !h)) {
    if (b && w.box === 'expand') return computed + b[0] + b[2] || NaN;
    return computed || NaN;
  }

  if (typeof r === 'number' && (w.box === 'contain' || (pct || r === placement.availableY) && w.box !== 'expand')) {
    if (m) r -= m[0] + m[2];
  }

  return r;
}

export function getHeightWithMargin(w: Widget, placement: Placement, context: RenderContext, computed?: number, linesize?: boolean): number {
  let h = getHeight(w, placement, context, computed, linesize);
  if (typeof h === 'number' && w.margin) {
    const m = expandMargin(w, context, placement);
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

export function expandMargin(w: { margin?: Margin|Computed }, context: RenderContext, placement: Placement): [number, number, number, number] {
  if (w.margin) {
    const m = isComputed(w.margin) ? evaluate(extendContext(context.context, { special: { widget: w, placement} }), w.margin.x) : w.margin;
    if (Array.isArray(m)) {
      if (m.length === 4) return m.map(e => +e) as [number, number, number, number];
      else if (m.length === 2) return [+m[0], +m[1], +m[0], +m[1]];
    } else if (typeof m === 'number') return [m, m, m, m];
  }

  return [0, 0, 0, 0];
}

export function expandBorder(w: { border?: number|number[]|Borders|string }, context: RenderContext, placement: Placement): [number, number, number, number] {
  let b = w.border;
  let res: [number, number, number, number] = [0, 0, 0, 0];
  if (typeof b === 'string' || (b && !Array.isArray(b) && typeof b === 'object' && ('v' in b || 'r' in b || 'op' in b))) b = evaluate(extendContext(context.context, { special: { widget: w, placement } }), b as string);
  if (typeof b === 'number') res = [0, 0, b, 0];
  else if (Array.isArray(b)) {
    if (b.length === 1) res = [b[0], b[0], b[0], b[0]];
    else if (b.length === 2) res = [b[0], b[1], b[0], b[1]];
    else if (b.length === 3) res = [b[0], b[1], b[2], b[1]];
    else if (b.length >= 4) res = [b[0], b[1], b[2], b[3]];
  } else if (b && typeof b === 'object') res = [b.top || 0, b.right || 0, b.bottom || 0, b.left || 0]

  for (let i = 0; i < 4; i++) res[i] = res[i] * 0.0625;
  return res;
}

export function expandMacro(macro: string, w: Widget, ctx: RenderContext, placement: Placement, state: RenderState): Widget {
  const res = evaluate(extendContext(ctx.context, { special: { widget: w, placement, state } }), macro);
  const orig = w;
  if (res && !Array.isArray(res) && typeof res === 'object') {
    if ('content' in res || 'props' in res || 'properties' in res) w = Object.assign({}, w, res.props, res.properties, { widgets: Array.isArray(res.content) ? res.content : res.content ? [res.content] : w.widgets, macro: undefined });
    else if ('replace' in res && res.replace && typeof res.replace === 'object' && 'type' in res.replace) return res.replace;
    else w = Object.assign({}, w, { widgets: [res], macro: undefined });
  } else if (Array.isArray(res)) w = Object.assign({}, w, { widgets: res, macro: undefined });
  return w;
}
