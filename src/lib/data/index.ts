import { parse, parsePath, parseLetPath } from './parse';
import { ParseError } from 'sprunge/lib';

// Data
export interface Schema {
  root: Type;
  fields?: Field[];
}

export interface DataSource<T = any, R = any> {
  schema?: Schema;
  values(parms?: T): Promise<DataSet<R>>;
}

export interface DataSet<R = any> {
  schema?: Schema;
  grouped?: number;
  value: R;
}

export class CachedDataSource<R = any> implements DataSource<any, R> {
  _schema: Schema;
  _value: R;

  constructor(value: R, schema?: Schema) {
    this._value = value;
    this._schema = schema;
  }

  values(): Promise<DataSet<R>> { return Promise.resolve({ schema: this._schema, value: this._value }); }
}

export interface SourceMap { [key: string]: DataSet }

export type ValueType = 'string'|'number'|'boolean'|'date'|'object';
export type ArrayType = 'string[]'|'number[]'|'boolean[]'|'date[]'|'object[]';
export type Type = ValueType|ArrayType|'value'|'array'|'any';

export interface Field {
  /** The property name for the field */
  name: string;
  /** A user-friendly name for the field */
  label?: string;
  /** An optional type for the field */
  type?: Type;
  /** Child fields belonging to the field */
  fields?: Field[];
}

export interface Operation {
  op: string;
  args?: ValueOrExpr[];
}

export type Sort = ValueOrExpr|SortBy;
export type SortBy = SortBySQL|SortByDir;
export interface SortByBase {
  by: ValueOrExpr;
}
export interface SortBySQL extends SortByBase {
  desc?: ValueOrExpr|boolean;
}
export interface SortByDir extends SortByBase {
  dir?: ValueOrExpr|'asc'|'desc';
}

export type Operator = AggregateOperator | ValueOperator | CheckedOperator;

export interface BaseOperator {
  names: string[];
}
export interface ValueOperator extends BaseOperator {
  type: 'value';
  apply(name: string, values: any[], context: Context): any;
}

export interface CheckedOperator extends BaseOperator {
  type: 'checked';
  apply(name: string, values: any[], context: Context): any;
  checkArg: (name: string, num: number, last: number, value: any, context: Context, expr: ValueOrExpr) => CheckResult;
  extend?: true;
}

export interface AggregateOperator extends BaseOperator {
  type: 'aggregate';
  apply(name: string, values: any[], args: ValueOrExpr[], context: Context): any;
  extend?: true;
  value?: true;
}

export type CheckResult = 'continue'|{ result: any }|{ skip: number, value?: any };

export interface Group<R = any> {
  grouped: number;
  group: string;
  value: R;
  all: R[];
  level: number;
}

// eval
export function safeGet(root: Context, path: string|Keypath): any {
  if (!path) return root.value;
  const p = typeof path === 'string' ? parsePath(path) : path;

  if ('error' in p) return;
  else if ('k' in p) {
    let parts = p.k;
    const prefix = p.p;
    let idx = 0;
    let ctx = root;
    let o: any = root.value;

    for (let i = 0; i < p.u; i++) ctx && (ctx = ctx.parent);
    o = ctx ? ctx.value : undefined;

    if (prefix) {
      if (prefix === '!') o = root.root.parameters;
      else if (prefix === '~') o = root.root.value;
      else if (prefix === '*') {
        o = root.root.sources[parts[idx++] as string];
        if (o && idx < parts.length + 1 && parts[idx] !== 'value') o = o.value;
      } else if (prefix === '@') {
        const which = parts[idx++] as string;
        if (which !== 'value') {
          while (ctx && (!ctx.special || !(which in ctx.special))) ctx = ctx.parent;
          o = ctx && ctx.special[which];

          if (o && which === 'source' && parts[idx] !== undefined && parts[idx] !== 'value' && o.value) o = o.value;
          if (!o && which === 'date') o = root.root.special.date = new Date();
        }
      }
    } else {
      const first = parts[0];
      if (first === '_') idx++;
      else if (typeof first === 'string') {
        let lctx = ctx;
        while (lctx && (!lctx.locals || !(first in lctx.locals))) lctx = lctx.parent;
        if (lctx && first in lctx.locals) {
          o = lctx.locals[first];
          idx++;
        }
      }
    }

    for (let i = idx; i < parts.length; i++) {
      const part = parts[i];
      if (typeof part !== 'object') o = o && o[part];
      else {
        const v = evalValue(root, part);
        o = o && o[v];
      }
      if (o === null || o === undefined) return;
    }

    return o;
  }
}

