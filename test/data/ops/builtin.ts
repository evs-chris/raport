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

q.test('clamp', t => {
  t.equal(evaluate('(clamp 10 20 30)'), 20);
  t.equal(evaluate('(clamp 10 0 30)'), 10);
  t.equal(evaluate('(clamp 10 50 30)'), 30);
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
  t.equal(evaluate('(contains (array 10 :test false) (array 10 false))'), true);
  t.equal(evaluate('(contains (array 10 :test false) (array 10 true))'), false);
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
  t.equal(evaluate('(does-not-contain (array 10 :test false) (array true 20))'), true);
  t.equal(evaluate('(does-not-contain (array 10 :test false) (array true 10))'), true);
  t.equal(evaluate('(does-not-contain (array 10 :test false) (array false 10))'), false);
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
  t.equal(evaluate('(format #2019-4-20# :date :yyyy-MM-dd)'), `2019-04-20`);
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
  t.equal(evaluate(':a ilike [:B :A]'), true);
  t.equal(evaluate(':a ilike [:B :C]'), false);
  t.equal(evaluate('[:a :b] ilike [:B :C]'), true);
  t.equal(evaluate('[:a :b] ilike [:D :C]'), false);
});

q.test('in', t => {
  t.ok(evaluate('(in :a (array 1 2 :a 3))'));
  t.notOk(evaluate('(in :a (array 1 2 3))'));
  t.ok(evaluate('[1 2 3] in [3 2 1 0 :a]'));
  t.notOk(evaluate('[1 2 3] in [1 2 :a :b]'));
});

q.test('intersect', t => {
  const arr = evaluate('intersect([1 1 2 3 4 5 5] [1 2 2 3 6 6])');
  t.equal(arr.length, 3);
  t.equal(arr[0], 1);
  t.equal(arr[1], 2);
  t.equal(arr[2], 3);
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
  t.equal(evaluate(':A like [:B :A]'), true);
  t.equal(evaluate(':A like [:B :C]'), false);
  t.equal(evaluate('[:A :B] like [:B :C]'), true);
  t.equal(evaluate('[:A :B] like [:D :C]'), false);
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
  t.equal(evaluate(':a not-ilike [:B :A]'), false);
  t.equal(evaluate(':a not-ilike [:B :C]'), true);
  t.equal(evaluate('[:a :b] not-ilike [:B :C]'), false);
  t.equal(evaluate('[:a :b] not-ilike [:D :C]'), true);
});

q.test('not-in', t => {
  t.ok(evaluate('(not-in :b (array 1 2 3))'));
  t.notOk(evaluate('(not-in :b (array 1 2 :b 3))'));
  t.equal(evaluate('[1 :a] not-in [:b :c]'), true);
  t.equal(evaluate('[1 2 3] not-in [3 2 1 0]'), false);
});

q.test(`not-like`, t => {
  t.equal(evaluate('(not-like :SomeThing :*et*)'), true);
  t.equal(evaluate('(not-like :SomeThing :*eT*)'), false);
  t.equal(evaluate('(not-like :SomeThing :*fr*)'), true);
  t.equal(evaluate('(not-like (array :Or :SomeThing :Other) :*et*)'), true);
  t.equal(evaluate('(not-like (array :Or :SomeThing :Other) :*eT*)'), false);
  t.equal(evaluate('(not-like (array :Or :SomeThing :Other) :*fr*)'), true);
  t.equal(evaluate(':A not-like [:B :A]'), false);
  t.equal(evaluate(':A not-like [:B :C]'), true);
  t.equal(evaluate('[:A :B] not-like [:B :C]'), false);
  t.equal(evaluate('[:A :B] not-like [:D :C]'), true);
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

q.test('time-span', t => {
  t.equal(evaluate('time-span(#2021-10-31# #2021-11-10# unit::d)'), 10, 'fall dst is accurate');
  t.equal(evaluate('time-span(#2021-10-30# #2021-11-10# unit::d)'), 11, 'fall dst is accurate');
  t.equal(evaluate('time-span(#2022-03-10# #2022-03-17# unit::d)'), 7, 'spring dst is accurate');
  t.deepEqual(evaluate(`time-span(#1999-1-15# #2011-12-27# unit:[:y :M])`), [12, 11]);
  t.deepEqual(evaluate(`time-span(#1999-1-15# #2011-12-14# unit:[:y :M])`), [12, 10]);
  t.deepEqual(evaluate(`time-span(#1999-1-30# #2011-12-27# unit:[:y :M])`), [12, 10]);
  t.deepEqual(evaluate(`time-span(#1999-1-31# #1999-2-28# unit:[:M :d])`), [1, 0]);
  t.deepEqual(evaluate(`time-span(#1999-2-28# #1999-3-31# unit:[:M :d])`), [1, 0]);
  t.equal(evaluate('time-span(#2021-10-01# #2021-12-31# unit::d)'), 91, 'span in single units is accurate');
});

// TODO: trim
// TODO: triml
// TODO: trimr
// TODO: unique

q.test('unique-by', t => {
  const vals = [{ a: 10, b: 'a' }, { a: 12, b: 'b' }, { a: 10, b: 'c' }];
  t.deepEqual(evaluate({ vals }, '(map (unique vals =>a) => b)'), ['a', 'b']);
});
