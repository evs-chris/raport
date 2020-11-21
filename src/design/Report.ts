import { css, template } from 'views/Report';

import Ractive, { InitOpts, ContextHelper } from 'ractive';
import { Report, Literal, run, parse, stringify, PageSizes, PageSize, PageOrientation, Widget, Root, Context, extend, filter, evaluate, inspect, SourceMap, getOperatorMap } from 'raport/index';

export interface ExprOptions {
  html?: boolean;
}

export interface AvailableSource {
  name: string;
  values(params?: object): Promise<any>;
}

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
      widget.html = ':<div>html</div>';
    }

    this.push(`${path}.widgets`, widget);
  }

  async run() {
    const report: Report = this.get('report');
    const ctx = await this.buildRoot();
    const text = run(report, ctx.sources, ctx, {
      foot: this.frameExtra()
    });
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
    const width: number = this.get('report.width');
    if (width) return `width: ${width}rem;`;
    const size: PageSize = this.get('report.size');
    const orientation: PageOrientation = this.get('report.orientation') || 'landscape';
    if (size) {
      const w = orientation === 'landscape' ? size.height : size.width;
      const margin: [number, number] = [((size.margin || [])[0] || 0), ((size.margin || [])[1]) || 0];
      return `width: ${w - margin[1] - margin[1]}rem; margin: 1rem auto; box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.4); padding: ${margin[0]}rem ${margin[1]}rem; min-height: ${orientation === 'landscape' ? size.width : size.height}rem; background-size: 1rem 1rem; background-position: ${10.5 - margin[0]}rem ${10.5 - margin[1]}rem; background-image: radial-gradient(circle, #ccc 1px, transparent 1px);`;
    }
    return '';
  }

  calcHeight(w: Widget): string {
    if (typeof w.height === 'number') return `${w.height}rem`;
    else if (typeof w.height === 'object' && w.height.percent) return `${w.height.percent}%`;
    else if (w.type !== 'container' && w.type !== 'repeater') return '1rem';
    else return 'min-content';
  }

  calcHeightWithMargin(w: Widget): string {
    const h = this.calcHeight(w);
    if (!w.margin) return h;
    if (typeof w.margin === 'number') return `calc(${h} + ${2 * w.margin}rem)`;
    else if (w.margin.length === 2) return `calc(${h} + ${2 * w.margin[0]}rem)`;
    else if (w.margin.length === 4) return `calc(${h} + ${w.margin[0] + w.margin[2]}rem)`;
  }

  calcWidth(w: Widget): string {
    if (!w.width) return '100%';
    else if (typeof w.width === 'object' && w.width.percent) return `${w.width.percent}%`;
    if (typeof w.width === 'number') return `${w.width}rem`;
    else return `${w.width.percent}%`;
  }

  calcWidthWithMargin(w: Widget, path: string): string {
    if (/^report\.widgets\.\d+$/.test(path)) return '100%';
    const width = this.calcWidth(w);
    if (!w.margin) return width;
    if (typeof w.margin === 'number') return `calc(${width} + ${2 * w.margin}rem)`;
    else if (w.margin.length === 2) return `calc(${width} + ${2 * w.margin[1]}rem)`;
    else if (w.margin.length === 4) return `calc(${width} + ${w.margin[1] + w.margin[3]}rem)`;
  }

  calcMargin(w: Widget): string {
    const m = w.margin;
    if (!m) return '';
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
  }

  async eval() {
    const str: string = this.get('temp.expr.str');
    const ctx = await this.buildLocalContext(this.get('temp.expr.path'));
    const parsed = parse(str, { detailed: true });
    const res = evaluate(ctx, str);
    this.set('temp.expr.parsed', JSON.stringify(parsed, null, '  '));
    this.set('temp.expr.result', res);
    this.set('temp.expr.tab', 'result');
  }

  readHtml(expr: string): string {
    if (expr[0] === ':') return expr.substr(1);
    else if (expr[0] === "'" || expr[0] === '"' || expr[0] === '`') return expr.slice(1, -1);
    else return expr;
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
    console.log(await source.values());
  }

  editExpr(path: string, options?: ExprOptions) {
    if ((this as any).event) path = this.getContext((this as any).event.node).resolve(path);
    if (path.startsWith('widget.')) path = path.replace('widget', this.get('temp.widget'));
    this.set('temp.expr.path', path);

    const html = options && options.html;
    const tab = this.get('temp.expr.tab');
    this.set('temp.expr.html', html);
    this.set('temp.expr.tab', html ? 'html' : tab === 'ast' || tab === 'text' ? tab : 'ast');
    this.set('temp.bottom.tab', 'expr');

    this.link(path, 'expr');
    this.set('temp.expr.str', this.get(path));
    this.set('temp.bottom.pop', true);
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
    node.style.height = '';
    setTimeout(() => {
      node.style.height = `${node.scrollHeight + 1}px`;
    });
  }

  checkExpr() {
    if (this.get('expr') !== this.get('temp.expr.str')) {
      this.unlink('expr');
      this.set('temp.expr', {});
    }
  }

  async buildRoot(): Promise<Root> {
    const report: Report = this.get('report');
    const avs: AvailableSource[] = this.get('sources');
    const sources: SourceMap = {};
    for (const src of report.sources) {
      const av = avs.find(s => s.name === src.source);
      if (av) sources[src.name || src.source] = await av.values(this.get('params'));
    }
    
    const res = new Root({}, { parameters: this.get('params') });
    res.sources = sources;
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
          loc = loc[parts.shift()];
          if (loc) {
            if (loc.context) {
              ctx = extend(ctx, { value: evaluate(ctx, loc.context) });
            } else if (loc.source && loc.source.source) {
              ctx = extend(ctx, { value: filter(root.sources[loc.source.source] || { value: [] }, loc.source.filter, loc.source.sort, loc.source.group, ctx).value });
            } else if (loc.source) {
              ctx = extend(ctx, { value: evaluate(ctx, loc.source) });
            }
          }
        }
      }
    }

    return ctx;
  }

  getSchema(ctx: Context) {
    const base = inspect(ctx.value);
    let pl = base;
    pl.fields = pl.fields || [];
    let c = ctx;
    let prefix = '';

    let t = inspect(ctx.root.sources);
    t.fields.forEach(f => (f.name = `*${f.name}`, pl.fields.push(f)));
    t = inspect(ctx.root.special);
    t.fields.forEach(f => (f.name = `@${f.name}`, pl.fields.push(f)));

    (this.get('report.parameters') || []).forEach(p => pl.fields.push({ name: `!${p.name}`, type: p.type }));

    if (c !== c.root) {
      while (c) {
        c = c.parent;
        if (c === c.root) prefix = '#';
        else prefix += '^';

        t = inspect(c.value);
        t.fields.forEach(f => (f.name = `${prefix}${f.name}`, pl.fields.push(f)));

        if (c === c.root) break;
      }
    }

    return base;
  }

  insertRef(path: string) {
    const tab = this.get('temp.expr.tab') || 'ast';

    const parts = Ractive.splitKeypath(path);
    let ps = [];
    while (parts.length && parts[parts.length - 1] !== 'ctx') {
      ps.unshift(this.get(Ractive.joinKeys.apply(Ractive, parts.concat('name'))));
      parts.pop();
      parts.pop();
    }
    if (ps[0][0] === '*' && ps[1] === 'value' && ps.length > 2) ps[1] = '0';
    const ref = Ractive.joinKeys.apply(Ractive, ps);

    if (tab === 'text') {
      const node: HTMLTextAreaElement = this.find('textarea.expr-text') as any;

      const cur = node.value;
      const pos = [node.selectionStart, node.selectionEnd];
      node.value = cur.substring(0, pos[0]) + ref + cur.substr(pos[1]);
      node.selectionStart = node.selectionEnd = pos[0] + ref.length;

      node.dispatchEvent(new InputEvent('input'));
      node.dispatchEvent(new InputEvent('change'));
      node.focus();
    } else if (tab === 'ast') {
      const active = this.get('temp.expr.partpath') || 'temp.expr.ast';
      this.set(active, { r: ref });
    }
  }

  insertOp(name: string) {
    const tab = this.get('temp.expr.tab') || 'ast';

    if (tab === 'text') {
      const node: HTMLTextAreaElement = this.find('textarea.expr-text') as any;

      const op = `(${name})`;
      const cur = node.value;
      const pos = [node.selectionStart, node.selectionEnd];
      node.value = cur.substring(0, pos[0]) + op + cur.substr(pos[1]);
      node.selectionStart = node.selectionEnd = pos[0] + op.length - 1;

      node.dispatchEvent(new InputEvent('input'));
      node.dispatchEvent(new InputEvent('change'));
      node.focus();
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
      console.error('Failed to load report', e);
    }
  }

  download(name: string, data: string, type: string = 'application/json') {
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

  setHTMLFontSize() {
    const size = this.get('temp.fontSize');
    if (size) {
      this.command('fontSize', false, size);
    }
    setTimeout(() => this.set('temp.fontSize', ''));
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
          tab: 'ast',
        }
      }
    };
  },
  computed: {
    operators() { return getOperatorMap(); }
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
      const path = this.get('temp.expr.path');
      if (path) this.set(path, v);
      if (!this.evalLock) {
        this.evalLock = true;
        try {
          const parsed = parse(v);
          if ('message' in parsed) {
            this.set('temp.expr.error', parsed)
            this.set('temp.expr.ast', undefined);
          } else {
            this.set('temp.expr.ast', parsed);
            this.set('temp.expr.error', undefined);
          }

          if (v[0] === '`' || v[0] === `'` || v[0] === '"') {
            this.set('temp.expr.htmlstr', v.slice(1, -1));
          } else if ('v' in parsed && v[0] === ':') {
            this.set('temp.expr.htmlstr', v.substr(1));
          } else {
            this.set('temp.expr.htmlstr', '');
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
        this.evalLock = true;
        try {
          const parsed = parse(`'${v.replace(/'/g, "\\'")}'`);
          this.set('temp.expr.ast', parsed);
          this.set('temp.expr.error', undefined);
          this.set('temp.expr.str', stringify(parsed));
        } catch {}
        this.evalLock = false;
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
      let v: string = this.get('temp.expr.path');
      if (v) {
        if (v.startsWith('widget.')) v = v.replace('widget', this.get('temp.widget'));
        this.set('temp.expr.ctx', this.getSchema(await this.buildLocalContext(v)));
      } else {
        this.set('temp.expr.ctx', this.getSchema(await this.buildLocalContext()));
      }
    },
    'temp.bottom.pop'() {
      setTimeout(() => this.resetScrollers());
    },
  },
  on: {
    init() {
      this.command('styleWithCSS', false, 'true');
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
        sz = node.offsetHeight / (ctx.get('.height') || 1)
        document.body.addEventListener('mousemove', move);
        document.body.addEventListener('mouseup', up);
      });
      function move(ev: MouseEvent) {
        cx = ev.clientX - x;
        cy = ev.clientY - y;
        if (!ev.ctrlKey) {
          ctx.set({ [`^^/layout.${idx}.0`]: Math.round(sx + (cx / sz)), [`^^/layout[${idx}][1]`]: Math.round(sy + (cy / sz)) });
        } else {
          ctx.set({ [`^^/layout.${idx}.0`]: sx + (cx / sz), [`^^/layout[${idx}][1]`]: sy + (cy / sz) });
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
