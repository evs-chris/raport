import { Sort, ValueOrExpr, Parameter, ParameterMap, SourceMap, DataSet, Root, Context, extend, evaluate, filter, Type } from './data/index';

import { renderWidget, RenderContext, RenderResult, RenderState } from './render/index';
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
  name: string;
}

export interface ReportSource extends PartSource {
  source: string;
  parameters?: { [name: string]: ValueOrExpr };
}

// TODO: sources should be a named datasource and a label for the report so that one source can be used multiple times

interface BaseReport<T = {}> {
  type: ReportType;
  parameters?: Parameter<T>[];
  sources?: ReportSource[];
  context?: ParameterMap;
  classifyStyles?: boolean;
}

// delimited
export interface Delimited<T = {}> extends BaseReport<T> {
  type: 'delimited';
  source?: string;
  fields: ValueOrExpr[];
  header?: ValueOrExpr[];
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
  border?: number|Borders;
}

export type Margin = number|[number, number]|[number, number, number, number];

// Widgets
export interface Widget extends Style {
  type: string;
  [key: string]: any;
  width?: Dimension; // default 100%
  height?: Dimension|'auto'; // optional, defaulting to 1
  margin?: Margin;
  hide?: ValueOrExpr;
  br?: boolean;
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
}
export interface Label extends Widget {
  text: ValueOrExpr|Span|Array<ValueOrExpr|Span>;
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
}

export interface MeasuredLabel extends Widget {
  font?: MeasureFont;
  text: ValueOrExpr;
}

// execution
export function run(report: Report, sources: SourceMap, parameters?: ParameterMap|Root): string {
  const ctx = parameters && 'root' in parameters && parameters.root === parameters ? parameters as Root : new Root(Object.assign({}, report.context), { parameters });

  if (report.sources) {
    for (const src of report.sources) {
      let base = sources[src.source || src.name] || { value: [] };
      if (src.base) base = { value: evaluate(extend(ctx, { value: base.value }), src.base) };
      if (src.filter || src.sort || src.group) ctx.sources[src.name] = filter(base, src.filter, src.sort, src.group, ctx);
      else ctx.sources[src.name] = base;
    }
    for (const k in ctx.sources) { // set sources in root of context
      ctx.value[k] = ctx.sources[k].value;
    }
  }

  if (report.type === 'delimited') return runDelimited(report, ctx);
  else if (report.type === 'flow') return runFlow(report, ctx);
  else return runPage(report, ctx);
}

function runDelimited(report: Delimited, context: Context): string {
  const source = context.root.sources[report.source ? report.source : report.sources[0].name];
  let res = '';
  if (report.header) res += report.header.map(h => `${report.quote || ''}${h}${report.quote || ''}`).join(report.field || ',') + (report.record || '\n');
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

function runPage(report: Page, context: Context): string {
  let size: PageSize = report.orientation === 'landscape' ? { width: report.size.height, height: report.size.width, margin: [report.size.margin[1], report.size.margin[0]] } : report.size;
  const ctx: RenderContext = { context, report, styles: {}, styleMap: { ids: {}, styles: {} } };
  context.special = context.special || {};
  context.special.page = 0;
  context.special.pages = 0;

  const pages: string[] = [''];
  let page = 0;
  let availableY = size.height - 2 * size.margin[0];
  let y = 0;
  const availableX = size.width - 2 * size.margin[1];
  let state: RenderState<any> = null;

  let headSize = 0;
  if (report.header) {
    const r = renderWidget(report.header, ctx, { x: 0, y: 0, availableX, availableY });
    headSize = r.height;
    availableY -= headSize;
    y += headSize;
  }

  let footSize = 0;
  if (report.footer) {
    const r = renderWidget(report.footer, ctx, { x: 0, y: 0, availableX, availableY });
    footSize = r.height;
    availableY -= footSize;
  }

  for (const w of report.widgets) {
    let r: RenderResult;
    do {
      r = renderWidget(w, ctx, { x: 0, y, availableX, availableY }, state);
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
    let n = `<div${styleClass(ctx, ['page'], [`position:absolute;height:${size.height - 2 * size.margin[0]}rem;width:${size.width - 2 * size.margin[1]}rem;left:${size.margin[1]}rem;overflow:hidden;`, ''], `top:${i * size.height + size.margin[0]}rem;`, 'p')}>\n`;
    context.special.page = i + 1;
    if (report.header) {
      const r = renderWidget(report.header, ctx, { x: 0, y: 0 });
      n += r.output + '\n';
    }
    n += p;
    if (report.footer) {
      const r = renderWidget(report.footer, ctx, { x: 0, y: footTop });
      n += r.output + '\n';
    }
    n += '\n</div>';
    pages[i] = n;
  });

  return `<html style="font-size:100%;margin:0;padding:0;"><head><style>@page { size: ${size.width}em ${size.height}em; }${Object.entries(ctx.styles).map(([k, v]) => v).join('\n')}${Object.entries(ctx.styleMap.styles).map(([style, id]) => `.${id} { ${style} }`).join('\n')}</style></head><body style="font-size:0.83rem;margin:0;padding:0;${size ? `width:${size.width}rem;` : ''}">\n${pages.reduce((a, c) => a + c, '')}</body></html>`;
}

function runFlow(report: Flow, context: Context): string {
  const ctx: RenderContext = { context, report, styles: {}, styleMap: { ids: {}, styles: {} } };
  let html = '';
  let y = 0;
  let state: RenderState<any> = null;

  let width: number;

  if (report.width) width = report.width;
  else if (report.size) width = report.orientation === 'landscape' ? report.size.height : report.size.width;

  for (const w of report.widgets) {
    html += `<div${styleClass(ctx, [], [`position:absolute;right:0rem;left:0rem;${width ? `width:${width}rem;` : ''}`, ''], `top:${y}rem;`, 'p')}>\n`;
    let r: RenderResult;
    let yy = 0;
    do {
      r = renderWidget(w, ctx, { x: 0, y: yy, availableX: width }, state);
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

  return `<html style="font-size:100%;margin:0;padding:0;"><head><style>${Object.entries(ctx.styles).map(([k, v]) => v).join('\n')}${Object.entries(ctx.styleMap.styles).map(([style, id]) => `.${id} { ${style} }`).join('\n')}</style></head><body style="font-size:0.83rem;padding:0;margin:0;">\n${html}</body></html>`;
}
