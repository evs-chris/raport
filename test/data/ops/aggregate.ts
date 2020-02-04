import { evaluate, filter, registerOperator, unregisterOperator, Operator, Root } from '../../../src/lib/index';
const q = QUnit;

q.module('data/ops/aggregate');

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
      return state;
    },
    final(_name, state) { return state.count; }
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
      return state;
    },
    final(_name, state) { return state.count; }
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
      return state;
    },
    final(_name, state) { return state.count; }
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
      return state;
    },
    final(_name, state) { return state.count; }
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
      return state;
    },
    final(_name, state) {
      t.equal(state.count, 3);
      return state.count;
    },
    check(_name, count) {
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

