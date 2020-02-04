import { evaluate, Operator, registerOperator, unregisterOperator } from '../../../src/lib/index';
const q = QUnit;

q.module('data/ops/value');

q.test('simple op', t => {
  t.expect(2);
  const op: Operator = { type: 'value', names: ['tmp'], apply(name) {
    t.equal(name, 'tmp');
    return 'yep';
  } };

  registerOperator(op);

  t.equal(evaluate('(tmp)'), 'yep');

  unregisterOperator(op);
});

q.test('op with args', t => {
  t.expect(6);

  let len = 1;
  const op: Operator = { type: 'value', names: ['tmp'], apply(name, values) {
    t.equal(values.length, len);
    t.equal(name, 'tmp');
    return values[0];
  } };

  registerOperator(op);

  t.equal(evaluate('(tmp 10)'), 10);
  len = 2;
  t.equal(evaluate('(tmp true nope)'), true);

  unregisterOperator(op);
});

q.test('multi-named ops', t => {
  t.expect(2);
  let name = 'foo'
  const op: Operator = { type: 'value', names: ['foo', 'bar'], apply(n) {
    t.equal(name, n);
  } };

  registerOperator(op);

  evaluate('(foo)');
  name = 'bar';
  evaluate('(bar)');

  unregisterOperator(op);
});

q.test('ops with op args', t => {
  t.expect(1);
  const op: Operator = { type: 'value', names: ['tmp'], apply(_name, args) {
    t.equal(args[0], 10);
  } };

  registerOperator(op);

  evaluate('(tmp (+ 5 2 3))');

  unregisterOperator(op);
});
