import { Value } from '../index';
import { value, rws } from '../parse';
import { Parser, parser as makeParser, ErrorOptions, rep, rep1, seq, alt, map, read1To, chars, str, readTo, check, andNot } from 'sprunge';
import { ws } from 'sprunge/lib/json';

const endTxt = '\\{';

const txtEsc = alt(map(str('\\{{'), () => '{{'), map(seq(str('\\'), chars(1)), ([, c]) => c));
const text = map(rep1(alt(read1To(endTxt, true), txtEsc, andNot(str('{'), str('{')))), txts => ({ v: txts.join('') }));

function tag_value(names: string[]): Parser<[string, Value]> {
  return map(seq(str('{{'), ws, str(...names), rws, value, ws, str('}}')), arr => [arr[2], arr[4]]);
}

const tag_end = check(seq(str('{{/'), readTo('}'), str('}}')));

const content: Parser<Value> = {};

interface Branch {
  name: string;
  value?: Value;
}

type Content = Value|Branch;

function branch(names: string[], value?: boolean): Parser<Branch> {
  if (value) return map(tag_value(names), ([name, value]) => ({ name, value }));
  else return map(seq(str('{{'), ws, str(...names), ws, str('}}')), ([, , name]) => ({ name }));
}

function min_one<T>(values: Parser<Array<T>>): Parser<Array<T|Value>> {
  return map(values, v => v.length < 1 ? [{ v: '' }] : v);
}

const else_tag = branch(['else']);
const branch_tag = branch(['else if', 'elseif', 'elsif', 'elif'], true);

const each_op = map(seq(tag_value(['each']), min_one(rep(alt<Content>(branch_tag, else_tag, content))), tag_end), ([tag, content]) => ({ op: 'each', args: [tag[1]].concat(apply_first(cond_branches(content))) }));
const if_op = map(seq(tag_value(['if']), min_one(rep(alt<Content>(branch_tag, else_tag, content))), tag_end), ([tag, content]) => ({ op: 'if', args: [tag[1]].concat(cond_branches(content)) }));
const with_op = map(seq(tag_value(['with']), min_one(rep(alt<Content>(else_tag, content))), tag_end), ([tag, content]) => ({ op: 'with', args: [tag[1]].concat(apply_first(cond_branches(content))) }));
const unless_op = map(seq(tag_value(['unless']), min_one(rep(content)), tag_end), ([tag, content]) => ({ op: 'unless', args: [tag[1]].concat(concat(content)) }));

const interpolator = map(seq(str('{{'), ws, value, ws, str('}}')), ([, , value]) => ({ op: 'string', args: [value] }));

content.parser = alt<Value>(text, each_op, if_op, with_op, unless_op, interpolator);

function apply_first(content: Value[]): Value[] {
  if (content.length) content[0] = { a: content[0] };
  return content;
}

function cond_branches(content: Array<Value|Branch>): Value[] {
  const res: Value[] = [];
  let args = [];
  let hasTag = false;

  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if ('name' in c) {
      hasTag = true;
      if (args.length) res.push(concat(args));
      else res.push({ v: '' });
      if (c.value) res.push(c.value);
      args = [];
    } else args.push(c);
  }
  if (args.length) res.push(concat(args));
  else if (hasTag) res.push({ v: '' });

  if (res.length % 2) res.push({ v: '' });

  return res;
}

function concat(values: Value[]): Value {
  if (values.length === 1) return values[0];
  return { op: '+', args: values };
}

const _parse = makeParser(map(rep1(content), args => concat(args)));

export function parse(input: string, opts?: ErrorOptions): Value {
  if (!input) return { v: '' };
  return _parse(input, Object.assign({ detailed: false, consumeAll: true }, opts));
}
