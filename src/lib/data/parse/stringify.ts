import { ValueOrExpr, Operation, Literal, DateRel, DateRelRange, isDateRel } from '../index';
import { endRef, timespans } from '../parse';

const checkIdent = new RegExp(`[${endRef.split('').map(v => `\\${v}`).join('')}]`);

export type StringifyOpts = SimpleStringifyOpts | SExprStringifyOpts;
export interface BaseStringifyOpts {
  /** Disable the use of symbol style :strings. */
  noSymbols?: boolean;
  /** Render all operations as s-expressions rather than sugary raport expressions. */
  SExprOps?: boolean;
  /** Enable comma separators in lists of values. */
  listCommas?: boolean;
  /** Whether to wrap lists of items. `true` wraps every item. A number targets that many characters in the output to cause a wrap. The default is 60 chars. */
  listWrap?: boolean|number;
  /** Output template formatted expressions. */
  template?: boolean;
  /** Output unindented single line expressions. */
  noIndent?: boolean;
}
export interface SimpleStringifyOpts extends BaseStringifyOpts {
  /** Render all operations as s-expressions rather than sugary raport expressions. */
  SExprOps?: false;
}
export interface SExprStringifyOpts extends BaseStringifyOpts {
  /** Render all operations as s-expressions rather than sugary raport expressions. */
  SExprOps: true;
  /** Output array function calls rather than sugared array literals. */
  noArrayLiterals?: boolean;
  /** Output object function calls rather than sugared object literals. */
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
let _listwrap: number = 60;

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
  _listwrap = 'listWrap' in opts ? (!opts.listWrap ? 0 : opts.listWrap === true ? 1 : opts.listWrap) : 60;
  if (!_sexprops && typeof value === 'object' && 'op' in value && value.op === 'block') return stringifyRootBlock(value);
  else return _stringify(value);
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
    if ('n' in value) return `|${value.n.join(_listcommas ? ', ' : ' ')}| => ${_stringify(value.a)}`;
    else return `=>${_stringify(value.a)}`;
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
    if (arg.op === 'if' || arg.op === 'unless' || arg.op === 'case' || arg.op === 'fmt' || arg.op === 'format') return `(${_stringify(arg)})`;
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
    return wrapArgs('[', value.args, ']');
  } else if (!_noobj && value.op === 'object' && value.args && !value.args.find((a, i) => i % 2 === 0 && (typeof a === 'string' || !('v' in a) || typeof a.v !== 'string'))) {
    if (!value.args || !value.args.length) return '{}';
    return wrapArgs('{', value.args, '}', 2);
  } else if (_sexprops) {
    if (!value.args || !value.args.length) return `(${value.op})`;
    return wrapArgs(`(${value.op} `, value.args, ')');
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
  } else if (value.op === 'block') {
    if (!value.args || !value.args.length) return '';

    _level++;
    const parts = value.args.map(a => _stringify(a));
    let split = _noindent ? '' : `\n${padl('', '  ', _level)}`;
    _level--;
    if (parts.length === 1 && !~parts[0].indexOf('\n')) return `{ ${parts[0]} }`;
    return `{${split}${parts.join(split)}\n${padl('', '  ', _level)}}`;
  } else if ((value.op === 'let' || value.op === 'set') && value.args && value.args.length === 2) {
    let path: string;
    let arg = value.args[0];
    if (typeof arg === 'string') path = arg;
    else if ('v' in arg && typeof arg.v === 'string') path = arg.v;
    else if ('v' in arg && typeof arg.v === 'object' && 'k' in arg.v) path = _stringify({ r: arg.v });
    else path = _stringify(arg);
    return `${value.op} ${path} = ${_stringify(value.args[1])}`;
  } else if (call_op.test(value.op)) {
    return wrapArgs(`${value.op}(`, value.args || [], ')');
  } else {
    if (!value.args || !value.args.length) return `(${value.op})`;
    return wrapArgs(`(${value.op} `, value.args, ')');
  }
}

