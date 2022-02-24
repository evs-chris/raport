import { css, template } from 'views/Editor';

import Ractive, { InitOpts } from 'ractive';

import { parse, parseTemplate } from 'raport/index';

import autosize from './autosize';

import { debounce } from './Report'

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
    if (!this.rendered) return;
    const pre = this.find('pre');
    if (pre) this.set('lines', breakLines(expr, pre.clientWidth));
  }

  keydown(ev: KeyboardEvent) {
    let key = ev.key;
    let shift = ev.shiftKey;

    if (key === 'Backspace') {
      const n: HTMLTextAreaElement = ev.target as any;
      const txt = n.value;
      if (n.selectionStart === n.selectionEnd) {
        const idx = txt.lastIndexOf('\n', n.selectionStart - 1);
        const str = txt.substring(idx > 0 ? idx + 1 : 0, n.selectionStart);
        if (str && !notSpace.test(str) && str.length > 1) {
          key = 'Tab';
          shift = true;
        }
      }
    }

    if (key === 'Home') {
      const n: HTMLTextAreaElement = ev.target as any;
      const txt = n.value;
      if (n.selectionStart) {
        const idx = txt.lastIndexOf('\n', n.selectionStart - 1);
        let line = txt.substring(idx > 0 ? idx + 1 : 0, n.selectionStart);

        let space = line.replace(initSpace, '$1');
        if (!line || notSpace.test(line)) {
          if (!line) {
            let nidx = line.indexOf('\n', idx);
            if (!~nidx) nidx = txt.length;
            let i = n.selectionStart;
            for (i; i < nidx; i++) if (notSpace.test(txt[i])) break;
            n.selectionStart = i;
          } else {
            n.selectionStart = n.selectionStart - line.length + space.length;
          }
        } else {
          n.selectionStart = n.selectionStart - line.length;
        }

        if (!shift) n.selectionEnd = n.selectionStart;
        return false;
      }
    } else if (key === 'Tab') {
      const n: HTMLTextAreaElement = ev.target as any;
      let txt = n.value;
      let pos = [n.selectionStart, n.selectionEnd];
      let idx: number;

      if (pos[0] === pos[1]) {
        idx = txt.lastIndexOf('\n', pos[0]);
        if (this.get('tabout')) {
          if (txt.length === 0) return true;
          if (!shift && notSpace.test(txt.substring(idx === -1 ? 0 : idx, pos[0]))) return true;
        }
        if (idx === pos[0]) idx = txt.lastIndexOf('\n', idx - 1);
        if (idx === -1) idx = 0;
        else idx += 1
        if (shift) {
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
          if (shift) {
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
          if (shift) {
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
      let idx = txt.lastIndexOf('\n', pos[0] - 1);

      const line = txt.substring(idx >= 0 ? idx + 1 : 0, pos[0]);
      const space = line.replace(initSpace, '$1');
      
      txt = txt.substr(0, pos[0]) + '\n' + space + txt.substr(pos[1]);
      n.value = txt;
      n.selectionStart = n.selectionEnd = pos[0] + space.length + 1;

      n.dispatchEvent(new InputEvent('input'));
      n.dispatchEvent(new InputEvent('change'));
      return false;
    }
  }
}

Ractive.extendWith(Editor, {
  template, css, cssId: 'raport-editor',
  on: {
    init() {
      this.observe('src template', debounce(function() {
        this.highlightSyntax();
      }, 150));
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
    if (!this.rendered) return;
    const pre = this.find('pre');
    if (pre) this.set('lines', breakLines(expr, pre.clientWidth));
  }
}

Ractive.extendWith(Viewer, {
  template: { v: template.v, t: template.p.viewer }, cssId: 'raport-ast-view',
  css: css + `
  pre { margin: 0; white-space: pre-wrap; }
  .syntax-editor code { padding: 0; flex-grow: 1; }
  .syntax-editor { max-height: 100%; overflow: auto; }
  `,
  partials: {
    'ast-node': template.p['ast-node'],
  },
  on: {
    init() {
      this.observe('src template', debounce(function() {
        this.highlightSyntax();
      }, 150));
    },
  },
  attributes: ['src', 'template'],
});

function breakLines(src: string, width: number) {
  if (width < 16) return [];
  const char = (16 * 0.85) * 0.6;
  const count = Math.floor(width / char);
  const res = [];
  const lines = src.split('\n');

  for (let il = 0; il < lines.length; il++) {
    const l = lines[il];
    const vert = Math.ceil(l.length / count);
    res.push(il + 1);
    if (vert > 1) for (let i = 1; i < vert; i++) res.push('');
  }

  return res;
}
