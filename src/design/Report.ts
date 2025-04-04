import { css, template } from 'views/Report';

import Ractive, { ExtendOpts, InitOpts, ContextHelper, ReadLinkResult, ObserverHandle } from 'ractive';
import { Report, ReportSource, Literal, run, parse, stringify, initParameters, PageSizes, PageSize, PageOrientation, Widget, Root, Context, extend, filter, applySources, evaluate, inspect, parseTemplate, isComputed, registerOperator, ValueOrExpr, Span, Computed, isValueOrExpr, SourceMap, Parameter, StringifyOpts, parseXML } from 'raport/index';
import { nodeForPosition, ParseNode, ParseError } from 'sprunge';

import { Editor, Viewer } from './Editor';
import autosize from './autosize';
import { trackfocus, getLastFocus } from './trackfocus';
import { debounce } from './util';

import { operators as operator_docs, formats as format_docs, languageReference as langref } from './docs';

export { highlight } from './Editor';

export interface OperatorDoc {
  op: string|string[];
  alias?: string;
  note?: string;
  sig: Array<{
    bin?: 1; un?: 1; agg?: 1; fmt?: 1;
    proto: string;
    desc: string;
    eg?: string|string[];
  }>;
  opts?: Array<{
    name: string|string[];
    type: string,
    desc: string;
  }>
}

export interface FormatDoc {
  name: string|string[];
  alias?: boolean;
  desc: string;
  opts?: Array<{
    name: string;
    req?: 1;
    type: string;
    desc: string;
  }>;
}

