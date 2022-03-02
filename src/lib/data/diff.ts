export function join(...strs: string[]): string {
  return strs.filter(s => s).join('.');
}

export interface Diff {
  [path: string]: [any, any];
}

const looseEqual = (v1: any, v2: any) => v1 == v2;
const strictEqual = (v1: any, v2: any) => v1 === v2;

type Equalizer = 'strict'|'loose'|((v1: any, v2: any) => boolean);

export function diff(v1: any, v2: any, equal?: Equalizer): Diff {
  return _diff(v1, v2, '', {}, typeof equal === 'function' ? equal : equal === 'strict' ? strictEqual : looseEqual);
}

function _diff(v1: any, v2: any, path: string, diff: Diff, equal: (v1: any, v2: any) => boolean): Diff {
  if (typeof v1 !== 'object' || typeof v2 !== 'object') {
    if (v1 === v2) return diff;
    diff[path] = [v1, v2];
    return diff;
  }

  const ks = Object.keys(v1 || {});
  for (const k of Object.keys(v2 || {})) if (!~ks.indexOf(k)) ks.push(k);

  for (const k of ks) {
    const vv1 = v1[k];
    const vv2 = v2[k];

    if (vv1 === vv2) continue;
    else if (typeof vv1 === 'object' && typeof vv2 === 'object') _diff(vv1, vv2, join(path, k), diff, equal);
    else if (!equal(vv1, vv2)) diff[join(path, k)] = [vv1, vv2];
  }

  return diff;
}

export function deepEqual(v1: any, v2: any, equal?: Equalizer): boolean {
  return _deepEqual(v1, v2, typeof equal === 'function' ? equal : equal === 'strict' ? strictEqual : looseEqual);
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
