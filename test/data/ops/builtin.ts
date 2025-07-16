import { evaluate, registerOperator, unregisterOperator, Operator, Root, parse, extend } from '../../../src/lib/index';

const q = QUnit;

function jsoncmp(a: any, b: any): [string, string] {
  return [JSON.stringify(a), JSON.stringify(b)];
}

const e = evaluate;

q.module('data/ops/builtin');

q.test('%', t => {
  t.equal(e('(% 5 2)'), 1);
  t.equal(e('(% 10 2)'), 0);
  t.equal(e('10 % 2'), 0);
  t.equal(e('(% 17 10 5)'), 2);
});

q.test('*', t => {
  t.equal(e('(* 2 4)'), 8);
  t.equal(e('2 * 4'), 8);
  t.equal(e('(* 2 4 2)'), 16);
  t.deepEqual(e('[1 2] * 3'), [1, 2, 1, 2, 1, 2]);
});

q.test('**', t => {
  t.equal(e('2 ** 2'), 4);
  t.equal(e('2 ** 3 ** 2'), 512);
});

q.test('+', t => {
  t.equal(e('(+ 2 4)'), 6);
  t.equal(e('2 + 4'), 6);
  t.equal(e('(+ 2 4 2)'), 8);
  t.equal(e('(+ :joe :y)'), 'joey');
  t.deepEqual(e('{ a::b c:1 } + { c::d }'), { a: 'b', c: 'd' });
});

q.test('-', t => {
  t.equal(e('(- 10 8)'), 2);
  t.equal(e('10 - 8'), 2);
  t.equal(e('(- 10 8 10)'), -8);
  t.equal(e('let a = 10; -a'), -10);
});

q.test('/', t => {
  t.equal(e('(/ 10 2)'), 5);
  t.equal(e('10 / 2'), 5);
  t.equal(e('(/ 10 2 2)'), 2.5);
});

q.test('/%', t => {
  t.equal(e('(/% 10 3)'), 3);
  t.equal(e('10 /% 3'), 3);
  t.equal(e('(/% 10 2 2)'), 2);
});

q.test('<', t => {
  t.notOk(e('(< 10 2)'));
  t.ok(e('(< 2 10)'));
  t.notOk(e('(< 2 2)'));
});

q.test('<=', t => {
  t.notOk(e('(<= 10 2)'));
  t.ok(e('(<= 2 10)'));
  t.ok(e('(<= 2 2)'));
});

q.test('>', t => {
  t.ok(e('(> 10 2)'));
  t.notOk(e('(> 2 10)'));
  t.notOk(e('(> 2 2)'));
});

q.test('>=', t => {
  t.ok(e('(>= 10 2)'));
  t.notOk(e('(>= 2 10)'));
  t.ok(e('(>= 2 2)'));
});

q.test('==', t => {
  t.ok(e('10 == 5 * 2'));
  t.ok(e(`#2022-12-22# == date('2022-12-25') - #3d#`));
  t.notOk(e('10 == 3'));
});

q.test('is', t => {
  t.ok(e('{ a:10 } is @[{a:number b?:string}]'));
  t.notOk(e('{ b::10 } is @[{a:number b?:string}]'));
  t.ok(e('[1 2 3] is @[any[]] and [:a :b 69] is @[Array<any>]'));
  t.notOk(e('[[1] [:a]] is @[Array<number[]>]'));
  t.ok(e('[[1] [:a]] is @[Array<Array<string|number>>]'));
});

q.test('!=', t => {
  t.notOk(e('10 != 5 * 2'));
  t.notOk(e(`#2022-12-22# != date('2022-12-25') - #3d#`));
  t.ok(e('10 != 3'));
});

q.test('is-not', t => {
  t.notOk(e('{ a:10 } is-not @[{a:number b?:string}]'));
  t.ok(e('{ b::10 } is-not @[{a:number b?:string}]'));
});

q.test('===', t => {
  t.ok(e('{ a:10 } === { a:5 + 5 }'));
  t.ok(e('null === null'));
  t.ok(e('null === undefined'));
  t.notOk(e('null === false'));
  t.notOk(e('{ a:10 } === null'));
});

q.test('!==', t => {
  t.notOk(e('{ a:10 } !== { a:5 + 5 }'));
  t.ok(e('{ a:10 } !== { b:20 }'));
  t.ok(e('{ a:10 } !== null'));
});

q.test('??', t => {
  t.equal(e('false ?? true'), false);
  t.equal(e('a ?? false'), false);
  t.equal(e('null ?? 1'), 1);
  t.equal(e(`'' ?? 1`), '');
});

q.test('abs', t => {
  t.equal(e('abs(10 - 20)'), 10);
  t.equal(e('(abs -50)'), 50);
});

q.test('and', t => {
  const op: Operator = { type: 'value', names: ['nope'], apply() { t.notOk('nope'); } };
  registerOperator(op);

  t.ok(e('(and true)'));
  t.ok(e('(and true 1)'));
  t.notOk(e('(and false (nope))'));
  t.notOk(e('(and false)'));

  unregisterOperator(op);
});

q.test('array', t => {
  t.deepEqual(e('(array 1 2 3)'), [1, 2, 3]);
  t.deepEqual(e('array(1)'), [1]);
  t.deepEqual(e('array(`-2-2 !0` range:1)'), [-2, -1, 1, 2]);
});

q.test('avg', t => {
  t.equal(e('(avg (array 10 5 0))'), 5);
  t.equal(e('(avg (array 3 5 7 9 11 13))'), 8);
});

q.test('block', t => {
  const op = parse('let i = 10; i + i * i');
  t.ok(typeof op === 'object' && 'op' in op && op.op === 'block');
  t.equal(e(op), 110);
  t.equal(e(`let i = 10; { let j = 20; j + i }`), 30);
  t.equal(e(`{ let j = 20; j + 10 }; j + 'a'`), 'a');
  t.equal(e(`map([{ foo::bar }] =>{ { let j = 20; j + 10 }; j + 'a' })[0]`), 'a');
  t.equal(e(`let a = map([{ foo::bar }] =>{ { let j = 20; j + 10 }; let b = :no; j + 'a' })[0]; a + b`), 'a');

  const r = extend(new Root(), {});
  t.equal(e(r, 'block(let i = 10, 10 + i)'), 20);
  t.equal(r.locals, undefined);
  t.equal(e(r, 'let i = 10; 10 + i'), 20);
  t.equal(r?.locals?.i, 10);
});

q.test('call', t => {
  t.equal(e('(call 10 :toString)'), '10');
  t.equal(e('(call 10 :toString 16)'), 'a');
});

// q.todo('case', t => { t.expect(0); });
// q.todo('ceil', t => { t.expect(0); });

q.test('clamp', t => {
  t.equal(e('(clamp 10 20 30)'), 20);
  t.equal(e('(clamp 10 0 30)'), 10);
  t.equal(e('(clamp 10 50 30)'), 30);
});

q.test('coalesce', t => {
  const op: Operator = { type: 'value', names: ['nope'], apply() { t.notOk('nope'); } };
  registerOperator(op);

  t.equal(e('(coalesce false 10)'), false);
  t.equal(e('(coalesce null 10)'), 10);
  t.equal(e('(coalesce undefined 10)'), 10);
  t.equal(e('(coalesce null undefined 10)'), 10);
  t.equal(e('(coalesce null undefined 10 20)'), 10);

  unregisterOperator(op);
});