export function safeSet(root: Context, path: string|Keypath, value: any, islet?: boolean) {
  if (!path) return;
  const p = typeof path === 'string' ? (islet ? parseLetPath(path) : parsePath(path)) : path;

  if ('error' in p) return;
  else if ('k' in p) {
    let parts = p.k;
    const prefix = p.p;
    let ctx = root;
    let o: any = root.value;

    for (let i = 0; i < p.u; i++) ctx && (ctx = ctx.parent);
    o = ctx ? ctx.value : undefined;

    const keys = parts.map(p => typeof p !== 'object' ? p : evalValue(root, p));

    if (islet) {
      o = root.locals || (root.locals = {});
    } else if (prefix) {
      if (prefix === '~') o = root.root.value;
      else return;
    }

    if (!islet) {
      const first = keys[0];
      while (ctx) {
        if (ctx.locals && first in ctx.locals) break;
        ctx = ctx.parent;
      }
      if (ctx) o = ctx.locals;
    }

    const last = keys.length - 1;
    for (let i = 0; i < last; i++) {
      if (typeof o !== 'object' && typeof o !== 'function' || !o) return;
      const key = keys[i];
      const next = keys[i + 1];
      if (!(key in o) || o[key] == null) o[key] = typeof next === 'number' ? [] : {};
      o = o[key];
    }
    
    if (o) o[keys[last]] = value;
  }
}

export function evaluate(value: ValueOrExpr): any;
export function evaluate(root: Context|{ context: Context }|any, value: ValueOrExpr): any;
export function evaluate(root: ValueOrExpr|Context|{ context: Context }|any, value?: ValueOrExpr): any {
  let r: Context;
  let e: ValueOrExpr;
  if (isValueOrExpr(root)) {
    r = new Root();
    e = root;
  } else if (isContext(root)) {
    r = root;
    !Array.isArray(value) && (e = value);
  } else if (root && 'context' in root && isContext(root.context)) {
    r = root.context;
    !Array.isArray(value) && (e = value);
  } else if (isValueOrExpr(value)) {
    r = new Root(root);
    e = value;
  } else {
    r = new Root();
    e = root;
  }
  return evalParse(r, e);
}

export function evalApplication(ctx: Context, value: ValueOrExpr, locals: any[]): any {
  if (typeof value === 'object' && 'a' in value) {
    if ('n' in value) {
      const map = value.n.reduce((a, c, i) => (a[c] = locals[i], a), {} as ParameterMap);
      return evalValue(extend(ctx, { value: locals[0], locals: map }), value.a);
    } else {
      return evalValue(extend(ctx, { value: locals[0] }), value.a);
    }
  } else {
    return evalParse(extend(ctx, { value: locals[0] }), value);
  }
}

export function evalParse(ctx: Context, expr: ValueOrExpr): any {
  if (typeof expr === 'string') expr = ctx.root.exprs[expr] || (ctx.root.exprs[expr] = (ctx.parser || parse)(expr));
  if (typeof expr !== 'object') expr = { v: expr };
  return evalValue(ctx, expr);
}

export function evalValue(ctx: Context, expr: Value): any {
  if (expr && 'r' in expr) return safeGet(ctx, expr.r);
  else if (expr && 'v' in expr) return expr.v;
  else if (expr && 'op' in expr) return applyOperator(ctx, expr);
  else if (expr && 'a' in expr) return expr.a;
  else if (expr && isDateRel(expr)) return expr;
}

const opMap: { [key: string]: Operator } = {};
export function registerOperator(...ops: Operator[]) {
  for (const op of ops) {
    for (const name of op.names) opMap[name] = op;
  }
}
export function unregisterOperator(...ops: Operator[]) {
  for (const op of ops) {
    for (const name of op.names) delete opMap[name];
  }
}
export function getOperatorMap(): { [key: string]: Operator } {
  return Object.assign({}, opMap);
}

