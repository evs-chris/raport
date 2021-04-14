import { ValueOrExpr, Operation, Literal, DateRel, DateRelRange, isDateRel } from '../index';
import { endRef, timespans } from '../parse';

const checkIdent = new RegExp(`[${endRef.split('').map(v => `\\${v}`).join('')}]`);

export type StringifyOpts = SimpleStringifyOpts | SExprStringifyOpts;
export interface BaseStringifyOpts {
  noSymbols?: boolean;
  SExprOps?: boolean;
  listCommas?: boolean;
  template?: boolean;
  noIndent?: boolean;
}
export interface SimpleStringifyOpts extends BaseStringifyOpts {
  SExprOps?: false;
}
export interface SExprStringifyOpts extends BaseStringifyOpts {
  SExprOps: true;
  noArrayLiterals?: boolean;
  noObjectLiterals?: boolean;
}

let _noSym: boolean = false;
let _key: boolean = false;
let _sexprops: boolean = false;
let _listcommas: boolean = false;
let _noarr: boolean = false;
let _noobj: boolean = false;
let _tpl: boolean = false;
let _noindent: boolean = false;

let _level = 0;

const binops = ['**', '*', '/%', '/', '%', '+', '-', '>=', '>', '<=', '<', 'in', 'like', 'ilike', 'not-in', 'not-like', 'not-ilike', 'contains', 'does-not-contain', 'is', 'is-not', '==', '!=', 'and', '&&', 'or', '||'];
const unops = ['+', 'not'];
const precedence = {
  '**': 1,
  '*': 2, '/%': 2, '/': 2, '%': 2,
  '+': 3, '-': 3,
  '>=': 4, '>': 4, '<=': 4, '<': 4, in: 4, like: 4, ilike: 4, 'not-in': 4, 'not-like': 4, 'not-ilike': 4, 'contains': 4, 'does-not-contain': 4,
  'is': 5, 'is-not': 5, '==': 5, '!=': 5,
  'and': 6, '&&': 6,
  'or': 7, '||': 7,
}

const call_op = /^[-a-zA-Z_$0-9]/;

export function stringify(value: ValueOrExpr, opts?: StringifyOpts): string {
  opts = opts || {};
  _noSym = opts.noSymbols;
  _sexprops = opts.SExprOps;
  _listcommas = opts.listCommas;
  _noarr = opts.SExprOps && opts.noArrayLiterals;
  _noobj = opts.SExprOps && opts.noObjectLiterals;
  _key = false;
  _tpl = opts.template;
  _noindent = opts.noIndent;
  _level = 0;
  return _stringify(value);
}

function padl(v: any, pad: string, len: number): string {
  v = `${v}`;
  if (!pad) return v;
  for (let i = v.length; i < len; i++) {
    v = pad + v;
  }
  return v;
}

function fill(char: string, len: number): string {
  let res = '';
  for (let i = 0; i < len; i++) res += char;
  return res;
}

function _stringify(value: ValueOrExpr): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (_tpl && ('op' in value || 'r' in value)) {
    if ('op' in value) {
      if (value.op === 'if' || value.op === 'with' || value.op === 'unless' || value.op === 'each') {
        return stringifyTemplateBlock(value);
      } else if (value.op === 'case') {
        return stringifyTemplateCase(value);
      } else if (value.op) {
        if (value.op === '+') return value.args.map(a => _stringify(a)).join('');
        else {
          _tpl = false;
          const res = `{{${_stringify(value.op === 'string' ? value.args[0] : value)}}}`;
          _tpl = true;
          return res;
        }
      }
    } else {
      _tpl = false;
      const res = `{{${_stringify(value)}}}`;
      _tpl = true;
      return res;
    }
  } else if ('r' in value) {
    if (typeof value.r === 'string') return /^[0-9]/.test(value.r) ? `.${value.r}` : value.r;
    else {
      const r = value.r;
      return `${fill('^', r.u || 0)}${r.p || ''}${r.k.map((p, i) => typeof p === 'string' || typeof p === 'number' ? `${i ? '.' : ''}${p}` : `[${_stringify(p)}]`).join('')}`;
    }
  } else if ('op' in value) {
    return stringifyOp(value);
  } else if ('a' in value) {
    return `=>${_stringify(value.a)}`;
  } else if ('v' in value) {
    return stringifyLiteral(value);
  } else if (isDateRel(value)) {
    return stringifyDate(value);
  }
}

