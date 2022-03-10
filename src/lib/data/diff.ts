export function join(...strs: string[]): string {
  return strs.filter(s => s).join('.');
}

export interface Diff {
  [path: string]: [any, any];
}

const looseEqual = (v1: any, v2: any) => v1 == v2;
const strictEqual = (v1: any, v2: any) => v1 === v2;

type Identifier = true|string|((v: any) => any);
export interface IdentityMap {
  [path: string]: Identifier;
}

type EqualizerValue = 'strict'|'loose'|((v1: any, v2: any) => boolean);
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

export function diff(v1: any, v2: any, equal?: Equalizer): Diff {
  const type = equal && typeof equal === 'object' ? equal.type : equal;
  const eq = typeof type === 'function' ? type : type === 'strict' ? strictEqual : looseEqual;
  return _diff(v1, v2, '', {}, eq, typeof equal === 'object' ? equal.identity : undefined);
}

function _diff(v1: any, v2: any, path: string, diff: Diff, equal: (v1: any, v2: any) => boolean, ident?: IdentityMap): Diff {
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
    const ks = Object.keys(v1 || {});
    for (const k of Object.keys(v2 || {})) if (!~ks.indexOf(k)) ks.push(k);

    for (const k of ks) {
      const vv1 = v1[k];
      const vv2 = v2[k];

      if (vv1 === vv2) continue;
      else if (typeof vv1 === 'object' && typeof vv2 === 'object') _diff(vv1, vv2, join(path, k), diff, equal, ident);
      else if (!equal(vv1, vv2)) diff[join(path, k)] = [vv1, vv2];
    }
  }

  return diff;
}

export function deepEqual(v1: any, v2: any, equal?: EqualizerValue): boolean {
  const eq = typeof equal === 'function' ? equal : equal === 'strict' ? strictEqual : looseEqual;
  return _deepEqual(v1, v2, eq);
}

function _deepEqual(v1: any, v2: any, equal: (v1: any, v2: any) => boolean): boolean {
  if (typeof v1 !== 'object' || typeof v2 !== 'object') return equal(v1, v2);

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
