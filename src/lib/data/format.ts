import { DateExactRange } from "./index";

const decRE = /(\d)(?=(\d{3})+\.)/g;
const intRE = /(\d)(?=(\d{3})+$)/g;
const isNumRE = /^[-0-9\\.,]+$/;

export function number(v: string|number, dec: number = 2, group: string = ','): string {
  v = typeof v !== 'number' ? parseFloat(v || '') : v;
  if (isNaN(v)) return '';
  v = v.toFixed(dec);
  if (dec === 0) v = v.replace(/\..*/, '');
  if (group) return v.replace(v.indexOf('.') === -1 ? intRE : decRE, `$1${group}`);
  else return v;
}

export function dollar(v: string, alt: string, dec: number = 2, group: string = ',', sign: string = '$'): string {
  if (v && isNumRE.test(v)) {
    if (+v > 0) return `${sign}${number(v, dec, group)}`;
    else return alt !== undefined ? alt : v;
  } else {
    return alt !== undefined ? alt : v;
  }
}

export function phone(v: string|number): string {
  if (typeof v === 'number') v = v.toString();
  v = v || '';
  v = v.replace(/[^\d]/g, '');

  if (v.length === 7) return `${v.substr(0, 3)}-${v.substr(3, 4)}`;
  else if (v.length === 10) return `(${v.substr(0, 3)}) ${v.substr(3, 3)}-${v.substr(6, 4)}`;
  else if (v.length === 11) return `${v[0]}-${v.substr(1, 3)}-${v.substr(4, 3)}-${v.substr(7, 4)}`;
  else return v;
}

const dateRE = /y+|M+|d+|E+|H+|m+|s+|k+|h+|a+|S+|z+/g;
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let dateDefault: string;
export function date(d: string|Date|DateExactRange, fmt: string): string {
  if (!d) return '';
  let Y: number, M: number, D: number, DD: number, H: number, MM: number, S: number, SS: number, Z: number;

  // convert an exact range to numbers
  if (typeof d === 'object' && 'f' in d && Array.isArray(d.f)) {
    const f = d.f, l = f.length, e = d.e;
    Y = f[0], M = l > 1 && f[1] != null ? f[1] : e ? 11 : 0, D = l > 2 && f[2] != null ? f[2] : e ? 0 : 1,
      H = l > 3 && f[3] != null ? f[3] : e ? 23 : 0, MM = l > 4 && f[4] != null ? f[4] : e ? 59 : 0, S = l > 5 && f[5] != null ? f[5] : e ? 59 : 0,
      SS = l > 6 && f[6] != null ? f[6] : e ? 999 : 0;
    let dt = new Date(Y, M, D || 1, H, MM, S, SS);
    Z = l > 7 && f[7] != null ? -f[7] : dt.getTimezoneOffset();
    if (!D) {
      dt.setMonth(M + 1);
      dt.setDate(0);
      D = dt.getDate();
    }
    DD = dt.getDay();
  } else {
    if (typeof d === 'string') d = new Date(d);
    if (Object.prototype.toString.call(d) !== '[object Date]') return '';
    if (isNaN(d as any)) return '';

    const v = d as Date;
    Y = v.getFullYear(), M = v.getMonth(), D = v.getDate(), DD = v.getDay(), H = v.getHours(), MM = v.getMinutes(), S = v.getSeconds(), SS = v.getMilliseconds(), Z = v.getTimezoneOffset();
  }


  if (!fmt) fmt = dateDefault || 'yyyy-MM-dd';

  return fmt.replace(dateRE, m => {
    if (m[0] === 'y') {
      return m.length <= 2 ? (`${Y}`).substr(2, 2) : `${Y}`;
    } else if (m[0] === 'M') {
      if (m.length === 1) return `${M + 1}`;
      else if (m.length === 2) return M < 9 ? `0${M + 1}` : `${M + 1}`;
      else if (m.length === 3) return months[M].substr(0, 3);
      else return months[M];
    } else if (m[0] === 'd') {
      if (m.length === 1) return `${D}`;
      else if (m.length === 2) return D <= 9 ? `0${D}` : `${D}`;
      else return ordinal(D);
    } else if (m[0] === 'E') {
      if (m.length === 1) return `${DD + 1}`;
      else if (m.length === 2) return days[DD].substr(0, 3);
      else return days[DD];
    } else if (m[0] === 'H') {
      return m.length === 1 ? `${H}` : H <= 9 ? `0${H}` : `${H}`;
    } else if (m[0] === 'm') {
      return m.length === 1 ? `${MM}` : MM <= 9 ? `0${MM}` : `${MM}`;
    } else if (m[0] === 's') {
      return m.length === 1 ? `${S}` : S <= 9 ? `0${S}` : `${S}`;
    } else if (m[0] === 'S') {
      const ms = SS;
      if (m.length === 1) return `${ms}`;
      return ms < 10 ? `00${ms}` : ms < 100 ? `0${ms}` : `${ms}`;
    } else if (m[0] === 'k' || m[0] === 'h') {
      let r = `${H % 12}`;
      if (r === '0') r = '12';
      return `${r}`;
    } else if (m[0] === 'a') {
      return H > 11 ? 'PM' : 'AM';
    } else if (m[0] === 'z') {
      const min = 0 - Z;
      let r: number = min;
      if (m.length === 1) r = Math.floor(min / 60);
      else if (m.length === 2) {
        const mm = min % 60;
        return `${min >= 0 ? '+' : ''}${Math.floor(min / 60)}${mm < 10 ? '0' : ''}${mm}`;
      } else if (m.length === 3) {
        const mm = min % 60;
        return `${min >= 0 ? '+' : ''}${Math.floor(min / 60)}:${mm < 10 ? '0' : ''}${mm}`;
      } else r = min;
      return `${r >= 0 ? '+' : ''}${r}`;
    }
  });
}

date.setDefault = function(format?: string) {
  dateDefault = format;
}

export function ordinal(num: number|string, group?: string): string {
  num = number(num, 0, group);
  let n = `${num}`;
  n = n.substr(-2, 2);
  if (n.length > 1 && n[0] === '1') return `${num}th`;
  switch (n[1] || n[0]) {
    case '1':
      return `${num}st`;
    case '2':
      return `${num}nd`;
    case '3':
      return `${num}rd`;
    default:
      return `${num}th`;
  }
}
