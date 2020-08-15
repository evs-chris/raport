import { Value, Operation } from "./index";

type Result<T> = Ok<T>|Fail<T>;
type Ok<T> = [T];
type Fail<T> = [] & { l?: number; m?: string };
const Fail: Fail<never> = [] as Fail<never>;

function fail(pos: number, msg: string): Fail<never>;
function fail(): Fail<never>;
function fail(pos?: number, msg?: string): Fail<never> {
  Fail.l = pos;
  Fail.m = msg;
  return Fail;
}

function seekUntil(input: string, offset: number, target: string, end: boolean): Result<number> {
  for (let i = offset; i < input.length; i++) {
    if (~target.indexOf(input[i])) return [i - offset];
  }
  if (!end) return fail(offset, `unexpected end of input looking for '${target}'`);
  return [input.length - offset];
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
  p = readNumber(input, offset);
  if (p !== Fail || p.m) return p;
  p = readString(input, offset);
  if (p !== Fail || p.m) return p;

  return fail();
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
  if (!p[0].length) return fail();
  c += p[0].length;
  num += p[0].replace(underscores, '');

  if (input[c] === '.') {
    c++;
    p = readWhile(input, c, digit);
    if (p[0].length) {
      num += `.${p[0].replace(underscores, '')}`
    } else return fail(c, 'expected decimal');
    c+= p[0].length;
  }

  return [{ v: parseFloat(num) }, c - offset];
}

const escapes = { b: '\b', f: '\f', n: '\n', r: '\r', t: '\t', v: '\v', 0: '\0' };
const space = ' \r\n\t';
const hex = '0123456789abcdefABCDEF';
const sigils = '!@#+^';
const endSym = space + '():{}[]';
const endRef = endSym + '.,"\'<>\\%=&' + sigils;
function readString(input: string, offset: number): ParseResult<{ v: string }> {
  const q = input[offset];
  let p: Result<string>;
  let c = offset + 1;
  if (q !== '\'' && q !== '"' && q !== '`' && q !== ':') return fail();
  if (q === ':') {
    p = readUntil(input, c, endSym, true);
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
      if (p === Fail) return fail(c, `expected ${q}`);
      str += p[0];
      c += p[0].length;
      if (input[c] === q) return [{ v: str }, ++c - offset];
      if (input[c] === '\\') {
        c++
        const n = input[c++];
        if (n in escapes) str += escapes[n];
        else if (n === 'x') {
          const x = input[c] + input[c + 1];
          if (~hex.indexOf(x[0]) && ~hex.indexOf(x[1])) {
            str += String.fromCharCode(parseInt(x, 16));
            c += 2;
          } else return fail(c, 'expected two hex chars');
        } else if (n === 'u') {
          const u = input.substr(c, 4);
          for (let i = 0; i < 4; i++) if (!~hex.indexOf(u[i])) return fail(c, 'expected four hex chars');
          str += String.fromCharCode(parseInt(u, 16));
          c += 4;
        } else str += n;
      }
    }
  }
}

function readArray(input: string, offset: number): ParseResult<Operation> {
  if (input[offset] !== '[') return fail();
  let c = offset + 1;
  c += seekWhile(input, c, space)[0];
  const res = readList(input, c, readValue);
  if (res === Fail) return res;
  c += res[1];
  c += seekWhile(input, c, space)[0];
  if (input[c] !== ']') return fail(c, `expected closing ]`);
  return [{ op: 'array', args: res[0] }, c - offset + 1];
}

function readObjectPair(input: string, offset: number): ParseResult<[Value, Value]> {
  let c = offset + seekWhile(input, offset, space)[0];
  let key = readString(input, c);
  if (key === Fail) {
    const str = readUntil(input, c, endRef, true);
    if (str[0].length < 1) return fail();
    key = [{ v: str[0] }, str[0].length];
  }
  c += key[1];
  c += seekWhile(input, c, space)[0];
  if (input[c] !== ':') return fail();
  c += 1 + seekWhile(input, c + 1, space)[0];
  const val = readValue(input, c);
  if (val === Fail) return val;
  c += val[1];
  return [[key[0], val[0]], c - offset];
}

function readObject(input: string, offset: number): ParseResult<Operation> {
  if (input[offset] !== '{') return fail();
  let c = offset + 1;
  c += seekWhile(input, c, space)[0];
  const pairs = readList(input, c, readObjectPair);
  if (pairs === Fail) return pairs;
  c += pairs[1];
  c += seekWhile(input, c, space)[0];
  if (input[c] !== '}') return fail(c, `expected closing }`);
  return [{ op: 'object', args: pairs[0].reduce((a, c) => (a.push(c[0], c[1]), a), [] as Value[]) }, c + 1 - offset];
}

