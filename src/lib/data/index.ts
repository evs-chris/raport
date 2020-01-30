import { parse } from './expr';

// Data
export interface Schema {
  fields: Field[];
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
  name: string;
  value: Reference;
  type?: Type; // no type means any
  /** Nested object definition */
  fields?: Field[];
}

export type Operation = FunctionOperation|AggregateOperation;

export interface FunctionOperation {
  op: string;
  args: Value[];
}

export interface AggregateOperation {
  op: string;
  source?: Value;
  apply?: Value;
  args?: Value[];
  locals?: Value[];
}

export type Sort = ValueOrExpr|SortBy;
export interface SortBy {
  by: ValueOrExpr;
  desc?: ValueOrExpr|boolean;
}

type Operator<T = any> = AggregateOperator<T> | ValueOperator | CheckedOperator;

export interface BaseOperator {
  names: string[];
}
export interface ValueOperator extends BaseOperator {
  type: 'value';
  apply(name: string, values: any[], context?: Context): any;
}

export interface CheckedOperator extends BaseOperator {
  type: 'checked';
  apply(name: string, values: any[], context?: Context): any;
  checkArg: (name: string, num: number, last: number, value: any, context?: Context) => CheckResult;
}

export interface AggregateOperator<T = any> extends BaseOperator {
  type: 'aggregate';
  init(args?: any[]): T;
  apply(name: string, state: T, value: any, locals?: any[], context?: Context): any;
  final(state: T): any;
}

export type CheckResult = 'continue'|{ result: any }|{ skip: number };

export interface Group<R = any> {
  grouped: number;
  group: string;
  value: R;
  all: R[];
  level: number;
}

// eval
const splitPattern = /([^\\](?:\\\\)*)\./;
const escapePattern = /((?:\\)+)\1|\\(\.)/g;
export function safeGet(root: Context, path: string): any {
  if (!path) return root.value;

  let match: RegExpMatchArray;
  let idx: number;
  let ctx = root;
  let o: any = root.value;

  if (path[0] === '!') { // param
    path = path.substr(1);
    o = root.root.parameters;
  } else if (path[0] === '#') { // root
    path = path.substr(1);
    o = root.root.value;
  } else if (path[0] === '^') { // pop context
    while (path[0] === '^') {
      ctx && (ctx = ctx.parent);
      path = path.substr(1);
    }
    o = ctx ? ctx.value : undefined;
  } else if (path[0] === '+') {
    path = path.substr(1);
    o = root.root.sources;

    // grab the data source
    if (o && (match = splitPattern.exec(path))) {
      idx = match.index + match[1].length;
      o = o[path.substr(0, idx).replace(escapePattern, '$1$2')];
      path = path.substr(idx + 1);

      // if it's a subpath request, drill into the datasource
      if (o && path.length && o.value) o = o.value;
    }
  }

  if (path[0] === '@') { // special ref, which can follow pops
    path = path.substr(1);
    if (!path) {
      while (ctx && !ctx.special) ctx = ctx.parent;
      return ctx.special;
    } else {
      let first: string = path;

      match = splitPattern.exec(path);
      if (match) {
        idx = match.index + match[1].length;
        first = path.substr(0, idx).replace(escapePattern, '$1$2');
        path = path.substr(idx + 1);
      } else {
        path = '';
      }

      while (ctx && (!ctx.special || !(first in ctx.special))) ctx = ctx.parent;
      
      o = ctx && ctx.special && ctx.special[first];
      if (!o && first === 'date') {
        o = root.root.special.date = new Date();
      }
    }
  }

  while (o && (match = splitPattern.exec(path))) {
    idx = match.index + match[1].length;
    o = o[path.substr(0, idx).replace(escapePattern, '$1$2')];
    path = path.substr(idx + 1);
  }

  if (path) {
    o && (o = o[path.replace(escapePattern, '$1$2')]);
  }

  return o;
}

export function evaluate(value: ValueOrExpr): any;
export function evaluate(root: Context|{ context: Context }, value: ValueOrExpr): any;
export function evaluate(root: ValueOrExpr|Context|{ context: Context }, value?: ValueOrExpr): any {
  if (arguments.length === 1) {
    value = root as ValueOrExpr;
    root = new Root();
  }
  if (typeof root === 'object' && !('value' in root)) root = (root as { context: Context }).context;
  if (typeof value === 'string') value = (root as Context).root.exprs[value] || ((root as Context).root.exprs[value] = parse(value));
  if (value && 'r' in value) return safeGet(root as Context, value.r);
  else if (value && 'v' in value) return value.v;
  else if (value && 'op' in value) return applyOperator(root as Context, value);
}

const operators: Operator[] = [];
const opMap: { [key: string]: Operator } = {};
export function registerOperator<T = any>(...ops: Operator<T>[]) {
  for (const op of ops) {
    operators.push(op);
    for (const name of op.names) opMap[name] = op;
  }
}

