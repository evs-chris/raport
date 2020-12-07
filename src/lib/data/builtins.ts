import { filter, safeGet, registerOperator, CheckResult, ValueOperator, ValueOrExpr, Context, Root, evaluate, extend, formats, registerFormat, dateRelToRange, dateRelToDate, isDateRel, isKeypath, isTimespan, dateAndTimespan, addTimespan } from './index';
import { date, dollar, number, phone } from './format';
import { timespans } from './parse';

function simple(names: string[], apply: (name: string, values: any[], ctx: Context) => any): ValueOperator {
  return {
    type: 'value', names, apply
  };
}

const space = /^\s*$/;
function isNum(v: any): v is number {
  return !isNaN(v) && !space.test(v);
}
function num(v: any): number {
  if (isNaN(v) || !v) return 0;
  return +v;
}

// basic ops
registerOperator(
  simple(['is', 'is-not', '==', '!='], (name: string, values: any[]): boolean => {
    const [l, r] = values;
    const res = l == r; // eslint-disable-line eqeqeq
    return name === 'is' || name === '==' ? res : !res;
  }),
  simple(['not'], (_name: string, values: any[]) => !values[0]),
  simple(['<', '>', '<=', '>='], (name: string, values: any[]): boolean => {
    let [l, r] = values;
    if (l instanceof Date || r instanceof Date) {
      if (typeof l === 'number' || typeof r === 'number') {
        l = +l; r = +r;
      } else if (typeof l === 'string' || typeof r === 'string') {
        l = new Date(l); r = new Date(r);
      } else if ('f' in l && 'o' in l) {
        l = dateRelToRange(l)[name[0] === '<' ? 1 : 0];
        r = new Date(r);
      } else if ('f' in r && 'o' in r) {
        r = dateRelToRange(r)[name === '<' || name === '>=' ? 0 : 1];
        l = new Date(l);
      }
    } else if (isDateRel(l)) {
      l = dateRelToRange(l)[name[0] === '<' ? 1 : 0];
      r = isDateRel(r) ? dateRelToRange(r)[name === '<' || name === '>=' ? 0 : 1] : new Date(r);
    } else if (isDateRel(r)) {
      r = dateRelToRange(r)[name === '<' || name === '>=' ? 0 : 1];
      l = new Date(l);
    }
    return name === '<' ? l < r :
      name === '>' ? l > r :
        name === '<=' ? l <= r :
          name === '>=' ? l >= r :
            false;
  }),
  simple(['like', 'not-like', 'ilike', 'not-ilike'], (name: string, values: any[]): boolean => {
    const [l, r, arg] = values;
    if (typeof r !== 'string') return false;
    let res: boolean;
    const re = new RegExp(`${arg === 'free' ? '' : '^'}${r.replace(/[\s\%\*]+/g, '.*').replace(/\?/g, '.')}${arg === 'free' ? '' : '$'}`, ~name.indexOf('ilike') ? 'i' : '');
    if (Array.isArray(l)) res = !!l.find(v => re.test(v));
    else res = re.test(l);
    return name === 'like' || name === 'ilike' ? res : !res;
  }),
  simple(['in', 'not-in'], (name: string, values: any[]): boolean => {
    const [l, r] = values;
    if (isDateRel(r)) {
      const range = dateRelToRange(r);
      const d = isDateRel(l) ? dateRelToRange(l)[0] : new Date(l);
      const n = d >= range[0] && d <= range[1];
      return name === 'in' ? n : !n;
    } else if (!Array.isArray(r) && typeof r !== 'string') {
      return name === 'in' ? l == r : l != r;
    }
    const res = !!~r.indexOf(l);
    return name === 'in' ? res : !res;
  }), 
  simple(['contains', 'does-not-contain'], (name: string, values: any[]): boolean => {
    const [l, r] = values;
    if (isDateRel(l)) {
      const range = dateRelToRange(l);
      const d = isDateRel(r) ? dateRelToRange(r)[0] : new Date(r);
      const n = d >= range[0] && d <= range[1];
      return name === 'contains' ? n : !n;
    } else if (!Array.isArray(l) && typeof l !== 'string') return false;
    const res = !!~l.indexOf(r);
    return name === 'contains' ? res : !res;
  }),
  simple(['get'], (_name: string, values: any[], ctx): any => {
    const [l, r] = values;
    const c = extend(ctx, { value: l });
    if (isKeypath(r)) return safeGet(c, r);
    else return evaluate(c, r);
  }),
  simple(['array'], (_name: string, values: any[]) => {
    return values;
  }),
  simple(['object'], (_name: string, values: any[]) => {
    const res: any = {};
    for (let i = 0; i < values.length; i += 2) {
      res[values[i]] = values[i + 1];
    }
    return res;
  }),
  simple(['split'], (_name: string, [str, split]: any[]) => {
    if (typeof str !== 'string') return [str];
    else return str.split(split || '');
  }),
  simple(['filter'], (_name: string, values: any[], ctx?: Context): any => {
    let [arr, flt, sorts, groups] = values;
    if (!Array.isArray(arr)) {
      if (arr && Array.isArray(arr.value)) arr = arr.value;
      else return [];
    }
    return filter({ value: arr }, flt, sorts, groups, ctx).value;
  }),
  simple(['source'], (_name: string, values: any[]): any => {
    const [val] = values;
    return { value: val };
  }),
  simple(['group'], (_name: string, values: any[], ctx?: Context): any => {
    ctx = ctx || new Root({});
    let [arr, groups] = values;
    if (!Array.isArray(arr)) {
      if (arr && Array.isArray(arr.value)) arr = arr.value;
      else return {};
    }
    return filter({ value: arr }, null, null, groups, ctx);
  }),
  simple(['sort'], (_name: string, values: any[], ctx?: Context): any => {
    ctx = ctx || new Root({});
    let [arr, sort] = values;
    if (!Array.isArray(arr)) {
      if (arr && Array.isArray(arr.value)) arr =arr.value;
      else return {};
    }
    return filter({ value: arr }, null, sort, null, ctx);
  }),
  simple(['time-span', 'time-span-ms'], (_name: string, args: any[]): any => {
    let ms = args[0];
    let unit = typeof args[args.length - 1] === 'object' ? args[args.length - 1].unit : null;
    if (typeof unit !== 'string') unit = null;
    unit = unit && (unit[0] === 'y' ? 'y' : unit[0] === 'w' ? 'w' : unit[0] === 'd' ? 'd' : unit[0] === 'h' ? 'h' : unit[0] === 's' ? 's' : (unit === 'm' || unit.substr(0, 2) === 'mo') ? 'm' : (unit === 'mm' || unit.substr(0, 3) === 'min') ? 'mm' : (unit === 'ms' || unit.substr(0, 3) === 'mil') ? 'ms' : null);
    const precision = typeof args[1] === 'number' ? args[1] : unit ? 0 : 1;
    if (unit) {
      if (precision) return (ms / timespans[unit]).toFixed(precision);
      else return Math.floor(ms / timespans[unit]);
    } else {
      const res = [0, 0, 0, 0, 0, 0];
      check: if (ms !== '' && !isNaN(ms)) {
        ms = Math.abs(+ms);
        res[0] = Math.floor(ms / timespans.w);
        if (precision < res.filter(x => x).length) break check;
        ms = ms % timespans.w;
        res[1] = Math.floor(ms / timespans.d);
        if (precision < res.filter(x => x).length) break check;
        ms = ms % timespans.d;
        res[2] = Math.floor(ms / timespans.h);
        if (precision < res.filter(x => x).length) break check;
        ms = ms % timespans.h;
        res[3] = Math.floor(ms / timespans.mm);
        if (precision < res.filter(x => x).length) break check;
        ms = ms % timespans.mm;
        res[4] = Math.floor(ms / timespans.s);
        if (precision < res.filter(x => x).length) break check;
        res[5] = ms % timespans.s;
      } else return '';
      let str = '';
      if (res[0]) str += `${res[0]} week${res[0] > 1 ? 's' : ''}`;
      if (res[1]) str += `${str.length ? ' ' : ''}${res[1]} day${res[1] > 1 ? 's' : ''}`;
      if (res[2]) str += `${str.length ? ' ' : ''}${res[2]} hour${res[2] > 1 ? 's' : ''}`;
      if (res[3]) str += `${str.length ? ' ' : ''}${res[3]} minute${res[3] > 1 ? 's' : ''}`;
      if (res[4]) str += `${str.length ? ' ' : ''}${res[4]} second${res[4] > 1 ? 's' : ''}`;
      if (res[5]) str += `${str.length ? ' ' : ''}${res[5]} millisecond${res[5] > 1 ? 's' : ''}`;
      return str;
    }
  }),
  simple(['string'], (_name: string, [value]: any[]): string => {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.join(', ');
    let res = `${value}`;
    if (res.slice(0, 7) === '[object') return JSON.stringify(value);
    return res;
  }),
  simple(['call'], (_name: string, args: any[]): any => {
    if (args[0] != null && typeof args[1] === 'string' && typeof args[0][args[1]] === 'function') {
      const obj = args.shift();
      const name = args.shift();
      return obj[name].apply(obj, args);
    }

    if (typeof args[0] === 'function') {
      const fn = args.shift();
      return fn.apply(null, args);
    }
  })
);