q.test('coalesce-truth', t => {
  const op: Operator = { type: 'value', names: ['nope'], apply() { t.notOk('nope'); } };
  registerOperator(op);

  t.equal(e('(coalesce-truth false 10)'), 10);
  t.equal(e('(coalesce-truth null false 10)'), 10);
  t.equal(e('(coalesce-truth undefined false 10)'), 10);
  t.equal(e('(coalesce-truth null undefined false 0 "" 10)'), 10);
  t.equal(e('(coalesce-truth null undefined false 10 20)'), 10);

  unregisterOperator(op);
});

q.test('contains', t => {
  t.equal(e('(contains :test :es)'), true);
  t.equal(e('(contains (array 10 :test false) 10)'), true);
  t.equal(e('(contains (array 10 :test false) :test)'), true);
  t.equal(e('(contains (array 10 :test false) false)'), true);
  t.equal(e('(contains (array 10 :test false) (array 10 false))'), true);
  t.equal(e('(contains (array 10 :test false) (array 10 true))'), false);
  t.ok(e(`{ a::b c::d } contains =>_ == :d`));
  t.notOk(e(`{ a::b c::e } contains =>_ == :d`));
  t.ok(e(`{ a::b c::d } contains =>@key == :c`));
  t.notOk(e(`{ a::b e::d } contains =>@key == :c`));
  t.ok(e(`{ a::b c::d } contains =>@index == 1`));
  t.notOk(e(`{ a::b e::d } contains =>@index == 2`));
  t.ok(e(`[:a :b :c :d] contains =>_ == :d`));
  t.notOk(e(`[:a :b :c :e] contains =>_ == :d`));
  t.ok(e(`[:a :b :c :d] contains =>@index == 2`));
  t.notOk(e(`[:a :b :c :e] contains =>@index == 9`));
});

q.test('count', t => {
  t.equal(e('(count (array 1 2 3))'), 3);
  t.deepEqual(e(`count([{type::foo} {type::bar} {type::foo} {type::baz}] partition:=>type)`), { foo: 2, bar: 1, baz: 1 });
  t.deepEqual(e(`count([{type::foo} {type::bar} {type::foo} {type::baz} {type::loooooooong}] sub:{ small:=>type.length < 4 large:=>type.length > 4 })`), { small: 4, large: 1 });
  t.deepEqual(e(`count([{type::foo} {type::bar} {type::foo} {type::baz} {type::loooooooong}] sub:{ key:=>type large:=>type.length > 4 })`), { foo: 2, bar: 1, baz: 1, large: 1, loooooooong: 1 });
  t.deepEqual(e(`count([{type::foo size:10} {type::foo size:2} {type::bar size:5} {type::baz size:10}] sub:{ key:=>[type if size > 4 then :large else :small] })`), { foo: 2, bar: 1, baz: 1, large: 3, small: 1})
});

q.test('date', t => {
  t.ok(/\d\d\d\d-\d\d-\d\d/.test(e('(call (date) :toISOString)')));
  t.equal(e('(call (date :2019-01-01) :toISOString)').substr(0, 10), '2019-01-01');
});

// q.todo('detect-delimiters', t => { t.expect(0); });

q.test('deep-is', t => {
  t.ok(e(`deep-is('2022-12-22' date('2022-12-22') :sql)`));
  t.notOk(e(`deep-is('2022-12-22' date('2022-12-22T00:00:00.001') :sql)`));
  t.ok(e(`deep-is(10 '10.00' :sql)`));
  t.ok(e(`deep-is('10' '10.00' equal::sql)`));
  t.notOk(e(`deep-is('10.01' '10.00' :sql)`));
  t.notOk(e(`deep-is(10.01 '10.00' equal::sql)`));
  t.ok(e(`deep-is(:on true equal::sql)`));
  t.notOk(e(`deep-is(:anything true equal::sql)`));
  t.notOk(e(`deep-is(:off true equal::sql)`));
  t.ok(e(`deep-is(:ON true equal::sql)`));
  t.ok(e(`deep-is(:Yes true equal::sql)`));
  t.ok(e(`deep-is(:True true equal::sql)`));
  t.ok(e(`deep-is(:true true equal::sql)`));
  t.ok(e(`deep-is(:off false equal::sql)`));
  t.notOk(e(`deep-is(:anything false equal::sql)`));
  t.notOk(e(`deep-is(:on false equal::sql)`));
  t.ok(e(`deep-is(:OFF false equal::sql)`));
  t.ok(e(`deep-is(:No false equal::sql)`));
  t.ok(e(`deep-is(:False false equal::sql)`));
  t.ok(e(`deep-is(:false false equal::sql)`));
});

q.test('diff', t => {
  t.equal(JSON.stringify(e('diff({ a:1 b::2 c:3 } { a:2 b:2 })')), JSON.stringify({ a: [1, 2], c: [3, null] }));
  t.equal(JSON.stringify(e('diff({ a:1 b::2 c:3 } { a:2 b:2 } equal::strict)')), JSON.stringify({ a: [1, 2], b: ['2', 2], c: [3, null] }));
  t.equal(JSON.stringify(e('diff({ a:1 b:2 c:3 } { a:2 b:2 } keys::common)')), JSON.stringify({ a: [1, 2] }));
});

q.test('does-not-contain', t => {
  t.equal(e('(does-not-contain :test :ee)'), true);
  t.equal(e('(does-not-contain (array 10 :test false) 11)'), true);
  t.equal(e('(does-not-contain (array 10 :test false) :tes)'), true);
  t.equal(e('(does-not-contain (array 10 :test false) true)'), true);
  t.equal(e('(does-not-contain (array 10 :test false) (array true 20))'), true);
  t.equal(e('(does-not-contain (array 10 :test false) (array true 10))'), true);
  t.equal(e('(does-not-contain (array 10 :test false) (array false 10))'), false);
  t.notOk(e(`{ a::b c::d } does-not-contain =>_ == :d`));
  t.ok(e(`{ a::b c::e } does-not-contain =>_ == :d`));
  t.notOk(e(`{ a::b c::d } does-not-contain =>@key == :c`));
  t.ok(e(`{ a::b e::d } does-not-contain =>@key == :c`));
  t.notOk(e(`{ a::b c::d } does-not-contain =>@index == 1`));
  t.ok(e(`{ a::b e::d } does-not-contain =>@index == 2`));
  t.notOk(e(`[:a :b :c :d] does-not-contain =>_ == :d`));
  t.ok(e(`[:a :b :c :e] does-not-contain =>_ == :d`));
  t.notOk(e(`[:a :b :c :d] does-not-contain =>@index == 2`));
  t.ok(e(`[:a :b :c :e] does-not-contain =>@index == 9`));
});

// q.todo('each', t => { t.expect(0); });
// q.todo('eval', t => { t.expect(0); });

q.test('filter', t => {
  // TODO: there's a lot more available here
  t.equal(e('(filter (array 1 2 3) =>(is @value 2))')[0], 2);
  t.equal(e('(filter (array 1 2 3) =>(> @value 4))').length, 0);
  t.deepEqual(e('(filter (array (object :foo 1) (object :foo 2)) =>(is foo 2))'), [{ foo: 2 }]);
  t.deepEqual(e(`filter({ a::b c::d } =>_ == :d)`), { c: 'd' });
  t.deepEqual(e(`filter({ a::b c::d } =>@key == :c)`), { c: 'd' });
  t.deepEqual(e(`filter({ a::b c::d } =>@index == 0)`), { a: 'b' });
  t.deepEqual(e(`filter([3 2 1] =>true '_')`), [1, 2, 3]);
  t.deepEqual(e(`filter([3 2 1] '' '_')`), [1, 2, 3]);
  t.deepEqual(e(`set ~foo = [3 2 1]; filter(~foo =>true '_'); ~foo`), [3, 2, 1]);
  t.deepEqual(e(`set ~foo = [3 2 1]; filter(~foo '' '_'); ~foo`), [3, 2, 1]);
});

