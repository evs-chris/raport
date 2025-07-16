import { filter, safeGet, safeSet, registerOperator, CheckResult, ValueOperator, ValueOrExpr, Context, evaluate, evalApply, evalValue, evalParse, template, extend, formats, virtualFormats, registerFormat, dateRelToRange, dateRelToExactRange, dateRelToDate, isDateRel, isKeypath, isTimespan, isApplication, dateAndTimespan, addTimespan, isValue, datesDiff, DateRel, getOperator, applyOperator, OperatorOptions, sort, toDataSet, Root } from './index';
import { date, dollar, ordinal, number, phone } from './format';
import { timespans, isTimespanMS, timeSpanToNumber, parseTime, parseDate, parseExpr, parse } from './parse';
import { parse as parseTemplate } from './parse/template';
import { parseSchema, unparseSchema } from './parse/schema';
import { stringify } from './parse/stringify';
import { range as parseRange, ParseError } from './parse/range';
import { validate, inspect, isSchema } from './schema';
import { diff, deepEqual, labelDiff } from './diff';
import { detect as csvDetect, parse as csvParse } from './csv';
import { style } from './parse/style';
import { parse as parseXML } from './parse/xml';
import { measure, escapeHTML } from '../render/index';

function simple(names: string[], apply: (name: string, values: any[], opts: OperatorOptions, ctx: Context) => any): ValueOperator {
  return {
    type: 'value', names, apply
  };
}

const spanMap = {
  y: [0, 12],
  M: [1, 30],
  d: [2, 24],
};

const generateDefaults = {
  max: 10000,
};

function stringTimes(str: string, times: number): string {
  let res = '';
  for (let i = 0; i < times; i++) res += str;
  return res;
}

type RoundingMethod = 'half-up'|'half-down'|'half-even'|'half-odd'|'half-to-0'|'half-from-0'|'to-0'|'from-0'|'up'|'down';
const roundDefaults = {
  places: 2,
  'all-numeric': false,
  method: 'half-even' as RoundingMethod,
};
export function round(amt: string|number, settings?: { places: number; method: RoundingMethod }): string {
  const place = settings?.places ?? roundDefaults.places;
  const type = settings?.method ?? roundDefaults.method;
  if (place > 0) {
    let str = (+amt || 0).toString();
    const point = str.indexOf('.');
    if (!~point) return (+str).toFixed(place);
    let dec = str.slice(point + 1);
    if (dec.length <= place) return (+str).toFixed(place);
    str += '0';
    dec += '0';
    const l = +`${str.slice(place - dec.length, place - dec.length + 1)}` || 0;
    const rest = parseInt(str.slice(place - dec.length) + '0');
    if (type === 'up' && rest > 0) {
      if (+amt > 0) return (+str.slice(0, place - dec.length) + +`0.${stringTimes('0', place - 1)}1`).toFixed(place);
      else return str.slice(0, place - dec.length);
    } else if (type === 'down' && rest > 0) {
      if (+amt < 0) return (+str.slice(0, place - dec.length) - +`0.${stringTimes('0', place - 1)}1`).toFixed(place);
      else return str.slice(0, place - dec.length);
    } else if (type === 'to-0' && rest > 0) {
      return str.slice(0, place - dec.length);
    } else if (type === 'from-0' && rest > 0) {
      if (+amt < 0) return (+str.slice(0, place - dec.length) - +`0.${stringTimes('0', place - 1)}1`).toFixed(place);
      else return (+str.slice(0, place - dec.length) + +`0.${stringTimes('0', place - 1)}1`).toFixed(place);
    }
    if (+l < 5) return str.slice(0, place - dec.length);
    else if (+l > 5 || +`${str.slice(1 + place - dec.length)}`) return (+amt).toFixed(place);
    else {
      const pre = `${str.slice(0, place - dec.length)}`;
      const f = +str.slice(place - dec.length - 1, place - dec.length);
      if (type === 'half-odd') return (+`${pre}${f % 2 === 0 ? 6 : 4}`).toFixed(place);
      else if (type === 'half-up') return (+`${pre}${+pre > 0 ? 6 : 4}`).toFixed(place);
      else if (type === 'half-down') return (+`${pre}${+pre > 0 ? 4 : 6}`).toFixed(place);
      else if (type === 'half-to-0') return (+`${pre}4`).toFixed(place);
      else if (type === 'half-from-0') return (+`${pre}6`).toFixed(place);
      else return (+`${pre}${f % 2 === 0 ? 4 : 6}`).toFixed(place);
    }
  } else if (place === 0) {
    let str = (+amt || 0).toString();
    const point = str.indexOf('.');
    if (!~point) return str;
    str = `${str}00`;
    const p = +str.slice(point - 1, point);
    const n = +str.slice(point + 1, point + 2);
    const rest = parseInt(str.slice(point + 1) + '0');
    if (type === 'up' && rest > 0) {
      if (+amt > 0) return (+str.slice(0, point) + 1).toFixed(0);
      else return str.slice(0, point);
    } else if (type === 'down' && rest > 0) {
      if (+amt < 0) return (+str.slice(0, point) - 1).toFixed(0);
      else return str.slice(0, point);
    } else if (type === 'to-0' && rest > 0) {
      return str.slice(0, point);
    } else if (type === 'from-0' && rest > 0) {
      if (+amt < 0) return (+str.slice(0, point) - 1).toFixed(0);
      else if (+amt > 0) return (+str.slice(0, point) + 1).toFixed(0);
    }
    if (n < 5) return str.slice(0, point);
    else if (n > 5 || n === 5 && +str.slice(point + 2)) return (+`${str.slice(0, point - 1)}0` + (p + 1) * (+str < 0 ? -1 : 1)).toString();
    else {
      const base = +`${str.slice(0, point - 1)}0`;
      if (type === 'half-odd') return (base + (p % 2 === 0 ? p + 1 : p) * (+str < 0 ? -1 : 1)).toString()
      else if (type === 'half-up') return (base + (+str > 0 ? p + 1 : p) * (+str < 0 ? -1 : 1)).toString()
      else if (type === 'half-down') return (base + (+str < 0 ? p + 1 : p) * (+str < 0 ? -1 : 1)).toString()
      else if (type === 'half-to-0') return base.toString();
      else if (type === 'half-from-0') return (base + 1).toString();
      else return (base + (p % 2 === 0 ? p : p + 1) * (+str < 0 ? -1 : 1)).toString();
    }
  } else {
    let str = `${+amt < 0 ? Math.floor(+amt || 0) : Math.ceil(+amt || 0)}`;
    if (0 - place > str.length && type !== 'up' && type !== 'down' && type !== 'to-0' && type !== 'from-0') return `0`;
    const n = +str.slice(place, place === -1 ? undefined : place + 1);
    const rest = +(str.slice(place) + '0');
    let p = str.slice(place - 1, place);
    if (p === '-') p = '';
    const zeroes = `${Math.pow(10, 0 - place).toString().slice(1)}`
    if (!p) {
      const big = `${+str < 0 ? '-' : ''}1${zeroes}`;
      if (type === 'up') {
        if (+amt > 0) return big;
        else return '0';
      } else if (type === 'down') {
        if (+amt < 0) return big;
        else return '0';
      } else if (type === 'to-0') {
        return '0';
      } else if (type === 'from-0') {
        return big;
      }
      if (+str > 0 && +str < 5 || +str < 0 && +str > -5) return '0';
      else if (+str > 0 && +str > 5 || +str < 0 && +str < -5) return big;
      else {
        if (type === 'half-odd') return big;
        else if (type === 'half-up') return +str > 0 ? big : '0';
        else if (type === 'half-down') return +str > 0 ? '0' : big;
        else if (type === 'half-to-0') return '0';
        else if (type === 'half-from-0') return big;
        else return '0';
      }
    } else {
      if (type === 'up' && rest > 0) {
        if (+str > 0) return (+(str.slice(0, place) + stringTimes('0', place * -1)) + +`1${stringTimes('0', place * -1)}`).toFixed(0);
        else return str.slice(0, place) + stringTimes('0', place * -1);
      } else if (type === 'down' && rest > 0) {
        if (+str < 0) return (+(str.slice(0, place) + stringTimes('0', place * -1)) - +`1${stringTimes('0', place * -1)}`).toFixed(0);
        else return str.slice(0, place) + stringTimes('0', place * -1);
      } else if (type === 'to-0' && rest > 0) {
        return str.slice(0, place) + stringTimes('0', place * -1);
      } else if (type === 'from-0' && rest > 0) {
        if (+str > 0) return (+(str.slice(0, place) + stringTimes('0', place * -1)) + +`1${stringTimes('0', place * -1)}`).toFixed(0);
        return (+(str.slice(0, place) + stringTimes('0', place * -1)) - +`1${stringTimes('0', place * -1)}`).toFixed(0);
      }
      if (n < 5) return `${str.slice(0, place)}${zeroes}`
      else if (n > 5 || place < -1 && +`${str.slice(place + 1)}`) return (+`${+str.slice(0, place - 1) || 0}${0}${zeroes}` + +`${+p + 1}${zeroes}` * (+str < 0 ? -1 : 1)).toString();
      else {
        const base = +`${str.slice(0, place - 1) || 0}0${zeroes}`;
        if (type === 'half-odd') return (base + +`${+p % 2 === 0 ? +p + 1 : +p}${zeroes}` * (+str < 0 ? -1 : 1)).toString();
        else if (type === 'half-up') return (base + +`${+str > 0 ? +p + 1 : +p}${zeroes}` * (+str < 0 ? -1 : 1)).toString();
        else if (type === 'half-down') return (base + +`${+str < 0 ? +p + 1 : +p}${zeroes}` * (+str < 0 ? -1 : 1)).toString();
        else if (type === 'half-to-0') return (base + +`${+p}${zeroes}` * (+str < 0 ? -1 : 1)).toString();
        else if (type === 'half-from-0') return (base + +`${+p + 1}${zeroes}` * (+str < 0 ? -1 : 1)).toString();
        else return (base + +`${+p % 2 === 0 ? +p : +p + 1}${zeroes}` * (+str < 0 ? -1 : 1)).toString();
      }
    }
  }
}

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
  if (l === r || l == r) return true; // eslint-disable-line eqeqeq
  if (isDateRel(l) && isDateRel(r)) return +dateRelToDate(l) === +dateRelToDate(r);
  if (typeof l === 'number' && typeof r === 'number') return isNaN(l) && isNaN(r);
  return false;
}

