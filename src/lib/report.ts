import { Sort, ValueOrExpr, Parameter, ParameterMap, SourceMap, Root, Context, RootContext, extend, evaluate, filter, toDataSet } from './data/index';

import { renderWidget, RenderContext, RenderResult, RenderState, expandMargin, expandMacro } from './render/index';
import { styleClass, styleFont } from './render/style';

import { parse } from './data/parse';
import { parse as parseTemplate } from './data/parse/template';

export type ReportType = 'delimited'|'flow'|'page';

export type Report<T = {}> = Delimited<T> | Flow<T> | Page<T>;

export interface PartSource {
  /** Filters to apply to the base value of the data source */
  filter?: ValueOrExpr;
  /** Sorts to apply to the base value of the data source */
  sort?: Sort[]|ValueOrExpr;
  /** Groupings to apply to the base data source */
  group?: Array<ValueOrExpr>|ValueOrExpr;
  /** An expression to apply to the base data source before filtering, sorting, or grouping */
  base?: ValueOrExpr;
  /** The name of the data source to be pulled from the root context */
  source: string;
}

export interface ReportSource extends PartSource {
  /** The destination for the applied source, defaults to the source */
  name?: string;
  /** A user-friendly name for the source */
  label?: string;
  parameters?: { [name: string]: ValueOrExpr };
}

interface BaseReport<T = {}> {
  type: ReportType;
  name?: string;
  parameters?: Parameter<T>[];
  sources?: ReportSource[];
  /** An initial value for the root context. */
  context?: ParameterMap;
  /** An additional context expression to be merged with any fixed context just before the report is run. */
  extraContext?: ValueOrExpr;
  classifyStyles?: boolean;
  defaultParams?: ParameterMap;
}

// delimited
export interface Delimited<T = {}> extends BaseReport<T> {
  type: 'delimited';
  source?: string;
  fields: ValueOrExpr[];
  headers?: ValueOrExpr[];
  record?: string;
  field?: string;
  quote?: string;
  rowContext?: ValueOrExpr;
}

export interface Displayed<T = {}> extends BaseReport<T> {
  widgets: Widget[];
  font?: {
    family?: string;
    color?: string;
    size?: number;
    line?: number;
  };
  watermark?: Container;
  overlay?: Container;
}

// flow
export interface Flow<T = {}> extends Displayed<T> {
  type: 'flow';
  width?: number;
  margin?: Margin;
  size?: PageSize;
  orientation?: PageOrientation;
}

// page
export interface Page<T = {}> extends Displayed<T> {
  type: 'page';
  header?: Container & { outer?: boolean };
  footer?: Container & { outer?: boolean };
  size: PageSize;
  orientation?: PageOrientation;
  margin?: Margin;
}

export type Dimension = number|{ percent: number };

export interface PageSize {
  width: number;
  height: number;
  margin: [number, number];
}

export type PageOrientation = 'portrait'|'landscape';
export const PageSizes: { [name: string]: PageSize } = {
  letter: {
    width: 51,
    height: 66,
    margin: [1.5, 1.5],
  },
  legal: {
    width: 51,
    height: 84,
    margin: [1.5, 1.5],
  },
  tabloid: {
    width: 66,
    height: 102,
    margin: [1.5, 1.5],
  },
  a4: {
    width: 49.606302,
    height: 70.15746,
    margin: [1.5, 1.5],
  }
};

export function pageOffset(num: number, size: PageSize): number {
  return num * size.height + size.margin[0];
}

// Attributes
export interface Font {
  size?: number|Computed;
  family?: string|Computed;
  weight?: number|Computed;
  color?: string|Computed;
  align?: 'left'|'right'|'center'|'justify'|Computed;
  line?: number|Computed;
  right?: number;
  pre?: boolean|Computed;
  clamp?: boolean|Computed;
}

export interface Placement {
  x: number;
  y: number;
  availableX?: number;
  availableY?: number;
  maxX?: number;
  maxY?: number;
  offsetX?: number;
  offsetY?: number;
}
export type Layout = Array<[number, number]>|Placement[]|'row'|string;

export interface Borders {
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
}

export interface Style {
  font?: Font;
  border?: number|Borders|number[]|string;
}

