import { evaluate } from 'raport/index';
import Ractive, { InitOpts, ContextHelper } from 'ractive';

const escRE = /[<>&]/g;
const escapes = { '<': '&lt;', '>': '&gt;', '&': '&amp;' };

class App extends Ractive {
  constructor(opts?: InitOpts) {
    super(opts);
  }

  diff(left: string, right: string) {
    const diff = evaluate({ left, right }, 'diff(parse(left) parse(right))')
    const res = {} as any;
    for (const k in diff) res[k.substr(2)] = diff[k];
    return res;
  }

  string(val: any, comp?: any) {
    if (val === undefined) return 'undefined';
    if (comp && val && typeof comp === 'string' && typeof val === 'string') {
      comp = evaluate({ val: comp }, `string(val ${this.get('format') || 'raport'}:1)`).replace(escRE, c => escapes[c]);
      val = evaluate({ val }, `string(val ${this.get('format') || 'raport'}:1)`).replace(escRE, c => escapes[c]);
      let i = 0;
      for (; i < comp.length && i < val.length; i++) if (val[i] !== comp[i]) break;
      return val.slice(0, i) + '<span style="background-color: yellow;">' + val.slice(i) + '</span>';
    }
    return evaluate({ val }, `string(val ${this.get('format') || 'raport'}:1)`);
  }
}

Ractive.perComponentStyleElements = true;

Ractive.extendWith(App, {
  template: `
<div style="display: flex; width: 100%; height: 100%;">
  <div style="flex-grow: 1; flex-shrink: 0; width: 33%; display: flex; flex-direction: column;">
    <h3>Left</h3>
    <textarea style="flex-grow: 1;" placeholder="Left value here...">{{.left}}</textarea>
  </div>
  <div style="position: relative; padding: 0.2rem; flex-grow: 1; flex-shrink: 0; width: 33%; display: flex; flex-direction: column; border-color: #eee; border-style: solid; border-width: 0 1px 0 1px;">
    <select style="position: absolute; right: 4.2rem; top: 0.4rem;" value="{{format}}"><option value="{{undefined}}">raport</option><option>json</option></select>
    <h3>Diff</h3>
    <pre style="overflow: auto;"><code>
    {{#each @.diff(.left, .right)}}
      <div style="display: flex; flex-wrap: wrap;">
        <div style="width: 100%; margin-top: 0.5rem; border-bottom: 1px solid #eee; padding: 0.2rem; font-weight: 600;">{{@key}}</div>
        <div style="width: 50%; padding: 0.5rem; box-sizing: border-box;">{{@.string(this.0)}}</div>
        <div style="width: 50%; padding: 0.5rem; box-sizing: border-box;">{{{@.string(this.1, this.0)}}}</div>
      </div>
    {{/each}}
    </code></pre>
  </div>
  <div style="flex-grow: 1; flex-shrink: 0; width: 33%; display: flex; flex-direction: column;">
    <h3>Right</h3>
    <textarea style="flex-grow: 1;" placeholder="Right value here...">{{.right}}</textarea>
  </div>
</div>
`,
  css: `
h3 { margin: 0.2rem; text-align: center; }
textarea { border: none; outline: none; padding: 0.2rem; }
pre { margin: 0; white-space: pre-wrap; word-break: break-all; }
`,
  on: {
    init() {
      try {
        this.set(JSON.parse(window.localStorage.getItem('diff')));
      } catch {}
    }
  },
  observe: {
    'left right format'() {
      window.localStorage.setItem('diff', JSON.stringify({ left: this.get('left'), right: this.get('right'), format: this.get('format') }));
    }
  },
});

const app = globalThis.app = new App({
  target: 'body',
});

// simple debug helper
let el: any;
document.addEventListener('click', ev => el = ev.target, { capture: true });
document.addEventListener('focus', ev => el = ev.target, { capture: true });

Object.defineProperty(globalThis, 'R', {
  value: new Proxy(() => ({}), {
    apply(_obj, _e, args) {
      if (args.length) {
        let ctx: ContextHelper;
        if (typeof args[0] === 'object' && args[0] instanceof Node) ctx = Ractive.getContext(args.shift());
        else ctx = Ractive.getContext(el);
        if (!ctx) return;
        if (typeof args[0] === 'string') {
          if (args.length === 1) return ctx.get(args[0]);
          else if (args.length === 2) return ctx.set(args[0], args[1]);
        } else if (typeof args[0] === 'object') {
          return ctx.set(args[0]);
        }
        return ctx;
      } else {
        return Ractive.getContext(el).get();
      }
    },
    get(_obj, prop) {
      const ctx = Ractive.getContext(el);
      if (!ctx) return;
      if (!(prop in ctx) && prop in ctx.ractive) {
        const val = ctx.ractive[prop];
        if (typeof val === 'function') return val.bind(ctx.ractive);
        return val;
      } else {
        return ctx[prop];
      }
    },
  }),
});
