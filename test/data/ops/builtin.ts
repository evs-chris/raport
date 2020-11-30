import { evaluate, registerOperator, unregisterOperator, Operator } from '../../../src/lib/index';

const q = QUnit;

q.module('data/ops/builtin');

q.test('%', t => {
  t.equal(evaluate('(% 5 2)'), 1);
  t.equal(evaluate('(% 10 2)'), 0);
  t.equal(evaluate('(% 17 10 5)'), 2);
});

q.test('*', t => {
  t.equal(evaluate('(* 2 4)'), 8);
  t.equal(evaluate('(* 2 4 2)'), 16);
});

q.test('+', t => {
  t.equal(evaluate('(+ 2 4)'), 6);
  t.equal(evaluate('(+ 2 4 2)'), 8);
  t.equal(evaluate('(+ :joe :y)'), 'joey');
});

q.test('-', t => {
  t.equal(evaluate('(- 10 8)'), 2);
  t.equal(evaluate('(- 10 8 10)'), -8);
});

q.test('/', t => {
  t.equal(evaluate('(/ 10 2)'), 5);
  t.equal(evaluate('(/ 10 2 2)'), 2.5);
});

q.test('<', t => {
  t.notOk(evaluate('(< 10 2)'));
  t.ok(evaluate('(< 2 10)'));
  t.notOk(evaluate('(< 2 2)'));
});

q.test('<=', t => {
  t.notOk(evaluate('(<= 10 2)'));
  t.ok(evaluate('(<= 2 10)'));
  t.ok(evaluate('(<= 2 2)'));
});

q.test('>', t => {
  t.ok(evaluate('(> 10 2)'));
  t.notOk(evaluate('(> 2 10)'));
  t.notOk(evaluate('(> 2 2)'));
});

q.test('>=', t => {
  t.ok(evaluate('(>= 10 2)'));
  t.notOk(evaluate('(>= 2 10)'));
  t.ok(evaluate('(>= 2 2)'));
});

q.test('and', t => {
  const op: Operator = { type: 'value', names: ['nope'], apply() { t.notOk('nope'); } };
  registerOperator(op);

  t.ok(evaluate('(and true)'));
  t.ok(evaluate('(and true 1)'));
  t.notOk(evaluate('(and false (nope))'));
  t.notOk(evaluate('(and false)'));

  unregisterOperator(op);
});

q.test('array', t => {
  t.deepEqual(evaluate('(array 1 2 3)'), [1, 2, 3]);
});

q.test('avg', t => {
  t.equal(evaluate('(avg (array 10 5 0))'), 5);
  t.equal(evaluate('(avg (array 3 5 7 9 11 13))'), 8);
});

q.test('call', t => {
  t.equal(evaluate('(call 10 :toString)'), '10');
  t.equal(evaluate('(call 10 :toString 16)'), 'a');
});

q.test('coalesce', t => {
  const op: Operator = { type: 'value', names: ['nope'], apply() { t.notOk('nope'); } };
  registerOperator(op);

  t.equal(evaluate('(coalesce false 10)'), false);
  t.equal(evaluate('(coalesce null 10)'), 10);
  t.equal(evaluate('(coalesce undefined 10)'), 10);
  t.equal(evaluate('(coalesce null undefined 10)'), 10);
  t.equal(evaluate('(coalesce null undefined 10 20)'), 10);

  unregisterOperator(op);
});

q.test('coalesce-truth', t => {
  const op: Operator = { type: 'value', names: ['nope'], apply() { t.notOk('nope'); } };
  registerOperator(op);

  t.equal(evaluate('(coalesce-truth false 10)'), 10);
  t.equal(evaluate('(coalesce-truth null false 10)'), 10);
  t.equal(evaluate('(coalesce-truth undefined false 10)'), 10);
  t.equal(evaluate('(coalesce-truth null undefined false 0 "" 10)'), 10);
  t.equal(evaluate('(coalesce-truth null undefined false 10 20)'), 10);

  unregisterOperator(op);
});

q.test('contains', t => {
  t.equal(evaluate('(contains :test :es)'), true);
  t.equal(evaluate('(contains (array 10 :test false) 10)'), true);
  t.equal(evaluate('(contains (array 10 :test false) :test)'), true);
  t.equal(evaluate('(contains (array 10 :test false) false)'), true);
});

q.test('count', t => {
  t.equal(evaluate('(count (array 1 2 3))'), 3);
});

q.test('date', t => {
  t.ok(/\d\d\d\d-\d\d-\d\d/.test(evaluate('(call (date) :toISOString)')));
  t.equal(evaluate('(call (date :2019-01-01) :toISOString)').substr(0, 10), '2019-01-01');
});

q.test('does-not-contain', t => {
  t.equal(evaluate('(does-not-contain :test :ee)'), true);
  t.equal(evaluate('(does-not-contain (array 10 :test false) 11)'), true);
  t.equal(evaluate('(does-not-contain (array 10 :test false) :tes)'), true);
  t.equal(evaluate('(does-not-contain (array 10 :test false) true)'), true);
});

q.test('filter', t => {
  // TODO: there's a lot more available here
  t.equal(evaluate('(filter (array 1 2 3) =>(is @value 2))')[0], 2);
  t.equal(evaluate('(filter (array 1 2 3) =>(> @value 4))').length, 0);
  t.deepEqual(evaluate('(filter (array (object :foo 1) (object :foo 2)) =>(is foo 2))'), [{ foo: 2 }]);
});

