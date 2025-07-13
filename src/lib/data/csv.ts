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
  const quotedField = bracket(seq(ws, quote), map(rep(alt(readTo(opts.quote || '"'), map(seq(quote, quote), () => ''))), r => concat(r)), seq(quote, ws));
  const unquotedField = readTo(opts.record + opts.field, true);
  const field: IParser<string> = opts.quote ? alt(quotedField, unquotedField) : unquotedField;
  const record = verify(rep1sep(field, seq(ws, str(opts.field), ws)), s => s.length > 1 || s[0].length > 0 || 'empty record');
  const csv: IParser<string[][]> = map(seq(skip(' \r\n\t'), repsep(record, str(opts.record), 'allow'), skip(' \r\n\t')), ([, csv]) => csv);

  const _parse = parser(csv, { consumeAll: true });

  return function parse(input: string, options?: ParseOptions) {
    const res: ParseNode|string[][]|ParseError = _parse(input, options);
    if (Array.isArray(res) && res.length > 0) {
      let header: Array<[string, number]> = undefined;
      if (Array.isArray(opts.header)) header = opts.header.map((k, i) => [k, i]);
      else if (typeof opts.header === 'object') header = res.shift().map((k, i) => [opts.header[k] ?? k, i]).filter(o => o[0]) as any[];
      else if (!!opts.header) header = res.shift().map((k, i) => [k, i]);
      if (header) {
        header.sort((a, b) => `${a}`.toLowerCase() < `${b}`.toLowerCase() ? -1 : `${a}`.toLowerCase() > `${b}`.toLowerCase() ? 1 : 0);
        return res.map(v => header.reduce((a, c) => (a[c[0]] = v[c[1]], a), {} as any));
      }
    }

    return res;
  }
}

export interface CSVOptions {
  field: string;
  record: string;
  quote: string;
  fixedSize?: boolean;
  order?: boolean;
  header?: boolean|string[]|{[k: string]:any};
}

// TODO: handle ascii curses tables?

export function table(options?: TableOptions) {
  const opts = Object.assign({ header: true }, options);

  return function parse(input: string, options?: ParseOptions) {
    const parts = input.split(/\r?\n/).filter(v => v);
    
    if (parts[1][0] === '|') {
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        parts[i] = p.replace(/^\|\s*|\s*\|$/g, '');
      }
    }

    return parts.map(p => p.trim().split(/\s*\|\s*/));
  }
}

export interface TableOptions {
  table: 1;
  header?: boolean;
  fixedSize?: boolean;
  order?: boolean;
}

export type DelimitedOptions = CSVOptions | TableOptions;

const fields = [',', '|', '\t', ':', ';', '~'];
const records = ['\r\n', '\r', '\n'];
const quotes = ['\'', '"', '`', '$'];

export function detect(data: string, amount?: number): DelimitedOptions {
  if (amount === undefined) {
    amount = data.indexOf('\n', data.indexOf('\n', data.indexOf('\n', 1) + 1) + 1);
    amount = amount ?? 2048;
    if (amount < 2048) amount = 2048;
  }
  const sample = data.slice(0, amount);
  // look for tables
  if (sample.split(/\r?\n/).filter(v => v)[1]?.match(/^[-|+\s_=]+$/)) {
    return { table: 1, header: true };
  }

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

function isTableOpts(opts?: DelimitedOptions): opts is TableOptions {
  return opts && 'table' in opts && opts.table === 1;
}

export function parse(data: string, options?: DelimitedOptions & { header: true|1|string[]|{[k: string]: any} }): any[];
export function parse(data: string, options?: DelimitedOptions & { header?: false }): string[][];
export function parse(data: string, options?: DelimitedOptions): Array<string[]|any> {
  let values: string[][];
  if (isTableOpts(options)) {
    values = table(options)(data);
    values.splice(1, 1);
  } else {
    const base = csv(Object.assign({}, options, { header: false }))(data);
    if ('message' in base) return [];
    values = base;
  }

  if (options.fixedSize ?? true) {
    const min = values[0]?.length;
    values = values.filter(v => v.length >= min);
  }

  if (options.header && values.length) {
    let header: Array<[string, number]> = undefined;
    if (Array.isArray(options.header)) {
      header = options.header.map((k, i) => [k, i]);
      if (isTableOpts(options)) values.shift();
    } else if (typeof options.header === 'object') {
      header = values.shift().map((k, i) => [options.header[k] ?? k, i]).filter(o => o[0]) as any[];
    } else if (!!options.header) header = values.shift().map((k, i) => [k, i]);
    if (header) {
      header.sort((a, b) => `${a}`.toLowerCase() < `${b}`.toLowerCase() ? -1 : `${a}`.toLowerCase() > `${b}`.toLowerCase() ? 1 : 0);
      return values.map(v => header.reduce((a, c) => (a[c[0]] = v[c[1]], a), {} as any));
    }
  }
  return values;
}
