import { parse } from '../../src/lib/index';

const q = QUnit;

q.module('data/parse');

q.test('plain numbers', t => {
  t.deepEqual(parse('10'), { v: 10 });
  t.deepEqual(parse('1.1'), { v: 1.1 });
});

q.test('separated numbers', t => {
  t.deepEqual(parse('1_0'), { v: 10 });
  t.deepEqual(parse('111_000'), { v: 111000 });
  t.deepEqual(parse('1_111.000_1'), { v: 1111.0001 });
});

q.test('booleans', t => {
 t.deepEqual(parse('true'), { v: true });
 t.deepEqual(parse('false'), { v: false });
});

q.test('nullish', t => {
  t.deepEqual(parse('null'), { v: null });
  t.deepEqual(parse('undefined'), { v: undefined });
});

q.test('strings', t => {
  t.deepEqual(parse(`'test'`), { v: 'test' });
  t.deepEqual(parse(`"test"`), { v: 'test' });
  t.deepEqual(parse('`test`'), { v: 'test' });
});

q.test('strings with escapes', t => {
  t.deepEqual(parse(`'test\\nfoo'`), { v: 'test\nfoo' });
  t.deepEqual(parse(`'test\\tfoo'`), { v: 'test\tfoo' });
  t.deepEqual(parse(`'test\\x0afoo'`), { v: 'test\nfoo' });
  t.deepEqual(parse(`'test\\u000afoo'`), { v: 'test\nfoo' });
});

q.test('references', t => {
  t.deepEqual(parse('foo'), { r: 'foo' });
  t.deepEqual(parse('foo.bar'), { r: 'foo.bar' });
  t.deepEqual(parse('foo.0.bar'), { r: 'foo.0.bar' });
});

q.test('simple special references', t => {
  t.deepEqual(parse('#foo'), { r: '#foo' });
  t.deepEqual(parse('#foo.bar'), { r: '#foo.bar' });
  t.deepEqual(parse('#foo.0.bar'), { r: '#foo.0.bar' });
  t.deepEqual(parse('@foo'), { r: '@foo' });
  t.deepEqual(parse('@foo.bar'), { r: '@foo.bar' });
  t.deepEqual(parse('@foo.0.bar'), { r: '@foo.0.bar' });
  t.deepEqual(parse('!foo'), { r: '!foo' });
  t.deepEqual(parse('!foo.bar'), { r: '!foo.bar' });
  t.deepEqual(parse('!foo.0.bar'), { r: '!foo.0.bar' });
  t.deepEqual(parse('+foo'), { r: '+foo' });
  t.deepEqual(parse('+foo.bar'), { r: '+foo.bar' });
  t.deepEqual(parse('+foo.0.bar'), { r: '+foo.0.bar' });
  t.deepEqual(parse('^foo'), { r: '^foo' });
  t.deepEqual(parse('^foo.bar'), { r: '^foo.bar' });
  t.deepEqual(parse('^foo.0.bar'), { r: '^foo.0.bar' });
  t.deepEqual(parse('^^^foo'), { r: '^^^foo' });
  t.deepEqual(parse('^^^foo.bar'), { r: '^^^foo.bar' });
  t.deepEqual(parse('^^^foo.0.bar'), { r: '^^^foo.0.bar' });
});

q.test('simple ops', t => {
  t.deepEqual(parse('(a)'), { op: 'a' });
  t.deepEqual(parse('(+ a b)'), { op: '+', args: [{ r: 'a' }, { r: 'b' }] });
  t.deepEqual(parse('(+ 10 (- 20 c))'), { op: '+', args: [{ v: 10 }, { op: '-', args: [{ v: 20 }, { r: 'c' }] }] });
  t.deepEqual(parse('(+ a, b)'), { op: '+', args: [{ r: 'a' }, { r: 'b' }] });
  t.deepEqual(parse('(+ a "foo")'), { op: '+', args: [{ r: 'a' }, { v: 'foo' }] });
  t.deepEqual(parse('(+ a, "foo")'), { op: '+', args: [{ r: 'a' }, { v: 'foo' }] });
  t.deepEqual(parse('(+ #a !b)'), { op: '+', args: [{ r: '#a' }, { r: '!b' }] });
});

q.test('complex ops - source', t => {
  t.deepEqual(parse('(a +b)'), { op: 'a', source: { r: 'b' } });
  t.deepEqual(parse('(a +b b c)'), { op: 'a', source: { r: 'b' }, args: [{ r: 'b' }, { r: 'c' }] });
});

q.test('complex ops - applicative', t => {
  t.deepEqual(parse('(a =>b)'), { op: 'a', apply: { r: 'b' } });
  t.deepEqual(parse('(a =>(b "c"))'), { op: 'a', apply: { op: 'b', args: [{ v: 'c' }] } });
  t.deepEqual(parse('(a =>(b "c") d)'), { op: 'a', apply: { op: 'b', args: [{ v: 'c' }] }, args: [{ r: 'd' }] });
  t.deepEqual(parse('(a =>b c)'), { op: 'a', apply: { r: 'b' }, args: [{ r: 'c' }] });
  t.deepEqual(parse('(a => b c)'), { op: 'a', apply: { r: 'b' }, args: [{ r: 'c' }] });
});

q.test('complex ops - local args', t => {
  t.deepEqual(parse('(a &(b))'), { op: 'a', locals: [{ r: 'b' }] });
  t.deepEqual(parse('(a &(b c) d)'), { op: 'a', locals: [{ r: 'b' }, { r: 'c' }], args: [{ r: 'd' }] });
});

q.test('complex ops', t => {
  t.deepEqual(parse('(a +d =>foo &(b) e (- f 10))'), { op: 'a', source: { r: 'd' }, apply: { r: 'foo' }, locals: [{ r: 'b' }], args: [{ r: 'e' }, { op: '-', args: [{ r: 'f' }, { v: 10 }] }] });
});