q.test('find', t => {
  t.equal(e('(find (array 1 2 3) 2)'), 2);
  t.equal(e('(find (array 1 2 3) 4)'), undefined);
  t.deepEqual(e('(find (array (object :foo 1) (object :foo 2)) =>(is foo 2))'), { foo: 2 });
  t.equal(e(`find({ a::b c::d } =>_ == :d)`), 'd');
  t.equal(e(`find({ a::b c::d } =>@key == :c)`), 'd');
  t.equal(e(`find({ a::b c::d } =>@index == 0)`), 'b');
});

// q.todo('first', t => { t.expect(0); });

q.test('flatten', t => {
  t.deepEqual(e('flatten([:a :b [:c :d :e] :f :g])'), 'abcdefg'.split(''));
  t.deepEqual(e('flatten([:a :b [:c [:d] :e] :f :g] 2)'), 'abcdefg'.split(''));
});

// q.todo('floor', t => { t.expect(0); });

q.test('format', t => {
  // TODO: test all of the builtins
  t.equal(e('(format #2019-4-20# :date :yyyy-MM-dd)'), `2019-04-20`);
  t.equal(e(`@date#date,'${'yMdEHmsSkaz'.split('').map(c => '\\\\' + c).join('')}'`), 'yMdEHmsSkaz');
});

q.test('generate', t => {
  t.deepEqual(e(`generate(=>if not num or num < 0 then {state:{num:2} value:1} else if num < 4 then {state:{num:num+1} value:num})`), [1, 2, 3]);
  t.deepEqual(e(`generate(=>if not num or num < 0 then {state:{num:2} value:1} else if num < 4 then {state:{num:num+1} value:num} num:2)`), [2, 3]);
  t.deepEqual(e(`generate('1-10 !5')`), [1, 2, 3, 4, 6, 7, 8, 9, 10]);
  t.deepEqual(e(`generate('1-10 !<5')`), [5, 6, 7, 8, 9, 10]);
});

q.test('get', t => {
  t.equal(e('(get (object :foo 42) :foo)'), 42);
  t.equal(e('(get (object :foo (object :bar 42)) "foo.bar")'), 42);
});

// q.todo('group', t => { t.expect(0); });

q.test('if', t => {
  const op: Operator = { type: 'value', names: ['nope'], apply() { t.notOk('nope'); } };
  registerOperator(op);

  t.equal(e('(if true :yep)'), 'yep');
  t.equal(e('(if true :yep :else)'), 'yep');
  t.equal(e('(if true :yep (nope))'), 'yep');
  t.equal(e('(if false :yep)'), undefined);
  t.equal(e('(if false (nope))'), undefined);
  t.equal(e('(if false :yep :else)'), 'else');
  t.equal(e('(if false :yep true :elseif)'), 'elseif');
  t.equal(e('(if false :yep true :elseif :else)'), 'elseif');
  t.equal(e('(if false :yep true :elseif (nope))'), 'elseif');
  t.equal(e('(if false :yep false :elseif :else)'), 'else');

  t.equal(e({ base: [{ foo: 'bar' }] }, `{ let sam = :sam; map(base, =>{ let sam = :mas; foo + ^sam + sam })[0] }`), 'barsammas');

  t.equal(e('if true then :yep'), 'yep');
  t.equal(e('if true then :yep 10'), 10);
  t.equal(e('if true then :yep end'), 'yep');
  t.equal(e('if true then :yep end 10'), 10);
  t.equal(e('if true then :yep fi'), 'yep');
  t.equal(e('if true then :yep fi 10'), 10);
  t.equal(e('if true { :yep }'), 'yep');
  t.equal(e('if true { :yep } 10'), 10);
  t.equal(e('if true { :yep } end'), 'yep');
  t.equal(e('if true { :yep } end 10'), 10);
  t.equal(e('if true { :yep } fi'), 'yep');
  t.equal(e('if true { :yep } fi 10'), 10);
  t.equal(e('if true then :yep else :nope'), 'yep');
  t.equal(e('if true then :yep else :nope 10'), 10);
  t.equal(e('if true { :yep } else { :nope }'), 'yep');
  t.equal(e('if true { :yep } else { :nope } 10'), 10);
  t.equal(e('if true { :yep } else { :nope } end'), 'yep');
  t.equal(e('if true { :yep } else { :nope } end 10'), 10);
  t.equal(e('if true { :yep } else { :nope } fi'), 'yep');
  t.equal(e('if true { :yep } else { :nope } fi 10'), 10);
  t.equal(e('if true then :yep else { :nope }'), 'yep');
  t.equal(e('if true then :yep else { :nope } 10'), 10);
  t.equal(e('if false { :yep } else { :nope }'), 'nope');
  t.equal(e('if false { :yep } else { :nope } 10'), 10);
  t.equal(e('if false { :yep } else :nope'), 'nope');
  t.equal(e('if false { :yep } else :nope 10'), 10);
  t.equal(e('if false then :yep else { :nope }'), 'nope');
  t.equal(e('if false then :yep else { :nope } 10'), 10);
  t.equal(e('if false then :yep else if true then :mid else :nope'), 'mid');
  t.equal(e('if false then :yep else if true then :mid else :nope 10'), 10);
  t.equal(e('if false then :yep else if 10 > 20 then :mid else if true then :end else :nope'), 'end');
  t.equal(e('if false then :yep else if 10 > 20 then :mid else if true then :end else :nope 10'), 10);
  t.equal(e('if false then :yep else if 10 > 20 then :mid else if true then :end else :nope end'), 'end');
  t.equal(e('if false then :yep else if 10 > 20 then :mid else if true then :end else :nope end 10'), 10);
  t.equal(e('if false then :yep else if 10 > 20 then :mid else if true then :end end'), 'end');
  t.equal(e('if false then :yep else if 10 > 20 then :mid else if true then :end end 10'), 10);
  t.equal(e('if false { :yep } else if 10 > 20 { :mid } else if true { :end } else { :nope }'), 'end');
  t.equal(e('if false { :yep } else if 10 > 20 { :mid } else if true { :end } else { :nope } 10'), 10);
  t.equal(e('if false { :yep } else if 10 > 20 { :mid } else if true { :end } else { :nope } end'), 'end');
  t.equal(e('if false { :yep } else if 10 > 20 { :mid } else if true { :end } else { :nope } end 10'), 10);
  t.equal(e('if false then :yep else if 10 > 20 { :mid } else if true { :end } else :nope end'), 'end');
  t.equal(e('if false then :yep else if 10 > 20 { :mid } else if true { :end } else :nope end 10'), 10);
  t.equal(e('if false { :yep } else if 10 > 20 then :mid else if true { :end } end'), 'end');
  t.equal(e('if false { :yep } else if 10 > 20 then :mid else if true { :end } end 10'), 10);
  t.equal(e('if false then :yep elseif true then :mid else :nope'), 'mid');
  t.equal(e('if false then :yep elseif true then :mid else :nope 10'), 10);
  t.equal(e('if false then :yep elsif true then :mid else :nope'), 'mid');
  t.equal(e('if false then :yep elsif true then :mid else :nope 10'), 10);
  t.equal(e('if false then :yep elif true then :mid else :nope'), 'mid');
  t.equal(e('if false then :yep elif true then :mid else :nope 10'), 10);
  t.equal(e('if true then if false then :nope else :yep end else :doublenope'), 'yep');
  t.equal(e('if true then if true then :nope else :yep end else :doublenope'), 'nope');
  t.equal(e('if false then if true then :nope else :yep end else :doublenope'), 'doublenope');
  t.equal(e('if false then if true then :nope end else if true { :yep } else :doublenope'), 'yep');

  unregisterOperator(op);
});