export type Margin = number|[number, number]|[number, number, number, number];

export interface Computed {
  x: ValueOrExpr;
}

// Widgets
export interface Widget extends Style {
  type: string;
  width?: Dimension|Computed|'grow'; // default 100%
  height?: Dimension|'auto'|Computed|'grow'; // optional, defaulting to 1
  margin?: Margin|Computed;
  box?: 'expand'|'contain';
  hide?: ValueOrExpr;
  br?: boolean|Computed;
  bg?: ValueOrExpr;
  radius?: ValueOrExpr;

  // container
  widgets?: Widget[];
  layout?: Layout;
  context?: ValueOrExpr;
  bridge?: boolean;
  macro?: string;

  // label
  text?: ValueOrExpr|Array<ValueOrExpr|Span>;
  format?: LabelFormat;
  id?: string;
  styled?: boolean;

  // image
  url?: ValueOrExpr;
  fit?: 'cover'|'stretch'|Computed;

  // html
  html?: ValueOrExpr;

  // repeater
  source?: PartSource|ValueOrExpr;
  header?: Container;
  group?: Container[];
  groupEnds?: boolean[];
  groupHeaders?: boolean[];
  row?: Container;
  footer?: Container;
  alternate?: Container;
  headerPerPage?: boolean;

  // repeater row
  elide?: boolean|Computed;
}

export interface Container extends Widget {
  widgets: Widget[];
  layout?: Layout;
  context?: ValueOrExpr;
  bridge?: boolean;
  elide?: boolean|Computed;
  macro?: string;
}

export interface Image extends Widget {
  url: ValueOrExpr;
  fit?: 'cover'|'stretch'|Computed;
}

export interface Span {
  text: ValueOrExpr;
  font?: Font;
  bg?: ValueOrExpr;
  radius?: ValueOrExpr;
  id?: string;
}
export interface LabelFormat {
  name: string;
  args?: ValueOrExpr[];
}
export interface Label extends Widget {
  text: ValueOrExpr|Array<ValueOrExpr|Span>;
  format?: LabelFormat;
  id?: string;
  styled?: boolean;
}

export interface HTML extends Widget {
  html: ValueOrExpr;
}

export interface Repeater extends Widget {
  source: PartSource|ValueOrExpr;
  header?: Container;
  group?: Container[];
  groupEnds?: boolean[];
  groupHeaders?: boolean[];
  row: Container;
  footer?: Container;
  alternate?: Container;
  headerPerPage?: boolean;
  headerRepeat?: number;
}

export interface MeasureFont {
  /** The font family for the label. The built-in estimator only works with sans, serif, narrow, and mono fonts, which should be relatively metric-compatible with Arial, Times New Roman, Arial Narrow, and, well, any fixed-width font. */
  family?: 'sans'|'serif'|'narrow'|'mono'|string|Computed;
  /** Font size in rem, where 1rem is 16px or 12pt based on the report html element style */
  size?: number|Computed;
  /** The line-height of the rendered font in rem */
  line?: number|Computed;
  /** Average width in px at font-size 16px. If this is supplied, it won't be guessed based on the font name. */
  metric?: number|Computed;
  /** Break words that exceed the line length */
  'break-word'?: boolean;
}

export interface MeasuredLabel extends Widget {
  font?: MeasureFont;
  text: ValueOrExpr;
}

// execution
interface ReportExtras {
  /** Extra content to be rendered at the bottom of the <head> */
  head?: string;
  /** Extra content to be rendered at the bottom of the <body> */
  foot?: string;
  /** Run a delimited report to a table instead of using the defined delimiters */
  table?: boolean;
  /** Run a rendered report as a delimited report */
  delimited?: boolean;
  /** Record delimiter if running a rendered report as a delimited report */
  record?: string;
  /** Field delimiter if running a rendered report as a delimited report */
  field?: string;
  /** Field quoter if running a rendered report as a delimited report */
  quote?: string;
}

