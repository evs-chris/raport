import { Container, Label, Repeater, Image, MeasuredLabel, HTML } from '../report';
import { evaluate, filter, Group, ValueOrExpr, isValueOrExpr } from '../data/index';
import { parse as parseTemplate } from '../data/parse/template';

import { addStyle, escapeHTML, extend, getWidth, getInnerWidth, measure, registerRenderer, renderWidget, renderWidgets, RenderContinuation, RenderState, RenderContext, getHeightWithMargin, expandMargin } from './index';
import { styleClass, style, styleFont } from './style';

registerRenderer<Label>('label', (w, ctx, placement) => {
  addStyle(ctx, 'label', `.label {position:absolute;box-sizing:border-box;}`);
  let str = '';
  let sval: any;
  let val = (Array.isArray(w.text) ? w.text : [w.text]).map(v => {
    let val = evaluate(ctx, typeof v === 'object' && 'text' in v ? v.text : v);
    if (typeof v === 'object' && 'id' in v) {
      let c = ctx.context;
      while (c) {
        if (c.special && c.special.values) (c.special.values[v.id] || (c.special.values[v.id] = [])).push(val);
        c = c.parent;
      }
    }
    str += val;
    sval = val;
    if (typeof v === 'object' && 'text' in v) return `<span${styleClass(ctx, [], [styleFont(v.font), ''])}>${val}</span>`;
    else return val;
  }).join('');
  if (w.id) {
    let c = ctx.context;
    while (c) {
      if (c.special && c.special.values) (c.special.values[w.id] || (c.special.values[w.id] = [])).push(str);
      c = c.parent;
    }
  }
  if (w.format && w.format.name) {
    const args: ValueOrExpr[] = [{ v: !Array.isArray(w.text) || w.text.length === 1 ? sval : val }, { v: w.format.name }];
    val = evaluate(ctx, { op: 'format', args: args.concat(w.format.args || []) });
  }
  return `<span${styleClass(ctx, ['label'], style(w, placement, ctx, { lineSize: true }))}>${escapeHTML(val)}</span>`
});

registerRenderer<Container>('container', (w, ctx, placement, state) => {
  addStyle(ctx, 'container', `.container {position:absolute;box-sizing:border-box;}`);
  let h: number;
  if (!w.height) w.height = 'auto';
  else if (typeof w.height === 'number') h = getHeightWithMargin(w, placement, ctx);
  const wctx = w.context ? extend(ctx, { value: evaluate(ctx, w.context) }) : ctx;
  const cw = getInnerWidth(w, placement, ctx) || placement.availableX;
  const r = renderWidgets(w, wctx, { x: 0, y: 0, availableX: cw, availableY: h || placement.availableY, maxX: cw, maxY: placement.maxY }, state, w.layout);
  if (!r.cancel) {
    r.output = `<div${styleClass(ctx, ['container'], style(w, placement, ctx, { computedHeight: h || r.height, container: true }))}>${r.output}</div>`;
    r.height = h || r.height;
    r.width = cw || r.width;
  }
  return r;
}, { container: true });

