## 0.8.7

2021-12-09

### Data

* __BUG__: For `time-span` with `round::ceil` with `unit:[:y :M]`, where the months ceils to 12, the result will now have the year incremented and the months set to 0.


## 0.8.6

2021-12-09

### Data

* __BUG__: The underlying function that handles calculating the interval between two dates now handles month/day transitions more accurately.


## 0.8.5

2021-11-11

### Data

* The `date` operator now uses the internal date parser first.
* The internal interval parser no longer assumes that a day is 24 hours because I hate daylight savings time.

### Library

* `parseDate` and `parseTime` are now exported from the root module.


## 0.8.4

2021-11-08

### Report

* __BREAKING__: Sources are no longer automatically exposed as root data. While technically not specified as feature, removing this could be considered breaking. If you want to reference a source, it's much more clear to do so with the canonical (and now, only) `*source` form.


## 0.8.3

2021-11-01

### Data

* The `date` operator now supports a second arguemt that allows you to set the time on the resulting date. It can be either a string, to be parsed with the parser used by date literals, or an array with `[hours, minutes, second, milliseconds, timezone offset in minutes]`, where only the first element is required and the timezone is only used if present.

### Parser

* __BUG__: `lte` and `gte` are now parsed properly.

### Report

* Data sources are now evaluated and installed before they are filtered, so that data sources that have other data source dependencies have a chance to work correctly.

### Designer

* __BUG__: The font size in the eval textarea is now specified as `1em` so that highlighting works in blink-based browsers without weird misalignment.


## 0.8.2

2021-10-05

### Data

* __BUG__: `null`s in data are better handled by built-in operators and internal functions.

### Parser

* __BUG__: `is-not` now parses with higher priority than `is` so that it can actually be parsed.
* __BUG__: The stringifier now properly outputs `#now#`.
* Interval timespans (those that are represented by a number of milliseconds) now parse to a wrapper type so that they can be properly stringified.
* Stringifying long binary operands will now wrap and indent the sebsequent operands.

### Designer

* The expression editor now has syntax highlighting and in/outdent support.
* The designer also has syntax highlighting for widget expressions.


## 0.8.1

2021-09-29

### Data

* There are three new string operators, which are also exported from the library:
  * `similar` - the main operator that finds similar substrings within two strings based on a minimum threshhold and a fudge factor
  * `similarity` - get the similarity factor from the `similar` operator
  * `overlap` - get a substring that is common to both strings that meets a minimum threshhold of size (and no fudge factor) using the `similar` operator


## 0.8.0

2021-09-15

### Parser

* __BREAKING__: `$`s are now required for interpolators in backtick-quoted strings. This makes parsing simple JSON-ish javascript much more reliable.

### Data

* There is now an `interval` operator that will parse a raport interval from a string, with the `#`s being optional e.g. `interval('{count} days')` where `count` is `5` is equavalent to `#5 days#`.
* The `date` operator will now try the raport date parser on strings that produce an `Invalid Date`.

### Designer

* Overflowing textareas will now properly get scrollbars, though there is a bit of a flash as the proper height gets measured.
* There is now a `JS` mode for compact definition output. It can output strings in either JSON-encoded or template string format.


## 0.7.6

2021-07-20

### Data

* `time-span` now special cases getting an exact span of months directly from a full time span.


## 0.7.5

2021-07-20

### Report

* __BUG__: Having a measured field without specified font settings will no longer throw.
* __BUG__: Repeaters that get to the body without saved state will no longer throw on suspend.

### Data

* __BREAKING__: `time-span` has been rewritten to be more useful. The old behavior is still achievable with slightly different arguments.
* Full timespans now include a date anchor by default to make them convertable to an exact number of milliseconds.

### Library

* The main library now exports `parsePath` to parse reference paths.


## 0.7.4

2021-06-23

### Report

* `classifyStyles` is now the default. To disable style classification, set it to `false`.

### Parser