/** Initialize a parameter map based on the parameters defined by the given report. */
export function initParameters(report: Report, sources: SourceMap, parameters?: ParameterMap|Root): ParameterMap {
  const ctx = parameters && 'root' in parameters && parameters.root === parameters ? parameters as Root : new Root(Object.assign({}, report.context), { parameters });
  ctx.parameters = Object.assign({}, report.defaultParams, ctx.parameters);
  const inits: ParameterMap = {};

  if (report.sources) applySources(ctx, report.sources, sources);

  if (Array.isArray(report.parameters)) {
    for (const p of report.parameters) {
      if (p.init && p.name) {
        inits[p.name] = evaluate(ctx, p.init);
      }
    }
  }

  return inits;
}

/** Run the given report to string. If the report is displayed, the result will be HTML. Otherwise, it will be plain text. */
export function run(report: Report, sources: SourceMap, parameters?: ParameterMap|Root, extra?: ReportExtras): string {
  const ctx = parameters && 'root' in parameters && parameters.root === parameters ? parameters as Root : new Root(Object.assign({}, report.context), { parameters });

  if (report.sources) applySources(ctx, report.sources, sources);
  ctx.parameters = Object.assign({}, initParameters(report, sources), ctx.parameters);

  if (report.extraContext) {
    const res = evaluate(ctx, report.extraContext);
    if (res && typeof res === 'object') ctx.value = Object.assign(ctx.value, res);
  }

  if (report.type === 'delimited') return runDelimited(report, ctx, { table: extra?.table });
  else if (extra?.delimited) return runAsDelimited(report, ctx, extra);
  else if (report.type === 'flow') return runFlow(report, ctx, extra);
  else return runPage(report, ctx, extra);
}

/** Apply multiple sources to a context together. Each source base is available before filter/sort/group is applied in case a source needs to reference a later source for those purposes. */
export function applySources(context: RootContext, sources: ReportSource[], map: SourceMap) {
  const srcs = context.sources;
  for (const source of sources) {
    let base = map[source.source || source.name] || { value: [] };
    if (source.base) base = evaluate(extend(context, { value: base.value, special: { source: base } }), source.base);
    srcs[source.name || source.source] = toDataSet(base);
  }

  for (const source of sources) {
    if (source.filter || source.sort || source.group) srcs[source.name || source.source] = filter(srcs[source.name || source.source], source.filter, source.sort, source.group, context);
  }
}

export function applySource(context: RootContext, source: ReportSource, sources: SourceMap) {
  let base = sources[source.source || source.name] || { value: [] };
  if (source.base) base = { value: evaluate(extend(context, { value: base.value, special: { source: base } }), source.base) };
  if (source.filter || source.sort || source.group) context.sources[source.name || source.source] = filter(base, source.filter, source.sort, source.group, context);
  else context.sources[source.name || source.source] = toDataSet(base);
}

function runDelimited(report: Delimited, context: Context, options?: { table?: boolean }): string {
  const source = context.root.sources[report.source ? report.source : (report.sources[0].name || report.sources[0].source)];
  const values = Array.isArray(source.value) ?
    source.value :
    typeof source.value === 'object' && 'grouped' in source.value && Array.isArray(source.value.all) ? // watch out for grouped sources
      source.value.all :
      [source.value];
  let fields = report.fields;
  let headers = report.headers;

  if ((!fields || !fields.length) && values.length && typeof values[0] === 'object' && values[0]) {
    fields = Object.keys(values[0]);
    if (Array.isArray(values[0])) fields = fields.map(i => `_.${i}`);
    else if (!headers || !headers.length) headers = Object.keys(values[0]);
  }

  if (!fields) fields = [];

  let res = '';
  if (headers) {
    const ctx = extend(context, { parser: parseTemplate });
    if (options?.table) res += `<thead><tr><th class=index></th>${headers.map(h => `<th>${evaluate(ctx, h)}</th>`).join('')}</tr></thead>`;
    else res += headers.map(h => `${report.quote || ''}${evaluate(ctx, h)}${report.quote || ''}`).join(report.field || ',') + (report.record || '\n');
  }

  if (options?.table) {
    res += '<tbody>'
    let idx = 1;
    for (const value of values) {
      const c = extend(context, { value, special: { index: idx - 1 } });
      if (report.rowContext) {
        if (!c.locals) c.locals = {};
        const v = evaluate(c, report.rowContext);
        if (v) c.value = v;
      }
      res += `<tr><th class=index>${idx}</th>${fields.map(f => {
        let val = f ? evaluate(c, f) : '';
        if (val === undefined) val = '';
        if (typeof val !== 'string') {
          const v = val;
          val = `${v}`;
          if (val.slice(0, 7) === '[object') val = JSON.stringify(v);
        }
        return `<td>${val}</td>`;
      }).join('')}</tr>`;
      idx++;
    }
    res += '</tbody>';
    res = `<table>${res}</table>`;
  } else {
    const unquote: RegExp = report.quote ? new RegExp(report.quote, 'g') : undefined;
    let index = 0;
    for (const value of values) {
      const c = extend(context, { value, special: { index } });
      if (report.rowContext) {
        if (!c.locals) c.locals = {};
        const v = evaluate(c, report.rowContext);
        if (v) c.value = v;
      }
      res += fields.map(f => {
        let val = f ? evaluate(c, f) : '';
        if (val === undefined) val = '';
        if (typeof val !== 'string') {
          const v = val;
          val = `${v}`;
          if (val.slice(0, 7) === '[object') val = JSON.stringify(v);
        }
        if (unquote) val = val.replace(unquote, report.quote + report.quote);
        return `${report.quote || ''}${val}${report.quote || ''}`;
      }).join(report.field || ',') + (report.record || '\n');
      index++;
    }
  }

  return res;
}