function mungeSort(context: Context, sorts: Sort[]|ValueOrExpr): Sort[] {
  let sortArr: Sort[];
  
  if (Array.isArray(sorts)) {
    sortArr = sorts;
  } else {
    const s = evaluate(context, sorts);
    if (Array.isArray(s)) sortArr = s;
    else if (typeof s === 'string') sortArr = [{ v: s }];
  }

  if (sortArr) {
    for (let i = 0; i < sortArr.length; i++) {
      const by = sortArr[i];
      if (typeof by === 'string') {
        if (by[0] === '-') sortArr[i] = { by: by.substr(1), desc: true };
        else sortArr[i] = { by };
      }
    }
  }

  return sortArr;
}

export function filter(ds: DataSet, filter?: ValueOrExpr, sorts?: Sort[]|ValueOrExpr, groups?: Array<ValueOrExpr>|ValueOrExpr, context?: Context): DataSet {
  if (!ds || !Array.isArray(ds.value)) return ds;
  if (!context) context = new Root(ds.value);
  const values = filter ? [] : ds.value.slice();

  if (filter) {
    ds.value.forEach(row => {
      if (!!evaluate(extend(context, { value: row }), filter)) values.push(row);
    });
  }

  const sortArr = mungeSort(context, sorts);  

  if (sortArr && sortArr.length) {
    const dirs: boolean[] = sortArr.map(s => {
      if (typeof s === 'object') {
        if ('by' in s) {
          if (typeof s.desc === 'boolean') return s.desc;
          return evaluate(context, s.desc);
        }
      }
      return true;
    });

    values.sort((a, b) => {
      for (let i = 0; i < sortArr.length; i++) {
        const s = sortArr[i];
        const desc = dirs[i];
        const by: ValueOrExpr = typeof s === 'string' ? s : 'by' in s ? s.by : s;
        const l = evaluate(extend(context, { value: a }), by);
        const r = evaluate(extend(context, { value: b }), by);
        const cmp = l < r ? -1 : l > r ? 1 : 0;
        if (cmp !== 0) return (desc ? -1 : 1) * cmp;
      }
      return 0;
    });
  }

  if (!Array.isArray(groups)) groups = evaluate(context, groups);

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
    const g = `${evaluate(extend(ctx, { value: e }), groups[0])}`;
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

function applyOperator(root: Context, filter: Operation): any {
  const op = opMap[filter.op];
  let state: any;
  // if the operator doesn't exist, skip
  if (!op) return true;

  let args: any[];
  if (op.type === 'checked') {
    args = [];
    const flts = filter.args || [];
    for (let i = 0; i < flts.length; i++) {
      const a = flts[i];
      const arg = evaluate(root, a);
      const res = op.checkArg(filter.op, i, flts.length - 1, arg, root);
      if (res === 'continue') args.push(arg);
      else if ('skip' in res) {
        i += res.skip;
        for (let c = 0; c < res.skip; c++) args.push(undefined);
      } else if ('result' in res) return res.result;
    }
  } else if (op.type === 'value') {
    args = (filter.args || []).map(a => evaluate(root, a));
  } else {
    const agg = filter as AggregateOperation;
    let arr: any[] = evaluate(root, agg.source);
    let apply = agg.apply;

    if (!Array.isArray(arr)) {
      arr = evaluate(root, { r: '@source' });
      if (!Array.isArray(arr)) arr = [];
    }

    args = (agg.args || []).map(a => evaluate(root, a));
    state = op.init(args);

    arr.forEach(e => {
      const ctx = apply || agg.locals ? extend(root, { value: e }) : root;
      const locals: any[] = agg.locals ? agg.locals.map(e => evaluate(ctx, e)) : [];
      op.apply(agg.op, state, apply ? evaluate(extend(root, { value: e }), apply) : e, locals, root);
    });
  }

  if (op.type === 'checked' || op.type === 'value') return op.apply(filter.op, args, root);
  else return op.final(state);
}

export type Reference = { r: string };

export type ValueOrExpr = string|Value;
export type Value = Reference | Literal | Operation | ParseError;

export function isValueOrExpr(o: any): o is ValueOrExpr {
  return typeof o === 'string' || (typeof o === 'object' && o && (
    ('r' in o && typeof o.r === 'string') ||
    ('op' in o && typeof o.op === 'string') ||
    ('v' in o)
  ) );
}

export interface Literal {
  v: any;
}

export interface ParseError extends Literal {
  v: '';
  l: number;
  m: string;
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

export interface Context {
  path: string;
  root: RootContext;
  parent?: Context;
  special?: ParameterMap;
  value: any;
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
  path: '';

  constructor(root: any = {}, opts?: ExtendOptions & { parameters?: ParameterMap }) {
    this.value = root;
    if (opts) {
      Object.assign(this.parameters, opts.parameters);
      Object.assign(this.special, opts.special);
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
}

export function extend(context: Context, opts: ExtendOptions): Context {
  return {
    parent: context,
    root: context.root,
    path: '',
    value: 'value' in opts ? opts.value : context.value,
    special: opts.special || {}
  };
}

export const formats: { [name: string]: (value: any, args?: any[]) => string } = {};
export function registerFormat<T = any>(name: string, format: (value: T, args?: any[]) => string) {
  formats[name] = format;
}
