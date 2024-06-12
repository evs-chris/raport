(function (index, Ractive) {
  'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var Ractive__default = /*#__PURE__*/_interopDefaultLegacy(Ractive);

  const escRE = /[<>&]/g;
  const escapes = { '<': '&lt;', '>': '&gt;', '&': '&amp;' };
  class App extends Ractive__default['default'] {
      constructor(opts) {
          super(opts);
      }
      diff(left, right) {
          const l = this.parse(left);
          const lcsv = this.get('csv');
          const r = this.parse(right);
          const rcsv = this.get('csv');
          this.set('hasCSV', lcsv || rcsv);
          const diff = index.evaluate({ left: l, right: r }, 'diff(left right)');
          const res = {};
          for (const k in diff)
              res[k.replace(/^v\./, '')] = diff[k];
          return res;
      }
      parse(val) {
          var _a;
          this.set('csv', false);
          if (!val)
              return;
          if (val[0] === '<')
              return index.evaluate({ val }, 'parse(val xml:1)');
          const res = (_a = index.evaluate({ val }, 'parse(val)')) === null || _a === void 0 ? void 0 : _a.v;
          if (res === undefined || Object.keys(res).length === 1 && res.r && res.r.k) {
              this.set('csv', true);
              return index.evaluate({ val, header: this.get('csvHeader') }, `parse(val csv:1 detect:1 header:header)`);
          }
          return res;
      }
      string(val, comp) {
          if (val === undefined)
              return 'undefined';
          if (comp && val && typeof comp === 'string' && typeof val === 'string') {
              comp = index.evaluate({ val: comp }, `string(val ${this.get('format') || 'raport'}:1)`).replace(escRE, c => escapes[c]);
              val = index.evaluate({ val }, `string(val ${this.get('format') || 'raport'}:1)`).replace(escRE, c => escapes[c]);
              let i = 0;
              for (; i < comp.length && i < val.length; i++)
                  if (val[i] !== comp[i])
                      break;
              return val.slice(0, i) + '<span class=highlight>' + val.slice(i) + '</span>';
          }
          return index.evaluate({ val }, `string(val ${this.get('format') || 'raport'}:1)`);
      }
  }
  Ractive__default['default'].perComponentStyleElements = true;
  Ractive__default['default'].helpers.escapeKey = Ractive__default['default'].escapeKey;
  Ractive__default['default'].extendWith(App, {
      template: `
<div class=differ style="display: flex; width: 100%; height: 100%;">
  <div style="flex-grow: 1; flex-shrink: 0; width: 33%; display: flex; flex-direction: column; position: relative;">
    <label style="position: absolute; left: 1rem; top: 0.4rem; font-size: 0.7em;"><input type=checkbox checked="{{@style.dark}}"> Dark mode?</label>
    <select style="position: absolute; right: 4.2rem; top: 0.4rem;" value="{{leftView}}"><option value="{{undefined}}">text</option><option>tree</option></select>
    <h3>Left</h3>
    {{#if leftView === 'tree'}}
      {{>root @.parse(.left)}}
    {{else}}
      <textarea style="flex-grow: 1;" placeholder="Left value here..." lazy=1000>{{.left}}</textarea>
    {{/if}}
  </div>
  <div style="position: relative; padding: 0.2rem; flex-grow: 1; flex-shrink: 0; width: 33%; display: flex; flex-direction: column; border-color: #aaa; border-style: solid; border-width: 0 1px 0 1px;">
    {{#if ~/leftView === 'tree' || ~/rightView === 'tree'}}<label style="position: absolute; left: 1rem; top: 0.4rem; font-size: 0.7em;"><input type=checkbox checked="{{~/expandAll}}"> Expand all tree nodes?</label>{{/if}}
    <select style="position: absolute; right: 4.2rem; top: 0.4rem;" value="{{format}}"><option value="{{undefined}}">raport</option><option>json</option></select>
    <h3>Diff</h3>
    <pre style="overflow: auto;"><code>
    {{#each @.diff(.left, .right)}}
      <div style="display: flex; flex-wrap: wrap;">
        <div style="width: 100%; margin-top: 0.5rem; border-bottom: 1px solid #999; padding: 0.2rem; font-weight: 600;">{{@key}}</div>
        <div style="width: 50%; padding: 0.5rem; box-sizing: border-box;">{{@.string(this.0)}}</div>
        <div style="width: 50%; padding: 0.5rem; box-sizing: border-box; border-left: 1px dotted #aaa;">{{{@.string(this.1, this.0)}}}</div>
      </div>
    {{/each}}
    </code></pre>
  </div>
  <div style="flex-grow: 1; flex-shrink: 0; width: 33%; display: flex; flex-direction: column; position: relative;">
    {{#if ~/hasCSV}}<label style="position: absolute; left: 1rem; top: 0.4rem; font-size: 0.7em;"><input type=checkbox checked="{{~/csvHeader}}"> CSV Header?</label>{{/if}}
    <select style="position: absolute; right: 4.2rem; top: 0.4rem;" value="{{rightView}}"><option value="{{undefined}}">text</option><option>tree</option></select>
    <h3>Right</h3>
    {{#if rightView === 'tree'}}
      {{>root @.parse(.right)}}
    {{else}}
      <textarea style="flex-grow: 1;" placeholder="Right value here..." lazy=1000>{{.right}}</textarea>
    {{/if}}
  </div>
</div>

{{#partial root}}
  <div class=tree-view>
    {{#if typeof . === 'object'}}<span style="color: #aaa; margin-left: 0.5em;">{{Array.isArray(.) ? '[' : '{'}}</span>{{/if}}
    <div class=root>
      {{>tree .}}
    </div>
    {{#if typeof . === 'object'}}<span style="color: #aaa; margin-left: 0.5em;">{{Array.isArray(.) ? ']' : '}'}}</span>{{/if}}
  </div>
{{/partial}}

{{#partial tree}}
  <div class=tree>
    {{#each .}}
      <div class=node>
        <div class=key title="{{(@keypath + '').replace(/.*\\)\\./, '')}}">{{@key}}<span style="color: #aaa;">:</span>{{#if typeof . === 'object'}}<span style="color: #aaa; margin-left: 0.5em;">{{Array.isArray(.) ? '[' : '{'}}</span>{{/if}}</div>
        {{#unless ~/expandAll}}<div class=expand {{#if typeof . === 'object'}}class-show on-click="@.toggle('expand.' + escapeKey(@keypath))"{{/if}}>{{#if ~/expand[@keypath]}}-{{else}}+{{/if}}</div>{{/unless}}
        <div class=value class-children="typeof . === 'object' && (~/expandAll || ~/expand[@keypath])">
          {{#if typeof . === 'object'}}
            {{#if ~/expandAll || ~/expand[@keypath]}}
              {{>tree .}}
              <span style="color: #aaa; margin-left: 0.5em;">{{Array.isArray(.) ? ']' : '}'}}</span>
            {{else}}
              <div class=type>{{#if Array.isArray(.)}} ]{{else}} }{{/if}}</div>
            {{/if}}
          {{else}}{{@.string(.)}}{{/if}}
        </div>
      </div>
    {{/each}}
  </div>
{{/partial}}
`,
      css(data) {
          return `
h3 { margin: 0.2rem; text-align: center; }
textarea { border: none; outline: none; padding: 0.2rem; }
pre { margin: 0; white-space: pre-wrap; word-break: break-all; }
.tree-view { overflow: auto; flex-grow: 1; }
.tree { margin-left: 0.5em; padding-left: 0.5em; border-left: 1px dotted #aaa; }
.tree:hover { border-left-color: blue; }
.tree .node { white-space: nowrap; }
.tree .key { margin-left: 0.5em; display: inline-block; }
.tree .type { color: #aaa; display: inline-block; }
.tree .value { display: inline-block; vertical-align: top; white-space: pre-wrap; word-break: break-all; }
.tree .children { display: block; }
.tree .expand { display: none; width: 1em; height: 1em; box-sizing: border-box; border: 1px solid #aaa; color: #999; vertical-align: middle; line-height: 0.8em; text-align: center; display: none; cursor: pointer; }
.tree .expand.show { display: inline-block; }
.highlight { background-color: yellow; }
${data('dark') ? `
.differ, textarea { color: #ddd; background-color: #222; }
.tree:hover { border-left-color: cyan; }
.highlight { background-color: darkblue; }` : ''}
`;
      },
      on: {
          init() {
              this.set('@style.dark', matchMedia('(prefers-color-scheme: dark)').matches);
              try {
                  this.set(JSON.parse(window.localStorage.getItem('diff')));
              }
              catch (_a) { }
          }
      },
      observe: {
          'left right format'() {
              window.localStorage.setItem('diff', JSON.stringify({ left: this.get('left'), right: this.get('right'), format: this.get('format') }));
          }
      },
  });
  globalThis.app = new App({
      target: 'body',
  });
  // simple debug helper
  let el;
  document.addEventListener('click', ev => el = ev.target, { capture: true });
  document.addEventListener('focus', ev => el = ev.target, { capture: true });
  Object.defineProperty(globalThis, 'R', {
      value: new Proxy(() => ({}), {
          apply(_obj, _e, args) {
              if (args.length) {
                  let ctx;
                  if (typeof args[0] === 'object' && args[0] instanceof Node)
                      ctx = Ractive__default['default'].getContext(args.shift());
                  else
                      ctx = Ractive__default['default'].getContext(el);
                  if (!ctx)
                      return;
                  if (typeof args[0] === 'string') {
                      if (args.length === 1)
                          return ctx.get(args[0]);
                      else if (args.length === 2)
                          return ctx.set(args[0], args[1]);
                  }
                  else if (typeof args[0] === 'object') {
                      return ctx.set(args[0]);
                  }
                  return ctx;
              }
              else {
                  return Ractive__default['default'].getContext(el).get();
              }
          },
          get(_obj, prop) {
              const ctx = Ractive__default['default'].getContext(el);
              if (!ctx)
                  return;
              if (!(prop in ctx) && prop in ctx.ractive) {
                  const val = ctx.ractive[prop];
                  if (typeof val === 'function')
                      return val.bind(ctx.ractive);
                  return val;
              }
              else {
                  return ctx[prop];
              }
          },
      }),
  });

}(Raport, Ractive));
//# sourceMappingURL=diff.js.map
