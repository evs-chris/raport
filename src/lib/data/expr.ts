import { Value, Operation } from "./index";

type Result<T> = Ok<T>|Fail<T>;
type Ok<T> = [T];
type Fail<T> = [];
const Fail: Fail<never> = [];

function seekUntil(input: string, offset: number, target: string, end: boolean): Result<number> {
  for (let i = offset; i < input.length; i++) {
    if (~target.indexOf(input[i])) return [i - offset];
  }
  return end ? [input.length - offset] : Fail;
}

function seekWhile(input: string, offset: number, target: string): Ok<number> {
  let i = offset;
  for (; i < input.length && ~target.indexOf(input[i]); i++) {}
  return [i - offset];
}

function readUntil(input: string, offset: number, target: string, end: boolean = false): Result<string> {
  const res = seekUntil(input, offset, target, end);
  if (res === Fail) return Fail;
  return [input.substr(offset, res[0])];
}

function readWhile(input: string, offset: number, target: string): Ok<string> {
  const res = seekWhile(input, offset, target);
  return [input.substr(offset, res[0])];
}

type ParseResult<T> = Parsed<T>|Fail<T>;
type Parsed<T> = [T, number];

type Literal = { v: object|boolean|string|any[]|number|undefined|null|RegExp };
function readLiteral(input: string, offset: number): ParseResult<Literal> {
  if (input.substr(offset, 4) === 'true') return [{ v: true }, 4];
  if (input.substr(offset, 4) === 'null') return [{ v: null }, 4];
  if (input.substr(offset, 5) === 'false') return [{ v: false }, 5];
  if (input.substr(offset, 9) === 'undefined') return [{ v: undefined }, 9];
  
  let p: ParseResult<Literal>;
  const fns = [readNumber, readString];
  for (let i = 0; i < fns.length; i++) {
    p = fns[i](input, offset);
    if (p !== Fail) return p;
  }

  return Fail;
}

const digit = '_0123456789';
const underscores = /_/g;
function readNumber(input: string, offset: number): ParseResult<{ v: number }> {
  let c = offset;
  let num = '';

  if (input[c] === '-') {
    num += '-';
    c++;
  }

  let p = readWhile(input, c, digit);
  if (!p[0].length) return Fail;
  c += p[0].length;
  num += p[0].replace(underscores, '');

  if (input[c] === '.') {
    c++;
    p = readWhile(input, c, digit);
    if (p[0].length) {
      num += `.${p[0].replace(underscores, '')}`
    }
    c+= p[0].length;
  }

  return [{ v: parseFloat(num) }, c - offset];
}

const escapes = { b: '\b', f: '\f', n: '\n', r: '\r', t: '\t', v: '\v', 0: '\0' };
const space = ' \r\n\t';
const hex = '0123456789abcdefABCDEF';
function readString(input: string, offset: number): ParseResult<{ v: string }> {
  const q = input[offset];
  let p: Result<string>;
  let c = offset + 1;
  if (q !== '\'' && q !== '"' && q !== '`' && q !== ':') return Fail;
  if (q === ':') {
    p = readUntil(input, c, space, true);
    if (p === Fail) {
      if (space.indexOf(input[c])) return [{ v: '' }, 1];
      return Fail;
    }
    c += p[0].length;
    return [{ v: p[0] }, c - offset];
  } else {
    let str = '';
    const pt = '\\' + q;
    while (p = readUntil(input, c, pt)) {
      if (p === Fail) return p;
      str += p[0];
      c += p[0].length;
      if (input[c] === q) return [{ v: str }, ++c - offset];
      if (input[c] === '\\') {
        c++
        const n = input[c++];
        if (n in escapes) str += escapes[n];
        else if (n === 'x') {
          const x = input[c] + input[c + 1];
          if (~hex.indexOf(x[0]) && ~hex.indexOf[1]) {
            str += String.fromCharCode(parseInt(x, 16));
            c += 2;
          } else return Fail;
        } else if (n === 'u') {
          const u = input.substr(c, 4);
          for (let i = 0; i < 4; i++) if (!~hex.indexOf(u[i])) return Fail;
          str += String.fromCharCode(parseInt(u, 16));
          c += 4;
        } else str += n;
      }
    }
  }
}

