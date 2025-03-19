import { parse } from '../../src/lib/index';

const q = QUnit;

function parseErr(str: string): string {
  const res = parse(str, { detailed: true, consumeAll: true });
  if (typeof res === 'object' && 'message' in res) return res.message;
  else return '<no error>';
}

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
  t.deepEqual(parse(':test'), { v: 'test' });
  t.deepEqual(parse('"""test"""'), { v: 'test', q: '"""' });
  t.deepEqual(parse('```test```'), { v: 'test' });
  t.deepEqual(parse(`'''test'''`), { v: `test` });
  t.deepEqual(parse('$$$test$$$'), { v: 'test' });
});

q.test('strings with escapes', t => {
  t.deepEqual(parse(`'test\\nfoo'`), { v: 'test\nfoo' });
  t.deepEqual(parse(`'test\\tfoo'`), { v: 'test\tfoo' });
  t.deepEqual(parse(`'test\\x0afoo'`), { v: 'test\nfoo' });
  t.deepEqual(parse(`'test\\u000afoo'`), { v: 'test\nfoo' });
});

q.test('references', t => {
  t.deepEqual(parse('foo'), { r: { k: ['foo'] } });
  t.deepEqual(parse('foo.bar'), { r: { k: ['foo', 'bar'] } });
  t.deepEqual(parse('foo.0.bar'), { r: { k: ['foo', '0', 'bar'] } });
});

q.test('simple special references', t => {
  t.deepEqual(parse('~foo'), { r: { p: '~', k: ['foo'] } });
  t.deepEqual(parse('~foo.bar'), { r: { p: '~', k: ['foo', 'bar'] } });
  t.deepEqual(parse('~foo.0.bar'), { r: { p: '~', k: ['foo', '0', 'bar'] } });
  t.deepEqual(parse('@foo'), { r: { p: '@', k: ['foo'] } });
  t.deepEqual(parse('@foo.bar'), { r: { p: '@', k: ['foo', 'bar'] } });
  t.deepEqual(parse('@foo.0.bar'), { r: { p: '@', k: ['foo', '0', 'bar'] } });
  t.deepEqual(parse('!foo'), { r: { p: '!', k: ['foo'] } });
  t.deepEqual(parse('!foo.bar'), { r: { p: '!', k: ['foo', 'bar'] } });
  t.deepEqual(parse('!foo.0.bar'), { r: { p: '!', k: ['foo', '0', 'bar'] } });
  t.deepEqual(parse('*foo'), { r: { p: '*', k: ['foo'] } });
  t.deepEqual(parse('*foo.bar'), { r: { p: '*', k: ['foo', 'bar'] } });
  t.deepEqual(parse('*foo.0.bar'), { r: { p: '*', k: ['foo', '0', 'bar'] } });
  t.deepEqual(parse('^foo'), { r: { u: 1, k: ['foo'] } });
  t.deepEqual(parse('^foo.bar'), { r: { u: 1, k: ['foo', 'bar'] } });
  t.deepEqual(parse('^foo.0.bar'), { r: { u: 1, k: ['foo', '0', 'bar'] } });
  t.deepEqual(parse('^^^foo'), { r: { u: 3, k: ['foo'] } });
  t.deepEqual(parse('^^^foo.bar'), { r: { u: 3, k: ['foo', 'bar'] } });
  t.deepEqual(parse('^^^foo.0.bar'), { r: { u: 3, k: ['foo', '0', 'bar'] } });
});

q.test('simple ops', t => {
  t.deepEqual(parse('(a)'), { op: 'a' });
  t.deepEqual(parse('(+ a b)'), { op: '+', args: [{ r: { k: ['a'] } }, { r: { k: ['b'] } }] });
  t.deepEqual(parse('(+ 10 (- 20 c))'), { op: '+', args: [{ v: 10 }, { op: '-', args: [{ v: 20 }, { r: { k: ['c'] } }] }] });
  t.deepEqual(parse('(+ a, b)'), { op: '+', args: [{ r: { k: ['a'] } }, { r: { k: ['b'] } }] });
  t.deepEqual(parse('(+ a "foo")'), { op: '+', args: [{ r: { k: ['a'] } }, { v: 'foo' }] });
  t.deepEqual(parse('(+ a, "foo")'), { op: '+', args: [{ r: { k: ['a'] } }, { v: 'foo' }] });
  t.deepEqual(parse('(+ ~a !b)'), { op: '+', args: [{ r: { p: '~', k: ['a'] } }, { r: { p: '!', k: ['b'] } }] });
});

