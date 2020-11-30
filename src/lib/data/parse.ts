import { parser as makeParser, Parser, bracket, opt, alt, seq, str, istr, map, read, chars, repsep, rep1sep, read1To, read1, skip1, rep, rep1, check, verify, ErrorOptions } from 'sprunge/lib';
import { ws, digits, JNum, JStringEscape, JStringUnicode, JStringHex } from 'sprunge/lib/json';
import { Value, DateRel, Literal, Keypath } from './index';

export const week = 604800000;
export const day = 86400000;
export const hour = 3600000;
export const minute = 60000;
export const second = 1000;

const timespan_map = {
  week, weeks: week,
  day, days: day,
  hour, hours: hour,
  minute, minutes: minute,
  second, seconds: second,
};

const space = ' \r\n\t';
const endSym = space + '():{}[]';
const endRef = endSym + ',"\'`\\;&#.';

const rws = skip1(space);

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
const pathident = map(rep1(alt(read1To(endRef + '=', true), pathesc)), parts => parts.join(''));
const dotpath = map(seq(str('.'), pathident), ([, part]) => part);
const bracketpath = bracket(seq(str('['), ws), value, seq(ws, str(']')));
export const keypath = map(seq(alt<'!'|'~'|'*'|[string,string]>(str('!', '~', '*') as any, seq(read('^'), opt(str('@', '.')))), alt<string|Value>(pathident, bracketpath), rep(alt<string|Value>(dotpath, bracketpath))), ([prefix, init, parts]) => {
  const res: Keypath = { k: [init].concat(parts).map(p => typeof p === 'object' && 'v' in p && (typeof p.v === 'string' || typeof p.v === 'number') ? p.v : p) };
  if (Array.isArray(prefix)) {
    if (prefix[0]) res.u = prefix[0].length;
    if (prefix[1] === '@') res.p = '@';
  } else if (prefix) {
    res.p = prefix;
  }
  return res;
});

export const parsePath = makeParser(keypath);

export const ref = map(keypath, r => ({ r }));

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

const timespan = map(rep1sep(seq(JNum, rws, istr('week', 'weeks', 'day', 'days', 'hour', 'hours', 'minute', 'minutes', 'second', 'seconds', 'millisecond', 'milliseconds')), rws, 'disallow'), parts => {
  let n = 0;
  for (let i = 0; i < parts.length; i++) n += parts[i][0] * timespan_map[parts[i][2]];
  return n;
});

const daterel = alt<DateRel>(
  map(seq(istr('last', 'this', 'next'), rws, istr('week', 'month', 'year'), opt(seq(rws, istr('to'), rws, istr('date')))), ([o, , f, d]) => ({ f: f[0] === 'w' ? 'w' : f[0] === 'm' ? 'm' : 'y', o: o === 'last' ? -1 : o === 'this' ? 0 : 1, d: d ? 1 : undefined })),
  map(istr('yesterday', 'today', 'tomorrow', 'now'), v => (v === 'now' ? { f: 'n', o: 0 } : { f: 'd', o: v === 'yesterday' ? -1 : v === 'today' ? 0 : 1 })),
  map(seq(timespan, rws, alt<string|any[]>(istr('ago'), seq(istr('from'), rws, istr('now')))), ([span, , ref]) => ({ f: 'n', o: span * (ref === 'ago' ? -1 : 1) })),
);

export const dateexact: Parser<Date> = map(seq(
  chars(4, digits),
  chars(1, '-/'),
  chars(2, digits),
  chars(1, '-/'),
  chars(2, digits),
  opt(seq(
    chars(1, ' T'), chars(2, digits), str(':'), chars(2, digits),
    opt(seq(
      str(':'), chars(2, digits),
        opt(seq(str('.'), chars(3, digits)))
    )),
  )),
  opt(alt<string|[string, string, [string, string]]>('timezone',
    str('Z'),
    opt(seq(chars(1, '+-'), chars(2, digits),
      opt(seq(str(':'), chars(2, digits)))
    ))
  )),
), v => {
  const time = v[5];
  const ss = time && time[3];
  const ms = ss && ss[1];
  const offset = v[6];
  if (offset) {
    const dt = new Date(Date.UTC(+v[0], +v[2] - 1, +v[4], time && +time[1] || 0, time && +time[2] || 0, ss && +ss[1] || 0, ms && +ms[1]));
    if (typeof offset !== 'string') {
      if (offset[0] === '-') {
        dt.setUTCHours(dt.getUTCHours() - +offset[1])
        if (offset[2]) dt.setUTCMinutes(dt.getUTCMinutes() - +offset[2][1])
      } else {
        dt.setUTCHours(dt.getUTCHours() + +offset[1])
        if (offset[2]) dt.setUTCMinutes(dt.getUTCMinutes() + +offset[2][1])
      }
    }
    return dt;
  } else {
    return new Date(+v[0], +v[2] - 1, +v[4], time && +time[1] || 0, time && +time[3] || 0, ss && +ss[1] || 0, ms && +ms[1]);
  }
});

