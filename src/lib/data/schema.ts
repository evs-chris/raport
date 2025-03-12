import { Schema, Field, Type, TypeMap } from './index';
import { join } from './diff';
import { parseSchema, unparseSchema } from './parse/schema';
import { evalApply, Root, Context, safeGet, extend, isDateRel } from './index';

const date = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
function isDate(v: any) {
  if (typeof v === 'object') return isDateRel(v);
  else if (typeof v === 'string' && date.test(v)) return true;
  return false;
}

export function isSchema(what: any): what is Schema {
  return what && typeof what === 'object' && 'type' in what && typeof what.type === 'string';
}

export function inspect(base: any, flat?: boolean): Schema {
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
  } else if (typeof base === 'object' && !isDate(base)) {
    const fields: Field[] = [];
    for (const k in base) {
      fields.push(getField(k, base[k], flat));
    }
    return { type: root, fields };
  }
  return { type: root };
}

function getField(name: string, v: any, flat?: boolean): Field {
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
    if (isDate(v)) return 'date';
    else return 'object';
  } else return 'any';
}

export type ValidationResult = ValidationError[] | true;
export interface ValidationError {
  error: string;
  type?: 'strict'|'check'|'missing';
  path?: string;
  actual?: string;
  expected?: string;
  value?: any;
  literal?: boolean;
}

export function validate(value: any, schema: Schema|string, mode?: 'strict'|'missing'|'loose'): ValidationResult {
  if (typeof schema === 'string') {
    const parsed = parseSchema(schema);
    if ('message' in parsed) return [{ error: 'invalid schema' }];
    schema = parsed;
  }

  if (!schema) schema = { type: 'any' };
  const ctx = new Root(value, { special: { types: schema.defs || {} } });
  return _validate(value, schema, mode, '', ctx);
}

function _validate(value: any, schema: Schema, mode: 'strict'|'missing'|'loose', path: string, ctx: Context, required?: boolean): ValidationResult {
  schema = schema || {};
  let _schema = schema;
  const errs: ValidationError[] = [];
  const miss = mode === 'strict' || mode === 'missing';
  if (_schema.ref) {
    let s = _schema;
    while (s && s.ref) s = safeGet(ctx, `@types.${s.ref}`);
    if (s) _schema = s;
    else if (miss) errs.push({ error: `missing type definition '${_schema.ref}'`, type: 'missing' });
  }
  let { checks } = _schema;
  const { type, fields, rest, types, literal } = _schema;
  if (!checkType(value, schema.type === 'array' ? 'array' : type, literal, required)) return [{ error: `type mismatch for${required ? ' required' : ''} ${type}`, actual: unparseSchema(inspect(value)), value, path, expected: unparseSchema(_schema, true), literal: type === 'literal' }];

  if (_schema !== schema && schema.checks) {
    if (!checks) checks = schema.checks;
    else checks = checks.concat(schema.checks);
  }

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
          if ((tmp = _validate(v[i], types[i], mode, join(p, `${i}`), extend(ctx, { value: v[i], path: join(p, `${i}`) }))) !== true) errs.push.apply(errs, tmp);
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
      let legit: ValidationError[];
      for (const u of types) {
        if ((tmp = _validate(v, u, mode, p, ctx)) === true) {
          ok = true;
          break;
        } else if (miss && tmp.find(e => e.type === 'missing') || tmp.find(e => e.type === 'check')) {
          const t = tmp.filter(e => miss && e.type === 'missing' || e.type === 'check');
        } else if (tmp.find(e => e.path !== p))  {
          if (!legit) legit = tmp
          else if (tmp.length < legit.length) legit = tmp;
          else if (legit.filter(e => e.literal).length > tmp.filter(e => e.literal).length) legit = tmp;
        }
      }
      if (!ok && !legit) errs.push({ error: `type mismatch for union`, actual: unparseSchema(inspect(v)), expected: unparseSchema({ type: 'union', types }), value: v, path: p });
      else if (!ok && legit) errs.push.apply(errs, legit);
    }
  } else if ((type === 'object' || type === 'object[]' || type === 'any') && fields || rest) {
    const arr = ~type.indexOf('[]') || schema.type === 'array';
    const val: object[] = arr ? value : [value];
    for (let i = 0; i < val.length; i++) {
      const v = val[i];
      const p = arr ? join(path, `${i}`) : path;
      if (typeof v !== 'object' && typeof v !== 'function') {
        errs.push({ error: 'expected an object', value: v, path: p, actual: unparseSchema(inspect(v), true) });
        continue;
      }
      if (fields) {
        for (const f of fields) {
          if (f.required && !(f.name in v)) errs.push({ error: `required field '${f.name}' is missing`, path: join(p, f.name), expected: f.type });
          else if (v && f.name in v && (tmp = _validate(v[f.name], f, mode, join(p, f.name), extend(ctx, { value: v[f.name], path: join(p, f.name) }), f.required)) !== true) errs.push.apply(errs, tmp);
        }
      }
      if (rest && v) {
        for (const k in v) {
          if (fields && fields.find(f => f.name === k)) continue;
          if (v[k] != null && (tmp = _validate(v[k], rest, mode, join(p, k), extend(ctx, { value: v[k], path: join(p, k) }))) !== true) errs.push.apply(errs, tmp);
        }
      } else if (mode === 'strict' && v) {
        for (const k in v) if (v[k] != null && !fields || !fields.find(f => f.name === k)) errs.push({ error: `unknown field '${k}'`, path: p, type: 'strict', value: v[k] });
      }
    }
  }

  if (!errs.length && checks && checks.length) {
    let tmp: any;
    for (let i = 0; i < checks.length; i++) {
      const c = checks[i];
      tmp = evalApply(ctx, c, [value]);
      if (!tmp || typeof tmp == 'string') errs.push({ error: typeof tmp !== 'string' || !tmp ? `check ${i + 1} failed` : tmp, path, value, type: 'check', expected: unparseSchema(schema, true) });
    }
  }

  return errs.length ? errs : true;
}

const values = ['string', 'number', 'boolean', 'object'];
export function checkType(value: any, type?: Type, literal?: any, required?: boolean): boolean {
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
    case 'object': return !Array.isArray(value) && typeof value === 'object' && (!required || value != null);
    case 'string[]': return Array.isArray(value) && value.reduce((a, c) => a && typeof c === 'string', true);
    case 'number[]': return Array.isArray(value) && value.reduce((a, c) => a && typeof c === 'number', true);
    case 'boolean[]': return Array.isArray(value) && value.reduce((a, c) => a && typeof c === 'boolean', true);
    case 'date[]': return Array.isArray(value) && value.reduce((a, c) => a && isDate(c), true);
    case 'object[]': return Array.isArray(value) && value.reduce((a, c) => a && !Array.isArray(c) && typeof c === 'object' && (!required || c != null), true);
  }
}