q.test('find', t => {
  t.equal(evaluate('(find (array 1 2 3) 2)'), 2);
  t.equal(evaluate('(find (array 1 2 3) 4)'), undefined);
  t.deepEqual(evaluate('(find (array (object :foo 1) (object :foo 2)) =>(is foo 2))'), { foo: 2 });
});

q.test('format', t => {
  // TODO: test all of the builtins
  t.equal(evaluate('(format (date :2019-04-20) :date :yyyy-MM-dd)'), new Date(+(new Date(`2019-04-20`)) - (new Date().getTimezoneOffset() * 60000)).toISOString().substr(0, 10));
});

q.test('get', t => {
  t.equal(evaluate('(get (object :foo 42) :foo)'), 42);
  t.equal(evaluate('(get (object :foo (object :bar 42)) "foo.bar")'), 42);
});

// TODO: group

q.test('if', t => {
  const op: Operator = { type: 'value', names: ['nope'], apply() { t.notOk('nope'); } };
  registerOperator(op);

  t.equal(evaluate('(if true :yep)'), 'yep');
  t.equal(evaluate('(if true :yep :else)'), 'yep');
  t.equal(evaluate('(if true :yep (nope))'), 'yep');
  t.equal(evaluate('(if false :yep)'), undefined);
  t.equal(evaluate('(if false (nope))'), undefined);
  t.equal(evaluate('(if false :yep :else)'), 'else');
  t.equal(evaluate('(if false :yep true :elseif)'), 'elseif');
  t.equal(evaluate('(if false :yep true :elseif :else)'), 'elseif');
  t.equal(evaluate('(if false :yep true :elseif (nope))'), 'elseif');
  t.equal(evaluate('(if false :yep false :elseif :else)'), 'else');

  unregisterOperator(op);
});

q.test(`ilike`, t => {
  t.equal(evaluate('(ilike :SomeThing :*et*)'), true);
  t.equal(evaluate('(ilike :SomeThing :*fr*)'), false);
  t.equal(evaluate('(ilike (array :Or :SomeThing :Other) :*et*)'), true);
  t.equal(evaluate('(ilike (array :Or :SomeThing :Other) :*fr*)'), false);
});

q.test('in', t => {
  t.ok(evaluate('(in :a (array 1 2 :a 3))'));
  t.notOk(evaluate('(in :a (array 1 2 3))'));
});

q.test(`is`, t => {
  t.ok(evaluate(`(is :joe 'joe')`));
  t.notOk(evaluate(`(is :joe 'Joe')`));
});

q.test(`is-not`, t => {
  t.notOk(evaluate(`(is-not :joe 'joe')`));
  t.ok(evaluate(`(is-not :joe 'Joe')`));
});

// TODO: join
// TODO: last

q.test(`like`, t => {
  t.equal(evaluate('(like :SomeThing :*et*)'), false);
  t.equal(evaluate('(like :SomeThing :*eT*)'), true);
  t.equal(evaluate('(like :SomeThing :*fr*)'), false);
  t.equal(evaluate('(like (array :Or :SomeThing :Other) :*et*)'), false);
  t.equal(evaluate('(like (array :Or :SomeThing :Other) :*eT*)'), true);
  t.equal(evaluate('(like (array :Or :SomeThing :Other) :*fr*)'), false);
});

// TODO: lower
// TODO: map
// TODO: max
// TODO: min
//
q.test(`not-ilike`, t => {
  t.equal(evaluate('(not-ilike :SomeThing :*et*)'), false);
  t.equal(evaluate('(not-ilike :SomeThing :*fr*)'), true);
  t.equal(evaluate('(not-ilike (array :Or :SomeThing :Other) :*et*)'), false);
  t.equal(evaluate('(not-ilike (array :Or :SomeThing :Other) :*fr*)'), true);
});

q.test('not-in', t => {
  t.ok(evaluate('(not-in :b (array 1 2 3))'));
  t.notOk(evaluate('(not-in :b (array 1 2 :b 3))'));
});

q.test(`not-like`, t => {
  t.equal(evaluate('(not-like :SomeThing :*et*)'), true);
  t.equal(evaluate('(not-like :SomeThing :*eT*)'), false);
  t.equal(evaluate('(not-like :SomeThing :*fr*)'), true);
  t.equal(evaluate('(not-like (array :Or :SomeThing :Other) :*et*)'), true);
  t.equal(evaluate('(not-like (array :Or :SomeThing :Other) :*eT*)'), false);
  t.equal(evaluate('(not-like (array :Or :SomeThing :Other) :*fr*)'), true);
});

// TODO: nth
// TODO: object

q.test('or', t => {
  const op: Operator = { type: 'value', names: ['nope'], apply() { t.notOk('nope'); } };
  registerOperator(op);

  t.ok(evaluate('(or true)'));
  t.notOk(evaluate('(or false)'));
  t.ok(evaluate('(or true false)'));
  t.ok(evaluate('(or false true)'));
  t.ok(evaluate('(or true (nope))'));

  unregisterOperator(op);
});

// TODO: padl
// TODO: padr
// TODO: replace-all
// TODO: replace
// TODO: reverse
// TODO: slice
// TODO: sort
// TODO: source
// TODO: substr
// TODO: sum
// TODO: trim
// TODO: triml
// TODO: trimr
// TODO: unique

q.test('unique-by', t => {
  const vals = [{ a: 10, b: 'a' }, { a: 12, b: 'b' }, { a: 10, b: 'c' }];
  t.deepEqual(evaluate({ vals }, '(map (unique vals =>a) => b)'), ['a', 'b']);
});