function runPage(report: Page, context: Context, extras?: ReportExtras): string {
  let size: PageSize = report.orientation !== 'portrait' ? { width: report.size.height, height: report.size.width, margin: [report.size.margin[1], report.size.margin[0]] } : report.size;

  const ctx: RenderContext = { context, report, styles: {}, styleMap: { ids: {}, styles: {} } };
  const margin = expandMargin(report, ctx, { x: 0, y: 0 });
  context.special = context.special || {};
  context.special.page = 0;
  context.special.pages = 0;

  const pages: string[] = [''];
  let page = 0;
  const printX = size.width - 2 * size.margin[1];
  const printY = size.height - 2 * size.margin[0];
  let availableY = printY - margin[0] - margin[2];
  const pageY = availableY;
  let maxY = availableY;
  let y = 0;
  const availableX = printX - margin[1] - margin[3];
  let state: RenderState<any> = null;

  let headSize = 0;
  if (report.header) {
    const r = renderWidget(report.header, ctx, { x: 0, y: 0, availableX, availableY, maxX: availableX, maxY });
    headSize = r.height;
    if (!report.header?.outer) {
      availableY -= headSize;
      maxY -= headSize;
      y += headSize;
    }
  }

  let footSize = 0;
  if (report.footer) {
    const r = renderWidget(report.footer, ctx, { x: 0, y: 0, availableX, availableY, maxX: availableX, maxY });
    footSize = r.height;
    if (!report.footer?.outer) {
      availableY -= footSize;
      maxY -= footSize;
    }
  }

  for (let w of report.widgets || []) {
    if (w.macro) w = expandMacro(w.macro, w, ctx, { x: 0, y: 0, availableX, availableY, maxX: availableX, maxY }, state);
    let r: RenderResult;
    do {
      context.special.page = page + 1;
      r = renderWidget(w, ctx, { x: 0, y, availableX, availableY, maxX: availableX, maxY }, state);
      pages[page] += r.output;
      if (r.continue) {
        page++;
        pages[page] = '';
        y = report.header?.outer ? 0 : headSize;
        availableY = printY - (report.header?.outer ? 0 : headSize) - (report.footer?.outer ? 0 : footSize) - margin[0] - margin[2];
        state = r.continue;
      } else {
        y += r.height;
        availableY -= r.height;
        state = null;
      }
    } while (state !== null)
  }

  context.special.pages = pages.length;
  const footPlace = report.footer?.outer ?
    { x: 0, y: printY - footSize, maxX: printX, maxY: printY } :
    { x: 0 + margin[3], y: printY - margin[0] - footSize, maxX: printX - margin[3] - margin[1], maxY: printY - margin[0] - margin[2] };
  const headPlace = report.header?.outer ?
    { x: 0, y: 0, maxX: printX, maxY: printY } :
    { x: 0 + margin[3], y: margin[0], maxX: printX - margin[3] - margin[1], maxY: printY - margin[0] - margin[2] };

  context.special.size = { x: availableX, y: pageY };
  pages.forEach((p, i) => {
    let n = `<div class="page-back pb${i}"><div${styleClass(ctx, ['page', `ps${i}`], ['', ''], '', 'p')}>\n`;
    context.special.page = i + 1;
    if (report.watermark) {
      const r = renderWidget(report.watermark, ctx, { x: 0, y: 0, maxX: printX, availableX: printX, maxY: printY, availableY: printY });
      n += r.output + '\n';
    }
    if (report.header) {
      const r = renderWidget(report.header, ctx, headPlace);
      n += r.output + '\n';
    }
    n += `<div class="page-inner">${p}</div>`;
    if (report.footer) {
      const r = renderWidget(report.footer, ctx, footPlace);
      n += r.output + '\n';
    }
    if (report.overlay) {
      const r = renderWidget(report.overlay, ctx, { x: 0, y: 0, maxX: printX, availableX: printX, maxY: printY, availableY: printY });
      n += r.output + '\n';
    }
    n += '\n</div></div>';
    pages[i] = n;
  });

  return `<html style="font-size:100%;margin:0;padding:0;"><head><style>
    .page { width: ${printX}rem; height: ${printY}rem; position: absolute; overflow: hidden; left: ${size.margin[1]}rem; top: ${size.margin[0]}rem; ${report.font ? styleFont(report.font, ctx) : ''} }
    .page-inner { position: absolute; width: ${printX - margin[1] - margin[3]}rem; height: ${printY - margin[0] - margin[2]}rem; left: ${margin[3]}rem; top: ${margin[0]}rem; }
    .page-back { width: ${size.width}rem; height: ${size.height}rem; }
    body { font-size: 0.83rem; }
    @media screen {
      html { min-width: ${size.width + 2}rem; }
      body { background-color: #999; display: flex; flex-direction: column; align-items: center; }
      .page-back { background-color: #fff; box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.4); position: relative; overflow: hidden; box-sizing: border-box; margin: 0.5em; }
    }
    @media print {
      body { margin: 0; padding: 0; ${size ? `width:${size.width}rem;` : ''}background-color: none; display: block; height: ${pages.length * size.height}rem }
      .page-back { position: absolute; box-shadow: none; background-color: none; margin: 0; padding: 0; left: 0rem; }
      ${pages.map((_p, i) => `.pb${i} { top: ${i * size.height}rem; }`).join('')}
    }
    @page {
      size: ${size.width}em ${size.height}em;
    }${Object.entries(ctx.styles).map(([_k, v]) => v).join('\n')}${Object.entries(ctx.styleMap.styles).map(([style, id]) => `.${id} { ${style} }`).join('\n')}
  </style>${extras && extras.head || ''}</head><body>\n${pages.reduce((a, c) => a + c, '')}${extras && extras.foot || ''}</body></html>`;
}