function stringifyRootBlock(block: Operation): string {
  if (!block.args || !block.args.length) return '';
  return block.args.map(a => _stringify(a)).join('\n');
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
const allLeadingSpace = /^\s+/gm;
function outdentAll(amount: string, str: string): string {
  if (amount) return str.replace(allLeadingSpace, s => s.substr(amount.length));
  else return str;
}

function wrapArgs(open: string, args: ValueOrExpr[], close: string, keyMod?: number): string {
  if (!args || !args.length) return `${open}${close}`;
  _level++;
  let parts: string[];
  if (keyMod) {
    parts = [];
    for (let i = 0; i < args.length; i++) {
      if (i % keyMod === 0) {
        _key = true;
        parts.push(_stringify(args[i]) + ':');
        _key = false;
      } else {
        _level++;
        const res = _stringify(args[i]);
        if (res[0] === '\n')  parts[parts.length - 1] += ' ' + res.replace(leadingSpace, '');
        else parts[parts.length - 1] += res;
        _level--;
      }
    }
  } else {
    parts = args.map(a => _stringify(a));
  }
  _level--;

  let join = _listcommas ? ', ' : ' ';
  if (_noindent || (parts.length == 1 && !~parts[0].indexOf('\n'))) return `${open}${parts.join(join)}${close}`;
  let wrap = _listwrap;
  const base = parts.join(_listcommas ? ', ' : ' ');
  if (!wrap && ~base.indexOf('\n')) wrap = 1;
  if (wrap === 1 && _listcommas) join = ',\n';

  const level = padl('', '  ', _level);

  if (!wrap) return `${open}${base}${close}`;
  else if (wrap === 1) return `${open}\n${parts.map(p => `${level}  ${p}`).join(join)}\n${level}${close}`;
  if (base.length <= wrap) return `${open}${base}${close}`;

  let res = `${open}`;
  let str = '';
  const last = parts.length - 1;
  for (let i = 0; i < parts.length; i++) {
    if (~parts[i].indexOf('\n')) {
      if (str) res += str;
      res += `\n${level}  ${parts[i]}${i !== last ? join : ''}`;
      str = '';
      continue;
    }
    if (!str) str += `\n${level}  `;
    str += `${parts[i]}${i !== last ? join : ''}`;
    if (str.length >= wrap) {
      res += str;
      str = '';
    }
  }
  if (str) res += str;
  return `${res}\n${level}${close}`;
}

function isBlock(v: any): boolean {
  return typeof v === 'object' && 'op' in v && v.op === 'block';
}

function stringifyIf(op: Operation): string {
  if (!op.args || op.args.length < 2) return 'false';

  let str = '';

  const last = op.args.length - 1;
  const block = !!op.args.find((p, i) => (i % 2 === 1 || i === last) && isBlock(p));

  _level++;
  const parts = op.args.map((a, i) => _stringify(block && (i % 2 === 1 || i === last) && !isBlock(a) ? { op: 'block', args: [a] } : a));
  _level--;

  const long = parts.find(p => p.length > 30 || ~p.indexOf('\n')) || '';
  let split = _noindent ? '' : parts.length > 3 || long ? `\n${padl('', '  ', _level)}` : '';
  const cindent = long && `${split}  ` || ' ';
  split = split || ' ';
  for (let i = 0; i <= last; i++) {
    if (i === 0) {
      if (block) str += `if ${parts[i++]} ${outdentAll('  ', parts[i]).trimLeft()}`;
      else {
        const cond = parts[i++];
        str += `if ${cond}${~cond.indexOf('\n') ? split : ' '}then${cindent}${parts[i].trimLeft()}`
      }
    } else if (i === last) {
      if (block) str = str.trimRight() + ` else ${outdentAll('  ', parts[i]).trimLeft()}`;
      else str += `${split}else${cindent}${parts[i].trimLeft()}`;
    } else {
      if (block) str = str.trimRight() + ` elif ${parts[i++]} ${outdentAll('  ', parts[i]).trimLeft()}`;
      else str += `${split}elif ${parts[i++]} then${cindent}${parts[i].trimLeft()}`;
    }
  }
  if (!block && _level) str += `${split}end`;

  return str;
}

const caseRE = /@case\b/g;
function stringifyCase(op: Operation): string {
  if (!op.args || op.args.length < 2) return 'false';

  let str = '';

  const last = op.args.length - 1;
  const block = !!op.args.find((p, i) => ((i > 1 && i % 2 === 0) || i === last) && isBlock(p));

  _level++;
  const parts = op.args.map((a, i) => {
    let res: string;
    if (i !== 0) _level++;

    if (block && (i > 1 && i % 2 === 0 || i === last)) {
      res = _stringify(isBlock(a) ? a : { op: 'block', args: [a] });
    } else if (i % 2 === 0 || i === last) {
      res = typeof a === 'object' && 'op' in a ? _stringify(a).replace(caseRE, '_') : _stringify(a);
    }
    res = typeof a === 'object' && 'op' in a ? _stringify(a).replace(caseRE, '_') : _stringify(a);

    if (i !== 0)_level--;

    return res;
  });
  _level--;

  const long = parts.find(p => p.length > 30 || ~p.indexOf('\n')) || '';
  let split = _noindent ? '' : parts.length > 3 || long ? `\n${padl('', '  ', _level)}` : '';
  const wsplit = split ? `${split}  ` : ' ';
  const cindent = long && `${wsplit}  ` || ' ';
  split = split || ' ';
  for (let i = 0; i <= last; i++) {
    if (i === 0) {
      if (block) str += `case ${parts[i]}`;
      else str += `case ${parts[i]}`
    } else if (i === last) {
      if (block) str = str.trimRight() + wsplit + `else ${outdentAll('  ', parts[i]).trimLeft()}`;
      else str += `${wsplit}else${cindent}${parts[i].trimLeft()}`
    } else {
      if (block) str = str.trimRight() + wsplit + `when ${parts[i++]} ${outdentAll('  ', parts[i]).trimLeft()}`;
      else {
        const cond = parts[i++];
        str += `${wsplit}when ${cond}${~cond.indexOf('\n') ? wsplit : ' '}then${cindent}${parts[i].trimLeft()}`;
      }
    }
  }
  if (!block && _level) str += `${split}end`;

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