function mungeSort(context: Context, sorts: Sort[]|ValueOrExpr): Sort[] {
  let sortArr: Sort[];
  
  if (Array.isArray(sorts)) {
    sortArr = sorts;
  } else {
    const s = evalParse(context, sorts);
    if (Array.isArray(s)) sortArr = s;
    else if (typeof s === 'string') sortArr = [{ v: s }];
  }

  if (sortArr) {
    for (let i = 0; i < sortArr.length; i++) {
      const by = sortArr[i];
      if (typeof by === 'string') {
        if (by[0] === '-') sortArr[i] = { by: by.substr(1), desc: true };
        else sortArr[i] = { by: by[0] === '+' ? by.substr(1) : by };
      }
    }
  }

  return sortArr;
}

export function filter(ds: DataSet, filter?: ValueOrExpr, sorts?: Sort[]|ValueOrExpr, groups?: Array<ValueOrExpr>|ValueOrExpr, context?: Context): DataSet {
  if (!ds || !Array.isArray(ds.value)) return ds;
  if (!context) context = new Root(ds.value, { special: { source: ds } });
  else context = extend(context, { special: { source: ds.value } });
  const values = filter ? [] : ds.value.slice();

  if (filter) {
    let flt: Value = typeof filter === 'string' ? parse(filter) : filter;
    if ('m' in flt) flt = { v: true };
    ds.value.forEach((row, index) => {
      if (!!evalParse(extend(context, { value: row, special: { value: row, index } }), flt)) values.push(row);
    });
  }

  const sortArr = mungeSort(context, sorts);  

  if (sortArr && sortArr.length) {
    const dirs: boolean[] = sortArr.map(s => {
      if (typeof s === 'object') {
        if ('by' in s) {
          if ('desc' in s) {
            if (typeof s.desc === 'boolean') return s.desc;
            return evalParse(context, s.desc);
          } else if ('dir' in s) {
            const lower = typeof s.dir === 'string' ? s.dir.toLowerCase() : s.dir;
            const dir = lower === 'asc' || lower === 'desc' ? lower : evalParse(context, s.dir);
            const val = typeof dir === 'string' ? dir.toLowerCase() : dir;
            if (val === 'desc') return true;
          }
        }
      }
      // default to asc
      return false;
    });

    values.sort((a, b) => {
      for (let i = 0; i < sortArr.length; i++) {
        const s = sortArr[i];
        const desc = dirs[i];
        const by: ValueOrExpr = typeof s === 'string' ? s : s && (s as any).by ? (s as any).by : s;
        const l = evalParse(extend(context, { value: a }), by);
        const r = evalParse(extend(context, { value: b }), by);
        const cmp = l == null && r != null ? -1 
          : l != null && r == null ? 1
          : (l < r) === (r < l) ? 0
          : l < r ? -1
          : l > r ? 1
          : 0;
        if (cmp) return (desc ? -1 : 1) * cmp;
      }
      return 0;
    });
  }

  if (!Array.isArray(groups)) groups = evalParse(context, groups);

  if (Array.isArray(groups) && groups.length) {
    return { value: { schema: ds.schema, grouped: groups.length, level: 0, value: group(values, groups, context, 1), all: values } };
  }

  return { schema: ds.schema, value: values };
}

interface GroupCache {
  [group: string]: any[];
}

function group(arr: any[], groups: Array<ValueOrExpr>, ctx: Context, level: number = 0): Group[] {
  const cache: GroupCache = {};
  const res: Group[] = [];
  const order: string[] = [];
  for (const e of arr) {
    const g = `${evalParse(extend(ctx, { value: e }), groups[0])}`;
    if (!cache[g]) {
      order.push(g);
      cache[g] = [];
    }
    cache[g].push(e);
  }

  for (const k of order) {
    res.push({ group: k, grouped: groups.length - 1, value: groups.length > 1 ? group(cache[k], groups.slice(1), ctx, level + 1) : cache[k], all: cache[k], level });
  }

  return res;
}