// math
registerOperator(
  simple(['+'], (_name: string, values: any[]): number|string => {
    if (Array.isArray(values[0])) return values[0].concat.apply(values[0], values.slice(1));
    else if (isDateRel(values[0]) && values.length > 1 && values.slice(1).reduce((a, c) => a && isTimespan(c), true)) return values.slice(1).reduce((a, c) => dateAndTimespan(a, c, 1), dateRelToDate(values[0])); 
    else if (typeof values[0] !== 'number' && values.length > 1 && isTimespan(values[0])) return values.slice(1).reduce((a, c) => addTimespan(a, c), values[0]);
    const num = values.reduce((a, c) => a && isNum(c), true);
    if (num) {
      return values.reduce((a, c) => a + +c, 0);
    } else {
      return values.reduce((a, c) => a + (c === undefined || c === null ? '' : c), '');
    }
  }),
  simple(['-'], (_name: string, values: any[]): number => {
    const first = values.shift();
    if (isDateRel(first)) {
      if (values.reduce((a, c) => a && isDateRel(c), true)) return values.reduce((a, c) => a - +dateRelToDate(c), +dateRelToDate(first));
      if (values.reduce((a, c) => a && isTimespan(c), true)) return values.reduce((a, c) => dateAndTimespan(a, c, -1), dateRelToDate(first));
    }
    return values.reduce((a, c) => a - (!isNum(c) ? 0 : +c), !isNum(first) ? 0 : +first);
  }),
  simple(['*'], (_name: string, values: any[]): number => {
    const first = values.shift();
    if (!isNum(first)) return 0;
    return values.reduce((a, c) => a * (!isNum(c) ? 0 : +c), +first);
  }),
  simple(['/', '/%'], (name: string, values: any[]): number => {
    const first = values.shift();
    if (isNaN(first)) return 0;
    if (name.length > 1) return values.reduce((a, c) => Math.floor(a / (isNaN(c) ? 1 : +c)), +first);
    else return values.reduce((a, c) => a / (isNaN(c) ? 1 : +c), +first);
  }),
  simple(['%'], (_name: string, values: any[]): number => {
    const first = values.shift();
    return values.reduce((a, c) => a % (isNaN(c) ? 1 : +c), isNaN(first) ? 0 : +first);
  }),
  simple(['pow', '**'], (_name: string, values: any[]): number => {
    const pow = values.pop();
    const first = Math.pow(values.pop(), pow);
    return values.reverse().reduce((a, c) => Math.pow(c, a), first);
  }),
  simple(['abs'], (_name: string, values: any[]) => {
    if (typeof values[0] !== 'number') return values[0];
    return Math.abs(values[0]);
  }),
  simple(['round'], (_name: string, values: [number]): number => {
    return Math.round(values[0]);
  }),
  simple(['floor'], (_name: string, values: [number]): number => {
    return Math.floor(values[0]);
  }),
  simple(['ceil'], (_name: string, values: [number]): number => {
    return Math.ceil(values[0]);
  }),
  simple(['rand', 'random'], (_name: string, [min, max, dec]: [number, number|boolean, boolean]): number => {
    let res: number;
    if (min == null) return Math.random();
    else if (typeof max !== 'number') res = Math.random() * min;
    else if (typeof max === 'number') res = Math.random() * (max - min) + min;

    if (max === true || dec === true) return res;
    else return Math.round(res);
  }),
);