export const docs = {
  operators: [] as Array<OperatorDoc>,
  operatorText: {} as { [op: string]: string },
  languageReference: langref,
};
{
  const ops = evaluate(operator_docs) as Array<OperatorDoc>;
  for (const doc of ops) {
    const op = Array.isArray(doc.op) ? doc.op[0] : doc.op;
    const txt = `${op}${Array.isArray(doc.op) ? ` (alias ${doc.op.filter(n => n !== op).join(', ')})` : ''}
---${doc.note ? `
NOTE: ${doc.note}
` : ''}
${doc.sig.map(s => `${s.proto}${s.bin ? '        (can be binary)' : ''}${s.un ? '        (can be unary)' : ''}\n  ${s.desc}\n`).join('\n')}${doc.opts ? `

Options
---
${doc.opts.map(o => `${Array.isArray(o.name) ? `${o.name[0]} (alias ${o.name.slice(1).join(', ')})` : o.name} - ${o.type}\n  ${o.desc}\n`).join('\n')}` : ''}`;
    const all = Array.isArray(doc.op) ? doc.op : [doc.op];
    all.forEach((n, i) => {
      docs.operatorText[n] = txt;
      docs.operators.push(Object.assign({}, doc, i === 0 ? { op: n } : { op: n, alias: all[0] }));
    });
  }

  const fmts = evaluate(format_docs) as Array<FormatDoc>;
  for (const f of fmts) {
    const all = Array.isArray(f.name) ? f.name : [f.name];
    all.forEach((n, i) => {
      const op = `#${n}`;
      const val: any = { op, sig: [{ fmt: 1, proto: op, desc: f.desc }], opts: f.opts };
      if (i > 0) val.alias = true;
      docs.operators.push(val);
      const txt = `${n}${all.length > 1 ? ` (alias: ${all.filter(nn => n !== nn).join(', ')})`: ''}${f.opts ? ` - #${n},${f.opts.map(o => `${o.name}${o.req ? '' : '?'}`).join(',')}` : ''}
${f.desc ? `${f.desc}
` : ''}
${f.opts ? `
Arguments
---
${f.opts.map(o => `${o.name} - ${o.type}\n  ${o.desc}\n`).join('\n')}` : ''}`;
      docs.operatorText[op] = txt;
    });
  }
}

let sourceTm: any;

export interface ExprOptions {
  html?: boolean;
  label?: boolean;
  template?: boolean;
}

export type AvailableSource = PlainSource | JSONFetchSource;

export interface JSONFetchSource {
  name: string;
  type: 'fetch';
  url: string;
  method: 'GET'|'POST'|'PUT';
  fetch: boolean;
  body?: string;
  headers?: Array<[string, string]>;
}

export interface PlainSource {
  name: string;
  values(params?: object): Promise<any>;
  data?: any;
  input?: string;
  header?: boolean;
}

export const darkTheme = { fg: '#ccc', bg: '#222', border: '#555555', highlight: '#ddd', dark: '#444444', active: '#265189', hover: '#167808', error: '#a00', btntxt: '#ddd', code: { c1: '#ccc', c2: '#ccc', c3: '#1ca', c4: '#e81', c5: '#2a0', c6: '#e78', c7: '#6c3', c8: '#e82', c9: '#67f', c10: '#89d', c11: '#4bc', c12: '#1de', c13: '#29c', c14: '#888', c20: '#f00', }, };
export const lightTheme = { fg: '#222', bg: '#fff', border: '#cccccc', highlight: '#000', dark: '#999999', active: '#4596ff', hover: '#26bf10', error: '#8b0000', btntxt: '#fff', code: { c1: '#555', c2: '#222', c3: '#164', c4: '#951', c5: '#a11', c6: '#708', c7: '#371', c8: '#630', c9: '#45c', c10: '#239', c11: '#167', c12: '#189', c13: '#145', c14: '#888', c20: '#f00', }, };

let autosizeTm: any;

const binops = ['**', '*', '/%', '/', '%', '+', '-', '>=', '>', '<=', '<', '??', 'gt', 'gte', 'lt', 'lte', 'in', 'like', 'ilike', 'not-in', 'not-like', 'not-ilike', 'contains', 'does-not-contain', 'is', 'is-not', '==', '!=', '===', '!==', 'strict-is', 'strict-is-not', 'deep-is', 'deep-is-not', 'and', '&&', 'or', '||'];

const form_els = ['INPUT', 'TEXTAREA', 'SELECT'];

export class Designer extends Ractive {
  constructor(opts?: InitOpts) {
    super(opts);
  }

  evalLock = false;
  _scrollers: Array<() => void> = [];
  _undo: string[] = [];
  _redo: string[] = [];
  _undoWatch: ObserverHandle;
  _importText: HTMLTextAreaElement;
  _contextText: HTMLTextAreaElement;
  _inited = false;
  _isplay = false;
  _builtroot: Promise<Root>;

  checkResize: () => void;

  addWidget(type: string) {
    const widget: any = { type };
    const path = this.get('temp.widget');
    if (type === 'label') {
      if (path !== 'report') widget.width = 10;
      widget.text = ':label';
    } else if (type === 'html') {
      widget.html = '<div>html</div>';
      widget.font = { line: 0 };
    }

    this.push(`${path}.widgets`, widget);
  }

  log = (args: any[]) => {
    this.push('temp.logs', [evaluate(`#now##date,'H:m:s yyyy-MM-dd'`), args]);
    console.log(...args);
  };

  async run() {
    const report: Report = this.get('report');
    this._isplay = true;
    const ctx = new Root(cloneDeep(report.context || {}), { parameters: this.get('params') });
    ctx.log = this.log;
    const srcs = await this.buildSources(false);
    this._isplay = false;
    let text: string;
    this.fire('running');
    try {
      const opts = {
        foot: this.frameExtra(),
        table: this.get('settings.delimitedTable'),
      };
      if (report.type !== 'delimited') Object.assign(opts, this.get('settings.runopts'));
      text = run(report, srcs, ctx, opts);
    } catch (e) {
      console.error(e);
      text = `<html><head><style>.page { width: 63rem; height: 48rem; position: absolute; overflow: hidden; left: 1.5rem; top: 1.5rem; } .page-back { width: 66rem; height: 51rem; } body { font-size: 0.83rem; } @media screen { html { min-width: 68rem; } body { background-color: #999; display: flex; flex-direction: column; align-items: center; } .page-back { background-color: #fff; box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.4); position: relative; overflow: hidden; box-sizing: border-box; margin: 0.5em; } } @media print { body { margin: 0; padding: 0; width:66rem;background-color: none; display: block; height: 357rem } .page-back { position: absolute; box-shadow: none; background-color: none; margin: 0; padding: 0; left: 0rem; } .pb0 { top: 0rem; } .pb1 { top: 51rem; } .pb2 { top: 102rem; } .pb3 { top: 153rem; } .pb4 { top: 204rem; } .pb5 { top: 255rem; } .pb6 { top: 306rem; } } @page { size: 66em 51em; } .container { position:absolute;box-sizing:border-box; } .label {position:absolute;box-sizing:border-box;} pre { margin: 1rem; } h2 { color: red; margin: 1rem; }</style></head><body><div class="page-back"><h2>Report Exception</h2><code><pre>${e}\n${e.stack}</pre></code></div></body></html>`
    }
    this.fire('run');
    this.set('result', text);
    return true;
  }

  frameExtra() {
    const delim = this.get('report.type') === 'delimited' || this.get('settings.runopts.delimited');
    return `
      <style>
        #print { display: none; }
        @media screen {
          :root {
            --fg: ${this.get('@style.out.fg') || this.get('@style.fg')};
            --bg: ${this.get('@style.out.bg') || this.get('@style.bg')};
          }
          html:before, html:after { content: ' '; position: fixed; display: block; z-index: 2; box-shadow: 0 0 10px #000; transition: opacity 0.4s ease-in-out; opacity: 1; width: 100%; height: 5px; }
          html:before { top: -5px; }
          html:after { bottom: -5px; }
          html.scrolled-top:before { opacity: 0; }
          html.scrolled-bottom:after { opacity: 0; }

          html { font-size: ${this.get('settings.scale')}% !important;
          body {
            background-color: ${this.get('@style.out.dark') || this.get('@style.dark')};
            padding: 2em;
            color: var(--fg);
          }${delim ? `
          body {
            display: inline-block;
          }
          table { border-collapse: collapse; }
          th, td { padding: 0.15em 0.4em; border: 1px solid rgba(128, 128, 128, 0.5); }
          th.index { border-right: 2px solid; }
          thead tr th { position: sticky; top: 0; border-bottom: 2px solid; background: var(--bg); z-index: 10; }
          tbody tr th { position: sticky; left: 0; padding: 0.15em 0.5em; text-align: right; border-right: 2px solid; background: var(--bg); z-index: 9; }
          tbody tr:nth-child(2n+1) td { background-color: rgba(128, 128, 128, 0.05); }
          tbody tr:hover td, tbody tr:hover th { background: rgba(128, 128, 128, 0.2); }` : `
          #print { position: fixed; top: 0.2em; right: 1em; opacity: 0.1; transition: opacity 0.5s ease-in-out; color: var(--bg); background-color: var(--fg); border: 1px solid; border-radius: 0.5em; cursor: pointer; display: inline-block; }
          #print:hover { opacity: 1; }`}
          .page-back {
            color: var(--fg);
            background-color: var(--bg);
          }
        }
      </style>
      <script>
        const html = document.scrollingElement || document.documentElement;
        const listener = ev => {
          if (html.scrollTop === 0) html.classList.add('scrolled-top');
          else html.classList.remove('scrolled-top');

          if (html.scrollTop + html.clientHeight >= html.scrollHeight) html.classList.add('scrolled-bottom');
          else html.classList.remove('scrolled-bottom');
        };
        html.addEventListener('scroll', listener, { passive: true });
        window.addEventListener('resize', listener);
        window.addEventListener('scroll', listener);
        window.addEventListener('keydown', ev => {
          if (ev.ctrlKey && ev.shiftKey && ev.key === 'Enter') window.parent.postMessage('run', '*');
        });
        html.classList.add('scrolled-top');
        const printbtn = document.createElement('button');
        printbtn.innerHTML = 'Print';
        printbtn.setAttribute('id', 'print');
        printbtn.setAttribute('title', 'Print the report using your browser\\'s print function.\\n\\nThis tends to work best with margins set to none and background/image printing turned on.\\n\\nIt also seems to work best in chromium-based browsers (notably, puppetteer), unless you\\'re okay missing page two in Firefox.');
        printbtn.addEventListener('click', () => window.print());
        document.body.appendChild(printbtn);
      </script>
    `;
  }

  paperSize(): string {
    const size = this.get('pageSize');
    const type = this.get('report.type');
    if (type === 'flow') {
      let res = `margin: auto; box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.4); min-heght: 10rem; background-size: 1rem 1rem; background-image: radial-gradient(circle, ${this.get('@style.border')}80 1px, transparent 1px);`;
      if (size && size.width) res += `width: ${size.width}rem; box-sizing: border-box;`;
      return res;
    }
    if (size) {
      return `width: ${size.width}rem; box-sizing: border-box; margin: auto; box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.4); padding: ${size.margin[0]}rem ${size.margin[1]}rem; min-height: ${size.height}rem; background-size: 1rem 1rem; background-position: ${10.5 - size.margin[0]}rem ${10.5 - size.margin[1]}rem; background-image: radial-gradient(circle, ${this.get('@style.border')}80 1px, transparent 1px);`;
    }
    return '';
  }

  calcHeight(w: Widget): string {
    if (typeof w.height === 'number') return `${w.height}rem`;
    else if (typeof w.height === 'object' && 'percent' in w.height && w.height.percent) return `${w.height.percent}%`;
    else if (w.type === 'label') {
      let n = 1;
      if (w.font && !isComputed(w.font.size) && w.font.size > n) n = w.font.size;
      if (Array.isArray(w.text)) {
        for (let i = 0; i < w.text.length; i++) {
          const t = w.text[i];
          if (typeof t === 'object' && 'font' in t && t.font && t.font.size > n) n = +t.font.size;
        }
      }
      return `${n}rem`;
    } else if (w.type !== 'container' && w.type !== 'repeater') return '1rem';
    else if ((w as any).macro) return '1rem';
    else return 'min-content';
  }

  calcHeightWithMargin(w: Widget): string {
    const h = this.calcHeight(w);
    if (!w.margin || isComputed(w.margin)) return h;
    if (typeof w.margin === 'number') return `calc(${h} + ${2 * w.margin}rem)`;
    else if (w.margin.length === 2) return `calc(${h} + ${2 * w.margin[0]}rem)`;
    else if (w.margin.length === 4) return `calc(${h} + ${w.margin[0] + w.margin[2]}rem)`;
    return h;
  }

  calcWidth(w: Widget, context: ContextHelper): string {
    if (!w.width || isComputed(w.width)) return '100%';
    else if (w.width === 'grow' && Array.isArray(context.get('../../layout'))) return `(100% - ${context.get(`../../layout[${context.get('@index')}][0]`) || 0}rem)`; 
    else if (typeof w.width === 'object' && 'percent' in w.width) return `${w.width.percent}%`;
    else if (typeof w.width === 'number') return `${w.width}rem`;
    else return '100%';
  }

  calcWidthWithMargin(w: Widget, context: ContextHelper): string {
    if (/^report\.widgets\.\d+$/.test(context.resolve())) return '100%';
    const width = this.calcWidth(w, context);
    if (!w.margin && w.font && w.font.right) return `calc(${width} + ${w.font.right}rem)`;
    if (!w.margin || isComputed(w.margin)) return ~width.indexOf('(') ? `calc${width}` : width;
    if (typeof w.margin === 'number') return `calc(${width} + ${2 * w.margin}rem)`;
    else if (w.margin.length === 2) return `calc(${width} + ${2 * w.margin[1]}rem)`;
    else if (w.margin.length === 4) return `calc(${width} + ${w.margin[1] + w.margin[3]}rem)`;
  }

  calcMargin(w: Widget): string {
    const m = w.margin;
    if (!m || isComputed(m)) return '';
    if (typeof m === 'number') return `padding: ${m}rem;`;
    else if (m.length === 2) return `padding: ${m[0]}rem ${m[1]}rem;`;
    else if (m.length === 4) return `padding: ${m[0]}rem ${m[1]}rem ${m[2]}rem ${m[3]}rem;`;
    return '';
  }

  calcBorder(w: Widget): string {
    const b = w.border;
    if (!b) return '';
    const color = this.get('@style.border');
    if (typeof b === 'number') return `border-bottom:${b * 0.0625}rem solid ${color};`;
    else if (Array.isArray(b)) {
      if (b.length === 1) return `border:${b[0] * 0.0625}rem solid ${color};`;
      else if (b.length === 2) return `border-style:solid;border-width:${b[0] * 0.0625}rem ${b[1] * 0.0625}rem;`;
      else if (b.length === 4) return `border-style:solid;border-width:${b[0] * 0.0625}rem ${b[1] * 0.0625}rem ${b[2] * 0.0625}rem ${b[3] * 0.0625}rem;`;
    } else if (typeof b === 'string') {
      return `border: 1px dotted green;`;
    } else return `border-style:solid;border-width:${(b.top || 0) * 0.0625}rem ${(b.right || 0) * 0.0625}rem ${(b.bottom || 0) * 0.0625}rem ${(b.left || 0) * 0.0625}rem;`;
    return '';
  }

  calcFont(w: Widget): string {
    const f = w.font;
    let res = '';
    if (f.size && !isComputed(f.size)) res += `font-size: ${f.size}rem;`;
    if (f.line && !isComputed(f.line)) res += `line-height: ${f.line}rem;`;
    if (f.align && !isComputed(f.align)) res += `text-align: ${f.align};`;
    if (f.color && !isComputed(f.color)) res += `color: ${f.color} !important;`;
    if (f.family && !isComputed(f.family)) res += `font-family: ${f.family};`;
    if (f.weight && !isComputed(f.weight)) res += `font-weight: ${f.weight};`;
    if (f.right) res += `padding-right: ${f.right}rem;`;
    return res;
  }

  calcManualLayout(l: [number, number], width: string, height: string): string {
    l = l || [] as any;
    const x = l[0] || 0;
    const y = l[1] || 0;
    let res = '';
    if (x < 0) res += `margin-left: calc(100% - ${width} - ${-x - 1}rem); margin-right: -100%;`;
    else res += `margin-left: ${x}rem; margin-right: calc(${-x}rem - ${width});`;
    if (y < 0) res += `margin-top: calc(100% - ${height} - ${-y - 1}rem); margin-bottom: ${-y - 1}rem;`;
    else res += `margin-top: ${y}rem;`
    return res;
  }

  split(path: string, pop?: number, ...add: string[]): string[] {
    const res = Ractive.splitKeypath(path);
    if (pop) res.splice(-pop, pop);
    if (add) res.push(...add);
    return res;
  }

  lastKey(path: string, count: number = 1): string {
    const keys = Ractive.splitKeypath(path);
    for (let i = 1; i < count; i++) keys.pop();
    return keys.pop();
  }

  selectWidget(path: string) {
    const two = (path || '').split('.')[1] || 'report';
    const base = `report${two === 'overlay' || two === 'watermark' ? `.${two}` : ''}`;
    if (this.readLink('widget', { canonical: false })?.keypath === path) path = base;
    this.link(path, 'widget');
    this.set('temp.name', nameForWidget(this.get(path + '.type'), path));
    this.set('temp.widget', path);
    const w: Widget = this.get('widget');
    if (w.type === 'html') this.editExpr(`${path}.html`, { html: true });
    else if (w.type === 'label' || w.type === 'measured') this.editExpr(`${path}.text`, { label: true });
    else if (w.type === 'image') this.editExpr(`${path}.url`);
    else if (w.type === 'container' && w.macro) this.editExpr(`${path}.macro`);
    else if (w.type === 'repeater' && typeof w.source === 'string') this.editExpr(`${path}.source`);
    this.treeScrollToActive();
  }

  treeScrollToActive() {
    setTimeout(() => {
      const el = document.querySelector('.tree .node.active > .line');
      if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  async eval() {
    const start = Date.now();
    const str: string|any[] = this.get('temp.expr.str');
    let v: string = this.get('temp.expr.path');
    if (v && v.startsWith('widget.')) v = v.replace('widget', this.get('temp.widget'));
    const ctx = await this.buildLocalContext(v);
    const res = Array.isArray(str) ?
      str.map(p => {
        if (typeof p === 'string') return evaluate(ctx, p);
        else if (p && typeof p === 'object' && typeof p.text === 'string') return evaluate(ctx, p.text);
        return '';
      }).join('') :
      evaluate(ctx, this.get('temp.expr.html') || this.get('temp.expr.template') ? parseTemplate(str) : str);
    console.log(`eval: ${Date.now() - start}ms`);
    this.set('temp.expr.result', res);
    this.set('temp.expr.tab', 'result');
  }

  evalExpr(expr: string, template?: boolean, ctx?: Context): string {
    if (ctx) return evaluate(ctx, template ? parseTemplate(expr) : parse(expr));
    return evaluate(template ? parseTemplate(expr) : parse(expr));
  }

  autosizeHtml(ctx: ContextHelper) {
    const preview = ctx.get('ctx.preview');
    ctx.set('ctx.preview', true);
    ctx.set('ctx.autosize', true);
    ctx.set('.height', Math.ceil((ctx.node.nextElementSibling as HTMLElement).offsetHeight / 16));
    ctx.set('ctx.autosize', false);
    ctx.set('ctx.preview', preview);
  }

  async editProvidedData(ctx: ContextHelper) {
    ctx.link(ctx.resolve(), '~/data');
    const source: AvailableSource = ctx.get();

    let val: any;
    if ('type' in source && source.type === 'fetch') val = await this.fetchData();
    else if ('input' in source) val = source.input;
    else if ('data' in source || 'values' in source) val = source.data ? source.data : await source.values();

    if (typeof val === 'object' && 'value' in val) val = val.value;
    if (typeof val === 'string') this._importText.value = val;
    else this._importText.value = JSON.stringify(val, null, 2);

    if (!this.get('show.proppop')) this.set('show.props', false);

    this.set('tab', 'import');
  }

  async logData(source: AvailableSource) {
    console.log(await this.loadSourceData(source));
  }

  editExpr(path: string, options?: ExprOptions) {
    if ((this as any).event) path = this.getContext((this as any).event.node).resolve(path);
    if (path.startsWith('widget.')) path = path.replace('widget', this.get('temp.widget'));

    let val = this.get(path);
    if (Array.isArray(val)) {
      val.forEach((v, i) => {
        if (typeof v === 'object' && !('text' in v)) val[i] = stringify(v);
      });
    } else if (typeof val !== 'string') val = val === undefined ? '' : stringify(val);

    this.set('temp.expr.path', path);

    const html = options && options.html;
    const tab = this.get('temp.expr.tab');
    this.set('temp.expr.html', html);
    this.set('temp.expr.label', options && options.label);
    this.set('temp.expr.template', options && options.template);
    this.set('temp.expr.tab', html ? 'html' : tab === 'ast' || tab === 'text' ? tab : 'text');
    this.set('temp.bottom.tab', 'expr');

    this.link(path, 'expr');
    this.set('temp.expr.str', val);
    this.set('show.bottom', true);
    if (!this.get('show.proppop')) this.set('show.props', false);

    const el = document.getElementById(`expr-${html ? 'html' : 'text'}`);
    if (el) setTimeout(() => el.focus(), 500);

    const parent = Ractive.joinKeys(...Ractive.splitKeypath(path).slice(0, -1));
    let watch: ObserverHandle;
    watch = this.observe(`${parent} temp.expr.path`, (v, _o, k) => {
      if (k === 'temp.expr.path') return watch.cancel();
      if (!v || typeof v !== 'object') this.checkLink('expr');
    }, { init: false });
  }

  editParam(ctx: ContextHelper) {
    const path = ctx.resolve();
    this.set('show.bottom', true);
    this.set('temp.bottom.param', path);
    this.set('temp.bottom.tab', 'param');
    this.link(path, 'param');
    if (!this.get('show.proppop')) this.set('show.props', false);
  }

  editReportSrc(ctx: ContextHelper, key?: string) {
    const path = ctx.resolve(key || undefined);
    this.set('show.bottom', true);
    this.set('temp.bottom.source', path);
    this.set('temp.bottom.tab', 'source');
    this.link(path, 'source');
    if (!this.get('show.proppop')) this.set('show.props', false);
  }

  moveUp(ctx: ContextHelper, path?: string|string[], index?: number, end?: boolean) {
    const idx = index !== undefined ? index : ctx.get('@index');
    path = path || '../';
    if (!Array.isArray(path)) path = [path];

    for (const p of path) {
      if (!p) continue;
      if (idx == null || idx <= 0) return;
      const item = ctx.get(joinPath(p, idx));
      ctx.splice(p, end ? 0 : idx - 1, 0, item);
      ctx.splice(p, idx + 1, 1);
    }
  }

  moveDown(ctx: ContextHelper, path?: string|string[], index?: number, end?: boolean) {
    const idx = index !== undefined ? index : ctx.get('@index');
    path = path || '../';
    if (!Array.isArray(path)) path = [path];

    for (const p of path) {
      if (!p) continue;
      const last = ctx.get('@last');
      if (idx == null || !~idx || idx >= last) return;
      const item = ctx.get(joinPath(p, idx));
      ctx.splice(p, end ? last + 1 : idx + 2, 0, item);
      ctx.splice(p, idx, 1);
    }
  }

  reparent(target: ContextHelper) {
    const w: ContextHelper = this.get('reparent');
    this.set('reparent', undefined);
    if (!w || !target) return;

    if (this.get('report.type') === 'delimited') {
      const widx = w.get('@index');
      const obj = w.splice('../', widx, 1).result[0];
      this.push('target.fields', obj);
      if (this.get('report.headers')) {
        const obj = this.splice('report.headers', widx, 1).result[0];
        this.push('report.headers', obj);
      }
    } else {
      let layout: any[];
      if (Array.isArray(w.get('../../layout'))) {
        layout = w.splice('../../layout', w.get('@index'), 1).result[0];
      }

      if (Array.isArray(target.get('.layout'))) {
        target.push('.layout', layout || [0, 0]);
      }

      const obj = w.splice('../', w.get('@index'), 1).result[0];
      target.push('.widgets', obj);
    }
  }

  move(target: ContextHelper) {
    const w: ContextHelper = this.get('reparent');
    this.set('reparent', undefined);
    if (!w || !target) return;
    const idx = target.get('@index');

    if (this.get('report.type') === 'delimited') {
      const widx = w.get('@index');
      const obj = w.splice('../', widx, 1).result[0];
      this.splice('report.fields', idx, 0, obj);
      if (this.get('report.headers')) {
        const obj = this.splice('report.headers', widx, 1).result[0];
        this.splice('report.headers', idx, 0, obj);
      }
    } else {
      const container = target.get('../../');
      if (!container || container.type !== 'container' && container !== this.get('report')) return;

      let layout: any[];
      if (Array.isArray(w.get('../../layout'))) {
        layout = w.splice('../../layout', w.get('@index'), 1).result[0];
      }

      if (Array.isArray(target.get('../../layout'))) {
        target.splice('../../layout', idx, 0, layout || [0, 0]);
      }

      const obj = w.splice('../', w.get('@index'), 1).result[0];
      target.splice('../../widgets', idx, 0, obj);
    }
  }

  paste(target: ContextHelper) {
    const w: ContextHelper = this.get('copy');
    this.set('copy', undefined);
    if (!w || !target) return;

    if (this.get('report.type') === 'delimited') {
      const obj = cloneDeep(w.get());
      this.push('report.fields', obj);

      if (this.get('report.headers')) {
        const obj = cloneDeep(this.get(`report.headers.${w.get('@index')}`));
        this.push('report.headers', obj);
      }
    } else {
      const obj = cloneDeep(w.get());
      target.push('widgets', obj);

      if (Array.isArray(target.get('layout'))) {
        if (Array.isArray(w.get('^^/layout'))) target.push('layout', w.get(`^^/layout.${w.get('@index')}`))
        else target.push('layout', [0, 0]);
      }
    }
  }

  pasteBefore(target: ContextHelper) {
    const w: ContextHelper = this.get('copy');
      this.set('copy', undefined);
    if (!w || !target) return;

    const idx = target.get('@index');

    if (this.get('report.type') === 'delimited') {
      const obj = cloneDeep(w.get());
      const widx = w.get('@index');
      this.splice('report.fields', idx, 0, obj);

      if (this.get('report.headers')) {
        const obj = cloneDeep(this.get(`report.headers.${widx}`));
        this.splice('report.headers', idx, 0, obj);
      }
    } else {
      const container = target.get('../../');
      if (!container || container.type !== 'container' && container !== this.get('report')) return;

      const obj = cloneDeep(w.get());
      target.splice('../../widgets', idx, 0, obj);

      if (Array.isArray(target.get('../../layout'))) {
        if (Array.isArray(w.get('^^/layout'))) target.splice('../../layout', idx, 0, w.get(`^^/layout.${w.get('@index')}`))
        else target.splice('../../layout', idx, 0, [0, 0]);
      }
    }
  }

  clickWidget(target: ContextHelper) {
    const keypath = target.get('@keypath');
    const type = target.get('.type');
    if (!this.event?.event?.shiftKey && this.get('reparent') && type === 'container' && keypath.indexOf(this.get('reparent').resolve()) === -1) this.reparent(target);
    else if (this.get('reparent')) this.move(target);
    else if (!this.event?.event?.shiftKey && this.get('~/copy') && type === 'container') this.paste(target);
    else if (this.get('~/copy')) this.pasteBefore(target);
    else if (this.get('report.type') === 'delimited') this.editExpr(target.resolve());
    else this.selectWidget(keypath);
    return false;
  }

  fillArray(count: number) {
    const res = [];
    for (let i = 0; i < count; i++) {
      res[i] = [];
    }
    return res;
  }

  addHeader() {
    this.set('report.headers', (this.get('report.fields') || []).map(() => ''));
  }

  command(name: string, ui: boolean, value?: string): boolean {
    return document.execCommand(name, ui || false, value === undefined ? null : value);
  }

  retypeASTNode(path: string, type: 'operator'|'reference'|'string'|'number'|'undefined') {
    if (type === 'operator') {
      this.set(path, { op: '+' });
    } else if (type === 'reference') {
      this.set(path, { r: '' });
    } else if (type === 'string') {
      this.set(path, { v: '' });
    } else if (type === 'number') {
      this.set(path, { v: 0 });
    } else if (type === 'undefined') {
      this.set(path, { v: undefined });
    }
  }

  autosize(node: HTMLElement) {
    if (autosizeTm) clearTimeout(autosizeTm);
    autosizeTm = setTimeout(() => {
      autosizeTm = 0;
      const pos = node.parentElement.scrollTop;
      const sh = node.parentElement.scrollHeight;
      const ch = node.parentElement.clientHeight;
      const old = parseInt(node.style.height);
      node.style.height = '';
      node.style.overflow = '';
      setTimeout(() => {
        const next = node.scrollHeight + 1;
        node.style.height = `${next}px`;
        node.style.overflow = 'hidden';
        node.parentElement.scrollTop = old && pos + ch + (next - old) >= sh ? pos + (next - old) : pos;
      });
    }, 500);
  }

  exprToggle(path: string) {
    this.toggle('exprExpand.' + Ractive.escapeKey(path));
  }

  async buildRoot(skipSources?: boolean, sample?: boolean): Promise<Root> {
    if (sample !== false && this._builtroot) {
      // clear locals to avoid weird state
      return this._builtroot.then(r => {
        (r as any).locals = {};
        return r;
      });;
    }
    const report: Report = this.get('report');
    const res = new Root(cloneDeep(report.context), { parameters: this.get('params') });
    res.log = this.log;
    if (report.extraContext) evaluate(res, report.extraContext);
    const srcs = await this.buildSources(sample);
    if (!skipSources) applySources(res, report.sources || [], srcs);
    if (sample !== false) this._builtroot = Promise.resolve(res);
    return res;
  }

  async loadSourceData(av: AvailableSource, sample?: boolean): Promise<any> {
    const load = this.get('actions.loadSourceData');
    const nocache = this._isplay;
    let d: any;
    let vv: any = av;
    if (vv.type === 'fetch' && (vv.fetch || !vv.data)) {
      d = await this.fetchData(vv);
      if (!vv.eval) d = { value: tryParseData(d, vv.header) };
      if (!vv.fetch) vv.data = d;
    } else if ('data' in av && av.data && (!vv.cached || !nocache)) {
      if (!vv.eval && typeof av.data === 'string') {
        d = tryParseData(av.data, av.header);
        if (!d || typeof d !== 'object' || !('value' in d)) d = { value: d };
      } else d = av.data;
    } else if ('values' in av && typeof av.values === 'function') {
      d = await av.values(this.get('params') || []);
    } else if ('input' in av && av.input) {
      d = tryParseData(av.input, av.header);
      if (!d || typeof d !== 'object' || !('value' in d)) d = { value: d };
      av.data = d;
    } else {
      if (typeof load === 'function') {
        vv.cached = true;
        vv.data = d = await load(av, this._isplay, this.get('params'), this.get('report'));
      }
    }
    return d;
  }

  async buildSources(sample?: boolean): Promise<SourceMap> {
    const report: Report = this.get('report');
    const avs: AvailableSource[] = this.get('sources') || [];
    const res: SourceMap = {};
    for (const src of report.sources || []) {
      const av = avs.find(s => s.name === src.source);
      if (av) {
        const data = await this.loadSourceData(av, sample);
        if (data && typeof data === 'object' && 'value' in data) res[av.name] = data;
        else res[av.name] = { value: data };
      }
    }
    return res;
  }

  async buildLocalContext(path?: string, sample?: boolean): Promise<Context> {
    const root = await this.buildRoot(path && path.slice(0, 'report.sources.'.length) === 'report.sources.', sample === false ? sample : true);
    root.special.date = new Date();
    root.special.local = {};
    root.special.locals = {};
    root.special.special = {};
    root.special.specials = {};
    let loc: any = this.get('report');
    let ctx: Context = root;

    if (path) {
      const parts = Ractive.splitKeypath(path);
      if (parts[0] === 'report') parts.shift();
      if (parts[0] === 'fields') {
        let src = evaluate(ctx, `*${this.get('report.source')}`);
        if (src && !Array.isArray(src) && typeof src === 'object' && Array.isArray(src.all)) src = src.all;
        if (src && typeof src === 'object' && Array.isArray(src.value)) src = src.value;
        if (src && Array.isArray(src)) src = src[0];
        let context = extend(ctx, { value: src });
        const row = this.get('report.rowContext');
        if (row) {
          if (!context.locals) context.locals = {};
          const v = evaluate(context, row);
          if (v) context.value = v;
        }
        ctx = context;
      } else if (parts[0] === 'rowContext') {
        let src = evaluate(ctx, `*${this.get('report.source')}`);
        if (src && !Array.isArray(src) && typeof src === 'object' && Array.isArray(src.all)) src = src.all;
        if (src && typeof src === 'object' && Array.isArray(src.value)) src = src.value;
        if (src && Array.isArray(src)) src = src[0];
        ctx = extend(ctx, { value: src });
      } else if (parts[0] === 'sources') {
        if (parts[parts.length - 1] === 'base') {
          const name = this.get(`report.sources.${parts[1]}.source`);
          const provided = (this.get('sources') || []).find(s => s.name === name);
          let src = await this.loadSourceData(provided);
          ctx = extend(ctx, { value: ctx.value, special: { source: src } });
        } else {
          const name = this.get(`report.sources.${parts[1]}.name`) || this.get(`report.sources.${parts[1]}.source`);
          const srcs = await this.buildSources();
          applySources(root, loc.sources || [], srcs);
          let src = evaluate(ctx, `*${name}`);
          if (src && !Array.isArray(src) && typeof src === 'object' && Array.isArray(src.all)) src = src.all;
          if (src && typeof src === 'object' && Array.isArray(src.value)) src = src.value;
          if (src && Array.isArray(src)) src = src[0];
          ctx = extend(ctx, { value: src });
        }
      } else {
        while (loc && parts.length) {
          const part = parts.shift();

          if (loc.type === 'page' && (part === 'header' || part === 'footer' || part === 'watermark' || part === 'overlay')) {
            root.special.page = 1;
            root.special.pages = 10;
            root.special.size = { x: 30, y: 40 };
          }

          if (part === 'height' || part === 'width' || part === 'br' || part === 'margin' || part === 'hide') {
            root.special.placement = { x: 0, y: 0, availableX: 10, availableY: 10, maxX: 10, maxY: 10, offsetX: 5, offsetY: 5 };
            root.special.widget = loc;
          }

          loc = loc[part];
          if (loc) {
            if (loc.context) {
              if (!ctx.locals) ctx.locals = {};
              const value = evaluate(ctx, loc.context);
              if (value) ctx = extend(ctx, { value });
            } else if (loc.source && loc.source.source) {
              const source = filter(root.sources[loc.source.source] || { value: [] }, loc.source.filter, loc.source.sort, loc.source.group, ctx);
              ctx = extend(ctx, { value: source.value, special: { source } });
            } else if (loc.source) {
              ctx = extend(ctx, { value: evaluate(ctx, loc.source) });
            }
          }

          if (loc && loc.type === 'repeater') {
            if (loc.group && loc.group.length && ctx.value && ctx.value.value && ctx.value.value[0]) {
              root.special.grouped = true;
              root.special.level = ctx.value.value[0].level;
              root.special.group = ctx.value.value[0].group;
            }

            if (parts[0] === 'row') {
              root.special.source = ctx.value;
              ctx = extend(ctx, { value: evaluate(ctx, '@value.0') || evaluate(ctx, '@value.all.0') });
              root.special.index = 0;
            } else if (parts[0] === 'footer') {
              root.special.values = {};
            }

            if (parts[0] === 'row' || parts[0] === 'footer') {
              root.special.last = 10;
              root.special.count = 11;
            }
          }
        }
      }
    }

    return ctx;
  }

  async fetchData(data?: any) {
    const set = !data;
    data = data || this.get('data');
    const ctx = new Root({}, { parameters: this.get('params') });
    ctx.log = this.log;
    const url = this.evalExpr(data.url, true, ctx);
    const headers: { [key: string]: string } = {};
    if (Array.isArray(data.headers)) {
      for (let i = 0; i < data.headers.length; i++) headers[data.headers[i][0]] = this.evalExpr(data.headers[i][1], true, ctx);
    }
    try {
      const req: RequestInit = { headers, method: data.method };
      if (req.method === 'POST' || req.method === 'PUT') req.body = this.evalExpr(data.body, true, ctx);
      const res = await fetch(url, req);
      const txt = await res.text();
      if (set) this.set('data.data', txt);
      return txt;
    }  catch {}
  }

  getSchema(ctx: Context) {
    const base = inspect(ctx.value);
    let last = ctx.value;
    let pl = base;
    pl.fields = pl.fields || [];
    let c = ctx;
    let prefix = '';

    for (const k in ctx.root.sources) {
      const source = ctx.root.sources[k];
      if (!source || !source.value) continue;
      const schema = inspect(source.value);
      pl.fields.push({ name: `*${k}`, type: schema.type, fields: schema.fields });
    }

    let t = inspect(ctx.root.special);
    t.fields.forEach(f => (f.name = `@${f.name}`, pl.fields.push(f)));
    if (ctx.special) {
      t = inspect(ctx.special)
      t.fields.forEach(f => (f.name = `@${f.name}`, pl.fields.push(f)));
    }

    (this.get('report.parameters') || []).forEach((p: Parameter) => pl.fields.push({ name: `!${p.name}`, type: p.type }));

    const stack: Context[] = [];
    if (c !== c.root) {
      while (c) {
        c = c.parent;
        if (c === c.root) prefix = '~';
        else prefix += '^';
        if (last === c.value && c.parent) continue;
        stack.push(c);

        t = inspect(c.value, c !== c.root);
        (t.fields || []).forEach(f => (f.name = `${prefix}${f.name}`, pl.fields.push(f)));
        last = c.value;

        if (c.locals) {
          t = inspect(c.locals);
          if (t.fields) t.fields.forEach(f => (f.meta = { local: true }, f.name = `${prefix === '~' ? '^' : prefix}${f.name}`, pl.fields.push(f)));
        }

        if (c === c.root) break;
      }
    }

    stack.push(ctx);

    const locals: any = {};
    stack.forEach(c => {
      if (c.locals) for (const k in c.locals) locals[k] = c.locals[k];
    });
    t = inspect(locals);
    t.fields.forEach(f => (f.meta = { local: true }, pl.fields.push(f)));

    return base;
  }

  insertRef(path: string) {
    const tab = this.get('temp.expr.tab') || 'text';

    const parts = Ractive.splitKeypath(path);
    let ps = [];
    while (parts.length && parts[parts.length - 1] !== 'ctx') {
      ps.unshift(this.get(Ractive.joinKeys.apply(Ractive, parts.concat('name'))));
      parts.pop();
      parts.pop();
    }
    if (ps[0][0] === '*' && ps[1] === 'value' && ps.length > 2) ps[1] = '0';
    const prefix = /^[!^@~*]+/.exec(ps[0]);
    if (prefix) ps[0] = ps[0].substring(prefix[0].length);
    let ref = stringify({ r: { k: ps } });
    if (prefix) ref = `${prefix[0]}${ref}`;
    if (this.get('temp.expr.html') || this.get('temp.expr.template')) ref = `{{${ref}}}`;

    if (tab === 'html' || tab === 'text') {
      return this.command('insertText', false, ref);
    } else if (tab === 'ast') {
      const active = this.get('temp.expr.partpath') || 'temp.expr.ast';
      this.set(active, { r: ref });
    }
  }

  insertOp(name: string) {
    const tab = this.get('temp.expr.tab') || 'text';
    if (tab === 'text') {
      const el = getLastFocus() as HTMLInputElement;
      if (!el) return;

      const cur = el.value;
      const pos = [el.selectionStart, el.selectionEnd];
      let rep = cur.substring(pos[0], pos[1]);
      let cursor: number;

      if (binops.includes(name)) {
        rep = ` ${name} `;
        cursor = pos[0] + rep.length;
      } else if (name[0] === '#') {
        rep = `${name}`;
        cursor = pos[0] + rep.length;
      } else {
        rep = `${name}(${rep})`
        cursor = pos[0] + rep.length - 1;
      }

      el.value = cur.substring(0, pos[0]) + rep + cur.substr(pos[1]);
      el.selectionStart = el.selectionEnd = cursor;

      el.dispatchEvent(new InputEvent('input'));
      el.dispatchEvent(new InputEvent('change'));
      el.focus();
    } else {
      return this.command('insertText', false, `{{${name}}}`);
    }
  }

  resetScrollers() {
    this._scrollers.forEach(fn => fn());
  }

  loadReportString(str: string) {
    try {
      const report = JSON.parse(str);
      this.set('report', report);
      this.set('params', report.defaultParams || {});
    } catch (e) {
      try {
        const report = evaluate({ PageSizes }, str);
        this.set('report', report);
        this.set('params', report.defaultParams || {});
      } catch (e) {
        console.error('Failed to load report', e);
      }
    }
  }

  async download(name: string, data: string, type: string = 'application/json') {
    name = evaluate(extend(await this.buildRoot(), { parser: parseTemplate }), name);
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = name;
    a.href = url;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  reportToString(compact: boolean, js: boolean, strings: 'json'|'template') {
    const json = this.get('report');
    if (!compact) return JSON.stringify(json, null, 2);
    else {
      if (js) return jsonToJS(stripDefaults(json), strings);
      else return JSON.stringify(stripDefaults(json));
    }
  }

  loadReportFile() {
    const input: HTMLInputElement = this.find('#definition-file') as any;
    let load: () => void;
    load = () => {
      input.removeEventListener('change', load);
      if (input.files.length) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = txt => this.loadReportString(txt.target.result as string);
        reader.readAsText(file);
      }
    }
    input.addEventListener('change', load);
    input.click();
  }

  loadImportFile() {
    const input: HTMLInputElement = this.find('#import-file') as any;
    let load: () => void;
    load = () => {
      input.removeEventListener('change', load);
      if (input.files.length) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = txt => {
          this.tryImport(txt.target.result as string);
          this._importText.value = txt.target.result.toString();
        };
        reader.readAsText(file);
      }
    }
    input.addEventListener('change', load);
    input.click();
  }

  getImportText() {
    return this._importText?.value || '';
  }

  tryImport(str: string) {
    if (!str || !this.readLink('data')) return;
    this.set('data.input', str);
    const json = tryParseData(str, this.get('data.header'));
    if (json) {
      if (typeof json === 'object' && 'type' in json && json.type === 'fetch') this.set('data', json);
      else {
        if (Array.isArray(json) || !Array.isArray(json.value)) this.set('data.data', { value: json });
        else if (Object.keys(json).length === 1 && 'value' in json) this.set('data.data', json.value);
        else this.set('data.data', json);
      }
    } else {
      this.set('data.data', str);
    }
    this.update('sources');
  }

  loadContextFile() {
    const input: HTMLInputElement = this.find('#context-file') as any;
    let load: () => void;
    load = () => {
      input.removeEventListener('change', load);
      if (input.files.length) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = txt => this.tryContext(txt.target.result as string);
        reader.readAsText(file);
      }
    }
    input.addEventListener('change', load);
    input.click();
  }

  tryContext(str: string) {
    if (!str) return;
    let ctx: any;
    try {
      ctx = JSON.parse(str);
    } catch {
      try {
        ctx = evaluate({}, str);
      } catch {
        ctx = {};
      }
    }
    this.set('report.context', ctx);
  }

  setHTMLFontSize() {
    const size = this.get('temp.fontSize');
    if (size) {
      this.command('fontSize', false, size);
    }
    setTimeout(() => this.set('temp.fontSize', ''));
  }

  inRepeater(path: string) {
    return /\.row\./.test(path);
  }

  getPartStrings(arr: Array<string|{ text: string }>): string {
    return arr.map(c => (c as any).text || c).join(' + ');
  }

  nodeForPosition(pos: number, name?: true): ParseError|ParseNode[] {
    const str = this.get('temp.expr.str');
    const r = (this.get('temp.expr.html') || this.get('temp.expr.template') ? parseTemplate : parse)(str, { tree: true });
    if ('message' in r) return r;
    else return nodeForPosition(r, pos, name);
  }

  fmt() {
    this._onChange(this.get('report'));
    const str = this.get('temp.expr.str');
    const settings = this.get('~/settings.format') || {};
    const opts = { listWrap: { base: settings.wrap, array: settings.wrap_array, union: settings.wrap_union, args: settings.wrap_args, keys: settings.wrap_keys } };
    this.set('temp.expr.str', fmt(str, this.get('temp.expr.html'), this.get('tmp.nowrap'), opts));
  }

  fmtAll() {
    const json = this.get('report');
    this._onChange(json);
    const settings = this.get('~/settings.format') || {};
    const opts = { listWrap: { base: settings.wrap, array: settings.wrap_array, union: settings.wrap_union, args: settings.wrap_args, keys: settings.wrap_keys } };
    this.set('report', fmtAll(json, this.get('tmp.nowrap'), opts));
  }

  unparse(value: any) {
    if (!isValueOrExpr(value)) value = { v: value };
    const settings = this.get('~/settings.format') || {};
    const opts = { listWrap: { base: settings.wrap, array: settings.wrap_array, union: settings.wrap_union, args: settings.wrap_args, keys: settings.wrap_keys } };
    return stringify(value, opts);
  }

  removeWidget(ctx: ContextHelper) {
    const path = ctx.resolve();
    const pathArr = Ractive.splitKeypath(path);
    const key = pathArr.pop();
    const keyup = pathArr.pop();
    let link: ReadLinkResult;
    if (this.get('temp.widget') === path) this.set('temp.widget', 'report');
    if ((link = this.readLink('widget')) && link.keypath === path) this.unlink('widget');
    this.checkLink('expr', ctx.resolve());
    if (ctx.get('^^/type') === 'repeater' && keyup === 'group') {
      if (ctx.get('^^/groupEnds')) ctx.splice('^^/groupEnds', ctx.get('@index'), 1);
      if (ctx.get('^^/group')) ctx.splice('^^/group', ctx.get('@index'), 1);
      if (ctx.get('^^/group.length') === 0) ctx.set({ '^^/group': undefined, '^^/groupEnds': undefined });
    }
    else if (ctx.get('../type') === 'repeater') ctx.set('../' + key, undefined); 
    else if (path === 'report.header' || path === 'report.footer' || path === 'report.watermark' || path === 'report.overlay') this.set(path, undefined);
    else {
      if (Array.isArray(ctx.get('^^/layout'))) ctx.splice('^^/layout', ctx.get('@index'), 1);
      const idx: number = ctx.get('@index');
      if (Array.isArray(ctx.get('../'))) ctx.splice('../', idx, 1);
      if (path.startsWith('report.fields') && ctx.get('../headers')) ctx.splice('../headers', idx, 1);
      else if (path.startsWith('report.headers')) ctx.splice('../fields', idx, 1);
    }
  }

  checkLink(type: 'expr'|'import'|'source'|'param'|'field', path?: string) {
    let link: ReadLinkResult;
    if (type === 'import') link = this.readLink('data');
    else if (type === 'param') link = this.readLink('param');
    else if (type === 'source') link = this.readLink('source');

    if (path === undefined) {
      if (type === 'expr') path = this.get('temp.expr.path');
      if (link) path = link.keypath;
    }

    if (type === 'import' && link && path === link.keypath) {
      this.unlink('data');
      this.set('tab', 'definition')
    } else if ((type === 'expr' || type === 'field') && (this.get('temp.expr.path') || '').startsWith(path)) {
      this.unlink('expr');
      this.set('temp.expr', {
        path: undefined,
        str: '',
        html: false,
        tab: 'text',
        label: false,
        template: false,
      }, { deep: true });
    } else if (type === 'param' && link && path === link.keypath) {
      this.unlink('param');
      this.set('temp.bottom.param', undefined);
      this.set('temp.bottom.tab', 'expr');
    } else if (type === 'source' && link && path === link.keypath) {
      this.unlink('source');
      this.set('temp.bottom.source', undefined);
      this.set('temp.bottom.tab', 'expr');
    }

    if (type !== 'field' && path) {
      if (path.startsWith('report.fields')) this.checkLink('field', path.replace('fields', 'headers'));
      if (path.startsWith('report.headers')) this.checkLink('field', path.replace('headers', 'fields'));
    }
  }

  checkLinks() {
    this.checkLink('expr');
    this.checkLink('import');
    this.checkLink('source');
    this.checkLink('param');
    this.checkLink('field');
  }

  saveProjects() {
    if (this.get('showProjects') === false) {
      this.fire('save', {}, this);
    } else {
      const projects: Array<{ sources?: AvailableSource[] }> = this.get('projects') || [];
      for (const p of projects) {
        if (!p.sources || !Array.isArray(p.sources)) continue;
        for (const s of p.sources) {
          if ('type' in s && s.type) delete (s as any).data;
          else if ('input' in s) delete (s as any).data;
        }
      }
      window.localStorage.setItem('projects', JSON.stringify(this.get('projects') || []));
      const project = this.get('project');
      if (project) this.set('projectSaved', this.stringifyProject(project));
    }
  }

  loadProjects() {
    this.set('projects', JSON.parse(window.localStorage.getItem('projects') || '[]'));
  }

  resetProject() {
    this.set('project', JSON.parse(this.get('projectSaved')));
  }

  makeProject(clean?: true) {
    const project = clean ?
      { name: 'Project', sources: [], report: { type: 'page', classifyStyles: true, orientation: 'landscape', size: PageSizes.letter } } :
      { name: 'Project', report: this.get('report') || {}, sources: this.get('sources') || [] };
    this.unlink('report');
    this.unlink('sources');
    this.unlink('project');
    this.checkLinks();
    this.push('projects', project);
    this.link('projects.' + (this.get('projects').length - 1), 'project');
    this.link('project.report', 'report');
    this.link('project.sources', 'sources');
    this.set('projectText', '');
  }

  stringifyProject(project?: any) {
    if (!project) project = this.get('project');
    const sources = (this.get<AvailableSource[]>('project.sources') || this.get('sources') || []).map(s => {
      if ('type' in s && s.type) {
        return Object.assign({}, s, { data: undefined });
      } else {
        const res = Object.assign({}, s);
        if ('input' in res) delete res.data;
        return res;
      }
    });
    return JSON.stringify(Object.assign({}, project, { sources, report: this.get('project.report') || this.get('report') || {} }));
  }

  stringifyProjects() {
    const projects = this.get('projects') || [];
    return JSON.stringify(projects.map(p => {
      const sources = ((p.sources || []) as AvailableSource[]).map(s => {
        if ('type' in s && s.type) {
          return Object.assign({}, s, { data: undefined });
        } else {
          const res = Object.assign({}, s);
          if ('input' in res) delete res.data;
          return res;
        }
      });
      return Object.assign({}, p, { sources });
    }));
  }

  removeProject() {
    if (window.confirm('Do you want to delete this project? This cannot be undone.')) {
      const project = this.get('project');
      const projects = this.get('projects') || [];
      projects.splice(projects.indexOf(project), 1);
      this.unlink('report');
      this.unlink('sources');
      this.unlink('project');
      this.set('project', undefined);
      this.checkLinks();
      this.saveProjects();
    }
  }

  importProject(single: boolean, str?: string) {
    const cb = (txt: string) => {
      const res = JSON.parse(txt);
      if (!single && Array.isArray(res) && res.length > 0 && 'name' in res[0]) {
        const current = (this.get<any[]>('projects') || []).slice();
        for (const r of res) {
          const idx = current.findIndex(p => p.name === r.name);
          if (~idx) current.splice(idx, 1, r);
          else current.push(r);
        }
        this.set('projects', current);
        this.checkLinks();
      } else if (single && typeof res === 'object' && !Array.isArray(res) && 'name' in res) {
        const proj = this.get('project');
        const projects = this.get('projects');
        this.set('project', res);
        this.link('project.report', 'report');
        this.link('project.sources', 'sources');
        if (~projects.indexOf(proj)) projects.splice(projects.indexOf(proj), 1, res);
        this.checkLinks();
      }
    };

    this.set('projectText', '');

    if (typeof str === 'string') {
      if (str) cb(str);
    } else {
      const input: HTMLInputElement = this.find('#project-file') as any;
      if (single) input.accept = '.raport-proj,.json';
      else input.accept = '.json';
      let load: () => void;
      load = () => {
        input.removeEventListener('change', load);
        if (input.files.length) {
          const file = input.files[0];
          const reader = new FileReader();
          reader.onload = fr => cb(fr.target.result as string);
          reader.readAsText(file);
        }
      }
      input.addEventListener('change', load);
      input.click();
    }
  }

  cloneProject() {
    this.set('projectText', '');
    const project = this.get('project');
    this.unlink('report');
    this.unlink('sources');
    this.unlink('project');
    this.push('projects', JSON.parse(JSON.stringify(project)));
    this.link('projects.' + (this.get('projects').length - 1), 'project');
    this.link('project.report', 'report');
    this.link('project.sources', 'sources');
  }

  linkProject(path: string) {
    this.set('projectText', '');
    this.unlink('report');
    this.unlink('sources');
    this.unlink('project');
    this.checkLinks();
    this.link(path, 'project');
    this.link('project.report', 'report');
    this.link('project.sources', 'sources');
    this.set('projectSaved', this.stringifyProject(this.get(path)));
    this.resetUndo();

    // check for sample data refs
    const sources = this.get('sources') || [];
    for (let i = 0; i < sources.length; i++) {
      const s = sources[i];
      if (s && s.name === 'sample' && !s.value) this.set(`sources.${i}.values`, this.get('sample'));
    }
  }

  unlinkProject() {
    this.unlink('report');
    this.unlink('sources');
    this.unlink('project');
    this.checkLinks();
    this.resetUndo();
  }

  resetUndo() {
    this._undo = [];
    this._redo = [];
  }

  undo() {
    if (this.event && ~form_els.indexOf(this.event.event.target.nodeName)) return false;
    this._undoWatch.silence();
    let s = this._undo.shift();
    if (s && JSON.stringify(this.get('report')) === s) {
      this._redo.unshift(s);
      s = this._undo.shift();
    }
    if (s) {
      this._redo.unshift(s);
      this.set('report', JSON.parse(s));
    }
    this._undoWatch.resume();
  }

  redo() {
    if (this.event && ~form_els.indexOf(this.event.event.target)) return false;
    this._undoWatch.silence();
    let s = this._redo.shift();
    if (s && JSON.stringify(this.get('report')) === s) {
      this._undo.unshift(s);
      s = this._redo.shift();
    }
    if (s) {
      this._undo.unshift(s);
      this.set('report', JSON.parse(s));
    }
    this._undoWatch.resume();
  }

  async initParams() {
    this.set('params', initParameters(this.get('report'), await this.buildSources()));
  }

  _onChange(v: any) {
    const s = JSON.stringify(v);
    if (s === this._undo[0]) return;
    this._undo.unshift(JSON.stringify(v));
    if (this.undo.length > 40) this._undo = this._undo.slice(0, 40);
    this._redo = [];
  }

  applySettings() {
    const settings = this.get('settings') || {};
    let dark = false;
    if (settings.theme === 'dark') dark = true, Ractive.styleSet(darkTheme);
    else if (settings.theme === 'light') Ractive.styleSet(lightTheme);
    else {
      const ml = window.matchMedia('(prefers-color-scheme: dark)');
      dark = ml.matches;
      Ractive.styleSet(ml.matches ? darkTheme : lightTheme);
    }
    Ractive.styleSet('theme', dark ? 'dark' : 'light');

    let scale = +settings.scale;
    if (isNaN(scale) || scale < 25 || scale > 300) {
      scale = 100;
      setTimeout(() => this.set('settings.scale', scale), 500);
    }
    if (document?.body?.parentElement?.style) document.body.parentElement.style.fontSize = `${scale}%`;

    if (settings.outTheme === 'dark') Ractive.styleSet('out', darkTheme);
    else if (settings.outTheme === 'light') Ractive.styleSet('out', lightTheme);
    else Ractive.styleSet('out', dark ? darkTheme : lightTheme);
    this.fire('applySettings', {}, this);
  }

  copyToClipboard(str: string) {
    copyToClipboard(str);
  }

  getOperatorDoc(op: string) {
    return docs.operatorText[op] || `<no documentation available> ${op} may be a designer-only, undesirable, or custom operator`;
  }

  showOperatorDoc(op: string) {
    const doc = this.getOperatorDoc(op);
    if (doc) window.alert(doc);
  }

  getNestLevel(path: string): string {
    return `level${Math.floor(path.split('.').length / 2)}`;
  }

  fillBlankDelimitedHeaders() {
    const sets: { [path: string]: string } = {};
    const headers: string[] = this.get('report.headers') || [];
    const fields: string[] = this.get('report.fields') || [];
    for (let i = 0; i < headers.length; i++) {
      if (!headers[i]) sets[`report.headers.${i}`] = fields[i];
    }
    this.set(sets);
  }

  treeString(val: any) {
    if (val === undefined) return 'undefined';
    const fmt = this.get('temp.expr.treefmt');
    return evaluate({ val }, fmt === 'string' ? `string(val)` : fmt === 'json' ? 'string(val json:1)' : 'string({ v: val } raport:1)');
  }

  processExprStr(v: string) {
    if (!v) {
      this.set('temp.expr.error', undefined);
      this.set('temp.expr.ast', undefined);
    }

    const path = this.get('temp.expr.path');
    const html = this.get('temp.expr.html') || this.get('temp.expr.template');
    if (path) this.set(path, v);
    if (!this.evalLock) {
      if (typeof v === 'string' && v.trim()) {
        this.evalLock = true;
        try {
          const arr = Array.isArray(v) ? v : [v];
          for (let i = 0; i < arr.length; i++) {
            const v = typeof arr[i] === 'string' ? arr[i] : 'text' in arr[i] && typeof arr[i].text === 'string' ? arr[i].text : arr[i];
            const parsed = (html ? parseTemplate : parse)(v, { detailed: true, contextLines: 3, consumeAll: true });
            const msg = ('marked' in parsed ? 
              `${'latest' in parsed ? `${parsed.latest.message || '(no message)'} on line ${parsed.latest.line} at column ${parsed.latest.column}\n\n${parsed.latest.marked}\n\n` : ''}${parsed.message || '(no message)'} on line ${parsed.line} at column ${parsed.column}\n\n${parsed.marked}\n\n` : '') + JSON.stringify(parsed, null, '  ');

            this.set('temp.expr.parsed', msg);

            if ('message' in parsed) {
              this.set('temp.expr.error', parsed)
              this.set('temp.expr.errormsg', msg);
              this.set('temp.expr.ast', undefined);
            } else {
              this.set('temp.expr.ast', parsed);
              this.set('temp.expr.errormsg', undefined);
              this.set('temp.expr.error', undefined);
            }

            if (html) this.set('temp.expr.htmlstr', v);
            else this.set('temp.expr.htmlstr', '');

            if ('message' in parsed) break;
          }
        } catch {}
        this.evalLock = false;
      } else {
        this.set('temp.expr.parsed', undefined);
      }
    }
  }

  sortManual(ctx: ContextHelper) {
    const c: Widget = ctx.get('.');
    if (c.type === 'container' && Array.isArray(c.layout)) {
      const all = (c.layout as any[]).map((l, i) => ({ widget: c.widgets[i], layout: l }));
      const res = evaluate({ all }, `sort(all '[=>layout.1 ?? layout.y =>layout.0 ?? layout.x]')`);
      ctx.set({
        '.widgets': res.map(e => e.widget),
        '.layout': res.map(e => e.layout),
      });
    }
  }

  langref = langref;
}

const designerOpts: ExtendOpts<Designer> = {
  template, css, cssId: 'raport-report',
  partials: {
    measured: template.p.label,
  },
  data() {
    return {
      pageSizes: PageSizes,
      report: {
        type: 'page',
        parameters: [],
        sources: [],
        context: {},
        classifyStyles: true,
        widgets: [],
        size: PageSizes.letter,
        orientation: 'landscape',
      },
      temp: {
        expr: {
          tab: 'text',
          expand: {},
        },
        widget: 'report',
        name: 'report',
        tree: {},
      },
      exprExpand: {},
      showProjects: true,
      actions: {
        provideSource: () => this.push('sources', {}),
        editProvidedSource: (ctx: ContextHelper) => this.editProvidedData(ctx),
      },
    };
  },
  components: { Editor, Viewer },
  helpers: {
    escapeKey: Ractive.escapeKey,
  },
  computed: {
    operators() {
      const map: Array<[string, OperatorDoc]> = docs.operators.reduce((a, c) => (Array.isArray(c.op) ? c.op.forEach(o => a.push([o, c])) : a.push([c.op, c]), a), []);
      let ops: typeof map = evaluate({ map }, `sort(map =>if _.0[0] == '#' then 'zz[_.0]' elif _.0[0] == '|' then ' {_.0}' else _.0)`)
      const search = this.get('opsearch');
      if (search) {
        const re = new RegExp(search.replace(/([*.\\\/$^()[\]{}+])/g, '\\$1'), 'i');
        ops = ops.filter(p => re.test(p[0]) || re.test(docs.operatorText[p[0]]));
      }
      return ops;
    },
    inWatermark() {
      return /^report.water/.test(this.get('temp.widget'));
    },
    inOverlay() {
      return /^report.overlay/.test(this.get('temp.widget'));
    },
    pageSize() {
      const type = this.get('report.type');
      if (type === 'flow') {
        const width: number = this.get('report.width');
        if (width) return { width };
      }
      const size: PageSize = this.get('report.size');
      const orientation: PageOrientation = this.get('report.orientation') || 'landscape';
      if (size) {
        const margin: [number, number] = [((size.margin || [])[0] || 0), ((size.margin || [])[1]) || 0];
        return {
          width: orientation === 'landscape' ? size.height : size.width,
          height: orientation === 'landscape' ? size.width : size.height,
          margin
        };
      }
    },
    sourceNames() {
      const sources: ReportSource[] = this.get('report.sources') || [];
      return sources.map(s => ({ label: s.label || s.name || s.source, value: s.name || s.source }));
    },
    blankDelimitedHeaders() {
      const headers = this.get('report.headers') || [];
      return ~headers.findIndex(h => !h);
    },
  },
  observe: {
    'report.type'(v: 'delimited'|'page'|'flow') {
      if (v === 'delimited') {
        if (!this.get('report.fields')) this.set('report.fields', []);
      } else {
        if (!this.get('report.widgets')) this.set('report.widgets', []);
      }
    },
    'temp.quote temp.record temp.field'(v: string, _o, k: string) {
      if (this.evalLock) return;
      this.evalLock = true;
      try {
        this.set(k.replace('temp', 'report'), (parse(`'${v.replace(/'/g, '\\\'')}'`) as Literal).v);
      } catch {}
      this.evalLock = false;
    },
    'report.quote report.record report.field'(v: string, _o, k: string) {
      if (this.evalLock) return;
      this.evalLock = true;
      try {
        this.set(k.replace('report', 'temp'), JSON.stringify(v).slice(1, -1));
      } catch {}
      this.evalLock = false;
    },
    'temp.expr.template'() {
      this.processExprStr(this.get('temp.expr.str'));
    },
    'temp.expr.str'(v) {
      this.processExprStr(v);
    },
    'temp.expr.ast'(v, o) {
      if (!this.evalLock) {
        this.evalLock = true;
        if (o === undefined && v) this.set('temp.expr.error', undefined);
        try {
          const str = v === undefined ? '' : stringify(v, { template: this.get('temp.expr.html') });

          this.set('temp.expr.str', str);

          if ('v' in v && (str[0] === '`' || str[0] === `'`)) {
            this.set('temp.expr.htmlstr', str.substr(1, -1));
          } else {
            this.set('temp.expr.htmlstr', '');
          }
        } catch {}
        this.evalLock = false;
      }
    },
    'temp.expr.htmlstr'(v) {
      if (!this.evalLock) {
        this.set('temp.expr.str', v);
      }
    },
    'temp.widget'() {
      if (this.get(this.get('temp.expr.path')) == null) {
        this.unlink('expr');
        this.set('temp.expr.path', undefined);
        this.set('temp.expr.str', '');
        this.set('temp.expr.ctx', false);
      }
    },
    async 'temp.expr.path report.parameters report.sources sources'() {
      if (sourceTm) {
        clearTimeout(sourceTm);
      }
      sourceTm = setTimeout(async () => {
        sourceTm = 0;
        let v: string = this.get('temp.expr.path');
        if (v) {
          if (v.startsWith('widget.')) v = v.replace('widget', this.get('temp.widget'));
          this.set('temp.expr.ctx', this.getSchema(await this.buildLocalContext(v)));
        } else {
          this.set('temp.expr.ctx', this.getSchema(await this.buildLocalContext()));
        }
      }, 1000);
    },
    'report.defaultParams'(v) {
      this.set('params', Object.assign({}, v));
    },
    'report.parameters': {
      async handler(v: Parameter[]) {
        if (v) this.initParams();
      },
      init: false,
      strict: true,
    },
    settings(v) {
      if (!this._inited) return;
      this.applySettings();
      window.localStorage.setItem('settings', JSON.stringify(v));
    },
    'project projectSaved': {
      handler: debounce(function() {
        const project = this.get('project');
        const saved = this.get('projectSaved');
        if (!project) this.set('projectChanged', false);
        else if (this.stringifyProject(project) !== saved) this.set('projectChanged', true);
        else this.set('projectChanged', false);
      }, 1000),
    },
    'report.parameters report.sources report.context sources'() {
      this._builtroot = undefined;
    },
    'report.context'(v: any) {
      if (!this._contextText) return;
      const target = JSON.stringify(v || {}, null, 2);
      let str = this._contextText.value;
      try {
        str = JSON.stringify(JSON.parse(str), null, 2);
      } catch {}
      if (str !== target) {
        this._contextText.value = target;
        this.autosize(this._contextText);
      }
    },
    report: {
      handler() {
        this.set('temp.tree', {});
      },
      strict: true
    },
    'show.props'(v) {
      if (v) setTimeout(() => this.set('show.shrinkleft', true), 200);
      else this.set('show.shrinkleft', false);
    },
    'show.bottom'(v) {
      setTimeout(() => this.resetScrollers());
      if (v) setTimeout(() => this.set('show.shrinkbottom', true), 200);
      else this.set('show.shrinkbottom', false);
    },
    'settings.leftwidth'(v) {
      Ractive.styleSet('leftwidth', v);
    },
    'settings.bottomheight'(v) {
      Ractive.styleSet('bottomheight', v);
    },
    'settings.scale'() {
      if (this.checkResize) setTimeout(() => this.checkResize());
    },
    'settings.leftwidth windowWidthInRem'(v) {
      const left = this.get('settings.leftwidth') || 28;
      const wnd = this.get('windowWidthInRem');
      const bigEnough = v && left && wnd > 2.5 * (left + 2);
      this.set('show.props', bigEnough);
      this.set('show.proppop', bigEnough);
    },
  },
  on: {
    init() {
      const getSize = () => {
        if (!this.rendered) return 0;
        const el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.width = '1rem';
        document.body.appendChild(el);
        const rem = el.clientWidth;
        el.remove();
        const wrapper = this.find('.raport-wrapper');
        if (wrapper) return wrapper.clientWidth / rem;
        return 0;
      }
      const resize = () => {
        this.set('windowWidthInRem', getSize());
      };
      this.checkResize = resize;
      this.resetUndo();
      this.command('styleWithCSS', false, 'true');
      this._undoWatch = this.observe('report', debounce(this._onChange, 2000), { defer: true, init: true });
      const settings = JSON.parse(window.localStorage.getItem('settings') || '{}');
      this.set('settings', settings);
      window.addEventListener('beforeunload', () => {
        if (this.get('settings.autosave')) {
          window.localStorage.setItem('autosave', JSON.stringify({
            report: this.get('report'),
            show: this.get('show'),
            tmp: this.get('tmp'),
            tab: this.get('tab'),
            'temp.expr.tab': this.get('temp.expr.tab'),
            'temp.bottom.tab': this.get('temp.bottom.tab'),
            projectName: this.get('project.name'),
          }));
        } else {
          if (!window.confirm(`Leaving this page will lose any unsaved changes. Are you sure you want to leave?`)) {
            return false;
          }
        }
      });
      window.addEventListener('keydown', ev => {
        if (ev.ctrlKey) {
          if (ev.key === 's') {
            this.saveProjects();
            ev.stopPropagation();
            ev.preventDefault();
          } else if (ev.shiftKey && ev.key === 'Enter') {
            this.run();
            this.set('tab', 'result');
            ev.stopPropagation();
            ev.preventDefault();
          } else if (ev.key === 'Enter' && !(document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'CODE')) {
            this.set({
              'temp.expr.tab': 'text',
              'show.bottom': true,
            });
            const el = document.getElementById('expr-text');
            if (el) el.focus();
            ev.stopPropagation();
            ev.preventDefault();
          }
        } else if (ev.key === 'Escape' && this.get('reparent')) {
          this.set('reparent', undefined);
        } else if (ev.key === 'Escape' && this.get('copy')) {
          this.set('copy', undefined);
        }
      }, { capture: true });
      window.addEventListener('message', ev => {
        if (ev.data === 'run') {
          this.run();
          this.set('tab', 'result');
        }
      });
      this.loadProjects();
      if (settings.autosave) {
        let save: any = window.localStorage.getItem('autosave');
        if (save) save = JSON.parse(save);

        const name = save && save.projectName;
        if (name) {
          const projects = this.get('projects');
          const idx = projects.findIndex((p: AvailableSource) => p.name === name);
          if (~idx) this.linkProject(`projects.${idx}`);
        }
        this.set('', save, { deep: true });
      }
      this._inited = true;
      this.applySettings();
    },
    expr(ctx, path?: string) {
      const p = path || ctx.resolve();
      this.link(p, 'expr');
      this.set('temp.expr.path', p);
    },
    teardown() {
      this._undoWatch.cancel();
    },
    render() {
      setTimeout(() => {
        this._onChange(this.get('report'));
        this.applySettings();
        this.checkResize();
        window.addEventListener('resize', this.checkResize);
        this.once('unrender', () => {
          window.removeEventListener('resize', this.checkResize);
        });
      }, 100);
    }
  },
  decorators: {
    expr(node, header?: boolean) {
      const ctx = this.getContext(node);
      function change(v: string) {
        if (!v) v = '';
        if (header) v = v.replace(/\.fields\./, '.headers.');
        if (v === ctx.resolve('.')) {
          node.classList.add('hover-expr');
        } else {
          node.classList.remove('hover-expr');
        }
      }
      const observer = ctx.observe('~/temp.expr.hover', change);
      const listeners = [
        ctx.listen('click', () => this.fire('expr', ctx)),
        ctx.listen('mouseover', () => {
          let p = ctx.resolve();
          if (header) p = p.replace(/\.headers\./, '.fields.');
          ctx.set('~/temp.expr.hover', p);
        }),
        ctx.listen('mouseout', () => ctx.set('~/temp.expr.hover', '')),
      ];
      return {
        teardown() {
          observer.cancel();
          listeners.forEach(l => l.cancel());
          node.classList.remove('active-expr');
        }
      };
    },
    widget(node, type: string) {
      const ctx = this.getContext(node);
      node.classList.add(type);
      node.classList.add('widget');
      function select(v: string) {
        if (v === ctx.resolve()) {
          node.classList.add('active-widget');
        } else {
          node.classList.remove('active-widget');
        }
      }
      function hover(v: string) {
        if (v === ctx.resolve()) {
          node.classList.add('hover-widget');
        } else {
          node.classList.remove('hover-widget');
        }
      }
      const selectObserver = ctx.observe('~/temp.widget', select);
      const hoverObserver = ctx.observe('~/temp.hover', hover);
      return {
        teardown() {
          selectObserver.cancel();
          hoverObserver.cancel();
          node.classList.remove(type);
          node.classList.remove('widget');
        }
      };
    },
    scrolled(node) {
      const ctx = this.getContext(node);
      const owner = ctx.ractive as any;
      if (!owner._scrollers) owner._scrollers = [];
      node.classList.add('scrolled');
      let tm = setTimeout(() => {
        scroll();
      }, 100);
      node.classList.add('scroll-top', 'scroll-bottom');
      function scroll() {
        tm = null;
        if (node.scrollHeight > node.offsetHeight) {
          if (node.scrollTop > 0) node.classList.remove('scroll-top');
          else node.classList.add('scroll-top');

          if (node.scrollTop + node.offsetHeight < node.scrollHeight) node.classList.remove('scroll-bottom');
          else node.classList.add('scroll-bottom');
        } else {
          node.classList.add('scroll-top', 'scroll-bottom');
        }
      }
      const scrollb = function() {
        if (tm) return;
        tm = setTimeout(scroll, 250);
      }
      const listener = ctx.listen('scroll', scrollb);

      owner._scrollers.push(scroll);

      return {
        invalidate() {
          scrollb();
          return '';
        },
        teardown() {
          node.classList.remove('scrolled', 'scroll-top', 'scroll-bottom');
          listener.cancel();
          owner._scrollers.splice(owner._scrollers.indexOf(scroll), 1);
        }
      }
    },
    moveable(node) {
      const ctx = this.getContext(node);
      const idx = ctx.get('@index');
      let x: number, y: number, sx: number, sy: number, cx: number, cy: number, sz: number;
      const listener = ctx.listen('mousedown', (ev: MouseEvent) => {
        sx = ctx.get(`^^/layout.${idx}.0`) || 0;
        sy = ctx.get(`^^/layout.${idx}.1`) || 0;
        cx = cy = 0;
        x = ev.clientX;
        y = ev.clientY;
        const sizer = document.getElementById('sizer');
        sz = sizer ? sizer.offsetHeight : 12;
        document.body.addEventListener('mousemove', move);
        document.body.addEventListener('mouseup', up);
        document.body.addEventListener('keydown', esc);
      });
      function move(ev: MouseEvent) {
        cx = ev.clientX - x;
        cy = ev.clientY - y;
        if (!ev.ctrlKey && !ev.shiftKey) {
          ctx.set({ [`^^/layout.${idx}.0`]: Math.round(sx + (cx / sz)), [`^^/layout.${idx}.1`]: Math.round(sy + (cy / sz)) });
        } else {
          ctx.set({ [`^^/layout.${idx}.0`]: sx + (cx / sz), [`^^/layout.${idx}.1`]: sy + (cy / sz) });
        }
      }
      function up() {
        document.body.removeEventListener('mousemove', move);
        document.body.removeEventListener('mouseup', up);
        document.body.removeEventListener('keydown', esc);
      }
      function esc(ev: KeyboardEvent) {
        if (ev.key === 'Escape') {
          up();
          ctx.set({ [`^^/layout.${idx}.0`]: sx, [`^^/layout.${idx}.1`]: sy });
        }
      }
      return {
        teardown() {
          listener.cancel();
        }
      }
    },
    invalidated(node) {
      const ctx = this.getContext(node);
      return {
        teardown() {},
        invalidate() {
          if (ctx.hasListener('invalidate')) ctx.raise('invalidate', {});
        }
      };
    },
    autosize,
    trackfocus,
    tracked(node, name) {
      this[name] = node;
      return {
        teardown() {
          if (this[name] === node) this[name] = undefined;
        },
      };
    },
  },
  events: {
    keys: function KeyEvent(_node, fire) {
      const options = Object.assign({}, arguments[arguments.length - 1]);
      if (arguments.length > 2) {
        options.keys = [];
        for (let i = 2; i < arguments.length; i++) {
          if (typeof arguments[i] === 'string') options.keys.push(arguments[i]);
        }
      }

      const mods = ['ctrl', 'shift', 'alt', 'meta'];
      const listener = (ev: KeyboardEvent) => {
        for (const mod of mods) {
          if (options[mod] && !ev[`${mod}Key`] || !options[mod] && ev[`${mod}Key`]) return;
        }
        if (~options.keys.indexOf(ev.key)) fire({ event: ev });
      };

      window.addEventListener('keydown', listener, { capture: true, passive: true });

      return {
        teardown() {
          window.removeEventListener('keydown', listener, { capture: true });
        }
      };
    },
  },
}
Ractive.extendWith(Designer, designerOpts);