function applyOperator(root: Context, operation: Operation): any {
  const op = opMap[operation.op];
  // if the operator doesn't exist, skip
  if (!op) return true;

  let args: any[];
  if (op.type === 'checked') {
    args = [];
    const flts = operation.args || [];
    const ctx = op.extend ? extend(root, {}) : root;
    for (let i = 0; i < flts.length; i++) {
      const a = flts[i];
      const arg = evalParse(ctx, a);
      const res = op.checkArg(operation.op, i, flts.length - 1, arg, ctx, a);
      if (res === 'continue') args.push(arg);
      else if ('skip' in res) {
        i += res.skip;
        if ('value' in res) args.push(res.value);
      } else if ('result' in res) return res.result;
    }

    return op.apply(operation.op, args, ctx);
  } else if (op.type === 'value') {
    args = (operation.args || []).map(a => evalParse(root, a));
    return op.apply(operation.op, args, root);
  } else {
    let arr: any[];
    const ctx = op.extend ? extend(root, {}) : root;
    const args = (operation.args || []).slice();
    let arg: any;
    if (!op.value) {
      arg = evalParse(ctx, args[0]);
      if (Array.isArray(arg)) {
        args.shift();
        arr = arg;
      } else if (typeof arg === 'object' && 'value' in arg && Array.isArray(arg.value)) {
        args.shift();
        arr = arg.value;
      }
      if (!arr) {
        const src = evalValue(ctx, { r: '@source' });
        if (Array.isArray(src)) arr = src;
        else if (typeof src === 'object' && 'value' in src && Array.isArray(src.value)) arr = src.values;
        else arr = [];
      }
    }
    return op.apply(operation.op, Array.isArray(arr) ? arr : [], args, ctx);
  }
}

export interface Keypath {
  u?: number;
  p?: '!'|'~'|'*'|'@';
  k: Array<string|number|Value>;
}

export function isKeypath(v: any): v is string|Keypath {
  return typeof v === 'string' || (typeof v === 'object' && Array.isArray(v.k));
}

export interface Reference { r: string|Keypath };
export interface Application { a: Value; n?: string[]; };
export interface Literal { v: any };

/** A timespan specified in milliseconds */
export interface DateRelSpanMS {
  /** Starting point (now) */
  f: 'n';
  /** Offset in ms */
  o: number;
  /** Timezone offset */
  z?: number;
}
/** A timespan specified in individual units years, months, days, hours, minutes, seconds, and/or milliseconds */
export interface DateRelSpanFull {
  /** Starting point (now) */
  f: 'n';
  /** Offset array [years, months, days, hours, minutes, seconds, milliseconds] */
  o: [number?, number?, number?, number?, number?, number?, number?];
  /** Offset direction is before starting point */
  d?: -1;
  /** Timezone offset */
  z?: number;
}
export type DateRelSpan = DateRelSpanMS | DateRelSpanFull;

/** A date span covering last|this|next day|week|month|year */
export interface DateRelRange {
  /** Starting point (d: day, w: week, m: month, y: year) */
  f: 'd'|'w'|'m'|'y';
  /** Offset in units (-1: last, 0: this, 1: next) */
  o: -1|0|1;
  /** Anchor to the end for non-range usage */
  e?: 1;
  /** Timezone offset */
  z?: number;
}
/** A date span by time relative to yesterday, today, or tomorrow */
export interface DateRelTimeRange {
  /** Starting point (day) */
  f: 'd';
  /** Offset in units (-1: yesterday, 0: today, 1: tomorrow) */
  o: -1|0|1;
  /** Time array [hour, minute, second, millisecond, timezone offset] */
  t: [number, number?, number?, number?, number?];
  /** Anchor to the end for non-range usage */
  e?: 1;
}
/** A date span covering this year, month, or week to the current date */
export interface DateRelToDate {
  /** Starting point */
  f: 'w'|'m'|'y';
  /** Offset */
  o: 0;
  /** Relative to current date */
  d: 1;
  /** Anchor to the end for non-range usage */
  e?: 1;
  /** Timezone offset */
  z?: number;
}
/** A date range covering a specific range in time at most a year, optionally more specific by scoping farther
 * down with a month, date, hour, minute, second, and millisecond. It may also specify a timezone. */
export interface DateExactRange {
  /** Starting point [year, month, date, hour, minute, second, millisecond, timezone] */
  f: [number, number?, number?, number?, number?, number?, number?, number?];
  /** Anchor to the end for non-range usage */
  e?: 1;
}
export type DateRel = Date | DateRelSpan | DateRelRange | DateRelTimeRange | DateRelToDate | DateExactRange;

export type TimeSpan = number|FullTimeSpan;
export interface FullTimeSpan {
  d: [number?, number?, number?, number?, number?, number?, number?];
}

export type ValueOrExpr = string|Value;
export type Value = Reference | Literal | Operation | Application | ParseError;

export function isValueOrExpr(o: any): o is ValueOrExpr {
  return typeof o === 'string' || isValue(o);
}

