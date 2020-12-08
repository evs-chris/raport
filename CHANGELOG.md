## 0.4.0

2020-12-08

### Report

* __BUG__: Rendered heights are no longer checked for fit in available y area after adding the already-accounted-for widget margin, so things that fit within a tolerance of the margin no longer cause an unnecessary break.
* __BUG__: Repeater margins are no longer applied after the header is rendered.
* __BUG__: Percentage widths are now correctly applied against total width rather than remaining width.
* __BUG__: Continuing a render due to lack of available height now passes the would-be height up so that the continuation properly breaks.
* __BUG__: Width constrained repeater rows now wrap properly if the items happen to use the available width exactly.
* HTML widgets now evaluate their html as a template rather than an expression.
* Contexts can now include a parser, so that evaluation in a context without a pre-parsed expression can control which parser should be used.

### Parser

* __BUG__: Call operations with an identifier that includes an `x` are now parsed correctly.
* Integer division `/%` is supported as a binary operator with the same precedence as division.
* Timespans now support years and months in literals.
* Timespan literals can specify shortened units e.g. `:y, :m, :w, :d, :h, :mm, :s, :ms`.
* Date range literals can specify that they should convert to the end date by default with a final `>` sigil e.g. `#2012>#` or `#2012 >#`.
* Operators now support named arguments in `indentifier`: `value` form, where the space after the `:` is optional. Named arguments are gathered into an object argument and passed as the final argument in the arguments array to the operator.
* There is now a special parser that reads a template, similar to mustache/handlebars. This supports plain interpolators, `if`s with branches, `with`s with an optional alternate, `each`s with optional branches, and `unless`.

### Data

* __BUG__: `@source` special references will once again evaluate correctly if they refer directly to an array.
* __BUG__: `sum` and `avg` now coerce their arguments to numbers.
* __BUG__: Accessing a path that includes a falsey non-null (`0`, `''`, `false`, etc) no longer results in `undefined`.
* __BUG__: Unary `+` properly converts a date to a number.
* Added the integer division operator `/%`.
* Date ranges can be converted to dates, and default to the start of the range if no end sigil is included.
* Subtracting a date from another date will result in a timespan.
* Adding or subtracting a timespan and a date will result in a date. First-order addition and subtraction works exactly with years and months e.g. `#2012-12-22# + #5y2m#` will result in `2018-2-22`.
* The `time-span-ms` operator is now aliased as `time-span`.
* The `time-span` operator now has support for extracting a particular unit of time like `days` or `years` by passing a named `unit` argument e.g. `time-span(#72w# unit::y 2)` results in `1.38`. The default precision for a unit extraction is `0`, so without passing a second non-named argument, only the floored value will be returned.
* There is now a `string` operator that eats `undefineds` and stringifies objects more nicely. This is used by default for plain template interpolators.

### Designer

* The report name is now evaluated as a template, which allows the saved output to include expressions, like parameters.
* There is now extremely limited support for inserting context references and operators into HTML.


## 0.3.1

2020-12-04

### Package

* __BUG__: `sprunge` is now properly bundled within the ES module.


## 0.3.0

2020-12-02

### Report

* There is now an `html` widget that will not escape its content.
* Widgets can now break on page boundaries or stop breaking on a page boundary if necessary.
* Flowed layout will now track available width in addition to height as it goes so that grid-like layouts can be achieved.
* Labels may have a format applied to their value spearately.
* Labels may have an `id` if they appear within a repeater. This `id` is used to collect values to be used in footers for aggregation without having to repeat complex expressions.
* The report runner now supports passing additional html strings for the header and body end of the generated report.

### Parser

