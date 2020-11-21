import { parser as makeParser, Parser, bracket, opt, alt, seq, str, map, read, chars, rep1sep, repsep, read1To, read1, skip1, rep, check, verify, ErrorOptions } from 'sprunge/lib';
import { ws, digits, JNum, JStringEscape, JStringUnicode, JStringHex } from 'sprunge/lib/json';
import { Value, Operation, Literal } from './index';

const space = ' \r\n\t';
const sigils = '!@*~.';
const endSym = space + '():{}[]';
const endRef = endSym + ',"\'`\\;&#';

export const keywords = map<string, any>(str('null', 'true', 'false', 'undefined'), v => {
  switch (v) {
    case 'null': return null;
    case 'true': return true;
    case 'false': return false;
    case 'undefined': return undefined;
  }
});

export const ident = read1To(endRef, true);

export const ref = map(seq(read('^'), opt(chars(1, sigils)), rep1sep(read1To(endRef + '.=><', true), str('.'), 'path part', 'disallow')), v => ({ r: v[0] + (v[1] === '.' ? '' : (v[1] || '')) + v[2].join('.') }));

export const args: Parser<Value[]> = {};
export const array: Parser<Value> = {};
export const object: Parser<Value> = {};
export const value: Parser<Value> = {};
export const values: Parser<Value> = {};
export const tpl: Parser<Value> = {};

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

export const date = map(seq(
  str('#'),
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
  str('#'),
), v => {
  const time = v[6];
  const ss = time && time[4];
  const ms = ss && ss[2];
  const offset = v[7];
  if (offset) {
    const dt = new Date(Date.UTC(+v[1], +v[3] - 1, +v[5], time && +time[2] || 0, time && +time[3] || 0, ss && +ss[1] || 0, ms && +ms[1]));
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
    return new Date(+v[1], +v[3] - 1, +v[5], time && +time[2] || 0, time && +time[3] || 0, ss && +ss[1] || 0, ms && +ms[1]);
  }
});

export const string = alt<Value>(
  map(seq(str(':'), ident), v => ({ v: v[1]})),
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

export const fn_args = map(seq(
  opt(seq(str('+'), value)), ws,
  opt(seq(str('=>'), ws, value)), ws,
  opt(seq(str('&('), verify(args, args => (!!args.length || 'expected at least one local argument')), str(')'))), ws,
  args
), ([src, , apply, , locals, , args]) => {
  const op: Operation = { op: '' };
  if (src) op.source = src[1];
  if (apply) op.apply = apply[2];
  if (locals && locals[1].length) op.locals = locals[1];
  if (args && args.length) op.args = args;
  return op;
});

export const sexp = map(bracket(
  check(str('('), ws),
  seq(ident, ws, fn_args),
  check(ws, str(')')),
), ([op, , val]) => {
  val.op = op;
  return val;
});

function fmt_op(parser: Parser<Value>): Parser<Value> {
  return map(seq(parser, opt(seq(str('#'), ident, opt(str(',')), repsep(value, str(','))))), ([value, fmt]) => {
    if (!fmt) return value;
    return { op: 'fmt', args: [value, { v: fmt[1] }, ...fmt[3]] };
  });
}

function bracket_op<T>(parser: Parser<T>): Parser<T> {
  return bracket(seq(str('('), ws), parser, seq(ws, str(')')));
}

export const binop: Parser<Value> = {};

const call_op = map(seq(read1('abcdefghifghijklmnopqrstuvwzyz-_'), bracket_op(fn_args)), ([op, val]) => {
  val.op = op;
  return val;
});

export const operand: Parser<Value> = fmt_op(alt(values, verify(bracket_op(binop), v => 'op' in v || `expected bracketed op`)));
export const unop = map(seq(str('not ', '+'), operand), ([op, arg]) => ({ op: op === '+' ? op : 'not', args: [arg] }));

function leftassoc(left: Value, [, op, , right]: [string, string, string, Value]) {
  return { op, args: [left, right] };
}

const rws = skip1(space);
export const binop_md = map(seq(operand, rep(seq(rws, str('*', '/', '%'), rws, operand))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1);
export const binop_as = map(seq(binop_md, rep(seq(rws, str('+', '-'), rws, binop_md))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1);
export const binop_cmp = map(seq(binop_as, rep(seq(rws, str('>', '>=', '<', '<=', 'in', 'like', 'ilike', 'not-in', 'not-like', 'not-ilike', 'contains', 'does-not-contain'), rws, binop_as))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1);
export const binop_eq = map(seq(binop_cmp, rep(seq(rws, str('is', 'is-not'), rws, binop_cmp))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1);
export const binop_or = map(seq(binop_eq, rep(seq(rws, str('or'), rws, binop_eq))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1);
export const binop_and = map(seq(binop_or, rep(seq(rws, str('and'), rws, binop_or))), ([arg1, more]) => more.length ? more.reduce(leftassoc, arg1) : arg1);
binop.parser = binop_and;

const if_op = map(seq(str('if'), rws, value, rws, str('then'), rws, value, rep(seq(rws, str('else if', 'elseif', 'elsif', 'elif'), rws, value, rws, str('then'), rws, value)), opt(seq(rws, str('else'), rws, value))), ([,, cond1,,,, val1, elifs, el]) => {
  const op = { op: 'if', args: [cond1, val1] };
  for (const [,,, cond,,,, val] of elifs) op.args.push(cond, val);
  if (el) op.args.push(el[3]);
  return op;
});

export const operation = alt<Value>(alt(fmt_op(bracket_op(if_op)), if_op), binop, fmt_op(sexp));

export const expr = map(seq(str('%'), value), v => ({ v: v[1] }));

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

value.parser = alt(operation, array, object, literal, string, expr, ref);

values.parser = alt(unop, call_op, array, object, literal, string, expr, ref);

args.parser = repsep(value, read1(space + ','), 'allow');

const _parse = makeParser(value);

export function parse(input: string, opts?: ErrorOptions): Value {
  return _parse(input.trim(), Object.assign({ detailed: false, consumeAll: true }, opts));
}

const checkIdent = new RegExp(`[${endRef.split('').map(v => `\\${v}`).join('')}]`);
const opKeys = ['op', 'source', 'apply', 'locals', 'args'];
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

// TODO: output non-s-exps for known ops and conditionals?
function _stringify(value: Value): string {
  if ('r' in value) {
    return /^[0-9]/.test(value.r) ? `.${value.r}` : value.r;
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
      return `(${value.op}${'source' in value ? ` +${_stringify(value.source)}` : ''}${'apply' in value ? ` =>${_stringify(value.apply)}` : ''}${'locals' in value ? ` &(${value.locals.map(v => _stringify(v)).join(' ')})` : ''}${value.args && value.args.length ? ` ${value.args.map(v => _stringify(v)).join(' ')}`: ''})`;
    }
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
