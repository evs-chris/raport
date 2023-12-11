import { Parser, parser as makeParser, opt, rep1sep, seq, alt, map, readTo, read1To, rep1, rep, str, read, read1, chars } from 'sprunge';

type Style = BoolStyle | ValueStyle<any>;
interface BoolStyle {
  tag: string;
}
interface ValueStyle<T> {
  tag: string;
  value: T|null;
}

// zero width space
const zwsp = '&#8203;';

const sp = read1(' \r\n\t');
const ws = read(' \r\n\t');
const hex = '0123456789abcdef';
const integer = map(read1('0123456789'), v => +v);
const number = map(seq(opt(str('-')), read1('0123456789'), opt(seq(str('.'), read1('0123456789')))), ([m, n, d]) => +[m, n, d?.[0], d?.[1]].filter(v => v).join(''));
const color = map(seq(opt(str('#')), alt(chars(8, hex), chars(6, hex), chars(4, hex), chars(3, hex))), ([, color]) => `#${color}`);
const remOrPercent = map(seq(number, opt(str('%'))), ([n, p]) => `${n}${p ? '%' : 'rem'}`);
const places = str('left', 'right', 'top', 'bottom', 'center');

const align = map(seq(str('align'), opt(seq(str('='), alt(
  seq(str('top', 'middle', 'bottom', 'base'), opt(seq(sp, str('left', 'right', 'center')))),
  seq(str('left', 'right', 'center'), opt(seq(sp, str('top', 'middle', 'bottom', 'base'))))
)))), ([,v]) => ({ tag: 'align', value: v ? [v[1][0], v[1][1]?.[1]].filter(v => v) : null }));
const valign = map(seq(str('valign'), opt(seq(str('='), str('top', 'middle', 'bottom', 'base')))), ([, v]) => ({ tag: 'valign', value: v ? v[1] : null }));

const pad = map(seq(str('pad'), opt(seq(str('='), rep1sep(number, sp)))), ([, v]) => ({ tag: 'pad', value: v ? v[1] : null }));
const margin = map(seq(str('margin'), opt(seq(str('='), rep1sep(number, sp)))), ([, v]) => ({ tag: 'margin', value: v ? v[1] : null }));
const width = map(seq(str('width', 'w'), opt(seq(str('='), remOrPercent))), ([,v]) => ({ tag: 'width', value: v ? v[1] : null }));
const height = map(seq(str('height', 'h'), opt(seq(str('='), remOrPercent))), ([,v]) => ({ tag: 'height', value: v ? v[1] : null }));
const line = map(seq(str('line'), opt(seq(str('='), number))), ([,v]) => ({ tag: 'line', value: v ? v[1] : null }));
const fg = map(seq(str('fg', 'color', 'fore'), opt(seq(str('='), color))), ([,v]) => ({ tag: 'fg', value: v ? v[1] : null }));
const bg = map(seq(str('bg', 'background', 'back'), opt(seq(str('='), color))), ([,v]) => ({ tag: 'bg', value: v ? v[1] : null }));
const size = map(seq(str('size'), opt(seq(str('='), number))), ([,v]) => ({ tag: 'size', value: v ? v[1] : null }));
const font = map(seq(str('font'), opt(seq(str('='), read1To(',|')))), ([,v]) => ({ tag: 'font', value: v ? v[1] : null }));
const rotate = map(seq(str('rotate'), opt(seq(str('='), number, ws, opt(str('left', 'right')), opt(seq(sp, alt(remOrPercent, places), sp, alt(remOrPercent, places)))))), ([,v]) => ({ tag: 'rotate', value: v ? { turn: v[1] * (v[3] === 'left' ? -1 : 1), origin: v[4] ? [v[4][1], v[4][3]] : undefined } : null }));
const move = map(seq(str('move'), opt(seq(str('='), remOrPercent, sp, remOrPercent))), ([,v]) => ({ tag: 'move', value: v ? { x: v[1], y: v[3] } : null }));

const trash = map(readTo(',|'), v => ({ tag: 'trash', value: v }));

const border = map(seq(
  str('border'), opt(seq(str('='),opt(str('solid', 'dot', 'dash', 'double')), ws,
  rep1sep(integer, sp), ws, opt(seq(str('/'), ws, rep1sep(number, sp))), ws, opt(color),
  ))), ([, v]) => ({ tag: 'border', value: v ? { style: v[1] || 'solid', width: v[3], radius: v[5]?.[2], color: v[7] } : null }));