function runFlow(report: Flow, context: Context, extras?: ReportExtras): string {
  const ctx: RenderContext = { context, report, styles: {}, styleMap: { ids: {}, styles: {} } };
  let html = '';
  let y = 0;
  let state: RenderState<any> = null;

  let width: number;

  if (report.width) width = report.width;
  else if (report.size) width = report.orientation !== 'portrait' ? report.size.height : report.size.width;

  let margin: [number, number, number, number];
  if (report.margin != null) margin = expandMargin(report, ctx, { x: 0, y: 0, availableX: width, maxX: width });
  if (!margin && report.size && report.size.margin) margin = expandMargin(report.size, ctx, { x: 0, y: 0, availableX: width, maxX: width });
  if (!margin) margin = [0, 0, 0, 0];

  // account for margins
  if (width) width -= (margin[1] || 0) + (margin[3] || 0);

  function render(w: Widget, cls: string) {
    html += `<div${styleClass(ctx, cls ? [cls] : [], [`position:absolute;right:0rem;left:0rem;${width ? `width:${width}rem;` : ''}`, ''], `top:${y}rem;`, 'p')}>\n`;
    let r: RenderResult;
    let yy = 0;
    do {
      r = renderWidget(w, ctx, { x: 0, y: yy, availableX: width, maxX: width }, state);
      if (typeof r === 'string') throw new Error(`Container widget didn't specify used height`);
      else {
        html += r.output;
        yy += r.height;
        if (r.continue) {
          state = r.continue;
        } else {
          state = null;
        }
      }
    } while (state !== null)
    y += yy;
    html += `</div>\n`;
  }

  if (report.watermark) render(report.watermark, 'watermark');
  let maxY = y || 0;
  y = 0;
  for (const w of report.widgets || []) render(w, 'main');
  if (y > maxY) maxY = y;
  y = 0;
  if (report.overlay) render(report.overlay, 'overlay');
  if (y > maxY) maxY = y;

  return `<html><head><style>
    html { font-size: 100%; margin: 0; padding: 0; }
    body { font-size: 0.83rem; padding: 0; margin: 0;${width ? ` width: ${width}rem;` : ''}; height: ${maxY}rem; position: relative; }
    .page-back { ${width ? `width: ${width}rem; ` : 'width: 100%; box-sizing: border-box; '}padding: ${margin[0] || 0}rem ${margin[1] || 0}rem ${margin[2] || 0}rem ${margin[3] || 0}rem; position: absolute; left: 0; top: 0; }
    #wrapper { height:${maxY}rem; position: relative; ${report.font ? styleFont(report.font, ctx) : ''} }
    .watermark { z-index: 0; }
    .main { z-index: 5; }
    .overlay { z-index: 10; }
    @media screen {
      body { margin: 1rem${width ? ' auto' : ''}; background-color: #fff; box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.4); padding: ${margin[0]}rem ${margin[1]}rem ${margin[2]}rem ${margin[3]}rem !important; }
    }${Object.entries(ctx.styles).map(([_k, v]) => v).join('\n')}${Object.entries(ctx.styleMap.styles).map(([style, id]) => `.${id} { ${style} }`).join('\n')}
  </style>${extras && extras.head || ''}</head><body>\n<div class=page-back><div id=wrapper>${html}</div></div>${extras && extras.foot || ''}</body></html>`;
}

