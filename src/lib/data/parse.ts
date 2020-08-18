import { parser as makeParser, Parser, bracket, opt, alt, seq, str, map, read, chars, rep1sep, repsep, read1To, read1, rep, check, verify, ErrorOptions } from 'sprunge/lib';
import { ws, JNum, JStringEscape, JStringUnicode, JStringHex } from 'sprunge/lib/json';
import { Value, Operation, Literal } from './index';

const space = ' \r\n\t';
const sigils = '!@#+';
const endSym = space + '():{}[]';
const endRef = endSym + ',"\'`\\;&';

export const keywords = map<string, any>(str('null', 'true', 'false', 'undefined'), v => {
  switch (v) {
    case 'null': return null;
    case 'true': return true;
    case 'false': return false;
    case 'undefined': return undefined;
  }
});

export const ident = read1To(endRef, true);

export const ref = map(seq(read('^'), opt(chars(1, sigils)), rep1sep(read1To(endRef + '.=><', true), str('.'), 'path part', 'disallow')), v => ({ r: v[0] + (v[1] || '') + v[2].join('.') }));

export const args: Parser<Value[]> = {};
export const array: Parser<Value> = {};
export const object: Parser<Value> = {};
export const value: Parser<Value> = {};
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

  if (res.length === 1) return res[0];
  return { op: '+', args: res };
}

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
export const literal = map(alt(JNum, keywords), v => ({ v }));
export const operation = map(bracket(
  check(str('('), ws),
  seq(ident, ws, opt(seq(str('+'), value)), ws, opt(seq(str('=>'), ws, value)), ws, opt(seq(str('&('), verify(args, args => (!!args.length || 'expected at least one local argument')), str(')'))), ws, args),
  check(ws, str(')')),
), ([op, , src, , apply, , locals, , args]) => {
  const res: Operation = { op };
  if (src) res.source = src[1];
  if (apply) res.apply = apply[2];
  if (locals && locals[1].length) res.locals = locals[1];
  if (args && args.length) res.args = args;
  return res;
});

export const expr = map(seq(str('%'), value), v => ({ v: v[1] }));

const pair: Parser<[Value, Value]> = map(seq(alt(string, map(ident, v => ({ v }))), ws, str(':'), ws, value), t => [t[0], t[4]]);

array.parser = map(bracket(
  check(ws, str('['), ws),
  repsep(value, read1(space + ','), 'allow'),
  check(ws, str(']'), ws),
), args => args.filter(a => !('v' in a)).length ? { op: 'array', args } : { v: args.map(a => (a as Literal).v) });

object.parser = map(bracket(
  check(ws, str('{'), ws),
  repsep(pair, read1(space + ','), 'allow'),
  check(ws, str('}'), ws),
), pairs => pairs.filter(p => !('v' in p[0] && 'v' in p[1])).length ?
  { op: 'object', args: pairs.reduce((a, c) => (a.push(c[0], c[1]), a), []) } : 
  { v: pairs.reduce((a, c) => (a[(c[0] as Literal).v] = (c[1] as Literal).v, a), {}) }
);

value.parser = alt(operation, array, object, literal, string, expr, ref);

args.parser = repsep(value, read1(space + ','), 'allow');

const _parse = makeParser(value);

export function parse(input: string, opts?: ErrorOptions): Value {
  return _parse(input.trim(), Object.assign({ detailed: false, consumeAll: true }, opts));
}

const checkIdent = new RegExp(endRef);
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

function _stringify(value: Value): string {
  if ('r' in value) {
    return value.r;
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
      if ((_key || !_noSym) && !checkIdent.test(value.v)) return `${_key ? '' : ':'}${value.v}`;
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
      const keys = Object.keys(value.v);
      if ((keys.length === 1 && (keys[0] === 'r' || keys[0] === 'v')) || !keys.find(k => !opKeys.includes(k))) {
        return `%${_stringify(value.v)}`;
      } else {
        return `{${keys.map(k => `${_key = true, _stringify({ v: k })}:${_key = false, _stringify({ v: value.v[k] })}`).join(' ')}}`;
      }
    }
  }
}