const bools = map(alt(str('sub', 'sup', 'bold', 'italic', 'underline', 'strike', 'overline', 'overflow', 'nowrap', 'pre', 'br', 'b', 'i', 'u')), tag => ({ tag }));

const tag: Parser<Style[]> = map(seq(str('|'), ws, rep1sep(alt(border, align, fg, bg, valign, size, line, font, pad, margin, width, height, bools, rotate, move, trash), seq(ws, str(','), ws), 'allow'), readTo('|'), str('|')), ([, , tags]) => tags.filter(t => t.tag !== 'trash'));
const text = map(rep1(alt(read1To('\\|', true), map(str('\\|'), () => '|'))), txts => txts.join(''));

const all = rep(alt<Style[]|string>(text, tag))

const parser = makeParser(all, { consumeAll: true, undefinedOnError: true });

interface State {
  bool: { [key: string]: boolean }
  value: { [key: string]: any[] }
}

const blocks = ['border', 'width', 'height', 'pad', 'margin', 'align', 'overflow', 'nowrap', 'rotate', 'move'];

const aliases = {
  b: 'bold',
  i: 'italic',
  u: 'underline',
}

function process(stuff: Array<Style[]|string>): string {
  let res = '';
  let open = false;
  const state: State = { bool: {}, value: {} };
  const blockstack: string[][] = [];
  for (const s of stuff) {
    if (typeof s === 'string') {
      if (!state.bool.pre && /^\s/.test(s)) res += zwsp;
      res += s;
      if (!state.bool.pre && /\s$/.test(s)) res += zwsp;
    } else {
      let drop = false;
      let block: string[];
      for (const style of s) {
        const tag = aliases[style.tag] || style.tag;
        if ('value' in style) {
          if (style.value !== null) {
            (state.value[tag] || (state.value[tag] = [])).push(style.value);
            if (blocks.includes(tag) || block && tag === 'bg') (block || (block = [])).push(tag);
          } else {
            if (blocks.includes(tag)) drop = true;
            else if (tag === 'bg' && (drop || blockstack && blockstack.length && blockstack[blockstack.length - 1].includes('bg'))) drop = true;
            else (state.value[tag] || (state.value[tag] = [])).pop();
          }
        } else {
          if (tag === 'br') res += '<br/>';
          else if (blocks.includes(tag) && block.length) block.push(tag);
          else state.bool[tag] = !state.bool[tag];
        }
      }
      if (open) res += `</span>`;
      open = true;
      if (drop) {
        const frame = blockstack.pop();
        if (frame) {
          res += '</span>';
          for (const b of frame) (state.value[b] || (state.value[b] = [])).pop();
        }
      }
      if (block) {
        blockstack.push(block);
        res += `<span style="${getStyle(state, block)}">`;
      }
      res += `<span style="${getStyle(state, 'inline')}">`;
    }
  }
  if (open) res += `</span>`;
  return res;
}

export function style(str: string): string {
  const parsed = parser(str);
  if (Array.isArray(parsed)) return process(parsed);
  return str;
}

