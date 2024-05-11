# Raport Expression Language Reference

As implied by Raport Expression Language (REL), the language is composed entirely of expessions. There are no statements. The expressions are composed only of operations and values.

## Syntax

The root syntax is based on LISP, but the most common usage relies on sugared syntax that more closely resembles other commom languages. The general LISP-y syntax is `([operator] ...args)`, where `args` are values or operations. The default parser will accept multiple expressions in sequence and automatically wrap them in a `block` operation.

## Values

Built-in data types include numbers, strings, booleans, objects, arrays, applications, null, undefined, dates, and schemas. There is also a range pseudo-value available to certain operators that automaically parse it from a string in certain circumstances.

### Numbers

Numbers may have an optional leading `-`, one or more digits, optionally separated by `_`, an optional `.` followed by one or more digits, optionally separated by `_`, and an optional `e` followed by an optional `-` and one or more digits, optionally separated by `_`.

Example: `1`, `-1`, `0.1`, `-0.1`, `111_000`, `-5_0`, `3.14159e-10`

### Strings

Strings come in three different flavors: symbolic, single-quoted with optional interpolation, and double-quoted. The symbolic form is constructed of a leading `:` followed character that is not whitespace or one of `():{}[]<>,;\&#` or a quote.

Single-quoted strings may be quoted with `'` or ````, and interpolators are contained within `{}`, optionally prefixed with `$`.

Quoted strings may have any character within escaped with `\`, including the interpolation delimiters within single-quoted strings. Any characters that are not the terminating quote are included in the string, including newlines.

Example: `:foo22`, `'test string'`, `"test string"`, `'an {interpolated} string'`

### Booleans

Simply `true` and `false`. REL uses truthiness so as not to require explicit conversion of values to booleans. Anything that is not `null`, `undefined`, `false`, `0`, `NaN`, or an empty string is considered equivalent to `true`.

### Objects

Object literals consist of key/value pairs contained within `{}`s. Keys may be quoted, though it's only necessary for non-symbolic names or interpolation. Key/value pairs may be separated with `,`s, and the last pair may have a trailing `,`.

Example: `{ foo::bar baz:'bat' bip:bop * 22 'some str':99 'nine{9 +1 }':19 }`

### Arrays

Array literals consist of values contained within `[]`s. Values may be separated by `,`s, and the last value may have a trailing `,`.

Example: `[:a :b :c 1 2 3]`

### Applications

An application is an expression that isn't immediately evaluated. Applications may optionally start with an argument list with named arguments listed between `||`s, then a required big arrow `=>`, and an expression than may be enclosed in a block.

Example: `=> _ + 10`, `|a b c| => a * b + c`

### Null

Simply `null`. Null in a language with `undefined` is a bit of a strange concept, but it can be useful as a sort of "this field intentionally left blank" indicator. It also survives in JSON.

### Undefined

Simply `undefined`. This will be omitted in JSON.

### Dates

Date literals include single dates, date ranges, and intervals of time. Dates are specified in a relaxed ISO-8601 format enclosed in `##`s. A date that isn't specified down to the millisecond is a range from the start of the specified time to the end e.g. `#2022-01-01#` spans from midnight to a millisecond before midnight on 2022-01-02. When dates are converted to an instant, the default is to resolve to the start of the range. To default to the end of the range, there can be a `<` immediately before the closing `#`.

Example: `#2020#`, `#1999-01-01 17:45#`, `#1970-06-15T00:00:01.443+04:30#`

Intervals are also specified enclosed in `##`s with each portion of the interval, optionally separated by spaces. Intervals may include years, months, weeks, days, hours, minutes, seconds, and milliseconds.

Example: `#2 years#`, `#5M3d#`, `#15 weeks 2 days 9 minutes 17 seconds#`

There are also a few special relative dates available: `#yesterday#`, `#today#`, `#tomorrow#`, `#last week#`, `#this week#`, `#next week#`, `#last month#`, `#this month#`, `#next month#`, `#last year#`, `#this year#`, and `#next year#`. Like the ISO-ish dates, these are ranges that cover their narrowest specification, so last week is from midnight on the first day of the week to the last millisecond of the last day of the week.

