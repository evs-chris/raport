import { Parser, parser as makeParser, opt, repsep, seq, alt, map, readTo, readToParser, read1To, rep1, rep, str, read, read1, chars } from 'sprunge';

const ws = read(' \r\n\t');
const endTxt = '&<';

const entities = { amp: '&', gt: '>', lt: '<' };
const entity = map(seq(str('&'), str('amp', 'gt', 'lt'), str(';')), ([, which]) => entities[which] || '', 'entity');

const name = read1('abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-_:$', 'name');
const attr = map(seq(name, opt(seq(ws, str('='), ws, alt(name, quoted('"'), quoted("'"))))), ([name, rest]) => ({ name, value: rest ? rest[3] : true }), 'attr');
const content = map(rep1(alt(read1To(endTxt, true), entity), 'content'), txts => txts.join('').trim());
const comment = map(seq(str('<!--'), readToParser('-', str('-->')), str('-->')), ([, text]) => ({ text }));
const cdata = map(seq(str('<![CDATA['), readToParser(']', str(']]>')), str(']]>')), ([, chars]) => chars);

function quoted(quote: string) {
  return map(seq(str(quote), readTo(quote), str(quote)), ([, str]) => str);
}

interface Attr {
  name: string;
  value: string | boolean;
}

interface Open {
  open: true;
  name: string;
  attrs?: Attr[];
  empty?: boolean;
}

interface Close {
  close: true;
  name: string;
}

interface DECL {
  name: string;
  attrs?: Attr[];
}

export interface Comment {
  text: string;
}

export interface Decl {
  name: string;
  attributes: Attribute[];
}

export interface Document {
  decl?: Decl;
  root: Element;
}

export interface Attribute {
  ns?: string;
  name: string;
  tag?: string;
  value: string;
}

interface OpenEl {
  open: true;
  el: Element;
  close: boolean;
}

interface CloseEl {
  close: true;
  ns?: string;
  name: string;
  tag?: string;
}

export interface Element {
  ns?: string;
  name: string;
  tag?: string;
  attributes?: Attribute[];
  children?: Array<Element|Comment|string>;
}

const parseJson = (function() {
  const decl = map(seq(str('<?'), name, ws, repsep(attr, ws, 'allow'), ws, str('?>')), ([, name,, attrs]) => ({ name, attrs }));

  const open = map(seq(str('<'), ws, name, ws, repsep(attr, ws, 'allow'), opt(str('/')), str('>')), ([, , name, , attrs, close]) => ({ open: true, name, attrs, empty: !!close } as Open), 'open');
  const close = map(seq(str('</'), ws, name, ws, str('>')), ([, , name]) => ({ close: true, name } as Close), 'close');

  const stream = rep(alt<string|Open|Close|DECL|Comment>(comment, decl, cdata, open, content, close));

  return makeParser(stream, { trim: true, consumeAll: true, undefinedOnError: true });
})();

const parseDoc = (function() {
  const _attr = map(attr, (a: any) => {
    if (~a.name.indexOf(':')) {
      a.tag = a.name;
      [a.ns, a.name] = a.tag.split(':');
    }
    return a;
  });
  const decl = map(seq(str('<?'), name, ws, repsep(_attr, ws, 'allow'), ws, str('?>')), ([, name,, attributes]) => ({ name, attributes } as Decl));

  const open = map(seq(str('<'), ws, name, ws, repsep(_attr, ws, 'allow'), opt(str('/')), str('>')), ([,, name, , attributes, close]) => {
    const el: Element = { name };
    if (attributes.length) el.attributes = attributes;
    if (~el.name.indexOf(':')) {
      el.tag = el.name;
      [el.ns, el.name] = el.tag.split(':');
    }
    return { close: !!close, open: true, el } as OpenEl;
  }, 'open');
  const close = map(seq(str('</'), ws, name, ws, str('>')), ([,, name]) => {
    const a: CloseEl = { close: true, name };
    if (~a.name.indexOf(':')) {
      a.tag = a.name;
      [a.ns, a.name] = a.tag.split(':');
    }
    return a;
  }, 'close');

  const stream = rep(alt<string|OpenEl|CloseEl|Decl|Comment>(comment, decl, cdata, open, content, close));

  return makeParser(stream, { trim: true, consumeAll: true, undefinedOnError: true });
})();

function put(target: object, prop: string, value: any) {
  if (prop in target) {
    if (Array.isArray(target[prop])) target[prop].push(value);
    else target[prop] = [target[prop], value];
  } else {
    target[prop] = value;
  }
}

export function parse(str: string, strict?: boolean): any;
export function parse(str: string, opts: { result: 'doc'; strict?: boolean }): Document|undefined;
export function parse(str: string, opts?: boolean|{ result: 'doc'|'json'; strict?: boolean }): any {
  const o: { result: 'doc'|'json', strict?: boolean } = typeof opts === 'boolean' ? { result: 'json', strict: opts } : (opts || { result: 'json' });

  if (o.result === 'doc') {
    const stack: Element[] = [];
    let top: Element;
    const stream = parseDoc(str) as Array<string | OpenEl | CloseEl | Decl | Comment>;
    let content = '';
    const doc: Document = { root: undefined };

    for (const n of stream) {
      if (typeof n === 'string') {
        if (n) content += n;
      } else if ('open' in n) {
        const el = n.el;
        if (top) {
          if (!top.children) top.children = [];
          if (content) {
            top.children.push(content);
            content = '';
          }
          top.children.push(el);
        } else {
          if (o.strict && doc.root) return;
          doc.root = el;
        }
        stack.push(el);
        top = el;
      } else if ('close' in n) {
        if (top && content) {
          if (!top.children) top.children = [];
          top.children.push(content);
        }
        content = '';
        if ((top.tag || top.name) === (n.tag || n.name)) {
          stack.pop();
        } else {
          if (o.strict) return;
          if (~stack.slice().reverse().find(t => (t.tag || t.name) === (n.tag || n.name))) {
            let t: Element;
            while (t = stack.pop()) {
              if ((n.tag || n.name) === (t.tag || t.name)) break;
            }
          }
        }
        top = stack[stack.length - 1];
      } else if ('name' in n) {
        doc.decl = n;
      } else {
        if (top) {
          if (!top.children) top.children = [];
          top.children.push(n);
        }
      }
    }

    if (stack.length > 1 && o.strict) return;

    return doc;
  } else {
    const stack: any[] = [];
    const names: string[] = [];
    const res: any[] = [];
    let content = '';
    const stream = parseJson(str) as Array<string | Open | Close | DECL | Comment>;
    if (!stream) return;

    function close(end: string) {
      const val = stack.pop();
      if (!val) return;
      const name = names.pop();
      if (!stack.length) {
        res.push(val);
      } else {
        if (!Object.keys(val).length) put(stack[stack.length - 1], name, content || '');
        else put(stack[stack.length - 1], name, val);
      }
      if (end !== name) close(end);
    }

    for (const p of stream) {
      if (typeof p === 'string') {
        if (p) content += p;
      } else if ('open' in p) {
        content = '';
        const val = p.attrs.reduce((a, c) => (put(a, c.name, c.value), a), {});
        if (p.empty) {
          if (stack.length) put(stack[stack.length - 1], p.name, val);
          else res.push(val);
        } else {
          names.push(p.name);
          stack.push(val);
        }
      } else if ('close' in p) {
        if (o.strict && p.name !== names[names.length - 1]) return;
        close(p.name);
      }
    }

    if (names.length && !o.strict) close(names[0]);

    return res.length > 1 ? res : res.length === 1 ? res[0] : undefined;
  }
}
