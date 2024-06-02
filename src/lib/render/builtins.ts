import { Container, Label, Repeater, Image, MeasuredLabel, HTML } from '../report';
import { evaluate, filter, Group, ValueOrExpr, isValueOrExpr, extend as extendData } from '../data/index';
import { parse as parseTemplate } from '../data/parse/template';
import { style as styleText } from '../data/parse/style';
import { error } from './error';

import { addStyle, escapeHTML, extend, getWidth, measure, registerRenderer, renderWidget, renderWidgets, RenderContinuation, RenderState, RenderContext, getHeightWithMargin, expandMargin, getWidthWithMargin, isComputed } from './index';
import { styleClass, style, styleFont, styleImage, styleExtra } from './style';

function onCommit(ctx: RenderContext, key: string, value: any) {
  let c = ctx;
  while (c) {
    if (c.commit) {
      c.commit[key] = value;
      return;
    }
    c = c.parent;
  }
}

function commitContext(ctx: RenderContext) {
  for (const k in ctx.commit) {
    let l = ctx.context;
    while (l) {
      if (l.special && l.special.values) (l.special.values[k] || (l.special.values[k] = [])).push(ctx.commit[k]);
      l = l.parent;
    }
  }
}

registerRenderer<Label>('label', (w, ctx, placement) => {
  addStyle(ctx, 'label', `.label {position:absolute;box-sizing:border-box;white-space:normal;}`);
  let str = '';
  let sval: any;
  let val = (Array.isArray(w.text) ? w.text : [w.text]).map(v => {
    let val = evaluate(ctx, typeof v === 'object' && 'text' in v ? v.text : v);
    if (typeof val === 'string') val = escapeHTML(val);
    if (typeof v === 'object' && 'id' in v) onCommit(ctx, v.id, val);
    str += val;
    sval = val;

    if (w.styled) val = styleText(val);

    if (typeof v === 'object' && 'text' in v) {
      return `<span${styleClass(ctx, [], [styleFont(v.font, ctx) + styleExtra(v, ctx), ''])}>${val}</span>`;
    } else {
      return val
    };
  }).join('');

  if (w.id) onCommit(ctx, w.id, str);

  if (w.format && w.format.name) {
    const args: ValueOrExpr[] = [{ v: !Array.isArray(w.text) || w.text.length === 1 ? sval : val }, { v: w.format.name }];
    val = evaluate(ctx, { op: 'format', args: args.concat(w.format.args || []) });
  }

  return `<span${styleClass(ctx, ['label'], style(w, placement, ctx, { lineSize: true }))}>${val}</span>`
});

registerRenderer<Container>('container', (w, ctx, placement, state) => {
  addStyle(ctx, 'container', `.container {position:absolute;box-sizing:border-box;}`);
  let h: number;
  if (!w.height) w.height = 'auto';
  else if (w.height !== 'auto') h = getHeightWithMargin(w, placement, ctx);
  const wctx = ((state || {}).state || {}).ctx ? Object.assign({}, ctx, { context: state.state.ctx }) : ctx;
  if (w.context && !((state || {}).state || {}).ctx) {
    if (!wctx.context.locals) wctx.context.locals = {};
    const value = evaluate(extend(wctx, { special: { placement, widget: w }, locals: wctx.context.locals }), w.context);
    if (value) wctx.context = extendData(wctx.context, { value, special: { placement, widget: w } });
  }
  const cw = getWidth(w, placement, ctx) || placement.availableX;
  const r = renderWidgets(w, wctx, { x: 0, y: 0, availableX: cw, availableY: h || placement.availableY, maxX: cw, maxY: h != null && !isNaN(h) ? h : placement.maxY }, state, w.layout);
  if (!r.cancel) {
    r.output = `<div${styleClass(ctx, ['container'], style(w, placement, ctx, { computedHeight: h || r.height, container: true }))}>${r.output}</div>`;
    r.height = h || r.height;
    r.width = getWidthWithMargin(w, placement, ctx);
  }
  if ((r.cancel || r.continue) && !w.bridge) {
    const state = r.continue || {} as RenderState;
    state.offset = 0;
    // must start over
    delete state.last;
    state.attempt = (state.attempt || 0) + 1;
    if (state.attempt > 1) return error(ctx, placement);
    return { continue: state, output: '' };
  } else if (r.continue) {
    if (w.context) r.continue.state = { ctx: wctx.context };
    r.continue.offset = 0;
  }
  return r;
}, { container: true });