export const date = bracket(str('#'), alt<Date|DateRel|number>(dateexact, daterel, timespan), str('#'));

export const string = alt<Value>(
  map(seq(str(':'), read1To(endRef.replace('.', ''), true)), v => ({ v: v[1]})),
  map(bracket(str('"'), rep(alt<string>('string part',
    read1To('\\"'), JStringEscape, JStringUnicode, JStringHex
  )), str('"')), a => ({ v: ''.concat(...a) })), 
  map(bracket(str(`'`), rep(alt('string part',
    map(read1To(`'\\$`), v => ({ v })),
    map(str('\\$', '$$'), () => ({ v: '$' })),
    bracket(str('${'), value, str('}')),
    map(str('$'), v => ({ v })),
    map(JStringUnicode, v => ({ v })),
    map(JStringHex, v => ({ v })),
    map(JStringEscape, v => ({ v })),
  )), str(`'`)), stringInterp),
  map(bracket(str('`'), rep(alt('string part',
    map(read1To('`\\$'), v => ({ v })),
    map(str('\\$', '$$'), () => ({ v: '$' })),
    bracket(str('${'), value, str('}')),
    map(str('$'), v => ({ v })),
    map(JStringUnicode, v => ({ v })),
    map(JStringHex, v => ({ v })),
    map(JStringEscape, v => ({ v })),
  )), str('`')), stringInterp),
);
export const literal = map(alt(JNum, keywords, date), v => ({ v }));

export const sexp = map(bracket(
  check(str('('), ws),
  seq(ident, ws, args),
  check(ws, str(')')),
), ([op, , args]) => {
  const res: Value = { op };
  if (args && args.length) res.args = args;
  return res;
});

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

const call_op = map(seq(read1('abcdefghifghijklmnopqrstuvwzyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_$0123456789'), bracket_op(args)), ([op, args]) => {
  const res: Value = { op };
  if (args && args.length) res.args = args;
  return res;
});

export const operand: Parser<Value> = fmt_op(postfix_path(alt(bracket_op(if_op), verify(bracket_op(binop), v => 'op' in v || `expected bracketed op`), sexp, values)));
export const unop = map(seq(str('not ', '+'), operand), ([op, arg]) => ({ op: op === '+' ? op : 'not', args: [arg] }));

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