q.test(`ilike`, t => {
  t.equal(e('(ilike :SomeThing :*et*)'), true);
  t.equal(e('`abe\npst\ng` ilike :*e*t*)'), true);
  t.equal(e('(ilike :SomeThing :*fr*)'), false);
  t.equal(e('(ilike (array :Or :SomeThing :Other) :*et*)'), true);
  t.equal(e('(ilike (array :Or :SomeThing :Other) :*fr*)'), false);
  t.equal(e(':a ilike [:B :A]'), true);
  t.equal(e(':a ilike [:B :C]'), false);
  t.equal(e('[:a :b] ilike [:B :C]'), true);
  t.equal(e('[:a :b] ilike [:D :C]'), false);
});

q.test('in', t => {
  t.ok(e('(in :a (array 1 2 :a 3))'));
  t.notOk(e('(in :a (array 1 2 3))'));
  t.ok(e('[1 2 3] in [3 2 1 0 :a]'));
  t.notOk(e('[1 2 3] in [1 2 :a :b]'));
  t.ok(e(`99 in '1,2,3,4-100,1000'`));
  t.ok(e(`99 in '>10'`));
  t.ok(e(`99 in '5000-1'`));
  t.notOk(e(`99 in '<10'`));
  t.ok(e(`(=>_ == :d) in { a::b c::d }`));
  t.notOk(e(`(=>_ == :d) in { a::b c::e }`));
  t.ok(e(`(=>@key == :c) in { a::b c::d }`));
  t.notOk(e(`(=>@key == :c) in { a::b e::d }`));
  t.ok(e(`(=>@index == 1) in { a::b c::d }`));
  t.notOk(e(`(=>@index == 2) in { a::b e::d }`));
  t.ok(e(`(=>_ == :d) in [:a :b :c :d]`));
  t.notOk(e(`(=>_ == :d) in [:a :b :c :e]`));
  t.ok(e(`(=>@index == 2) in [:a :b :c :d]`));
  t.notOk(e(`(=>@index == 9) in [:a :b :c :e]`));
  t.ok(e(`:a in { a::b c::d }`));
  t.notOk(e(`:a in { e::b c::d }`));
  t.ok(e(`[:a :c] in { a::b c::d }`));
  t.notOk(e(`[:a :e] in { e::b c::d }`));
  t.ok(e(`'ok' in 'tokomak'`));
  t.notOk(e(`'no' in 'tokomak'`));
});

q.test('index', t => {
  const list = [{ id: 1, name: 'joe' }, { id: 2, name: 'sue' }, { id: 3, name: 'larry' }];
  t.deepEqual(e({ list }, 'index(list, =>id)'), { 1: list[0], 2: list[1], 3: list[2] });
  t.deepEqual(e({ list }, 'index(list, =>[id _])'), { 1: list[0], 2: list[1], 3: list[2] });
  t.deepEqual(e({ list }, 'index(list, =>[id name])'), { 1: 'joe', 2: 'sue', 3: 'larry' });
  t.deepEqual(e({ list }, 'index(list, =>if @index == 1 then [] else [id name])'), { 1: 'joe', 3: 'larry' });
  t.deepEqual(e({ list }, 'index(list, =>id many:1)'), { 1: [list[0]], 2: [list[1]], 3: [list[2]] });
  t.deepEqual(e({ list }, 'index(list + { id:2 name::frank }, =>[id name] many:1)'), { 1: ['joe'], 2: ['sue', 'frank'], 3: ['larry'] });
});

// q.todo('inspect', t => { t.expect(0); });

q.test('intersect', t => {
  const arr = e('intersect([1 1 2 3 4 5 5] [1 2 2 3 6 6])');
  t.equal(arr.length, 3);
  t.equal(arr[0], 1);
  t.equal(arr[1], 2);
  t.equal(arr[2], 3);
});

// q.todo('interval', t => { t.expect(0); });

q.test(`is`, t => {
  t.ok(e(`(is :joe 'joe')`));
  t.notOk(e(`(is :joe 'Joe')`));
});

q.test(`is-not`, t => {
  t.notOk(e(`(is-not :joe 'joe')`));
  t.ok(e(`(is-not :joe 'Joe')`));
});

q.test('join', t => {
  t.equal(e(`join([:a :b :c] ', ')`), 'a, b, c');
  t.equal(e(`join([:a :b] ', ')`), 'a, b');
  t.equal(e(`join([:a :b] ', ' ', and ')`), 'a, b');
  t.equal(e(`join([:a :b] ', ' ', and ' ' and ')`), 'a and b');
  t.equal(e(`join([:a :b :c] =>upper(_) ', ')`), 'A, B, C');
  t.equal(e(`join([:a :b] =>upper(_) ', ')`), 'A, B');
  t.equal(e(`join([:a :b] =>upper(_) ', ' ', and ')`), 'A, B');
  t.equal(e(`join([:a :b] =>upper(_) ', ' ', and ' ' and ')`), 'A and B');
  t.equal(e(`join([:a :b :c] ', ' ', and ')`), 'a, b, and c');
  t.equal(e(`join([:a :b :c] ', ' ', and ' ' and ')`), 'a, b, and c');
  t.equal(e(`join([:a :b :c] =>upper(_) ', ' ', and ')`), 'A, B, and C');
  t.equal(e(`join([:a :b :c] =>upper(_) ', ' ', and ' ' and ')`), 'A, B, and C');
  const ctx = new Root({});
  ctx.special.source = { value: ['a', 'b', 'c'] };
  t.equal(e(ctx, `join(', ')`), 'a, b, c');
  t.equal(e(ctx, `join(=>upper(_) ', ')`), 'A, B, C');
  t.equal(e(ctx, `join(', ' ', and ')`), 'a, b, and c');
  t.equal(e(ctx, `join(', ' ', and ' ' and ')`), 'a, b, and c');
  t.equal(e(ctx, `join(=>upper(_) ', ' ', and ')`), 'A, B, and C');
  t.equal(e(ctx, `join(=>upper(_) ', ' ', and ' ' and ')`), 'A, B, and C');
  ctx.special.source = { value: ['a', 'b'] };
  t.equal(e(ctx, `join(', ')`), 'a, b');
  t.equal(e(ctx, `join(', ' ', and ')`), 'a, b');
  t.equal(e(ctx, `join(', ' ', and ' ' and ')`), 'a and b');
  t.equal(e(ctx, `join(=>upper(_) ', ')`), 'A, B');
  t.equal(e(ctx, `join(=>upper(_) ', ' ', and ')`), 'A, B');
  t.equal(e(ctx, `join(=>upper(_) ', ' ', and ' ' and ')`), 'A and B');
});

// q.todo('keys', t => { t.expect(0); });
// q.todo('label-diff', t => { t.expect(0); });
// q.todo('last', t => { t.expect(0); });
// q.todo('let', t => { t.expect(0); });

q.test('len, length', t => {
  t.equal(e('len([1 2 3])'), 3);
  t.equal(e('len(:123)'), 3);
  t.equal(e('len({ a:1 b:2 c:3 })'), 3);
  t.equal(e('length(source([1 2 3 4]))'), 4);
  t.equal(e('len(69)'), 0);
});

