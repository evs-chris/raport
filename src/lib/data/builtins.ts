import { filter, safeGet, registerOperator, CheckResult, Type, ValueOperator, OperatorCategory, Context, Root, evaluate, extend, formats, registerFormat } from './index';
import { date, dollar, number, phone } from './format';

function simple(names: string[], types: Type[][], result: Type, apply: (name: string, values: any[]) => any, args: number|'any' = 2, category?: OperatorCategory[]): ValueOperator {
  return {
    type: 'value', names, args, types, result, apply, category: ['binary']
  };
}

// basic ops
registerOperator(
  simple(['is', 'is not'], [['any'], ['any']], 'boolean',
  (name: string, values: any[]): boolean => {
    const [l, r] = values;
    const res = l == r; // eslint-disable-line eqeqeq
    return name === 'is' ? res : !res;
  }),
  {
    type: 'value',
    names: ['not'],
    args: 1,
    types: [['value']],
    result: 'boolean',
    category: ['unary'],
    apply(name: string, values: any[]): boolean {
      return !values[0];
    },
  },
  simple(['<', '>', '<=', '>='], [['value'], ['value']], 'boolean',
    (name: string, values: any[]): boolean => {
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
    }
  ),
  simple(['like', 'not like', 'ilike', 'not ilike'], [['string'], ['string']], 'boolean',
    (name: string, values: any[]): boolean => {
      const [l, r] = values;
      if (typeof r !== 'string') return false;
      const res = new RegExp(`^${r.replace(/[\s\%\*]+/g, '.*').replace(/\?/g, '.')}$`, ~name.indexOf('ilike') ? 'i' : '').test(l);
      return name === 'like' || name === 'ilike' ? res : !res;
    }
  ),
  simple(['in', 'not in'], [['any'], ['array']], 'boolean',
    (name: string, values: any[]): boolean => {
      const [l, r] = values;
      if (!Array.isArray(r)) return false;
      const res = !!~r.indexOf(l);
      return name === 'in' ? res : !res;
    }
  ), 
  simple(['contains', 'does not contain'], [['array'], ['any']], 'boolean',
    (name: string, values: any[]): boolean => {
      const [l, r] = values;
      if (!Array.isArray(l)) return false;
      const res = !!~l.indexOf(r);
      return name === 'contains' ? res : !res;
    }
  ),
  simple(['get'], [['any'], ['string']], 'any',
    (name: string, values: any[]): any => {
      const [l, r] = values;
      return safeGet(l, `${r}`);
    },
    2,
    ['function']
  ),
  simple(['array'], [['any']], 'array',
    (name: string, values: any[]) => {
      return values;
    },
    'any', ['function']
  ),
  simple(['object'], [['any']], 'object',
    (name: string, values: any[]) => {
      const res: any = {};
      for (let i = 0; i < values.length; i += 2) {
        res[values[i]] = values[i + 1];
      }
      return res;
    },
    'any', ['function']
  ),
  simple(['filter'], [['array'], ['object'], ['array'], ['array']], 'array',
    (name: string, values: any[], ctx?: Context): any => {
      const [arr, flt, sorts, groups] = values;
      if (!Array.isArray(arr)) return [];
      return filter({ value: arr }, flt, sorts, groups, ctx).value;
    },
    4
  ),
  simple(['find'], [['array'], ['any']], 'any',
    (name: string, values: any[], ctx?: Context): any => {
      ctx = ctx || new Root({});
      const [arr, flt] = values;
      if (!Array.isArray(arr)) return;
      return arr.find(e => evaluate(extend(ctx, { value: e }), flt));
    },
    2,
    ['function']
  ),
);

