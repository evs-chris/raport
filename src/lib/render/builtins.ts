import { Container, Label, Repeater, Image, MeasuredLabel } from '../report';
import { evaluate, filter, Group, isValueOrExpr } from '../data/index';

import { addStyle, escapeHTML, extend, getWidth, measure, registerRenderer, renderWidget, renderWidgets, RenderContinuation, RenderState, getHeightWithMargin, expandMargin } from './index';
import { styleClass, style, styleFont } from './style';

// TODO: add designer stuff to widgets and register entire widgets in one go rather than split up
// TODO: propsheet descriptors as part of widget def

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
  const r = renderWidgets(w, wctx, { x: 0, y: 0, availableX: typeof w.width === 'number' ? w.width : placement.availableX, availableY: h || placement.availableY }, state, w.layout);
  r.output = `<div${styleClass(ctx, ['container'], style(w, placement, ctx, { computedHeight: h || r.height, container: true }))}>${r.output}</div>`;
  r.height = h || r.height;
  return r;
}, { container: true });

type RepeatState = { part: 'group'|'header'|'body'|'footer', group?: 'header'|'body', src: Group|any[], current: number };
registerRenderer<Repeater, RepeatState>('repeater', (w, ctx, placement, state) => {
  addStyle(ctx, 'container', `.container { position: absolute; box-sizing: border-box; }`);
  if (!w.height) w.height = 'auto';
  let available = placement.availableY;

  let r: RenderContinuation;
  let html = '';
  const m = expandMargin(w);
  let y = m[0];
  let group: Group;
  let groupNo: number|boolean = false;

  let src: Group|any[] = state && state.state && state.state.src;
  if (!src) src = isValueOrExpr(w.source) ?
    evaluate(ctx, w.source) :
    filter(ctx.context.root.sources[w.source.name], w.source.filter, w.source.sort, w.source.group, ctx.context).value;
    
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
    if (groupNo !== false) r = renderWidget(w.group[groupNo], extend(ctx, { value: group }), { x: 0, y, availableX: placement.availableX });

    if (r) {
      if (r.height > available) return { output: '', height: 0, continue: { offset: 0, state: { part: 'group', src, current: 0 } } }
      else available -= r.height;

      html += r.output;
      y += r.height;
    }
  }

  if (w.header && ((state && state.state.part === 'body' && w.headerPerPage !== false && (!group || !group.grouped)) || (!group || !group.grouped) && (!state || !state.state || state.state.part === 'header' || state.state.part === 'group'))) {
    r = renderWidget(w.header, ctx, { x: 0, y, availableX: placement.availableX });

    if (r.height > available) return { output: '', height: 0, continue: { offset: 0, state: { part: 'header', src, current: 0 } } }
    else available -= r.height;

    html += r.output;
    y += r.height;
  }

  if (!state || !state.state || state.state.part !== 'footer') {
    for (let i = (state && state.state && state.state.current) || 0; i < arr.length; i++) {
      const c = extend(ctx, { value: arr[i], special: { index: i, value: arr[i] } });

      if (group && group.grouped) {
        const s: RenderState<RepeatState> = (state && state.child) || { offset: 0, state: { current: 0, src: arr[i], part: 'group' } };
        r = renderWidget(w, c, { x: 0, y, availableX: placement.availableX, availableY: placement.availableY - y }, s);
      } else r = renderWidget(w.row, c, { x: 0, y, availableX: placement.availableX });

      if (state) state.child = null;

      if (r.height > available) return { output: `<div${styleClass(ctx, ['container', 'repeat'], style(w, placement, ctx, { computedHeight: y, container: true }))}>\n${html}</div>`, height: y, continue: { offset: y, state: { part: 'body', src, current: i } } };
      else available -= r.height;

      html += r.output;
      y += r.height;

      if (group && r.continue) return { output: `<div${styleClass(ctx, ['container', 'repeat'], style(w, placement, ctx, { computedHeight: y, container: true }))}>\n${html}</div>`, height: y, continue: { offset: y, state: { part: 'body', src, current: i }, child: r.continue } };
    }
  }

  if (w.footer) {
    const c = extend(ctx, { special: { source: group && group.grouped ? group.all : arr, level: group && group.level, grouped: group && group.grouped } });

    if (group) {
      if (w.groupEnds && w.groupEnds[group.grouped]) r = renderWidget(w.footer, c, { x: 0, y, availableX: placement.availableX });
      else r = { output: '', height: 0 };
    } else r = renderWidget(w.footer, c, { x: 0, y, availableX: placement.availableX });

    if (r.height > available) return { output: `<div${styleClass(ctx, ['container', 'repeat'], style(w, placement, ctx, { computedHeight: y, container: true }))}>\n${html}</div>`, height: y, continue: { offset: y, state: { part: 'footer', src, current: 0 } } }

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
