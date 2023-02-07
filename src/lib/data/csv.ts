import { parser, ParseOptions, ParseNode, ParseError, concat, IParser, bracket, readTo, rep1sep, alt, map, repsep, rep, seq, skip, str, verify } from 'sprunge';

export const DEFAULTS = {
  record: '\n',
  field: ',',
  header: false,
  quote: '"',
};

export function csv(options?: CSVOptions) {
  const opts: typeof DEFAULTS = Object.assign({}, DEFAULTS, options);

  const ws = skip(' \t\r\n'.replace(opts.field, '').replace(opts.record, '').replace(opts.quote, ''));
  const quote = str(opts.quote || '"');
  const quotedField = bracket(seq(ws, quote), map(rep(alt(readTo(opts.quote), map(seq(quote, quote), () => ''))), r => concat(r)), seq(quote, ws));
  const unquotedField = readTo(opts.record + opts.field, true);
  const field: IParser<string> = alt(quotedField, unquotedField);
  const record = verify(rep1sep(field, seq(ws, str(opts.field), ws)), s => s.length > 1 || s[0].length > 0 || 'empty record');
  const csv: IParser<string[][]> = repsep(record, str(opts.record), 'allow');

  const _parse = parser(csv, { consumeAll: true });

  return function parse(input: string, options?: ParseOptions) {
    const res: ParseNode|string[][]|ParseError = _parse(input, options);
    if (Array.isArray(res) && res.length > 0) {
      if (opts.header) {
        const header: Array<[string, number]> = res.shift().map((k, i) => [k, i]);
        header.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
        for (let i = 0; i < res.length; i++) {
          for (let j = 0; j < header.length; j++) (res[i] as any)[header[j][0]] = res[i][header[j][1]];
        }
      }
    }

    return res;
  }
}

export interface CSVOptions {
  field: string;
  record: string;
  quote: string;
  header?: boolean;
}

const fields = [',', '|', '\t', ':', ';', '~'];
const records = ['\r\n', '\r', '\n'];
const quotes = ['\'', '"', '`', '$'];

export function detect(data: string, amount = 2048): CSVOptions {
  const sample = data.slice(0, amount);
  const fs = fields.reduce((a, c) => (a[c] = sample.replace(new RegExp(`[^${c}]`, 'g'), '').length / c.length, a), {} as { [k: string]: number });
  const rs = records.reduce((a, c) => (a[c] = sample.replace(new RegExp(`[^${c}]`, 'g'), '').length / c.length, a), {} as { [k: string]: number });
  const qs = quotes.reduce((a, c) => (a[c] = sample.replace(new RegExp(`[^${c}]`, 'g'), '').length / c.length, a), {} as { [k: string]: number });

  const res = { field: ',', record: '\n', quote: '"' };

  let max = 0;
  for (const k in fs) if (fs[k] > max) (res.field = k, max = fs[k]);
  max = 0;
  for (const k in rs) if (rs[k] > max) (res.record = k, max = rs[k]);
  max = 0;
  for (const k in qs) if (qs[k] > max) (res.quote = k, max = qs[k]);

  return res;
}

export function parse(data: string, options?: CSVOptions & { header: true }): any[];
export function parse(data: string, options?: CSVOptions & { header?: false }): string[][];
export function parse(data: string, options?: CSVOptions): Array<string[]|any> {
  const base = csv(Object.assign({}, options, { header: false }))(data);
  if ('message' in base) return [];
  if (options.header && base.length) {
    const header = base.shift().map((k, i) => [k, i]);
    header.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
    return base.map(v => header.reduce((a, c) => (a[c[0]] = v[c[1]], a), {} as any));
  }
  return base;
}
