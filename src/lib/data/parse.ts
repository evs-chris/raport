import { parser as makeParser, Parser, bracket, opt, alt, seq, str, istr, map, read, chars, repsep, rep1sep, read1To, read1, skip1, rep, rep1, check, verify, name } from 'sprunge/lib';
import { ws, digits, JNum, JStringEscape, JStringUnicode, JStringHex } from 'sprunge/lib/json';
import { Value, DateRel, DateRelToDate, DateRelRange, DateRelSpan, DateExactRange, Literal, Keypath, TimeSpan } from './index';

export const timespans = {
  y: 0,
  m: 0,
  w: 0,
  d: 86400000,
  h: 3600000,
  mm: 60000,
  s: 1000,
};

timespans.w = timespans.d * 7;
timespans.y = Math.floor(timespans.d * 365.25);
timespans.m = Math.floor(timespans.d * 30.45);

const space = ' \r\n\t';
const endSym = space + '():{}[]';
export const endRef = endSym + ',"\'`\\;&#.';

export const rws = skip1(space);

export const keywords = map<string, any>(str('null', 'true', 'false', 'undefined'), v => {
  switch (v) {
    case 'null': return null;
    case 'true': return true;
    case 'false': return false;
    case 'undefined': return undefined;
  }
});

export const ident = read1To(endRef, true);

export const args: Parser<Value[]> = {};
export const array: Parser<Value> = {};
export const object: Parser<Value> = {};
export const value: Parser<Value> = {};
export const values: Parser<Value> = {};
export const tpl: Parser<Value> = {};

const escmap: { [k: string]: string } = { n: '\n', r: '\r', t: '\t', b: '\b' };
const pathesc = map(seq(str('\\'), chars(1)), ([, char]) => escmap[char] || char);
const pathident = map(rep1(alt('ref part', read1To(endRef + '=/', true), pathesc)), parts => parts.join(''));
const dotpath = map(seq(str('.'), pathident), ([, part]) => part);
const bracketpath = bracket(seq(str('['), ws), value, seq(ws, str(']')));
export const keypath = map(seq(alt<'!'|'~'|'*'|[string,string]>('ref sigil', str('!', '~', '*') as any, seq(read('^'), opt(str('@', '.')))), alt<string|Value>('keypath', pathident, bracketpath), rep(alt<string|Value>('keypath', dotpath, bracketpath))), ([prefix, init, parts]) => {
  const res: Keypath = { k: [init].concat(parts).map(p => typeof p === 'object' && 'v' in p && (typeof p.v === 'string' || typeof p.v === 'number') ? p.v : p) };
  if (Array.isArray(prefix)) {
    if (prefix[0]) res.u = prefix[0].length;
    if (prefix[1] === '@') res.p = '@';
  } else if (prefix) {
    res.p = prefix;
  }
  return res;
}, 'keypath');

export const parsePath = makeParser(keypath);

export const ref = map(keypath, r => ({ r }), 'reference');

function stringInterp(parts: Value[]): Value {
  const res = parts.reduce((a, c) => {
    if (a.length) {
      if ('v' in c && 'v' in a[a.length - 1] && typeof c.v === 'string' && typeof (a[a.length - 1] as Literal).v === 'string') (a[a.length - 1] as Literal).v += c.v;
      else a.push(c);
    } else {
      a.push(c);
    }
    return a;
  }, [] as Value[]);

  if (res.length > 0 && (!('v' in res[0]) || typeof res[0].v !== 'string')) res.unshift({ v: '' });

  if (res.length === 0) return { v: '' };
  else if (res.length === 1) return res[0];
  return { op: '+', args: res };
}

const timespan = map(rep1sep(seq(JNum, ws, istr('years', 'year', 'y', 'months', 'month', 'minutes', 'minute', 'milliseconds', 'millisecond', 'mm', 'ms', 'm', 'weeks', 'week', 'w', 'days', 'day', 'd', 'hours', 'hour', 'h', 'seconds', 'second', 's')), ws), parts => {
  const span = { y: 0, m: 0, d: 0, h: 0, mm: 0, s: 0, ms: 0 };
  for (let i = 0; i < parts.length; i++) {
    if (parts[i][2][0] === 'y') span.y += parts[i][0];
    else if (parts[i][2] === 'm' || parts[i][2] === 'months' || parts[i][2] === 'month') span.m += parts[i][0];
    else if (parts[i][2][0] === 'd') span.d += parts[i][0];
    else if (parts[i][2][0] === 'w') span.d += parts[i][0] * 7;
    else if (parts[i][2][0] === 'h') span.h += parts[i][0];
    else if (parts[i][2][0] === 's') span.s += parts[i][0];
    else if (parts[i][2] === 'mm' || parts[i][2] === 'minutes' || parts[i][2] === 'minute') span.mm += parts[i][0];
    else if (parts[i][2] === 'ms' || parts[i][2] === 'milliseconds' || parts[i][2] === 'millisecond') span.ms += parts[i][0];
  }

  if (!span.y && !span.m) {
    delete span.y; delete span.m;
    let n = 0;
    for (const k in span) n += span[k] * (timespans[k] || 1);
    return n;
  } else {
    const s: [number?, number?, number?, number?, number?, number?, number?] = [];
    if (span.y) s[0] = span.y;
    if (span.m) s[1] = span.m;
    if (span.d) s[2] = span.d;
    if (span.h) s[3] = span.h;
    if (span.mm) s[4] = span.mm;
    if (span.s) s[5] = span.s;
    if (span.ms) s[6] = span.ms;
    return { d: s };
  }
}, 'timespan');

