import { css, template } from 'views/Report';

import Ractive, { InitOpts, ContextHelper, ReadLinkResult } from 'ractive';
import { Report, Literal, run, parse, stringify, PageSizes, PageSize, PageOrientation, Widget, Root, Context, extend, filter, applySource, evaluate, inspect, getOperatorMap, parseTemplate, isComputed, registerOperator, ValueOrExpr, Span, Computed, isValueOrExpr, SourceMap } from 'raport/index';
import { nodeForPosition, ParseNode, ParseError } from 'sprunge';

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
}

let autosizeTm: any;

export class Designer extends Ractive {
  constructor(opts?: InitOpts) {
    super(opts);
  }

  evalLock = false;
  _scrollers: Array<() => void> = [];

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

  async run() {
    const report: Report = this.get('report');
    const ctx = new Root({}, { parameters: this.get('params') });
    const srcs = await this.buildSources();
    let text: string;
    this.fire('running');
    try {
      text = run(report, srcs, ctx, {
        foot: this.frameExtra()
      });
    } catch {}
    this.fire('run');
    this.set('result', text);
    return true;
  }

  frameExtra() {
    return `
      <style>
        html:before, html:after { content: ' '; position: fixed; display: block; z-index: 2; box-shadow: 0 0 10px #000; transition: opacity 0.4s ease-in-out; opacity: 1; width: 100%; height: 5px; }
        html:before { top: -5px; }
        html:after { bottom: -5px; }
        html.scrolled-top:before { opacity: 0; }
        html.scrolled-bottom:after { opacity: 0; }
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
        html.classList.add('scrolled-top');
      </script>
    `;
  }

  paperSize(): string {
    const type = this.get('report.type');
    if (type === 'flow') {
      const width: number = this.get('report.width');
      if (width) return `width: ${width}rem;`;
    }
    const size: PageSize = this.get('report.size');
    const orientation: PageOrientation = this.get('report.orientation') || 'landscape';
    if (size) {
      const w = orientation === 'landscape' ? size.height : size.width;
      const margin: [number, number] = [((size.margin || [])[0] || 0), ((size.margin || [])[1]) || 0];
      return `width: ${w}rem; box-sizing: border-box; margin: 1rem auto; box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.4); padding: ${margin[0]}rem ${margin[1]}rem; min-height: ${orientation === 'landscape' ? size.width : size.height}rem; background-size: 1rem 1rem; background-position: ${10.5 - margin[0]}rem ${10.5 - margin[1]}rem; background-image: radial-gradient(circle, #ccc 1px, transparent 1px);`;
    }
    return '';
  }