### Schemas

Schemas describe the type structure of a value. They consist of any number of type definitions followed by the root definition and are contained within `@[]`.

* Built-in primitive types include `number`, `string`, `boolean`, `date`, and `any`.
* Types may also be followed by `[]` to indicate an array of that type of any length e.g. `string[]`. Complex array types may also be specified by wrapping a type within an `Array<>` e.g. `Array<string|number>`.
* Literal values are also accepted as types e.g. `12` is a type that only matches the number `12`, and `'yes'` is a type that only matches the string `"yes"`.
  * Other supported literal values are `true`, `false`, `null`, and `undefined`.
* Tuple types are composed of an array literal of other types e.g. `[number number boolean]` will match the value `[10 12 false]`.
* Type unions are composed by separating types with a `|` e.g. `string|number` will match a string or number.
* Object types are specified as object literals with types as the values of their pairs e.g. `{ a:number b:string }` will match the value `{ a:21 b::sure }`.
  * Any key within an object type may be marked as optional by following its name with a `?` e.g. `{ a:number b?:date }` will match the value `{ a:21 }`.
  * All remaining keys can be matched with the special key `...` to ensure that any other keys within an object match a certain type e.g. `{ a:number ...:string }` will match any object with an `a` key that is a number and all other keys, if any, that have string values.
* Type aliases may be defined using the `type` keyword followed by a name and a definition e.g. `type Foo = { a:number b:string }`, followed by at least one whitespace or `;`. Type aliases may be used anywhere a primitive type would be, including in unions, tuples, and with array specifiers.
* Any type may have conditions that are specified as applications that receive the value being validated and return true or false. Conditions are specified with a trailing `?` and application e.g. `type LargeNumber = number ? => _ > 100000000`. More than one condition may be applied to a type.

Example: `@[number|string]`, `@[type Foo = { t:'strings', ...:string }; type Bar = { t:'numbers', ...:number }; Array<Foo|Bar>]`

### Ranges

Ranges don't have any special syntax built directly into REL, but there is a built-in parser that several operators use to see if numbers fall into ranges. The range itself is an array of arrays or numbers, where a number is considered to be in the range if it appears directly in the array or in the inclusive range bounded by the first and second elements of an inner array. The components of a range may be specified by any of the following, separated by whitespace and optionally `,`s:

* Any integer, indicating exactly that integer
* Two integers with nothing but a `-` between them, indicating any number that falls within the inclusive range of the left and right integer
* a `<` followed by an integer with optional preceding whitespace, indicating any number less than the integer
* a `>` followed by an integer with optional preceding whitespace, indicating any number greater than the integer
* a `!` followed by any of the preceding range types, indicating that the range type should be excluded from the range
* a `*`, indicating any number

Exmaple: `'1, 3, 5, 7, >10'`, `'22-33 44 55-66'`, `'1-100 !23 !34 !88'`

## References

REL is built around contexts that are somewhat analogous to stack frames that have an inherent base value. When an expression is being evaluated there is usually some value that is currently in scope as the focus of the context. The value of at the base of the current scope is available as the special reference `@value` or `_`. If the value happens to have properties, they can be referenced directly by their names e.g. in a context with a value of `{ foo: 21, bar: 22 }`, the reference `foo` will resolve to `21` when evaluated.

Each context also has a local lexical scope attached to it that is not directly connected with the underlying data in the context. This allows for passing named arguments to applications or utilyzing locally scoped variables without clobbering the associated data in the context. Some operators will introduce a new lexical scope while retaining the exising context, while others may introduce both a new context and a new lexical scope.

If the value resolved by a reference happens to have a nested structure built of object and/or arrays, further children of the primary property can be accessed using dotted path or bracketed path notation e.g. `foo.bar`, `array.1.prop` or `array[1].prop`, and `foo[:ba + :r]`. The bracketed notation allows for expressions to be used when resolving names. References are always resolved safely to `undefined`, so doing something like `{ foo::bar }.baz.bat` does not cause an error.

