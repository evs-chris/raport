import './data/basic';

import './data/parse';

import './data/ops/checked';
import './data/ops/value';
import './data/ops/builtin';
import './data/ops/date';

const q = QUnit;

q.extend(q.assert, {
  matches(this: Assert, value: any, target: string | RegExp, message?: string) {
    if (typeof target === 'string') {
      if (!(new RegExp(target)).test(value)) {
        this.pushResult({
          result: false,
          actual: value,
          expected: target,
          message: message || `expected to match '${target}'`
        });
        return;
      }
    } else if (target && typeof target.test === 'function') {
      if (!target.test(value)) {
        this.pushResult({
          result: false,
          actual: value,
          expected: target,
          message: message || `expected to match '${target}'`
        });
        return;
      }
    }
    this.pushResult({
      result: true,
      actual: value,
      expected: target,
      message: 'ok'
    });
  }
});

declare global {
  interface Assert {
    matches(value: any, target: string | RegExp, message?: string): void;
  }
}
