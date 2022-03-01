import { Schema, Field, Type } from './index';
import { join } from './diff';
import { parseSchema, unparseSchema } from './parse/schema';

const date = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
function isDate(v: any) {
  if (typeof v === 'object' && v instanceof Date) return true;
  else if (typeof v === 'string' && date.test(v)) return true;
  return false;
}

export function inspect(base: any, flat?: true): Schema {
  const root = getType(base);
  if (Array.isArray(base)) {
    const fields: Field[] = [];
    fields.push({ type: 'number', name: 'length' });
    if (!flat && base.length > 0) {
      const val = inspect(base[0]);
      if (val.fields) fields.push({ type: val.type, fields: val.fields, name: '0' });
      else fields.push({ type: val.type, name: '0' });
    }
    return { type: root, fields };
  } else if (typeof base === 'object') {
    const fields: Field[] = [];
    for (const k in base) {
      fields.push(getField(k, base[k], flat));
    }
    return { type: root, fields };
  }
  return { type: root };
}

function getField(name: string, v: any, flat?: true): Field {
  const type = getType(v);
  if (!flat && (~type.indexOf('object') || type === 'array')) {
    const cs = inspect(v);
    if (cs.fields) return { type, fields: cs.fields, name };
    else return { type, name };
  }
  return { type: getType(v), name };
}

function getType(v: any): Type {
  if (typeof v === 'string') {
    if (isDate(v)) return 'date';
    else return 'string';
  }
  else if (typeof v === 'number') return 'number';
  else if (typeof v === 'boolean') return 'boolean';
  else if (Array.isArray(v)) {
    if (v.length < 1) return 'array';
    else if (typeof v[0] === 'string') {
      if (isDate(v[0])) return 'date[]';
      else return 'string[]';
    }
    else if (typeof v[0] === 'number') return 'number[]';
    else if (typeof v[0] === 'boolean') return 'boolean[]';
    else if (isDate(v[0])) return 'date[]';
    else if (typeof v[0] === 'object') return 'object[]';
    else return 'array';
  } else if (typeof v === 'object') {
    if (v instanceof Date) return 'date';
    else return 'object';
  } else return 'any';
}

export type ValidationResult = ValidationError[] | true;
export interface ValidationError {
  error: string;
  type?: 'strict';
  path?: string;
  actual?: string;
  expected?: string;
  value?: any;
}

export function validate(value: any, schema: Schema|string, mode?: 'strict'|'loose'): ValidationResult {
  if (typeof schema === 'string') {
    const parsed = parseSchema(schema);
    if ('message' in parsed) return [{ error: 'invalid schema' }];
    schema = parsed;
  }

  if (!schema) schema = { type: 'any' };
  return _validate(value, schema, mode, '');
}

function _validate(value: any, schema: Schema, mode: 'strict'|'loose', path: string): ValidationResult {
  const { type, fields, rest, types, literal } = schema || {};
  if (!checkType(value, type, literal)) return [{ error: `type mismatch for '${type}'`, actual: unparseSchema(inspect(value)), value, path, expected: unparseSchema(schema) }];

  const errs: ValidationError[] = [];
  let tmp: ValidationResult;

  if ((type === 'tuple' || type === 'tuple[]') && types) {
    const arr = ~type.indexOf('[]');
    const val: any[][] = arr ? value : [value];
    for (let i = 0; i < val.length; i++) {
      const v = val[i];
      const p = arr ? join(path, `${i}`) : path;
      if (!Array.isArray(v)) {
        errs.push({ error: 'expected a tuple', path: p, value: v });
      } else if (v.length < types.length) {
        const diff = types.length - v.length;
        errs.push({ error: `missing ${diff} field${diff > 1 ? 's' : ''} in tuple`, path: p, expected: unparseSchema({ type: 'tuple', types }) });
      } else {
        for (let i = 0; i < types.length; i++) {
          if ((tmp = _validate(v[i], types[i], mode, join(p, `${i}`))) !== true) errs.push.apply(errs, tmp);
        }

        if (mode === 'strict' && v.length > types.length) errs.push({ error: `too many values for tuple`, type: 'strict', path: p, expected: unparseSchema({ type: 'tuple', types }) });
      }
    }
  } else if ((type === 'union' || type === 'union[]') && types) {
    const arr = ~type.indexOf('[]');
    const val: any[] = arr ? value : [value];
    for (let i = 0; i < val.length; i++) {
      const v = val[i];
      const p = arr ? join(path, `${i}`) : path;
      let ok = false;
      for (const u of types) {
        if (_validate(v, u, mode, p) === true) {
          ok = true;
          break;
        }
      }
      if (!ok) errs.push({ error: `type mismatch for union`, actual: unparseSchema(inspect(v)), expected: unparseSchema({ type: 'union', types }), value: v, path: p });
    }
  } else if ((type === 'object' || type === 'object[]' || type === 'any') && fields || rest) {
    const arr = ~type.indexOf('[]');
    const val: object[] = arr ? value : [value];
    for (let i = 0; i < val.length; i++) {
      const v = val[i];
      const p = arr ? join(path, `${i}`) : path;
      if (fields) {
        for (const f of fields) {
          if (f.required && !(f.name in v)) errs.push({ error: `requried field ${f.name} is missing`, path: join(p, f.name) });
          else if (f.name in v && (tmp = _validate(v[f.name], f, mode, join(p, f.name))) !== true) errs.push.apply(errs, tmp);
        }
      }
      if (rest) {
        for (const k in v) {
          if (fields && fields.find(f => f.name === k)) continue;
          if (v[k] != null && (tmp = _validate(v[k], rest, mode, join(p, k))) !== true) errs.push.apply(errs, tmp);
        }
      } else if (mode === 'strict') {
        for (const k in v) if (v[k] != null && !fields || !fields.find(f => f.name === k)) errs.push({ error: `unknown field ${k}`, path: p, type: 'strict', value: v[k] });
      }
    }
  }

  return errs.length ? errs : true;
}

const values = ['string', 'number', 'boolean', 'object'];
export function checkType(value: any, type?: Type, literal?: any): boolean {
  switch (type || 'any') {
    case 'any':
    case 'union':
      return true;

    case 'value': return !Array.isArray(value) && !!~values.indexOf(typeof value) && (typeof value !== 'object' || isDate(value));

    case 'array':
    case 'tuple':
    case 'union[]':
    case 'tuple[]':
      return Array.isArray(value);

    case 'literal': return value === literal;

    case 'string': return typeof value === 'string';
    case 'number': return typeof value === 'number';
    case 'boolean': return typeof value === 'boolean';
    case 'date': return isDate(value);
    case 'object': return !Array.isArray(value) && typeof value === 'object';
    case 'string[]': return Array.isArray(value) && value.reduce((a, c) => a && typeof c === 'string', true);
    case 'number[]': return Array.isArray(value) && value.reduce((a, c) => a && typeof c === 'number', true);
    case 'boolean[]': return Array.isArray(value) && value.reduce((a, c) => a && typeof c === 'boolean', true);
    case 'date[]': return Array.isArray(value) && value.reduce((a, c) => a && isDate(c), true);
    case 'object[]': return Array.isArray(value) && value.reduce((a, c) => a && !Array.isArray(c) && typeof c === 'object', true);
  }
}