export function isValue(o: any): o is Value {
  return typeof o === 'object' && o && (
    ('r' in o && typeof o.r === 'string') ||
    ('op' in o && typeof o.op === 'string') ||
    ('v' in o) ||
    ('a' in o)
  );
}

export type Parameter<T = any> = ParameterBase & T;
export interface ParameterBase {
  name: string;
  type?: Type;
  required?: boolean;
}

export interface ParameterMap {
  [name: string]: any;
}

export function isContext(v: any): v is Context {
  return typeof v === 'object' && typeof v.path === 'string' && typeof v.root == 'object' && 'value' in v && (typeof v.parent === 'object' || v.root === v);
}
export interface Context {
  path: string;
  root: RootContext;
  parent?: Context;
  special?: ParameterMap;
  locals?: ParameterMap;
  value: any;
  parser?: (txt: string) => Value;
}

export interface RootContext extends Context {
  parameters: ParameterMap;
  sources: SourceMap;
  parent: undefined;
  exprs: { [key: string]: Value };
}

export class Root implements RootContext {
  value: any;
  root: RootContext = this;
  parameters: ParameterMap = {};
  sources: SourceMap = {};
  special: ParameterMap = {};
  parent: undefined;
  exprs = {};
  parser?: (txt: string) => Value;
  path: '' = '';

  constructor(root: any = {}, opts?: ExtendOptions & { parameters?: ParameterMap }) {
    this.value = root;
    if (opts) {
      Object.assign(this.parameters, opts.parameters);
      Object.assign(this.special, opts.special);
      if (opts.parser) this.parser = opts.parser;
    }
  }
}

export function join(context: Context, path: string): Context {
  return {
    parent: context,
    root: context.root,
    path: context.path ? `${context.path}.${path}` : path,
    value: safeGet(context, path)
  };
}

export interface ExtendOptions {
  value?: any;
  special?: any;
  locals?: ParameterMap,
  parser?: (txt: string) => Value;
}

export function extend(context: Context, opts: ExtendOptions): Context {
  return {
    parent: context,
    root: context.root,
    path: '',
    value: 'value' in opts ? opts.value : context.value,
    special: opts.special || {},
    parser: opts.parser,
    locals: opts.locals,
  };
}

export const formats: { [name: string]: (value: any, args?: any[]) => string } = {};
export function registerFormat<T = any>(name: string, format: (value: T, args?: any[]) => string) {
  formats[name] = format;
}
export function unregisterFormat(name: string) {
  delete formats[name];
}

export function dateRelToRange(rel: DateRel): [Date, Date] {
  if (rel instanceof Date) return [rel, rel];

  let from = new Date();
  let to: Date = 'd' in rel && rel.d ? new Date() : undefined;
  from.setHours(0, 0, 0, 0);
  let tz: number = 'z' in rel && rel.z != null ? rel.z : null;

  if (rel.f === 'n') {
    from = typeof rel.o === 'number' ? new Date(+new Date() + rel.o) : dateAndTimespan(new Date(), { d: rel.o }, 'd' in rel ? rel.d : 1);
    to = from;
  } else if (rel.f === 'd') {
    from.setDate(from.getDate() + rel.o);
    if (!to) to = new Date(from);
    if ('t' in rel) {
      const t = rel.t;
      from.setHours(t[0], t[1] || 0, t[2] || 0, t[3] || 0);
      to.setHours(t[0], t[1] == null ? 59 : t[1], t[2] == null ? 59 : t[2], t[3] == null ? 999 : t[3]);
      if (t[4] != null) tz = t[4];
    }
  } else if (rel.f === 'w') {
    from.setDate(from.getDate() - (from.getDay() + (rel.o === -1 ? 7 : rel.o === 1 ? -7 : 0)));
    if (!to) {
      to = new Date(from);
      to.setDate(from.getDate() + 6);
    }
    if ('z' in rel && rel.z != null) tz = rel.z;
  } else if (rel.f === 'm') {
    from.setDate(1);
    from.setMonth(from.getMonth() + rel.o);
    if (!to) {
      to = new Date(from);
      to.setMonth(from.getMonth() + 1);
      to.setDate(0);
    }
  } else if (rel.f === 'y') {
    from.setDate(1);
    from.setMonth(0);
    from.setDate(1);
    if (!to) {
      to = new Date(from);
      to.setFullYear(from.getFullYear() + 1);
      to.setDate(0);
    }
  } else if (Array.isArray(rel.f)) {
    const v = rel.f.slice();
    from = new Date(v[0], v[1] || 0, v[2] || 1, v[3] || 0, v[4] || 0, v[5] || 0, v[6] || 0);
    for (let i = 1; i < 7; i++) {
      if (v[i] == null) {
        v[i - 1]++;
        break;
      }
    }
    if (v[6] != null) v[6]++;
    to = new Date(v[0], v[1] || 0, v[2] || 1, v[3] || 0, v[4] || 0, v[5] || 0, v[6] || 0);
    to.setMilliseconds(to.getMilliseconds() - 1);
    if (v[7] != null) tz = v[7];
  }

  if (rel.f === 'd' || rel.f === 'w' || rel.f === 'm' || rel.f === 'y') to.setHours(23, 59, 59, 999);

  if (tz != null) {
    const offset = tz + from.getTimezoneOffset();
    from.setMinutes(from.getMinutes() + offset);
    if (from !== to) to.setMinutes(to.getMinutes() + offset);
  }

  return [from, to];
}

