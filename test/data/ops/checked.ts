import { evaluate, registerOperator, unregisterOperator, Operator } from '../../../src/lib/index';
const q = QUnit;

q.module('data/ops/checked');

q.test('checked op', t => {
  t.expect(17);

  let n = 0;
  const args = [1, 'foo', false];
  const op: Operator = {
    type: 'checked', names: ['tmp'], apply(_name, args) {
      t.equal(args.length, 3);
      t.equal(args[0], 1);
      t.equal(args[1], 'foo');
      t.equal(args[2], false);
      return 'sure';
    }, checkArg(name, num, last, value) {
      t.equal(name, 'tmp');
      t.equal(n++, num);
      t.equal(last, 2);
      t.equal(value, args[num]);

      return 'continue';
    }
  };

  registerOperator(op);

  t.equal(evaluate(`(tmp (+ 0 1) (substr 'foofle' 0 3) false)`), 'sure');

  unregisterOperator(op);
});

q.test('checked op short circuit', t => {
  t.expect(5);

  let n = 0;
  const args = [1, 'foo', false];
  const op: Operator = {
    type: 'checked', names: ['tmp'], apply() {
      t.ok(false, 'should have short circuited');
    }, checkArg(name, num, last, value) {
      t.equal(name, 'tmp');
      t.equal(n++, num);
      t.equal(last, 2);
      t.equal(value, args[num]);

      return { result: 'done' };
    }
  };

  registerOperator(op);

  t.equal(evaluate(`(tmp (+ 0 1) (substr 'foofle' 0 3) false)`), 'done');

  unregisterOperator(op);
});

q.test('checked op skip', t => {
  t.expect(12);

  let n = 0;
  const args = [1, 'foo', false];
  const op: Operator = {
    type: 'checked', names: ['tmp'], apply(_name, args) {
      t.equal(args.length, 2);
      t.equal(args[0], 1);
      t.equal(args[1], false);
      return 'sure';
    }, checkArg(name, num, last, value) {
      t.equal(name, 'tmp');
      t.equal(n++, num);
      t.equal(last, 2);
      t.equal(value, args[num]);

      if (num === 0) n++;

      return num === 0 ? { skip: 1, value } : 'continue';
    }
  };
  const nop: Operator = { type: 'value', names: ['foo-nope'], apply() { t.ok(false, 'should have skipped second arg'); } };

  registerOperator(op, nop);

  t.equal(evaluate(`(tmp (+ 0 1) (foo-nope 'foofle' 0 3) false)`), 'sure');

  unregisterOperator(op, nop);
});