type RepeatState = { part: 'group'|'header'|'body'|'footer'; group?: 'header'|'body'; src: Group|any[]; current: number; context?: RenderContext; newPage?: boolean };
registerRenderer<Repeater, RepeatState>('repeater', (w, ctx, placement, state) => {
  addStyle(ctx, 'container', `.container {position:absolute;box-sizing:border-box;}`);
  if (!w.height) w.height = 'auto';
  let availableY = placement.availableY;
  let availableX = placement.availableX;

  let r: RenderContinuation;
  let html = '';
  let commit = false;
  const m = expandMargin(w, ctx, placement);
  let y = !state || !state.state || state.state.part === 'header' ? m[0] : 0;
  availableY -= y;
  availableY = +availableY.toFixed(6)
  let group: Group;
  let groupNo: number|boolean = false;
  const newPage = state && state.state && state.state.newPage;

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

  if ((w.header || w.group) && (newPage || !state || !state.state || state.state.part === 'header' || state.state.part === 'group')) {
    const hctx = state && state.state && state.state.context && state.state.context.context;

    if (group) {
      const c = extend(ctx, { special: { source: group && group.grouped ? group.all : arr, level: group && group.level, grouped: groupNo !== false, group: group && group.group, values: (hctx && hctx.special || {}).values } });

      if (w.group && groupNo !== false && (!state || !state.state || state.state.part === 'group')) {
        r = renderWidget(w.group[groupNo], extend(ctx, { value: group, special: { source: group && group.grouped ? group.all : arr, level: group && group.level, grouped: true, group: group.group } }), { x: 0, y, availableX: placement.availableX, maxX: placement.maxX, maxY: placement.maxY });

        if (r) {
          if (r.height > availableY) {
            if (html) html = `<div${styleClass(ctx, ['container', 'repeat'], style(w, placement, ctx, { computedHeight: y, container: true }))}>\n${html}</div>`;
            return { output: html, height: y, continue: { offset: 0, state: { part: 'group', src, current: 0, newPage: true } } }
          } else {
            availableY -= r.height;
            availableY = +availableY.toFixed(6);
          }

          html += r.output;
          y += r.height;
        }
      }

      if (w.header && (w.groupHeaders && w.groupHeaders[group.grouped] && (!state || !state.state || !state.state.current) || newPage && w.headerPerPage !== false)) r = renderWidget(w.header, c, { x: 0, y, availableX: placement.availableX, maxX: placement.maxX, maxY: placement.maxY });
      else r = { output: '', height: 0 };

      if (r.height > availableY) return { output: `<div${styleClass(ctx, ['container', 'repeat'], style(w, placement, ctx, { computedHeight: y, container: true }))}>\n${html}</div>`, height: y, continue: { offset: y, state: { part: 'header', src, current: 0, context: ctx, newPage: true } } }
      else {
        availableY -= r.height;
        availableY = +availableY.toFixed(6);
      }

      html += r.output;
      y += r.height;
    } else if (w.header) {
      if (!state || newPage && w.headerPerPage !== false) r = renderWidget(w.header, ctx, { x: 0, y, availableX: placement.availableX, maxX: placement.maxX, maxY: placement.maxY });
      else r = { output: '', height: 0 };

      if (r.height > availableY) return { output: `<div${styleClass(ctx, ['container', 'repeat'], style(w, placement, ctx, { computedHeight: y, container: true }))}>\n${html}</div>`, height: y, continue: { offset: y, state: { part: 'header', src, current: 0, context: ctx, newPage: true } } }
      else {
        availableY -= r.height;
        availableY = +availableY.toFixed(6);
      }

      html += r.output;
      y += r.height;
    }
  }

  if (newPage) state.state.newPage = false;
  if (state && state.child && state.child.state) state.child.state.newPage = false;

  let rctx: RenderContext = state && state.state && state.state.context || extend(ctx, { special: { source: group && group.grouped ? group.all : arr, level: group && group.level, grouped: groupNo !== false, group: group && group.group, values: {}, last: arr.length - 1, count: arr.length } });
  const elide = w.row && (isComputed(w.row.elide) ? evaluate(extend(rctx, { special: { placement, widget: w } }), w.row.elide.x) : w.row.elide);

  if (!state || !state.state || state.state.part !== 'footer') {
    let usedX = 0;
    let usedY = 0;
    let initY = y;
    if (!elide && !arr.length && w.alternate) {
      if (w.alternate) {
        r = renderWidget(w.alternate, rctx, { x: usedX, y, availableX: availableX - usedX, maxX: placement.maxX, availableY, maxY: placement.maxY }, state ? state.child : undefined);
        if (r.height > availableY) return { output: html, height: 0, continue: { offset: 0, state: { part: 'body', src, current: 0, newPage: true } } }
        else {
          availableY -= r.height;
          availableY = +availableY.toFixed(6);
        }

        html += r.output;
        y += r.height;
      }
    } else {
      for (let i = (state && state.state && state.state.current) || 0; i < arr.length; i++) {
        const c = group && group.grouped ?
          extend(rctx, { value: arr[i], special: { index: i, values: {} }, commit: {} }) :
          extend(rctx, { value: arr[i], special: { index: i } });

        if (group && group.grouped) {
          const s: RenderState<RepeatState> = (state && state.child) || { offset: 0, state: { current: 0, src: arr[i], part: 'group' } };
          r = renderWidget(w, c, { x: 0, y, availableX: availableX - usedX, availableY, maxX: placement.maxX, maxY: placement.maxY }, s);
        } else {
          c.commit = {};
          if (elide) {
            renderWidget(w.row, c, { x: 0, y: 0, availableX: placement.maxX, maxX: placement.maxX, availableY: placement.maxY, maxY: placement.maxY }, state ? state.child : undefined);
            commitContext(c);
            continue;
          } else {
            r = renderWidget(w.row, c, { x: usedX, y, availableX: availableX - usedX, maxX: placement.maxX, availableY, maxY: placement.maxY }, state ? state.child : undefined);
          }
        }

        if (state) state.child = null;

        if (r.width && r.width <= availableX - usedX && r.width !== availableX) {
          usedX += r.width;
          if (r.height > usedY) {
            usedY = r.height;
            if (r.height > availableY) initY -= r.height;
          }
        } else if (r.width && usedX && r.width > availableX - usedX) {
          y += usedY;
          initY = y;
          availableY -= usedY;
          availableY = +availableY.toFixed(6);
          usedY = 0;
          usedX = 0;
          i--;
          continue;
        }

        if (r.height > availableY || r.cancel) {
          if (initY === y && usedY) y += usedY;
          if (commit) return { output: `<div${styleClass(ctx, ['container', 'repeat'], style(w, placement, ctx, { computedHeight: y, container: true }))}>\n${html}</div>`, height: y, continue: { offset: y, state: { part: 'body', src, current: i, context: rctx, newPage: !group || groupNo === false }, child: r.continue } };
          else return { output: '', height: y, continue: { offset: y, state: { part: state && state.state && state.state.part || 'body', src, current: i, context: rctx, newPage: !group || groupNo === false }, child: r.continue } };
        }

        if (!usedY) {
          y += r.height;
          availableY -= r.height;
          availableY = +availableY.toFixed(6);
        }

        html += r.output;
        commit = true;

        if (r.continue) {
          if (initY === y && usedY) y += usedY;
          if (w.row.bridge) commitContext(c);
          return { output: `<div${styleClass(ctx, ['container', 'repeat'], style(w, placement, ctx, { computedHeight: y, container: true }))}>\n${html}</div>`, height: y, continue: { offset: y, state: { part: 'body', src, current: i, context: rctx, newPage: !group || groupNo === false }, child: w.row.bridge || (group && group.grouped) ? r.continue : undefined } };
        }

        commitContext(c);
      }
    }

    if (initY === y && usedY) y += usedY;
  }

  if (w.footer) {
    const fctx = (rctx && rctx.context) || (state && state.state && state.state.context && state.state.context.context);
    const c = extend(ctx, { special: { source: group && group.grouped ? group.all : arr, level: group && group.level, grouped: groupNo !== false, group: group && group.group, values: (fctx && fctx.special || {}).values }, commit: {} });

    if (group) {
      if (w.groupEnds && w.groupEnds[group.grouped]) r = renderWidget(w.footer, c, { x: 0, y, availableX: placement.availableX, maxX: placement.maxX, maxY: placement.maxY, availableY });
      else r = { output: '', height: 0 };
    } else r = renderWidget(w.footer, c, { x: 0, y, availableX: placement.availableX, maxX: placement.maxX, maxY: placement.maxY, availableY });

    if (r.height > availableY) return { output: `<div${styleClass(ctx, ['container', 'repeat'], style(w, placement, ctx, { computedHeight: y, container: true }))}>\n${html}</div>`, height: y, continue: { offset: y, state: { part: 'footer', current: 0, src, context: rctx, newPage: true } } }
    else if (r.continue) {
      if (w.footer.bridge) commitContext(c);
      return { output: `<div${styleClass(ctx, ['container', 'repeat'], style(w, placement, ctx, { computedHeight: y, container: true }))}>\n${html}</div>`, height: y, continue: { offset: y, state: { part: 'footer', src, current: 0, context: rctx, newPage: true }, child: w.footer.bridge ? r.continue : undefined } }
    }

    commitContext(c);

    html += r.output;
    y += r.height;
  }

  return { output: `<div${styleClass(ctx, ['container', 'repeat'], style(w, placement, ctx, { computedHeight: y, container: true }))}>\n${html}</div>`, height: y };
}, { container: true });

registerRenderer<Image>('image', (w, ctx, placement) => {
  addStyle(ctx, 'image', `.image {position:absolute;box-sizing:border-box;} .image .inner {background-repeat:no-repeat;height:100%;}`);

  const fit = w.fit && typeof w.fit === 'object' ? evaluate(ctx, w.fit.x) : w.fit;
  if (fit === 'stretch') {
    return `<img src="${evaluate(ctx, w.url)}" ${styleClass(ctx, ['image'], style(w, placement, ctx))} />`;
  } else {
    return `<div ${styleClass(ctx, ['image'], style(w, placement, ctx))}><div ${styleClass(ctx, ['inner'], styleImage(fit), `background-image:url('${evaluate(ctx, w.url)}');`)}></div></div>`;
  }
});

registerRenderer<MeasuredLabel>('measured', (w, ctx, placement, state) => {
  addStyle(ctx, 'measured', `.measured {position:absolute;box-sizing:border-box;white-space:pre-wrap;font-family:serif;font-size:0.83rem;word-break:break-word;}`);
  const text = evaluate(ctx, w.text);
  const height = measure(text, getWidth(w, placement, ctx) || placement.availableX, ctx, w.font);
  
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