q.test(`like`, t => {
  t.equal(e('(like :SomeThing :*et*)'), false);
  t.equal(e('(like :SomeThing :*eT*)'), true);
  t.equal(e('(like :SomeThing :*fr*)'), false);
  t.equal(e('(like (array :Or :SomeThing :Other) :*et*)'), false);
  t.equal(e('(like (array :Or :SomeThing :Other) :*eT*)'), true);
  t.equal(e('(like (array :Or :SomeThing :Other) :*fr*)'), false);
  t.equal(e(':A like [:B :A]'), true);
  t.equal(e(':A like [:B :C]'), false);
  t.equal(e('[:A :B] like [:B :C]'), true);
  t.equal(e('[:A :B] like [:D :C]'), false);
});

// q.todo('lower', t => { t.expect(0); });

q.test('map', t => {
  // TODO: test options
  t.deepEqual(e(`map([1 2 3] =>_ * 2)`), [2, 4, 6]);
  t.deepEqual(e(`map({ a:1 b:2 c:3 } =>_ * 2)`), { a: 2, b: 4, c: 6 });
  t.deepEqual(e(`map({ a:1 b:2 c:3 } =>if _ == 1 then null else _ * 2)`), { b: 4, c: 6 });
  t.deepEqual(e(`map({ a:1 b:2 c:3 } =>if _ == 1 then [:d 69] else _ * 2)`), { d: 69, b: 4, c: 6 });
  t.deepEqual(e(`map({ a:1 b:2 c:3 } =>if @index == 0 then null else _ * 2)`), { b: 4, c: 6 });
  t.deepEqual(e(`map({ a:1 b:2 c:3 } =>if @index == 0 then [:d 69] else _ * 2)`), { d: 69, b: 4, c: 6 });
  t.deepEqual(e(`map({ a:1 b:2 c:3 } =>if @key == :a then null else _ * 2)`), { b: 4, c: 6 });
  t.deepEqual(e(`map({ a:1 b:2 c:3 } =>if @key == :a then [:d 69] else _ * 2)`), { d: 69, b: 4, c: 6 });
  t.equal(e({ outer: [{ foo: 'bar' }] }, `map(outer =>{ let joe = :joe; let sam = :mas; { let sam = :sam; joe + sam + ^sam + foo } })[0]`), 'joesammasbar');
  t.deepEqual(e('map([:a :b [:c :d :e] :f :g] =>_ flat:1)'), 'abcdefg'.split(''));
  t.deepEqual(e('map([:a :b [:c [:d] :e] :f [[[:g]]]] =>_ flat:9)'), 'abcdefg'.split(''));
});

q.test('max', t => {
  t.equal(e('max([1 2 3 4])'), 4);
  t.equal(e('max(1 2 3 4)'), 4);
  t.equal(e('max([1 2 3 4] =>_ + 10)'), 14);
  const ctx = new Root({}, { special: { source: { value: [1, 2, 3, 4] } } });
  // defaults to the nearest source if not given an array
  t.equal(e(ctx, 'max(5 6 7 8)'), 4);
  t.equal(e(ctx, 'max(=>_ + 10)'), 14);
  t.equal(e('max()'), 0);
});

q.test('min', t => {
  t.equal(e('min([1 2 3 4])'), 1);
  t.equal(e('min(1 2 3 4)'), 1);
  t.equal(e('min([1 2 3 4] =>_ + 10)'), 11);
  const ctx = new Root({}, { special: { source: { value: [1, 2, 3, 4] } } });
  // defaults to the nearest source if not given an array
  t.equal(e(ctx, 'min(5 6 7 8)'), 1);
  t.equal(e(ctx, 'min(=>_ + 10)'), 11);
  t.equal(e('min()'), 0);
});

// q.todo('not', t => { t.expect(0); });

q.test(`not-ilike`, t => {
  t.equal(e('(not-ilike :SomeThing :*et*)'), false);
  t.equal(e('(not-ilike :SomeThing :*fr*)'), true);
  t.equal(e('(not-ilike (array :Or :SomeThing :Other) :*et*)'), false);
  t.equal(e('(not-ilike (array :Or :SomeThing :Other) :*fr*)'), true);
  t.equal(e(':a not-ilike [:B :A]'), false);
  t.equal(e(':a not-ilike [:B :C]'), true);
  t.equal(e('[:a :b] not-ilike [:B :C]'), false);
  t.equal(e('[:a :b] not-ilike [:D :C]'), true);
});

q.test('not-in', t => {
  t.ok(e('(not-in :b (array 1 2 3))'));
  t.notOk(e('(not-in :b (array 1 2 :b 3))'));
  t.equal(e('[1 :a] not-in [:b :c]'), true);
  t.equal(e('[1 2 3] not-in [3 2 1 0]'), false);
  t.notOk(e(`99 not-in '1,2,3,4-100,1000'`));
  t.notOk(e(`99 not-in '>10'`));
  t.ok(e(`99 not-in '<10'`));
  t.ok(e(`50 not-in '0-100 !50'`));
  t.notOk(e(`(=>_ == :d) not-in { a::b c::d }`));
  t.ok(e(`(=>_ == :d) not-in { a::b c::e }`));
  t.notOk(e(`(=>@key == :c) not-in { a::b c::d }`));
  t.ok(e(`(=>@key == :c) not-in { a::b e::d }`));
  t.notOk(e(`(=>@index == 1) not-in { a::b c::d }`));
  t.ok(e(`(=>@index == 2) not-in { a::b e::d }`));
  t.notOk(e(`(=>_ == :d) not-in [:a :b :c :d]`));
  t.ok(e(`(=>_ == :d) not-in [:a :b :c :e]`));
  t.notOk(e(`(=>@index == 2) not-in [:a :b :c :d]`));
  t.ok(e(`(=>@index == 9) not-in [:a :b :c :e]`));
});

q.test(`not-like`, t => {
  t.equal(e('(not-like :SomeThing :*et*)'), true);
  t.equal(e('(not-like :SomeThing :*eT*)'), false);
  t.equal(e('(not-like :SomeThing :*fr*)'), true);
  t.equal(e('(not-like (array :Or :SomeThing :Other) :*et*)'), true);
  t.equal(e('(not-like (array :Or :SomeThing :Other) :*eT*)'), false);
  t.equal(e('(not-like (array :Or :SomeThing :Other) :*fr*)'), true);
  t.equal(e(':A not-like [:B :A]'), false);
  t.equal(e(':A not-like [:B :C]'), true);
  t.equal(e('[:A :B] not-like [:B :C]'), false);
  t.equal(e('[:A :B] not-like [:D :C]'), true);
});

q.test('nth', t => {
  t.equal(e('nth([1 2 3 4] 1)'), 1);
  t.equal(e('nth([1 2 3 4] -1)'), 4);
  t.equal(e('nth([1 2 3 4] -2)'), 3);
  const ctx = new Root({}, { special: { source: { value: [1, 2, 3, 4] } } });
  // defaults to the nearest source if not given an array
  t.equal(e(ctx, 'nth(1)'), 1);
  t.equal(e(ctx, 'nth(-1)'), 4);
  t.equal(e(ctx, 'nth(-2)'), 3);
});

// q.todo('num', t => { t.expect(0); });
q.test('object', t => {
  t.deepEqual(e(`object(:a 10 :b 22)`), { a: 10, b: 22 });
  t.deepEqual(e(`object([:a 10 :b 22])`), { a: 10, b: 22 });
  t.deepEqual(e(`let a = 10; object(:a a :b 22)`), { a: 10, b: 22 });
  t.deepEqual(e(`let a = 10; object([:a a :b 22])`), { a: 10, b: 22 });
});

q.test('or', t => {
  const op: Operator = { type: 'value', names: ['nope'], apply() { t.notOk('nope'); } };
  registerOperator(op);

  t.ok(e('(or true)'));
  t.notOk(e('(or false)'));
  t.ok(e('(or true false)'));
  t.ok(e('(or false true)'));
  t.ok(e('(or true (nope))'));

  unregisterOperator(op);
});