function findWidgets(from: Widget, type: string, first?: boolean, results?: Widget[]): Widget[] {
  results = results || [];
  if (from.type === type) results.push(from);
  if (first && results.length) return results;
  if (from.widgets) for (const w of from.widgets) findWidgets(w, type, first, results);
  return results;
}

// TODO: this could try harder to carry context forward and use non-named sources if it seems necessary
function runAsDelimited(report: Flow|Page, context: RootContext, extra?: ReportExtras): string {
  const [repeater] = findWidgets({ type: 'container', widgets: report.widgets }, 'repeater', true) as Repeater[];
  if (repeater && typeof (repeater?.source as any)?.source === 'string') {
    let headers: ValueOrExpr[];
    let fields: ValueOrExpr[];
    const rowContext = repeater.row.context;

    if (repeater.header) {
      const labels = findWidgets(repeater.header, 'label') as Label[];
      headers = labels.map(l => typeof l.text === 'string' ? parse(l.text) : l.text) as ValueOrExpr[];
    }

    fields = (findWidgets(repeater.row, 'label') as Label[]).map(l => l.text) as ValueOrExpr[];

    const source = '_tmp';
    if (typeof repeater.source === 'object') {
      const src = repeater.source;
      let data;
      if ('source' in src) {
        const s = src as ReportSource;
        let base = context.sources[s.source] || { value: [] };
        if (s.base) base = { value: evaluate(extend(context, { value: base.value, special: { source: base } }), s.base) };
        if (s.filter || s.sort || s.group) base = filter(base, s.filter, s.sort, s.group, context);
        data = toDataSet(base);
      } else data = toDataSet(evaluate(context, src));
      context.sources._tmp = data;
    }

    return runDelimited(Object.assign({ type: 'delimited', headers, fields, source, rowContext }, extra) as Delimited, context, extra?.table ? { table: true } : {});
  }
  return '';
}
