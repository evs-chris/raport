import { parser as makeParser, Parser, bracket, opt, alt, seq, str, istr, map, read, chars, repsep, rep1sep, read1To, read1, skip1, rep, rep1, check, verify, name, not } from 'sprunge/lib';
import { ws, digits, JNum, JStringEscape, JStringUnicode, JStringHex, JString } from 'sprunge/lib/json';
import { Value, DateRel, DateRelToDate, DateRelRange, DateRelSpan, DateExactRange, Literal, Keypath, TimeSpan, Operation, TimeSpanMS, Schema, Field, TypeMap } from './index';

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

export function isTimespanMS(v: any): v is TimeSpanMS {
  return typeof v === 'object' && v && typeof v.ms === 'number';
}

export function timeSpanToNumber(v: TimeSpan): number {
  if (typeof v === 'number') return v;
  else if (isTimespanMS(v)) return v.ms;
  else return ((((((((((((v.d[0] || 0) * 12) + (v.d[1] || 0)) * 30.45) + (v.d[2] || 0)) * 24) + (v.d[3] || 0)) * 60) + (v.d[4] || 0)) * 60) + (v.d[5] || 0)) * 1000) + (v.d[6] || 0);
}

const space = ' \r\n\t';
const endSym = space + '():{}[]<>,"\'`\\;&#';
export const endRef = endSym + '.+/*|^%=!?';

export const rws = skip1(space, 'required-space');

export const keywords = map<string, any>(str('null', 'true', 'false', 'undefined'), v => {
  switch (v) {
    case 'null': return null;
    case 'true': return true;
    case 'false': return false;
    case 'undefined': return undefined;
  }
}, { primary: true, name: 'primitive' });

export const ident = read1To(endRef, true);
export const sexprop = read1To(' \r\n\t():{}[],"\'\\;&#@', true);

export const args: Parser<Value[]> = {};
export const array: Parser<Value> = {};
export const block: Parser<Value> = {};
export const object: Parser<Value> = {};
export const value: Parser<Value> = {};
export const values: Parser<Value> = {};
export const tpl: Parser<Value> = {};
export const application: Parser<Value> = {};

const escmap: { [k: string]: string } = { n: '\n', r: '\r', t: '\t', b: '\b' };
const pathesc = map(seq(str('\\'), chars(1)), ([, char]) => escmap[char] || char);
const pathident = map(rep1(alt('ref-part', read1To(endRef, true), pathesc)), parts => parts.join(''), 'keypath-part');
const dotpath = map(seq(str('.'), pathident), ([, part]) => part);
const bracketpath = bracket(seq(str('['), ws), value, seq(ws, str(']')));
export const keypath = map(seq(alt<'!'|'~'|'*'|[string,string]>('ref-sigil', str('!', '~', '*') as any, seq(read('^'), opt(str('@', '.')))), alt<string|Value>('keypath', pathident, bracketpath), rep(alt<string|Value>('keypath', dotpath, bracketpath))), ([prefix, init, parts]) => {
  const res: Keypath = { k: [init].concat(parts).map(p => typeof p === 'object' && 'v' in p && (typeof p.v === 'string' || typeof p.v === 'number') ? p.v : p) };
  if (Array.isArray(prefix)) {
    if (prefix[0]) res.u = prefix[0].length;
    if (prefix[1] === '@') res.p = '@';
  } else if (prefix) {
    res.p = prefix;
  }
  return res;
}, 'keypath');
export const localpath = map(seq(read('^'), pathident, rep(alt<string|Value>('keypath', dotpath, bracketpath))), ([prefix, init, parts]) => {
  const res: Keypath = { k: ([init] as Array<string|Value>).concat(parts).map(p => typeof p === 'object' && 'v' in p && (typeof p.v === 'string' || typeof p.v === 'number') ? p.v : p) };
  if (prefix) res.u = prefix.length;
  return res;
}, 'localpath');

