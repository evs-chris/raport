import { parser as makeParser, map, seq, str, opt } from 'sprunge';
import { ws } from 'sprunge/lib/json';
import { schema } from '../parse';

export const parseSchema = makeParser(
  map(seq(opt(str('@[')), ws, schema(), ws, opt(str(']'))), ([, , schema]) => schema),
  { trim: true, consumeAll: true },
);
export { stringifySchema as unparseSchema } from './stringify';