* __BUG__: Escapes are now properly handled in template strings.
* There are now non-escape-entity versions of comparison operators (`<`, `<=`, `>`, `>=`) for use with templates, and these are now used by default when stringifying a template.
* There is also a non-escape-entity version of application (`=\`) for use with templates, and it is also used by default when stringifying templates.
* There is a new stringify option, `htmlSafe`, that controls whether or not HTML-safe syntax is output. It defaults to on for templates and off for non-template expression.

### Designer

* Sources are now more effectively compacted.


## 0.7.3

2021-05-27

### Data

* __BUG__: Timespans are now correctly treated as literals during evaluation.
* The `time-span` function can now handle producing exact spans from date to date when passed two dates as the first arguments.

### Parser

* Named args or objects in the final argument position are now rendered as named args during stringification.


## 0.7.2

2021-05-11

### Parser

* __BUG__: S-expression operators can once again be symbolic.

### Designer

* __BUG__: Plain JSON data sources can once again be provided.


## 0.7.1

2021-05-10

### Data

* __BUG_: Filters once again correctly evaluate applications.

### Parser

* Application arguments will now stringify with comma separators if `listCommas` is set.
* The application arguments opening pipe can now be followed by whitespace.
* __BREAKING?__: References can no longer include some operator characters, like `+`.
* `if`, `unless`, `case`, and friends will no longer parse as references to avoid some incorrect syntax looking correct and parsing to something nonsensical.
* __BUG__: Non-block cases will once again parse and can also be mixed with block cases.
* Stringify can now split long lists of arguments (array, call, object, etc) across multiple lines, and will default to limiting list lengths to 60 chars per line.


## 0.7.0

2021-05-08

### Data

* Schema inspection handles arrays much more accurately.
* Root contexts now support setting a root parser in their type signatures.
* __BREAKING__: Application is now handled more explicitly within operators (again... ish). Application will no longer automatically evaluate in the current context.
* Locals are now handled in the context rather than in the evaluation call.
* Applications can now have named arguments specified, and are handled as locals during evaluation e.g. `|a c| => a + c` can be used with `reduce` to sum values.
* There is now a `reduce` operator that folds a value throuh an array using an application e.g. `reduce([1 2 3] |a c|=>a+c 0)`.
* There is now a `block` operator that evaluates all of its arguments in a new context with an empty set of locals.
* There is now a `let` operator that allows defining a local variable in the current context. The variable can be any path expression except prefixes other than `^`. Any missing intermediate levels will be filled in based on the type of the key.
* There is now a `set` operator that allows setting values in an local scope up the context hierarchy if any match or in the current context data otherwise. Like `let` the variable can be any path expression.
* There are a few new special refs that allow access to immediate scope specials and locals (`@special`, `@local`), nearest set specials and locals (`@specials`, `@locals`), root sources `@sources`, and parameters (`@parameters`).

### Parser

* Format args allow a trailing comma to allow eliminating ambiguity without requiring brackets .e.g `some.thing#or,10, + 20` is a binary operation rather than a format with a binary operation as its argument.
* Blocks can be parsed from `{expr1 expr2; expr3}` syntax, where the expression separators can be any whitespace and/or a `;`.
* There is now a parser that parses in an implicit block scope, allowing multiple expressions. The final expression determines the result of evaluation. This is now the default parser.
* There are now block forms of `if` and `case` that allow reducing a bit of boilerplate if you need multiple expressions within a branch body e.g. `if foo { bar; baz } elif bat { bip: boop }` and `case foo when bar { baz } when bat { bop } else { sure }`. The stringifier handles preferred formatting for the new forms.

### Designer

* The designer now supports projects, which include the report design, provided sources, and saved set of parameters. Projects are saved in `localStorage` and can be imported/exported with files.
* There are various UI adjustments to make different areas more consistent and avoid small layout issues.
* There is now a `log` operator available in the designer to make debugging expressions easier.


## 0.6.1

2021-04-19

### Data

* __BUG__: `sort` and `group` operators no longer return a data set, they just return the resulting array like `filter`.
* __BUG__: Getting a path with expression members e.g. `^foo.bar[:baz + 21]` will now evaluate the expression in the initial context rather than the first value context.
* There are now `or`, `padl`, `padr`, and `trim` formatters.
* The numeric formatters now accept an alternate grouping string.
* The date format now supports non-padded milliseconds.


## 0.6.0

2021-04-14

### Report

* __BUG__: Widgets that support breaking after in row/auto layout will once again actually break.
* __BUG__: Labels with an external format (not in the text expression) now evaluate their args correctly.
* __BUG__: An undefined `font` property on a span will no longer throw.
* `height`, `width`, and `br` can now be expressions.
* Definitions with no orientation properly default to landscape.
* Measured labels have more accurate default styles and can have a custom metric supplied.

### Parser

* The stringification library now outputs binary ops, format ops, and has more options for output.
  * It supports all the various date literals.
  * It can also be used as a standardizing printer (fmt) for expressions and templates.
  * It supports templates.
* There is now a `case` operator sugar e.g. `case some + expr when :foo then another(expression) when 22 then :sure else :none`.
  * It also has a template form as `{{case some + expr when :foo}}{{another(expression)}}{{when 22}}sure{{else}}none{{/}}`.
  * The expression form will automatically stringify on multiple lines when approriate.
  * `when` conditions that are expressions (not application) will substitute `_` refs with `@case`.
* The `$` in string interpolation is now optional e.g. `'foo {bar} baz'` is equivalent to `'foo ${bar} baz'` and the former is the default for stringification.

### Data

* __BUG__: Non-string primitives will no longer cause sorting to throw.
* __BUG__: Relative date at time literals e.g. `#yesterday at 11:35#` now parse and evaluate correctly.
* `+` as a unary will now parse its argument as a number and properly handle dates.
* Sorting now defaults to ascending to match generally expected behavior.
* Sort objects now support specifying a `dir` instead of a `desc` e.g. `{ by: =>some.expr, dir: :asc }`. `dir` may also be an expression where the result is case-insensitively compared to `'desc'` to determine the sort direction.
* Multiplication `*` now supports multiplying a string by a number to duplicate the string.
* The `date` format now supports milliseconds in output as `S`.
* All date literals now support a timezone.
* There is now a `case` operator that checks the first argument against subsequent conditions e.g. `case(value cond1 res1 cond2 res2 cond3 res3 default)`. If the condition references `@case` in an expression, it will match if it is `true` or equal to the `value`. If the condition is an application, it will match if it evaluates to `true` or a value equal to `value`.

### Designer

* __BUG__: The overflow control (clamp) on widgets is now exposed.
* __BUG__: Data sources are now passed to the report runner correctly.
* __BUG__: Containers can now be manually positioned.
* Changing the selected widget will now scroll it into view in the widget tree.
* Loading a definition tries `JSON.parse` first and then the raport parser for more realxed definitions.
* Report definition output now does basic minification i.e. removes keys that have no effect on the definition.
* The designer now exposes `parse` and `unparse` operators for seeing how an expression breaks down.
* The designer now supports `fetch` data sources that can be built with templates. The definitions can also be loaded from the import tab.
* Measured widgets expose metric and hide properties that don't apply.


## 0.5.0

2021-03-30

Most of the changes in 0.5.0 were unintentionally published as 0.4.1, but I'm going to pretend like that didn't happen. There should be no breaking changes.

### Report

* __BUG__: Percentage layouts will now limit decimal places to 4 to avoid bizarre floating point numbers being used as CSS values.

### Parser

* __BUG__: Exact timespans with hours now parse properly.
* Most of the main parser nodes now provide parser names, so error messages can be a little less obscure.
* Time ranges can now be specified relative to yesterday, today, and tomorrow e.g. `yesterday at 10`.

### Data

* There is now a `case` formatter that works with upper, lower, snake, kebab, pascal, camel, and proper cases.
* The `in`, `not-in`, `contains`, and `does-not-contain` operators now support arrays on both sides, where the checked side must have all values appear in the source array in order for the affirmitive versions to return true.
* There is now an `intersect` operator that provides a unique intersection of two arrays.
* The `like`, `ilike`, `not-like`, and `not-ilike` operators now support arrays on both sides, where each element in the source will be checked against each pattern. If any pattern matches any source element, the affirmitive versions of this operator will return true.

### Designer

* The designer font sizes now more closely match the rendered output font sizes. There is still a bit of a difference between the preview and rendered output, but it's much less drastic.


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
