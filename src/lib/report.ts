import { Sort, ValueOrExpr, Parameter, ParameterMap, SourceMap, Root, Context, RootContext, extend, evaluate, filter } from './data/index';

import { renderWidget, RenderContext, RenderResult, RenderState, expandMargin } from './render/index';
import { styleClass } from './render/style';

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

// TODO: sources should be a named datasource and a label for the report so that one source can be used multiple times

interface BaseReport<T = {}> {
  type: ReportType;
  name?: string;
  parameters?: Parameter<T>[];
  sources?: ReportSource[];
  context?: ParameterMap;
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
}

export interface Displayed<T = {}> extends BaseReport<T> {
  widgets: Widget[];
}

// flow
export interface Flow<T = {}> extends Displayed<T> {
  type: 'flow';
  width?: number;
  margin?: [number, number];
  size?: PageSize;
  orientation?: PageOrientation;
}

// page
export interface Page<T = {}> extends Displayed<T> {
  type: 'page';
  header?: Container;
  footer?: Container;
  size: PageSize;
  orientation?: PageOrientation;
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
  size?: number;
  family?: string;
  weight?: number;
  color?: string;
  align?: 'left'|'right'|'center';
  line?: number;
  right?: number;
  pre?: boolean;
  clamp?: boolean;
}

export interface Placement {
  x: number;
  y: number;
  availableX?: number;
  availableY?: number;
  maxX?: number;
  maxY?: number;
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
  [key: string]: any;
  width?: Dimension|Computed; // default 100%
  height?: Dimension|'auto'|Computed; // optional, defaulting to 1
  margin?: Margin|Computed;
  hide?: ValueOrExpr;
  br?: boolean|Computed;
}

export interface Container extends Widget {
  widgets: Widget[];
  layout?: Layout;
  context?: ValueOrExpr;
}

export interface Image extends Widget {
  url: ValueOrExpr;
}

export interface Span {
  text: ValueOrExpr;
  font?: Font;
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
}

export interface HTML extends Widget {
  html: ValueOrExpr;
}

export interface Repeater extends Widget {
  source: PartSource|ValueOrExpr;
  header?: Container;
  group?: Container[];
  groupEnds?: boolean[];
  row: Container;
  footer?: Container;
  headerPerPage?: boolean;
}

export interface MeasureFont {
  /** The font family for the label. The built-in estimator only works with sans, serif, narrow, and mono fonts, which should be relatively metric-compatible with Arial, Times New Roman, Arial Narrow, and, well, any fixed-width font. */
  family?: 'sans'|'serif'|'narrow'|'mono'|string;
  /** Font size in rem, where 1rem is 16px or 12pt based on the report html element style */
  size?: number;
  /** The line-height of the rendered font in rem */
  line?: number;
  /** Average width in px at font-size 16px. If this is supplied, it won't be guessed based on the font name. */
  metric?: number;
}

export interface MeasuredLabel extends Widget {
  font?: MeasureFont;
  text: ValueOrExpr;
  metric?: number;
}

// execution
interface ReportExtras {
  /** Extra content to be rendered at the bottom of the <head> */
  head?: string;
  /** Extra content to be rendered at the bottom of the <body> */
  foot?: string;
}

export function run(report: Report, sources: SourceMap, parameters?: ParameterMap|Root, extra?: ReportExtras): string {
  const ctx = parameters && 'root' in parameters && parameters.root === parameters ? parameters as Root : new Root(Object.assign({}, report.context), { parameters });

  if (report.sources) {
    for (const src of report.sources) {
      applySource(ctx, src, sources);
    }
    for (const k in ctx.sources) { // set sources in root of context
      ctx.value[k] = ctx.sources[k].value;
    }
  }

  if (report.type === 'delimited') return runDelimited(report, ctx);
  else if (report.type === 'flow') return runFlow(report, ctx, extra);
  else return runPage(report, ctx, extra);
}

export function applySource(context: RootContext, source: ReportSource, sources: SourceMap) {
  let base = sources[source.source || source.name] || { value: [] };
  if (source.base) base = { value: evaluate(extend(context, { value: base.value, special: { source: base } }), source.base) };
  if (source.filter || source.sort || source.group) context.sources[source.name || source.source] = filter(base, source.filter, source.sort, source.group, context);
  else context.sources[source.name || source.source] = base;
}