// q.todo('overlap', t => { t.expect(0); });
// q.todo('pad', t => { t.expect(0); });
// q.todo('padl', t => { t.expect(0); });
// q.todo('padr', t => { t.expect(0); });
// q.todo('parse', t => { t.expect(0); });

q.test('patch', t => {
  t.deepEqual(e('patch({a:1} {a:[1 2] b:[undefined 3]})'), { a: 2, b: 3 });
  t.deepEqual(e('patch({a:99} {a:[1 2] b:[undefined 3]})'), { a: 2, b: 3 });
  t.deepEqual(e('patch({a:3} {a:[1 2] b:[undefined 3]} strict:1)'), { a: 3, b: 3 });
  t.equal(...jsoncmp(e('patch({a:2 b:3} {a:[1 2] b:[undefined 3]} dir::backward)'), { a: 1 }));
  t.equal(...jsoncmp(e('patch({a:99 b:3} {a:[1 2] b:[undefined 3]} dir::backward)'), { a: 1 }));
  t.equal(...jsoncmp(e('patch({a:3 b:3} {a:[1 2] b:[undefined 3]} dir::backward strict:1)'), { a: 3 }));
  t.deepEqual(e('patch({a:1 c:{test:true}} {a:[1 2] b:[undefined 3]} {"c.test":[true :sure]})'), { a: 2, b: 3, c: { test: 'sure' } });
  t.equal(...jsoncmp(e('patch({a:2 b:3 c:{test::sure}} {a:[1 2] b:[undefined 3]} {"c.test":[true :sure]} dir::backward)'), { a: 1, c: { test: true } }));
});

q.test('pipe, |', t => {
  t.deepEqual(e(`pipe([1 2 3] filter(=>_ != 1) map(=>_ * 2))`), [4, 6]);
  t.deepEqual(e(`[1 2 3]|filter(=>_ != 1)|map(=>_ * 2)`), [4, 6]);
  t.deepEqual(e(`[1 2 3] | filter(=>_ != 1) | map(=>_ * 2)`), [4, 6]);
  t.deepEqual(e(`[1 2 3]|filter(=>_ != 1) | map(=>_ * 2)`), [4, 6]);
});

q.test('rand, random', t => {
  t.ok(typeof e('rand()') === 'number');
  for (let i = 0; i < 100; i++) {
    const r = e('rand(1 10)');
    t.ok(r >= 1 && r <= 10);
  }
  const s = e('rand(:abcdefg 5)');
  t.equal(s.length, 5);
  t.ok(/[abcdefg]{5}/.test(s));
  for (let i = 0; i < 10; i++) {
    const a = e('rand([1 69 99])');
    t.ok([1, 69, 99].includes(a));
  }
});

// q.todo('reduce', t => { t.expect(0); });
// q.todo('replace-all', t => { t.expect(0); });
// q.todo('replace', t => { t.expect(0); });

q.test('reverse', t => {
  t.deepEqual(e('reverse([1 2 3])'), [3, 2, 1]);
  t.deepEqual(e('let a = [1 2 3]; reverse(a); a'), [1, 2, 3]);
  t.equal(e('reverse(:testing)'), 'gnitset');
});