q.test('complex ops - applicative', t => {
  t.deepEqual(parse('(a =>b)'), { op: 'a', args: [{ a: { r: { k: ['b'] } } }] });
  t.deepEqual(parse('(a =>(b "c"))'), { op: 'a', args: [{ a: { op: 'b', args: [{ v: 'c' }] } }] });
  t.deepEqual(parse('(a =>(b "c") d)'), { op: 'a', args: [{ a: { op: 'b', args: [{ v: 'c' }] } }, { r: { k: ['d'] } }] });
  t.deepEqual(parse('(a =>b c)'), { op: 'a', args: [{ a: { r: { k: ['b'] } } }, { r: { k: ['c'] } }] });
});

q.test('complex ops - local args', t => {
  t.deepEqual(parse('(a =>b)'), { op: 'a', args: [{ a: { r: { k: ['b'] } } }] });
  t.deepEqual(parse('(a =>b =>c d)'), { op: 'a', args: [{ a: { r: { k: ['b'] } } }, { a: { r: { k: ['c'] } } }, { r: { k: ['d'] } }] });
});

q.test('references with a path separator must have path after the separator', t => {
  t.matches(parseErr('foo.'), 'expected');
});

q.test('strings must have an endquote', t => {
  t.matches(parseErr('"foo'), 'expected');
  t.matches(parseErr('"foo`'), 'expected');
  t.matches(parseErr('"foo\\"'), 'expected');
  t.matches(parseErr(`'foo`), 'expected');
});

q.test('parser must consume all input', t => {
  t.matches(parseErr('a b +'), 'consume all');
});

q.test(`whitespace alone doesn't count as more input`, t => {
  t.equal(parseErr('a   '), '<no error>');
});

q.test('string char escapes must be valid', t => {
  t.matches(parseErr('"\\xa"'), 'expected');
  t.matches(parseErr('"\\xap"'), 'expected');
  t.matches(parseErr('"\\ua"'), 'expected');
  t.matches(parseErr('"\\uap"'), 'expected');
  t.matches(parseErr('"\\uaa"'), 'expected');
  t.matches(parseErr('"\\uaa0"'), 'expected');
  t.matches(parseErr('"\\uaa0v"'), 'expected');
});

q.test('there must be something to parse', t => {
  t.matches(parseErr(''), 'expected');
});

q.test('source sigil requires source', t => {
  t.matches(parseErr('(foo *)'), 'expected');
});

q.test('application sigil requires application', t => {
  t.matches(parseErr('(foo =>)'), 'expected');
});

q.test('operator requires a closing )', t => {
  t.matches(parseErr('(a b'), 'expected');
});

q.test('operator requires a name', t => {
  t.matches(parseErr('()'), 'expected');
});

q.test(`expression literals`, t => {
  t.deepEqual(parse('=>a'), { a: { r: { k: ['a'] } } });
  t.deepEqual(parse('=>10'), { a: { v: 10 } });
  t.deepEqual(parse('=>:10'), { a: { v: '10' } });
  t.deepEqual(parse('=>(+ 10 2)'), { a: { op: '+', args: [{ v: 10 }, { v: 2 }] } });
  t.deepEqual(parse('(foo =>(+ 10 2))'), { op: 'foo', args: [{ a: { op: '+', args: [{ v: 10 }, { v: 2 }] } }] });
});

q.test(`a list may have whitespace just before its closing paren`, t => {
  t.deepEqual(parse('(a b c )'), { op: 'a', args: [{ r: { k: ['b'] } }, { r: { k: ['c'] } }] });
});

q.test(`array literal`, t => {
  t.deepEqual(parse('[1 2 asdf]'), { op: 'array', args: [{ v: 1 }, { v: 2 }, { r: { k: ['asdf'] } }] });
  t.deepEqual(parse('[1 2 :asdf]'), { v: [1, 2, 'asdf'] });
});

q.test(`array literal in an op`, t =>{
  t.deepEqual(parse('(op [1] a)'), { op: 'op', args: [{ v: [1] }, { r: { k: ['a'] } }] });
});

q.test(`object literal`, t => {
  t.deepEqual(parse('{ foo:12 :bar:21 baz:asdf }'), { op: 'object', args: [{ v: 'foo' }, { v: 12 }, { v: 'bar' }, { v: 21 }, { v: 'baz' }, { r: { k: ['asdf'] } }] });
  t.deepEqual(parse('{ foo:12 :bar:21 baz::asdf }'), { v: { foo: 12, bar: 21, baz: 'asdf' } });
});