function runDelimited(report: Delimited, context: Context): string {
  const source = context.root.sources[report.source ? report.source : (report.sources[0].name || report.sources[0].source)];
  let res = '';
  if (report.headers) res += report.headers.map(h => `${report.quote || ''}${evaluate(context, h)}${report.quote || ''}`).join(report.field || ',') + (report.record || '\n');
  const values = Array.isArray(source.value) ? source.value : [source.value];
  const unquote: RegExp = report.quote ? new RegExp(report.quote, 'g') : undefined;
  for (const value of values) {
    const c = extend(context, { value });
    res += report.fields.map(f => {
      let val = `${evaluate(c, f)}`;
      if (unquote) val = val.replace(unquote, report.quote + report.quote);
      return `${report.quote || ''}${val}${report.quote || ''}`;
    }).join(report.field || ',') + (report.record || '\n');
  }
  return res;
}

function runPage(report: Page, context: Context, extras?: ReportExtras): string {
  let size: PageSize = report.orientation !== 'portrait' ? { width: report.size.height, height: report.size.width, margin: [report.size.margin[1], report.size.margin[0]] } : report.size;

  const ctx: RenderContext = { context, report, styles: {}, styleMap: { ids: {}, styles: {} } };
  context.special = context.special || {};
  context.special.page = 0;
  context.special.pages = 0;

  const pages: string[] = [''];
  let page = 0;
  let availableY = size.height - 2 * size.margin[0];
  let maxY = availableY;
  let y = 0;
  const availableX = size.width - 2 * size.margin[1];
  let state: RenderState<any> = null;

  let headSize = 0;
  if (report.header) {
    const r = renderWidget(report.header, ctx, { x: 0, y: 0, availableX, availableY, maxX: availableX, maxY });
    headSize = r.height;
    availableY -= headSize;
    maxY -= headSize;
    y += headSize;
  }

  let footSize = 0;
  if (report.footer) {
    const r = renderWidget(report.footer, ctx, { x: 0, y: 0, availableX, availableY, maxX: availableX, maxY });
    footSize = r.height;
    availableY -= footSize;
    maxY -= footSize;
  }

  for (const w of report.widgets) {
    let r: RenderResult;
    do {
      r = renderWidget(w, ctx, { x: 0, y, availableX, availableY, maxX: availableX, maxY }, state);
      pages[page] += r.output;
      if (r.continue) {
        page++;
        pages[page] = '';
        y = headSize;
        availableY = size.height - 2 * size.margin[0] - headSize - footSize;
        state = r.continue;
      } else {
        y += r.height;
        availableY -= r.height;
        state = null;
      }
    } while (state !== null)
  }

  context.special.pages = pages.length;
  const footTop = size.height - 2 * size.margin[0] - footSize;

  pages.forEach((p, i) => {
    let n = `<div class="page-back pb${i}"><div${styleClass(ctx, ['page', `ps${i}`], ['', ''], '', 'p')}>\n`;
    context.special.page = i + 1;
    if (report.header) {
      const r = renderWidget(report.header, ctx, { x: 0, y: 0, maxX: availableX, maxY });
      n += r.output + '\n';
    }
    n += p;
    if (report.footer) {
      const r = renderWidget(report.footer, ctx, { x: 0, y: footTop, maxX: availableX, maxY });
      n += r.output + '\n';
    }
    n += '\n</div></div>';
    pages[i] = n;
  });

  return `<html style="font-size:100%;margin:0;padding:0;"><head><style>
    .page { width: ${size.width - 2 * size.margin[1]}rem; height: ${size.height - 2 * size.margin[0]}rem; position: absolute; overflow: hidden; left: ${size.margin[1]}rem; top: ${size.margin[0]}rem; }
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

  for (const w of report.widgets) {
    html += `<div${styleClass(ctx, [], [`position:absolute;right:0rem;left:0rem;${width ? `width:${width}rem;` : ''}`, ''], `top:${y}rem;`, 'p')}>\n`;
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

  const margin = report.size && report.size.margin ? expandMargin(report.size, ctx) : [1.5, 1.5, 1.5, 1.5];

  return `<html><head><style>
    html { font-size: 100%; margin: 0; padding: 0; }
    body { font-size: 0.83rem; padding: 0; margin: 0;${width ? ` width: ${width}rem;` : ''} }
    #wrapper { height:${y}rem; position: relative; }
    @media screen {
      body { margin: 1rem; background-color: #fff; box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.4); padding: ${margin[0]}rem ${margin[1]}rem ${margin[2]}rem ${margin[3]}rem; }
      html { background-color: #999; }
    }${Object.entries(ctx.styles).map(([_k, v]) => v).join('\n')}${Object.entries(ctx.styleMap.styles).map(([style, id]) => `.${id} { ${style} }`).join('\n')}
  </style>${extras && extras.head || ''}</head><body>\n<div id=wrapper>${html}</div>${extras && extras.foot || ''}</body></html>`;
}
