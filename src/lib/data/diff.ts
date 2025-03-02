import { parseDate } from './parse';
import { dateRelToDate } from './index';

export function join(...strs: string[]): string {
  return strs.filter(s => s).join('.');
}

export interface Diff {
  [path: string]: [any, any];
}

const looseEqual = (v1: any, v2: any) => v1 == v2;
const strictEqual = (v1: any, v2: any) => v1 === v2;
const isNum = /^[\d.]+$/;
const trueStrings = /^(true|on|yes)$/i;
const falseStrings = /^(false|off|no)$/i;
const sqlEqual = (v1: any, v2: any) => {
  let tmp1: any, tmp2: any;
  if ((typeof v1 === 'number' || typeof v1 === 'string' && isNum.test(v1)) && (typeof v2 === 'number' || typeof v2 === 'string' && isNum.test(v2))) {
    return +v1 === +v2;
  } else if ((typeof v1 === 'boolean' || typeof v2 === 'boolean') && (typeof v1 === 'string' || typeof v2 === 'string')) {
    return trueStrings.test(v1) && trueStrings.test(v2) || falseStrings.test(v1) && falseStrings.test(v2);
  } else if ((v1 instanceof Date || typeof v1 === 'string' && Array.isArray((tmp1 = parseDate(v1) as any)?.f)) && (v2 instanceof Date || typeof v2 === 'string' && Array.isArray((tmp2 = parseDate(v2) as any)?.f))) {
    if (tmp1) tmp1 = dateRelToDate(tmp1);
    else tmp1 = v1;
    if (tmp2) tmp2 = dateRelToDate(tmp2);
    else tmp2 = v2;
    return +tmp1 === +tmp2;
  }

  else return v1 == v2;
};

type Identifier = true|string|((v: any) => any);
export interface IdentityMap {
  [path: string]: Identifier;
}

type EqualizerValue = 'strict'|'loose'|'sql'|((v1: any, v2: any) => boolean);
interface EqualizerOptions {
  type?: EqualizerValue;
  /** A map of identity methods to use when comparing elements within an array, making arrays act as a set */
  identity?: IdentityMap;
}
type Equalizer = EqualizerOptions | EqualizerValue;

const fullnum = /^\d+$/;
function checkIdentity(map: IdentityMap, path: string) {
  const p = path.split('.').reduce((a, c) => fullnum.test(c) ? `${a}[]` : `${a}${a.length ? '.' : ''}${c}`, '');
  return map[`${p}[]`];
}

export interface DiffOpts {
  equal?: Equalizer;
  keys?: 'all'|'common';
}

export function diff(v1: any, v2: any, opts?: DiffOpts): Diff {
  const type = opts?.equal && typeof opts.equal === 'object' ? opts.equal.type : opts?.equal;
  const eq = typeof type === 'function' ? type : type === 'strict' ? strictEqual : type === 'sql' ? sqlEqual : looseEqual;
  return _diff(v1, v2, '', {}, eq, typeof opts?.equal === 'object' ? opts?.equal.identity : undefined, opts?.keys || 'all');
}

function _diff(v1: any, v2: any, path: string, diff: Diff, equal: (v1: any, v2: any) => boolean, ident?: IdentityMap, keyMode?: 'all'|'common'): Diff {
  if (typeof v1 !== 'object' || typeof v2 !== 'object') {
    if (v1 === v2) return diff;
    diff[path] = [v1, v2];
    return diff;
  }

  let id: Identifier;
  if (Array.isArray(v1) && Array.isArray(v2) && ident && (id = checkIdentity(ident, path))) {
    const v1ids = v1.map(v => id === true ? v : typeof id === 'string' ? (v && (typeof v === 'object' || typeof v === 'function') ? v[id] : v) : id(v));
    const v2ids = v2.map(v => id === true ? v : typeof id === 'string' ? (v && (typeof v === 'object' || typeof v === 'function') ? v[id] : v) : id(v));
    for (let i = 0; i < v1ids.length; i++) {
      const idx = v2ids.indexOf(v1ids[i]);
      if (~idx) {
        const vv1 = v1[i];
        const vv2 = v2[idx];

        if (vv1 === vv2) continue;
        else if (typeof vv1 === 'object' && typeof vv2 === 'object') _diff(vv1, vv2, join(path, `${i}`), diff, equal, ident);
        else if (!equal(vv1, vv2)) diff[join(path, `${i}`)] = [vv1, vv2];
      } else diff[join(path, `${i}`)] = [v1[i], undefined];
    }

    const found = v1ids.slice();
    for (let i = 0; i < v1ids.length; i++) {
      if (~found.indexOf(v2ids[i])) continue;
      diff[join(path, `${i + found.length}`)] = [undefined, v2[i]];
    }
  } else {
    const _v1 = v1 || {};
    const _v2 = v2 || {};
    const ks: string[] = [];
    if (keyMode === 'common') {
      for (const k of Object.keys(_v1)) if (k in _v2) ks.push(k);
    } else {
      ks.push.apply(ks, Object.keys(_v1));
      for (const k of Object.keys(_v2)) if (!~ks.indexOf(k)) ks.push(k);
    }

    for (const k of ks) {
      const vv1 = _v1[k];
      const vv2 = _v2[k];

      if (vv1 === vv2) continue;
      else if (typeof vv1 === 'object' && typeof vv2 === 'object') _diff(vv1, vv2, join(path, k), diff, equal, ident);
      else if (!equal(vv1, vv2)) diff[join(path, k)] = [vv1, vv2];
    }
  }

  return diff;
}

