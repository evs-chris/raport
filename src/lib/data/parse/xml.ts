import { Parser, parser as makeParser, opt, repsep, seq, alt, map, readTo, read1To, rep1, rep, str, read, read1, chars } from 'sprunge';

const ws = read(' \r\n\t');
const endTxt = '&<';

const entities = { amp: '&', gt: '>', lt: '<' };
const entity = map(seq(str('&'), str('amp', 'gt', 'lt'), str(';')), ([, which]) => entities[which] || '', 'entity');

const name = read1('abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-_:$', 'name');
const attr = map(seq(name, opt(seq(ws, str('='), ws, alt(name, quoted('"'), quoted("'"))))), ([name, rest]) => ({ name, value: rest ? rest[3] : true }), 'attr');

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

const open = map(seq(str('<'), ws, name, ws, repsep(attr, ws, 'allow'), opt(str('/')), str('>')), ([, , name, , attrs, close]) => ({ open: true, name, attrs, empty: !!close } as Open), 'open');
const close = map(seq(str('</'), ws, name, ws, str('>')), ([, , name]) => ({ close: true, name } as Close), 'close');

const content = map(rep1(alt(read1To(endTxt, true), entity), 'content'), txts => txts.join('').trim());

const stream = rep(alt<string | Open | Close>(open, content, close));

const _parse = makeParser(stream, { trim: true, consumeAll: true, undefinedOnError: true });

function put(target: object, prop: string, value: any) {
  if (prop in target) {
    if (Array.isArray(target[prop])) target[prop].push(value);
    else target[prop] = [target[prop], value];
  } else {
    target[prop] = value;
  }
}

export function parse(str: string, strict?: boolean): any {
  const stack: any[] = [];
  const names: string[] = [];
  const res: any[] = [];
  let content = '';
  const stream = _parse(str) as Array<string | Open | Close>;
  if (!stream || 'error' in stream) return undefined;

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
      if (strict && p.name !== names[names.length - 1]) return;
      close(p.name);
    }
  }

  if (names.length && !strict) close(names[0]);

  return res.length > 1 ? res : res.length === 1 ? res[0] : undefined;
}
