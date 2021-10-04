import { filter, safeGet, safeSet, registerOperator, CheckResult, ValueOperator, ValueOrExpr, Context, Root, evaluate, evalApply, evalValue, evalParse, extend, formats, registerFormat, dateRelToRange, dateRelToDate, isDateRel, isKeypath, isTimespan, dateAndTimespan, addTimespan, isValue, datesDiff, DateRel } from './index';
import { date, dollar, ordinal, number, phone } from './format';
import { timespans, isTimespanMS, timeSpanToNumber } from './parse';

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

function equals(l: any, r: any): boolean {
  return l == r; // eslint-disable-line eqeqeq
}

/**
 * Find a the first overlapping substring that contains threshhold percent characters of the smallest string length.
 * @param a - the first string
 * @param b - the second string
 * @param threshhold - defaults to 0.5 - the percentage of the smaller string length needed to match
 * @returns - the substring that matches
 */
export function overlap(a: string, b: string, threshhold: number = 0.5): string {
  const res = similar(a, b, threshhold, 0);
  return res && res[1] || undefined;
}

/**
 * Finds the percentage similarity between two strings based on a minimum threshhold and a fudge factor. The minimum threshhold determins the earliest that the search can return. The fudge factor allows skipping characters in either string, though there is no backtracking.
 * @param a - the first string
 * @param b - the second string
 * @param threshhold - defaults to 0.5 - the required similarity between two substrings, accounting for the fidge factor
 * @param fudges - the number skippable characters in either string without a match
 * @returns - the similarity of the first qualifying match
 */
export function similarity(a: string, b: string, threshhold: number = 0.5, fudges: number = 2): number {
  const res = similar(a, b, threshhold, fudges);
  return res && res[2] || 0;
}

/**
 * Finds the similarity between two strings based on a minimum threshhold and a fudge factor. The minimum threshhold determins the earliest that the search can return. The fudge factor allows skipping characters in either string, though there is no backtracking.
 * @param a - the first string
 * @param b - the second string
 * @param threshhold - defaults to 0.5 - the required similarity between two substrings, accounting for the fidge factor
 * @param fudges - the number skippable characters in either string without a match
 * @returns - a tuple of the substrings from each string and the similarity percentage, accounting for the fudge factor
 */
export function similar(a: string, b: string, threshhold: number = 0.5, fudges: number = 2): [string, string, number] {
  if (!a || !b) return;
  const aa = a.toLowerCase();
  const bb = b.toLowerCase();

  // check containment
  if (~aa.indexOf(bb)) bb;
  if (~bb.indexOf(aa)) aa;

  let i1 = 0;
  let i2 = 0;
  let oa = 0;
  let ob = 0;
  let f = 0;
  let f1 = 0;
  let f2 = 0;
  let fs = 0;
  let sim = 0;

  const alen = a.length;
  const blen = b.length;
  let aolen = 0;
  let bolen = 0;

  // walk a
  for (i1 = 0; i1 < alen; i1++) {
    // walk b
    for (i2 = 0; i2 < blen; i2++) {
      // if there's a match, see how far it goes
      if (aa[i1] === bb[i2]) {
        aolen = alen - i1;
        bolen = blen - i2;
        fs = 0;
        // walk the remaining pieces of each string checking for matches
        matchy: for (oa = 1, ob = 1; oa < aolen && ob < bolen;) {
          if (aa[i1 + oa] === bb[i2 + ob]) { // nailed it
            oa++, ob++;
          } else { // not so much, so compare closer chars in each string, walking outward
            for (f = 0; f <= fudges; f++) {
              for (f1 = 0; f1 <= f; f1++) {
                for (f2 = 0; f2 <= f; f2++) {
                  if (aa[i1 + oa + f1] === bb[i2 + ob + f2]) {
                    oa += f1;
                    ob += f2;
                    fs += Math.max(f1, f2); // keep track of the fudge factor
                    continue matchy;
                  }
                }
              }
            }
            break matchy; // not even fudge could save it
          }
        }

        sim = (Math.max(oa, ob) - fs) / Math.min(aa.length, bb.length); // get approximate similarity
        if (sim >= threshhold) return [aa.substr(i1, oa), bb.substr(i2, ob), sim]; // and if it exceeds the threshold, we're good
      }
    }
  }
}

