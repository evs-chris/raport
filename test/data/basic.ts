import { Root, evaluate, extend, parse, parseTemplate } from '../../src/lib/index';
import { isContext } from '../../src/lib/data/index';

const q = QUnit;

const e = evaluate;

q.module('data/basic');

q.test(`contexts are safely detected`, t => {
  t.ok(isContext(new Root()), 'Root is detected as context');
  t.notOk(isContext({}), 'empty object is not context');
  t.notOk(isContext({ context: {} }), 'context containing object is not context');
  t.notOk(isContext({ value: {}, path: '' }), 'similar object is not context');
});

q.test('simple data access', t => {
  t.equal(evaluate({ foo: 'hello' }, 'foo'), 'hello');
});

q.test('safe data access', t => {
  t.equal(evaluate('foo.bar.baz.bat'), undefined);
});

q.test('parameter access', t => {
  const data = new Root({}, { parameters: { foo: 'bar' } });
  t.equal(evaluate(data, '!foo'), 'bar');
});

q.test('simple context shadowing', t => {
  const data = new Root({ foo: 'bar', bar: 'foo' });
  const sub = extend(data, { value: { foo: 'baz' } });
  t.equal(evaluate(data, 'foo'), 'bar');
  t.equal(evaluate(sub, 'foo'), 'baz');
  t.equal(evaluate(data, 'bar'), 'foo');
  t.equal(evaluate(sub, '^bar'), 'foo');
});

q.test('special refs', t => {
  const data = new Root({}, { special: { foo: 'bar', bar: 'foo' } });
  const sub = extend(data, { special: { foo: 'baz' } });
  t.equal(evaluate(data, '@foo'), 'bar');
  t.equal(evaluate(sub, '@foo'), 'baz');
  t.equal(evaluate(sub, '^@foo'), 'bar');
  t.equal(evaluate(data, '@bar'), 'foo');
  t.equal(evaluate(sub, '@bar'), 'foo');
});

q.test('access to non-primitives', t => {
  const data = new Root({ foo: { bar: 'baz' } });
  t.strictEqual(evaluate(data, 'foo'), data.value.foo);
});

q.test('array access', t => {
  const data = new Root({ foo: ['a', 'b', 'c'] });
  t.equal(evaluate(data, 'foo.1'), 'b');
});

q.test('simple operations', t => {
  const data = new Root({ foo: [1, 2, 3] });
  t.equal(evaluate(data, '(+ foo.1 20 10 5 5)'), 42);
});

q.test('nested simple operations', t => {
  const data = new Root({ foo: [1, 2, 3] });
  t.equal(evaluate(data, '(+ foo.1 (- 69 29))'), 42);
});

q.test('simple applicative operations', t => {
  const data = new Root({ foo: [1, 2, 3] });
  t.deepEqual(evaluate(data, '(map foo =>(+ @value 2))'), [3, 4, 5]);
});

q.test('parser namespaces cache politely', t => {
  const ctx = new Root();
  let exprCount = 0, tplCount = 0;
  const parseWrapper = function(...args: any[]) {
    exprCount++;
    return parse.apply(null, args);
  };
  (parseWrapper as any).namespace = 'expr';
  const parseTplWrapper = function(...args: any[]) {
    tplCount++;
    return parseTemplate.apply(null, args);
  };
  (parseTplWrapper as any).namespace = 'tpl';

  t.equal(evaluate(ctx, '10 + 10'), 20);
  t.ok(ctx.exprs.default?.['10 + 10']);
  t.equal(exprCount, 0);
  t.equal(tplCount, 0);

  ctx.parser = parseWrapper as any;
  t.equal(evaluate(ctx, '10 + 10'), 20);
  t.ok(ctx.exprs.expr?.['10 + 10']);
  t.equal(exprCount, 1);
  t.equal(tplCount, 0);

  ctx.parser = parseTplWrapper as any;
  t.equal(evaluate(ctx, '10 + 10'), '10 + 10');
  t.ok(ctx.exprs.tpl?.['10 + 10']);
  t.equal(exprCount, 1);
  t.equal(tplCount, 1);
});

