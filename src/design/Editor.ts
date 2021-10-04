import { css, template } from 'views/Editor';

import Ractive, { InitOpts } from 'ractive';

import { parse, parseTemplate } from 'raport/index';

import autosize from './autosize';

export class Editor extends Ractive {
  constructor(opts?: InitOpts) {
    super(opts);
  }

  highlightSyntax() {
    const expr = this.get('src');
    const parser = this.get('template') ? parseTemplate : parse;
    const ast = parser(expr, { tree: true, compact: true } as any);
    this.set('ast', ast);
  }
}

Ractive.extendWith(Editor, {
  template, css, cssId: 'raport-editor',
  observe: {
    src() {
      this.highlightSyntax();
    },
  },
  decorators: { autosize },
});