export function deepEqual(v1: any, v2: any, equal?: EqualizerValue): boolean {
  const eq = typeof equal === 'function' ? equal : equal === 'strict' ? strictEqual : equal === 'sql' ? sqlEqual : looseEqual;
  return _deepEqual(v1, v2, eq);
}

function _deepEqual(v1: any, v2: any, equal: (v1: any, v2: any) => boolean): boolean {
  if (typeof v1 !== 'object' || typeof v2 !== 'object') return equal(v1, v2);
  if ((!v1 || !v2) && v1 != v2) return false; // eslint-ignore-line eqeqeq

  const ks = Object.keys(v1 || {});
  for (const k of Object.keys(v2 || {})) if (!~ks.indexOf(k)) ks.push(k);

  for (const k of ks) {
    const vv1 = v1[k];
    const vv2 = v2[k];

    if (vv1 === vv2) continue;
    else if (typeof vv1 === 'object' && typeof vv2 === 'object') {
      if (!_deepEqual(vv1, vv2, equal)) return false;
    } else if (!equal(vv1, vv2)) return false;
  }

  return true;
}

export interface LabelOptions {
  /** Omit keys in the original diff that aren't in the label. */
  omit?: boolean;
}

export function labelDiff(diff: Diff, label: any, opts?: LabelOptions): Diff {
  const out: Diff = opts?.omit ? {} : Object.assign({}, diff);
  _labelDiff(diff, label, '', '', out, opts);
  return out;
}

const num = /^\d+/;
function _labelDiff(diff: Diff, label: any, path: string, str: string, out: Diff, opts?: LabelOptions) {
  for (const k in label) {
    if (k.slice(-2) === '[]') {
      const p = `${path}${path && '.'}${k.slice(0, -2)}`;
      const l = Array.isArray(label[k]) ? label[k] : [label[k]];
      const all = Object.keys(diff);
      const nums: string[] = [];
      for (const k of all) {
        if (k.indexOf(p) === 0 && num.test(k.substr(p.length + 1))) {
          const idx = k.indexOf('.', p.length + 1);
          const num = k.substring(p.length + 1, ~idx ? idx : undefined);
          if (!~nums.indexOf(num)) nums.push(num)
        }
      }
      const lbl = `${str}${str && ' '}${l[0]}`;
      for (const num of nums) {
        const pp = `${p}${p && '.'}${num}`;
        if (pp in diff) {
          out[`${lbl}${lbl && ' '}${+num + 1}`] = diff[pp];
          if (opts?.omit) delete out[pp];
        }
        if (l[1]) _labelDiff(diff, l[1], pp, `${lbl}${lbl && ' '}${+num + 1}`, out, opts);
      }
    } else {
      const p = `${path}${path && '.'}${k}`;
      let l = Array.isArray(label[k]) ? label[k] : [label[k]];
      const lbl = `${str}${str && ' '}${l[0]}`;
      if (p in diff) {
        out[lbl] = diff[p];
        if (opts?.omit) delete out[p];
      }
      if (l[1]) _labelDiff(diff, l[1], p, lbl, out, opts);
    }
  }
}