// basic ops
registerOperator(
  simple(['is', 'is-not', '==', '!='], (name: string, values: any[]): boolean => {
    const [l, r] = values;
    const res = equals(l, r);
    return name === 'is' || name === '==' ? res : !res;
  }),
  simple(['not'], (_name: string, values: any[]) => !values[0]),
  simple(['<', '>', '<=', '>=', 'gt', 'gte', 'lt', 'lte'], (name: string, values: any[]): boolean => {
    if (name === 'gt') name = '>';
    else if (name === 'lt') name = '<';
    else if (name === 'gte') name = '>=';
    else if (name === 'lte') name = '<=';
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
    const [target, pattern, arg] = values;
    let res: boolean = false;
    const patterns = typeof pattern === 'string' ? [pattern] : pattern;
    const free = arg === 'free' || (typeof arg === 'object' && arg.free);
    if (!Array.isArray(patterns)) return false;
    for (let i = 0; i < patterns.length && !res; i++) {
      const r = patterns[i];
      if (typeof r !== 'string') continue;
      const re = new RegExp(`${free ? '' : '^'}${r.replace(/[\s\%\*]+/g, '.*').replace(/\?/g, '.')}${free ? '' : '$'}`, ~name.indexOf('ilike') ? 'i' : '');
      if (Array.isArray(target)) res = !!target.find(v => re.test(v));
      else res = re.test(target);
    }
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
    } else if (Array.isArray(l) && Array.isArray(r)) {
      const b = l.reduce((a, c) => a && ~r.indexOf(c), true);
      return name === 'in' ? !!b : !b;
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
    } else if (!Array.isArray(l) && typeof l !== 'string') {
      return false;
    } else if (Array.isArray(r) && Array.isArray(l)) {
      const b = r.reduce((a, c) => a && ~l.indexOf(c), true);
      return name === 'contains' ? !!b : !b;
    }
    const res = !!~l.indexOf(r);
    return name === 'contains' ? res : !res;
  }),
  simple(['clamp'], (_name, [min, v, max]: any[]): any => {
    return v < min ? min : v > max ? max : v;
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
    return filter({ value: arr }, null, null, groups, ctx).value;
  }),
  simple(['sort'], (_name: string, values: any[], ctx?: Context): any => {
    ctx = ctx || new Root({});
    let [arr, sort] = values;
    if (!Array.isArray(arr)) {
      if (arr && Array.isArray(arr.value)) arr =arr.value;
      else return {};
    }
    return filter({ value: arr }, null, sort, null, ctx).value;
  }),
  simple(['time-span', 'time-span-ms'], (_name: string, args: any[]): any => {
    const namedArgs = Object.prototype.toString.call(args[args.length - 1]) === '[object Object]' ? args[args.length - 1] : {};
    const span = isDateRel(args[0]) && isDateRel(args[1]) ? datesDiff(dateRelToDate(args[0]), dateRelToDate(args[1])) : isTimespan(args[0]) ? args[0] : 0;

    // if a unit is specified, break the span up
    if (namedArgs.unit) {
      const u = ((Array.isArray(namedArgs.unit) ? namedArgs.unit : [namedArgs.unit]) as string[]).map(u => {
        if (u[0] === 'y') return 'y'
        else if (u[0] === 'M' || (u[0] === 'm' && u[1] !== 'i' && u[1] !== 'm')) return 'M';
        else if (u[0] === 'w') return 'w';
        else if (u[0] === 'd') return 'd';
        else if (u[0] === 'h') return 'h';
        else if (u[0] === 'm' && (!u[1] || u[1] === 'i' || u[1] === 'm')) return 'm';
        else if (u[0] === 's') return 's'
        else if (u[0] === 'm' && u[1] === 's') return 'l';
        return '';
      }).filter(u => !!u);

      // fraction tracks what would be left for rounding
      let fraction: number;
      let res: number[];

      // special case for full spans
      if (typeof span !== 'number' && !isTimespanMS(span)) {
        if (u.length < 4 && u[0] === 'y' && (!u[1] || u[1] === 'M') && (!u[2] || u[2] === 'd')) {
          res = u.map(u => {
            if (u === 'y') {
              fraction = span.d[1] / 12;
              return span.d[0];
            } else if (u === 'M') {
              fraction = span.d[2] / 30;
              return span.d[1];
            } else {
              fraction = span.d[3] / 24;
              return span.d[2];
            }
          });
        } else if (u.length < 3 && u[0] === 'M' && (!u[1] || u[1] === 'd')) {
          res = u.map(u => {
            if (u === 'M') {
              fraction = span.d[2] / 30;
              return span.d[0] * 12 + span.d[1];
            } else {
              fraction = span.d[3] / 24;
              return span.d[2];
            }
          });
        }
      }

      // this isn't special cased, so get a number of ms
      if (!res) {
        let ms = typeof span === 'number' || isTimespanMS(span) ? timeSpanToNumber(span) : 's' in span ? +dateAndTimespan(new Date(span.s), span, 1) - +new Date(span.s) : (
          span.d[0] * timespans.y + span.d[1] * timespans.m + span.d[2] * timespans.d +
          span.d[3] * timespans.h + span.d[4] * timespans.mm + span.d[5] * timespans.s + span.d[6]
        );
        res = u.map(() => 0);

        const next = { y: 'm', M: 'w', w: 'd', d: 'h', h: 'mm', m: 's' };
        const nextDiv = { y: 12, M: 4.3, w: 7, d: 24, h: 60, m: 60 };

        for (let i = 0; i < res.length; i++) {
          const k = u[i] === 'm' ? 'mm' : u[i] === 'M' ? 'm' : u[i];
          if (k === 'l') {
            res[i] = ms;
            fraction = 0;
            break;
          }
          res[i] = Math.floor(ms / timespans[k]);
          ms -= res[i] * timespans[k];
          if (next[u[i]]) fraction = (ms / timespans[next[u[i]]]) / nextDiv[u[i]];
          else if (u[i] === 's') fraction = ms % 1000;
        }
      }

      // check for rounding
      if (namedArgs.round === true) {
        if (fraction >= 0.5) res[res.length - 1]++;
      } else if ((namedArgs.round || '')[0] === 'c') {
        if (fraction > 0) res[res.length - 1]++;
      }

      // check to see if stringification is needed
      if (namedArgs.string) {
        const units = { y: 'year', M: 'month', w: 'week', d: 'day', h: 'hour', m: 'minute', s: 'second', l: 'millisecond' };
        let str = '';
        for (let i = 0; i < u.length; i++) {
          if (!res[i]) continue;
          str += `${str.length ? ' ' : ''}${res[i]} ${units[u[i]]}${res[i] > 1 ? 's' : ''}`;
        }
        return str;
      } else return Array.isArray(namedArgs.unit) ? res : res[0];
    } else {
      if (namedArgs.string) {
        if (typeof span === 'number' || isTimespanMS(span)) {
          let ms = timeSpanToNumber(span);
          let res = '';
          const order = ['w', 'd', 'h', 'mm', 's'];
          const units = ['week', 'day', 'hour', 'minute', 'second', 'millisecond'];
          for (let i = 0; i < order.length; i++) {
            if (ms > timespans[order[i]]) {
              const u = Math.floor(ms / timespans[order[i]]);
              ms -= timespans[order[i]] * u;
              res += `${res.length ? ' ' : ''}${u} ${units[i]}${u > 1 ? 's' : ''}`;
            }
          }
          if (ms) {
            res += `${res.length ? ' ' : ''}${ms} millisecond${ms > 1 ? 's' : ''}`;
          }
        } else {
          let res = '';
          const units = ['year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond'];
          for (let i = 0; i < span.d.length; i++) {
            if (span.d[i]) res += `${res.length ? ' ' : ''}${span.d[i]} ${units[i]}${span.d[i] > 1 ? 's' : ''}`;
          }
          return res;
        }
      } else return span;
    }
  }),
  simple(['string'], (_name: string, [value]: any[]): string => {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.join(', ');
    let res = `${value}`;
    if (res.slice(0, 7) === '[object') return JSON.stringify(value);
    return res;
  }),
  simple(['call'], (_name: string, args: any[], ctx): any => {
    if (args[0] != null && typeof args[1] === 'string' && typeof args[0][args[1]] === 'function') {
      const obj = args.shift();
      const name = args.shift();
      return obj[name].apply(obj, args);
    }

    if (typeof args[0] === 'function') {
      const fn = args.shift();
      return fn.apply(null, args);
    }

    if (isValue(args[0])) {
      return evalApply(ctx, args[0], args.slice(1));
    }
  }),
  simple(['intersect'], (_name, [left, right]: any[]): any => {
    if (!Array.isArray(left) || !Array.isArray(right)) return [];
    const res = [];
    let el: any;
    for (let i = 0; i < left.length; i++) {
      el = left[i];
      if (~right.indexOf(el) && !~res.indexOf(el)) res.push(el);
    }
    for (let i = 0; i < right.length; i++) {
      el = right[i];
      if (!~res.indexOf(el) && ~left.indexOf(el)) res.push(el);
    }
    return res;
  }),
  simple(['let'], (_name, [name, value]: any[], ctx): any => {
    safeSet(ctx, name, value, true);
  }),
  simple(['set'], (_name, [name, value]: any[], ctx): any => {
    safeSet(ctx, name, value);
  }),
  simple(['similarity'], (_name, [left, right, threshhold, fudges]: any[]): number => {
    return similarity(`${left || ''}`, `${right || ''}`, threshhold, fudges);
  }),
  simple(['similar'], (_name, [left, right, threshhold, fudges]: any[]): any => {
    return similar(`${left || ''}`, `${right || ''}`, threshhold, fudges);
  }),
  simple(['overlap'], (_name, [left, right, threshhold]: any[]): any => {
    return overlap(`${left || ''}`, `${right || ''}`, threshhold);
  }),
);

