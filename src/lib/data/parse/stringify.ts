import { ValueOrExpr } from '../index';
import { endRef } from '../parse';

const checkIdent = new RegExp(`[${endRef.split('').map(v => `\\${v}`).join('')}]`);
const opKeys = ['op', 'args'];
export interface StringifyOpts {
  noSymbols?: boolean;
}

let _noSym: boolean = false;
let _key: boolean = false;

export function stringify(value: ValueOrExpr, opts?: StringifyOpts): string {
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
function _stringify(value: ValueOrExpr): string {
  if (typeof value === 'string') return value;
  if ('r' in value) {
    if (typeof value.r === 'string') return /^[0-9]/.test(value.r) ? `.${value.r}` : value.r;
    else {
      const r = value.r;
      return `${fill('^', r.u || 0)}${r.p || ''}${r.k.map((p, i) => typeof p === 'string' || typeof p === 'number' ? `${i ? '' : '.'}{{p}` : `[${_stringify(p)}]`).join('')}`;
    }
  } else if ('op' in value) {
    if (value.op === 'array') {
      return `[${value.args ? value.args.map(a => _stringify(a)).join(' ') : ''}]`;
    } else if (value.op === 'object' && value.args && !value.args.find((a, i) => i % 2 === 0 && (typeof a === 'string' || !('v' in a) || typeof a.v !== 'string'))) {
      let res = '{';
      if (value.args) {
        for (let i = 0; i < value.args.length; i += 2) {
          res += `${i > 0 ? ' ' : ''}${_key = true, _stringify(value.args[i])}:${_key = false, _stringify(value.args[i + 1])}`;
        }
      }
      res += '}';
      return res;
    } else if (value.op === '+' && value.args && value.args.length > 0 && typeof value.args[0] === 'object' && typeof (value.args[0] as any).v === 'string') {
      return `'${value.args.map(a => typeof a !== 'string' && 'v' in a && typeof a.v === 'string' ? a.v.replace(/[\$']/g, v => `\\${v}`) : `\$\{${_stringify(a)}}`).join('')}'`
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
