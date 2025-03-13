import { parse, parsePath, parseLetPath, isTimespanMS } from './parse';
import { parse as parseTemplate } from './parse/template';
import { ParseError } from 'sprunge/lib';

export interface TypeMap {
  [name: string]: Schema;
}

// Data
export interface Schema {
  /** An optional type for the value */
  type?: Type;
  /** Child fields belonging to the field */
  fields?: Field[];
  /** Types of unnamed fields in object prototypes */
  rest?: Schema;
  /** Types of tuple or union */
  types?: Schema[];
  /** Literal value of field */
  literal?: string|number|boolean|undefined|null;
  /** Addition validators on the value */
  checks?: ValueOrExpr[];
  /** An optional map of named types */
  defs?: TypeMap;
  /** If the type is 'any', this may be a name in a type map */
  ref?: string;
  /** Additional comments about the type */
  desc?: string[];
}

export interface DataSource<T = any, R = any> {
  schema?: Schema;
  values(parms?: T): Promise<DataSet<R>>;
}

export interface DataSet<R = any> {
  schema?: Schema;
  value: R;
}

export function toDataSet(value: any): DataSet {
  if (Array.isArray(value)) return { value };
  if (value && typeof value === 'object') {
    for (const k in value) if (k !== 'schema' && k !== 'value') return { value };
    return value;
  }
  return { value };
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

export type ValueType = 'string'|'number'|'boolean'|'date'|'object'|'literal';
export type ArrayType = 'string[]'|'number[]'|'boolean[]'|'date[]'|'object[]'|'tuple[]'|'union[]';
export type Type = ValueType|ArrayType|'value'|'array'|'union'|'tuple'|'any';

export interface Field extends Schema {
  /** The property name for the field */
  name: string;
  /** Whether this field is required */
  required?: true;
  /** A user-friendly name for the field */
  label?: string;
  /** Additional information for special use cases */
  meta?: any;
}

export interface Operation {
  op: string;
  args?: ValueOrExpr[];
  c?: string[];
  opts?: ValueOrExpr;
  meta?: any;
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

export interface OperatorOptions {
  [key: string]: any;
  // this is a dirty hack to make ts acknowledge that this isn't just any old object
  __options: 1;
}

export interface BaseOperator {
  names: string[];
}
export interface ValueOperator extends BaseOperator {
  type: 'value';
  apply(name: string, values: any[], opts: OperatorOptions, context: Context): any;
}

export interface CheckedOperator extends BaseOperator {
  type: 'checked';
  apply(name: string, values: any[], opts: OperatorOptions, context: Context): any;
  checkArg: (name: string, num: number, last: number, value: any, opts: OperatorOptions, context: Context, expr: ValueOrExpr) => CheckResult;
  extend?: true;
}

export interface AggregateOperator extends BaseOperator {
  type: 'aggregate';
  apply(name: string, values: any[], args: ValueOrExpr[], opts: OperatorOptions, context: Context): any;
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
export function getKeypath(ref: Reference): Keypath {
  if (typeof ref.r === 'object') return ref.r;
  const path = parsePath(ref.r);
  if ('k' in path) return path;
  else return { k: [] };
}

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
        if (which === 'locals' || which === 'specials') {
          const key = which === 'locals' ? which : 'special';
          while (ctx) {
            if (ctx[key]) break;
            ctx = ctx.parent;
          }
          if (ctx) o = ctx[key];
        } else if (which === 'local' || which === 'special') {
          const key = which === 'local' ? 'locals' : which;
          o = ctx[key] || (ctx[key] = {});
        } else if (which === 'parameters' || which === 'sources') {
          o = root.root[which];
        } else if (which !== 'value') {
          while (ctx && (!ctx.special || !(which in ctx.special))) ctx = ctx.parent;
          o = ctx && ctx.special[which];

          if (o && which === 'source' && parts[idx] !== undefined && parts[idx] !== 'value' && o.value) o = o.value;
          if (!o && which === 'date') o = root.root.special.date = new Date();
        }
      }
    } else {
      const first = parts[0];
      if (first === '_') {
        if (ctx.special && ctx.special.pipe) o = ctx.special.pipe;
        idx++;
      } else if (typeof first === 'string') {
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
      const v = typeof part !== 'object' ? part : evalValue(root, part);
      if (Array.isArray(o) && typeof v === 'number' && v < 0) o = o[o.length + v];
      else o = o && o[v];
      if (o === null || o === undefined) return;
    }

    return o;
  }
}