// math
registerOperator(
  simple(['+'], (_name: string, values: any[]): number|string => {
    if (values.length === 1) {
      if (isDateRel(values[0])) return +dateRelToDate(values[0]);
      else if (!values[0]) return 0;
      return parseFloat(values[0]);
    }
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
  simple(['*'], (_name: string, values: any[]): number|string => {
    const first = values.shift();
    if (!isNum(first)) {
      if (typeof first === 'string' && values.length === 1 && isNum(values[0]) && +values[0] > 0) {
        let s = '';
        for (let i = 0; i < values[0]; i++) s += first;
        return s;
      }
      return 0;
    }
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
function pad(left: boolean, str: string, count: number, pad: string): string {
  if (typeof str !== 'string') str = '' + str;
  if (!isNum(count)) return str;
  if (!pad) pad = ' ';
  if (typeof pad !== 'string') pad = '' + pad;
  if (pad.length < 1) pad = ' ';

  for (let i = str.length; i < count; i = str.length) {
    if (left) str = pad + str;
    else str += pad;
  }

  return str;
}
const triml = /^\s*/;
const trimr = /\s*$/;
const escapeRe = /([\.\[\]\{\}\(\)\^\$\*\+\-])/g;
registerOperator(
  simple(['eval'], (_name: string, [v], ctx): any => {
    return evaluate(ctx, v);
  }),
  simple(['padl', 'padr'], (name: string, args: any[]): string => {
    let [str, count, val] = args;
    return pad(name === 'padl', str, count, val);
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
  simple(['date'], (_name: string, [v]: any[], ctx): Date => {
    if (v !== undefined) {
      if (isDateRel(v)) return dateRelToDate(v);
      if (typeof v === 'string') {
        const dt = new Date(v);
        if (isNaN(dt as any)) {
          let val = evaluate(ctx, ~v.indexOf('#') ? v : `#${v}#`);
          if (isDateRel(val)) return dateRelToDate(val);
        }
      }
      return new Date(v);
    }
    else return new Date();
  }),
  simple(['interval'], (_name: string, [v]: any[], ctx): DateRel => {
    return evaluate(ctx, ~v.indexOf('#') ? v : `#${v}#`);
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
  names: ['case', 'switch'],
  checkArg(_name: string, i: number, last: number, value: any, ctx: Context, ast): CheckResult {
    if (i === 0) { // set the value and move to the next
      (ctx.special || (ctx.special = {})).case = value;
      return 'continue';
    } else if (i % 2 === 1) {
      if (i === last) return { result: value }; // default case
      if (equals(value, ctx.special.case)) return 'continue';
      if (isValue(ast) && 'op' in ast && value === true) return 'continue'; // operators can also check for true
      if (isValue(value)) {
        const v = evalValue(ctx, value);
        if (equals(v, ctx.special.case)) return 'continue';
        if (v === true) return 'continue';
      }
      return { skip: 1 };
    } else return { result: value }; // odd branch
  },
  apply() {},
  extend: true,
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
      return value.map((v, i) => evalApply(extend(ctx, { value: v, special: { last, index: i, key: i, 'last-key': last } }), body, [v, i])).join('');
    } else {
      const entries = Object.entries(value);
      const lastKey = entries[entries.length - 1][0];
      const last = entries.length - 1;
      return Object.entries(value).map(([k, v], i) => evalApply(extend(ctx, { value: v, special: { last, 'last-key': lastKey, index: i, key: k } }), body, [v, k])).join('');
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
    return evalApply(extend(ctx, { value }), body, [value]);
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
    return arr.reduce((a, c) => a + num(args[0] ? evalApply(ctx, args[0], [c]) : c), 0) / arr.length;
  },
}, {
  type: 'aggregate',
  names: ['sum'],
  apply(_name: string, arr: any[], args: ValueOrExpr[], ctx: Context) {
    return arr.reduce((a, c) => a + num(args[0] ? evalApply(ctx, args[0], [c]) : c), 0);
  }
}, {
  type: 'aggregate',
  names: ['count'],
  apply(_name: string, arr: any[], args: ValueOrExpr[], ctx: Context) {
    if (args.length) return arr.filter((e, i) => evalApply(ctx, args[0], [e, i])).length;
    else return arr.length;
  }
}, {
  type: 'aggregate',
  names: ['min', 'max'],
  apply(name: string, arr: any[], args: ValueOrExpr[], ctx: Context) {
    if (args[0]) arr = arr.map(e => evalApply(ctx, args[0], [e]));
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
      const i = evalParse(ctx, args[0]);
      if (typeof i === 'number') {
        val = arr[i];
        apply = 1;
      }
    }
    if (args[apply]) val = evalParse(ctx, args[apply]);
    return val;
  }
}, {
  type: 'aggregate',
  names: ['map'],
  apply(_name: string, arr: any[], args: ValueOrExpr[], ctx: Context) {
    if (!args[0]) return arr;
    return arr.map((e, i) => evalApply(ctx, args[0], [e, i]));
  }
}, {
  type: 'aggregate',
  names: ['reduce'],
  apply(_name: string, arr: any[], args: ValueOrExpr[], ctx: Context) {
    if (!args[0]) return arr;
    return arr.reduce((a, c, i) => evalApply(ctx, args[0], [a, c, i]), evalParse(ctx, args[1]));
  }
}, {
  type: 'aggregate',
  names: ['unique', 'unique-map'],
  apply(name: string, arr: any[], args: ValueOrExpr[], ctx: Context) {
    const seen = [];
    const res = [];
    for (const e of arr) {
      const f = args[0] ? evalApply(ctx, args[0], [e]) : e;
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
    if (args.length > 1) return arr.map(e => evalApply(ctx, args[0], [e])).join(evalParse(ctx, args[1]));
    return arr.join(evalParse(ctx, args[0]));
  }
}, {
  type: 'aggregate',
  names: ['find'],
  apply(_name: string, arr: any[], args: ValueOrExpr[], ctx: Context) {
    if (!args[0]) return;
    if (typeof args[0] === 'object' && 'a' in args[0]) return arr.find((e, i) => evalApply(ctx, args[0], [e, i]));
    else {
      const v = evalParse(ctx, args[0]);
      return arr.find(e => e == v);
    }
  }
}, {
  type: 'aggregate',
  names: ['block'],
  apply(_name: string, _arr: any[], args: ValueOrExpr[], ctx: Context) {
    const last = args.length - 1;
    if (last < 0) return;
    const c = extend(ctx, { locals: {} });
    for (let i = 0; i < last; i++) evalParse(c, args[i]);
    return evalParse(c, args[last]);
  },
  value: true,
});

// basic formats
registerFormat('dollar', (n, [dec, sign]) => {
  return dollar(n, undefined, dec, sign);
});

registerFormat('date', (n, [fmt]) => {
  return date(isDateRel(n) ? dateRelToDate(n) : n, fmt);
});

registerFormat('integer', (n, [group]) => {
  return number(n, 0, group);
});
registerFormat('int', (n, [group]) => {
  return number(n, 0, group);
});

registerFormat('number', (n, [dec, group]) => {
  return number(n, dec, group);
});
registerFormat('num', (n, [dec, group]) => {
  return number(n, dec, group);
});

registerFormat('ordinal', (n, [group]) => {
  return ordinal(n, group == null ? ',' : group);
});

registerFormat('phone', n => {
  return phone(n);
});

registerFormat('or', (n, [v]) => {
  return n || v;
});

registerFormat('padl', (n, [count, val]) => {
  return pad(true, n, count, val || '0');
});

registerFormat('padr', (n, [count, val]) => {
  return pad(false, n, count, val || ' ');
});

registerFormat('trim', n => {
  if (!n) return n;
  else return `${n}`.trim();
});

{
  const space = /\s+/g;
  const br = /\b\w/g;
  const alphaNum = /[^a-zA-Z0-9]+([a-zA-Z0-9])/g;
  const alphaNumSpace = /[^\sa-zA-Z0-9]/g;
  const camelBreak = /([a-z])([A-Z])/g;
  const spaceChar = /\s([^\s])/g;
  function normalize(s: string) {
    return s.replace(alphaNum, (_m, c) => c ? ` ${c}` : '').replace(alphaNumSpace, '').replace(camelBreak, (_m, c1, c2) => `${c1} ${c2}`).trim();
  }
  registerFormat('case', (n, whiches) => {
    let str = `${n || ''}`.trim();
    for (const which of whiches) {
      if (which === 'upper' || which === 'up') str = str.toUpperCase();
      else if (which === 'lower' || which === 'down') str = str.toLowerCase();
      else if (which === 'snake') str = normalize(str).toLowerCase().replace(space, '_');
      else if (which === 'kebab') str = normalize(str).toLowerCase().replace(space, '-');
      else if (which === 'pascal') {
        const s = normalize(str);
        str = s[0].toUpperCase() + s.toLowerCase().substr(1).replace(spaceChar, (_m, c) => (c || '').toUpperCase());
      } else if (which === 'camel') {
        const s = normalize(str);
        str = s[0].toLowerCase() + s.toLowerCase().substr(1).replace(spaceChar, (_m, c) => (c || '').toUpperCase());
      } else if (which === 'proper') {
        if (/[a-z]/.test(str)) str = str.trim().replace(br, m => m.toUpperCase());
        else str = str.toLowerCase().trim().replace(br, m => m.toUpperCase());
      }
    }
    return str;
  });
}