/**
 * Find the first overlapping substring that contains threshhold percent characters of the smallest string length.
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
 * @param threshhold - defaults to 0.5 - the required similarity between two substrings, accounting for the fudge factor
 * @param fudges - the number skippable characters in either string without a match
 * @param whole - adjust the similarity account for the whole string rather than only the first matching substring
 * @returns - the similarity of the first qualifying match
 */
export function similarity(a: string, b: string, threshhold: number = 0.5, fudges: number = 2, whole = false): number {
  const res = similar(a, b, threshhold, fudges);
  if (res && whole) return (res[2] || 0) * (((res[0].length / a.length) + (res[1].length / b.length)) / 2);
  return res && res[2] || 0;
}

/**
 * Finds the similarity between two strings based on a minimum threshhold and a fudge factor. The minimum threshhold determins the earliest that the search can return. The fudge factor allows skipping characters in either string, though there is no backtracking.
 * @param a - the first string
 * @param b - the second string
 * @param threshhold - defaults to 0.5 - the required similarity between two substrings, accounting for the fudge factor
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

export function inRange(v: number, range: Array<number|[number, number]|{ not: number|[number, number] }>): boolean {
  let found = false;
  let excluded = false;
  for (const r of range) {
    if (Array.isArray(r) && v >= r[0] && v <= r[1]) found = true;
    else if (typeof r === 'object' && 'not' in r) {
      if (Array.isArray(r.not) && v >= r.not[0] && v <= r.not[1]) excluded = true;
      else if (v == r.not) excluded = true;
    } else if (v == r) found = true;
  }
  return found && !excluded;
}

// basic ops
registerOperator(
  simple(['is', 'is-not', '==', '!='], (name: string, values: any[]): boolean => {
    const [l, r] = values;
    let cmp = equals(l, r);
    if (!cmp && (name === 'is' || name === 'is-not') && isSchema(r)) cmp = validate(l, r, 'loose') === true;
    return name === 'is' || name === '==' ? cmp : !cmp;
  }),
  simple(['strict-is', 'strict-is-not'], (name: string, values: any[]): boolean => {
    const [l, r] = values;
    let res = l === r;
    if (!res && isSchema(r)) res = validate(l, r, 'strict') === true;
    return name === 'strict-is' ? res : !res;
  }),
  simple(['deep-is', 'deep-is-not', '===', '!=='], (name: string, [l, r, equal]: any[], opts, ctx: Context): boolean => {
    equal = equal || opts?.equal;
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
  simple(['in', 'not-in'], (name: string, values: any[], _opts, ctx: Context): boolean => {
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
      const found = inRange(+l, range);
      return name === 'in' ? found : !found;
    } else if (isApplication(l)) {
      let found: any = false;
      if (Array.isArray(r) || r && typeof r === 'object' && '0' in r) found = Array.prototype.find.call(r, (e: any, i: number) => evalApply(ctx, l, [e, i], { index: i, key: i }));
      else if (r && typeof r === 'object') found = Object.entries(r).find((e, i) => evalApply(ctx, l, [e[1], i, e[0]], { index: i, key: e[0] }));
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
  simple(['contains', 'does-not-contain'], (name: string, values: any[], _opts, ctx: Context): boolean => {
    const [l, r] = values;
    if (isDateRel(l)) {
      const range = dateRelToRange(l);
      const d = isDateRel(r) ? dateRelToRange(r)[0] : new Date(r);
      const n = d >= range[0] && d <= range[1];
      return name === 'contains' ? n : !n;
    } else if (isApplication(r)) {
      let found: any = false;
      if (Array.isArray(l) || l && typeof l === 'object' && '0' in l) found = Array.prototype.find.call(l, (e: any, i: number) => evalApply(ctx, r, [e, i], { index: i, key: i }));
      else if (r && typeof l === 'object') found = Object.entries(l).find((e, i) => evalApply(ctx, r, [e[1], i, e[0]], { index: i, key: e[0] }));
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
  simple(['get'], (_name: string, values: any[], _opts, ctx: Context): any => {
    const [l, r] = values;
    const c = extend(ctx, { value: l });
    if (isKeypath(r)) return safeGet(c, r);
    else if (typeof r === 'number') return safeGet(c, '' + r);
    else return evaluate(c, r);
  }),
  simple(['generate'], (_name: string, [apply], opts, ctx) => {
    let r: ParseError|Array<number|[number, number]|{ not: number|[number, number] }>;
    if (apply && isApplication(apply)) {
      const res = [];
      let state = opts;
      let it: any;
      for (let i = 0; i < generateDefaults.max; i++) {
        it = evalApply(ctx, apply, [state, it, i], { index: i, last: it, state });
        if (Array.isArray(it)) it.forEach(v => res.push(v));
        else if (it && typeof it === 'object') {
          const keys = Object.keys(it);
          if (keys.find(k => k !== 'value' && k !== 'state')) res.push(it);
          else {
            res.push(it.value);
            state = it.state || state;
            it = it.value;
          }
        } else if (it === undefined) break;
        else res.push(it);
      }
      return res;
    } else if ((r = parseRange(apply)) && Array.isArray(r)) {
      r = r.filter(v => typeof v === 'number' || Array.isArray(v) && !v.find(v => v === Infinity || v === -Infinity) || typeof v === 'object' && !Array.isArray(v));
      const nums: number[] = [];
      const no: Array<[number, number]> = [];
      for (const v of r) if (typeof v === 'object' && !Array.isArray(v)) no.push(typeof v.not === 'number' ? [v.not, v.not] : v.not);

      for (const v of r) {
        if (nums.length >= generateDefaults.max) break;
        if (typeof v === 'number' && !no.find(([l, r]) => v >= l && v <= r)) nums.push(v);
        else if (Array.isArray(v)) {
          for (let i = v[0]; i <= v[1]; i++) {
            if (!no.find(([l, r]) => i >= l && i <= r)) nums.push(i);
            if (nums.length >= generateDefaults.max) break;
          }
        }
      }

      return nums;
    }
    return [];
  }),
  simple(['array'], (_name: string, values: any[], opts) => {
    if (values.length === 1 && opts?.range) {
      let range = values[0];
      if (typeof range === 'string') range = parseRange(range);
      if (Array.isArray(range)) {
        const bounds = Array.isArray(opts.bounds) && opts.bounds.length === 2 && opts.bounds.filter(b => typeof b === 'number').length === 2 ? opts.bounds : [-100, 200];
        bounds.slice().sort((l, r) => l < r ? -1 : l > r ? 1 : 0);
        let [lower, upper] = bounds;
        if (upper - lower > 10000) lower = upper - 10000;
        const res = [];
        for (let i = lower; i <= upper; i++) if (inRange(i, range)) res.push(i);
        return res;
      } else return [];
    }
    return values;
  }),
  simple(['object'], (_name: string, values: any[]) => {
    const res: any = {};
    if (values.length === 1 && Array.isArray(values[0])) values = values[0];
    for (let i = 0; i < values.length; i += 2) {
      res[values[i]] = values[i + 1];
    }
    return res;
  }),
  simple(['split'], (_name: string, [str, split]: any[]) => {
    if (typeof str !== 'string') return [str];
    else return str.split(split || '');
  }),
  simple(['filter'], (_name: string, values: any[], _opts, ctx: Context): any => {
    let [arr, flt, sorts, groups] = values;
    if (!Array.isArray(arr)) {
      if (arr && Array.isArray(arr.value)) arr = arr.value;
      else if (typeof arr === 'object' && arr) {
        let step = Object.entries(arr).filter((e, i) => evalApply(ctx, flt, [e[1], i, e[0]], { index: i, key: e[0] }));
        if (sorts) step = sort(ctx, step, sorts, (c, b, v) => evalApply(c, b, [v[1], v[0]], { key: v[0] }));
        return step.reduce((a, c) => (a[c[0]] = c[1], a), {});
      }
      else return [];
    }
    return filter({ value: arr }, flt, sorts, groups, ctx).value;
  }),
  simple(['source'], (_name: string, values: any[], _opts, ctx): any => {
    const [val, app] = values;
    let source = toDataSet(val);
    if (isApplication(app)) return evalApply(ctx, app, [], { source });
    return source;
  }),
  simple(['group'], (_name: string, values: any[], _opts, ctx: Context): any => {
    let [arr, groups] = values;
    if (!Array.isArray(arr)) {
      if (arr && Array.isArray(arr.value)) arr = arr.value;
      else return {};
    }
    return filter({ value: arr }, null, null, groups, ctx).value;
  }),
  simple(['sort'], (_name: string, values: any[], _opts, ctx: Context): any => {
    let [arr, sorts] = values;
    if (!Array.isArray(arr)) {
      if (arr && Array.isArray(arr.value)) arr = arr.value;
      else if (arr && typeof arr === 'object') {
        if (!sorts) sorts = [{ a: { r: { p: '@', k: ['key'] } } }];
        return sort(ctx, Object.entries(arr), sorts, (c, b, v) => evalApply(c, b, [v[1], v[0]], { key: v[0] })).reduce((a, c) => (a[c[0]] = c[1], a), {});
      }
      else return {};
    }
    if (!sorts) sorts = [{ a: { r: { k: ['_'] } } }];
    return sort(ctx, arr.slice(), sorts);
  }),
  simple(['time-span', 'time-span-ms'], (_name: string, args: any[], opts: any): any => {
    const namedArgs = opts || {};
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

            // watch out for last day of month next to longer month
            const end = new Date(+from);
            const endM = end.getMonth();
            end.setDate(end.getDate() + 1);
            if (endM !== end.getMonth()) {
              // make sure target date is last day of month
              to.setMonth(to.getMonth() + 1);
              to.setDate(0);
            }

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
  simple(['string', 'unparse'], (name: string, args: any[], opts: any): string => {
    const [value] = args;
    opts = opts || args[1] || {};
    if (!opts || typeof opts !== 'object') opts = {};
    if (name === 'unparse') opts = Object.assign({}, opts, { raport: 1 });
    if (opts.raport && opts.tpl) opts.template = 1;
    if (!opts && (value === null || value === undefined)) return '';

    if (typeof opts === 'object') {
      if (opts.json) return JSON.stringify(value);
      if (opts.schema) return unparseSchema(value);
      if (opts.base64) return btoa(value);
      else if (opts.raport) {
        let v = stringify(value, opts);
        if (v === undefined) v = stringify({ v: value }, opts);
        return v;
      } else if (typeof value === 'string' && opts.styled) return style(value);
      else if (value == null) return '';
    }

    if (isDateRel(value)) return fmtDate(value, 'yyyy-MM-dd HH:mm:ssz');

    if (Array.isArray(value)) return value.join(', ');

    let res = `${value}`;
    if (res.slice(0, 7) === '[object') return JSON.stringify(value);
    return res;
  }),
  simple(['log'], (_name: string, args: any[], _opts, ctx: Context) => {
    try {
      ctx.root.log(args);
    } catch (e) {
      console.error(e);
      console.log(...args);
    }
  }),
  simple(['call'], (_name: string, args: any[], _opts, ctx: Context): any => {
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
  simple(['let'], (_name, [name, value]: any[], _opts, ctx: Context): any => {
    return safeSet(ctx, name, value, true);
  }),
  simple(['set'], (_name, [name, value]: any[], _opts, ctx: Context): any => {
    return safeSet(ctx, name, value);
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
  simple(['validate', 'valid'], (name, [left, right, mode], opts) => {
    const res = validate(left, right, mode || opts?.mode || (opts?.strict && 'strict'));
    if (name === 'valid') return res === true;
    else return res;
  }),
  simple(['inspect'], (_name, [v, mode], opts) => {
    if ((mode || opts?.mode) === 'schema') return unparseSchema(inspect(v, opts?.flat));
    else return inspect(v);
  }),
  simple(['diff'], (_, [left, right, equal], opts, ctx: Context) => {
    equal = equal || opts?.equal;
    if (equal && isApplication(equal)) {
      const eq = equal;
      equal = (l: any, r: any) => evalApply(ctx, eq, [l, r]);
    }
    return diff(left, right, { equal, keys: opts?.keys });
  }),
  simple(['label-diff'], (_, [diff, label], opts) => {
    return labelDiff(diff, label, opts as any);
  }),
  simple(['patch'], (_, values, opts) => {
    const dir = opts?.dir || 'forward';
    const strict = opts?.strict;
    const base = JSON.parse(JSON.stringify(values.shift() || {}));
    const r = new Root(base);
    if (dir === 'backward') {
      const vals = values.slice().reverse();
      if (strict) {
        for (const v of vals) for (const path in v) if (safeGet(r, path) == v[path][1]) safeSet(r, path, v[path][0]);
      } else {
        for (const v of vals) for (const path in v) safeSet(r, path, v[path][0]);
      }
    } else {
      if (strict) {
        for (const v of values) for (const path in v) if (safeGet(r, path) == v[path][0]) safeSet(r, path, v[path][1]);
      } else {
        for (const v of values) for (const path in v) safeSet(r, path, v[path][1]);
      }
    }
    return base;
  }),
);

// math
registerOperator(
  simple(['+', 'add'], (_name, values: any[], _opts, ctx): any => {
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
      if (ctx.special?.round) return +values.reduce((a, c) => +round(a + +c, ctx.special.round), 0);
      else return values.reduce((a, c) => a + +c, 0);
    } else {
      return values.reduce((a, c) => a + (c === undefined || c === null ? '' : c), '');
    }
  }),
  simple(['cat'], (_name, values: any[]): any => {
    return values.reduce((a, c) => a + (c === undefined || c === null ? '' : c), '');
  }),
  simple(['num'], (_name: string, [v]) => {
    let match: string[];
    if (match = hasNum.exec(v)) return +match[1];
    return parseInt(v);
  }),
  simple(['-', 'subtract'], (_name, values: any[], _opts, ctx): number => {
    const first = values.shift();
    if (!values.length) return -first;
    if (isDateRel(first)) {
      if (values.reduce((a, c) => a && isDateRel(c), true)) return values.reduce((a, c) => a - +dateRelToDate(c), +dateRelToDate(first));
      if (values.reduce((a, c) => a && isTimespan(c), true)) return values.reduce((a, c) => dateAndTimespan(a, c, -1), dateRelToDate(first));
    }
    if (ctx.special?.round) return values.reduce((a, c) => +round(a - (!isNum(c) ? 0 : +c), ctx.special.round), !isNum(first) ? 0 : +first);
    else return values.reduce((a, c) => a - (!isNum(c) ? 0 : +c), !isNum(first) ? 0 : +first);
  }),
  simple(['*', 'multiply'], (_name, values: any[], _opts, ctx): number|string|any[] => {
    const first = values.shift();
    if (!isNum(first)) {
      if (values.length === 1 && isNum(values[0]) && +values[0] > 0) {
        if (typeof first === 'string') {
          return stringTimes(first, +values[0]);
        } else if (isApplication(first) && +values[0] < 10000) {
          const res = [];
          for (let i = 0; i < +values[0]; i++) res.push(evalApply(ctx, first, [i]));
          return res;
        } else if (Array.isArray(first) && +values[0] < 10000 && first.length < 1000) {
          const res = [];
          for (let i = 0; i < values[0]; i++) res.push.apply(res, first);
          return res;
        }
      }
      return 0;
    }
    if (ctx.special.round) return values.reduce((a, c) => +round(a * (!isNum(c) ? 0 : +c), ctx.special.round), +first);
    else return values.reduce((a, c) => a * (!isNum(c) ? 0 : +c), +first);
  }),
  simple(['/', '/%', 'divide', 'intdiv'], (name: string, values: any[], _opts, ctx): number => {
    const first = values.shift();
    if (isNaN(first)) return 0;
    if (name.length > 1 || name === 'intdiv') return values.reduce((a, c) => Math.floor(a / (isNaN(c) ? 1 : +c)), +first);
    if (ctx.special?.round) return values.reduce((a, c) => +round(a / (isNaN(c) ? 1 : +c), ctx.special.round), +first);
    else return values.reduce((a, c) => a / (isNaN(c) ? 1 : +c), +first);
  }),
  simple(['%', 'modulus'], (_name: string, values: any[]): number => {
    const first = values.shift();
    return values.reduce((a, c) => a % (isNaN(c) ? 1 : +c), isNaN(first) ? 0 : +first);
  }),
  simple(['pow', '**'], (_name, values: any[], _opts, ctx): number => {
    const pow = values.pop();
    const first = Math.pow(values.pop(), pow);
    if (ctx.special?.round) return values.reverse().reduce((a, c) => +round(Math.pow(c, a), ctx.special.round), first);
    else return values.reverse().reduce((a, c) => Math.pow(c, a), first);
  }),
  simple(['abs'], (_name: string, values: any[]) => {
    if (typeof values[0] !== 'number') return values[0];
    return Math.abs(values[0]);
  }),
  simple(['round'], (_name: string, [num, precision, method]: [number, number, string], opts): number|string => {
    precision = precision ?? opts?.places;
    if (precision !== undefined || roundDefaults['all-numeric']) {
      const res = round(num, { places: precision, method: (method || opts?.method) as any });
      if (opts?.string) return res;
      return +res;
    } else return Math.round(num);
  }),
  simple(['floor'], (_name: string, values: [number]): number => {
    return Math.floor(values[0]);
  }),
  simple(['ceil'], (_name: string, values: [number]): number => {
    return Math.ceil(values[0]);
  }),
  simple(['rand', 'random'], (_name: string, args: any[]): any => {
    if (!args.length || typeof args[0] === 'number') {
      const [min, max, dec] = args;
      let res: number;
      if (min == null) return Math.random();
      else if (typeof max !== 'number') res = Math.random() * min;
      else if (typeof max === 'number') res = Math.random() * (max - min) + min;

      if (max === true || dec === true) return res;
      else return Math.round(res);
    } else if (Array.isArray(args[0])) {
      const arr = args[0];
      return arr[Math.floor(Math.random() * arr.length)];
    } else if (typeof args[0] === 'string' && typeof args[1] === 'number') {
      let res = '';
      const [str, count] = args;
      for (let i = 0; i < count; i++) res += str[Math.floor(Math.random() * str.length)];
      return res;
    } 
  }),
);

// string
function pad(where: 'l'|'c'|'r', str: string, count: number, pad: string): string {
  if (typeof str !== 'string') str = '' + str;
  if (!isNum(count)) return str;
  if (typeof pad !== 'string') pad = '' + pad;
  if (!pad) pad = ' ';
  if (pad.length !== 1) pad = ' ';

  const ct = (count - str.length) / 2;
  for (let i = 0; str.length < count; i++) {
    if (where === 'l') str = pad + str;
    else if (where === 'r') str = str + pad;
    else if (i < ct) str = pad + str;
    else str = str + pad;
  }

  return str;
}
const triml = /^\s*/;
const trimr = /\s*$/;
const escapeRe = /([\.\[\]\{\}\(\)\^\$\*\+\-])/g;
registerOperator(
  simple(['eval'], (_name: string, [v], opts, ctx: Context): any => {
    if (opts?.template) return template(opts?.context || ctx, v);
    else return evaluate(opts?.context || ctx, v);
  }),
  simple(['padl', 'padr', 'pad'], (name: string, args: any[]): string => {
    let [str, count, val] = args;
    return pad(name === 'padl' ? 'l' : name === 'padr' ? 'r' : 'c', str, count, val);
  }),
  simple(['trim', 'triml', 'trimr'], (name: string, args: any[]): string => {
    let [str] = args;
    str = '' + str;
    if (name === 'trim' || name === 'trimr') str = str.replace(trimr, '');
    if (name === 'trim' || name === 'triml') str = str.replace(triml, '');
    return str;
  }),
  simple(['slice', 'substr'], (_name: string, [src, start, end]: any[], _opts, ctx: Context) => {
    if (src && typeof src.slice === 'function') return src.slice(start, end);
    else {
      const op = getOperator<ValueOperator>('string');
      if (op) return `${op.apply('string', [src], undefined, ctx)}`.slice(start, end);
    }
  }),
  simple(['len', 'length'], (_name: string, [src]: any[]) => {
    if (typeof src === 'string' || Array.isArray(src)) return src.length;
    else if (typeof src === 'object' && Object.keys(src).length === 1 && Array.isArray(src.value)) return src.value.length;
    else if (typeof src === 'object') return Object.keys(src).length;
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
      return src.slice().reverse();
    }
  }),
  simple(['wrap-count'], (_name: string, [str, width, font], opts, ctx): number => {
    let w = width || opts?.width;
    const avail = safeGet(ctx, '@placement.availableX') || 48;
    if (ctx.special?.widget) {
      const ww = ctx.special.widget.width;
      if (ww) {
        if (ww === 'grow') w = avail;
        else if (typeof ww === 'number') w = ww;
        else if (typeof ww === 'object' && typeof ww.percent === 'number') w = (ww.percent / 100) * avail; 
        else if (typeof ww === 'object' && typeof ww.x === 'string') w = evaluate(ctx, ww.x);
      }
    }
    if (!w) w = avail;
    font = font || opts?.font || safeGet(ctx, '@widget.font');
    if (opts) {
      font = Object.assign({}, font);
      for (const k of ['family', 'size', 'line', 'metric', 'break-word']) if (k in opts) font[k] = opts[k];
    }
    return measure(str, w, { context: ctx } as any, font);
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
  simple(['date'], (_name: string, args: any[], opts, ctx: Context): Date|DateRel => {
    let [v, t] = args;
    if (typeof opts !== 'object' || !opts) opts = {} as any;

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

    if (res instanceof Date && isNaN(+res)) return undefined;
    return res;
  }),
  simple(['interval'], (_name: string, [v]: any[], _opts, ctx: Context): DateRel => {
    return evaluate(ctx, ~v.indexOf('#') ? v : `#${v}#`);
  }),
  simple(['upper', 'lower'], (name: string, [v]: any[]): string => {
    v = v == null ? '' : v;
    return name === 'upper' ? `${v}`.toUpperCase() : `${v}`.toLowerCase();
  }),
  simple(['format', 'fmt'], (_name: string, args: any[], opts, ctx): string => {
    let [v, fmt, ...s] = args;
    const op = formats[fmt];
    if (!op) {
      let op: any = getOperator(fmt);
      if (!op) {
        const o = safeGet(ctx, fmt) || safeGet(ctx.root, fmt);
        if (isApplication(o)) op = o
      }
      if (op) {
        const args = [v, ...s];
        return applyOperator(ctx, { op: fmt, args: args.map(v => isApplication(v) ? v : ({ v })), opts: { v: opts || virtualFormats[fmt] } });
      } else return `${v}`;
    } else return op.apply(v, s, (opts || op.defaults) as any);
  }),
  simple(['set-defaults'], (_name: string, [type, name]: any[], opts, ctx) => {
    if (type === 'format' && typeof name === 'string') {
      const fmt = formats[name];
      if (fmt) return Object.assign(fmt.defaults, opts);
      const vfmt = virtualFormats[name];
      if (vfmt) return Object.assign(vfmt.defaults, opts);
    } else if (type === 'round') {
      if (opts?.context) {
        if (opts?.unset) {
          if (ctx.special) delete ctx.special.round;
        } else (ctx.special || (ctx.special = {})).round = Object.assign({}, opts, { context: undefined });
      } else Object.assign(roundDefaults, opts);
    } else if (type === 'generate') {
      Object.assign(generateDefaults, opts);
    }
  }),
  simple(['parse'], (_name: string, args: any[], opts: any): any => {
    opts = opts || args[1] || {};
    if (!opts || typeof opts !== 'object') opts = {};
    const [v] = args;

    if (opts.date) return parseDate(v, opts);
    else if (opts.template || opts.tpl) return parseTemplate(v, opts);
    else if (opts.time) return parseTime(v, opts);
    else if (opts.expr) return parseExpr(v, opts);
    else if (opts.json) return JSON.parse(v);
    else if (opts.schema) return parseSchema(v);
    else if (opts.range) return parseRange(v, opts);
    else if (opts.xml) return parseXML(v, opts.strict);
    else if (opts.csv || opts.delimited) {
      if (opts.detect || !opts.field || !opts.record) opts = Object.assign(csvDetect(v, opts.context), opts);
      return csvParse(v, opts);
    } else if (opts.base64) return atob(v);
    else return parse(v, opts);
  }),
  simple(['detect-delimiters'], (_name: string, [data, max]: any[], opts) => {
    if (typeof data !== 'string') return {};
    return csvDetect(data, max ?? opts?.context);
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
  checkArg(_name: string, i: number, last: number, value: any, _opts, ctx: Context, ast): CheckResult {
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
      if (Array.isArray(value) && value.length || value && typeof value === 'object' && Object.keys(value).length) return 'continue';
      else return { skip: 1 };
    } else if (i === 1) return { skip: last - i, value };
    else if (i === last) return { result: value };
    else if (i % 2 === 0) { // condition
      if (value) return 'continue';
      else return { skip: 1 };
    } else return { result: value };
  },
  apply(_name: string, [value, body]: [any[]|object, ValueOrExpr], opts, ctx: Context) {
    if (Array.isArray(value)) {
      const last = value.length - 1;
      return value.map((v, i) => evalApply(ctx, body, [v, i], { last, index: i, key: i, 'last-key': last })).join(opts?.join || '');
    } else if (typeof value === 'object' && value) {
      const entries = Object.entries(value);
      const lastKey = entries[entries.length - 1][0];
      const last = entries.length - 1;
      return Object.entries(value).map(([k, v], i) => evalApply(ctx, body, [v, k], { last, 'last-key': lastKey, index: i, key: k })).join('');
    } else {
      return '';
    }
  }
}, {
  type: 'checked',
  names: ['with'],
  checkArg(_name: string, i: number, last: number, value: any): CheckResult {
    if (i === 0 && value && typeof value === 'object') return 'continue';
    else if (i === 1) return { skip: last - i, value };
    else if (i === last) return { result: value };
    else if (i % 2 === 0) {
      if (value) return 'continue';
      else return { skip: 1 };
    } else return { result: value };
  },
  apply(_name: string, [value, body]: [any, ValueOrExpr], _opts, ctx: Context) {
    return evalApply(ctx, body, [value]);
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
  apply(_name: string, arr: any[], args: ValueOrExpr[], _opts, ctx: Context) {
    if (ctx.special?.round) return +round(arr.reduce((a, c) => +round(a + num(args[0] ? evalApply(ctx, args[0], [c]) : c)), 0) / arr.length)
    else return arr.reduce((a, c) => a + num(args[0] ? evalApply(ctx, args[0], [c]) : c), 0) / arr.length;
  },
}, {
  type: 'aggregate',
  names: ['sum'],
  apply(_name: string, arr: any[], args: ValueOrExpr[], _opts, ctx: Context) {
    if (ctx.special?.round) return arr.reduce((a, c) => +round(a + num(args[0] ? evalApply(ctx, args[0], [c]) : c)), 0);
    else return arr.reduce((a, c) => a + num(args[0] ? evalApply(ctx, args[0], [c]) : c), 0);
  }
}, {
  type: 'aggregate',
  names: ['count'],
  apply(_name: string, arr: any[], args: ValueOrExpr[], opts, ctx: Context) {
    if (opts?.partition && isApplication(opts.partition)) {
      return arr.reduce((a, e, i) => {
        const key = evalApply(ctx, opts.partition, [e, i]);
        if (key in a) a[key]++;
        else a[key] = 1;
        return a;
      }, {});
    } else if (opts?.sub && typeof opts.sub === 'object' && !Object.values(opts.sub).find(o => !isApplication(o))) {
      return arr.reduce((a, e, i) => {
        for (const k in opts.sub) {
          let res = evalApply(ctx, opts.sub[k], [e, i]);
          if (!res) continue;
          if (typeof res === 'string') res = [res];
          else if (!Array.isArray(res)) res = [k];
          for (const k of res) {
            if (k in a) a[k]++;
            else a[k] = 1;
          }
        }
        return a;
      }, {});
    } else if (args.length) return arr.filter((e, i) => evalApply(ctx, args[0], [e, i])).length;
    else return arr.length;
  }
}, {
  type: 'aggregate',
  names: ['min', 'max'],
  apply(name: string, arr: any[], args: ValueOrExpr[], _opts, ctx: Context) {
    if (isApplication(args[0])) arr = arr.map(e => evalApply(ctx, args[0], [e]));
    else if (args.length && !arr.length) arr = args.map(a => evalParse(ctx, a));
    if (!arr.length) return 0;
    return Math[name].apply(Math, arr.filter(e => !isNaN(e)));
  }
}, {
  type: 'aggregate',
  names: ['first', 'nth', 'last'],
  apply(name: string, arr: any[], args: ValueOrExpr[], _opts, ctx: Context) {
    let val: any;
    let apply = 0;
    if (name === 'first') val = arr[0];
    else if (name === 'last') val = arr[arr.length - 1];
    else if (args[0]) {
      const i = evalParse(ctx, args[0]);
      if (typeof i === 'number') {
        val = i < 0 ? arr[arr.length + i] : arr[i - 1];
        apply = 1;
      }
    }
    if (args[apply]) val = evalParse(ctx, args[apply]);
    return val;
  }
}, {
  type: 'aggregate',
  names: ['map'],
  apply(_name: string, arr: any[], args: ValueOrExpr[], opts, ctx: Context) {
    if (!args[0]) return arr;
    let v: any[];
    let app: any;
    if (isApplication(args[0])) v = arr, app = evalParse(ctx, args[0]);
    else if (isApplication(args[1])) v = evalParse(ctx, args[0]), app = evalParse(ctx, args[1]);
    if ((Array.isArray(v) || v && '0' in v) && isApplication(app)) {
      const res = Array.prototype.map.call(v, (e: any, i: number) => evalApply(ctx, app, [e, i], { index: i, key: i }));
      if (opts && opts.flat) return flatten(res, opts.flat);
      return res;
    }
    else if (v && typeof v === 'object' && isApplication(app)) {
      if (opts && opts.array) {
        const res = Object.entries(v as object).map((p, i) => evalApply(ctx, app, [p[1], i, p[0]], { index: i, key: p[0] }));
        if (opts && opts.flat) return flatten(res, opts.flat);
        return res;
      }
      if (opts && opts.entries) return Object.entries(v as object).reduce((a, p, i) => {
        const r = evalApply(ctx, app, [p[1], i, p[0]], { index: i, key: p[0] });
        if (r === null) return a;
        if (Array.isArray(r) && r.length === 2 && typeof r[0] === 'string') a.push(r);
        else a.push([p[0], r]);
        return a;
      }, [] as any[]);
      const res: any = {};
      Object.entries(v as object).forEach((e, i) => {
        const r = evalApply(ctx, app, [e[1], i, e[0]], { index: i, key: e[0] });
        if (Array.isArray(r) && r.length === 2 && typeof r[0] === 'string') res[r[0]] = r[1];
        else if (r == null) return;
        else res[e[0]] = r;
      });
      return res;
    }
  }
}, {
  type: 'aggregate',
  names: ['index'],
  apply(_name: string, arr: any[], args: ValueOrExpr[], opts, ctx: Context) {
    if (!args[0]) return {};
    const many = opts && opts.many;
    return arr.reduce((a, c, i) => _indexPair(a, evalApply(ctx, args[0], [c, i], { index: i, all: a }), c, many), {});
  },
}, {
  type: 'aggregate',
  names: ['reduce'],
  apply(_name: string, arr: any[], args: ValueOrExpr[], _opts, ctx: Context) {
    if (!args[0]) return arr;
    return arr.reduce((a, c, i) => evalApply(ctx, args[0], [a, c, i]), evalParse(ctx, args[1]));
  }
}, {
  type: 'aggregate',
  names: ['unique', 'unique-map'],
  apply(name: string, arr: any[], args: ValueOrExpr[], _opts, ctx: Context) {
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
  apply(_name: string, arr: any[], args: ValueOrExpr[], _opts, ctx: Context) {
    if (isApplication(args[0])) {
      arr = arr.map(e => evalApply(ctx, args[0], [e]));
      args = args.slice(1);
    }
    if (args.length > 1 && arr.length > 2) return [arr.slice(0, -1).join(evalParse(ctx, args[0])), arr[arr.length - 1]].join(evalParse(ctx, args[1]));
    else if (args.length > 2 && arr.length === 2) return arr.join(evalParse(ctx, args[2]));
    return arr.join(evalParse(ctx, args[0]));
  }
}, {
  type: 'aggregate',
  names: ['find'],
  apply(_name: string, arr: any[], args: ValueOrExpr[], _opts, ctx: Context) {
    if (!args[0]) return;
    else if (isApplication(args[0])) return arr.find((e, i) => evalApply(ctx, args[0], [e, i], { index: i, key: i }));
    else if (isApplication(args[1])) {
      const v = evalParse(ctx, args[0]);
      if (Array.isArray(v)) return v.find((e, i) => evalApply(ctx, args[1], [e, i], { index: i, key: i }));
      else if (typeof v === 'object' && v) {
        const e = Object.entries(v).find((e, i) => evalApply(ctx, args[1], [e[1], i, e[0]], { index: i, key: e[0] }));
        if (e) return e[1];
      }
    } else {
      const v = evalParse(ctx, args[0]);
      return arr.find(e => e == v);
    }
  }
}, {
  type: 'aggregate',
  names: ['flatten'],
  apply(_name: string, arr: any[], args: ValueOrExpr[], opts, ctx) {
    return flatten(arr, (args.length > 0 ? evalParse(ctx, args[0]) : 0) || opts?.flat);
  }
}, {
  type: 'aggregate',
  names: ['block'],
  apply(_name: string, _arr: any[], args: ValueOrExpr[], opts, ctx: Context) {
    const last = args.length - 1;
    if (last < 0) return;
    const c = opts?.implicit ? ctx : extend(ctx, { locals: {}, fork: !ctx.locals });
    for (let i = 0; i < last; i++) evalParse(c, args[i]);
    const res = evalParse(c, args[last]);
    if (opts && opts.implicit) ctx.locals = c.locals;
    return res;
  },
  value: true,
});

function flatten(n: any[], levels: any = 1): any[] {
  let res = n || [];
  const count = typeof levels !== 'number' ? 1 : levels;
  for (let i = 0; i < count; i++) {
    if (res.find(v => Array.isArray(v))) res = [].concat(...res);
    else return res;
  }
  return res;
}

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

function _indexPair(res: any, value: any, current: any, many: boolean): any {
  if (Array.isArray(value)) {
    if (value.length === 0) return res;
    else if (value.length === 2) {
      const [k, v] = value;
      if (Array.isArray(k)) {
        for (const kk of k) {
          if (many) {
            if (kk in res) res[kk].push(v)
            else res[kk] = [v];
          } else res[kk] = v;
        }
      } else {
        if (many) {
          if (k in res) res[k].push(v);
          else res[k] = [v];
        } else res[k] = v;
      }
    }
  } else if (typeof value === 'object') {
    const v = value as any;
    if ('many' in v && Array.isArray(v.many)) for (const i of v.many) _indexPair(res, i, current, many);
    else if ('key' in v || 'keys' in v) _indexPair(res, [v.key || v.keys, v.value || current], current, many);
  } else {
    if (many) {
      if (value in res) res[value].push(current);
      else res[value] = [current];
    } else res[value] = current;
  }
  return res;
}

// basic formats
registerFormat('dollar', function(n, [dec, group, sign, neg], opts) {
  return dollar(n, undefined, dec ?? opts?.dec ?? this.defaults.dec, group ?? opts?.group ?? this.defaults.group, sign ?? opts?.sign ?? this.defaults.sign, neg ?? opts?.neg ?? this.defaults.neg);
}, { dec: 2, group: ',', sign: '$', neg: 'sign' });

registerFormat('date', function(n, [fmt], opts) {
  return fmtDate(n, fmt ?? opts?.format ?? this.defaults.format);
}, { format: 'yyyy-MM-dd' });

registerFormat('time', function(n, [fmt], opts) {
  return fmtDate(n, fmt ?? opts?.format ?? this.defaults.format);
}, { format: 'HH:mm:ss' });

registerFormat('timestamp', function(n, [fmt], opts) {
  return fmtDate(n, fmt ?? opts?.format ?? this.defaults.format);
}, { format: 'yyyy-MM-dd HH:mm:ss' });

registerFormat('timestamptz', function(n, [fmt], opts) {
  return fmtDate(n, fmt ?? opts?.format ?? this.defaults.format);
}, { format: 'yyyy-MM-dd HH:mm:sszzz' });

registerFormat('iso8601', n => {
  return fmtDate(n, 'yyyy-MM-ddTHH:mm:sszzz');
});

registerFormat(['integer', 'int'], function(n, [group, neg], opts) {
  return number(n, 0, group ?? opts?.group ?? this.defaults.group, neg ?? opts?.neg ?? this.defaults.neg);
}, { group: ',', neg: 'sign' });

registerFormat(['number', 'num'], function(n, [dec, group, neg], opts) {
  return number(n, dec ?? opts?.dec ?? this.defaults.dev, group ?? opts?.group ?? this.defaults.group, neg ?? opts?.neg ?? this.defaults.neg);
}, { dec: 2, group: ',', neg: 'sign' });

registerFormat('ordinal', function(n, [group], opts) {
  return ordinal(n, group ?? opts?.group ?? this.defaults.group);
}, { group: ',' });

registerFormat('phone', n => {
  return phone(n);
});

registerFormat('styled', n => {
  return style(n);
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

registerFormat('hex', val => {
  if (typeof val === 'number') return val.toString(16);
  else {
    const str = `${val}`;
    const te = new TextEncoder();
    return Array.from(te.encode(str)).map(c => c.toString(16).padStart(2, '0')).join('');
  }
});

registerFormat('base', (val, [n]) => {
  try {
    return val.toString(n);
  } catch {
    return val;
  }
});

registerFormat('noxml', val => escapeHTML(`${val}`));

registerFormat('xml', (val, [n]) => {
  if (val && typeof val === 'object') return objectToXML(val, n);
  else return val;
});

function objectToXML(object: object, indent: number|undefined = undefined) {
  if (Array.isArray(object)) return _objectToXML({ values: { value: object } }, 0, indent);
  const keys = Object.keys(object);
  if (keys.length > 1) return _objectToXML({ root: object }, 0, indent);
  if (keys.length < 1) return '<root />';
  if (Array.isArray(object[keys[0]])) return _objectToXML({ root: object }, 0, indent);
  return _objectToXML(object, 0, indent);
}

function _objectToXML(val: any, depth: number, indent: number|undefined, propname: string|undefined = undefined) {
  if (Array.isArray(val)) {
    return val.reduce((xml, entry) => {
      const val = _objectToXML(entry, depth + 1, indent, propname);
      const tag = val === '' || val === undefined ? `<${propname} />` : `<${propname}>${val}${indent && /\n/.test(val) ? '\n' + pad('l', '', depth * indent, ' ') : ''}</${propname}>`;
      return `${xml}${indent && depth ? '\n' + pad('l', '', depth * indent, ' ') : ''}${tag}`;
    }, '');
  }
  if (val && typeof val === 'object') {
    return Object.entries(val).reduce((xml, [name, value]) => {
      const val = _objectToXML(value, depth + (Array.isArray(value) ? 0 : 1), indent, name);
      const tag = val === '' ? `${indent && depth ? '\n' + pad('l', '', depth * indent, ' ') : ''}<${name} />` : Array.isArray(value) ? val : `${indent && depth ? '\n' + pad('l', '', depth * indent, ' ') : ''}<${name}>${val}${indent && /\n/.test(val) ? '\n' + pad('l', '', depth * indent, ' ') : ''}</${name}>`;
      return `${xml}${tag}`;
    }, '');
  }
  return escapeHTML(val);
}

registerFormat('base64', val => {
  return btoa(`${val}`);
});