export const timezone = map(seq(ws, alt<string|[string, string, [string, string]]>('timezone',
  istr('z'),
  seq(opt(chars(1, '+-')), read1(digits),
    opt(seq(str(':'), chars(2, digits)))
  )
)), v => {
  if (v[1][0] === 'z') return 0;
  else {
    let res = +v[1][1] * 60;
    if (v[1][2]) res += +v[1][2][1];
    if (v[1][0] === '-') res *= -1;
    return res;
  }
});

export const timeexact = alt<[number, number?, number?, number?]>(
  map(seq(
    read1(digits),
    opt(seq(
      str(':'), chars(2, digits), opt(
        seq(str(':'), chars(2, digits), opt(
          seq(str('.'), chars(3, digits))
        ))
      )
    ))
  ), v => {
    const h = v[0];
    const m = v[1] && v[1][1];
    const s = m && v[1][2] && v[1][2][1];
    const ms = s && v[1][2][2] && v[1][2][2][1];
    const res: [number, number?, number?, number?] = [+h];
    if (m) res[1] = +m;
    if (s) res[2] = +s;
    if (ms) res[3] = +ms;
    return res;
  }),
  map(istr('noon'), () => [12, 0, 0, 0]),
  map(istr('midnight'), () => [0, 0, 0, 0]),
);

const dateend = opt(seq(ws, str('>')));
const daterel = alt<DateRel>('date',
  map(seq(opt(istr('last', 'this', 'next')), rws, istr('week', 'month', 'year'), opt(timezone), dateend), ([o, , f, tz, e]) => {
    const val: DateRelRange = { f: f[0] === 'w' ? 'w' : f[0] === 'm' ? 'm' : 'y', o: o === 'last' ? -1 : o === 'next' ? 1 : 0, e: e ? 1 : undefined };
    if (tz != null) val.z = tz;
    return val;
  }),
  map(seq(istr('week', 'month', 'year'), seq(rws, istr('to'), rws, istr('date')), opt(timezone), dateend), ([f, , tz, e]) => {
    const val: DateRelToDate = { f: f[0] === 'w' ? 'w' : f[0] === 'm' ? 'm' : 'y', o: 0, d: 1, e: e ? 1 : undefined };
    if (tz != null) val.z = tz;
    return val;
  }),
  map(seq(istr('yesterday', 'today', 'tomorrow'), alt<any>(bracket(ws, istr('at'), ws), rws), timeexact, ws, opt(timezone)), v => {
    const res: DateRel = { f: 'd', o: v[0] === 'yesterday' ? -1 : v[0] === 'today' ? 0 : 1, t: v[2] };
    if (v[4] != null) res.t[4] = v[4];
    return res;
  }),
  map(seq(istr('yesterday', 'today', 'tomorrow', 'now'), opt(timezone), dateend), ([v, tz, e]) => {
    const val: DateRel = (v === 'now' ? { f: 'n', o: 0 } : { f: 'd', o: v === 'yesterday' ? -1 : v === 'today' ? 0 : 1, e: e ? 1 : undefined });
    if (tz != null) val.z = tz;
    return val;
  }),
  map(seq(istr('in'), rws, timespan), v => (typeof v[2] === 'number' ? { f: 'n', o: v[2] } : { f: 'n', o: v[2].d })),
  map(seq(timespan, rws, alt<string|any[]>('relative time anchor', istr('ago'), seq(istr('from'), rws, istr('now'))), opt(timezone)), ([span, , ref, tz]) => {
    let val: DateRelSpan;
    if (typeof span === 'number') {
      val = { f: 'n', o: span * (ref === 'ago' ? -1 : 1) };
    } else {
      val = { f: 'n', o: span.d, d: ref === 'ago' ? -1 : undefined };
    }
    if (tz != null) val.z = tz;
    return val;
  }),
);

