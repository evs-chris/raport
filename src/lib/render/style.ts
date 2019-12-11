import { Borders, Font, Placement, Widget } from '../report';
import { expandMargin, getHeightWithMargin, getWidthWithMargin, getHeight, RenderContext } from './index';
import { evaluate, ValueOrExpr } from '../data/index';

export interface StyleOptions {
  computedHeight?: number;
  container?: boolean;
  font?: Font;
}

export function mapStyle(ctx: RenderContext, style: string): string {
  if (!style) return '';
  return ctx.styleMap.styles[style] || ((ctx.styleMap.styles[style] = `s${++ctx.styleMap.id}`) && `s${ctx.styleMap.id}`);
}

export function styleClass(ctx: RenderContext, cls: string[], style: string, inlineStyle?: string): string {
  if (ctx.report.classifyStyles) {
    return ` class="${cls.concat([mapStyle(ctx, style)]).join(' ')}"${inlineStyle ? ` style="${inlineStyle}"` : ''}`;
  } else {
    const s = `${style}${inlineStyle || ''}`;
    const c = `${cls.length ? ` class="${cls.join(' ')}"` : ''}`;
    return `${c}${s ? ` style="${s}"` : ''}`;
  }
}

export function style(w: Widget, placement: Placement, context: RenderContext, opts?: StyleOptions): string {
  let s = `left:${placement.x || 0}rem;top:${(placement.y || 0)}rem;`;
  if (!w.width) s += `right:${(w.margin || {})[1] || 0}rem;`;
  else if (typeof w.width !== 'number' && 'percent' in w.width) s += `width:${w.width.percent}%;`;
  else s += `width:${getWidthWithMargin(w, placement)}rem;`
  const h = getHeightWithMargin(w, placement, opts && opts.computedHeight) || 1;
  s += `height:${h}rem;${!opts || !opts.container || (w.font && w.font.line) ? `line-height:${(w.font && w.font.line) || getHeight(w, placement, opts && opts.computedHeight)}rem;` : ''}`;

  if (w.margin) {
    const m = expandMargin(w);
    if (m[0] || m[1] || m[2] || m[3]) s += `padding: ${m[0]}rem ${m[1]}rem ${m[2]}rem ${m[3]}rem;`;
  } else if (w.font && w.font.right) {
    s += `padding-right:${w.font.right}rem;`;
  }
  
  if ((opts && opts.font) || w.font) s += styleFont((opts && opts.font) || w.font);
  if (w.border) s += styleBorder(w.border, context);

  return s;
}

export function styleFont(f: Font): string {
  let s = '';
  if (f.family) s += `font-family:${f.family};`;
  if (f.color) s += `color:${f.color};`;
  if (f.align) s += `text-align:${f.align};`;
  if (f.size) s += `font-size:${f.size}rem;`;
  if (f.weight) s += `font-weight:${f.weight};`;
  if (f.pre) s += `white-space:pre-wrap;`;
  if (f.clamp) s += `white-space:nowrap;overflow:hidden;`;
  return s;
}

export function styleBorder(b: number|Borders|ValueOrExpr, context: RenderContext): string {
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