function readReference(input: string, offset: number): ParseResult<string[]> {
  let c = offset;
  let s = '';
  for (; input[c] === '^'; c++) s += '^';
  if (~sigils.indexOf(input[c])) s += input[c++];

  let p = readUntil(input, c, endRef, true);
  if (p === Fail) return Fail;
  else if (!s.length && !p[0].length) return fail();
  c += p[0].length;
  p[0] = s + p[0];

  const res = [p[0]];

  while (input[c] === '.') {
    p = readUntil(input, ++c, endRef, true);
    if (p === Fail) return p;
    else if (!p[0].length) return fail(c, 'expected reference path');
    res.push(p[0]);
    c += p[0].length;
  }

  return [res, c - offset];
}

export function parse(input: string): Value {
  input = input.trim();
  const p = readValue(input, 0);

  if (p === Fail) return { position: Fail.l, message: Fail.m };
  else if (p[1] !== input.length) return { position: p[1], message: 'unconsumed input' };
  return p[0];
}

function readValue(input: string, offset: number, require: boolean = true): ParseResult<Value> {
  let p: ParseResult<any>;

  if (input[offset] === '[') {
    p = readArray(input, offset);
    if (p !== Fail || p.m) return p;
  } else if (input[offset] === '{') {
    p = readObject(input, offset);
    if (p !== Fail || p.m) return p;
  }

  p = readExpr(input, offset, false);
  if (p !== Fail || p.m) return p;

  p = readOperation(input, offset);
  if (p !== Fail || p.m) return p;
  
  p = readLiteral(input, offset);
  if (p !== Fail || p.m) return p;;

  p = readReference(input, offset);
  if (p !== Fail) return [{ r: p[0].join('.') }, p[1]];
  else if (p.m) return p;

  return require ? fail(offset, 'expected an op, literal, or reference') : fail();
}

function readExpr(input: string, offset: number, require: boolean = true): ParseResult<Literal> {
  let c = offset;
  if (input[c++] !== '%') return fail();
  c += seekWhile(input, c, space)[0];

  let p: ParseResult<any>;

  if (input[c] === '[') {
    p = readArray(input, c);
    if (p !== Fail) return [{ v: p[0] }, p[1] + (c - offset)];
    else if (p.m) return p;
  } else if (input[c] === '{') {
    p = readObject(input, c);
    if (p !== Fail) return [{ v: p[0] }, p[1] + (c - offset)];
    else if (p.m) return p;
  }

  p = readOperation(input, c);
  if (p !== Fail) return [{ v: p[0] }, p[1] + (c - offset)];
  else if (p.m) return p;
  
  p = readLiteral(input, c);
  if (p !== Fail) return [{ v: p[0] }, p[1] + (c - offset)];
  else if (p.m) return p;

  p = readReference(input, c);
  if (p !== Fail) return [{ v: { r: p[0].join('.') } }, p[1] + (c - offset)];
  else if (p.m) return p;

  return require ? fail(c, 'expected an op, literal, or reference expression') : fail();
}

const listSep = ',' + space;
function readList<T>(input: string, offset: number, parser: (input: string, offset: number, require?: boolean) => ParseResult<T>, require: boolean = true): ParseResult<T[]> {
  const res: T[] = [];
  let p: ParseResult<T>;
  let c = offset;

  p = parser(input, c, require);
  if (p === Fail) return p.m ? p : [res, 0];
  res.push(p[0]);
  c += p[1];

  let t = 0;
  t = seekWhile(input, c, listSep)[0];

  let cont = t > 0;
  c += t;

  while (cont) {
    p = parser(input, c, require);
    if (p === Fail) return [res, c - offset - t];
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
  if (input[c++] !== '(') return fail();
  c += seekWhile(input, c, space)[0];

  const op = readUntil(input, c, endOp);
  if (op === Fail) return Fail;
  else if (!op[0].length) return fail(c, 'expected op name');
  c += op[0].length;

  c += seekWhile(input, c, space)[0];

  let source: ParseResult<Value>;
  let apply: ParseResult<Value>;
  let locals: ParseResult<Value[]>;

  if (input[c] === '+') {
    c += seekWhile(input, c + 1, space)[0] + 1;
    source = readValue(input, c);
    if (source === Fail) return fail(c, 'expected source');
    c += source[1];
    c += seekWhile(input, c, space)[0];
  }

  if (input[c] === '=' && input[c + 1] === '>') {
    c += seekWhile(input, c + 2, space)[0] + 2;
    apply = readValue(input, c);
    if (apply === Fail) return fail(c, 'expected application');
    c += apply[1];
    c += seekWhile(input, c, space)[0];
  }

  if (input[c] === '&' && input[c + 1] === '(') {
    c += seekWhile(input, c + 2, space)[0] + 2;
    locals = readList(input, c, readValue, false);
    if (locals === Fail) return Fail;
    else if (!locals[0].length) return fail(c, 'expected local args');
    c += locals[1];
    c += seekWhile(input, c, space)[0];
    if (input[c++] !== ')') return fail(c - 1, 'expected )');
    c += seekWhile(input, c, space)[0];
  }

  let args: ParseResult<Value[]>;
  if (input[c] !== ')') {
    args = readList(input, c, readValue);
    if (args === Fail) return Fail;
    c += args[1];
    c += seekWhile(input, c, space)[0];
  } else args = [[], 0];
  
  if (input[c] !== ')') return fail(c, 'expected )');
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
