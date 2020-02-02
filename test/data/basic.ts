import { Root, evaluate, extend } from '../../src/lib/index';
import { isContext } from '../../src/lib/data/index';

const q = QUnit;

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
  t.deepEqual(evaluate(data, '(map +foo =>(+ @value 2))'), [3, 4, 5]);
});