// math
registerOperator(
  simple(['+'], [['number', 'string']], 'value',
    (name: string, values: any[]): number|string => {
      const num = values.reduce((a, c) => a && !isNaN(c), true);
      if (num) {
        return values.reduce((a, c) => a + +c, 0);
      } else {
        return values.reduce((a, c) => a + c, '');
      }
    },
    'any'
  ),
  simple(['-'], [['number']], 'number',
    (name: string, values: any[]): number => {
      const first = values.shift();
      return values.reduce((a, c) => a - (isNaN(c) ? 0 : +c), isNaN(first) ? 0 : +first);
    },
    'any'
  ),
  simple(['*'], [['number']], 'number',
    (name: string, values: any[]): number => {
      const first = values.shift();
      if (isNaN(first)) return 0;
      return values.reduce((a, c) => a * (isNaN(c) ? 0 : +c), +first);
    },
    'any'
  ),
  simple(['/'], [['number']], 'number',
    (name: string, values: any[]): number => {
      const first = values.shift();
      if (isNaN(first)) return 0;
      return values.reduce((a, c) => a / (isNaN(c) ? 0 : +c), +first);
    },
    'any'
  ),
  simple(['%'], [['number']], 'number',
    (name: string, values: any[]): number => {
      const first = values.shift();
      return values.reduce((a, c) => a / (isNaN(c) ? 0 : +c), isNaN(first) ? 0 : +first);
    },
    'any'
  )
);

// string
const triml = /^\s*/;
const trimr = /\s*$/;
const escapeRe = /([\.\[\]\{\}\(\)\^\$\*\+\-])/g;
registerOperator(
  simple(['padl', 'padr'], [['string'], ['number'], ['string']], 'string',
    (name: string, args: any[]): string => {
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
    },
    'any', ['function', 'format']
  ),
  simple(['trim', 'triml', 'trimr'], [['string']], 'string',
    (name: string, args: any[]): string => {
      let [str] = args;
      str = '' + str;
      if (name === 'trim' || name === 'trimr') str = str.replace(trimr, '');
      if (name === 'trim' || name === 'triml') str = str.replace(triml, '');
      return str;
    },
    1, ['function', 'format']
  ),
  simple(['slice', 'substr'], [['string', 'array'], ['number'], ['number']], 'any',
    (name: string, [src, start, end]: any[]) => {
      if (src && typeof src.slice === 'function') return src.slice(start, end);
    },
    3, ['function', 'format']
  ),
  simple(['replace', 'replace-all'], [['string'], ['string'], ['string'], ['string']], 'string',
    (name: string, [str, find, rep, flags]: any[]) => {
      str = `${str}`;
      const re = typeof flags === 'string';
      if (name === 'replace-all' || re) {
        return str.replace(new RegExp(re ? find : find.replace(escapeRe, '\\$1'), (name === 'replace' || (flags && ~flags.indexOf('g')) ? flags : `${flags || ''}g`) || 'g'), rep);
      } else {
        return str.replace(find, rep);
      }
    },
    4, ['function', 'format']
  ),
  simple(['reverse'], [['string', 'array']], 'any',
    (name: string, [src]): string|any[] => {
      if (typeof src === 'string') {
        let r = '';
        for (let i = 0; i < src.length; i++) r = src[i] + r;
        return r;
      } else if (Array.isArray(src)) {
        return src.reverse();
      }
    },
    1, ['function']
  ),
  simple(['date'], [['string']], 'date',
    (name: string, [v]: any[]): Date => {
      return new Date(v);
    },
    1, ['function', 'format']
  ),
  simple(['upper', 'lower'], [['string']], 'string',
    (name: string, [v]: any[]): string => {
      return name === 'upper' ? `${v}`.toUpperCase() : `${v}`.toLowerCase();
    },
    1, ['function', 'format']
  ),
  simple(['format', 'fmt'], [['string'], ['string'], ['any']], 'string',
    (name: string, args: any[]): string => {
      let [n, v, ...s] = args;
      const fmt = formats[v];
      if (!fmt) return `${n}`;
      else return fmt(n, s);
    },
    3, ['function', 'format']
  ),
);