// string
const triml = /^\s*/;
const trimr = /\s*$/;
const escapeRe = /([\.\[\]\{\}\(\)\^\$\*\+\-])/g;
registerOperator(
  simple(['padl', 'padr'], (name: string, args: any[]): string => {
    let [str, count, pad] = args;
    if (typeof str !== 'string') str = '' + str;
    if (!isNum(count)) return str;
    if (!pad) pad = ' ';
    if (typeof pad !== 'string') pad = '' + pad;
    if (pad.length < 1) pad = ' ';

    for (let i = str.length; i < count; i = str.length) {
      if (name === 'padl') str = pad + str;
      else str += pad;
    }

    return str;
  }),
  simple(['trim', 'triml', 'trimr'], (name: string, args: any[]): string => {
    let [str] = args;
    str = '' + str;
    if (name === 'trim' || name === 'trimr') str = str.replace(trimr, '');
    if (name === 'trim' || name === 'triml') str = str.replace(triml, '');
    return str;
  }),
  simple(['slice', 'substr'], (_name: string, [src, start, end]: any[]) => {
    if (src && typeof src.slice === 'function') return src.slice(start, end);
  }),
  simple(['len', 'length'], (_name: string, [src]: any[]) => {
    if (src && 'length' in src) return src.length;
    return 0;
  }),
  simple(['replace', 'replace-all'], (name: string, [str, find, rep, flags]: any[]) => {
    str = `${str}`;
    const re = typeof flags === 'string';
    if (name === 'replace-all' || re) {
      return str.replace(new RegExp(re ? find : find.replace(escapeRe, '\\$1'), (name === 'replace' || (flags && ~flags.indexOf('g')) ? flags : `${flags || ''}g`) || 'g'), rep);
    } else {
      return str.replace(find, rep);
    }
  }),
  simple(['reverse'], (_name: string, [src]): string|any[] => {
    if (typeof src === 'string') {
      let r = '';
      for (let i = 0; i < src.length; i++) r = src[i] + r;
      return r;
    } else if (Array.isArray(src)) {
      return src.reverse();
    }
  }),
  simple(['keys'], (_name: string, [src, proto]): string[] => {
    if (!src) return [];
    if (proto) {
      const res: string[] = [];
      for (const k in src) res.push(k);
      return res;
    } else {
      return Object.keys(src);
    }
  }),
  simple(['values'], (_name: string, [src]): any[] => {
    if (!src) return [];
    return Object.values(src);
  }),
  simple(['date'], (_name: string, [v]: any[]): Date => {
    if (v !== undefined) {
      if (isDateRel(v)) return dateRelToDate(v);
      return new Date(v);
    }
    else return new Date();
  }),
  simple(['upper', 'lower'], (name: string, [v]: any[]): string => {
    v = v == null ? '' : v;
    return name === 'upper' ? `${v}`.toUpperCase() : `${v}`.toLowerCase();
  }),
  simple(['format', 'fmt'], (_name: string, args: any[]): string => {
    let [n, v, ...s] = args;
    const fmt = formats[v];
    if (!fmt) return `${n}`;
    else return fmt(n, s);
  }),
);