function stringifyBinopArg(op: string, arg: ValueOrExpr, pos: 1|2): string {
  if (op === '**' && pos === 1 && typeof arg !== 'string' && 'op' in arg && arg.op === '**') return `(${_stringify(arg)})`;
  if (typeof arg !== 'string' && 'op' in arg) {
    if (binops.includes(arg.op) && precedence[arg.op] > precedence[op]) return `(${_stringify(arg)})`;
    if (arg.op === 'if' || arg.op === 'unless' || arg.op === 'fmt' || arg.op === 'format') return `(${_stringify(arg)})`;
  }
  return _stringify(arg);
}

function findNestedStringOpL(op: string, value: Operation): boolean {
  if (value.args && value.args.find(a => typeof a === 'object' && typeof (a as any).v === 'string')) return true;
  if (!value.args || !value.args.length) return false;
  const left = value.args[0];
  if (typeof left === 'object' && 'op' in left && left.op === op) return findNestedStringOpL(op, left);
  return false;
}

function flattenNestedBinopsL(op: string, value: Operation, agg: ValueOrExpr[] = []): ValueOrExpr[] {
  if (value.args && value.args.length) {
    let i = 0;
    for (; i < value.args.length; i++) {
      if (typeof value.args[i] === 'object' && typeof (value.args[i] as any).v === 'string') agg.push(value.args[i]);
      else break;
    }
    const left = value.args[i];
    if (typeof left === 'object' && 'op' in left && left.op === op) flattenNestedBinopsL(op, left, agg);
    else agg.push(left);
    agg.push.apply(agg, value.args.slice(i + 1));
  }
  return agg;
}

function stringifyOp(value: Operation): string {
  if (!_noarr && value.op === 'array') {
    return `[${value.args ? value.args.map(a => _stringify(a)).join(_listcommas ? ', ' : ' ') : ''}]`;
  } else if (!_noobj && value.op === 'object' && value.args && !value.args.find((a, i) => i % 2 === 0 && (typeof a === 'string' || !('v' in a) || typeof a.v !== 'string'))) {
    let res = '{';
    if (value.args) {
      for (let i = 0; i < value.args.length; i += 2) {
        res += `${i > 0 ? ' ' : ''}${_key = true, _stringify(value.args[i])}:${_key = false, _stringify(value.args[i + 1])}`;
      }
    }
    res += '}';
    return res;
  } else if (_sexprops) {
    return `(${value.op}${value.args && value.args.length ? ` ${value.args.map(v => _stringify(v)).join(_listcommas ? ', ' : ' ')}`: ''})`;
  } else if (value.op === 'if' || value.op === 'unless' && value.args && value.args.length > 2) {
    return stringifyIf(value);
  } else if (value.op === 'case' && value.args && value.args.length > 2) {
    return stringifyCase(value);
  } else if (value.op === '+' && value.args && value.args.length > 0 && findNestedStringOpL(value.op, value)) {
    const args = flattenNestedBinopsL(value.op, value);
    return `'${args.map(a => typeof a !== 'string' && 'v' in a && typeof a.v === 'string' ? a.v.replace(/[\$']/g, v => `\\${v}`) : `{${_stringify(a)}}`).join('')}'`
  } else if ((value.op === 'fmt' || value.op === 'format') && value.args && typeof value.args[1] === 'object' && 'v' in value.args[1] && typeof value.args[1].v === 'string') {
    const val = value.args[0];
    let vs = _stringify(val);
    if (typeof val !== 'string' && 'op' in val && (binops.includes(val.op) || unops.includes(val.op))) vs = `(${vs})`;
    return `${vs}#${[value.args[1].v].concat(value.args.slice(2).map(a => _stringify(a))).join(',')}`;
  } else if (binops.includes(value.op) && value.args && value.args.length > 1) {
    const arg1 = value.args[0];
    const others = value.args.slice(1);
    return `${stringifyBinopArg(value.op, arg1, 1)} ${value.op} ${others.map(arg2 => stringifyBinopArg(value.op, arg2, 2)).join(` ${value.op} `)}`;
  } else if (unops.includes(value.op) && value.args && value.args.length === 1) {
    const arg = value.args[0];
    if (typeof arg !== 'string' && 'op' in arg && (binops.includes(arg.op) || unops.includes(arg.op))) return `${value.op}(${_stringify(arg)})`;
    else return `${value.op}${call_op.test(value.op) ? ' ' : ''}${_stringify(arg)}`;
  } else if (call_op.test(value.op)) {
    return `${value.op}(${value.args && value.args.map(a => _stringify(a)).join(_listcommas ? ', ' : ' ') || ''})`;
  } else {
    return `(${value.op}${value.args && value.args.length ? ` ${value.args.map(v => _stringify(v)).join(_listcommas ? ', ' : ' ')}`: ''})`;
  }
}

