import { parser as makeParser, opt, str, alt, seq, map, rep1sep, read1 } from 'sprunge/lib';
import { digits, ws } from 'sprunge/lib/json';
export { ParseError } from 'sprunge/lib';

const space = ' \t\r\n';

const num = map(seq(opt(str('-')), read1(digits)), ([neg, num]) => neg ? -num : +num);
const num_range = map(seq(num, str('-', ':'), num), ([start,, end]) => [start, end].sort((l, r) => l < r ? -1 : l > r ? 1 : 0) as [number, number]);
const sign_range = map(seq(str('<', '>'), ws, num), ([sign,, num]) => sign === '<' ? [-Infinity, num - 1] as [number, number] : [num + 1, Infinity] as [number, number]);
const star_range = map(str('*'), () => [-Infinity, Infinity] as [number, number]);
const not_range = map(seq(str('!'), alt<number|[number, number]>(num_range, sign_range, num)), ([, range]) => ({ not: range }));

const _range = rep1sep(alt<number|[number, number]|{ not: number|[number, number] }>(star_range, num_range, sign_range, num, not_range), read1(space + ',;'), 'allow');

export const range = makeParser(_range, { trim: true });

export default range;
