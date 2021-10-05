import { css, template } from 'views/Editor';

import Ractive, { InitOpts } from 'ractive';

import { parse, parseTemplate } from 'raport/index';

import autosize from './autosize';

export class Editor extends Ractive {
  constructor(opts?: InitOpts) {
    super(opts);
  }

  highlightSyntax() {
    const expr = this.get('src') || '';
    if (typeof expr !== 'string') return;
    const parser = this.get('template') ? parseTemplate : parse;
    const ast = parser(expr, { tree: true, compact: true } as any);
    this.set('ast', ast);
  }

  keydown(ev: KeyboardEvent) {
    if (ev.key === 'Tab') {
      const n: HTMLTextAreaElement = ev.target as any;
      let txt = n.value;
      let pos = [n.selectionStart, n.selectionEnd];
      let idx: number;

      if (pos[0] === pos[1]) {
        idx = txt.lastIndexOf('\n', pos[0]);
        if (idx === pos[0]) idx = txt.lastIndexOf('\n', idx - 1);
        if (idx === -1) idx = 0;
        else idx += 1
        if (ev.shiftKey) {
          if (txt.substr(idx, 2) === '  ') {
            txt = txt.substring(0, idx) + txt.substr(idx + 2);
            pos[0] = pos[0] - 2;
            pos[1] = pos[1] - 2;
          }
        } else {
          txt = txt.substring(0, idx) + '  ' + txt.substr(idx);
          pos[0] = pos[0] + 2;
          pos[1] = pos[1] + 2;
        }
      } else {
        idx = txt.lastIndexOf('\n', n.selectionEnd);
        if (idx === pos[0] && idx == pos[1]) idx = txt.lastIndexOf('\n', idx - 1);
        for (; ~idx && idx > n.selectionStart;) {
          if (ev.shiftKey) {
            if (txt.substr(idx + 1, 2) === '  ') {
              txt = txt.substring(0, idx + 1) + txt.substr(idx + 3);
              pos[1] = pos[1] - 2;
            }
          } else {
            txt = txt.substring(0, idx + 1) + '  ' + txt.substr(idx + 1);
            pos[1] = pos[1] + 2;
          }
          idx = txt.lastIndexOf('\n', idx - 1);
        }
        idx = txt.lastIndexOf('\n', n.selectionStart);
        if (!~idx) idx = 0;
        else idx += 1;
        if (~idx) {
          if (ev.shiftKey) {
            if (txt.substr(idx, 2) === '  ') {
              txt = txt.substring(0, idx) + txt.substr(idx + 2);
              pos[0] = pos[0] - 2;
              pos[1] = pos[1] - 2;
            }
          } else {
            txt = txt.substring(0, idx) + '  ' + txt.substr(idx);
            pos[0] = pos[0] + 2;
            pos[1] = pos[1] + 2;
          }
        }
      }

      n.value = txt;
      n.selectionStart = pos[0];
      n.selectionEnd = pos[1];

      n.dispatchEvent(new InputEvent('input'));
      n.dispatchEvent(new InputEvent('change'));
      return false;
    }
  }
}

Ractive.extendWith(Editor, {
  template, css, cssId: 'raport-editor',
  observe: {
    'src template'() {
      this.highlightSyntax();
    },
  },
  decorators: { autosize },
});

