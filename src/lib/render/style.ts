import { Borders, Font, Placement, Widget, Computed } from '../report';
import { expandMargin, expandBorder, getHeightWithMargin, maybeComputed, getWidthWithMargin, RenderContext } from './index';
import { ValueOrExpr } from '../data/index';

export interface StyleOptions {
  computedHeight?: number;
  container?: boolean;
  lineSize?: boolean;
  font?: Font;
}

export function nextStyleId(ctx: RenderContext, prefix: string): number {
  if (!ctx.styleMap.ids[prefix]) ctx.styleMap.ids[prefix] = 0;
  return ctx.styleMap.ids[prefix]++;
}

export function mapStyle(ctx: RenderContext, style: string, prefix: string): string {
  if (!style) return '';
  const mapped = ctx.styleMap.styles[style];
  if (mapped) return mapped;
  const id = `${prefix}${nextStyleId(ctx, prefix)}`;
  return ctx.styleMap.styles[style] = id;
}

export function styleClass(ctx: RenderContext, cls: string[], [style, inline]: [string, string], inlineStyle?: string, classPrefix?: string): string {
  if (ctx.report.classifyStyles !== false) {
    const cs = [];
    if (inline) cs.push(mapStyle(ctx, inline, 'h'));
    cs.push(mapStyle(ctx, style, classPrefix || 's'));
    return ` class="${cls.concat(cs).join(' ')}"${inlineStyle ? ` style="${inlineStyle}"` : ''}`;
  } else {
    const s = `${style}${inlineStyle || ''}${inline || ''}`;
    const c = `${cls.length ? ` class="${cls.join(' ')}"` : ''}`;
    return `${c}${s ? ` style="${s}"` : ''}`;
  }
}

export function style(w: Widget, placement: Placement, context: RenderContext, opts?: StyleOptions): [string, string] {
  let s = `left:${(placement.x || 0) + (placement.offsetX || 0)}rem;top:${((placement.y || 0) + (placement.offsetY || 0))}rem;`;
  let i = ``;

  s += `width:${getWidthWithMargin(w, placement, context)}rem;`;

  let h = getHeightWithMargin(w, placement, context, opts && opts.computedHeight, opts && opts.lineSize) || 1;
  if (w.height === 'grow' && w.margin) {
    const m = expandMargin(w, context, placement);
    h += m[0] + m[2];
  }
  if (opts && opts.container && opts.computedHeight) i = `height:${h}rem;`;
  else s += `height:${h}rem;`;

  const line = w.font && maybeComputed(w.font.line, context);
  const size = w.font && maybeComputed(w.font.size, context);
  if (line != null || size != null) s += `line-height: ${line ?? size}rem;`;

  if (w.margin) {
    const m = expandMargin(w, context, placement);
    if (m[0] || m[1] || m[2] || m[3]) s += `padding:${m[0]}rem ${m[1]}rem ${m[2]}rem ${m[3]}rem;`;
  } else if (w.font && w.font.right) {
    s += `padding-right:${w.font.right}rem;`;
  }
  
  if ((opts && opts.font) || w.font) s += styleFont((opts && opts.font) || w.font, context);
  if (w.border) s += styleBorder(w, context, placement);

  s += styleExtra(w, context);

  return [s, i];
}

export function styleExtra(w: { bg?: ValueOrExpr|Computed; radius?: ValueOrExpr|Computed }, context: RenderContext): string {
  let s = '';

  const bg = maybeComputed(w.bg, context);
  if (bg) s += `background-color:${bg};`;

  const radius = maybeComputed(w.radius, context);
  if (radius) s += `border-radius:${radius};`;

  return s;
}

export function styleFont(f: Font, context: RenderContext): string {
  if (!f) return '';
  let t: any;
  let size: any;
  let s = '';
  if (t = maybeComputed(f.family, context)) s += `font-family:${t};`;
  if (t = maybeComputed(f.color, context)) s += `color:${t};`;
  if (t = maybeComputed(f.align, context)) s += `text-align:${t};`;
  if (t = maybeComputed(f.size, context)) {
    s += `font-size:${t}rem;`;
    size = t;
  }

  t = maybeComputed(f.line, context);
  if (t === 0) s += `line-height:initial;`;
  else if (t != null) s += `line-height:${t}rem;`;
  else if (size) s += `line-height:${size}rem;`;

  if (t = maybeComputed(f.weight, context)) s += `font-weight:${t};`;
  if (t = maybeComputed(f.pre, context)) s += `white-space:pre-wrap;word-break:break-word;`;
  const pre = t;
  if (t = maybeComputed(f.clamp, context)) s += `${pre ? '' : 'white-space:nowrap;'}overflow:hidden;`;
  return s;
}

export function styleBorder(w: { border?: number|Borders|number[]|string }, context: RenderContext, placement: Placement): string {
  const b = expandBorder(w, context, placement);
  if (b[0] + b[1] + b[2] + b[3]) return `border-style:solid;border-width:${b[0]}rem ${b[1]}rem ${b[2]}rem ${b[3]}rem;`;
  return '';
}

export function styleImage(fit?: string): [string, string] {
  const s = `background-size:${!fit || fit === 'contain' ? 'contain;background-position:center' : fit === 'stretch' ? '100% 100%' : 'cover'};`;
  
  return [s, ''];
}