function stringifyLiteral(value: Literal): string {
  if (typeof value.v === 'string') {
    if (_tpl) return value.v;
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
    if (_noarr) return `(array${value.v.length ? ' ' : ''}${value.v.map(v => _stringify({ v })).join(_listcommas ? ', ': ' ')})`;
    return `[${value.v.map(v => _stringify({ v })).join(_listcommas ? ', ' : ' ')}]`;
  } else if (typeof value.v === 'object') {
    if (isDateRel(value.v)) {
      return stringifyDate(value.v);
    } else {
      const keys = Object.keys(value.v);
      return `{${keys.map(k => `${_key = true, _stringify({ v: k })}:${_key = false, _stringify({ v: value.v[k] })}`).join(_listcommas ? ', ' : ' ')}}`;
    }
  }
}

function offsetToTimezone(dir: 1|-1, offset?: number): string {
  if (offset == null) return '';
  offset = offset * dir;
  const o = Math.abs(offset);
  const h = Math.floor(o / 60);
  const m = o % 60;
  if (!offset) return 'Z';
  else return `${offset > 0 ? '-' : '+'}${h}${m ? `:${padl(m, '0', 2)}` : ''}`;
}

const spanKeys = ['w', 'd', 'h', 'mm', 's'];
const spanExact = ['y', 'm', 'd', 'h', 'mm', 's', 'ms'];
function stringifyDate(value: DateRel): string {
  let str = '';
  if (value instanceof Date) { // date object
    const y = value.getFullYear();
    const m = value.getMonth() + 1;
    const d = value.getDate();
    const h = value.getHours();
    const mn = value.getMinutes();
    const s = value.getSeconds();
    const ms = value.getMilliseconds();
    str = `${y}-${padl(m, '0', 2)}-${padl(d, '0', 2)}`;
    if (h + mn + s + ms > 0) {
      str += ` ${padl(h, '0', 2)}:${padl(mn, '0', 2)}`;
      if (s + ms > 0) {
        str += `:${padl(s, '0', 2)}`;
        if (ms > 0) str += `.${padl(ms, '0', 3)}`;
      }
    }
    return `#${str}${offsetToTimezone(1, value.getTimezoneOffset())}#`;
  } else if (Array.isArray(value.f)) { // precise date
    const a = value.f;
    str = `${a[0]}`;
    if (a[1] != null) str += `-${padl(a[1] + 1, '0', 2)}`;
    if (a[2] != null) str += `-${padl(a[2], '0', 2)}`;
    if (a[3] != null) str += ` ${padl(a[3], '0', 2)}`;
    if (a[4] != null) str += `:${padl(a[4], '0', 2)}`;
    if (a[5] != null) str += `:${padl(a[5], '0', 2)}`;
    if (a[6] != null) str += `.${padl(a[6], '0', 3)}`;
    if (a[7] != null) str += ` ${offsetToTimezone(-1, a[7])}`;
    if ('e' in value && value.e) str += '<';
    return `#${str}#`;
  } else if (value.f === 'n') { // relative point in time
    if (Array.isArray(value.o)) { // inconsistent units
      spanExact.forEach((k, i) => {
        if (value.o[i] != null) str += `${value.o[i]}${k}`;
      });
      str += `${'d' in value && value.d === -1 ? ' ago' : ' from now'}${offsetToTimezone(-1, value.z)}`;
      return `#${str}#`;
    } else if (typeof value.o === 'number') { // milliseconds
      let rem = Math.abs(value.o);
      spanKeys.forEach(k => {
        const t = Math.floor(rem / timespans[k]);
        rem = rem % timespans[k];
        if (t) str += `${t}${k}`;
      });
      if (rem) str += `${rem}ms`;
      return `#${str}${value.o < 0 ? ' ago' : ' from now'}${offsetToTimezone(-1, value.z)}#`;
    }
  } else if ('d' in value && value.d === 1 && value.o === 0) { // span to date
    str = `#${value.f === 'w' ? 'week' : value.f === 'm' ? 'month' : 'year'} to date${offsetToTimezone(-1, value.z)}${value.e && '>' || ''}#`;
  } else if ('t' in value && Array.isArray(value.t)) { // time on relative day
    const a = value.t;
    str = `${value.o < 0 ? 'yesterday' : value.o > 0 ? 'tomorrow' : 'today'} at `;
    if (!a[0] && !a[1] && !a[2] && !a[3]) str += 'midnight';
    else if (a[0] === 12 && !a[1] && !a[2] && !a[3]) str += 'noon';
    else {
      str += a[0];
      if (a[1] != null) str += `:${padl(a[1], '0', 2)}`;
      if (a[2] != null) str += `:${padl(a[2], '0', 2)}`;
      if (a[3] != null) str += `.${padl(a[3], '0', 3)}`;
    }
    return `#${str}${offsetToTimezone(-1, a[4])}${value.e ? '>' : ''}#`;
  } else if (!('t' in value) && !('d' in value) && !Array.isArray(value.f)) { // relative span
    const v = value as DateRelRange;
    if (v.f === 'd') {
      str += `${v.o < 0 ? 'yesterday' : v.o > 0 ? 'tomorrow' : 'today'}`;
    } else {
      str += `${v.o < 0 ? 'last' : v.o > 0 ? 'next' : 'this'} ${v.f === 'w' ? 'week' : v.f === 'm' ? 'month' : 'year'}`;
    }
    return `#${str}${offsetToTimezone(-1, v.z)}${v.e ? '>' : ''}#`;
  }

  return str;
}

