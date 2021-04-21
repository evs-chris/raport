import { Schema, Field, Type } from './index';

const date = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

export function inspect(base: any, flat?: true): Schema {
  const root = getType(base);
  if (Array.isArray(base)) {
    const fields: Field[] = [];
    fields.push({ type: 'number', name: 'length' });
    if (!flat && base.length > 0) {
      const val = inspect(base[0]);
      if (val.fields) fields.push({ type: val.root, fields: val.fields, name: '0' });
      else fields.push({ type: val.root, name: '0' });
    }
    return { root, fields };
  } else if (typeof base === 'object') {
    const fields: Field[] = [];
    for (const k in base) {
      fields.push(getField(k, base[k], flat));
    }
    return { root, fields };
  }
  return { root };
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
    if (date.test(v)) return 'date';
    else return 'string';
  }
  else if (typeof v === 'number') return 'number';
  else if (typeof v === 'boolean') return 'boolean';
  else if (Array.isArray(v)) {
    if (v.length < 1) return 'array';
    else if (typeof v[0] === 'string') {
      if (date.test(v[0])) return 'date[]';
      else return 'string[]';
    }
    else if (typeof v[0] === 'number') return 'number[]';
    else if (typeof v[0] === 'boolean') return 'boolean[]';
    else if (typeof v[0] === 'object' && v[0] instanceof Date) return 'date[]';
    else if (typeof v[0] === 'object') return 'object[]';
    else return 'array';
  } else if (typeof v === 'object') {
    if (v instanceof Date) return 'date';
    else return 'object';
  } else return 'any';
}
