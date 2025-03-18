import { Value } from '../index';
import { value, rws, replaceCase, inlineTemplate } from '../parse';
import { Parser, parser as makeParser, rep, rep1, seq, alt, map, read1To, chars, str, readTo, check, andNot, name } from 'sprunge';
import { ws } from 'sprunge/lib/json';

const endTxt = '\\{';

const txtEsc = alt(map(str('\\{{'), () => '{{'), map(seq(str('\\'), chars(1)), ([, c]) => c));
const text = map(rep1(alt(read1To(endTxt, true), txtEsc, andNot(str('{'), str('{')))), txts => ({ v: txts.join('') }), 'text');
const nestedText = map(rep1(alt(read1To(endTxt + '$'), txtEsc, andNot(str('$'), str('$$')), andNot(str('{'), str('{')))), txts => ({ v: txts.join('') }), 'text');

function tag_value(names: string[]): Parser<[string, Value]> {
  return map(seq(str('{{'), ws, str(...names), rws, value, ws, str('}}')), arr => [arr[2], arr[4]], 'tag');
}

function case_value(names: string[]): Parser<[string, Value, Value]> {
  return map(seq(str('{{'), ws, str(...names), rws, value, rws, str('when'), rws, value, str('}}')), arr => [arr[2], arr[4], arr[8]], 'tag');
}

const tag_end = name(check(seq(str('{{/'), readTo('}'), str('}}'))), 'tag end');

const content: Parser<Value> = {};

interface Branch {
  name: string;
  value?: Value;
}

type Content = Value|Branch;

function branch(names: string[], value?: boolean): Parser<Branch> {
  if (value) return map(tag_value(names), ([name, value]) => ({ name, value }));
  else return map(seq(str('{{'), ws, str(...names), ws, str('}}')), ([, , name]) => ({ name }), 'tag');
}

function min_one<T>(values: Parser<Array<T>>): Parser<Array<T|Value>> {
  return map(values, v => v.length < 1 ? [{ v: '' }] : v);
}

const else_tag = branch(['else']);
const branch_tag = branch(['else if', 'elseif', 'elsif', 'elif'], true);

const each_op = map(seq(tag_value(['each']), min_one(rep(alt<Content>(branch_tag, else_tag, content))), tag_end), ([tag, content]) => ({ op: 'each', args: [tag[1]].concat(apply_first(cond_branches(content))) }), { primary: true, name: 'each-block' });
const if_op = map(seq(tag_value(['if']), min_one(rep(alt<Content>(branch_tag, else_tag, content))), tag_end), ([tag, content]) => ({ op: 'if', args: [tag[1]].concat(cond_branches(content)) }), { primary: true, name: 'if-block' });
const with_op = map(seq(tag_value(['with']), min_one(rep(alt<Content>(else_tag, content))), tag_end), ([tag, content]) => ({ op: 'with', args: [tag[1]].concat(apply_first(cond_branches(content))) }), { primary: true, name: 'with-block' });
const unless_op = map(seq(tag_value(['unless']), min_one(rep(content)), tag_end), ([tag, content]) => ({ op: 'unless', args: [tag[1]].concat(concat(content)) }), { primary: true, name: 'unless-block' });
const case_op = map(seq(case_value(['case']), min_one(rep(alt<Content>(branch(['when'], true), else_tag, content))), tag_end), ([tag, content]) => {
  const op = { op: 'case', args: tag.slice(1).concat(cond_branches(content)) };
  for (let i = 1; i < op.args.length; i += 2) {
    const arg = op.args[i];
    if (typeof arg === 'object' && 'op' in arg) replaceCase(arg);
  }
  return op;
}, { primary: true, name: 'case-block' });

const interpolator = map(seq(str('{{'), ws, value, ws, str('}}')), ([, , value]) => ({ op: 'string', args: [value] }), { primary: true, name: 'interpolator' });

content.parser = alt<Value>({ primary: true, name: 'content' }, text, each_op, if_op, with_op, case_op, unless_op, interpolator);

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
  return { op: 'cat', args: values, meta: { q: '$$$' } };
}

const _parse = makeParser(alt<Value>(map(rep1(content), args => concat(args)), map(ws, () => ({ v: '' }))), { trim: true });
(_parse as any).namespace = 'template';
export const parse: typeof _parse & { namespace: string } = _parse as any;

(inlineTemplate as { parser?: Parser<Value> }).parser = map(rep1(alt<Value>({ name: 'inline-template' }, nestedText, each_op, if_op, with_op, case_op, unless_op, interpolator)), args => concat(args));