Any variables defined in the lexical scope will take precedent over values of the same name in the local context. To access a value in the context that has the same name as a local variable, you can start from the context special reference e.g. `_.foo` would refer to the context `foo` value where `foo` refers to a local variable.

### Prefixes

As indicated above, there are certain special references available in certain contexts. These references have the prefix `@`, and `@value` is always available. Another example of a special reference is `@index`, which is often available in contexts where iteration is taking place.

Report definitions may include named parameters that are kept in a separate namespace from the report root context value. These values are available in any context by prefixing their name with a `!` e.g. `!date` would resolve the value passed for the `date` parameter.

Parent contexts are also available from their children by applying the context pop prefix `^` one or more times to a reference e.g. `^foo` will resolve to whatever `foo` would resolve to in the parent context, and `^^^foo.bar[9]` will resolve to whatever `foo.bar[9]` would resolve to in the great-grandparent context.

The root context value is also available in any context by prefixing a reference with the root context prefix `~` e.g. `~foo.bar` will resolve to `foo.bar` in the root context.

Report definitions may include named data sources that are kept in a separate namespace from the report root context value.  These data sources are available in any context by prefixing their name with a `*` e.g. `*people` would resolve to the data passed or retrieved for the `people` data source.

## Comments

Any expression may be preceeded by any number of line comments, which start with `//` and include any subsequent characters up to a newline. The final line may not be comment, as comments must be followed by an expression.

Example: ```
// add a and b
a + b
```

## Variables

Most of the data accessed in REL comes from a data source, and as such, it doesn't often make sense to change any values. There are some cases where local variables can be quite useful to allow breaking up complex calculations into steps or to foward an alias into an algorithm. For these purposes, REL has `let` and `set` operators, which change a value in the local scope and local context, respectively. The `let` operator works with the `^` prefix to allow accessing parent scopes. The `set` operator works with `~` and `^` prefixes to allow working with the root and parent contexts.

Example: `let foo = 10`, `set ~name = :Joe`, `let ^^type = { size: 22, id::1 }`

## Operations

Operators are the foundational component of REL, as everything within REL other than a few of the primitive literals, references, and comments are built as operators. An operator may be called using LISP syntax, call syntax, or in many cases special syntax such as unary or boolean syntax. The following are equivalent:

* `(if foo > 10 :large foo < 5 :small :medium)`
* `if(foo > 10 :large foo < 5 :small :medium)`
* `if foo > 10 then :large elif foo < 5 then :small else :medium`
* `if foo > 10 { :large } elif foo < 5 { :small } else { :medium }`

Most operators are limited to LISP and call syntax because that's how they're most reasonably used. `+`, `-`, and `not` are available as unary operators. Supported binary operators in order of precedence are exponentiation (`**`), mutiplication/division/modulus/int division (`*`, `/`, `%`, `/%`), addition/subtraction (`+`, `-`), comparison (`>=`, `>`, `<=`, `<`, `ilike`, `in`, `like`, `not-ilike`, `not-like`, `not-in`, `contains`, `does-not-contain`, `gt`, `gte`, `lt`, `lte`), equality (`is`, `is-not`, `==`, `!=`, `deep-is`, `deep-is-not`, `strict-is`, `strict-is-not`, `===`, `!==`), boolean and (`and`, `&&`), boolean or (`or`, `\|\|`) and nullish coalescing (`??`). At least one space is required on either side of a binary operator.

Most operators take a number of arguments, which are passed within their `()`s. Some operators will evaluate their arguments lazily, like `and` and `or`, and others will evaluate all of their arguments before processing them. Some operators will implicitly operate on their nearest data source, and these are internally configured as aggregate operators, including `sum` and `avg`.

Call operations may be attached to a reference such that the reference further refines the result of the call operation.

Example: `find(list =>len(parts) > 10).name`

### Named arguments

Operators that are called in LISP or call syntax may also accept named arguments that are specified as key/value pairs at the end of the argument list. These are often used to control specialized behavior or the operator using flags that would otherwise be cumbersome as positional arguments e.g. `parse('1 3 5 7' range:1)`, which asks the `parse` operator to parse the given string as a range rather than the default REL expression.