q.test(`calling operators as formats`, t => {
  t.equal(evaluate(`:asdf#upper`), 'ASDF');
  t.deepEqual(evaluate(`'number'#parse(schema:1)`), { type: 'number' });
  t.equal(evaluate(`123#add(10)`), 133);
  t.deepEqual(evaluate(`[1 2 3]#map(=>_ + 1)`), [2, 3, 4]);
  t.equal(evaluate(`let foo = |a b| => '({a}) {b#upper}'; :asdf#foo(:bar)`), '(asdf) BAR');
});

q.test(`special bracketed paths`, t => {
  t.equal(e(`'abcdefg'[0]`), 'a');
  t.equal(e(`'abcdefg'[0<]`), 'g');
  t.equal(e(`'abcdefg'[1<]`), 'f');
  t.equal(e(`'abcdefg'[1]`), 'b');
  t.equal(e(`{foo::bar}[:foo<]`), 'bar');
  t.equal(e(`[1 2 3 4 5 6 7][0]`), 1);
  t.equal(e(`[1 2 3 4 5 6 7][0<]`), 7);
  t.equal(e(`[1 2 3 4 5 6 7][1]`), 2);
  t.equal(e(`[1 2 3 4 5 6 7][1<]`), 6);
  t.equal(e(`'asdf'[-1]`), undefined);
  t.equal(e(`[1 2 3][-1]`), undefined);
  t.equal(e(`'abcdefg'[0 1]`), 'ab');
  t.equal(e(`'abcdefg'[0< 1<]`), 'gf');
  t.equal(e(`'abcdefg'[1< 0<]`), 'fg');
  t.equal(e(`'abcdefg'[1 0<]`), 'bcdefg');
  t.equal(e(`'abcdefg'[1< 0]`), 'fedcba');
  t.deepEqual(e(`[1 2 3 4 5 6 7][0 1]`), [1, 2]);
  t.deepEqual(e(`[1 2 3 4 5 6 7][0< 1<]`), [7, 6]);
  t.deepEqual(e(`{ a:1 b:2 c:3 }[[:a :c]]`), { a: 1, c: 3 });
  t.deepEqual(e(`{ b:2 c:3 }[[:a :c :d]]`), { c: 3 });
});

q.test('lexical scoping contexts', t => {
  t.equal(e(`let a = 10; if true { a }`), 10);
  t.equal(e(`let a = 10; if true then a`), 10);
  t.equal(e({ a: 10 }, `if true { a }`), 10);
  t.equal(e({ a: 10 }, `if true { let a = 20 }; a`), 10);
  t.equal(e({ a: 10 }, `if true then a`), 10);
  t.deepEqual(e(`with({ a: 10 } =>{ with({ a: 20 } =>{ [a ^a] }) })`), [20, 10]);
  t.deepEqual(e(`with({ a: 10 } =>{ with({ a: 20 } |c|=>{ [a ^a] }) })`), [20, 10]);
  t.deepEqual(e(`with({ a: 10 } |b|=>{ with({ a: 20 } =>{ [a ^a] }) })`), [20, 10]);
  t.deepEqual(e(`with({ a: 10 } |b|=>{ with({ a: 20 } |c|=>{ [a ^a] }) })`), [20, 10]);
  t.deepEqual(e(`with({ a: 10 } =>with({ a: 20 } =>[a ^a]))`), [20, 10]);
  t.deepEqual(e(`with({ a: 10 } =>with({ a: 20 } |c|=>[a ^a]))`), [20, 10]);
  t.deepEqual(e(`with({ a: 10 } |b|=>with({ a: 20 } =>[a ^a]))`), [20, 10]);
  t.deepEqual(e(`with({ a: 10 } |b|=>with({ a: 20 } |c|=>[a ^a]))`), [20, 10]);
  t.deepEqual(e({ a: 20 }, `each([{ a: 10 }] |v|=>{ [a ^a] })`), '10,20');
  t.deepEqual(e({ a: 20 }, `each([{ a: 10 }] =>{ [a ^a] })`), '10,20');
  t.deepEqual(e({ a: 20 }, `each([{ a: 10 }] |v|=>[a ^a])`), '10,20');
  t.deepEqual(e({ a: 20 }, `each([{ a: 10 }] =>[a ^a])`), '10,20');
  t.deepEqual(e(`each({ a: 10 } |v|=>{ each([{ a: 20 }] |w|=>[@index ^@key]) })`), '0,a');
  t.equal(e({ a: 10 }, `find([{ a:69 b:420 } { a:10 b:20 } { a:30 b:40 }] =>a == ^a).b`), '20');
});
