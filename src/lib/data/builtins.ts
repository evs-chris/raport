import { filter, safeGet, registerOperator, CheckResult, ValueOperator, Context, Root, evaluate, extend, formats, registerFormat } from './index';
import { parse } from './expr';
import { date, dollar, number, phone } from './format';

function simple(names: string[], apply: (name: string, values: any[], ctx: Context) => any): ValueOperator {
  return {
    type: 'value', names, apply
  };
}

// basic ops
registerOperator(
  simple(['is', 'is-not'], (name: string, values: any[]): boolean => {
    const [l, r] = values;
    const res = l == r; // eslint-disable-line eqeqeq
    return name === 'is' ? res : !res;
  }),
  simple(['not'], (_name: string, values: any[]) => !values[0]),
  simple(['<', '>', '<=', '>='], (name: string, values: any[]): boolean => {
    let [l, r] = values;
    if (l instanceof Date || r instanceof Date) {
      if (typeof l === 'number' || typeof r === 'number') {
        l = +l; r = +r;
      } else if (typeof l === 'string' || typeof r === 'string') {
        l = new Date(l); r = new Date(r);
      }
    }
    return name === '<' ? l < r :
      name === '>' ? l > r :
        name === '<=' ? l <= r :
          name === '>=' ? l >= r :
            false;
  }),
  simple(['like', 'not-like', 'ilike', 'not-ilike'], (name: string, values: any[]): boolean => {
    const [l, r] = values;
    if (typeof r !== 'string') return false;
    let res: boolean;
    const re = new RegExp(`^${r.replace(/[\s\%\*]+/g, '.*').replace(/\?/g, '.')}$`, ~name.indexOf('ilike') ? 'i' : '');
    if (Array.isArray(l)) res = !!l.find(v => re.test(v));
    else res = re.test(l);
    return name === 'like' || name === 'ilike' ? res : !res;
  }),
  simple(['in', 'not-in'], (name: string, values: any[]): boolean => {
    const [l, r] = values;
    if (!Array.isArray(r) && typeof r !== 'string') return false;
    const res = !!~r.indexOf(l);
    return name === 'in' ? res : !res;
  }), 
  simple(['contains', 'does-not-contain'], (name: string, values: any[]): boolean => {
    const [l, r] = values;
    if (!Array.isArray(l) && typeof l !== 'string') return false;
    const res = !!~l.indexOf(r);
    return name === 'contains' ? res : !res;
  }),
  simple(['get'], (_name: string, values: any[], ctx): any => {
    const [l, r] = values;
    return safeGet(extend(ctx, { value: l }), `${r}`);
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
  simple(['filter'], (_name: string, values: any[], ctx?: Context): any => {
    let [arr, flt, sorts, groups] = values;
    if (!Array.isArray(arr)) {
      if (arr && Array.isArray(arr.value)) arr = arr.value;
      else return [];
    }
    return filter({ value: arr }, flt, sorts, groups, ctx).value;
  }),
  simple(['find'], (_name: string, values: any[], ctx?: Context): any => {
    ctx = ctx || new Root({});
    let [arr, flt] = values;
    if (!Array.isArray(arr)) return;
    if (typeof flt === 'string') flt = parse(flt);
    if (typeof flt !== 'object') flt = { v: flt };
    if (flt.v) return arr.find(e => e == flt.v);
    else if (flt.r) return arr.find(e => e == evaluate(ctx, flt));
    else return arr.find(e => evaluate(extend(ctx, { value: e }), flt));
  }),
  simple(['source'], (_name: string, values: any[]): any => {
    const [val] = values;
    return { value: val };
  }),
  simple(['group'], (_name: string, values: any[], ctx?: Context): any => {
    ctx = ctx || new Root({});
    let [arr, groups] = values;
    if (!Array.isArray(arr)) {
      if (arr && Array.isArray(arr.value)) arr =arr.value;
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
    const num = values.reduce((a, c) => a && !isNaN(c), true);
    if (num) {
      return values.reduce((a, c) => a + +c, 0);
    } else {
      return values.reduce((a, c) => a + c, '');
    }
  }),
  simple(['-'], (_name: string, values: any[]): number => {
    const first = values.shift();
    return values.reduce((a, c) => a - (isNaN(c) ? 0 : +c), isNaN(first) ? 0 : +first);
  }),
  simple(['*'], (_name: string, values: any[]): number => {
    const first = values.shift();
    if (isNaN(first)) return 0;
    return values.reduce((a, c) => a * (isNaN(c) ? 0 : +c), +first);
  }),
  simple(['/'], (_name: string, values: any[]): number => {
    const first = values.shift();
    if (isNaN(first)) return 0;
    return values.reduce((a, c) => a / (isNaN(c) ? 1 : +c), +first);
  }),
  simple(['%'], (_name: string, values: any[]): number => {
    const first = values.shift();
    return values.reduce((a, c) => a % (isNaN(c) ? 1 : +c), isNaN(first) ? 0 : +first);
  })
);

// string
const triml = /^\s*/;
const trimr = /\s*$/;
const escapeRe = /([\.\[\]\{\}\(\)\^\$\*\+\-])/g;
registerOperator(
  simple(['padl', 'padr'], (name: string, args: any[]): string => {
    let [str, count, pad] = args;
    if (typeof str !== 'string') str = '' + str;
    if (isNaN(count)) return str;
    if (!pad) pad = ' ';
    if (typeof pad !== 'string') pad = '' + pad;
    if (pad.length < 1) pad = ' ';

    for (let i = str.length; i < pad; i = str.length) {
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
  simple(['date'], (_name: string, [v]: any[]): Date => {
    if (v !== undefined) return new Date(v);
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
  names: ['and'],
  checkArg(_name: string, _i: number, _total: number, value: any): CheckResult {
    if (value) return 'continue';
    else return { result: false };
  },
  apply(): boolean {
    return true; // passed the check, all is well
  },
}, {
  type: 'checked',
  names: ['or'],
  checkArg(_name: string, _i: number, _total: number, value: any): CheckResult {
    if (value) return { result: true };
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
  names: ['coalesce', 'coalesce-truth'],
  checkArg(name: string, _i: number, _last: number, value: any): CheckResult {
    if (name === 'coalesce' && value !== undefined && value !== null) return { result: value };
    else if (value) return { result: value };
    else return 'continue';
  },
  apply() {}
});

// aggregates
registerOperator<[number, number]>({
  type: 'aggregate',
  names: ['avg'],
  init() { return [0, 0]; },
  apply(_name: string, state: [number, number], _base: any, value: any) {
    state[0]++;
    if (!isNaN(value)) state[1] += +value;
    return state;
  },
  final(_name: string, [count, total]: [number, number]): number {
    return count < 1 ? 0 : total / count;
  }
});

registerOperator<number>({
  type: 'aggregate',
  names: ['sum'],
  init() { return 0; },
  apply(_name: string, state: number, _base: any, value: any) {
    if (!isNaN(value)) return state + +value;
    else return state;
  },
  final(_name: string, value: number) {
    return value;
  }
}, {
  type: 'aggregate',
  names: ['count'],
  init() { return 0; },
  apply(_name: string, state: number, _base: any, value: any) {
    if (value !== false) return state + 1;
    else return state;
  },
  final(_name: string, value: number): number {
    return value;
  }
});

type MaybeNum = { value?: number };
registerOperator<MaybeNum>({
  type: 'aggregate',
  names: ['min', 'max'],
  init() { return {}; },
  apply(name: string, state: MaybeNum, _base: any, value: any) {
    if (!isNaN(value) && (state.value == null || (name === 'min' ? value < state.value : value > state.value))) state.value = value;
    return state;
  },
  final(_name: string, { value }: MaybeNum): number {
    return value;
  }
});

type Nth = { value?: any, nth?: number, iter?: number; };
registerOperator<Nth>({
  type: 'aggregate',
  names: ['first', 'nth', 'last'],
  init(_name, args: any[]) { return { nth: args[0] }; },
  apply(name: string, state: Nth, _base: any, value: any) {
    if (name === 'first') {
      if (!state.iter) {
        state.iter = 1;
        state.value = value;
      }
    } else if (name === 'last') {
      state.value = value;
    } else if (name === 'nth') {
      if (!state.iter) state.iter = 1;
      if (state.iter === state.nth) state.value = value;
      state.iter++;
    }
    return state;
  },
  final(_name: string, { value }: Nth): any {
    return value;
   }
});

registerOperator<any[]>({
  type: 'aggregate',
  names: ['map'],
  init() { return []; },
  apply(_name: string, state: any[], _base: any, value: any) {
    state.push(value);
    return state;
  },
  final(_name: string, value: any[]): any[] {
    return value;
  }
}, {
  type: 'aggregate',
  names: ['unique'],
  init() { return []; },
  apply(_name: string, state: any[], _base: any, value: any) {
    if (!~state.indexOf(value)) state.push(value);
    return state;
  },
  final(_name: string, value: any[]): any[] {
    return value;
  }
});

registerOperator<[any[], any[]]>({
  type: 'aggregate',
  names: ['unique-by'],
  init() { return [[], []]; },
  apply(_name: string, state: [any[], any[]], base: any, value: any) {
    if (!~state[0].indexOf(value)) {
      state[0].push(value);
      state[1].push(base);
    }
    return state;
  },
  final(_name: string, [, values]: [any[], any[]]): any[] {
    return values;
  },
  check(_name: string, final: any[], base: any) {
    return !!~final.indexOf(base);
  }
});

registerOperator<any[]>({
  type: 'aggregate',
  names: ['join'],
  init() { return []; },
  apply(_name: string, state: any[], _base: any, value: any) {
    state.push(value);
    return state;
  },
  final(_name: string, value: any[], [join]: [string]): string {
    return value.join(join);
  }
});

// basic formats
registerFormat('dollar', (n, [fmt]) => {
  return dollar(n, fmt);
});

registerFormat('date', (n, [fmt]) => {
  return date(n, fmt);
});

registerFormat('integer', (n, []) => {
  return number(n, 0);
});

registerFormat('number', (n, [dec]) => {
  return number(n, dec);
});

registerFormat('phone', n => {
  return phone(n);
});
