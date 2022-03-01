import { parser as makeParser, Parser, alt, seq, str, opt, repsep, map, read1, rep1sep, read1To, name } from 'sprunge';
import { ws, JString, JNum } from 'sprunge/lib/json';
import { Schema, Field } from '../index';

export const ident = read1To(' \r\n\t():{}[]<>,"\'`\\;&#.+/*|^%=!?', true);

export const type: Parser<Schema> = {};
const value = map(str('string[]', 'number[]', 'boolean[]', 'date[]', 'any', 'string', 'number', 'boolean', 'date'), s => (s === 'any' ? undefined : { type: s } as Schema), { name: 'type', primary: true });
const key = map(seq(name(ident, { name: 'key', primary: true }), opt(str('?')), ws, str(':'), ws, type), ([name, opt, , , , type]) => {
  const res: Field = { name };
  res.type = type.type;
  if (type.fields) res.fields = type.fields;
  if (type.types) res.types = type.types;
  if (type.rest) res.rest = type.rest;
  if (type.type === 'literal') res.literal = type.literal;
  if (!opt) res.required = true;
  return res;
});
const literal = alt<Schema>(
  { name: 'literal', primary: true }, 
  map(alt<string|number>(JString, JNum), v => {
    return { type: 'literal', literal: v } as Schema;
  }),
  map(str('true', 'false', 'null', 'undefined'), v => {
    return { type: 'literal', literal: v === 'true' ? true : v === 'false' ? false : v === 'null' ? null : undefined } as Schema;
  }),
);
const rest = map(seq(str('...'), ws, str(':'), ws, type), ([, , , , type]) => {
  return Object.assign({ name: '...' }, type) as Field;
});
const object: Parser<Schema> = map(seq(str('{'), ws, repsep(alt(key, rest), read1(' \t\n,;'), 'allow'), ws, str('}'), opt(str('[]'))), ([, , keys, , , arr], fail) => {
  const rests = keys.filter(k => k.name === '...');
  if (rests.length > 1) fail('only one object rest can be specified');
  else {
    const rest = rests[0];
    keys = keys.filter(k => k.name !== '...');
    const type: Schema = { type: arr ? 'object[]' : 'object' };
    if (keys.length) type.fields = keys;
    if (rest) {
      delete rest.name;
      type.rest = rest;
    }
    return type;
  }
});
const tuple = map(seq(str('['), ws, repsep(type, read1(' \t\r\n,')), ws, str(']'), opt(str('[]'))), ([, , types, , , arr]) => {
  return { type: arr ? 'tuple[]' : 'tuple', types } as Schema;
});
const maybe_union = map(rep1sep(alt<Schema>(value, object, tuple, literal), seq(ws, str('|'), ws)), types => {
  if (types.length === 1) return types[0];
  else return { type: 'union', types: types } as Schema;
});
const union_array = alt<Schema>(
  map(seq(str('Array<'), ws, maybe_union, ws, str('>')), ([, , union]) => ({ type: 'union[]', types: union.types } as Schema)),
  maybe_union,
);

type.parser = union_array;

export const parseSchema = makeParser(type, { trim: true, consumeAll: true });

export function unparseSchema(schema: Schema): string {
  if (!schema) return 'any';
  const t = schema.type;
  const ts = schema.types;
  switch (t) {
    case 'object':
    case 'object[]':
      const arr = ~t.indexOf('[]');
      if (!schema.fields && !schema.rest) return `{}${arr ? '[]' : ''}`;
      const fields = schema.fields ? schema.fields.map(f => `${f.name}: ${unparseSchema(f)}`).join(', ') : '';
      return `{ ${fields}${schema.rest ? `${fields.length ? ', ' : ''}...: ${unparseSchema(schema.rest)}` : ''} }${arr ? '[]' : ''}`;
    case 'union':
    case 'union[]':
      const ures = ts.map(u => unparseSchema(u)).join('|');
      if (~t.indexOf('[]')) return `Array<${ures}>`;
      else return ures;
    case 'literal':
      if (typeof schema.literal === 'string') return `'${schema.literal.replace(/'/g, '\\\'')}'`;
      return `${schema.literal}`;
    case 'tuple':
    case 'tuple[]':
      let tres: string;
      if (!t || t.length === 0) tres = '[]';
      else tres = `[${ts.map(t => unparseSchema(t)).join(', ')}]`;
      if (~t.indexOf('[]')) return `${tres}[]`;
      else return tres;
    default: return t || 'any';
  }
}