export const binop_e = map(seq(operand, rep(seq(rws, str('**'), rws, operand))), ([arg1, more]) => more.length ? rightassoc(arg1, more) : arg1);
export const binop_md = map(seq(binop_e, rep(seq(rws, str('*', '/', '%'), rws, binop_e))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1);
export const binop_as = map(seq(binop_md, rep(seq(rws, str('+', '-'), rws, binop_md))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1);
export const binop_cmp = map(seq(binop_as, rep(seq(rws, str('>=', '>', '<=', '<', 'in', 'like', 'ilike', 'not-in', 'not-like', 'not-ilike', 'contains', 'does-not-contain'), rws, binop_as))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1);
export const binop_eq = map(seq(binop_cmp, rep(seq(rws, str('is', 'is-not', '==', '!='), rws, binop_cmp))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1);
export const binop_and = map(seq(binop_eq, rep(seq(rws, str('and', '&&'), rws, binop_eq))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1);
export const binop_or = map(seq(binop_and, rep(seq(rws, str('or', '||'), rws, binop_and))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1);
binop.parser = binop_or;

if_op.parser = map(seq(str('if'), rws, value, rws, str('then'), rws, value, rep(seq(rws, str('else if', 'elseif', 'elsif', 'elif'), rws, value, rws, str('then'), rws, value)), opt(seq(rws, str('else'), rws, value))), ([,, cond1,,,, val1, elifs, el]) => {
  const op = { op: 'if', args: [cond1, val1] };
  for (const [,,, cond,,,, val] of elifs) op.args.push(cond, val);
  if (el) op.args.push(el[3]);
  return op;
});

function postfix_path(parser: Parser<Value>): Parser<Value> {
  return map(seq(parser, rep(alt<string|Value>(dotpath, bracketpath))), ([v, k]) => {
    if (k.length) return { op: 'get', args: [v, { v: { k } }] };
    else return v;
  });
}

export const operation = alt<Value>(if_op, binop);

const pair: Parser<[Value, Value]> = map(seq(alt(string, map(ident, v => ({ v }))), ws, str(':'), ws, value), t => [t[0], t[4]]);

array.parser = map(bracket(
  check(ws, str('['), ws),
  repsep(value, read1(space + ','), 'allow'),
  check(ws, str(']')),
), args => args.filter(a => !('v' in a)).length ? { op: 'array', args } : { v: args.map(a => (a as Literal).v) });

object.parser = map(bracket(
  check(ws, str('{'), ws),
  repsep(pair, read1(space + ','), 'allow'),
  check(ws, str('}')),
), pairs => pairs.filter(p => !('v' in p[0] && 'v' in p[1])).length ?
  { op: 'object', args: pairs.reduce((a, c) => (a.push(c[0], c[1]), a), []) } : 
  { v: pairs.reduce((a, c) => (a[(c[0] as Literal).v] = (c[1] as Literal).v, a), {}) }
);

value.parser = operation;

const application = map(seq(str('=>'), ws, value), ([, , value]) => ({ a: value }));
args.parser = repsep(value, read1(space + ','), 'allow');

values.parser = alt(array, object, literal, string, application, unop, call_op, ref);

const _parse = makeParser(value);

export function parse(input: string, opts?: ErrorOptions): Value {
  return _parse(input.trim(), Object.assign({ detailed: false, consumeAll: true }, opts));
}

const checkIdent = new RegExp(`[${endRef.split('').map(v => `\\${v}`).join('')}]`);
const opKeys = ['op', 'args'];
export interface StringifyOpts {
  noSymbols?: boolean;
}

let _noSym: boolean = false;
let _key: boolean = false;

export function stringify(value: Value, opts?: StringifyOpts): string {
  opts = opts || {};
  _noSym = opts.noSymbols;
  _key = false;
  return _stringify(value);
}

function fill(char: string, len: number): string {
  let res = '';
  for (let i = 0; i < len; i++) res += char;
  return res;
}

// TODO: output non-s-exps for known ops and conditionals?
function _stringify(value: Value): string {
  if ('r' in value) {
    if (typeof value.r === 'string') return /^[0-9]/.test(value.r) ? `.${value.r}` : value.r;
    else {
      const r = value.r;
      return `${fill('^', r.u || 0)}${r.p || ''}${r.k.map((p, i) => typeof p === 'string' || typeof p === 'number' ? `${i ? '' : '.'}{{p}` : `[${_stringify(p)}]`).join('')}`;
    }
  } else if ('op' in value) {
    if (value.op === 'array') {
      return `[${value.args ? value.args.map(a => _stringify(a)).join(' ') : ''}]`;
    } else if (value.op === 'object' && value.args && !value.args.find((a, i) => i % 2 === 0 && (!('v' in a) || typeof a.v !== 'string'))) {
      let res = '{';
      if (value.args) {
        for (let i = 0; i < value.args.length; i += 2) {
          res += `${i > 0 ? ' ' : ''}${_key = true, _stringify(value.args[i])}:${_key = false, _stringify(value.args[i + 1])}`;
        }
      }
      res += '}';
      return res;
    } else if (value.op === '+' && value.args && value.args.length > 0 && typeof value.args[0] === 'object' && typeof (value.args[0] as any).v === 'string') {
      return `'${value.args.map(a => 'v' in a && typeof a.v === 'string' ? a.v.replace(/[\$']/g, v => `\\${v}`) : `\$\{${_stringify(a)}}`).join('')}'`
    } else {
      return `(${value.op}${value.args && value.args.length ? ` ${value.args.map(v => _stringify(v)).join(' ')}`: ''})`;
    }
  } else if ('a' in value) {
    return `=>${_stringify(value.a)}`;
  } else if ('v' in value) {
    if (typeof value.v === 'string') {
      if ((_key || !_noSym) && !checkIdent.test(value.v) && value.v.length) return `${_key ? '' : ':'}${value.v}`;
      else if (!~value.v.indexOf("'")) return `'${value.v.replace(/[\$']/g, v => `\\${v}`)}'`;
      else if (!~value.v.indexOf('`')) return `\`${value.v.replace(/[\$`]/g, v => `\\${v}`)}\``;
      else if (!~value.v.indexOf('"')) return `"${value.v}"`;
      else return `'${value.v.replace(/['\$]/g, s => `\\${s}`)}'`;
    } else if (typeof value.v === 'number' || typeof value.v === 'boolean') {
      return `${value.v}`;
    } else if (value.v === 'undefined') {
      return 'undefined';
    } else if (value.v === 'null') {
      return 'null';
    } else if (Array.isArray(value.v)) {
      return `[${value.v.map(v => _stringify({ v })).join(' ')}]`;
    } else if (typeof value.v === 'object') {
      if (value.v instanceof Date) {
        return `#${value.v.getFullYear()}-${value.v.getMonth() + 1}-${value.v.getDate()}#`;
      } else {
        const keys = Object.keys(value.v);
        if ((keys.length === 1 && (keys[0] === 'r' || keys[0] === 'v')) || ('op' in value.v && !keys.find(k => !opKeys.includes(k)))) {
          return `%${_stringify(value.v)}`;
        } else {
          return `{${keys.map(k => `${_key = true, _stringify({ v: k })}:${_key = false, _stringify({ v: value.v[k] })}`).join(' ')}}`;
        }
      }
    }
  }
}