### Formats

There is a built-in format operator that formats values as strings using registered formatters. One example is the `date` formatter that outputs `date` values as strings in the `yyyy-MM-dd` format by default. It can also accept an argument that specifies the format to use when converting the date to a string. The `format` operator can be called explicitly or, since formatting values as strings is a fairly common need, using a special postfix format operation syntax that is a `#` followed by the name of the formatter and optionally any argument expressions separated by `,`s with no whitespaces. The following are equivalent:

* `format(@date :date 'MM/dd/yyyy')`
* `@date#date,'MM/dd/yyyy'`

### Pipes

Processing data often calls operators on the results of calling operators on the results of calling operators, resulting in large nested argument lists that can become hard to keep track of. To address this, REL has a special built-in `pipe` operator that accepts a starting value and forwards it through the list of calls supplied to it as arguments, replacing the value with the result of the previous call each time. If one of the arguments to a call is `_`, the call will be evaluated as-is, but if no reference to `_` appears in the call arguments list, `_` will be supplied as the first argument. The following are equivalent:

* `join(map(filter(things =>count > 10) =>name) ', ')`
* `pipe(things filter(=>count > 10) map(=>name) join(', '))`

The latter is a bit longer, but considerably more easy to follow.

## Flow Control

### block

A block isn't really flow control, but being an expression-based language, a way to execute a number of expressions ignoring results until the final expression is quite useful. The `block` operator does just that. The built-in syntax for a block operation is one or more expressions placed with `{}`s, separated by whitespace and/or `;`s.

Blocks introduce their own lexical scope, so any variables declared within them will not escape their scope. You can still access parent contexts though, so it is possible to `let` variables from any context that is parent to the block scope using the appropriate reference.

Exmaple: `{ let a = 10; let b = 20; a + b }`

### if

The primary form of conditional flow control is handled by the `if` operator, which takes a conditional argument followed by a truth case expression, any number of additional conditional and truth case expressions, and then an optional alternate expression. As an operator, `if` may be called as any other operator, but there is also built-in syntax to make it slightly more readable in the form `if` followed by a condition, `then`, and an expression; followed by any number of alternate conditions and expressions in the form `else if` or `elseif` or `elsif` or `elif` followed by `then` and the value expression; optionally followed by `else` and a final alternate value expression.

The result of an `if` expression is the value of the value expression paired with the first matching conditional branch, the value of the final alternate branch if no conditions matched, or `undefined` if there were no matches and no final alternate value.

If an `if` needs to be nested in a way that may make further conditionals ambiguous, the expression can be ended with `end` or `fi`. The value expression of a branch may also be a block, which will also remove any ambiguity.

Example: `if count > 23 then 'there are dozens of us!' elif count < 0 then 'not sure what happened' else 'something else'`, `if a > b then if b < 12 :c else :d end elif b > a then :e else :f`

### unless

Unless is a negated `if`. If the conditional expression evaluates to a truthy value, then the value expression will be the result. `unless` also allows for an alternate value expression but does not allow additional condition cases. The built-in unless syntax starts with `unless` followed by a conditional expression, followed by `then` and a value expression, optionally followed by `else` and an alternate value expression, optionally followed by `end`.

Example: `unless loggedIn 'Please log in'`

### case

REL also has a case operator that allows for an alternate branch style that may be more comprehensible in some cases. Each branch condition is evaluated lazily, and if it is an expression will have the value being evaluated available as the special `@case` reference. If using the built-in syntax, `_` will also evaluate to `@case`. `case` expressions begin with `case` followed by a value expression, followed by any number of branches that start with `when` followed by a conditional value or expression, followed by `then` and a value expression, and finally optionally ending with an alternate `else` and value expression and optional `end` or `esac`.

Example:
```
case age
  when _ < 13 then 'ask a parent'
  when 15 then 'happy quinceanera'
  when 99 then 'last year for legos, friend'
  when _ >= 18 then 'ok'
  else 'NaN, I guess'
```