const endRef = space + ',.(){}[]"\':';
function readReference(input: string, offset: number): ParseResult<string[]> {
  let p = readUntil(input, offset, endRef, true);
  if (p === Fail) return Fail;

  let c = offset + p[0].length;
  const res = [p[0]];

  while (input[c] === '.') {
    p = readUntil(input, ++c, endRef, true);
    if (p === Fail) return p;
    if (p[0].length === 0) return Fail;
    res.push(p[0]);
    c += p[0].length;
  }

  return [res, c - offset];
}

export function parse(input: string): Value {
  input = input.trim();
  const p = readValue(input, 0);

  if (p === Fail || p[1] !== input.length) return { v: '' };
  return p[0];
}

function readValue(input: string, offset: number): ParseResult<Value> {
  let p: ParseResult<any>;

  p = readOperation(input, offset);
  if (p !== Fail) return p;
  
  p = readLiteral(input, offset);
  if (p !== Fail) return p;;

  p = readReference(input, offset);
  if (p !== Fail) return [{ r: p[0].join('.') }, p[1]];

  return Fail;
}

const listSep = ',' + space;
function readList<T>(input: string, offset: number, parser: (input: string, offset: number) => ParseResult<T>): ParseResult<T[]> {
  const res: T[] = [];
  let p: ParseResult<T>;
  let c = offset;

  p = parser(input, c);
  if (p === Fail) return [res, 0];
  res.push(p[0]);
  c += p[1];

  let t = 0;
  t = seekWhile(input, c, listSep)[0];

  let cont = t > 0;
  c += t;

  while (cont) {
    p = parser(input, c);
    if (p === Fail) return Fail;
    res.push(p[0]);
    c += p[1];

    t = seekWhile(input, c, listSep)[0];
    if (t < 1) cont = false;
    c += t;
  }

  return [res, c - offset];
}

const endOp = space + ')'
function readOperation(input: string, offset: number): ParseResult<Operation> {
  let c = offset;
  if (input[c++] !== '(') return Fail;
  c += seekWhile(input, c, space)[0];

  const op = readUntil(input, c, endOp);
  if (op === Fail) return Fail;
  c += op[0].length;

  c += seekWhile(input, c, space)[0];

  let source: ParseResult<Value>;
  let apply: ParseResult<Value>;
  let locals: ParseResult<Value[]>;

  if (input[c] === '+') {
    c += seekWhile(input, c + 1, space)[0] + 1;
    source = readValue(input, c);
    if (source === Fail) return Fail;
    c += source[1];
    c += seekWhile(input, c, space)[0];
  }

  if (input[c] === '=' && input[c + 1] === '>') {
    c += seekWhile(input, c + 2, space)[0] + 2;
    apply = readValue(input, c);
    if (apply === Fail) return Fail;
    c += apply[1];
    c += seekWhile(input, c, space)[0];
  }

  if (input[c] === '&' && input[c + 1] === '(') {
    c += seekWhile(input, c + 2, space)[0] + 2;
    locals = readList(input, c, readValue);
    if (locals === Fail) return Fail;
    c += locals[1];
    c += seekWhile(input, c, space)[0];
    if (input[c++] !== ')') return Fail;
    c += seekWhile(input, c, space)[0];
  }

  let args: ParseResult<Value[]>;
  if (input[c] !== ')') {
    args = readList(input, c, readValue);
    if (args === Fail) return Fail;
    c += args[1];
    c += seekWhile(input, c, space)[0];
  } else args = [[], 0];
  
  if (input[c] !== ')') return Fail;
  c++;

  let res: Operation = { op: op[0] };
  if (source || apply || locals) {
    if (source) res.source = source[0];
    if (apply) res.apply = apply[0];
    if (locals && locals[0].length) res.locals = locals[0];
    if (args && args[0].length) res.args = args[0];
    return [res, c - offset];
  } else {
    if (args && args[0].length) res.args = args[0];
    return [res, c - offset];
  }
}