// short circuiting
registerOperator({
  type: 'checked',
  names: ['and', '&&'],
  checkArg(_name: string, _i: number, _total: number, value: any): CheckResult {
    if (value) return 'continue';
    else return { result: value };
  },
  apply(_name: string, args: any[]): boolean {
    return args[args.length - 1]; // passed the check, all is well
  },
}, {
  type: 'checked',
  names: ['or', '||'],
  checkArg(_name: string, _i: number, _total: number, value: any): CheckResult {
    if (value) return { result: value };
    else return 'continue';
  },
  apply(): boolean {
    return false; // if we made it this far, none were true
  },
}, {
  type: 'checked',
  names: ['if', 'unless'],
  checkArg(name: string, i: number, last: number, value: any): CheckResult {
    if (i % 2 === 0) {
      if (i === last) return { result: value }; // else case
      else if (name === 'if' ? !value : value) return { skip: 1 }; // non-matching branch, skip next
      else return 'continue'; // matching, carry on to next
    }
    else return { result: value }; // odd branch that wasn't skipped means previous condition matched
  },
  apply() {}
}, {
  type: 'checked',
  names: ['each'],
  checkArg(_name: string, i: number, last: number, value: any): CheckResult {
    if (i === 0) {
      if (Array.isArray(value) || typeof value === 'object') return 'continue';
      else return { skip: 1 };
    } else if (i === 1) return { skip: last - i, value };
    else if (i === last) return { result: value };
    else if (i % 2 === 0) { // condition
      if (value) return 'continue';
      else return { skip: 1 };
    } else return { result: value };
  },
  apply(_name: string, [value, body]: [any[]|object, ValueOrExpr], ctx?: Context) {
    ctx = ctx || new Root();
    if (Array.isArray(value)) {
      const last = value.length - 1;
      return value.map((v, i) => evaluate(extend(ctx, { value: v, special: { last, index: i, key: i, 'last-key': last } }), body, v)).join('');
    } else {
      const entries = Object.entries(value);
      const lastKey = entries[entries.length - 1][0];
      const last = entries.length - 1;
      return Object.entries(value).map(([k, v], i) => evaluate(extend(ctx, { value: v, special: { last, 'last-key': lastKey, index: i, key: k } }), body, v)).join('');
    }
  }
}, {
  type: 'checked',
  names: ['with'],
  checkArg(_name: string, i: number, last: number, value: any): CheckResult {
    if (i === 0 && typeof value === 'object') return 'continue';
    else if (i === 1) return { skip: last - i, value };
    else if (i === last) return { result: value };
    else if (i % 2 === 0) {
      if (value) return 'continue';
      else return { skip: 1 };
    } else return { result: value };
  },
  apply(_name: string, [value, body]: [any, ValueOrExpr], ctx?: Context) {
    ctx = ctx || new Root();
    return evaluate(extend(ctx, { value }), body, value);
  }
}, {
  type: 'checked',
  names: ['coalesce', 'coalesce-truth'],
  checkArg(name: string, _i: number, _last: number, value: any): CheckResult {
    if (name === 'coalesce' && value !== undefined && value !== null) return { result: value };
    else if (value) return { result: value };
    else return 'continue';
  },
  apply() {}
});