const leadingSpace = /^\s+/;
function dedent(target: string, str: string): string {
  if (target) return str.replace(leadingSpace, '');
  else return str;
}

function stringifyIf(op: Operation): string {
  if (!op.args || op.args.length < 2) return 'false';

  let str = '';

  _level++;
  const parts = op.args.map(a => _stringify(a));
  _level--;

  const long = parts.find(p => p.length > 30 || ~p.indexOf('\n')) || '';
  let split = _noindent ? '' : parts.length > 3 || long ? `\n${padl('', '  ', _level)}` : '';
  const cindent = long && `${split}  ` || ' ';
  split = split || ' ';
  const last = parts.length - 1;
  for (let i = 0; i <= last; i++) {
    if (i === 0) str += `${split && _level > 0 ? split : ''}if ${parts[i++]} then${cindent}${dedent(cindent, parts[i])}`
    else if (i === last) str += `${split}else${cindent}${dedent(cindent, parts[i])}`
    else str += `${split}elif ${parts[i++]} then${cindent}${dedent(cindent, parts[i])}`;
  }
  if (_level) str += `${split}end`;

  return str;
}

const caseRE = /@case\b/g;
function stringifyCase(op: Operation): string {
  if (!op.args || op.args.length < 2) return 'false';

  let str = '';

  _level++;
  const parts = op.args.map(a => typeof a === 'object' && 'op' in a ? _stringify(a).replace(caseRE, '_') : _stringify(a));
  _level--;

  const long = parts.find(p => p.length > 30 || ~p.indexOf('\n')) || '';
  let split = _noindent ? '' : parts.length > 3 || long ? `\n${padl('', '  ', _level)}` : '';
  const wsplit = split ? `${split}  ` : ' ';
  const cindent = long && `${wsplit}  ` || ' ';
  split = split || ' ';
  const last = parts.length - 1;
  for (let i = 0; i <= last; i++) {
    if (i === 0) str += `${split && _level > 0 ? split : ''}case ${parts[i]}`
    else if (i === last) str += `${wsplit}else${cindent}${dedent(cindent, parts[i])}`
    else str += `${wsplit}when ${parts[i++]} then${cindent}${dedent(cindent, parts[i])}`;
  }
  if (_level) str += `${split}end`;

  return str;
}

function stringifyTemplateBlock(op: Operation): string {
  _tpl = false;
  const cond = _stringify(op.args[0]);
  _tpl = true;
  const first = _stringify(op.args[1]);
  let res = `{{${op.op} ${cond}}}${op.op === 'with' || op.op === 'each' ? first.slice(2) : first}`;
  if (op.op === 'unless') return `${res}{{/}}`;
  for (let i = 2; i < op.args.length; i++) {
    if (i + 1 >= op.args.length) {
      const arg = op.args[i];
      if (typeof arg === 'object' && 'v' in arg && arg.v === '') continue;
      else res += `{{else}}${_stringify(arg)}`;
    } else {
      _tpl = false;
      res += `{{elseif ${_stringify(op.args[i++])}}}`;
      _tpl = true;
      res += _stringify(op.args[i]);
    }
  }
  res += '{{/}}';
  return res;
}

function stringifyTemplateCase(op: Operation): string {
  const last = op.args.length - 1;
  const parts = op.args.map((a, i) => {
    _tpl = true;
    if (i === 0 || i % 2 === 1) _tpl = false;
    if (i === last) _tpl = true;
    return typeof a === 'object' && 'op' in a ? _stringify(a).replace(caseRE, '_') : _stringify(a);
  });
  _tpl = true;
  let res = `{{${op.op} ${parts[0]} when ${parts[1]}}}`;
  for (let i = 2; i <= last; i++) {
    if (i === last) res += `{{else}}${parts[i]}`;
    else if (i % 2 === 1) res += `{{when ${parts[i]}}}`;
    else res += parts[i];
  }
  res += '{{/}}';
  return res;
}
