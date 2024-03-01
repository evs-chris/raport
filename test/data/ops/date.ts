import { evaluate } from '../../../src/lib/index';
const q = QUnit;

q.module('data/ops/date');

q.test('shifting time', t => {
  // take a date and shift it into a new timezone e.g. -5 to 0, where the date is effective the same
  t.equal(evaluate({ dt: '2022-12-21 14:44-5' }, 'date(dt 0 rel:1 shift:1)#timestamptz'), '2022-12-21 19:44:00+00:00');
  // take a date and set its timezone without shifting, so it effectively changes by the timezone offset
  t.equal(evaluate({ dt: '2022-12-21 14:44-5' }, 'date(dt 0 rel:1)#timestamptz'), '2022-12-21 14:44:00+00:00');
});

q.test('time-span in days with misaligned months', t => {
  t.equal(evaluate(`time-span(#2020-02-29 12:00# #2020-04-01 12:00# unit::d)`), 32);
  t.equal(evaluate(`time-span(#2020-01-31# #2020-02-29# unit::d)`), 29);
});

q.test('add months', t => {
  t.equal(evaluate(`(#2020-01-31# + #1m#)#date`), '2020-02-29');
});