const flexAlign = { top: 'start', middle: 'center', bottom: 'end', base: 'baseline' };
const borderStyle = { dot: 'dotted', dash: 'dashed' };
function getStyle(state: State, which: 'inline'|string[]) {
  let res = '';

  if (which === 'inline') {
    const bs = state.bool;
    if (bs.underline || bs.overline || bs.strike) res += `text-decoration-line:${[bs.underline && 'underline', bs.overline && 'overline', bs.strike && 'line-through'].filter(v => v).join(' ')};`
    if (bs.sup || bs.sub) {
      res += `font-size:70%;`;
      if (bs.sup) res += `vertical-align:super;`;
      if (bs.sub) res += `vertical-align:sub;`;
    }
    if (bs.italic) res += `font-style:italic;`;
    if (bs.bold) res += `font-weight:bold;`;
    if (bs.pre) res += `white-space:pre-wrap;`;

    const vs = state.value;
    if (Array.isArray(vs.valign)) {
      const v = vs.valign[vs.valign.length - 1];
      if (v) res += `vertical-align:${v === 'base' ? 'baseline' : v};`;
    }

    if (Array.isArray(vs.fg)) {
      const v = vs.fg[vs.fg.length - 1];
      if (v) res += `color:${v};`;
    }

    if (Array.isArray(vs.bg)) {
      const v = vs.bg[vs.bg.length - 1];
      if (v) res += `background-color:${v};`;
    }

    if (Array.isArray(vs.size)) {
      const v = vs.size[vs.size.length - 1];
      if (v != null) res += `font-size:${v}rem;`;
    }

    if (Array.isArray(vs.font)) {
      const v = vs.font[vs.font.length - 1];
      if (v != null) res += `font-family:${v};`;
    }

    if (Array.isArray(vs.line)) {
      const v = vs.line[vs.line.length - 1];
      if (v != null) res += `line-height:${v}rem;`;
    }
  } else {
    res += `display:inline-flex;box-sizing:content-box;overflow:hidden;`;
    const vs = state.value;

    let transforms: string[];

    if (which.includes('align') && Array.isArray(vs.align)) {
      const v = vs.align[vs.align.length - 1];
      if (Array.isArray(v)) {
        let vv = v.find(v => ['top', 'middle', 'bottom', 'base'].includes(v));
        if (vv) res += `align-items:${flexAlign[vv]};`;
        vv = v.find(v => ['left', 'right', 'center'].includes(v));
        if (vv) res += `justify-content:${vv};`;
      }
    }

    if (which.includes('width') && Array.isArray(vs.width)) {
      const v = vs.width[vs.width.length - 1];
      if (v != null) res += `width:${v};`;
    }

    if (which.includes('height') && Array.isArray(vs.height)) {
      const v = vs.height[vs.height.length - 1];
      if (v != null) res += `height:${v};`;
    }

    if (which.includes('pad') && Array.isArray(vs.pad)) {
      const v: number[] = vs.pad[vs.pad.length - 1];
      if (Array.isArray(v) && v.length) {
        res += `padding:${v[0]}rem`;
        if (v.length > 1) res += ` ${v[1]}rem`;
        if (v.length > 2) res += ` ${v[2]}rem`;
        if (v.length > 3) res += ` ${v[3]}rem`;
        res += ';';
      }
    }

    if (which.includes('margin') && Array.isArray(vs.margin)) {
      const v: number[] = vs.margin[vs.margin.length - 1];
      if (Array.isArray(v) && v.length) {
        res += `margin:${v[0]}rem`;
        if (v.length > 1) res += ` ${v[1]}rem`;
        if (v.length > 2) res += ` ${v[2]}rem`;
        if (v.length > 3) res += ` ${v[3]}rem`;
        res += ';';
      }
    }

    if (which.includes('border') && Array.isArray(vs.border)) {
      const v: { style: string; color?: string; width: number[]; radius: number[] } = vs.border[vs.border.length - 1];
      if (v) {
        res += `border-style:${borderStyle[v.style] || v.style};border-width:${v.width[0]}px`;
        if (v.width.length > 1) res += ` ${v.width[1]}px`;
        if (v.width.length > 2) res += ` ${v.width[2]}px`;
        if (v.width.length > 3) res += ` ${v.width[3]}px`;
        res += ';';
        if (v.color) res += `border-color:${v.color};`;
        if (v.radius) {
          res += `border-radius:${v.radius[0]}rem`;
          if (v.radius.length > 1) res += ` ${v.radius[1]}rem`;
          if (v.radius.length > 2) res += ` ${v.radius[2]}rem`;
          if (v.radius.length > 3) res += ` ${v.radius[3]}rem`;
          res += ';';
        }
      }
    }

    if (which.includes('bg') && Array.isArray(vs.bg)) {
      const v = vs.bg[vs.bg.length - 1];
      if (v) res += `background-color:${v};`;
    }

    if (which.includes('rotate') && Array.isArray(vs.rotate)) {
      const v: { turn: number; origin?: [string, string] } = vs.rotate[vs.rotate.length - 1];
      if (v) {
        if (v.origin) res += `transform-origin:${v.origin[0]} ${v.origin[1]};`;
        (transforms || (transforms = []))[which.indexOf('rotate')] = `rotate(${v.turn}turn)`;
      }
    }

    if (which.includes('move') && Array.isArray(vs.move)) {
      const v: { x: string; y: string } = vs.move[vs.move.length - 1];
      if (v) (transforms || (transforms = []))[which.indexOf('move')] = `translate(${v.x}, ${v.y})`;
    }

    if (transforms) res += `transform:${transforms.filter(v => v).join(' ')};`;

    if (which.includes('nowrap')) res += `white-space:nowrap;`;
    if (which.includes('overflow')) res += `overflow:visible;`;
  }

  return res;
}
