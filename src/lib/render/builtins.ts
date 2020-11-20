import { Container, Label, Repeater, Image, MeasuredLabel, HTML } from '../report';
import { evaluate, filter, Group, isValueOrExpr } from '../data/index';

import { addStyle, escapeHTML, extend, getWidth, measure, registerRenderer, renderWidget, renderWidgets, RenderContinuation, RenderState, getHeightWithMargin, expandMargin } from './index';
import { styleClass, style, styleFont } from './style';

registerRenderer<Label>('label', (w, ctx, placement) => {
  addStyle(ctx, 'label', `.label { position: absolute; box-sizing: border-box; }`);
  const str = (Array.isArray(w.text) ? w.text : [w.text]).map(v => {
    if (typeof v === 'object' && 'text' in v) return `<span${styleClass(ctx, [], [styleFont(v.font), ''])}>${evaluate(ctx, v.text)}</span>`;
    else return evaluate(ctx, v);
  }).join('');
  return `<span${styleClass(ctx, ['label'], style(w, placement, ctx))}>${escapeHTML(str)}</span>`
});

registerRenderer<Container>('container', (w, ctx, placement, state) => {
  addStyle(ctx, 'container', `.container { position: absolute; box-sizing: border-box; }`);
  let h: number;
  if (!w.height) w.height = 'auto';
  else if (typeof w.height === 'number') h = getHeightWithMargin(w, placement);
  const wctx = w.context ? extend(ctx, { value: evaluate(ctx, w.context) }) : ctx;
  const r = renderWidgets(w, wctx, { x: 0, y: 0, availableX: typeof w.width === 'number' ? w.width : placement.availableX, availableY: h || placement.availableY, maxX: placement.maxX, maxY: placement.maxY }, state, w.layout);
  if (!r.cancel) {
    r.output = `<div${styleClass(ctx, ['container'], style(w, placement, ctx, { computedHeight: h || r.height, container: true }))}>${r.output}</div>`;
    r.height = h || r.height;
  }
  return r;
}, { container: true });

