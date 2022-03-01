import { parser as makeParser } from 'sprunge';
import { schema } from '../parse';

export const parseSchema = makeParser(schema(), { trim: true, consumeAll: true });
export { stringifySchema as unparseSchema } from './stringify';