  calcHeight(w: Widget): string {
    if (typeof w.height === 'number') return `${w.height}rem`;
    else if (typeof w.height === 'object' && 'percent' in w.height && w.height.percent) return `${w.height.percent}%`;
    else if (w.type === 'label') {
      let n = 1;
      if (w.font && w.font.size > n) n = w.font.size;
      if (Array.isArray(w.text)) {
        for (let i = 0; i < w.text.length; i++) {
          if (typeof w.text[0] === 'object' && w.text[0].font && w.text[0].font.size > n) n = w.text[0].font.size;
        }
      }
      return `${n}rem`;
    } else if (w.type !== 'container' && w.type !== 'repeater') return '1rem';
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

  calcWidth(w: Widget): string {
    if (!w.width || isComputed(w.width)) return '100%';
    else if (typeof w.width === 'object' && w.width.percent) return `${w.width.percent}%`;
    if (typeof w.width === 'number') return `${w.width}rem`;
    else return `${w.width.percent}%`;
  }

  calcWidthWithMargin(w: Widget, path: string): string {
    if (/^report\.widgets\.\d+$/.test(path)) return '100%';
    const width = this.calcWidth(w);
    if (!w.margin || isComputed(w.margin)) return width;
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
    if (typeof b === 'number') return `border-bottom: ${b * 0.0625}rem solid;`;
    else if (Array.isArray(b)) {
      if (b.length === 1) return `border: ${b[0] * 0.0625}rem solid;`;
      else if (b.length === 2) return `border-style: solid; border-width: ${b[0] * 0.0625}rem ${b[1] * 0.0625}rem`;
      else if (b.length === 4) return `border-style: solid; border-width: ${b[0] * 0.0625}rem ${b[1] * 0.0625}rem ${b[2] * 0.0625}rem ${b[3] * 0.0625}rem`;
    } else if (typeof b === 'string') {
      return `border: 1px dotted green;`;
    } else return `border-style: solid; border-width: ${(b.top || 0) * 0.0625}rem ${(b.right || 0) * 0.0625}rem ${(b.bottom || 0) * 0.0625}rem ${(b.left || 0) * 0.0625}rem;`;
    return '';
  }

  calcFont(w: Widget): string {
    const f = w.font;
    let res = '';
    if (f.pre) res += 'white-space: pre-wrap;';
    if (f.size) res += `font-size: ${f.size}rem;`;
    if (f.line) res += `line-height: ${f.line}rem;`;
    if (f.align) res += `text-align: ${f.align};`;
    if (f.color) res += `color: ${f.color};`;
    if (f.family) res += `font-family: ${f.family};`;
    if (f.weight) res += `font-weight: ${f.weight};`;
    if (f.right) res += `padding-right: ${f.right}rem;`;
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
    this.link(path, 'widget');
    this.set('temp.name', (path === 'report' ? 'Report' : (this.get(path + '.type') || '')) + ' ');
    this.set('temp.widget', path);
    const w: Widget = this.get('widget');
    if (w.type === 'html') this.editExpr(`${path}.html`, { html: true });
    else if (w.type === 'label' || w.type === 'measured') this.editExpr(`${path}.text`, { label: true });
    else if (w.type === 'image') this.editExpr(`${path}.url`);
    this.treeScrollToActive();
  }

  treeScrollToActive() {
    setTimeout(() => {
      const el = document.querySelector('.tree .node.active > .line');
      if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  async eval() {
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

  async logData(source: AvailableSource) {
    if ('type' in source && source.type === 'fetch') {
      console.log(await this.fetchData(source));
    } else if ('data' in source || 'values' in source) {
      console.log(source.data ? source.data : await source.values());
    }
  }

  editExpr(path: string, options?: ExprOptions) {
    if ((this as any).event) path = this.getContext((this as any).event.node).resolve(path);
    if (path.startsWith('widget.')) path = path.replace('widget', this.get('temp.widget'));

    let val = this.get(path);
    if (Array.isArray(val)) {
      val.forEach((v, i) => {
        if (typeof v === 'object' && !('text' in v)) val[i] = stringify(v);
      });
    } else if (typeof val !== 'string') val = stringify(val);

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
    this.set('temp.bottom.pop', true);

    const el = document.getElementById(`expr-${html ? 'html' : 'text'}`);
    if (el) el.focus();
  }

  editParam(ctx: ContextHelper) {
    const path = ctx.resolve();
    this.set('temp.bottom.pop', true);
    this.set('temp.bottom.param', path);
    this.set('temp.bottom.tab', 'param');
    this.link(path, 'param');
  }

  editReportSrc(ctx: ContextHelper, key?: string) {
    const path = ctx.resolve(key || undefined);
    this.set('temp.bottom.pop', true);
    this.set('temp.bottom.source', path);
    this.set('temp.bottom.tab', 'source');
    this.link(path, 'source');
  }

  moveUp(ctx: ContextHelper, path?: string, index?: number) {
    const idx = index !== undefined ? index : ctx.get('@index');

    if (idx <= 0) return;
    const [item] = ctx.splice(path || '../', idx - 1, 1).result;
    ctx.splice(path || '../', idx, 0, item);
  }

  moveDown(ctx: ContextHelper, path?: string, index?: number) {
    const idx = index !== undefined ? index : ctx.get('@index');

    if (idx >= ctx.get('@last')) return;
    const [item] = ctx.splice(path || '../', idx + 1, 1).result;
    ctx.splice(path || '../', idx, 0, item);
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

  async buildRoot(): Promise<Root> {
    const res = new Root({}, { parameters: this.get('params') });
    const report: Report = this.get('report');
    const srcs = await this.buildSources();
    for (const src of report.sources || []) {
      const av = srcs[src.source];
      if (av) applySource(res, src, { [src.source]: av });
      if (!((src.name || src.source) in res.value)) res.value[src.name || src.source] = (res.sources[src.name || src.source] || {}).value;
    }
    return res;
  }

  async buildSources(): Promise<SourceMap> {
    const report: Report = this.get('report');
    const avs: AvailableSource[] = this.get('sources');
    const res: SourceMap = {};
    for (const src of report.sources || []) {
      const av = avs.find(s => s.name === src.source);
      if (av) {
        let d: any;
        const vv: any = av;
        if (vv.type === 'fetch' && (vv.fetch || !vv.data)) {
          d = await this.fetchData(vv);
          if (!vv.eval) d = { value: tryJSON(d) };
          if (!vv.fetch) vv.data = d;
        } else if ('data' in av && av.data) {
          if (!vv.eval && typeof av.data === 'string') d = { value: tryJSON(av.data) };
          else d = av.data;
        } else if ('values' in av && typeof av.values === 'function') {
          d = await av.values(this.get('params') || []);
        }
        res[av.name] = d;
      }
    }
    return res;
  }

  async buildLocalContext(path?: string): Promise<Context> {
    const root = await this.buildRoot();
    root.special['date'] = new Date();
    let loc: any = this.get('report');
    let ctx: Context = root;

    if (path) {
      const parts = Ractive.splitKeypath(path);
      if (parts[0] === 'report') parts.shift();
      if (parts[0] === 'fields') {
        ctx = extend(ctx, { value: evaluate(ctx, `*${this.get('report.sources.0.source')}.0`) });
      } else if (parts[0] === 'sources') {
        if (parts[parts.length - 1] === 'base') ctx = extend(ctx, { value: evaluate(ctx, `*${this.get(`report.sources.${parts[1]}.source`)}.value`) });
        else ctx = extend(ctx, { value: evaluate(ctx, `*${this.get(`report.sources.${parts[1]}.source`)}.0`) });
      } else {
        while (loc && parts.length) {
          const part = parts.shift();
          loc = loc[part];
          if (loc) {
            if (loc.context) {
              ctx = extend(ctx, { value: evaluate(ctx, loc.context) });
            } else if (loc.source && loc.source.source) {
              const source = filter(root.sources[loc.source.source] || { value: [] }, loc.source.filter, loc.source.sort, loc.source.group, ctx);
              ctx = extend(ctx, { value: source.value, special: { source } });
            } else if (loc.source) {
              ctx = extend(ctx, { value: evaluate(ctx, loc.source) });
            }
          }

          if (loc && loc.type === 'repeater' && parts[0] === 'row') {
            ctx = extend(ctx, { value: evaluate(ctx, '@value.0') });
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
    const url = this.evalExpr(data.url, true, ctx);
    const headers: { [key: string]: string } = {};
    if (Array.isArray(data.headers)) {
      for (let i = 0; i < data.headers.length; i++) headers[data.headers[i][0]] = this.evalExpr(data.headers[i][1], true, ctx);
    }
    try {
      const req: RequestInit = { headers, method: data.method };
      if (req.method === 'POST' || req.method === 'PUT') req.body = this.evalExpr(data.body, true, ctx);
      const res = await fetch(url, req);
      if (set) this.set('data.data', await res.text());
      else return res.text();
    }  catch {}
  }

  getSchema(ctx: Context) {
    const base = inspect(ctx.value);
    let pl = base;
    pl.fields = pl.fields || [];
    let c = ctx;
    let prefix = '';

    for (const k in ctx.root.sources) {
      pl.fields.push({ name: `*${k}`, type: 'any' });
    }

    let t = inspect(ctx.root.special);
    t.fields.forEach(f => (f.name = `@${f.name}`, pl.fields.push(f)));

    (this.get('report.parameters') || []).forEach(p => pl.fields.push({ name: `!${p.name}`, type: p.type }));

    if (c !== c.root) {
      while (c) {
        c = c.parent;
        if (c === c.root) prefix = '#';
        else prefix += '^';

        t = inspect(c.value);
        (t.fields || []).forEach(f => (f.name = `${prefix}${f.name}`, pl.fields.push(f)));

        if (c === c.root) break;
      }
    }

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
    let ref = Ractive.joinKeys.apply(Ractive, ps);
    if (this.get('temp.expr.html') || this.get('temp.expr.template')) ref = `{{${ref}}}`;

    if (tab === 'text') {
      const node: HTMLTextAreaElement = this.find('textarea.expr-text') as any;

      const cur = node.value;
      const pos = [node.selectionStart, node.selectionEnd];
      node.value = cur.substring(0, pos[0]) + ref + cur.substr(pos[1]);
      node.selectionStart = node.selectionEnd = pos[0] + ref.length;

      node.dispatchEvent(new InputEvent('input'));
      node.dispatchEvent(new InputEvent('change'));
      node.focus();
    } else if (tab === 'html') {
      return this.command('insertText', false, ref);
    } else if (tab === 'ast') {
      const active = this.get('temp.expr.partpath') || 'temp.expr.ast';
      this.set(active, { r: ref });
    }
  }

  insertOp(name: string) {
    const tab = this.get('temp.expr.tab') || 'text';

    let op = `${name}()`;
    if (this.get('temp.expr.html') || this.get('temp.expr.template')) op = `{{${op}}}`;

    if (tab === 'text') {
      const node: HTMLTextAreaElement = this.find('textarea.expr-text') as any;

      const cur = node.value;
      const pos = [node.selectionStart, node.selectionEnd];
      node.value = cur.substring(0, pos[0]) + op + cur.substr(pos[1]);
      node.selectionStart = node.selectionEnd = pos[0] + op.length - 1;

      node.dispatchEvent(new InputEvent('input'));
      node.dispatchEvent(new InputEvent('change'));
      node.focus();
    } else if (tab === 'html') {
      return this.command('insertText', false, op);
    } else if (tab === 'ast') {
      const active = this.get('temp.expr.partpath') || 'temp.expr.ast';
      const part = this.get(active);
      if (!part) {
        this.set('temp.expr.ast', { op: name });
        this.set('temp.expr.partpath', active);
      } else {
        this.set(active, { op: name, args: [part] });
      }
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

  reportToString(compact: boolean) {
    const json = this.get('report');
    if (!compact) return JSON.stringify(json, null, 2);
    else return JSON.stringify(stripDefaults(json));
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
        reader.onload = txt => this.tryImport(txt.target.result as string);
        reader.readAsText(file);
      }
    }
    input.addEventListener('change', load);
    input.click();
  }

  tryImport(str: string) {
    if (!str || !this.readLink('data')) return;
    const json = tryJSON(str);
    if (json) {
      if (typeof json === 'object' && 'type' in json && json.type === 'fetch') this.set('data', json);
    } else {
      this.set('data.data', str);
    }
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

  nodeForPosition(pos: number, name?: true): ParseError|ParseNode[] {
    const str = this.get('temp.expr.str');
    const r = (this.get('temp.expr.html') || this.get('temp.expr.template') ? parseTemplate : parse)(str, { tree: true });
    if ('message' in r) return r;
    else return nodeForPosition(r, pos, name);
  }

  fmt() {
    const str = this.get('temp.expr.str');
    this.set('temp.expr.str', fmt(str));
  }

  fmtAll() {
    const json = this.get('report');
    this.set('report', fmtAll(json));
  }

  removeWidget(ctx: ContextHelper) {
    if (this.get('temp.widget') === ctx.resolve()) this.set('temp.widget', undefined);
    this.checkLink('expr', ctx.resolve());
    if (ctx.get('^^/groupEnds')) ctx.splice('^^/groupEnds', ctx.get('^^/groupEnds') - 1 - ctx.get('@index'), 1);
    if (ctx.get('../type') === 'repeater') ctx.set('^^/' + ctx.get('@key'), undefined); 
    else {
      if (Array.isArray(ctx.get('^^/layout'))) ctx.splice('^^/layout', ctx.get('@index'), 1);
      const path = ctx.resolve();
      const idx: number = ctx.get('@index');
      ctx.splice('../', idx, 1);
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
    const projects: AvailableSource[] = this.get('projects') || [];
    for (const p of projects) {
      if ('type' in p && p.type === 'fetch') delete (p as any).data;
    }
    window.localStorage.setItem('projects', JSON.stringify(this.get('projects') || []));
  }

  loadProjects() {
    this.set('projects', JSON.parse(window.localStorage.getItem('projects') || '[]'));
  }

  makeProject(clean?: true) {
    const project = clean ? { name: 'Project', report: {}, sources: [] } : { name: 'Project', report: this.get('report') || {}, sources: this.get('sources') || [] };
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
      if ('type' in s && s.type === 'fetch') {
        return Object.assign({}, s, { data: undefined });
      } else {
        return Object.assign({}, s);
      }
    });
    return JSON.stringify(Object.assign({}, project, { sources, report: this.get('project.report') || this.get('report') || {} }));
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

  importProject(str?: string) {
    const cb = (txt: string) => {
      const res = JSON.parse(txt);
      if (Array.isArray(res) && res.length > 0 && 'name' in res[0]) {
        this.set('projects', res);
        this.checkLinks();
      } else if (typeof res === 'object' && 'name' in res) {
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

    if (str) {
      cb(str);
    } else {
      const input: HTMLInputElement = this.find('#project-file') as any;
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
  }
}

Ractive.extendWith(Designer, {
  template, css, cssId: 'raport-report',
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
        }
      },
      exprExpand: {},
    };
  },
  computed: {
    operators() {
      const map = getOperatorMap();
      const keys = Object.keys(map).filter(k => !~k.indexOf('parse')).sort();
      return keys.reduce((a, c) => (a[c] = map[c], a), {} as typeof map);
    }
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
      try {
        this.set(k.replace('temp', 'report'), (parse(`'${v.replace(/'/g, '\\\'')}'`) as Literal).v);
      } catch {}
    },
    'temp.expr.str'(v) {
      if (!v) {
        this.set('temp.expr.error', undefined);
        this.set('temp.expr.ast', undefined);
        return;
      }

      const path = this.get('temp.expr.path');
      const html = this.get('temp.expr.html') || this.get('temp.expr.template');
      if (path) this.set(path, v);
      if (!this.evalLock) {
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
              this.set('temp.expr.ast', undefined);
            } else {
              this.set('temp.expr.ast', parsed);
              this.set('temp.expr.error', undefined);
            }

            if (html) this.set('temp.expr.htmlstr', v);
            else this.set('temp.expr.htmlstr', '');

            if ('message' in parsed) break;
          }
        } catch {}
        this.evalLock = false;
      }
    },
    'temp.expr.ast'(v, o) {
      if (!this.evalLock) {
        this.evalLock = true;
        if (o === undefined && v) this.set('temp.expr.error', undefined);
        try {
          const str = stringify(v);

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
    async 'temp.expr.path report.parameters report.sources'() {
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
    'temp.bottom.pop'() {
      setTimeout(() => this.resetScrollers());
    },
    'report.defaultParams'(v) {
      this.set('params', Object.assign({}, v));
    }
  },
  on: {
    init() {
      this.command('styleWithCSS', false, 'true');
      this.loadProjects();
    },
    expr(ctx, path?: string) {
      const p = path || ctx.resolve();
      this.link(p, 'expr');
      this.set('temp.expr.path', p);
    },
  },
  decorators: {
    expr(node, path?: string) {
      const ctx = this.getContext(node);
      function change(v: string) {
        if (v === ctx.resolve(path || '.')) {
          node.classList.add('hover-expr');
        } else {
          node.classList.remove('hover-expr');
        }
      }
      const observer = ctx.observe('~/temp.expr.hover', change);
      const listeners = [
        ctx.listen('click', () => this.fire('expr', ctx)),
        ctx.listen('mouseover', () => ctx.set('~/temp.expr.hover', path || ctx.resolve())),
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
      const listener = ctx.listen('click', ev => {
        const p = ctx.resolve();
        this.link(p, 'widget');
        this.set('temp.widget', p);
        this.set('temp.name', `${ctx.get('label') || ctx.get('type')} `);
        ev.stopPropagation();
        ev.preventDefault();
        return false;
      });
      return {
        teardown() {
          selectObserver.cancel();
          hoverObserver.cancel();
          listener.cancel();
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
      });
      function move(ev: MouseEvent) {
        cx = ev.clientX - x;
        cy = ev.clientY - y;
        if (!ev.ctrlKey) {
          ctx.set({ [`^^/layout.${idx}.0`]: Math.round(sx + (cx / sz)), [`^^/layout.${idx}.1`]: Math.round(sy + (cy / sz)) });
        } else {
          ctx.set({ [`^^/layout.${idx}.0`]: sx + (cx / sz), [`^^/layout.${idx}.1`]: sy + (cy / sz) });
        }
      }
      function up() {
        document.body.removeEventListener('mousemove', move);
        document.body.removeEventListener('mouseup', up);
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
  },
});

function tryJSON(str: string): any {
  try {
    return JSON.parse(str);
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
    if (v === false) continue;
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
          if (json.type === 'html' && Object.keys(font).length === 1 && font.line === 0) continue;
          res.font = font;
        } else continue;
      } else if (!Object.keys(v).length) continue;
      else if (Object.keys(v).length === 1 && 'x' in v && !v.x) continue;
      else if (k === 'format' && !v.name) continue;
      else res[k] = stripDefaults(v);
    } else res[k] = v;
  }
  if (res.type === 'page' || res.type === 'flow' || res.type === 'delimited') {
    if (res.context && !Object.keys(res.context).length) delete res.context;
    if (res.defaultParams && !Object.keys(res.defaultParams).length) delete res.defaultParams;
    if (res.sources && !res.sources.length) delete res.sources;
    if (res.parameters && !res.parameters.length) delete res.parameters;
    if (!res.orientation || res.orientation === 'landscape') delete res.orientation;
    if (!res.name) delete res.name;
    if (!res.header || !Object.keys(res.header).length || !Array.isArray(res.header.widgets) || !res.header.widgets.length) delete res.header;
    if (!res.footer || !Object.keys(res.footer).length || !Array.isArray(res.footer.widgets) || !res.footer.widgets.length) delete res.footer;
    if (!res.width) delete res.width;
    if (!res.margin || !res.margin.length) delete res.margin;
    if (!res.source) delete res.source;
    if (!res.headers || !res.headers.length) delete res.headers;
    if (!res.record) delete res.record;
    if (!res.field) delete res.field;
    if (!res.quote) delete res.quote;
  }
  return res;
}

const fmtOpts = { throw: true, consumeAll: true };
function fmt(str: Computed|ValueOrExpr|Array<ValueOrExpr|Span>, template?: boolean): Computed|ValueOrExpr|Array<ValueOrExpr|Span> {
  if (typeof str !== 'string' && typeof str !== 'object') return str;
  const parser = template ? parseTemplate : parse;
  const opts = Object.assign(fmtOpts, { template });
  if (typeof str === 'string') {
    try {
      return stringify(parser(str, opts),  { template });
    } catch {
      return str;
    }
  } else if (Array.isArray(str)) {
    return str.map(e => {
      if (typeof e === 'string') {
        try {
          return stringify(parser(e, opts), { template });
        } catch {
          return e;
        }
      } else if ('text' in e && typeof e.text === 'string') {
        try {
          return Object.assign({}, e, { text: stringify(parser(e.text, opts), { template }) });
        } catch {
          return e;
        }
      } else if (isValueOrExpr(e)) {
        return stringify(e, { template });
      } else {
        return e;
      }
    });
  } else if ('x' in str && typeof str.x === 'string') {
    try {
      return { x: stringify(parser(str.x, opts), { template }) };
    } catch {
      return str;
    }
  } else if (isValueOrExpr(str)) {
    return stringify(str, { template });
  }
  return str;
}

function fmtAll(json: any): any {
  if (typeof json !== 'object') return json;

  if (Array.isArray(json)) return json.map(fmtAll);

  const res = {};

  for (const k in json) {
    const v = json[k];
    if (k === 'text' || k === 'html' || k === 'width' || k === 'height' || k === 'hide' || k === 'br') res[k] = fmt(v);
    else if (k === 'name') res[k] = fmt(v, true);
    else res[k] = fmtAll(v);
  }

  return res;
}

registerOperator({
  type: 'value',
  names: ['parse', 'unparse'],
  apply(name, [str, opts]) {
    return name === 'parse' ? (opts && opts.template ? parseTemplate : parse)(str) : stringify(str, opts);
  }
});
