import { filter, safeGet, safeSet, registerOperator, CheckResult, ValueOperator, ValueOrExpr, Context, Root, evaluate, evalApply, evalValue, evalParse, extend, formats, registerFormat, dateRelToRange, dateRelToExactRange, dateRelToDate, isDateRel, isKeypath, isTimespan, isApplication, dateAndTimespan, addTimespan, isValue, datesDiff, DateRel, getOperator } from './index';
import { date, dollar, ordinal, number, phone } from './format';
import { timespans, isTimespanMS, timeSpanToNumber, parseTime, parseDate, parseExpr, parse } from './parse';
import { parse as parseTemplate } from './parse/template';
import { parseSchema, unparseSchema } from './parse/schema';
import { stringify } from './parse/stringify';
import { range as parseRange } from './parse/range';
import { validate, inspect } from './schema';
import { diff, deepEqual, labelDiff } from './diff';

function simple(names: string[], apply: (name: string, values: any[], ctx: Context) => any): ValueOperator {
  return {
    type: 'value', names, apply
  };
}

const spanMap = {
  y: [0, 12],
  M: [1, 30],
  d: [2, 24],
};

const hasNum = /^[^\d]*(\d+(?:\.\d*)?)/;

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
  simple(['is', 'is-not', '==', '!=', 'strict-is', 'strict-is-not'], (name: string, values: any[]): boolean => {
    const [l, r] = values;
    const res = equals(l, r);
    return name === 'is' || name === '==' ? res : !res;
  }),
  simple(['strict-is', 'strict-is-not'], (name: string, values: any[]): boolean => {
    const [l, r] = values;
    const res = l === r;
    return name === 'strict-is' ? res : !res;
  }),
  simple(['deep-is', 'deep-is-not', '===', '!=='], (name: string, values: any[], ctx): boolean => {
    let [l, r, equal] = values;
    if (equal && isApplication(equal)) {
      const eq = equal;
      equal = (l: any, r: any) => evalApply(ctx, eq, [l, r]);
    }
    const res = deepEqual(l, r, equal);
    return name === 'deep-is' || name === '===' ? res : !res;
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
      } else if (l && 'f' in l && 'o' in l) {
        l = dateRelToRange(l)[name[0] === '<' ? 1 : 0];
        r = new Date(r);
      } else if (r && 'f' in r && 'o' in r) {
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
      const re = new RegExp(`${free ? '' : '^'}${r.replace(/[\s\%\*]+/g, '[\\s\\S]*').replace(/\?/g, '.')}${free ? '' : '$'}`, ~name.indexOf('ilike') ? 'i' : '');
      if (Array.isArray(target)) res = !!target.find(v => re.test(v));
      else res = re.test(target);
    }
    return name === 'like' || name === 'ilike' ? res : !res;
  }),
  simple(['in', 'not-in'], (name: string, values: any[], ctx: Context): boolean => {
    const [l, r] = values;
    let range: any;
    if (isDateRel(r)) {
      const range = dateRelToRange(r);
      const d = isDateRel(l) ? dateRelToRange(l)[0] : new Date(l);
      const n = d >= range[0] && d <= range[1];
      return name === 'in' ? n : !n;
    } else if (typeof l === 'string' && typeof r === 'object' && !Array.isArray(r)) {
      return l in r;
    } else if (Array.isArray(l) && l.length > 0 && typeof l[0] === 'string' && !Array.isArray(r) && r && typeof r === 'object') {
      const keys = Object.keys(r);
      const found = l.reduce((a, c) => a && ~keys.indexOf(c), true);
      return name === 'in' ? found : !found;
    } else if (typeof r === 'string' && isNum(l) && (range = _parseRange(ctx, r), Array.isArray(range))) {
      const found = range.reduce((a, c) => a || (Array.isArray(c) ? l >= c[0] && l <= c[1] : l == c), false);
      return name === 'in' ? found : !found;
    } else if (isApplication(l)) {
      let found: any = false;
      if (Array.isArray(r) || r && typeof r === 'object' && '0' in r) found = Array.prototype.find.call(r, (e: any, i: number) => evalApply(ctx, l, [e, i], false, { index: i, key: i }));
      else if (r && typeof r === 'object') found = Object.entries(r).find((e, i) => evalApply(ctx, l, [e[1], i, e[0]], false, { index: i, key: e[0] }));
      return name === 'in' ? !!found : !found;
    } else if (!Array.isArray(r) && typeof r !== 'string') {
      return name === 'in' ? l == r : l != r;
    } else if (Array.isArray(l) && Array.isArray(r)) {
      const b = l.reduce((a, c) => a && ~r.indexOf(c), true);
      return name === 'in' ? !!b : !b;
    }
    const res = !!~r.indexOf(l);
    return name === 'in' ? res : !res;
  }), 
  simple(['contains', 'does-not-contain'], (name: string, values: any[], ctx: Context): boolean => {
    const [l, r] = values;
    if (isDateRel(l)) {
      const range = dateRelToRange(l);
      const d = isDateRel(r) ? dateRelToRange(r)[0] : new Date(r);
      const n = d >= range[0] && d <= range[1];
      return name === 'contains' ? n : !n;
    } else if (isApplication(r)) {
      let found: any = false;
      if (Array.isArray(l) || l && typeof l === 'object' && '0' in l) found = Array.prototype.find.call(l, (e: any, i: number) => evalApply(ctx, r, [e, i], false, { index: i, key: i }));
      else if (r && typeof l === 'object') found = Object.entries(l).find((e, i) => evalApply(ctx, r, [e[1], i, e[0]], false, { index: i, key: e[0] }));
      return name === 'contains' ? !!found : !found;
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
      else if (typeof arr === 'object' && arr) return Object.entries(arr).filter((e, i) => evalApply(ctx, flt, [e[1], i, e[0]], false, { index: i, key: e[0] })).reduce((a, c) => (a[c[0]] = c[1], a), {});
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
        const us = u.join('');
        if (us === 'd') {
          if (span.s) {
            const from = new Date(span.s);
            from.setHours(0);
            from.setMinutes(0);
            from.setSeconds(0);
            from.setMilliseconds(0);
            const to = new Date(+from);
            to.setDate(1);
            to.setFullYear(to.getFullYear() + span.d[0]);
            to.setMonth(from.getMonth() + span.d[1]);
            const m = to.getMonth();
            to.setDate(from.getDate());
            if (to.getMonth() !== m) to.setDate(0);
            to.setDate(to.getDate() + span.d[2]);
            const dist = +to - +from;
            let d = Math.floor(dist / 86400000);
            const r = dist % 86400000;
            if (r >= 82800000) d++;
            res = [d];
          } else {
            // this is an approximation
            res[0] += span.d[0] * 365;
            res[0] += span.d[1] * 30;
          }
        } else if (u.length < 4 && (us === 'y' || us === 'yM' || us === 'yMd' || us === 'M' || us === 'Md' || us === 'd')) {
          res = u.map(u => {
            fraction = span.d[spanMap[u][0] + 1] / spanMap[u][1];
            return span.d[spanMap[u][0]];
          });
          if (u[0] === 'M') res[0] += span.d[0] * 12;
        }
      }

      // this isn't special cased, so get a number of ms
      if (!res) {
        let ms = typeof span === 'number' || isTimespanMS(span) ? timeSpanToNumber(span) : span && 's' in span ? +dateAndTimespan(new Date(span.s), span, 1) - +new Date(span.s) : (
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
        // very special case for months that get rounded to a year
        if (u[0] === 'y' && u[1] === 'M' && u.length === 2 && res[1] === 12) {
          res[0]++;
          res[1] = 0;
        }
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
  simple(['string', 'unparse'], (name: string, args: any[]): string => {
    const [value] = args;
    let opts = args.slice(-1)[0] || {};
    if (name === 'unparse') opts = Object.assign({}, opts, { raport: 1 });
    if (opts.raport && opts.tpl) opts.template = 1;
    if (!opts && (value === null || value === undefined)) return '';

    if (typeof opts === 'object' && opts.json) return JSON.stringify(value);
    if (typeof opts === 'object' && opts.schema) return unparseSchema(value);
    else if (typeof opts === 'object' && opts.raport) {
      let v = stringify(value, opts);
      if (v === undefined) v = stringify({ v: value }, opts);
      return v;
    }

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
  simple(['validate', 'valid'], (name, [left, right, mode]) => {
    const res = validate(left, right, mode);
    if (name === 'valid') return res === true;
    else return res;
  }),
  simple(['inspect'], (_name, [v, mode]) => {
    if (mode === 'schema') return unparseSchema(inspect(v));
    else return inspect(v);
  }),
  simple(['diff'], (_, [left, right, equal], ctx) => {
    if (equal && isApplication(equal)) {
      const eq = equal;
      equal = (l: any, r: any) => evalApply(ctx, eq, [l, r]);
    }
    return diff(left, right, equal);
  }),
  simple(['label-diff'], (_, [diff, label, opts]) => {
    return labelDiff(diff, label, opts);
  }),
);

// math
registerOperator(
  simple(['+', 'add'], (_name: string, values: any[]): any => {
    if (values.length === 1) {
      if (isDateRel(values[0])) return +dateRelToDate(values[0]);
      else if (!values[0]) return 0;
      return parseFloat(values[0]);
    }
    if (Array.isArray(values[0])) return values[0].concat.apply(values[0], values.slice(1));
    else if (isDateRel(values[0]) && values.length > 1 && values.slice(1).reduce((a, c) => a && isTimespan(c), true)) return values.slice(1).reduce((a, c) => dateAndTimespan(a, c, 1), dateRelToDate(values[0])); 
    else if (typeof values[0] !== 'number' && values.length > 1 && isTimespan(values[0])) return values.slice(1).reduce((a, c) => addTimespan(a, c), values[0]);
    else if (values.reduce((a, c) => a && typeof c === 'object' && !isDateRel(c), true)) return Object.assign.apply(Object, [{}].concat(values));
    const num = values.reduce((a, c) => a && isNum(c), true);
    if (num) {
      return values.reduce((a, c) => a + +c, 0);
    } else {
      return values.reduce((a, c) => a + (c === undefined || c === null ? '' : c), '');
    }
  }),
  simple(['num'], (_name: string, [v]) => {
    let match: string[];
    if (match = hasNum.exec(v)) return +match[1];
    return parseInt(v);
  }),
  simple(['-', 'subtract'], (_name: string, values: any[]): number => {
    const first = values.shift();
    if (isDateRel(first)) {
      if (values.reduce((a, c) => a && isDateRel(c), true)) return values.reduce((a, c) => a - +dateRelToDate(c), +dateRelToDate(first));
      if (values.reduce((a, c) => a && isTimespan(c), true)) return values.reduce((a, c) => dateAndTimespan(a, c, -1), dateRelToDate(first));
    }
    return values.reduce((a, c) => a - (!isNum(c) ? 0 : +c), !isNum(first) ? 0 : +first);
  }),
  simple(['*', 'multiply'], (_name: string, values: any[]): number|string => {
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
  simple(['/', '/%', 'divide', 'intdiv'], (name: string, values: any[]): number => {
    const first = values.shift();
    if (isNaN(first)) return 0;
    if (name.length > 1 || name === 'intdiv') return values.reduce((a, c) => Math.floor(a / (isNaN(c) ? 1 : +c)), +first);
    else return values.reduce((a, c) => a / (isNaN(c) ? 1 : +c), +first);
  }),
  simple(['%', 'modulus'], (_name: string, values: any[]): number => {
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
  simple(['slice', 'substr'], (_name: string, [src, start, end]: any[], ctx) => {
    if (src && typeof src.slice === 'function') return src.slice(start, end);
    else {
      const op = getOperator<ValueOperator>('string');
      if (op) return `${op.apply('string', [src], ctx)}`.slice(start, end);
    }
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
  simple(['date'], (_name: string, args: any[], ctx): Date|DateRel => {
    let [v, t] = args;
    let opts = (args.length > 1 ? args.slice(-1)[0] : false) || {};
    if (typeof opts !== 'object') opts = {};

    let res: Date|DateRel;
    if (v !== undefined) {
      if (isDateRel(v)) res = dateRelToDate(v);
      else if (typeof v === 'string') {
        let dt = parseDate(v);
        if (isDateRel(dt)) {
          res = dt;
        } else {
          if (!dt) dt = new Date(v);
          if (isNaN(dt as any)) {
            let val = evaluate(ctx, ~v.indexOf('#') ? v : `#${v}#`);
            if (isDateRel(val)) {
              if (opts.rel || opts.parse) res = val;
              else res = dateRelToDate(val);
            }
          }
        }
      }
      if (!res) res = new Date(v);
    }
    else res = new Date();


    if ((opts.rel || opts.parse) && isDateRel(res)) {
      let rel = dateRelToExactRange(res);
      if (typeof t === 'string') t = parseTime(t);

      if (Array.isArray(t)) {
        const f = rel.f;
        f[3] = t[0], f[4] = t[1], f[5] = t[2], f[6] = t[3];
        t = t[4];
      }

      if (typeof t === 'number') {
        if (opts.shift) {
          const diff = (+rel.f[7] || 0) - t;
          const dt = dateRelToDate(rel);
          dt.setMinutes(dt.getMinutes() - diff);
          rel = dateRelToExactRange(dt);
        }

        rel.f[7] = t;
        res = rel;
      }
    } else {
      const rdt = isDateRel(res) ? dateRelToDate(res) : res as Date;
      if ('y' in opts && !isNaN(opts.y)) rdt.setFullYear(opts.y);
      const y = rdt.getFullYear();
      if ('m' in opts && !isNaN(opts.m)) {
        rdt.setMonth(+opts.m - 1);
        if (opts.clamp && rdt.getFullYear() !== y) {
          rdt.setFullYear(y);
          rdt.setMonth(11);
        }
      }
      const m = rdt.getMonth();
      if ('d' in opts && !isNaN(opts.d)) {
        rdt.setDate(opts.d);
        if (opts.clamp && (rdt.getMonth() !== m || rdt.getFullYear() !== y)) {
          rdt.setDate(1);
          rdt.setFullYear(y);
          rdt.setMonth(m + 1);
          rdt.setDate(0);
        }
      }

      if (t) {
        if (res === v) {
          if (typeof v === 'string') {
            const dt = parseDate(v);
            if (dt && isDateRel(dt)) res = dateRelToDate(dt);
            else res = new Date(v);
          } else res = new Date(v);
        }

        if (typeof t === 'string') t = parseTime(t);
        if (Array.isArray(t)) {
          rdt.setHours(t[0] || 0, t[1] || 0, t[2] || 0, t[3] || 0);
          if (t[4] != null) {
            const offset = -rdt.getTimezoneOffset() - t[4];
            rdt.setMinutes(rdt.getMinutes() + offset);
          }
        } else if (typeof t === 'number') {
          const offset = -rdt.getTimezoneOffset() - t;
          rdt.setMinutes(rdt.getMinutes() + offset);
        }
      }

      res = rdt;
    }

    return res;
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
  simple(['parse'], (_name: string, args: any[]): any => {
    let opts = args.slice(-1)[0] || {};
    if (typeof opts !== 'object') opts = {};
    const [v] = args;

    if (opts.date) return parseDate(v, opts);
    else if (opts.template || opts.tpl) return parseTemplate(v, opts);
    else if (opts.time) return parseTime(v, opts);
    else if (opts.expr) return parseExpr(v, opts);
    else if (opts.schema) return parseSchema(v);
    else if (opts.range) return parseRange(v, opts);
    else return parse(v, opts);
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
  names: ['or', '||', '??'],
  checkArg(name: string, _i: number, _total: number, value: any): CheckResult {
    if (name === '??' ? value != null : value) return { result: value };
    else return 'continue';
  },
  apply(name: string): boolean {
    return name === '??' ? undefined : false; // if we made it this far, none were true
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
    const v = args.length === 2 ? evalParse(ctx, args[0]) : arr;
    const app = evalParse(ctx, args.length === 2 ? args[1] : args[0]);
    if ((Array.isArray(v) || '0' in v) && isApplication(app)) return Array.prototype.map.call(v, (e: any, i: number) => evalApply(ctx, app, [e, i], false, { index: i, key: i }));
    else if (v && typeof v === 'object' && isApplication(app)) {
      const res: any = {};
      Object.entries(v as object).forEach((e, i) => {
        const r = evalApply(ctx, app, [e[1], i, e[0]], false, { index: i, key: e[0] });
        if (Array.isArray(r) && r.length === 2 && typeof r[0] === 'string') res[r[0]] = r[1];
        else if (r == null) return;
        else res[e[0]] = r;
      });
      return res;
    }
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
    else if (isApplication(args[0])) return arr.find((e, i) => evalApply(ctx, args[0], [e, i], false, { index: i, key: i }));
    else if (isApplication(args[1])) {
      const v = evalParse(ctx, args[0]);
      if (Array.isArray(v)) return v.find((e, i) => evalApply(ctx, args[1], [e, i], false, { index: i, key: i }));
      else if (typeof v === 'object' && v) {
        const e = Object.entries(v).find((e, i) => evalApply(ctx, args[1], [e[1], i, e[0]], false, { index: i, key: e[0] }));
        if (e) return e[1];
      }
    } else {
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

function fmtDate(n: any, fmt: string): string {
  if (typeof n === 'string') {
    const d = parseDate(n);
    if (d) n = d;
  }
  return date(isDateRel(n) ? dateRelToExactRange(n) : n, fmt);
}

function _parseRange(ctx: Context, range: string) {
  const map = (ctx.root as any)._ranges || ((ctx.root as any)._ranges = {})
  if (range in map) return map[range];
  return (map[range] = parseRange(range));
}

// basic formats
registerFormat('dollar', (n, [dec, sign, neg]) => {
  return dollar(n, undefined, dec, sign, neg);
});

registerFormat('date', (n, [fmt]) => {
  return fmtDate(n, fmt);
});

registerFormat('time', n => {
  return fmtDate(n, 'HH:mm:ss');
});

registerFormat('timestamp', n => {
  return fmtDate(n, 'yyyy-MM-dd HH:mm:ss');
});

registerFormat('timestamptz', n => {
  return fmtDate(n, 'yyyy-MM-dd HH:mm:sszzz');
});

registerFormat('iso8601', n => {
  return fmtDate(n, 'yyyy-MM-ddTHH:mm:sszzz');
});

registerFormat(['integer', 'int'], (n, [group, neg]) => {
  return number(n, 0, group, neg);
});

registerFormat(['number', 'num'], (n, [dec, group, neg]) => {
  return number(n, dec, group, neg);
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
  const br = /[\s;,.:"]\w/g;
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
        str = (str[0] || '').toUpperCase() + str.substr(1);
      }
    }
    return str;
  });
}