export function isDateRel(v: any): v is DateRel {
  return typeof v === 'object' && (('f' in v && (Array.isArray(v.f) || 'o' in v)) || v instanceof Date);
}

export function dateRelToDate(rel: DateRel): Date {
  const range = dateRelToRange(rel);
  if ('e' in rel && rel.e != null) return range[1];
  else return range[0];
}

export function isTimespan(v: any): v is TimeSpan {
  return typeof v === 'number' || (typeof v === 'object' && Array.isArray(v.d));
}

export function addTimespan(l: TimeSpan, r: TimeSpan): TimeSpan {
  if (typeof l === 'number' && typeof r === 'number') return l + r;
  else {
    const res: TimeSpan = { d: [] };
    if (typeof l === 'number') res.d[6] = l;
    else for (let i = 0; i < 7; i++) if (l.d[i]) res.d[i] = l.d[i];

    if (typeof r === 'number') res.d[6] = (res.d[6] || 0) + r;
    else for (let i = 0; i < 7; i++) if (r.d[i]) res.d[i] = (res.d[i] || 0) + r.d[i];
    return res;
  }
}

export function subtractTimespan(l: TimeSpan, r: TimeSpan): TimeSpan {
  if (typeof l === 'number' && typeof r === 'number') return l - r;
  else {
    if (typeof l === 'number') {
      const res = ({ d: (r as FullTimeSpan).d.slice() }) as FullTimeSpan;
      for (let i = 0; i < 7; i++) if (res.d[i]) res.d[i] = 0 - res.d[i];
      res.d[6] = (res.d[6] || 0) + l;
      return res;
    } else if (typeof r === 'number') {
      const res = ({ d: (l as FullTimeSpan).d.slice() }) as FullTimeSpan;
      res.d[6] = (res.d[6] || 0) - r;
      return res;
    } else {
      const res = ({ d: (l as FullTimeSpan).d.slice() }) as FullTimeSpan;
      for (let i = 0; i < 7; i++) if (r.d[i]) l.d[i] = (l.d[i] || 0) - r.d[i];
      return res;
    }
  }
}

export function dateAndTimespan(l: Date, r: TimeSpan, m: 1|-1): Date {
  if (typeof r === 'number') return new Date(+l + r * m);
  else {
    let d = new Date(l);
    if (r.d[0]) d.setFullYear(d.getFullYear() + r.d[0] * m);
    if (r.d[1]) d.setMonth(d.getMonth() + r.d[1] * m);
    if (r.d[2]) d.setDate(d.getDate() + r.d[2] * m);
    if (r.d[3]) d.setHours(d.getHours() + r.d[3] * m);
    if (r.d[4]) d.setMinutes(d.getMinutes() + r.d[4] * m);
    if (r.d[5]) d.setSeconds(d.getSeconds() + r.d[5] * m);
    if (r.d[6]) d.setMilliseconds(d.getMilliseconds() + r.d[6] * m);
    return d;
  }
}

export function timeSpanToNumber(v: TimeSpan): number {
  if (typeof v === 'number') return v;
  else return ((((((((((((v.d[0] || 0) * 12) + (v.d[1] || 0)) * 30.45) + (v.d[2] || 0)) * 24) + (v.d[3] || 0)) * 60) + (v.d[4] || 0)) * 60) + (v.d[5] || 0)) * 1000) + (v.d[6] || 0);
}