export const parsePath = makeParser(keypath);
export const parseLetPath = makeParser(localpath);

const illegalRefs = ['if', 'else', 'elif', 'elseif', 'elsif', 'unless', 'then', 'case', 'when', 'not', 'gte', 'gt', 'lte', 'lt', 'in', 'like', 'ilike', 'not-in', 'not-like', 'not-ilike', 'contains', 'does-not-contain', 'is-not', 'is', 'strict-is-not', 'strict-is', 'deep-is-not', 'deep-is', 'and', 'or'];
export const ref = map(keypath, (r, err) => {
  if (r.k.length === 1 && !r.p && !r.u && illegalRefs.includes(r.k[0] as string)) err(`invalid reference name '${r.k[0] as string}'`);
  return { r };
}, { primary: true, name: 'reference' });

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

  if (!span.y && !span.m && !span.d) {
    delete span.y; delete span.m; delete span.d;
    let n = 0;
    for (const k in span) n += span[k] * (timespans[k] || 1);
    return { ms: n };
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
}, { primary: true, name: 'timespan' });

export const timezone = map(seq(ws, alt<string|[string, string, [string, string]]>('timezone',
  istr('z'),
  seq(opt(chars(1, '+-')), alt(chars(4, digits), chars(2, digits), chars(1, digits)),
    opt(seq(str(':'), chars(2, digits)))
  )
)), v => {
  if (v[1][0] === 'z') return 0;
  else {
    let res: number;
    if (v[1][1].length === 4) {
      res = +v[1][1].substr(0, 2) * 60 + +v[1][1].substr(2, 2);
    } else {
      res = +v[1][1] * 60;
      if (v[1][2]) res += +v[1][2][1];
    }
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
  map(istr('start', 'midnight'), () => [0, 0, 0, 0]),
  map(istr('noon', 'mid'), () => [12, 0, 0, 0]),
  map(istr('end'), () => [23, 59, 59, 999]),
);

export const parseTime = makeParser(alt<number|[number, number?, number?, number?]>(map(seq(timeexact, opt(seq(ws, timezone))), ([tm, z]) => {
  if (z) tm.push(z[1]);
  return tm;
}), timezone), { trim: true, consumeAll: true, undefinedOnError: true });

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
  map(seq(istr('in'), rws, timespan), v => (typeof v[2] === 'number' || isTimespanMS(v[2]) ? { f: 'n', o: timeSpanToNumber(v[2]) } : { f: 'n', o: v[2].d })),
  map(seq(timespan, rws, alt<string|any[]>('relative time anchor', istr('ago'), seq(istr('from'), rws, istr('now'))), opt(timezone)), ([span, , ref, tz]) => {
    let val: DateRelSpan;
    if (typeof span === 'number' || isTimespanMS(span)) {
      val = { f: 'n', o: timeSpanToNumber(span) * (ref === 'ago' ? -1 : 1) };
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

export const date = bracket(str('#'), alt<Date|DateRel|TimeSpan>('date', dateexact, daterel, timespan), str('#'), { primary: true, name: 'date' });

export const typelit = map(seq(str('@['), ws, schema(), ws, str(']')), ([, , v]) => ({ v, s: 1 } as Value), { name: 'typelit', primary: true });

export const parseDate = makeParser(map(seq(opt(str('#')), alt<Date|DateRel|TimeSpan>('date', dateexact, daterel, timespan), opt(str('#'))), ([, d,]) => d), { trim: true, consumeAll: true, undefinedOnError: true });

export const string = alt<Value>({ primary: true, name: 'string' },
  map(seq(str(':'), read1To(endSym, true)), v => ({ v: v[1]})),
  map(bracket(str('"'), rep(alt<string>('string-part',
    read1To('\\"'), JStringEscape, JStringUnicode, JStringHex
  )), str('"')), a => ({ v: ''.concat(...a) })), 
  map(bracket(str(`'`), rep(alt('string-part',
    map(read1To(`'\\$\{`, true), v => ({ v } as Value)),
    map(str('\\$', '$$'), () => ({ v: '$' })),
    bracket(str('${', '{'), value, str('}'), { primary: true, name: 'string-interpolation' }),
    map(str('$', '{'), v => ({ v })),
    map(JStringUnicode, v => ({ v })),
    map(JStringHex, v => ({ v })),
    map(JStringEscape, v => ({ v })),
  )), str(`'`)), stringInterp),
  map(bracket(str('`'), rep(alt('string-part',
    map(read1To('`\\${', true), v => ({ v } as Value)),
    map(str('\\$', '$$'), () => ({ v: '$' })),
    bracket(str('${'), value, str('}'), { primary: true, name: 'string-interpolation' }),
    map(str('$', '{'), v => ({ v })),
    map(JStringUnicode, v => ({ v })),
    map(JStringHex, v => ({ v })),
    map(JStringEscape, v => ({ v })),
  )), str('`')), stringInterp),
);
export const literal = map(alt('literal', map(JNum, v => v, { primary: true, name: 'number' }), keywords, date), v => {
  if (v instanceof Date || v == null || typeof v !== 'object') return { v };
  else return v;
});

export const sexp = map(bracket(
  check(str('('), ws),
  seq(sexprop, ws, args),
  check(ws, str(')')),
), ([op, , args]) => {
  const res: Value = { op };
  if (args && args.length) res.args = args;
  return res;
}, { primary: true, name: 's-expression' });

function fmt_op(parser: Parser<Value>): Parser<Value> {
  return map(seq(parser, opt(seq(str('#'), ident, opt(seq(str(','), rep1sep(value, str(','), 'allow')))), { primary: true, name: 'format-op' })), ([value, fmt]) => {
    if (!fmt) return value;
    if (fmt[2]) return { op: 'fmt', args: [value, { v: fmt[1] }, ...fmt[2][1]] };
    else return { op: 'fmt', args: [value, { v: fmt[1] }] };
  }, 'fmt-op');
}

function bracket_op<T>(parser: Parser<T>): Parser<T> {
  return bracket(seq(str('('), ws), parser, seq(ws, str(')')));
}

export const binop: Parser<Value> = {};
export const if_op: Parser<Value> = {};
export const case_op: Parser<Value> = {};

const opName = read1('abcdefghifghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_$0123456789');
const call_op = map(seq(name(opName, 'op'), bracket_op(args)), ([op, args]) => {
  const res: Value = { op };
  if (args && args.length) res.args = args;
  return res;
}, { primary: true, name: 'call' });

export const operand: Parser<Value> = fmt_op(postfix_path(alt('operand', bracket_op(if_op), bracket_op(case_op), verify(bracket_op(binop), v => 'op' in v || `expected bracketed op`), sexp, values)));
export const unop = map(seq(str('not ', '+'), operand), ([op, arg]) => ({ op: op === '+' ? op : 'not', args: [arg] }), 'unary op');

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

export const binop_e = map(seq(operand, rep(seq(rws, name(str('**'), 'exp op'), rws, operand))), ([arg1, more]) => more.length ? rightassoc(arg1, more) : arg1, 'exp-op');
export const binop_md = map(seq(binop_e, rep(seq(rws, name(str('*', '/%', '/', '%'), 'muldiv-op'), rws, binop_e))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1, 'muldiv-op');
export const binop_as = map(seq(binop_md, rep(seq(rws, name(str('+', '-'), 'addsub-op'), rws, binop_md))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1, 'addsub-op');
export const binop_cmp = map(seq(binop_as, rep(seq(rws, name(str('>=', '>', '<=', '<', 'gte', 'gt', 'lte', 'lt', 'in', 'like', 'ilike', 'not-in', 'not-like', 'not-ilike', 'contains', 'does-not-contain'), 'cmp-op'), rws, binop_as))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1, 'cmp-op');
export const binop_eq = map(seq(binop_cmp, rep(seq(rws, name(str('is-not', 'is', 'strict-is-not', 'strict-is', 'deep-is-not', 'deep-is', '===', '==', '!==', '!='), 'eq-op'), rws, binop_cmp))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1, 'eq-op');
export const binop_and = map(seq(binop_eq, rep(seq(rws, name(str('and', '&&'), 'and-op'), rws, binop_eq))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1, 'and-op');
export const binop_or = map(seq(binop_and, rep(seq(rws, name(str('or', '||', '??'), 'or-op'), rws, binop_and))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1, 'or-op');
binop.parser = map(binop_or, v => v, { primary: true, name: 'binary-op' });

if_op.parser = alt({ primary: true, name: 'conditional' },
  map(seq(str('if'), rws, value, rws, block, rep(seq(ws, str('else if', 'elseif', 'elsif', 'elif'), rws, value, rws, block)), opt(seq(ws, str('else'), rws, block))), ([,, cond1,, block1, elifs, el]) => {
    const op =  { op: 'if', args: [cond1, block1] };
    for (const [,,, cond,, block] of elifs) op.args.push(cond, block);
    if (el) op.args.push(el[3]);
    return op;
  }, 'if-block'),
  map(seq(str('if'), rws, value, rws, str('then'), rws, value, rep(seq(rws, not(str('end', 'fi')), str('else if', 'elseif', 'elsif', 'elif'), rws, value, rws, str('then'), rws, value)), opt(seq(rws, str('else'), rws, value)), opt(seq(rws, str('end', 'fi')))), ([,, cond1,,,, val1, elifs, el]) => {
    const op = { op: 'if', args: [cond1, val1] };
    for (const [,,,, cond,,,, val] of elifs) op.args.push(cond, val);
    if (el) op.args.push(el[3]);
    return op;
  }, 'if'),
  map(seq(str('unless'), rws, value, rws, str('then'), rws, value, opt(seq(rws, str('else'), rws, value))), ([, , cond, , , , hit, miss]) => {
    const op = { op: 'unless', args: [cond, hit] };
    if (miss) op.args.push(miss[3]);
    return op;
  }),
);

export function replaceCase(op: Operation): boolean {
  if (!op.args || !op.args.length) return false;
  let found = false;
  for (let i = 0; i < op.args.length; i++) {
    const arg = op.args[i] as Value;
    if ('r' in arg && (arg.r === '_' || (typeof arg.r === 'object' && arg.r.k[0] === '_'))) {
      arg.r = { k: ['case'].concat(((arg.r as any).k || []).slice(1)), p: '@' };
      found = true;
    } else if ('r' in arg && typeof arg.r === 'object' && arg.r.p === '@' && arg.r.k[0] === 'case') {
      found = true;
    } else if ('op' in arg) found = found || replaceCase(arg);
  }
  return found;
}

export const case_branch = alt<[undefined|Value, Value]>(
  map(seq(rws, not(str('end', 'esac')), str('when'), rws, value, rws, str('then'), rws, value), ([,,,, cond,,,, hit]) => [cond, hit], 'when-branch'),
  map(seq(rws, not(str('end', 'esac')), str('else'), rws, value), ([,,,, hit]) => [undefined, hit], 'else-branch'),
  map(seq(rws, not(str('end', 'esac')), str('when'), rws, value, rws, block), ([,,,, cond,, hit]) => [cond, hit], 'when-block'),
);
case_op.parser = alt(
  map(seq(str('case'), rws, value, rep(case_branch), opt(seq(rws, str('end', 'esac')))), ([,, val, branches]) => {
    const op = { op: 'case', args: [val] };
    for (let i = 0; i < branches.length; i++) {
      if (branches[i][0] === undefined) op.args.push(branches[i][1]);
      else {
        let arg: Value = branches[i][0];
        if ('op' in arg) replaceCase(arg);
        op.args.push(arg);
        op.args.push(branches[i][1]);
      }
    }
    return op;
  }, 'case'),
);

function postfix_path(parser: Parser<Value>): Parser<Value> {
  return map(seq(parser, rep(alt<string|Value>('keypath', dotpath, bracketpath))), ([v, k]) => {
    if (k.length) return { op: 'get', args: [v, { v: { k } }] };
    else return v;
  }, 'postfix-path-op');
}

export const operation = alt<Value>('expression', if_op, case_op, binop);

const pair: Parser<[Value, Value]> = map(seq(alt('key', string, map(ident, v => ({ v }))), ws, str(':'), ws, value), t => [t[0], t[4]], 'pair');

array.parser = map(bracket(
  check(ws, str('['), ws),
  repsep(value, read1(space + ','), 'allow'),
  check(ws, str(']')),
), args => args.filter(a => !('v' in a)).length ? { op: 'array', args } : { v: args.map(a => (a as Literal).v) }, { primary: true, name: 'array' });

function objectOp(pairs: [Value, Value][]): Value {
  return pairs.filter(p => !('v' in p[0] && 'v' in p[1])).length ?
  { op: 'object', args: pairs.reduce((a, c) => (a.push(c[0], c[1]), a), []) } : 
  { v: pairs.reduce((a, c) => (a[(c[0] as Literal).v] = (c[1] as Literal).v, a), {}) };
}

object.parser = map(bracket(
  check(ws, str('{'), ws),
  repsep(pair, read1(space + ','), 'allow'),
  check(ws, str('}')),
), objectOp, { primary: true, name: 'object' });

block.parser = map(bracket(
  check(ws, str('{'), ws),
  rep1sep(value, read1(space + ';'), 'allow'),
  check(ws, str('}')),
), args => ({ op: 'block', args }), { primary: true, name: 'block' });

value.parser = operation;

const namedArg: Parser<[Value, Value]> = map(seq(ident, str(':'), ws, value), ([k, , , v]) => [{ v: k }, v], 'named-arg');
application.parser = map(seq(opt(bracket(check(str('|'), ws), rep1sep(opName, read1(space + ','), 'allow'), str('|'))), ws, str('=>', '=\\'), ws, value), ([names, , , , value]) => (names ? { a: value, n: names } : { a: value }), { primary: true, name: 'application' });
args.parser = map(repsep(alt<[Value, Value] | Value>('argument', namedArg, value), read1(space + ','), 'allow'), (args) => {
  const [plain, obj] = args.reduce((a, c) => ((Array.isArray(c) ? a[1].push(c) : a[0].push(c)), a), [[], []] as [Array<Value>, Array<[Value, Value]>]);
  if (obj.length) plain.push(objectOp(obj));
  return plain;
});

const letter = map(seq(str('let'), rws, name(localpath, { name: 'reference', primary: true }), ws, str('='), ws, value), ([, , k, , , , v]) => ({ op: 'let', args: [{ v: k }, v] }), { primary: true, name: 'let' });
const setter = map(seq(str('set'), rws, name(keypath, { name: 'reference', primary: true }), ws, str('='), ws, value), ([, , k, , , , v]) => ({ op: 'set', args: [{ v: k }, v] }), { primary: true, name: 'set' });
values.parser = alt('expression', array, object, literal, typelit, string, application, unop, call_op, letter, setter, ref, block);

export const parseBlock = makeParser<Value>(map(rep1sep(value, read1(space + ';'), 'allow'), args => args.length === 1 ? args[0] : { op: 'block', args }, 'expression-sequence'), { trim: true });
export const parseExpr = makeParser(value, { trim: true });
export const parse = parseBlock;
export default parse;

export function schema() {
  const type: Parser<Schema> = {};
  const conditions = opt(seq(ws, rep1sep(map(seq(name(str('?'), { name: 'condition', primary: true }), ws, application), ([, , a]) => a), rws, 'disallow')));
  const value = map(seq(str('string[]', 'number[]', 'boolean[]', 'date[]', 'any', 'string', 'number', 'boolean', 'date'), not(read1To(endRef))), ([s]) => ({ type: s } as Schema), { name: 'type', primary: true });
  const typedef = map(seq(str('type'), ws, name(ident, { name: 'type', primary: true }), ws, str('='), ws, type), ([, , name, , , , type]) => ({ name, type }));
  const typedefs = map(rep1sep(typedef, read1(' \t\n;'), 'disallow'), defs => defs.reduce((a, c) => (a[c.name] = c.type, a), {} as TypeMap));
  const ref = map(seq(ident, opt(str('[]'))), ([ref, arr]) => ({ type: arr ? 'array' : 'any', ref } as Schema), { name: 'type', primary: true });
  const key = map(seq(name(ident, { name: 'key', primary: true }), opt(str('?')), ws, str(':'), ws, type), ([name, opt, , , , type]) => {
    const res: Field = type as Field;
    res.name = name;
    if (!opt) res.required = true;
    return res;
  });
  const literal = alt<Schema>(
    { name: 'literal', primary: true }, 
    map(alt<string|number>(JString, JNum), v => {
      return { type: 'literal', literal: v } as Schema;
    }),
    map(str('true', 'false', 'null', 'undefined'), v => {
      return { type: 'literal', literal: v === 'true' ? true : v === 'false' ? false : v === 'null' ? null : undefined } as Schema;
    }),
  );
  const rest = map(seq(str('...'), ws, str(':'), ws, type), ([, , , , type]) => {
    return Object.assign({ name: '...' }, type) as Field;
  });
  const object: Parser<Schema> = map(seq(str('{'), ws, repsep(alt(key, rest), read1(' \t\n,;'), 'allow'), ws, str('}'), opt(str('[]'))), ([, , keys, , , arr], fail) => {
    const rests = keys.filter(k => k.name === '...');
    if (rests.length > 1) fail('only one object rest can be specified');
    else {
      const rest = rests[0];
      keys = keys.filter(k => k.name !== '...');
      const type: Schema = { type: arr ? 'object[]' : 'object' };
      if (keys.length) type.fields = keys;
      if (rest) {
        delete rest.name;
        type.rest = rest;
      }
      return type;
    }
  });
  const tuple = map(seq(str('['), ws, repsep(type, read1(' \t\r\n,'), 'allow'), ws, str(']'), opt(str('[]'))), ([, , types, , , arr]) => {
    return { type: arr ? 'tuple[]' : 'tuple', types } as Schema;
  });
  const maybe_union = map(rep1sep(seq(alt<Schema>(value, object, tuple, literal, ref), conditions), seq(ws, str('|'), ws), 'disallow'), list => {
    const types = list.map(([t, c]) => {
      if (c && c[1] && c[1].length) t.checks = c[1];
      return t;
    });
    if (types.length === 1) return types[0];
    else return { type: 'union', types: types } as Schema;
  });
  const union_array = alt<Schema>(
    map(seq(str('Array<'), ws, maybe_union, ws, str('>')), ([, , union], fail) => {
      if (union.type === 'union') return { type: 'union[]', types: union.types } as Schema;
      else if (union.type === 'literal') fail('literal types cannot be array types');
      else if (union.type === 'array' || ~union.type.indexOf('[]')) fail('array types cannot be array types');
      else if (union.type === 'any') fail('any cannot be an array type');
      else {
        union.type += '[]';
        return union;
      }
    }),
    map(seq(str('('), ws, maybe_union, ws, str(')')), ([, , union]) => union),
    maybe_union,
  );

  type.parser = map(seq(union_array, conditions), ([type, checks]) => {
    if (checks && checks[1] && checks[1].length) type.checks = checks[1];
    return type;
  });

  const root = map(seq(opt(typedefs), ws, type), ([defs, , type]) => {
    if (defs) type.defs = defs;
    return type;
  });

  return root;
}