function nameForWidget(type: string, path: string): string {
  if (path === 'report') return 'report ';
  else if (path === 'report.header') return 'Page Header ';
  else if (path === 'report.footer') return 'Page Footer ';
  else if (path === 'report.watermark') return 'Watermark ';
  else if (path === 'report.overlay') return 'Overlay ';
  if (type === 'container') {
    const p = Ractive.splitKeypath(path);
    const prop = p.pop();
    if (prop === 'header') return 'Repeater Header ';
    else if (prop === 'footer') return 'Repeater Footer ';
    else if (prop === 'alternate') return 'Repeater Alternate ';
    else if (prop === 'row') return 'Repeater Row ';
    else if (!isNaN(+prop) && p.pop() === 'group') return `Repeater Group ${+prop + 1} `;
  }
  return `${type} `;
}

function tryParseData(str: string, header?: boolean): any {
  if (!str) return;

  try {
    return JSON.parse(str);
  } catch {
    if (str.trim()[0] === '<') {
      const data = parseXML(str);
      if (data) return data;
    }

    const brace = /[\{\[]/.exec(str);
    if (brace && brace.index >=0 && brace.index <= 20) {
      const res = evaluate(str);
      if (typeof res === 'string') {
        try {
          return JSON.parse(res);
        } catch {
          const csv = evaluate({ res, header }, `parse(str, { csv:1 detect:1 header:header })`);
          if (csv.length) return csv;
          else return str;
        }
      } else if (res) return res;
    }

    const csv = evaluate({ str, header }, `parse(str, { csv:1 detect:1 header:header })`);
    if (!csv.length && str.length) {
      const res = evaluate(str);
      if (typeof res === 'string') {
        try {
          return JSON.parse(res);
        } catch {
          const csv = evaluate({ res, header }, `parse(str, { csv:1 detect:1 header:header })`);
          if (csv.length) return csv;
          else return str;
        }
      } else if (res) return res;
    } else return csv;
  }
}

function cloneDeep(v: any): any {
  try {
    return JSON.parse(JSON.stringify(v));
  } catch {
    return {};
  }
}

const fontKeys = ['family', 'size', 'weight', 'color', 'align', 'line', 'right', 'pre', 'clamp'];
function stripDefaults(json: any): any {
  if (typeof json !== 'object') return json;

  if (Array.isArray(json)) return json.map(stripDefaults);

  const res: any = {};
  for (const k in json) {
    const v = json[k];
    if (v === false && k !== 'classifyStyles' && k !== 'headerPerPage') continue;
    else if ((k === 'hide' || k === 'br') && !v) continue;
    else if (k === 'height' && v === 'auto' && (json.type === 'container' || json.type === 'repeater')) continue;
    else if (Array.isArray(v)) {
      const a = [];
      v.forEach(v => a.push(stripDefaults(v)));
      res[k] = a;
    } else if (typeof v === 'object') {
      if (k === 'font') {
        if (Object.values(v).find(v => v != null && v !== '' && v !== false) !== undefined) {
          const font: any = {};
          fontKeys.forEach(f => v[f] != null && v[f] !== '' && v[f] !== false && (font[f] = v[f]));
          if (typeof font.weight === 'string') font.weight = +font.weight;
          if (json.type === 'html' && Object.keys(font).length === 1 && font.line === 0) continue;
          res.font = font;
        } else continue;
      } else if (!Object.keys(v).length) continue;
      else if (Object.keys(v).length === 1 && 'x' in v && !v.x) continue;
      else if (k === 'format' && !v.name) continue;
      else {
        const r = stripDefaults(v);
        if (r !== '') res[k] = r;
      }
    } else if (v === '') continue;
    else res[k] = v;
  }
  if (res.type === 'page' || res.type === 'flow' || res.type === 'delimited') {
    if (res.context && !Object.keys(res.context).length) delete res.context;
    if (!res.extraContext) delete res.extraContext;
    if (res.defaultParams && !Object.keys(res.defaultParams).length) delete res.defaultParams;
    if (res.sources && !res.sources.length) delete res.sources;
    if (res.parameters && !res.parameters.length) delete res.parameters;
    if (!res.orientation || res.orientation === 'landscape') delete res.orientation;
    if (!res.name) delete res.name;
    if (!res.header || !Object.keys(res.header).length || !Array.isArray(res.header.widgets) || !res.header.widgets.length) delete res.header;
    if (!res.footer || !Object.keys(res.footer).length || !Array.isArray(res.footer.widgets) || !res.footer.widgets.length) delete res.footer;
    if (!res.width) delete res.width;
    if (!res.margin || (Array.isArray(res.margin)) && !res.margin.length) delete res.margin;
    if (!res.source) delete res.source;
    if (!res.headers || !res.headers.length) delete res.headers;
    if (!res.record) delete res.record;
    if (!res.field) delete res.field;
    if (!res.quote) delete res.quote;
  }
  if (res.type === 'delimited') {
    delete res.size;
    delete res.widgets;
  }
  if (res.type === 'repeater') {
    if (!res.header || res.headerPerPage) delete res.headerPerPage;
    if (!res.header || !res.group || !res.group.length) delete res.groupHeaders;
    if (!res.footer || !res.group || !res.group.length) delete res.groupEnds;
  }
  if (res.source) {
    if (!res.filter) delete res.filter;
    if (!res.sort) delete res.sort;
    if (!res.base) delete res.base;
    if (!res.parameters || Object.keys(res.parameters).length === 0) delete res.parameters;
  }
  if (res.classifyStyles || res.classifyStyles == null) delete res.classifyStyles;
  return res;
}

const fmtOpts = { throw: true, consumeAll: true };
function fmt(str: Computed|ValueOrExpr|Array<ValueOrExpr|Span>, template?: boolean, compact?: boolean, stringifyOpts?: StringifyOpts): Computed|ValueOrExpr|Array<ValueOrExpr|Span> {
  if (typeof str !== 'string' && typeof str !== 'object') return str;
  const parser = template ? parseTemplate : parse;
  const opts = Object.assign(fmtOpts, { template });
  const listWrap = compact ? 0 : 40;
  const noIndent = compact;
  const fopts = Object.assign({ listWrap, noIndent }, stringifyOpts, { template });
  if (typeof str === 'string') {
    try {
      return stringify(parser(str, opts), fopts);
    } catch {
      return str;
    }
  } else if (Array.isArray(str)) {
    return str.map(e => {
      if (typeof e === 'string') {
        try {
          return stringify(parser(e, opts), fopts);
        } catch {
          return e;
        }
      } else if ('text' in e && typeof e.text === 'string') {
        try {
          return Object.assign({}, e, { text: stringify(parser(e.text, opts), fopts) });
        } catch {
          return e;
        }
      } else if (isValueOrExpr(e)) {
        return stringify(e, fopts);
      } else {
        return e;
      }
    });
  } else if ('x' in str && typeof str.x === 'string') {
    try {
      return { x: stringify(parser(str.x, opts), fopts) };
    } catch {
      return str;
    }
  } else if (isValueOrExpr(str)) {
    return stringify(str, fopts);
  }
  return str;
}

function fmtAll(json: any, compact?: boolean, fopts?: StringifyOpts): any {
  if (typeof json !== 'object') return json;

  if (Array.isArray(json)) return json.map(j => fmtAll(j, compact, fopts));

  const res = {};

  for (const k in json) {
    const v = json[k];
    if (k === 'text' || k === 'width' || k === 'height' || k === 'hide' || k === 'br') res[k] = fmt(v, false, compact, fopts);
    else if (k === 'name' || k === 'html') res[k] = fmt(v, true, compact, fopts);
    else res[k] = fmtAll(v, compact, fopts);
  }

  return res;
}

const plainKeys = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
function jsonToJS(json: any, strings: 'json'|'template'): string {
  if (typeof json === 'number') return `${json}`;
  else if (typeof json === 'boolean') return json ? 'true' : 'false';
  else if (json === null) return 'null';
  else if (json === undefined) return 'null';
  else if (typeof json === 'string') return strings === 'json' ? JSON.stringify(json) : `\`${json.replace(/(`|${|\\)/g, '\\$1')}\``;
  else if (Array.isArray(json)) return `[${json.map(v => jsonToJS(v, strings)).join(',')}]`;
  else if (typeof json === 'object') return `{${Object.entries(json).map(([k, v]) => v === undefined ? v : `${plainKeys.test(k) ? k : `'${k}'`}:${jsonToJS(v, strings)}`).filter(v => !!v).join(',')}}`;
}

function joinPath(one: string, two: string) {
  if (/\/$/.test(one)) return `${one}${two}`;
  else return `${one}.${two}`;
}

registerOperator({
  type: 'value',
  names: ['debugger'],
  apply(..._args) {
    debugger;
  },
});

let clipEl: HTMLTextAreaElement;
function copyToClipboard(text: string): Promise<boolean> {
  if (!clipEl) {
    clipEl = document.createElement('textarea');
    clipEl.id = 'clipEl';
    clipEl.style.position = 'absolute';
    clipEl.style.width = '1em';
    clipEl.style.height = '1em';
    clipEl.tabIndex = -1;
    clipEl.style.left = '-10000px';
    document.body.appendChild(clipEl);
  }

  try {
    clipEl.value = text;
    clipEl.select();
    document.execCommand('copy');
    return Promise.resolve(true);
  } catch {
    return Promise.resolve(false);
  }
}
