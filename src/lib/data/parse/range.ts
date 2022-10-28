import { parser as makeParser, opt, str, alt, seq, map, repsep, read1 } from 'sprunge/lib';
import { digits } from 'sprunge/lib/json';

const space = ' \t\r\n';

const num = map(seq(opt(str('-')), read1(digits)), ([neg, num]) => neg ? -num : +num);
const num_range = map(seq(num, str('-', ':'), num), ([start,, end]) => [start, end] as [number, number]);
const sign_range = map(seq(str('<', '>'), num), ([sign, num]) => sign === '<' ? [-Infinity, num - 1] as [number, number] : [num + 1, Infinity] as [number, number]);
const star_range = map(str('*'), () => [-Infinity, Infinity] as [number, number]);

const _range = repsep(alt<number|[number, number]>(star_range, num_range, sign_range, num), read1(space + ',;'));

export const range = makeParser(_range, { trim: true });

export default range;
