import { Delimited, Page, DataSet, PageSizes, parse, parseTemplate, stringify } from 'raport/index';
import { ReportDesigner, highlight } from 'design/index';
import Ractive, { InitOpts, ContextHelper } from 'ractive';
import sample from './sample';

globalThis.highlight = highlight;

class App extends Ractive {
  delimited: Delimited;
  paged: Page;
  report: ReportDesigner;

  constructor(opts?: InitOpts) {
    super(opts);
  }
}

Ractive.perComponentStyleElements = true;

Ractive.extendWith(App, {
  template: '#template',
  data() {
    return {
      sources: [{ name: 'sample', values() { return Promise.resolve(sample()); } }],
      sample,
    }
  },
  components: {
    report: ReportDesigner,
  },
  on: {
    'report.running'() {
      console.time('run');
    },
    'report.run'() {
      console.timeEnd('run');
    },
    init() {
      setTimeout(() => {
        const json = window.sessionStorage.getItem('load') || '{}';
        try {
          const load = JSON.parse(json);
          if (load.project) {
            const pjs = this.report.get('projects') || [];
            const pj = pjs.findIndex(p => p.name === load.project);
            if (~pj) this.report.linkProject(`projects.${pj}`);
          }
          if (load.report) this.report.set('report', load.report);
          if (load.expr) this.report.set('temp.expr.str', load.expr);
          this.report.set('show.bottom', load.bottom);
          this.report.set('max.bottom', load.max);
          this.set('loaded', true);
        } catch {}
      }, 500);
      window.addEventListener('beforeunload', () => {
        if (this.get('loaded') && this.report) {
          const load: any = { report: this.report.get('report'), bottom: this.report.get('show.bottom'), max: this.report.get('max.bottom'), project: this.report.get('project.name') };
          if (!this.report.get('temp.expr.path')) load.expr = this.report.get('temp.expr.str');
          window.sessionStorage.setItem('load', JSON.stringify(load));
        } else {
          window.sessionStorage.clear();
        }
      });
    },
  }
});

const app = globalThis.app = new App({
  target: 'body',
});
(app as any).parse = parse;
(app as any).parseTemplate = parseTemplate;
(app as any).stringify = stringify;

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