export function safeSet(root: Context, path: string|Keypath, value: any, islet?: boolean): any {
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
    
    if (o) {
      const cur = o[keys[last]];
      o[keys[last]] = value;
      return cur;
    }
  }
}

export function evaluate(value: ValueOrExpr): any;
export function evaluate(root: Context|{ context: Context }|any, value: ValueOrExpr): any;
export function evaluate(root: ValueOrExpr|Context|{ context: Context }|any, value?: ValueOrExpr): any {
  let r: Context;
  let e: ValueOrExpr;
  if (!value && isValueOrExpr(root)) {
    r = new Root();
    e = root;
  } else if (isContext(root)) {
    r = root;
    !Array.isArray(value) && (e = value);
  } else if (root && typeof root === 'object' && 'context' in root && isContext(root.context)) {
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

export function template(template: string): string;
export function template(root: Context|{ context: Context }|any, template: string): string;
export function template(root: string|Context|{ context: Context }|any, template?: string): string {
  let r: Context;
  let t: string;
  if (typeof root === 'string') {
    r = new Root();
    t = root;
  } else if (isContext(root)) {
    r = root;
    t = template || '';
  } else if (root && typeof root === 'object' && 'context' in root && isContext(root.context)) {
    r = root.context;
    t = template || '';
  } else if (root && typeof root !== 'string') {
    r = new Root(root);
    t = template || '';
  } else {
    r = new Root();
    t = root;
  }
  r = extend(r, { parser: parseTemplate });
  return evalParse(r, t);
}

/**
 * Evaluate an applicative with the given locals, naming them if the applicative declares named arguments.
 * If swap is not true, then a new context extension will be used. Otherwise, the context locals will be
 * swapped for the evaluation and replaced afterwards. Swap should only be used for applications that are
 * passing the context value as the first local.
 */
export function evalApply(ctx: Context, value: ValueOrExpr, locals: any[], special?: object): any {
  if (isApplication(value)) {
    const c = extend(ctx, { value: locals[0], special, fork: !ctx.locals });
    let res: any;
    if ('n' in value) {
      const map = value.n.reduce((a, c, i) => (a[c] = locals[i], a), {} as ParameterMap);
      c.locals = map;
    }
    res = evalValue(c, value.a);
    return res;
  } else {
    const v = evalParse(extend(ctx, { value: locals[0], special, fork: !ctx.locals }), value);
    if (isApplication(v)) return evalApply(ctx, v, locals, special);
    else return v;
  }
}

export function evalParse(ctx: Context, expr: ValueOrExpr): any {
  if (typeof expr === 'string') {
    const p = ctx.parser || parse;
    const ns = p.namespace || 'unknown';
    const cache = ctx.root.exprs[ns] || (ctx.root.exprs[ns] = {});
    expr = cache[expr] || (cache[expr] = p(expr));
  }
  if (typeof expr !== 'object') expr = { v: expr };
  return evalValue(ctx, expr);
}

export function evalValue(ctx: Context, expr: Value): any {
  if (!expr) return expr;
  if ('r' in expr) return safeGet(ctx, expr.r);
  else if ('v' in expr) return expr.v;
  else if ('op' in expr) return applyOperator(ctx, expr);
  else if (isApplication(expr)) return expr;
  else if (isDateRel(expr) || isTimespan(expr)) return expr;
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
export function getOperator<T extends Operator = Operator>(name: string): T {
  return opMap[name] as T;
}

const _defaultGetValue = (c: Context, b: ValueOrExpr, v: any) => evalApply(c, b, [v]);
export function sort(context: Context, arr: any[], sorts: Sort[]|ValueOrExpr, getValue?: (context: Context, by: ValueOrExpr, v: any) => any): any[] {
  let sortArr: Sort[];
  
  if (Array.isArray(sorts)) {
    sortArr = sorts;
  } else if (isApplication(sorts)) {
    sortArr = [sorts];
  } else if (typeof sorts === 'object' && sorts && 'by' in sorts) {
    sortArr = [sorts];
  } else {
    const s = evalParse(context, sorts);
    if (Array.isArray(s)) sortArr = s;
    else if (typeof s === 'string') sortArr = [{ v: s }];
    else if (typeof sorts === 'string') sortArr = [sorts]
  }

  if (sortArr) {
    let el: any;
    for (let i = 0; i < sortArr.length; i++) {
      el = sortArr[i];
      const by = isLiteral(el) ? el.v : el;
      if (typeof by === 'string') {
        if (by[0] === '-') sortArr[i] = { by: by.slice(1), desc: true };
        else sortArr[i] = { by: by[0] === '+' ? by.slice(1) : by, desc: false };
      }
    }
  }

  getValue = getValue || _defaultGetValue;
  if (sortArr && sortArr.length) {
    const dirs = sortArr.map(s => {
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

    arr.sort((a, b) => {
      for (let i = 0; i < sortArr.length; i++) {
        const s = sortArr[i];
        const desc = dirs[i];
        const by: ValueOrExpr = typeof s === 'string' ? s : s && (s as any).by ? (s as any).by : s;
        const l = getValue(context, by, a);
        const r = getValue(context, by, b);
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

  return arr;
}

export function filter(arr: any[], filter?: ValueOrExpr, sorts?: Sort[]|ValueOrExpr, groups?: Array<ValueOrExpr>|ValueOrExpr, context?: Context|any): any[];
export function filter(ds: DataSet, filter?: ValueOrExpr, sorts?: Sort[]|ValueOrExpr, groups?: Array<ValueOrExpr>|ValueOrExpr, context?: Context|any): DataSet;
export function filter(ds: DataSet|any[], filter?: ValueOrExpr, sorts?: Sort[]|ValueOrExpr, groups?: Array<ValueOrExpr>|ValueOrExpr, context?: Context|any): DataSet|any[] {
  const _ds = Array.isArray(ds) ? { value: ds } : ds;
  if (!_ds || !Array.isArray(_ds.value)) return _ds;
  let _context: Context;
  if (!context) _context = new Root(_ds.value, { special: { source: _ds } });
  else if (isContext(context)) _context = extend(context, { special: { source: _ds.value } });
  else _context = new Root(context);
  const values = filter ? [] : _ds.value.slice();

  if (filter) {
    let flt: Value = typeof filter === 'string' ? parse(filter) : filter;
    if ('m' in flt) flt = { v: true };
    _ds.value.forEach((row, index) => {
      if (!!evalApply(extend(_context, { value: row, special: { value: row, index } }), flt, [row, index])) values.push(row);
    });
  }

  if (sorts) sort(_context, values, sorts);

  if (groups && !Array.isArray(groups)) groups = [groups];

  if (Array.isArray(groups) && groups.length) {
    return { value: { schema: _ds.schema, grouped: groups.length, level: 0, value: group(values, groups, _context, 1), all: values } };
  }

  if (Array.isArray(ds)) return values;
  else return { schema: _ds.schema, value: values };
}

interface GroupCache {
  [group: string]: any[];
}

function group(arr: any[], groups: Array<ValueOrExpr>, ctx: Context, level: number = 0): Group[] {
  const cache: GroupCache = {};
  const res: Group[] = [];
  const order: string[] = [];
  for (const e of arr) {
    const g = isApplication(groups[0]) ? `${evalApply(ctx, groups[0], [e])}` : `${evalParse(extend(ctx, { value: e }), groups[0])}`;
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

function hasPipeRef(ref: Reference): boolean {
  const path = getKeypath(ref);
  return path.k[0] === '_' || path.p === '@' && path.k[0] === 'pipe';
}

export function applyOperator(root: Context, operation: Operation): any {
  const op = opMap[operation.op];

  // if the operator doesn't exist, try a local, pipe, or skip
  if (!op) {
    const local = safeGet(root, operation.op) || safeGet(root.root, operation.op);
    if (isApplication(local)) {
      return evalApply(root, local, (operation.args || []).map(a => evalParse(root, a)));
    } else if (operation.op === 'pipe') { // handle the special built-in pipe operator
      if (!operation.args || !operation.args.length) return true;
      let v = evalParse(root, operation.args[0]);
      for (let i = 1; i < operation.args.length; i++) {
        let a = operation.args[i];
        if (isOperation(a) && (!a.args || !a.args.find(a => isReference(a) && hasPipeRef(a)))) a = Object.assign({}, a, { args: [{ r: { k: ['pipe'], p: '@' } } as ValueOrExpr].concat(a.args || []) });
        
        if (isApplication(a)) v = evalApply(root, a, [v]);
        else v = evalParse(extend(root, { special: { pipe: v } }), a);
      }
      return v;
    }
    return true;
  }

  let args: any[];
  if (op.type === 'checked') {
    args = [];
    const flts = operation.args || [];
    const ctx = op.extend ? extend(root, {}) : root;
    const opts = operation.opts ? evalParse(ctx, operation.opts) : undefined;
    for (let i = 0; i < flts.length; i++) {
      const a = flts[i];
      const arg = evalParse(ctx, a);
      const res = op.checkArg(operation.op, i, flts.length - 1, arg, opts, ctx, a);
      if (res === 'continue') args.push(arg);
      else if ('skip' in res) {
        i += res.skip;
        if ('value' in res) args.push(res.value);
      } else if ('result' in res) return res.result;
    }

    return op.apply(operation.op, args, opts, ctx);
  } else if (op.type === 'value') {
    args = (operation.args || []).map(a => evalParse(root, a));
    return op.apply(operation.op, args, operation.opts ? evalParse(root, operation.opts) : undefined, root);
  } else {
    let arr: any[];
    const ctx = op.extend ? extend(root, {}) : root;
    const args = (operation.args || []).slice();
    const opts = operation.opts ? evalParse(ctx, operation.opts) : undefined;
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
        else if (typeof src === 'object' && 'value' in src && Array.isArray(src.value)) arr = src.value;
        else arr = [];
      }
    }
    return op.apply(operation.op, Array.isArray(arr) ? arr : [], args, opts, ctx);
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

export function isLiteral(v: any): v is Literal {
  return typeof v === 'object' && 'v' in v;
}

export function isReference(v: any): v is Reference {
  return typeof v === 'object' && 'r' in v;
}

export function isOperation(v: any): v is Operation {
  return typeof v === 'object' && typeof v.op === 'string';
}

export interface Reference { r: string|Keypath; c?: string[] };
export interface Application { a: Value; n?: string[]; c?: string[] };
export interface Literal { v: any; s?: 1; c?: string[] };

export function isApplication(v: any): v is Application {
  if (typeof v !== 'object' || !('a' in v) || typeof v.a !== 'object') return false;
  const len = Object.keys(v).length;
  return len === 1 || len === 2 && 'n' in v;
}

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

export type TimeSpan = number|TimeSpanMS|FullTimeSpan;
export interface TimeSpanMS {
  ms: number;
}
export interface FullTimeSpan {
  s?: number;
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
    (isApplication(o))
  );
}

export type Parameter<T = any> = ParameterBase & T;
export interface ParameterBase {
  name: string;
  label?: string;
  type?: Type;
  required?: boolean;
  refine?: string;
  init?: ValueOrExpr;
  options?: Array<string|{ label: string; value: any }>;
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
  parser?: ((txt: string) => Value) & { namespace: string };
}

export interface RootContext extends Context {
  parameters: ParameterMap;
  sources: SourceMap;
  parent: undefined;
  exprs: { [ns: string]: { [key: string]: Value } };
  log: (...v: any[]) => void;
}

export class Root implements RootContext {
  value: any;
  root: RootContext = this;
  parameters: ParameterMap = {};
  sources: SourceMap = {};
  special: ParameterMap = {};
  parent: undefined;
  exprs = {} as { [ns: string]: { [key: string]: Value } };
  parser?: ((txt: string) => Value) & { namespace: string };
  path: '' = '';
  log(v: any[]) {
    console.log(...v);
  }

  constructor(root: any = {}, opts?: ExtendOptions & { parameters?: ParameterMap; log?: (...v: any[]) => void }) {
    this.value = root;
    if (opts) {
      Object.assign(this.parameters, opts.parameters);
      Object.assign(this.special, opts.special);
      if (opts.parser) this.parser = opts.parser;
      if (opts.log && typeof opts.log === 'function') this.log = opts.log;
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
  parser?: ((txt: string) => Value) & { namespace: string };
  path?: string;
  fork?: boolean;
}

export function extend(context: Context, opts: ExtendOptions): Context {
  return {
    parent: opts.fork ? (context.parent || context.root) : context,
    root: context.root,
    path: opts.path || '',
    value: 'value' in opts ? opts.value : context.value,
    special: opts.fork ? Object.assign({}, context.special, { pipe: undefined }, opts.special) : (opts.special || {}),
    parser: opts.parser,
    locals: opts.locals,
  };
}

export const formats: { [name: string]: { apply: (value: any, args?: any[], opts?: OperatorOptions) => string, defaults: { [key: string]: any } } } = {};
export const virtualFormats: { [name: string]: { defaults: { [key: string]: any } } } = {};
export function registerFormat<T = any>(name: string|string[], format: (value: T, args?: any[], opts?: OperatorOptions) => string, defaults: { [key: string]: any } = {}) {
  if (Array.isArray(name)) name.forEach(n => formats[n] = { apply: format, defaults });
  else formats[name] = { apply: format, defaults };
}
export function unregisterFormat(name: string) {
  delete formats[name];
}

export function dateRelToRange(rel: DateRel): [Date, Date] {
  if (rel instanceof Date) return [rel, rel];

  let from = new Date();
  let to: Date = 'd' in rel && rel.d ? new Date() : undefined;
  from.setUTCFullYear(from.getFullYear(), from.getMonth(), from.getDate());
  from.setUTCHours(0, 0, 0, 0);
  let tz: number = 'z' in rel && rel.z != null ? rel.z : null;

  if (rel.f === 'n') { // DateRelSpan (MS or Full)
    from = typeof rel.o === 'number' ? new Date(+new Date() + rel.o) : dateAndTimespan(new Date(), { d: rel.o }, 'd' in rel ? rel.d : 1);
    to = from;
    tz = undefined;
  } else if (rel.f === 'd') { // DateRelRange - day
    from.setUTCDate(from.getUTCDate() + rel.o);
    if (!to) to = new Date(from);
    if ('t' in rel) { // DateRelTimeRange
      const t = rel.t;
      from.setUTCHours(t[0], t[1] || 0, t[2] || 0, t[3] || 0);
      to.setUTCHours(t[0], t[1] == null ? 59 : t[1], t[2] == null ? 59 : t[2], t[3] == null ? 999 : t[3]);
      if (t[4] != null) tz = t[4];
    }
  } else if (rel.f === 'w') { // DateRelRange - week
    from.setUTCDate(from.getUTCDate() - (from.getUTCDay() + (rel.o === -1 ? 7 : rel.o === 1 ? -7 : 0)));
    if (!to) {
      to = new Date(from);
      to.setDate(from.getUTCDate() + 6);
    }
    if ('z' in rel && rel.z != null) tz = rel.z;
  } else if (rel.f === 'm') { // DateRelRange - month
    from.setUTCDate(1);
    from.setUTCMonth(from.getUTCMonth() + rel.o);
    if (!to) {
      to = new Date(from);
      to.setUTCMonth(from.getUTCMonth() + 1);
      to.setUTCDate(0);
    }
  } else if (rel.f === 'y') { // DateRelRange - year
    from.setUTCDate(1);
    from.setUTCMonth(0);
    from.setUTCDate(1);
    if (!to) {
      to = new Date(from);
      to.setUTCFullYear(from.getUTCFullYear() + 1);
      to.setUTCDate(0);
    }
  } else if (Array.isArray(rel.f)) { // DateExactRange
    const v = rel.f.slice();
    from = new Date(Date.UTC(v[0], v[1] || 0, v[2] || 1, v[3] || 0, v[4] || 0, v[5] || 0, v[6] || 0));
    for (let i = 1; i < 7; i++) {
      if (v[i] == null) {
        v[i - 1]++;
        break;
      }
    }
    if (v[6] != null) v[6]++;
    to = new Date(Date.UTC(v[0], v[1] || 0, v[2] || 1, v[3] || 0, v[4] || 0, v[5] || 0, v[6] || 0));
    to.setUTCMilliseconds(to.getUTCMilliseconds() - 1);
    if (v[7] != null) tz = v[7];
  }

  if (rel.f === 'd' || rel.f === 'w' || rel.f === 'm' || rel.f === 'y') to.setUTCHours(23, 59, 59, 999);

  if (tz !== undefined) {
    if (tz != null) {
      from.setUTCMinutes(from.getUTCMinutes() - tz);
      if (from !== to) to.setUTCMinutes(to.getUTCMinutes() - tz);
    } else { // shift to local time
      const offset = from.getTimezoneOffset();
      from.setUTCMinutes(from.getUTCMinutes() + offset);
      if (from !== to) to.setUTCMinutes(to.getUTCMinutes() + offset);
    }
  }

  return [from, to];
}

export function isDateRel(v: any): v is DateRel {
  return v && typeof v === 'object' && (('f' in v && (Array.isArray(v.f) || 'o' in v)) || v instanceof Date);
}

export function isDateExactRange(v: any): v is DateExactRange {
  return v && typeof v === 'object' && 'f' in v && Array.isArray(v.f);
}

export function dateRelToDate(rel: DateRel): Date {
  const range = dateRelToRange(rel);
  if ('e' in rel && rel.e != null) return range[1];
  else return range[0];
}

export function dateRelToExactRange(rel: DateRel): DateExactRange {
  if (!rel) return;
  if (isDateExactRange(rel)) return rel;
  const dt = dateRelToDate(rel);
  const offset = dt.getTimezoneOffset();
  const z = 'z' in rel && rel.z != null ? rel.z : 'f' in rel && rel.f === 'd' && 't' in rel && rel.t[4] != null ? rel.t[4] : null;
  if (rel instanceof Date && z != null) dt.setMinutes(dt.getMinutes() - (offset + z));
  return {
    f: [dt.getFullYear(), dt.getMonth(), dt.getDate(), dt.getHours(), dt.getMinutes(), dt.getSeconds(), dt.getMilliseconds(), z != null ? z : -offset],
  };
}

export function isTimespan(v: any): v is TimeSpan {
  return typeof v === 'number' || (typeof v === 'object' && Array.isArray(v.d)) || isTimespanMS(v);
}

export function addTimespan(l: TimeSpan, r: TimeSpan): TimeSpan {
  if (typeof l === 'number' && typeof r === 'number') return l + r;
  else {
    const res: TimeSpan = { d: [] };
    if (typeof l === 'number') res.d[6] = l;
    else if (isTimespanMS(l)) res.d[6] = l.ms;
    else for (let i = 0; i < 7; i++) if (l.d[i]) res.d[i] = l.d[i];

    if (typeof r === 'number') res.d[6] = (res.d[6] || 0) + r;
    else if (isTimespanMS(r)) res.d[6] = (res.d[6] || 0) + r.ms;
    else for (let i = 0; i < 7; i++) if (r.d[i]) res.d[i] = (res.d[i] || 0) + r.d[i];
    return res;
  }
}

export function subtractTimespan(l: TimeSpan, r: TimeSpan): TimeSpan {
  if (typeof l === 'number' && typeof r === 'number') return l - r;
  else {
    if (isTimespanMS(l)) l = l.ms;
    if (isTimespanMS(r)) r = r.ms;
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

export function datesDiff(l: Date, r: Date): FullTimeSpan {
  if (isNaN(+l) || isNaN(+r)) return { d: [] };
  if (r < l) {
    const s = r;
    r = l;
    l = s;
  }
  const a = new Date(l);
  const b = r;
  const res: FullTimeSpan = { d: [0, 0, 0, 0, 0, 0, 0], s: +a };
  let num = b.getFullYear() - a.getFullYear() - 1;
  let tmp1: number, tmp2: number;
  if (num > 0) {
    res.d[0] += num;
    a.setFullYear(b.getFullYear() - 1);
  }
  a.setFullYear(a.getFullYear() + 1);
  if (a > b) a.setFullYear(a.getFullYear() - 1);
  else res.d[0]++;

  // watch out for leap year
  if (l.getMonth() === 1 && l.getDate() === 29 && a.getMonth() !== 1) {
    a.setDate(29);
    a.setMonth(1);
  }

  // jumping months can make days get weird
  while (true) {
    num = a.getDate();
    tmp1 = a.getMonth();
    tmp2 = a.getFullYear();
    a.setDate(num + 1);
    if (a.getMonth() !== tmp1) {
      a.setDate(1);
      a.setFullYear(tmp2);
      a.setMonth(tmp1 + 2);
      a.setDate(0);
    } else {
      a.setDate(num);
      a.setMonth(tmp1 + 1);
      if (tmp1 === 11 ? a.getMonth() !== 0 : a.getMonth() !== tmp1 + 1) {
        a.setDate(1);
        a.setFullYear(tmp2);
        a.setMonth(tmp1 + 2);
        a.setDate(0);
      }
    }
    if (a > b) {
      // make sure we stay in the correct year
      a.setFullYear(tmp2);
      a.setDate(1);
      a.setMonth(tmp1);
      a.setDate(num);
      break;
    } else res.d[1]++;
  }

  while (true) {
    a.setDate(a.getDate() + 1);
    if (a > b) {
      a.setDate(a.getDate() - 1);
      break;
    } else res.d[2]++;
  }

  while (true) {
    a.setHours(a.getHours() + 1);
    if (a > b) {
      a.setHours(a.getHours() - 1);
      break;
    } else res.d[3]++;
  }

  while (true) {
    a.setMinutes(a.getMinutes() + 1);
    if (a > b) {
      a.setMinutes(a.getMinutes() - 1);
      break;
    } else res.d[4]++;
  }

  while (true) {
    a.setSeconds(a.getSeconds() + 1);
    if (a > b) {
      a.setSeconds(a.getSeconds() - 1);
      break;
    } else res.d[5]++;
  }

  if (a.getMilliseconds() <= b.getMilliseconds()) res.d[6] = b.getMilliseconds() - a.getMilliseconds();
  else res.d[6] = (1000 - a.getMilliseconds()) + b.getMilliseconds();

  return res;
}

export function dateAndTimespan(l: Date, r: TimeSpan, m: 1|-1): Date {
  if (typeof r === 'number') return new Date(+l + r * m);
  else if (isTimespanMS(r)) return new Date(+l + r.ms * m);
  else {
    let d = new Date(l);
    if (r.d[0]) d.setFullYear(d.getFullYear() + r.d[0] * m);
    if (r.d[1]) {
      const dd = d.getDate();
      d.setDate(1);
      d.setMonth(d.getMonth() + r.d[1] * m);
      const mm = d.getMonth();
      d.setDate(dd);
      if (mm !== d.getMonth()) d.setDate(0);
    }
    if (r.d[2]) d.setDate(d.getDate() + r.d[2] * m);
    if (r.d[3]) d.setHours(d.getHours() + r.d[3] * m);
    if (r.d[4]) d.setMinutes(d.getMinutes() + r.d[4] * m);
    if (r.d[5]) d.setSeconds(d.getSeconds() + r.d[5] * m);
    if (r.d[6]) d.setMilliseconds(d.getMilliseconds() + r.d[6] * m);
    return d;
  }
}
