const decRE = /(\d)(?=(\d{3})+\.)/g;
const intRE = /(\d)(?=(\d{3})+$)/g;
const isNumRE = /^[-0-9\\.,]+$/;

export function number(v: string|number, dec: number = 2): string {
  v = typeof v !== 'number' ? parseFloat(v || '') : v;
  if (isNaN(v)) return '';
  v = v.toFixed(dec);
  if (dec === 0) v = v.replace(/\..*/, '');
  return v.replace(v.indexOf('.') === -1 ? intRE : decRE, '$1,');
}

export function dollar(v: string, alt: string, dec: number = 2, sign = '$'): string {
  if (v && isNumRE.test(v)) {
    if (+v > 0) return `${sign}${number(v, dec)}`;
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

const dateRE = /y+|M+|d+|E+|H+|m+|s+|k+|h+|a+/g;
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let dateDefault: string;
export function date(d: string|Date, fmt: string): string {
  if (!d) return '';
  if (typeof d === 'string') d = new Date(d);
  else if (Object.prototype.toString.call(d) !== '[object Date]') return '';

  const v = d as Date;

  if (!fmt) fmt = dateDefault;
  if (!fmt) return d.toISOString().substr(0, 10);

  return fmt.replace(dateRE, m => {
    if (m[0] === 'y') {
      return m.length <= 2 ? (`${v.getFullYear()}`).substr(2, 2) : `${v.getFullYear()}`;
    } else if (m[0] === 'M') {
      if (m.length === 1) return `${v.getMonth() + 1}`;
      else if (m.length === 2) return v.getMonth() < 9 ? `0${v.getMonth() + 1}` : `${v.getMonth() + 1}`;
      else if (m.length === 3) return months[v.getMonth()].substr(0, 3);
      else return months[v.getMonth()];
    } else if (m[0] === 'd') {
      return m.length === 1 ? `${v.getDate()}` : v.getDate() <= 9 ? `0${v.getDate()}` : `${v.getDate()}`;
    } else if (m[0] === 'E') {
      if (m.length === 1) return `${v.getDay() + 1}`;
      else if (m.length === 2) return days[v.getDay()].substr(0, 3);
      else return days[v.getDay()];
    } else if (m[0] === 'H') {
      return m.length === 1 ? `${v.getHours()}` : v.getHours() <= 9 ? `0${v.getHours()}` : `${v.getHours()}`;
    } else if (m[0] === 'm') {
      return m.length === 1 ? `${v.getMinutes()}` : v.getMinutes() <= 9 ? `0${v.getMinutes()}` : `${v.getMinutes()}`;
    } else if (m[0] === 's') {
      return m.length === 1 ? `${v.getSeconds()}` : v.getSeconds() <= 9 ? `0${v.getSeconds()}` : `${v.getSeconds()}`;
    } else if (m[0] === 'k' || m[0] === 'h') {
      let r = `${v.getHours() % 12}`;
      if (r === '0') r = '12';
      return `${r}`;
    } else if (m[0] === 'a') {
      return v.getHours() > 11 ? 'PM' : 'AM';
    }
  });
}

date.setDefault = function(format?: string) {
  dateDefault = format;
}

export function ordinal(num: number|string): string {
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