// aggregates
registerOperator({
  type: 'aggregate',
  names: ['avg'],
  apply(_name: string, arr: any[], args: ValueOrExpr[], ctx: Context) {
    return arr.reduce((a, c) => a + num(args[0] ? evaluate(ctx, args[0], c) : c), 0) / arr.length;
  },
}, {
  type: 'aggregate',
  names: ['sum'],
  apply(_name: string, arr: any[], args: ValueOrExpr[], ctx: Context) {
    return arr.reduce((a, c) => a + num(args[0] ? evaluate(ctx, args[0], c) : c), 0);
  }
}, {
  type: 'aggregate',
  names: ['count'],
  apply(_name: string, arr: any[], args: ValueOrExpr[], ctx: Context) {
    if (args.length) return arr.filter(e => evaluate(ctx, args[0], e)).length;
    else return arr.length;
  }
}, {
  type: 'aggregate',
  names: ['min', 'max'],
  apply(name: string, arr: any[], args: ValueOrExpr[], ctx: Context) {
    if (args[0]) arr = arr.map(e => evaluate(ctx, args[0], e));
    return Math[name].apply(Math, arr);
  }
}, {
  type: 'aggregate',
  names: ['first', 'nth', 'last'],
  apply(name: string, arr: any[], args: ValueOrExpr[], ctx: Context) {
    let val: any;
    let apply = 0;
    if (name === 'first') val = arr[0];
    else if (name === 'last') val = arr[arr.length - 1];
    else if (args[0]) {
      const i = evaluate(ctx, args[0]);
      if (typeof i === 'number') {
        val = arr[i];
        apply = 1;
      }
    }
    if (args[apply]) val = evaluate(ctx, args[apply]);
    return val;
  }
}, {
  type: 'aggregate',
  names: ['map'],
  apply(_name: string, arr: any[], args: ValueOrExpr[], ctx: Context) {
    if (!args[0]) return arr;
    return arr.map(e => evaluate(ctx, args[0], e));
  }
}, {
  type: 'aggregate',
  names: ['unique', 'unique-map'],
  apply(name: string, arr: any[], args: ValueOrExpr[], ctx: Context) {
    const seen = [];
    const res = [];
    for (const e of arr) {
      const f = args[0] ? evaluate(ctx, args[0], e) : e;
      if (!~seen.indexOf(f)) {
        seen.push(f);
        res.push(e);
      }
    }
    return name === 'unique' ? res : seen;
  }
}, {
  type: 'aggregate',
  names: ['join'],
  apply(_name: string, arr: any[], args: ValueOrExpr[], ctx: Context) {
    if (args.length > 1) return arr.map(e => evaluate(ctx, args[0], e)).join(evaluate(ctx, args[1]));
    return arr.join(evaluate(ctx, args[0]));
  }
}, {
  type: 'aggregate',
  names: ['find'],
  apply(_name: string, arr: any[], args: ValueOrExpr[], ctx: Context) {
    if (!args[0]) return;
    if (typeof args[0] === 'object' && 'a' in args[0]) return arr.find(e => evaluate(ctx, args[0], e));
    else {
      const v = evaluate(ctx, args[0]);
      return arr.find(e => e == v);
    }
  }
});

// basic formats
registerFormat('dollar', (n, [dec, sign]) => {
  return dollar(n, undefined, dec, sign);
});

registerFormat('date', (n, [fmt]) => {
  return date(n, fmt);
});

registerFormat('integer', (n, []) => {
  return number(n, 0);
});
registerFormat('int', (n, []) => {
  return number(n, 0);
});

registerFormat('number', (n, [dec]) => {
  return number(n, dec);
});
registerFormat('num', (n, [dec]) => {
  return number(n, dec);
});

registerFormat('phone', n => {
  return phone(n);
});