function setIndex<T, U = Array<T>>(array: U, index: number, value: T): U {
  if (value == null) return array;
  array[index] = value;
  return array;
}
export const dateexact: Parser<Date|DateRel> = map(seq(
  chars(4, digits),
  opt(seq(chars(1, '-/'), read1(digits),
    opt(seq(chars(1, '-/'), read1(digits)))
  )),
  opt(seq(
    alt(bracket(rws, istr('at'), rws), istr('t'), rws), timeexact
  )),
  opt(timezone),
  dateend,
), v => {
  const y = v[0];
  const m = v[1] && v[1][1];
  const d = m && v[1][2] && v[1][2][1];
  const time = v[2] && v[2][1];
  const tz = v[3];
  const e = v[4] ? 1 : undefined;
  if (!m) return { f: setIndex([+y], 7, tz), e };
  else if (!d) return { f: setIndex([+y, +m - 1], 7, tz), e };
  else if (!time) return { f: setIndex([+y, +m - 1, +d], 7, tz), e }
  else {
    const res: DateExactRange = { f: [+y, +m - 1, +d], e };
    for (let i = 0; i < time.length; i++) {
      if (time[i] != null) res.f[i + 3] = time[i];
    }
    if (tz != null) res.f[7] = tz;
    return res;
  }
});

export const date = bracket(str('#'), alt<Date|DateRel|TimeSpan>('date', dateexact, daterel, timespan), str('#'));

export const string = alt<Value>('string',
  map(seq(str(':'), read1To(endRef.replace('.', ''), true)), v => ({ v: v[1]})),
  map(bracket(str('"'), rep(alt<string>('string part',
    read1To('\\"'), JStringEscape, JStringUnicode, JStringHex
  )), str('"')), a => ({ v: ''.concat(...a) })), 
  map(bracket(str(`'`), rep(alt('string part',
    map(read1To(`'\\$\{`, true), v => ({ v })),
    map(str('\\$', '$$'), () => ({ v: '$' })),
    bracket(str('${', '{'), value, str('}')),
    map(str('$', '{'), v => ({ v })),
    map(JStringUnicode, v => ({ v })),
    map(JStringHex, v => ({ v })),
    map(JStringEscape, v => ({ v })),
  )), str(`'`)), stringInterp),
  map(bracket(str('`'), rep(alt('string part',
    map(read1To('`\\${', true), v => ({ v })),
    map(str('\\$', '$$'), () => ({ v: '$' })),
    bracket(str('${', '{'), value, str('}')),
    map(str('$', '{'), v => ({ v })),
    map(JStringUnicode, v => ({ v })),
    map(JStringHex, v => ({ v })),
    map(JStringEscape, v => ({ v })),
  )), str('`')), stringInterp),
);
export const literal = map(alt('literal', JNum, keywords, date), v => {
  if (v instanceof Date || v == null || typeof v !== 'object') return { v };
  else return v;
});

export const sexp = map(bracket(
  check(str('('), ws),
  seq(ident, ws, args),
  check(ws, str(')')),
), ([op, , args]) => {
  const res: Value = { op };
  if (args && args.length) res.args = args;
  return res;
}, 'sexp');

function fmt_op(parser: Parser<Value>): Parser<Value> {
  return map(seq(parser, opt(seq(str('#'), ident, opt(seq(str(','), rep1sep(value, str(','))))))), ([value, fmt]) => {
    if (!fmt) return value;
    if (fmt[2]) return { op: 'fmt', args: [value, { v: fmt[1] }, ...fmt[2][1]] };
    else return { op: 'fmt', args: [value, { v: fmt[1] }] };
  });
}

function bracket_op<T>(parser: Parser<T>): Parser<T> {
  return bracket(seq(str('('), ws), parser, seq(ws, str(')')));
}

export const binop: Parser<Value> = {};
export const if_op: Parser<Value> = {};

const call_op = map(seq(name(read1('abcdefghifghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_$0123456789'), 'op'), bracket_op(args)), ([op, args]) => {
  const res: Value = { op };
  if (args && args.length) res.args = args;
  return res;
}, 'call');

export const operand: Parser<Value> = fmt_op(postfix_path(alt('operand', bracket_op(if_op), verify(bracket_op(binop), v => 'op' in v || `expected bracketed op`), sexp, values)));
export const unop = map(seq(str('not ', '+'), operand), ([op, arg]) => ({ op: op === '+' ? op : 'not', args: [arg] }), 'unary');

function leftassoc(left: Value, [, op, , right]: [string, string, string, Value]) {
  return { op, args: [left, right] };
}