type RepeatState = { part: 'group'|'header'|'body'|'footer', group?: 'header'|'body', src: Group|any[], current: number };
registerRenderer<Repeater, RepeatState>('repeater', (w, ctx, placement, state) => {
  addStyle(ctx, 'container', `.container { position: absolute; box-sizing: border-box; }`);
  if (!w.height) w.height = 'auto';
  let availableY = placement.availableY;
  let availableX = placement.availableX;

  let r: RenderContinuation;
  let html = '';
  let commit = false;
  const m = expandMargin(w);
  let y = m[0];
  let group: Group;
  let groupNo: number|boolean = false;

  let src: Group|any[] = state && state.state && state.state.src;
  if (!src) src = isValueOrExpr(w.source) ?
    evaluate(ctx, w.source) :
    filter(ctx.context.root.sources[w.source.source] || { value: [] }, w.source.filter, w.source.sort, w.source.group, ctx.context).value;
    
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
    if (groupNo !== false) r = renderWidget(w.group[groupNo], extend(ctx, { value: group }), { x: 0, y, availableX: placement.availableX, maxX: placement.maxX, maxY: placement.maxY });

    if (r) {
      if (r.height > availableY) return { output: '', height: 0, continue: { offset: 0, state: { part: 'group', src, current: 0 } } }
      else availableY -= r.height;

      html += r.output;
      y += r.height;
    }
  }

  if (w.header && ((state && state.state.part === 'body' && w.headerPerPage !== false && (!group || !group.grouped)) || (!group || !group.grouped) && (!state || !state.state || state.state.part === 'header' || state.state.part === 'group'))) {
    r = renderWidget(w.header, ctx, { x: 0, y, availableX: placement.availableX, maxX: placement.maxX, maxY: placement.maxY });

    if (r.height > availableY) return { output: '', height: 0, continue: { offset: 0, state: { part: 'header', src, current: 0 } } }
    else availableY -= r.height;

    html += r.output;
    y += r.height;
  }

  if (!state || !state.state || state.state.part !== 'footer') {
    let usedX = 0;
    let usedY = 0;
    for (let i = (state && state.state && state.state.current) || 0; i < arr.length; i++) {
      const c = extend(ctx, { value: arr[i], special: { index: i, value: arr[i] } });

      if (group && group.grouped) {
        const s: RenderState<RepeatState> = (state && state.child) || { offset: 0, state: { current: 0, src: arr[i], part: 'group' } };
        r = renderWidget(w, c, { x: 0, y, availableX: availableX - usedX, availableY, maxX: placement.maxX, maxY: placement.maxY }, s);
      } else r = renderWidget(w.row, c, { x: usedX, y, availableX: availableX - usedX, maxX: placement.maxX, availableY, maxY: placement.maxY });

      if (state) state.child = null;

      if (r.width && r.width < availableX - usedX) {
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
        if (commit) return { output: `<div${styleClass(ctx, ['container', 'repeat'], style(w, placement, ctx, { computedHeight: y, container: true }))}>\n${html}</div>`, height: y, continue: { offset: y, state: { part: 'body', src, current: i } } };
        else return { output: '', height: y, continue: { offset: y, state: { part: state.state.part, src, current: i } } };
      } else if (!usedY) availableY -= r.height;

      if (!usedY) y += r.height;
      html += r.output;
      commit = true;

      if (group && r.continue) return { output: `<div${styleClass(ctx, ['container', 'repeat'], style(w, placement, ctx, { computedHeight: y, container: true }))}>\n${html}</div>`, height: y, continue: { offset: y, state: { part: 'body', src, current: i }, child: r.continue } };
    }
  }

  if (w.footer) {
    const c = extend(ctx, { special: { source: group && group.grouped ? group.all : arr, level: group && group.level, grouped: group && group.grouped } });

    if (group) {
      if (w.groupEnds && w.groupEnds[group.grouped]) r = renderWidget(w.footer, c, { x: 0, y, availableX: placement.availableX, maxX: placement.maxX, maxY: placement.maxY });
      else r = { output: '', height: 0 };
    } else r = renderWidget(w.footer, c, { x: 0, y, availableX: placement.availableX, maxX: placement.maxX, maxY: placement.maxY });

    if (r.height > availableY) return { output: `<div${styleClass(ctx, ['container', 'repeat'], style(w, placement, ctx, { computedHeight: y, container: true }))}>\n${html}</div>`, height: y, continue: { offset: y, state: { part: 'footer', src, current: 0 } } }

    html += r.output;
    y += r.height;
  }

  return { output: `<div${styleClass(ctx, ['container', 'repeat'], style(w, placement, ctx, { computedHeight: y, container: true }))}>\n${html}</div>`, height: y };
}, { container: true });

registerRenderer<Image>('image', (w, ctx, placement) => {
  addStyle(ctx, 'image', `.image { position: absolute; }`);
  return `<img src="${evaluate(ctx, w.url)}"${styleClass(ctx, ['image'], style(w, placement, ctx))} />`;
});

registerRenderer<MeasuredLabel>('measured', (w, ctx, placement, state) => {
  const text = evaluate(ctx, w.text);
  const height = measure(text, getWidth(w, placement) || placement.availableX, w.font);
  
  if (!state && height > placement.availableY) {
    return { output: '', height: 0, continue: { state: {}, offset: 0 } };
  } else {
    let s = style(w, placement, ctx, { computedHeight: height, container: true });
    s[0] = `display:inline-block;white-space:pre-wrap;line-height:${(w.font && w.font.line) || (w.font && w.font.size) || 1}rem;` + s[0];
    return {
      height, output: `<span${styleClass(ctx, ['label'], s)}>${escapeHTML(text)}</span>`
    };
  }
});

registerRenderer<HTML>('html', (w, ctx, placement) => {
  addStyle(ctx, 'html', `.html {position:absolute;box-sizing:border-box;overflow:hidden;word-break:break-all;line-height:1rem;}`);
  const html = evaluate(ctx, w.html);
  return `<div${styleClass(ctx, ['html'], style(w, placement, ctx, { container: true }))}>${html}</div>`;
});