q.test('round', t => {
  t.equal(e('round(10.4)'), 10);
  t.equal(e('round(10.5)'), 11);
  t.equal(e('round(10.4, 0)'), 10);
  t.equal(e('round(10.5, 0)'), 10);
  t.equal(e('round(11.5, 0)'), 12);
  t.equal(e('round(19.5, 0)'), 20);
  t.equal(e('round(10.125, 2)'), 10.12);
  t.equal(e('round(10.12500001, 2)'), 10.13);
  t.equal(e('round(10.135, 2)'), 10.14);
  t.equal(e('round(10.13500001, 2)'), 10.14);
  t.equal(e('round(-10.125, 2)'), -10.12);
  t.equal(e('round(-10.1250001, 2)'), -10.13);
  t.equal(e('round(-10.135, 2)'), -10.14);
  t.equal(e('round(-10.1350001, 2)'), -10.14);
  t.equal(e('round(10.125, 2, :half-odd)'), 10.13);
  t.equal(e('round(10.135, 2, :half-odd)'), 10.13);
  t.equal(e('round(-10.125, 2, :half-odd)'), -10.13);
  t.equal(e('round(-10.135, 2, :half-odd)'), -10.13);
  t.equal(e('round(10.125, 2, :half-up)'), 10.13);
  t.equal(e('round(10.135, 2, :half-up)'), 10.14);
  t.equal(e('round(-10.125, 2, :half-up)'), -10.12);
  t.equal(e('round(-10.135, 2, :half-up)'), -10.13);
  t.equal(e('round(10.125, 2, :half-down)'), 10.12);
  t.equal(e('round(10.135, 2, :half-down)'), 10.13);
  t.equal(e('round(-10.125, 2, :half-down)'), -10.13);
  t.equal(e('round(-10.135, 2, :half-down)'), -10.14);
  t.equal(e('round(10.125, 2, :half-to-0)'), 10.12);
  t.equal(e('round(10.135, 2, :half-to-0)'), 10.13);
  t.equal(e('round(-10.125, 2, :half-to-0)'), -10.12);
  t.equal(e('round(-10.135, 2, :half-to-0)'), -10.13);
  t.equal(e('round(10.125, 2, :half-from-0)'), 10.13);
  t.equal(e('round(10.135, 2, :half-from-0)'), 10.14);
  t.equal(e('round(-10.125, 2, :half-from-0)'), -10.13);
  t.equal(e('round(-10.135, 2, :half-from-0)'), -10.14);
  t.equal(e('round(10.129, 2, :to-0)'), 10.12);
  t.equal(e('round(10.134, 2, :to-0)'), 10.13);
  t.equal(e('round(10.000001, 2, :to-0)'), 10);
  t.equal(e('round(10.000001, 0, :to-0)'), 10);
  t.equal(e('round(-10.129, 2, :to-0)'), -10.12);
  t.equal(e('round(-10.134, 2, :to-0)'), -10.13);
  t.equal(e('round(-10.000001, 2, :to-0)'), -10);
  t.equal(e('round(-10.000001, 0, :to-0)'), -10);
  t.equal(e('round(0.000001, -1, :to-0)'), 0);
  t.equal(e('round(-0.000001, -1, :to-0)'), 0);
  t.equal(e('round(234, -1, :to-0)'), 230);
  t.equal(e('round(-234, -1, :to-0)'), -230);
  t.equal(e('round(10.129, 2, :from-0)'), 10.13);
  t.equal(e('round(10.134, 2, :from-0)'), 10.14);
  t.equal(e('round(10.000001, 2, :from-0)'), 10.01);
  t.equal(e('round(0.000001, -1, :from-0)'), 10);
  t.equal(e('round(234, -1, :from-0)'), 240);
  t.equal(e('round(-0.000001, -1, :from-0)'), -10);
  t.equal(e('round(-234, -1, :from-0)'), -240);
  t.equal(e('round(-10.129, 2, :from-0)'), -10.13);
  t.equal(e('round(-10.134, 2, :from-0)'), -10.14);
  t.equal(e('round(-10.000001, 2, :from-0)'), -10.01);
  t.equal(e('round(10.1250, 2, :half-even)'), 10.12);
  t.equal(e('round(10.1259, 2, :half-even)'), 10.13);
  t.equal(e('round(10.1350, 2, :half-even)'), 10.14);
  t.equal(e('round(10.1359, 2, :half-even)'), 10.14);
  t.equal(e('round(-10.1250, 2, :half-even)'), -10.12);
  t.equal(e('round(-10.1259, 2, :half-even)'), -10.13);
  t.equal(e('round(-10.1350, 2, :half-even)'), -10.14);
  t.equal(e('round(-10.1359, 2, :half-even)'), -10.14);
  t.equal(e('round(1, -1)'), 0);
  t.equal(e('round(5, -1)'), 0);
  t.equal(e('round(6, -1)'), 10);
  t.equal(e('round(-1, -1)'), 0);
  t.equal(e('round(-5, -1)'), 0);
  t.equal(e('round(-6, -1)'), -10);
  t.equal(e('round(111, -1)'), 110);
  t.equal(e('round(115, -1)'), 120);
  t.equal(e('round(115.01, -1)'), 120);
  t.equal(e('round(125.01, -1)'), 130);
  t.equal(e('round(116, -1)'), 120);
  t.equal(e('round(195, -1)'), 200);
  t.equal(e('round(1110, -2)'), 1100);
  t.equal(e('round(1150, -2)'), 1200);
  t.equal(e('round(1150.01, -2)'), 1200);
  t.equal(e('round(1250.01, -2)'), 1300);
  t.equal(e('round(1160, -2)'), 1200);
  t.equal(e('round(1950, -2)'), 2000);
  t.equal(e('round(-111, -1)'), -110);
  t.equal(e('round(-115, -1)'), -120);
  t.equal(e('round(-115.01, -1)'), -120);
  t.equal(e('round(-116, -1)'), -120);
  t.equal(e('round(-195, -1)'), -200);
  t.equal(e('round(-1110, -2)'), -1100);
  t.equal(e('round(-1150, -2)'), -1200);
  t.equal(e('round(-1150.01, -2)'), -1200);
  t.equal(e('round(-1250.01, -2)'), -1300);
  t.equal(e('round(-1160, -2)'), -1200);
  t.equal(e('round(-1950, -2)'), -2000);
  e('set-defaults(:round places:3 all-numeric:1 method::half-odd)');
  t.equal(e('round(10.4)'), 10.4);
  t.equal(e('round(10.5)'), 10.5);
  t.equal(e('round(10.12459)'), 10.125);
  t.equal(e('round(10.13550)'), 10.135);
  t.equal(e('round(10.13559)'), 10.136);
  t.equal(e('round(10.5, 0)'), 11);
  t.equal(e('round(11.5, 0)'), 11);
  t.equal(e('round(0.1, 0, :up)'), 1, 'round up positive to whole');
  t.equal(e('round(0.1, 0, :down)'), 0, 'round down positive to whole');
  t.equal(e('round(-0.1, 0, :up)'), 0, 'round up negative to whole');
  t.equal(e('round(-0.1, 0, :down)'), -1, 'round down negative to whole');
  t.equal(e('round(10.001, 0, :up)'), 11, 'round more up positive to whole');
  t.equal(e('round(10.001, 0, :down)'), 10, 'round more down positive to whole');
  t.equal(e('round(-10.001, 0, :up)'), -10, 'round more up negative to whole');
  t.equal(e('round(-10.001, 0, :down)'), -11, 'round more down negative to whole');
  t.equal(e('round(10.501, 2, :up)'), 10.51, 'round up positive dec');
  t.equal(e('round(10.501, 2, :down)'), 10.50, 'round down positive dec');
  t.equal(e('round(-10.501, 2, :up)'), -10.50, 'round up negative dec');
  t.equal(e('round(-10.501, 2, :down)'), -10.51, 'round down negative dec');
  t.equal(e('round(10.5020789, 2, :up)'), 10.51, 'round up more positive dec');
  t.equal(e('round(10.5020789, 2, :down)'), 10.50, 'round down more positive dec');
  t.equal(e('round(-10.5020789, 2, :up)'), -10.50, 'round up more negative dec');
  t.equal(e('round(-10.5020789, 2, :down)'), -10.51, 'round down more negative dec');
  t.equal(e('round(10.5000089, 2, :up)'), 10.51, 'round up even more positive dec');
  t.equal(e('round(10.5000089, 2, :down)'), 10.50, 'round down even more positive dec');
  t.equal(e('round(-10.5000089, 2, :up)'), -10.50, 'round up even more negative dec');
  t.equal(e('round(-10.5000089, 2, :down)'), -10.51, 'round down even more negative dec');
  t.equal(e('round(10.50, 2, :up)'), 10.50, 'round up flat positive dec');
  t.equal(e('round(10.50, 2, :down)'), 10.50, 'round down flat positive dec');
  t.equal(e('round(-10.50, 2, :up)'), -10.50, 'round up flat negative dec');
  t.equal(e('round(-10.50, 2, :down)'), -10.50, 'round down flat negative dec');
  t.equal(e('round(111, -1, :up)'), 120, 'round negatively up');
  t.equal(e('round(-111, -1, :up)'), -110, 'round negative negatively up');
  t.equal(e('round(111, -1, :down)'), 110, 'round negatively down');
  t.equal(e('round(-111, -1, :down)'), -120, 'round negative negatively down');
  t.equal(e('round(111, -2, :up)'), 200, 'round more negatively up');
  t.equal(e('round(-111, -2, :up)'), -100, 'round more negative negatively up');
  t.equal(e('round(111, -2, :down)'), 100, 'round more negatively down');
  t.equal(e('round(-111, -2, :down)'), -200, 'round more negative negatively down');
  t.equal(e('round(0.01, -1, :up)'), 10, 'round under negatively up');
  t.equal(e('round(0.01, -1, :down)'), 0, 'round under negatively down');
  t.equal(e('round(-0.01, -1, :up)'), 0, 'round under negative negatively up');
  t.equal(e('round(-0.01, -1, :down)'), -10, 'round under negative negatively down');
  t.equal(e('round(0.01, -2, :up)'), 100, 'round more under negatively up');
  t.equal(e('round(0.01, -2, :down)'), 0, 'round more under negatively down');
  t.equal(e('round(-0.01, -2, :up)'), 0, 'round more under negative negatively up');
  t.equal(e('round(-0.01, -2, :down)'), -100, 'round more under negative negatively down');
  e('set-defaults(:round places:2 all-numeric:0 method::half-even)');
});

// q.todo('set', t => { t.expect(0); });

q.test('set-defaults', t => {
  // TODO: moar set-defaults tests
  t.deepEqual(e('[0.1 + 0.2 { set-defaults(:round context:1 places:2) 0.1 + 0.2 }, 0.1 + 0.2]'), [0.30000000000000004, 0.3, 0.30000000000000004]);
});

// q.todo('similar', t => { t.expect(0); });
// q.todo('similarity', t => { t.expect(0); });
// q.todo('slice, substr', t => { t.expect(0); });