The parser has been switched from hand-coded to be based on [sprunge](https://github.com/evs-chris/sprunge), which gives up a bit of performance in some areas while gaining in others and being much more flexible.

* __BREAKING__: The root reference sigil has been changed from `#` to `~`.
* __BREAKING__: The source reference sigil has been changed from `+` to `*`.
* __BREAKING__: Aggregate operators no longer have local arguments or a special source sigil. The source is the first argument, if it's an array or source, or the implicit `@source` otherwise. Application is handled by application literals, as are local arguments.
* __BREAKING__: Expression literals are now handled by application e.g. `=>_ + 5`.
* There is now a bit of sugar for array and object literals similar to JS, except allowing just space as a spearator in addition to commas. Array and object literals containing only literals will become literals, and those containing expressions will become operations. Quotes on object keys are optional if they don't have spaces.
* Single- and backtick-quoted strings now support interpolation with `${...}`.
* There is now support for date literals between `#`s e.g. `#2012-2-22#`, `#today#`, `#last week#`, `#2020#`, `#2020-4#`, `#2032-5-30 -8`, `#1999-12-3 12:45#`. Relative dates result in a time range, as do exact dates that are specified to at most the hour, as specifying a minute results in zeroed out seconds and milliseconds. Timespans can be specified in weeks, days, hours, minutes, seconds, and milliseconds as anumbers followed by the unit e.g. `# 3 weeks 2 days#` and evaluate to a number literal in milliseconds.
* The parser now supports unary, binary, call, if, bracketed access, postfix access, and postfix format expressions to make the language a little more familiar non-lispers.
* `_` is now an alias for `@value`, which always refers to the value of the current context.
* The reference parser will now parse references into a keypath array, a prefix, and a number of context bumps. The keypath array may contain expressions if they appear in brackets.

### Data

* __BUG__: `pad` now works correctly.
* `like` now supports non-anchored comparison by passing a second argument (`'free'`).
* Added `keys` and `values` operations that correspond to `Object.keys` and `Object.values`.
* Added `ceil`, `floor`, `round`, `**` (alias `pow`), and `rand` math operations.
* Added `num` and `int` formats.
* Added `split` operation for strings.
* `min` and `max` now work on strings.
* `and` and `or` now return the matched value if it's not a boolean and have aliases `&&` and `||`.

### Designer

There is now a [Ractive.js](https://ractive.js.org)-based designer available. It has initial support for paged, flowed, and delimited reports, all of the built-in widgets, manual and flowed layout, multiple dynamic sources with parameters and filter/sort/grouping, and evaluating expressions in the correct context in most cases.


## 0.2.2

2020-04-17

### Data

* __BUG__: Sorting with un-comparable values should now be stable, as null-ish values are always less, and values that are both less than each other are equal.
* __BUG__: `upper` and `lower` will treat null-ish values as empty strings.
* `like` will now check elements within an array against the pattern.


## 0.2.1

2020-02-04

#### Data

* __BUG__: Allow whitespace at the end of argument lists before the closing parenthesis.


## 0.2.0

2020-02-04

#### Package

* There is now a non-comprehensive test suite that mostly covers data and operations.
* The playground has basic support for parsing and evaluating expressions against the report context.
* The operators list in the docs is now alphabetized.

#### Report

* Expose `@level` and `@grouped` numbers to repeater footers.
* Paged reports now include screen stylesheets so that they render somewhat like a PDF viewer when `iframe`d in.

#### Data

* __BUG__: Preserve order of groups when grouping records.
* __BUG__: Symbol-style strings e.g. `:some_string` no longer interfere with the end of operations.
* Added support for prefixing sort expressions with a `'-'` to specify that the sort should be descending rather than the default ascending e.g. `-some.path` and `-(some expr)` are equivalent to `{ by: 'some.path', desc: true }` and `{ by: '(some expr)', desc: true }`, respectively. `'+'` is also accepted as a prefix, and will leave `desc` as `false`.
* Added built-in aggregate ops for `min`/`max` and `first`/`nth`/`last`.
* Allow `evaluate` to create a context if one is not provided.
* Introduced expression literal syntax to make passing expressions to operators a little easier. `%ref` becomes the literal `{ r: 'ref' }`, and `%(some-op arg1 10 :foo)` becomes `{ op: 'some-op', args: [{ r: 'arg1' }, { v: 10 }, { v: 'foo' }] }`.
* The default date format is no longer off if you're not in the +00:00 timezone.
+ The `date` operator will now return `new Date()` if no value is passed in.
* Aggregate operators will be cached when run as a filter so that they are useful e.g. `(> age (avg =>age))` will find the average age of all the rows being filtered and then cache that value, using it in the comparison for each row. This is handled by a new optional `check` method that recieves the final operator value and the current item being evaluated and is expected to return true if it matches.
* Aggregate and checked operators now receive the name and args at all stages.
* Aggregate operators now receive the base record as well as the application while being applied.
* Aggregate operators should now return their state while being applied, as the evaluator no longer assumes that the initial state will be mutated.
* Added a `unique-by` operator that returns an array of unique items based on an application. This operator can also be used in filtering as it is also checked.
* Operators no longer supply typing information, as it is not used in the runtime, and should tus be part of the designer.


## 0.1.0

2019-12-19

#### Report

* Borders can now be specified as an array.
* Reports can have their individual inline styles packaged into generated classes. Depending on the report, this can save quite a bit of size on the generated HTML.
* Report source groupings may now be an expression.
* Report sources may now have a `base` application before filtering, sorting, and groupings are applied.
* Report sources properly use the `name` and `source` attributes i.e. `name` is what the data is called in the context and `source` is where the data is retrieved from the source map passed to run.

#### Data

* Added `group`, `sort`, and `source` operators.
* `+some.child.prop.on.source` will now properly unwrap the `some` source to get `child.prop.on.source` as you would expect.


## 0.0.2

2019-10-09

#### Package

* Added the license (MIT).
* The typings should now be properly set up in the package manifest.

#### Data

* The built-in operators are now all kebab-cased to play nicely with expressions.
* The `Parameter` type is now extendable.
* Sorting and filtering can both be done with full expressions rather than a fixed array or operation application respectively.
* The `Root` context class will now accept and `ExtendOptions` object to initialize parameters and special refs.

#### Report

* Paged reports now include `@page` style size that makes generating pdfs with puppeteer pretty painless.
* The repeater can now use an expression as a source.
* The report runner `run` function will now accept parameters or a context rather than just parameters.
* Reports may specify initialization data for the root context as part of their definition.
* `delimited` reports can now have the same `sources` specified as displayed reports. The main source can optionally be specified by name using `source`, and if none is provided, the first source from `sources` is used.


## 0.0.1

2019-10-08

* Initial release
