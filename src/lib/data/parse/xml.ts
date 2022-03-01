import { IParser, Parser, parser as makeParser, rep, rep1, repsep, seq, alt, map, readToParser, read1ToParser, istr, str, readTo, opt, bracket } from 'sprunge';
import { rws, ident } from '../parse';
import { ws } from 'sprunge/lib/json';

export type Token<T = Text> = XMLDecl | OpenTag<T> | CloseTag | Text | CData | Comment | DocType;

// TODO: handle entities
// TODO: optionally post-process stream into tree, at least for plain xml

export interface TagName {
  n: string;
  p?: string;
}

export interface XMLDecl<T = Text> {
  t: 'xml';
  a?: Attribute<T>[];
  p: [number, number];
}

export interface OpenTag<T = Text> {
  t: 'open';
  n: string;
  p?: string;
  x?: true;
  a?: Attribute<T>[];
  l: [number, number];
}

export interface CloseTag {
  t: 'close';
  n: string;
  p?: string;
  l: [number, number];
}

export interface Attribute<T = Text> {
  t: 'attribute';
  n: string;
  p?: string;
  v?: T|T[];
  l: [number, number];
}

export interface Text {
  t: 'text';
  s: string;
  l: [number, number];
}

export interface CData {
  t: 'cdata';
  d: string;
  l: [number, number];
}

export interface Comment {
  t: 'comment';
  c?: string;
  l: [number, number];
}

export interface DocType {
  t: 'doctype';
  l: [number, number];
}

const tagName = map(seq(ident, opt(seq(str(':'), ident))), ([n1, o]) => {
  if (o) return { p: n1, n: o[1] } as TagName;
  else return { n: n1 } as TagName;
});

const closeTag = map(seq(str('</'), ws, tagName, ws, str('>')), ([, , tag], _, s, e) => {
  const res: CloseTag = tag as any;
  res.t = 'close';
  res.l = [s, e];
  return res;
});

const comment = map(seq(str('<!--'), readToParser('-', str('-->')), str('-->')), ([, c], _, s, e) =>{
  const res: Comment = { t: 'comment', l: [s, e] };
  if (c) res.c = c;
  return res;
});

const cdata = map(seq(str('<![CDATA['), readToParser(']', str(']]>')), str(']]>')), ([, d], _, s, e) => {
  return { t: 'cdata', d, l: [s, e] } as CData;
});

const doctype = map(seq(istr('<!DOCTYPE '), readTo('>'), str('>')), ([, c], _, s, e) => {
  return { t: 'doctype', c, l: [s, e] } as DocType;
});

function _text(parser: Parser<any>, stop: string = ''): IParser<Text> {
  return map(read1ToParser('<' + stop, parser), (s, _, st, e) => ({ t: 'text', s, l: [st, e] } as Text));
}

export type  XMLishToken<T = any> = Token<T|Text> | T;
export function xmlish<T = any>(stop: string, content: Parser<T>): IParser<Array<XMLishToken<T>>> {
  const text: Parser<Text> = {};

  const attribute = map(seq(tagName, opt(seq(ws, str('='), ws, alt<string|T|Array<T|string>>(
    content,
    ident,
    bracket([str('\'')], rep(alt<T|string>(content, readToParser(stop + '\'', alt<any>(content, str('\'')))))),
    bracket([str('"')], rep(alt<T|string>(content, readToParser(stop + '"', alt<any>(content, str('"')))))),
  )))), ([n, o], _, s, e) => {
    const res: Attribute<T|Text> = n as any;
    res.t = 'attribute';
    if (o) {
      const v = o[3];
      if (typeof v === 'string') res.v = { t: 'text', s: v, l: [s, e] };
      else if (Array.isArray(v)) {
        if (typeof v[0] === 'string') res.v = v.map(s => ({ t: 'text', s } as Text));
        else res.v = v as any;
      } else res.v = v;
    }
    return res;
  });

  const openTag = map(seq(str('<'), ws, tagName, ws, repsep(attribute, rws, 'allow'), opt(str('/')), ws, str('>')), ([, , , tag, attrs, close]) => {
    const res: OpenTag<T | Text> = tag as any;
    res.t = 'open';
    if (close) res.x = true;
    res.a = attrs;
    return res;
  });

  const xmldecl = map(seq(istr('<?xml '), repsep(attribute, rws, 'allow'), str('?>')), ([, a]) => {
    return { t: 'xml', a } as XMLDecl;
  });

  text.parser = _text(alt<any>(openTag, closeTag, comment, cdata, content), '<' + stop);

  const node = alt<XMLishToken<T>>(content, openTag, comment, cdata, closeTag, text);

  return map(seq(opt(xmldecl), opt(doctype), rep(node)), ([decl, doc, nodes]) => {
    const res: XMLishToken<T>[] = [];
    if (decl) res.push(decl);
    if (doc) res.push(doc);
    return res.concat(nodes);
  });
}

const text: Parser<Text> = {};

const attribute = map(seq(tagName, opt(seq(ws, str('='), ws, alt<string|Text>(
  ident,
  bracket([str('\'')], readTo('\'')),
  bracket([str('"')], readTo('"')),
)))), ([n, o], _, s, e) => {
  const res: Attribute = n as any;
  res.t = 'attribute';
  if (o) res.v = typeof o[3] === 'string' ? { t: 'text', s: o[3], l: [s, e] } : o[3];
  return res;
});

const openTag = map(seq(str('<'), ws, tagName, ws, repsep(attribute, rws, 'allow'), opt(str('/')), ws, str('>')), ([, , tag, , attrs, close]) => {
  const res: OpenTag = tag as any;
  res.t = 'open';
  if (close) res.x = true;
  res.a = attrs;
  return tag as OpenTag;
});

const xmldecl = map(seq(istr('<?xml '), repsep(attribute, rws, 'allow'), str('?>')), ([, a]) => {
  return { t: 'xml', a } as XMLDecl;
});

export type XMLToken = XMLDecl | OpenTag | CloseTag | Text | CData | Comment | DocType;
text.parser = _text(alt<any>(openTag, closeTag, comment, cdata));

const node = alt<XMLToken>(openTag, comment, cdata, closeTag, text);

const xml = map(seq(opt(xmldecl), ws, opt(doctype), ws, rep1(node)), ([decl, , doc, , nodes]) => {
  const res: XMLToken[] = [];
  if (decl) res.push(decl);
  if (doc) res.push(doc);
  return res.concat(nodes);
});

export const parseXml = makeParser(xml, { trim: true });
export default parseXml;

export interface Document<T> {
  t: 'doc';
  d?: DocType;
  x?: XMLDecl;
  b?: Array<Text|Tag<T>|T|CData|Comment>;
}

export interface Tag<T> {
  t: 'tag';
  n: string;
  p?: string;
  a?: Array<Attribute<T>>;
  x?: true;
  b?: Array<Text|Tag<T>|T|CData|Comment>;
}