q.test('sort', t => {
  t.deepEqual(e('sort([3 2 1])'), [1, 2, 3]);
  t.deepEqual(e('sort([{ a::a } { a::c } { a::b }] =>a)'), [{ a: 'a' }, { a: 'b' }, { a: 'c' }]);
  t.deepEqual(e('sort([{ a::a } { a::c } { a::b }] { by: =>a })'), [{ a: 'a' }, { a: 'b' }, { a: 'c' }]);
  t.deepEqual(e('sort([{ a::a } { a::c } { a::b }] { by: =>a desc:1 })'), [{ a: 'c' }, { a: 'b' }, { a: 'a' }]);
  t.deepEqual(e('sort([{ a::a } { a::c } { a::b }] { by: =>a dir::desc })'), [{ a: 'c' }, { a: 'b' }, { a: 'a' }]);
  t.deepEqual(e('sort([{ a::a } { a::c } { a::b }] [=>a])'), [{ a: 'a' }, { a: 'b' }, { a: 'c' }]);
  t.deepEqual(e('sort([{ a::a } { a::c } { a::b }] [{ by: =>a }])'), [{ a: 'a' }, { a: 'b' }, { a: 'c' }]);
  t.deepEqual(e('sort([{ a::a } { a::c } { a::b }] [{ by: =>a desc:1 }])'), [{ a: 'c' }, { a: 'b' }, { a: 'a' }]);
  t.deepEqual(e('sort([{ a::a } { a::c } { a::b }] { by: =>a desc:1 })'), [{ a: 'c' }, { a: 'b' }, { a: 'a' }]);
  t.deepEqual(e('sort([{ a::a } { a::c } { a::b }] [:a])'), [{ a: 'a' }, { a: 'b' }, { a: 'c' }]);
  t.deepEqual(e('sort([{ a::a } { a::c } { a::b }] [:+a])'), [{ a: 'a' }, { a: 'b' }, { a: 'c' }]);
  t.deepEqual(e('sort([{ a::a } { a::c } { a::b }] :a)'), [{ a: 'a' }, { a: 'b' }, { a: 'c' }]);
  t.deepEqual(e('sort([{ a::a } { a::c } { a::b }] :+a)'), [{ a: 'a' }, { a: 'b' }, { a: 'c' }]);
  t.deepEqual(e('sort([{ a::a } { a::c } { a::b }] :-a)'), [{ a: 'c' }, { a: 'b' }, { a: 'a' }]);
  t.deepEqual(e('sort([{ a::a } { a::c } { a::b }] [:-a])'), [{ a: 'c' }, { a: 'b' }, { a: 'a' }]);
  t.equal(JSON.stringify(e('sort({ b::a c::a a::a })')), JSON.stringify({ a: 'a', b: 'a', c: 'a' }));
  t.equal(JSON.stringify(e('sort({ b::a c::a a::a } =>@key)')), JSON.stringify({ a: 'a', b: 'a', c: 'a' }));
  t.equal(JSON.stringify(e('sort({ b::a c::a a::a } `-@key`)')), JSON.stringify({ c: 'a', b: 'a', a: 'a' }));
  t.equal(JSON.stringify(e('sort({ b::b c::a a::c } =>_)')), JSON.stringify({ c: 'a', b: 'b', a: 'c' }));
  t.deepEqual(e('set ~foo = [1 2 3 4]; sort(~foo =>0 - _); ~foo'), [1, 2, 3, 4]);
});

q.test('source', t => {
  t.deepEqual(e('source([1 2 3])'), { value: [1, 2, 3] });
  t.deepEqual(e('source({ value: [1 2 3] })'), { value: [1, 2, 3] });
  t.equal(e('source({ value: [1 2 3] } =>max())'), 3);
  t.deepEqual(e('source({ value:9 max:10 })'), { value: { value: 9, max: 10 } });
});

// q.todo('split', t => { t.expect(0); });
// q.todo('strict-is', t => { t.expect(0); });
// q.todo('strict-is-not', t => { t.expect(0); });

q.test('string', t => {
  t.equal(e('string(null)'), '');
  t.equal(e('string(null raport:1)'), 'null');
  t.equal(e('string(undefined raport:1)'), 'undefined');
  t.equal(e('string(undefined)'), '');
  t.equal(e('string(10)'), '10');
  t.equal(e('string(10 raport:1)'), '10');
  t.equal(e('string(10 json:1)'), '10');
  t.equal(e('string("|b|hello" styled:1)'), '<span style="font-weight:bold;">hello</span>');
  t.equal(e('string(#2021z#)'), '2021-01-01 00:00:00+0');
});

// q.todo('sum', t => { t.expect(0); });

q.test('time-span', t => {
  t.equal(e('time-span(#2021-10-31# #2021-11-10# unit::d)'), 10, 'fall dst is accurate');
  t.equal(e('time-span(#2021-10-30# #2021-11-10# unit::d)'), 11, 'fall dst is accurate');
  t.equal(e('time-span(#2022-03-10# #2022-03-17# unit::d)'), 7, 'spring dst is accurate');
  t.deepEqual(e(`time-span(#1999-1-15# #2011-12-27# unit:[:y :M])`), [12, 11]);
  t.deepEqual(e(`time-span(#1999-1-15# #2011-12-14# unit:[:y :M])`), [12, 10]);
  t.deepEqual(e(`time-span(#1999-1-30# #2011-12-27# unit:[:y :M])`), [12, 10]);
  t.deepEqual(e(`time-span(#1999-1-31# #1999-2-28# unit:[:M :d])`), [1, 0]);
  t.deepEqual(e(`time-span(#1999-2-28# #1999-3-31# unit:[:M :d])`), [1, 0]);
  t.equal(e('time-span(#2021-10-01# #2021-12-31# unit::d)'), 91, 'span in single units is accurate');
  t.equal(e('time-span(#2020-2-28# #2020-3-1# unit::d)'), 2, 'leap year is covered');
});

// q.todo('trim', t => { t.expect(0); });
// q.todo('triml', t => { t.expect(0); });
// q.todo('trimr', t => { t.expect(0); });

q.test('unique', t => {
  const vals = [{ a: 10, b: 'a' }, { a: 12, b: 'b' }, { a: 10, b: 'c' }];
  t.deepEqual(e({ vals }, '(map (unique vals =>a) =>b)'), ['a', 'b']);
});

// q.todo('unique-map', t => { t.expect(0); });

q.test('unless', t => {
  t.equal(e('unless false then :yep'), 'yep');
  t.equal(e('unless false then :yep 10'), 10);
  t.equal(e('unless false then :yep end'), 'yep');
  t.equal(e('unless false then :yep end 10'), 10);
  t.equal(e('unless false then :yep else :nope'), 'yep');
  t.equal(e('unless false then :yep else :nope 10'), 10);
  t.equal(e('unless false then :yep else :nope end'), 'yep');
  t.equal(e('unless false then :yep else :nope end 10'), 10);
  t.equal(e('unless true then :yep else :nope'), 'nope');
  t.equal(e('unless true then :yep else :nope 10'), 10);
  t.equal(e('unless true then :yep else :nope end'), 'nope');
  t.equal(e('unless true then :yep else :nope end 10'), 10);
  t.equal(e('unless false { :yep }'), 'yep');
  t.equal(e('unless false { :yep } 10'), 10);
  t.equal(e('unless false { :yep } end'), 'yep');
  t.equal(e('unless false { :yep } end 10'), 10);
  t.equal(e('unless false { :yep } else { :nope }'), 'yep');
  t.equal(e('unless false { :yep } else { :nope } 10'), 10);
  t.equal(e('unless false { :yep } else { :nope } end'), 'yep');
  t.equal(e('unless false { :yep } else { :nope } end 10'), 10);
  t.equal(e('unless true { :yep } else :nope'), 'nope');
  t.equal(e('unless true { :yep } else :nope 10'), 10);
  t.equal(e('unless true { :yep } else :nope end'), 'nope');
  t.equal(e('unless true { :yep } else :nope end 10'), 10);
  t.equal(e('unless true then :yep else { :nope }'), 'nope');
  t.equal(e('unless true then :yep else { :nope } 10'), 10);
  t.equal(e('unless true then :yep else { :nope } end'), 'nope');
  t.equal(e('unless true then :yep else { :nope } end 10'), 10);
});

// q.todo('unparse', t => { t.expect(0); });
// q.todo('upper', t => { t.expect(0); });
// q.todo('valid', t => { t.expect(0); });
// q.todo('validate', t => { t.expect(0); });
// q.todo('values', t => { t.expect(0); });
// q.todo('with', t => { t.expect(0); });
