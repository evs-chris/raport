import { css, template } from 'views/Editor';

import Ractive, { InitOpts } from 'ractive';

import { parse, parseTemplate } from 'raport/index';

import autosize from './autosize';

const notSpace = /[^\s]/;
const initSpace = /^(\s*).*/;

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
        if (this.get('tabout')) {
          if (txt.length === 0) return true;
          if (!ev.shiftKey && notSpace.test(txt.substring(idx === -1 ? 0 : idx, pos[0]))) return true;
        }
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
    } else if (ev.key === 'Enter') {
      const n: HTMLTextAreaElement = ev.target as any;
      let txt = n.value;
      let pos = [n.selectionStart, n.selectionEnd];
      let idx = txt.lastIndexOf('\n');

      const line = txt.substring(~idx ? idx + 1 : 0, pos[0]);
      const space = line.replace(initSpace, '$1');
      
      txt = txt.substr(0, pos[0]) + '\n' + space + txt.substr(pos[1]);
      n.selectionStart = n.selectionEnd = pos[0] + space.length + 1;

      n.value = txt;
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
  attributes: ['src', 'template', 'tabout', 'primary'],
});

export class Viewer extends Ractive {
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
}

Ractive.extendWith(Viewer, {
  template: { v: template.v, t: template.p.viewer }, cssId: 'raport-ast-view',
  css: css + `
  pre { margin: 0; white-space: pre-wrap; }
  .syntax-editor code { padding: 0; }
  .syntax-editor { max-height: 100%; overflow: auto; }
  `,
  partials: {
    'ast-node': template.p['ast-node'],
  },
  observe: {
    'src template'() {
      this.highlightSyntax();
    },
  },
  attributes: ['src', 'template'],
});

