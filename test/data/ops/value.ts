import { evaluate, filter, Root, Operator, registerOperator, unregisterOperator } from '../../../src/lib/index';
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

q.test('checked op', t => {
  t.expect(17);

  let n = 0;
  const args = [1, 'foo', false];
  const op: Operator = { type: 'checked', names: ['tmp'], apply(_name, args) {
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
  } };

  registerOperator(op);

  t.equal(evaluate(`(tmp (+ 0 1) (substr 'foofle' 0 3) false)`), 'sure');

  unregisterOperator(op);
});

q.test('checked op short circuit', t => {
  t.expect(5);

  let n = 0;
  const args = [1, 'foo', false];
  const op: Operator = { type: 'checked', names: ['tmp'], apply() {
    t.ok(false, 'should have short circuited');
  }, checkArg(name, num, last, value) {
    t.equal(name, 'tmp');
    t.equal(n++, num);
    t.equal(last, 2);
    t.equal(value, args[num]);

    return { result: 'done' };
  } };

  registerOperator(op);

  t.equal(evaluate(`(tmp (+ 0 1) (substr 'foofle' 0 3) false)`), 'done');

  unregisterOperator(op);
});

q.test('checked op skip', t => {
  t.expect(12);

  let n = 0;
  const args = [1, 'foo', false];
  const op: Operator = { type: 'checked', names: ['tmp'], apply(_name, args) {
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
  } };
  const nop: Operator = { type: 'value', names: ['foo-nope'], apply() { t.ok(false, 'should have skipped second arg'); } };

  registerOperator(op, nop);

  t.equal(evaluate(`(tmp (+ 0 1) (foo-nope 'foofle' 0 3) false)`), 'sure');

  unregisterOperator(op, nop);
});

q.test('aggregate op', t => {
  t.expect(11);
  const args = [1, 2, 3];
  const op: Operator = { type: 'aggregate', names: ['tmp'],
    init(name, args) {
      t.equal(name, 'tmp');
      t.equal(args.length, 2);
      t.equal(args[0], 'foo');
      t.equal(args[1], true);
      return { count: 0 };
    },
    apply(name, state, val) {
      t.equal(name, 'tmp');
      t.equal(args[state.count], val);
      state.count++;
    },
    final(state) { return state.count; }
  };

  registerOperator(op);

  t.equal(evaluate('(tmp +(array 1 2 3) :foo true)'), 3);

  unregisterOperator(op);
});

q.test('aggregate op application', t => {
  t.expect(13);
  const args = [{ v: 1 }, { v: 2 }, { v: 3 }];
  const op: Operator = { type: 'aggregate', names: ['tmp'],
    init(_name, args) {
      t.equal(args.length, 2);
      t.equal(args[0], 'foo');
      t.equal(args[1], true);
      return { count: 0 };
    },
    apply(name, state, val, app) {
      t.equal(name, 'tmp');
      t.deepEqual(args[state.count], val);
      t.equal(state.count + 1, app);
      state.count++;
    },
    final(state) { return state.count; }
  };

  registerOperator(op);

  t.equal(evaluate({ list: args }, '(tmp +list =>v :foo true)'), 3);

  unregisterOperator(op);
});

q.test('aggregate op implicit source', t => {
  t.expect(10);
  const args = [{ v: 1 }, { v: 2 }, { v: 3 }];
  const op: Operator = { type: 'aggregate', names: ['tmp'],
    init() {
      return { count: 0 };
    },
    apply(name, state, val, app) {
      t.equal(name, 'tmp');
      t.deepEqual(args[state.count], val);
      t.equal(state.count + 1, app);
      state.count++;
    },
    final(state) { return state.count; }
  };

  registerOperator(op);

  t.equal(evaluate(new Root({}, { special: { source: args } }), '(tmp =>v :foo true)'), 3);

  unregisterOperator(op);
});

q.test('aggregate op local args', t => {
  t.expect(19);
  const args = [{ v: 1, e: 'a' }, { v: 2, e: 'b' }, { v: 3, e: 'c' }];
  const op: Operator = { type: 'aggregate', names: ['tmp'],
    init(_name, args) {
      t.equal(args.length, 2);
      t.equal(args[0], 'foo');
      t.equal(args[1], true);
      return { count: 0 };
    },
    apply(name, state, _base, val, locals) {
      t.equal(name, 'tmp');
      t.deepEqual(args[state.count], val);
      t.equal(locals.length, 2);
      t.equal(locals[0], 1);
      t.equal(locals[1], args[state.count].e);
      state.count++;
    },
    final(state) { return state.count; }
  };

  registerOperator(op);

  t.equal(evaluate({ list: args }, '(tmp +list &(1 e) :foo true)'), 3);

  unregisterOperator(op);
});

q.test('aggregate op checked cache', t => {
  t.expect(4);
  const args = [1, 2, 3];
  let calls = 0;
  let checks = 0;
  const op: Operator = { type: 'aggregate', names: ['tmp'],
    init() {
      calls++;
      return { count: 0 };
    },
    apply(_name, state) {
      state.count++;
    },
    final(state) {
      t.equal(state.count, 3);
      return state.count;
    },
    check(count) {
      checks++;
      return count;
    }
  };

  const gt: Operator = { type: 'value', names: ['gt'], 
    apply(_name, args) {
      return args[0] > args[1];
    }
  };

  registerOperator(op, gt);

  const list = filter({ value: args }, '(gt @value (tmp))');
  t.equal(calls, 1);
  t.equal(checks, 3);
  t.equal(list.value.length, 0);

  unregisterOperator(op, gt);
});