// short circuiting
registerOperator({
  type: 'checked',
  names: ['and'],
  args: 'any',
  types: [],
  result: 'boolean',
  category: ['binary'],
  checkArg(name: string, i: number, total: number, value: any): CheckResult {
    if (value) return 'continue';
    else return { result: false };
  },
  apply(): boolean {
    return true; // passed the check, all is well
  },
}, {
  type: 'checked',
  names: ['or'],
  args: 'any',
  types: [],
  result: 'boolean',
  category: ['binary'],
  checkArg(name: string, i: number, total: number, value: any): CheckResult {
    if (value) return { result: true };
    else return 'continue';
  },
  apply(): boolean {
    return false; // if we made it this far, none were true
  },
}, {
  type: 'checked',
  names: ['if', 'unless'],
  args: 'any',
  types: [],
  result: 'any',
  category: ['ternary'],
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
  args: 'any',
  types: [],
  result: 'any',
  category: ['function'],
  checkArg(name: string, i: number, last: number, value: any): CheckResult {
    if (name === 'coalesce' && value !== undefined && value !== null) return { result: value };
    else if (value) return { result: value };
    else return 'continue';
  },
  apply() {}
});

// aggregates
type AVG = { count: number; total: number };
registerOperator<AVG>({
  type: 'aggregate',
  names: ['avg'],
  args: 0,
  types: [],
  result: 'number',
  category: ['aggregate', 'function'],
  init() { return { count: 0, total: 0 }; },
  apply(name: string, state: AVG, value: any) {
    state.count++;
    if (!isNaN(value)) state.total += +value;
  },
  final({ total, count }: AVG): number {
    return count < 1 ? 0 : total / count;
  }
});

type SUM = { value: number };
registerOperator<SUM>({
  type: 'aggregate',
  names: ['sum'],
  args: 0,
  types: [],
  result: 'number',
  category: ['aggregate', 'function'],
  init() { return { value: 0 } },
  apply(name: string, state: SUM, value: any) {
    if (!isNaN(value)) state.value += +value;
  },
  final({ value }: SUM) {
    return value;
  }
}, {
  type: 'aggregate',
  names: ['count'],
  args: 1,
  types: [['boolean']],
  result: 'number',
  category: ['aggregate', 'function'],
  init() { return { value: 0 } },
  apply(name: string, state: SUM, value: any) {
    if (value !== false) state.value++;
  },
  final({ value }: SUM): number {
    return value;
  }
});

type MAP = { value: any[] };
registerOperator<MAP>({
  type: 'aggregate',
  names: ['map'],
  args: 0,
  types: [],
  result: 'array',
  category: ['aggregate', 'function'],
  init() { return { value: [] }; },
  apply(name: string, state: MAP, value: any) {
    state.value.push(value);
  },
  final({ value }: MAP): any[] {
    return value;
  }
}, {
  type: 'aggregate',
  names: ['unique'],
  args: 0,
  types: [],
  result: 'array',
  category: ['aggregate', 'function'],
  init() { return { value: [] }; },
  apply(name: string, state: MAP, value: any) {
    if (!~state.value.indexOf(value)) state.value.push(value);
  },
  final({ value }: MAP): any[] {
    return value;
  }
});

type JOIN = { value: any[], join: string };
registerOperator<JOIN>({
  type: 'aggregate',
  names: ['join'],
  args: 1,
  types: [['string']],
  result: 'string',
  category: ['aggregate', 'function'],
  init(args?: any[]) { return { value: [], join: (args || [])[0] }; },
  apply(name: string, state: JOIN, value: any) {
    state.value.push(value);
  },
  final({ value, join }: JOIN): string {
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

registerFormat('integer', (n, [dec]) => {
  return number(n, 0);
});

registerFormat('number', (n, [dec]) => {
  return number(n, dec);
});

registerFormat('phone', n => {
  return phone(n);
});