function rightassoc(left: Value, more: Array<[string, string, string, Value]>) {
  if (more.length === 1) return { op: more[0][1], args: [left, more[0][3]] };
  const end = more.pop();
  let op = more[more.length - 1][1];
  const first = { op: end[1], args: [more.pop()[3], end[3]] }
  const right = more.reverse().reduce((a, c) => {
    const res = { op, args: [c[3], a] };
    op = c[1];
    return res;
  }, first);
  return { op, args: [left, right] };
}

export const binop_e = map(seq(operand, rep(seq(rws, name(str('**'), 'exp op'), rws, operand))), ([arg1, more]) => more.length ? rightassoc(arg1, more) : arg1);
export const binop_md = map(seq(binop_e, rep(seq(rws, name(str('*', '/%', '/', '%'), 'muldiv op'), rws, binop_e))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1);
export const binop_as = map(seq(binop_md, rep(seq(rws, name(str('+', '-'), 'addsub op'), rws, binop_md))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1);
export const binop_cmp = map(seq(binop_as, rep(seq(rws, name(str('>=', '>', '<=', '<', 'in', 'like', 'ilike', 'not-in', 'not-like', 'not-ilike', 'contains', 'does-not-contain'), 'cmp op'), rws, binop_as))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1);
export const binop_eq = map(seq(binop_cmp, rep(seq(rws, name(str('is', 'is-not', '==', '!='), 'eq op'), rws, binop_cmp))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1);
export const binop_and = map(seq(binop_eq, rep(seq(rws, name(str('and', '&&'), 'and op'), rws, binop_eq))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1);
export const binop_or = map(seq(binop_and, rep(seq(rws, name(str('or', '||'), 'or op'), rws, binop_and))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1, 'binop');
binop.parser = binop_or;

if_op.parser = alt(
  map(seq(str('if'), rws, value, rws, str('then'), rws, value, rep(seq(rws, str('else if', 'elseif', 'elsif', 'elif'), rws, value, rws, str('then'), rws, value)), opt(seq(rws, str('else'), rws, value))), ([,, cond1,,,, val1, elifs, el]) => {
    const op = { op: 'if', args: [cond1, val1] };
    for (const [,,, cond,,,, val] of elifs) op.args.push(cond, val);
    if (el) op.args.push(el[3]);
    return op;
  }, 'if'),
  map(seq(str('unless'), rws, value, rws, str('then'), rws, value, opt(seq(rws, str('else'), rws, value))), ([, , cond, , , , hit, miss]) => {
    const op = { op: 'unless', args: [cond, hit] };
    if (miss) op.args.push(miss[3]);
    return op;
  }),
);

function postfix_path(parser: Parser<Value>): Parser<Value> {
  return map(seq(parser, rep(alt<string|Value>('keypath', dotpath, bracketpath))), ([v, k]) => {
    if (k.length) return { op: 'get', args: [v, { v: { k } }] };
    else return v;
  });
}

export const operation = alt<Value>('expression', if_op, binop);

const pair: Parser<[Value, Value]> = map(seq(alt('key', string, map(ident, v => ({ v }))), ws, str(':'), ws, value), t => [t[0], t[4]], 'pair');

array.parser = map(bracket(
  check(ws, str('['), ws),
  repsep(value, read1(space + ','), 'allow'),
  check(ws, str(']')),
), args => args.filter(a => !('v' in a)).length ? { op: 'array', args } : { v: args.map(a => (a as Literal).v) }, 'array');

function objectOp(pairs: [Value, Value][]): Value {
  return pairs.filter(p => !('v' in p[0] && 'v' in p[1])).length ?
  { op: 'object', args: pairs.reduce((a, c) => (a.push(c[0], c[1]), a), []) } : 
  { v: pairs.reduce((a, c) => (a[(c[0] as Literal).v] = (c[1] as Literal).v, a), {}) };
}

object.parser = map(bracket(
  check(ws, str('{'), ws),
  repsep(pair, read1(space + ','), 'allow'),
  check(ws, str('}')),
), objectOp, 'object');

value.parser = operation;

const namedArg: Parser<[Value, Value]> = map(seq(ident, str(':'), ws, value), ([k, , , v]) => [{ v: k }, v], 'named arg');
const application = map(seq(str('=>'), ws, value), ([, , value]) => ({ a: value }));
args.parser = map(repsep(alt<[Value, Value] | Value>('argument', namedArg, value), read1(space + ','), 'allow'), (args) => {
  const [plain, obj] = args.reduce((a, c) => ((Array.isArray(c) ? a[1].push(c) : a[0].push(c)), a), [[], []] as [Array<Value>, Array<[Value, Value]>]);
  if (obj.length) plain.push(objectOp(obj));
  return plain;
}, 'application');

values.parser = alt('expression', array, object, literal, string, application, unop, call_op, ref);

export const parse = makeParser(value, { trim: true });