type RepeatState = { part: 'group'|'header'|'body'|'footer'; group?: 'header'|'body'; src: Group|any[]; current: number; context?: RenderContext };
registerRenderer<Repeater, RepeatState>('repeater', (w, ctx, placement, state) => {
  addStyle(ctx, 'container', `.container {position:absolute;box-sizing:border-box;}`);
  if (!w.height) w.height = 'auto';
  let availableY = placement.availableY;
  let availableX = placement.availableX;

  let r: RenderContinuation;
  let html = '';
  let commit = false;
  const m = expandMargin(w, ctx);
  let y = !state || !state.state || state.state.part === 'header' ? m[0] : 0;
  availableY -= y;
  let group: Group;
  let groupNo: number|boolean = false;

  let src: Group|any[] = state && state.state && state.state.src;
  if (!src) {
    if (!w.source) return '';
    src = isValueOrExpr(w.source) ?
      evaluate(ctx, w.source) :
      filter(ctx.context.root.sources[w.source.source] || { value: [] }, w.source.filter, w.source.sort, w.source.group, ctx.context).value;
    (ctx.context.special || (ctx.context.special = {})).values || (ctx.context.special.values = {});
  }
    
  let arr: any[];

  if (!Array.isArray(src)) {
    if (!src || !Array.isArray(src.value)) return { output: '', height: 0 };
    group = src;
    arr = group.value;
    if (w.group) {
      groupNo = w.group.length > group.grouped ? w.group.length - group.grouped - 1 : false;
    }
  } else {
    arr = src;
  }

  if (group && (!state || !state.state || state.state.part === 'group')) {
    if (groupNo !== false) r = renderWidget(w.group[groupNo], extend(ctx, { value: group, special: { group: group.group, level: group && group.level } }), { x: 0, y, availableX: placement.availableX, maxX: placement.maxX, maxY: placement.maxY });

    if (r) {
      if (r.height > availableY) return { output: '', height: 0, continue: { offset: 0, state: { part: 'group', src, current: 0 } } }
      else availableY -= r.height;

      html += r.output;
      y += r.height;
    }
  }

  if (w.header && ((state && state.state && state.state.part === 'body' && w.headerPerPage !== false && (!group || !group.grouped)) || (!group || !group.grouped) && (!state || !state.state || state.state.part === 'header' || state.state.part === 'group'))) {
    r = renderWidget(w.header, ctx, { x: 0, y, availableX: placement.availableX, maxX: placement.maxX, maxY: placement.maxY });

    if (r.height > availableY) return { output: '', height: 0, continue: { offset: 0, state: { part: 'header', src, current: 0 } } }
    else availableY -= r.height;

    html += r.output;
    y += r.height;
  }

  let rctx: RenderContext = state && state.state && state.state.context || extend(ctx, { special: { level: group && group.level, group: group && group.group, values: {} } });
  if (!state || !state.state || state.state.part !== 'footer') {
    let usedX = 0;
    let usedY = 0;
    for (let i = (state && state.state && state.state.current) || 0; i < arr.length; i++) {
      const c = group && group.grouped ?
        extend(rctx, { value: arr[i], special: { index: i, values: {} } }) :
        extend(rctx, { value: arr[i], special: { index: i } });

      if (group && group.grouped) {
        const s: RenderState<RepeatState> = (state && state.child) || { offset: 0, state: { current: 0, src: arr[i], part: 'group' } };
        r = renderWidget(w, c, { x: 0, y, availableX: availableX - usedX, availableY, maxX: placement.maxX, maxY: placement.maxY }, s);
      } else r = renderWidget(w.row, c, { x: usedX, y, availableX: availableX - usedX, maxX: placement.maxX, availableY, maxY: placement.maxY });

      if (state) state.child = null;

      if (r.width && r.width <= availableX - usedX && r.width !== availableX) {
        usedX += r.width;
        if (r.height > usedY) usedY = r.height;
      } else if (r.width && usedX && r.width > availableX - usedX) {
        y += usedY;
        availableY -= usedY;
        usedY = 0;
        usedX = 0;
        i--;
        continue;
      }

      if (r.height > availableY || r.cancel) {
        if (commit) return { output: `<div${styleClass(ctx, ['container', 'repeat'], style(w, placement, ctx, { computedHeight: y, container: true }))}>\n${html}</div>`, height: y, continue: { offset: y, state: { part: 'body', src, current: i, context: rctx } } };
        else return { output: '', height: y, continue: { offset: y, state: { part: state && state.state && state.state.part || 'body', src, current: i, context: rctx } } };
      } else if (!usedY) availableY -= r.height;

      if (!usedY) y += r.height;
      html += r.output;
      commit = true;

      if (group && r.continue) return { output: `<div${styleClass(ctx, ['container', 'repeat'], style(w, placement, ctx, { computedHeight: y, container: true }))}>\n${html}</div>`, height: y, continue: { offset: y, state: { part: 'body', src, current: i, context: rctx }, child: r.continue } };
    }
  }

  if (w.footer) {
    const fctx = (rctx && rctx.context) || (state && state.state && state.state.context && state.state.context.context);
    const c = extend(ctx, { special: { source: group && group.grouped ? group.all : arr, level: group && group.level, grouped: group && group.grouped, values: (fctx && fctx.special || {}).values } });

    if (group) {
      if (w.groupEnds && w.groupEnds[group.grouped]) r = renderWidget(w.footer, c, { x: 0, y, availableX: placement.availableX, maxX: placement.maxX, maxY: placement.maxY });
      else r = { output: '', height: 0 };
    } else r = renderWidget(w.footer, c, { x: 0, y, availableX: placement.availableX, maxX: placement.maxX, maxY: placement.maxY });

    if (r.height > availableY) return { output: `<div${styleClass(ctx, ['container', 'repeat'], style(w, placement, ctx, { computedHeight: y, container: true }))}>\n${html}</div>`, height: y, continue: { offset: y, state: { part: 'footer', src, current: 0, context: rctx } } }

    html += r.output;
    y += r.height;
  }

  return { output: `<div${styleClass(ctx, ['container', 'repeat'], style(w, placement, ctx, { computedHeight: y, container: true }))}>\n${html}</div>`, height: y };
}, { container: true });

registerRenderer<Image>('image', (w, ctx, placement) => {
  addStyle(ctx, 'image', `.image {position:absolute;}`);
  return `<img src="${evaluate(ctx, w.url)}"${styleClass(ctx, ['image'], style(w, placement, ctx))} />`;
});

registerRenderer<MeasuredLabel>('measured', (w, ctx, placement, state) => {
  addStyle(ctx, 'measured', `.measured {position:absolute;box-sizing:border-box;white-space:pre-wrap;font-family:serif;font-size:0.83rem}`);
  const text = evaluate(ctx, w.text);
  const height = measure(text, getWidth(w, placement, ctx) || placement.availableX, w.font);
  
  if (!state && height > placement.availableY) {
    return { output: '', height: 0, continue: { state: {}, offset: 0 } };
  } else {
    let s = style(w, placement, ctx, { computedHeight: height, container: true });
    s[0] = `line-height:1em;` + s[0];
    return {
      height, output: `<span${styleClass(ctx, ['measured', 'label'], s)}>${escapeHTML(text)}</span>`
    };
  }
});

registerRenderer<HTML>('html', (w, ctx, placement) => {
  addStyle(ctx, 'html', `.html {position:absolute;box-sizing:border-box;overflow:hidden;line-height:1rem;}`);
  const html = evaluate(extend(ctx, { parser: parseTemplate }), w.html);
  return `<div${styleClass(ctx, ['html'], style(w, placement, ctx, { container: true }))}>${html}</div>`;
});
