import { xmlish, XMLishToken, Attribute } from './xml';
import { mustache, Mustache } from './template';
import { Value, Operation } from '../../index';
import { parser as makeParser, ParseOptions, ParseError } from 'sprunge';

const _parse = makeParser(xmlish('{', mustache), { trim: true });

function ostr(op: Operation, str: string) {
  const args = op.args || (op.args = []);
  const arg = args[args.length - 1];
  if (typeof arg === 'object' && 'v' in arg && typeof arg.v === 'string') arg.v += str;
  else args.push({ v: str });
}
export function parseXmlTemplate(str: string, opts?: ParseOptions): ParseError | Value {
  const stream = _parse(str, opts);
  if (stream && !('message' in stream)) {
    const bits = [stream as Array<Attribute<Mustache>|XMLishToken<Mustache>>];
    const stack: Array<Attribute<Mustache>|XMLishToken<Mustache>> = [];
    const poss = [0];
    let pos = poss[0];
    let bit = bits[pos];
    const out: Operation = { op: '+', args: [] };
    let ops = [out];
    let op = out;

    for (let i = 0; i < bit.length; i++) {
      const n = bit[i];

      if (n.t === 'text') op.args.push({ v: n.s });
      else if (n.t === 'mvalue') op.args.push(n.v);
      else if (n.t === 'open') {
        ostr(op, `<${n.p ? `${n.p}:${n.n}` : n.n}`);
        if (n.a) {
          stack.unshift(n);
          // TODO: shift in stuff to run attributes
        }
      } else if (n.t === 'close') {
        // TODO: check tag and possibly close multiple things
        //       or error?
        ostr(op, `</${n.p ? `${n.p}:${n.n}` : n.n}>`);
      } else if (n.t === 'attribute') {
      } else if (n.t === 'cdata') {
      }

      if (i + 1 === bit.length) {
        // unshift the things and reset i
        // possibly also close open tag?
      }
    }

    return out;
  } else {
    return stream as ParseError;
  }
}
