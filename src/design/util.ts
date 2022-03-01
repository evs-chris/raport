export function debounce(fn: (...args: any[]) => void, time: number): (...args: any[]) => void {
  let tm: any;
  function wrapper(...args: any[]) {
    if (tm) {
      clearTimeout(tm);
    }
    tm = setTimeout(() => {
      tm = null;
      fn.apply(this, args);
    }, time);
  }
  return wrapper;
}
