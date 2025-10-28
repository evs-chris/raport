import { css, template } from 'views/Editor';

import Ractive, { InitOpts } from 'ractive';

import { parse, parseTemplate } from 'raport/index';

import autosize from './autosize';

import { debounce } from './util'

const notSpace = /[^\r \t]/;
const initSpace = /^([ \t]*).*/;

export class Editor extends Ractive {
  constructor(opts?: InitOpts) {
    super(opts);
  }

  code: HTMLDivElement;

  lock = false;

  highlightSyntax() {
    const expr = this.get('src') || '';
    if (typeof expr !== 'string') return;
    const parser = this.get('template') ? parseTemplate : parse;
    const ast = parser(expr, { tree: true, compact: true } as any);
    this.set('ast', ast);
    if (!this.rendered) return;
    const pre = this.find('code');
    if (pre) this.set('lines', breakLines(expr, pre.clientWidth));
  }

  sync(el: HTMLInputElement) {
    this.lock = true;
    const str = el.innerText.slice(-1) === '\n' ? el.innerText.slice(0, -1) : el.innerText; // strip final \n
    this.set('src', str || '');
    this.lock = false;
  }

  keyup(ev: KeyboardEvent) {
    const key = ev.key;

    if (key === 'Enter') {
      const range = window.getSelection().getRangeAt(0);
      if (range.startContainer !== range.endContainer || range.startOffset !== range.endOffset || (range.startContainer as any).tagName) return;
      let txt = range.startContainer.textContent;
      const start = range.startOffset;
      const end = range.endOffset;
      const idx = txt.lastIndexOf('\n', range.startOffset - 2);
      const line = txt.substring(idx >= 0 ? idx + 1 : 0, end - 1);
      const space = line.replace(initSpace, '$1');
      if (!space || space === '\n') return;
      txt = txt.substring(0, start) + space + txt.substring(end);
      range.startContainer.textContent = txt;
      range.setStart(range.startContainer, start + space.length);
      range.setEnd(range.startContainer, start + space.length);
      this.sync(this.code as HTMLInputElement);
      return false;
    }
  }

  keydown(ev: KeyboardEvent) {
    const key = ev.key;

    if (key === 'Enter') {
      if (ev.ctrlKey || ev.metaKey) {
        this.fire('run');
        return false;
      }
    } else if (key === 'Tab') {
      const shift = ev.shiftKey;
      const range = window.getSelection().getRangeAt(0);
      const start = range.startContainer;
      const idx = range.startOffset;
      let txt = start.textContent;
      const prev = txt.substring(idx - 1, idx);
      const next = idx === txt.length ? start.nextSibling : txt.substring(idx, idx + 1);
      if (!shift && (next === '\n' && !notSpace.test(prev) || !next && txt.length)) return true;
      if (range.startOffset === range.endOffset && range.startContainer === range.endContainer) {
        if ((start as any).tagName) {
          if (start.childNodes.length - 1 !== idx) {
            var space = document.createTextNode('  ');
            start.insertBefore(space, start.childNodes[idx]);
            range.setStart(space, 2);
            range.setEnd(space, 2);
            this.sync(this.code as HTMLInputElement);
          }
        } else {
          if (shift) {
            if (txt.slice(idx - 2, idx) === '  ') {
              start.textContent = txt.substring(0, idx - 2) + txt.substring(idx);
              range.setStart(start, idx - 2);
              range.setEnd(start, idx - 2);
              this.sync(this.code as HTMLInputElement);
            }
          } else {
            start.textContent = txt.substring(0, idx) + '  ' + txt.substring(idx);
            range.setStart(start, idx + 2);
            range.setEnd(start, idx + 2);
            this.sync(this.code as HTMLInputElement);
          }
        }
      }
      ev.preventDefault();
      return false;
    } else if (key === 'Home') {
      const range = window.getSelection().getRangeAt(0);
      let txt = range.startContainer.textContent;
      let start = range.startOffset;
      const init = start;
      const end = range.endOffset;
      const idx = txt.lastIndexOf('\n', range.startOffset - 1);
      start = idx >= 0 ? idx + 1 : 0;
      const first = start;
      for (let i = start; i < txt.length; i++) if (notSpace.test(txt[i])) { start = i; break; }
      if (init <= start) {
        range.setStart(range.startContainer, first);
        if (init === end) range.setStart(range.startContainer, first);
      } else {
        range.setStart(range.startContainer, start);
        if (init === end) range.setStart(range.startContainer, start);
      }
      return false;
    }
  }
}

Ractive.extendWith(Editor, {
  template, css, cssId: 'raport-editor',
  on: {
    init() {
      this.observe('src template', debounce(function () {
        this.highlightSyntax();
      }, 150));
    },
    render() {
      this.code = this.findAll('code')[1] as any;
      if (this.code && !this.lock) this.code.innerText = this.get('src') || '';
    },
  },
  observe: {
    src(v: string) {
      if (this.code && !this.lock) this.code.innerText = v || '';
    },
  },
  decorators: { autosize },
  attributes: ['src', 'template', 'tabout', 'primary', 'no-fill'],
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
    const pre = this.find('code');
    if (pre) this.set('lines', breakLines(expr, pre.clientWidth));
  }
}

Ractive.extendWith(Viewer, {
  template: { v: template.v, t: template.p.viewer }, cssId: 'raport-ast-view',
  css,
  cssData: {
    extra: `
      pre { margin: 0; white-space: pre-wrap; font-size: 0.875rem; }
      .syntax-editor code { padding: 0; flex-grow: 1; }
      .syntax-editor { max-height: 100%; overflow: auto; }
      .syntax-editor code { font-size: inherit; line-height: 1rem; }
      `,
  },
  partials: {
    'ast-node': template.p['ast-node'],
  },
  on: {
    init() {
      this.observe('src template', debounce(function () {
        this.highlightSyntax();
      }, 350));
    },
  },
  attributes: ['src', 'template'],
});

function breakLines(src: string, width: number) {
  if (width < 16) return [];
  const char = 8.4;
  const count = width / char;
  const res = [];
  const lines = src.split('\n');

  for (let il = 0; il < lines.length; il++) {
    const l = lines[il];
    const base = l.length / count;
    let vert = Math.ceil(base);
    let factor = (width - Math.floor(width / char) * char) / char;
    if (factor < 0.2) factor = 0.5;
    vert = Math.ceil(base + (vert * factor) / count);
    res.push(il + 1);
    if (vert > 1) for (let i = 1; i < vert; i++) res.push('');
  }

  return res;
}

const _highlight = new Ractive({ template: { v: template.v, t: [{ t: 8, r: 'ast-node', c: { r: 'ast' } }], p: { 'ast-node': template.p['ast-node'] } } });
export function highlight(src: string): string {
  const ast = parse(src, { tree: true, compact: true }) as any;
  ast.name = 'ast-nodes';
  _highlight.set({ ast, src });
  return _highlight.toHTML();
}
