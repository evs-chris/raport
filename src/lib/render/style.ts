import { Borders, Font, Placement, Widget } from '../report';
import { expandMargin, getHeightWithMargin, getWidth, getWidthWithMargin, getHeight, RenderContext } from './index';
import { evaluate, ValueOrExpr } from '../data/index';

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
  let s = `left:${placement.x || 0}rem;top:${(placement.y || 0)}rem;`;
  let i = ``;

  s += `width:${getWidthWithMargin(w, placement, context)}rem;`;

  const h = getHeightWithMargin(w, placement, context, opts && opts.computedHeight, opts && opts.lineSize) || 1;
  if (opts && opts.container && opts.computedHeight) i = `height:${h}rem;`;
  else s += `height:${h}rem;`;

  s += `${!opts || !opts.container || (w.font && w.font.line) ? `line-height:${(w.font && w.font.line || w.font && w.font.size) || getHeight(w, placement, context, opts && opts.computedHeight, opts && opts.lineSize)}rem;` : ''}`;

  if (w.margin) {
    const m = expandMargin(w, context, placement);
    if (m[0] || m[1] || m[2] || m[3]) s += `padding:${m[0]}rem ${m[1]}rem ${m[2]}rem ${m[3]}rem;`;
  } else if (w.font && w.font.right) {
    s += `padding-right:${w.font.right}rem;`;
  }
  
  if ((opts && opts.font) || w.font) s += styleFont((opts && opts.font) || w.font);
  if (w.border) s += styleBorder(w.border, context);

  return [s, i];
}

export function styleFont(f: Font): string {
  if (!f) return '';
  let s = '';
  if (f.family) s += `font-family:${f.family};`;
  if (f.color) s += `color:${f.color};`;
  if (f.align) s += `text-align:${f.align};`;
  if (f.line === 0) s += `line-height:initial;`;
  else if (f.line == null && f.size) s += `line-height:${f.size}rem;`;
  if (f.size) s += `font-size:${f.size}rem;`;
  if (f.weight) s += `font-weight:${f.weight};`;
  if (f.pre) s += `white-space:pre-wrap;`;
  if (f.clamp) s += `white-space:nowrap;overflow:hidden;`;
  return s;
}

export function styleBorder(b: number|number[]|Borders|ValueOrExpr, context: RenderContext): string {
  if (typeof b === 'string' || (typeof b === 'object' && ('v' in b || 'r' in b || 'op' in b))) b = evaluate(context, b);
  if (typeof b === 'number') return `border-bottom:${b * 0.0625}rem solid;`;
  else if (isBorder(b)) return `border-style:solid;border-width:${(b.top || 0) * 0.0625}rem ${(b.right || 0) * 0.0625}rem ${(b.bottom || 0) * 0.0625}rem ${(b.left || 0) * 0.0625}rem;`;
  else if (Array.isArray(b)) {
    if (b.length === 1) return `border:${(+b[0] || 0) * 0.0625}rem solid;`;
    else if (b.length === 2) return `border-style:solid;border-width:${(+b[0] || 0) * 0.0625}rem ${(+b[1] || 0) * 0.0625}rem ${(+b[0] || 0) * 0.0625}rem ${(+b[1] || 0) * 0.0625}rem;`;
    else if (b.length === 3) return `border-style:solid;border-width:${(+b[0] || 0) * 0.0625}rem ${(+b[1] || 0) * 0.0625}rem ${(+b[2] || 0) * 0.0625}rem ${(+b[1] || 0) * 0.0625}rem;`;
    else if (b.length === 4) return `border-style:solid;border-width:${(+b[0] || 0) * 0.0625}rem ${(+b[1] || 0) * 0.0625}rem ${(+b[2] || 0) * 0.0625}rem ${(+b[3] || 0) * 0.0625}rem;`;
  }
}

function isBorder(b: any): b is Borders {
  return typeof b === 'object' && ('top' in b || 'bottom' in b || 'left' in b || 'right' in b);
}
