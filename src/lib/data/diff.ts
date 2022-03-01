export function join(...strs: string[]): string {
  return strs.filter(s => s).join('.');
}

export interface Diff {
  [path: string]: [any, any];
}

export function diff(v1: any, v2: any): Diff {
  return _diff(v1, v2, '', {});
}

function _diff(v1: any, v2: any, path: string, diff: Diff): Diff {
  if (typeof v1 !== 'object' || typeof v2 !== 'object') {
    diff[path] = [v1, v2];
    return diff;
  }

  const ks = Object.keys(v1 || {});
  for (const k of Object.keys(v2 || {})) if (!~ks.indexOf(k)) ks.push(k);

  for (const k of ks) {
    const vv1 = v1[k];
    const vv2 = v2[k];

    if (typeof vv1 !== typeof vv2) diff[join(path, k)] = [vv1, vv2];
    else if (typeof vv1 === 'object' && typeof vv2 === 'object') _diff(vv1, vv2, join(path, k), diff);
    else if (vv1 !== vv2) diff[join(path, k)] = [vv1, vv2];
  }

  return diff;
}
