## 0.13.3

Pending Release

### Data

* __BUG:__ The `map` operator will no longer throw when applied to an undefined value.


## 0.13.2

2023-01-16

### Render

* __BUG:__ Hidden widgets will no longer break layouts.

### Designer

* __BUG:__ The designer expression editor will no longer fail to format if you haven't set any format options.


## 0.13.1

2022-12-13

### Data

* __BUG:__ The `like`, `not-like`, `ilike`, and `not-ilike` operators will now correctly operate on multiline strings, meaning that `'a\nb'` will properly match the pattern `'*a*b*'`.
* The `slice`/`substr` operator will now stringify arguments that don't have a `slice` method available using the `string` operator.

### Designer

__BUG__: The code editors in the designer now handle long lines and long expressions a little more gracefully, without the textarea and code getting and line numbers getting out of whack unless lines get very very long.


## 0.13.0

2022-12-07

### Data

* __BUG:__ An object will now only be considered to be an application if it has a single `a` key.
* The `in` and `not-in` operators can now check for:
  * nultiple keys in an object
  * entries in an array that match an application
  * entries in an object that match an application
* The `contains` and `does-not-contain` operators can now check for:
  * entries in an array that match an application
  * entries in an object that match an application
* The `map` operator can now map objects where an array of two items with the first being a string will replace the entry in the resulting object, a nullish value will remove the entry from the resulting object, and any other value will result in an entry with the same key and the new value in the resulting object.
* The `filter` operator can now filter objects to produce a new object containing only entries matching the filter. Sorts and groups are ignored for object filters.
* The `find` operator can now check objects and arrays for an entry matching an application.

### Parser

* __BUG:__ The parser will now properly parse a bracketed application as such rather than an s-expression with the operator being `=>`.

### Render

* __BUG:__ Having a widget with a height greater than `maxY` will no longer result in an infinite loop.


## 0.12.6

2022-11-11

### Parser

* The range parser is now more permissive with additional spacing and trailing separators.


## 0.12.5

0.12.1 - 0.12.4 tried some things to get dates and timezones sorted out, but it just didn't work out. We're gonna pretend like those never happened, and here's hoping 0.12.5 sticks.

2022-11-11

* __BUG__: Dates will now shift into the local timezone properly if there is no target timezone specified.


## 0.12.0

2022-10-28

### Data

* The `in` operator can now check for numbers in print-style ranges. Print style number ranges are strings of numbers and ranges seperated by at least a space, `,`, or `;`. Numbers may be negative. Ranges consist of two numbers separated by a `-` with no intervening whitespace e.g. `10-49`. Greater than and less than a number e.g. `<10` and `>20` create implicit ranges that go to +/- inifinity on the relevant side. A full example of a print-style range would be `1, 3, 17, 19-25, >999`.


## 0.11.6

2022-09-30

### Render

* __BUG__: Manual layouts that use negative coordinates will now properly account for margins that would previously cause the coordinates to render as positive.
* __BUG__: Widgets with height set to grow will now include their margin in their final height, like a contain widget. Those with a manual layout will also offset their bottom and right poisitioned children's coordinates by their top and left margin.

### Designer

* __BUG?__: Selecting a widget toward the end of the tree will no longer cause the non-scrollable html root element to scroll up in Firefox.


## 0.11.5

2022-09-30

### Render

* __BUG__: Containers that fill available space will now properly continue onto the next page if their contents don't fit in the available space.


## 0.11.4

2022-09-30

### Render

* Widgets and label parts can be assigned background color and border radius. The designer supports expressions for both for widgets, but label parts can only be assigned literals from the the designer. The renderer _does_ support expressions for label parts.

### Lib

* The `ParameterMap` and `ParameterBase` types are now exported from the main module.


## 0.11.3

2022-09-21

### Render

* __BUG__: 0 line heights on labels are once again rendered correctly as `initial` rather than the label height.

### Data

* Schema validations for unions where the overarching type on a branch matches but has sub-match issues will now report the last sub-match issues if all branches fail.

### Designer

* Expression editor text heights now render more accurately, alleviating caret offset issues with longer expressions.


## 0.11.2

2022-09-10

`0.11.1` needed a do-over due to missing updated types.

### Render

* __BUG__: Fixed line heights will once again render correctly.
* __BUG__: Containers that aren't allowed to bridge will no longer try to continue if they run out of vertical space in a paged render.
* __BUG__: Repeaters now properly handle resuming rows that request continuation.

### Designer

* Measured labels and plain labels now render the same way in the designer.

### Lib

* The `Parameter` type definition now includes its `options` and `label` properties.


## 0.11.0

2022-09-03

### Data

* __BUG__: The `date` operator will now properly handle a relative range without a time specifier.
* __BUG__: The `string` operator will now correctly allow stringifying arrays rather than always joining them.
* `+`, `-`, `/`, `*`, `%`, and `/%` now have alpha aliases `add`, `subtract`, `divide`, `multiply`, `modulus`, and `intdiv`, so that they can be invoked with call syntax.
* The addition operators can now operate on object arguments, where the result will be a new aggregated shallow copy of each object, effectively `Object.assign({}, ...args)`.
* Number formats now allow for accounting-style negative numbers with an additional argument specifying sign, wrap, or both.
* The report definition now allows for an additional expression to contribute to the base context before the report is run. Data sources are available during evaluation, any variables set will go into the root data (which is the context for the evaluation), and if the result of the expression is an object, it's properties are copied into the root context.
* The proper case formatter will now handle values with apostrophes.

### Render

* __BUG__: Non-string values emitted into labels will no longer throw an exception.
* __BUG__: Continuous reports will now render a legible page in dark mode on screens.
* __BUG__: Measured labels will now break words to wrap, so a long word, series of long words, or group of symbols next to words will no longer throw off the measurement by causing an early wrapping.
* `@group` is now exposed to footers in addition to group headers and row contents.
* `@grouped` is now a boolean and exposed to group headers and row contents in addition to footers.
* `@source` and `@level` are now exposed to group headers, rows, and footers.
* Widget font properties can now be supplied as expressions that are evaluated in the context in which the widget is rendered.

### Designer

* __BUG__: Bottom pane property editors will now render correctly in mobile layouts.
* __BUG__: Fetched data sources will no longer error due to multiple read attempts.
* The left properties panel and widget tree will now balance more evenly on smaller layouts.
* Context expressions can now be provided for containers.


## 0.10.15

2022-07-21

### Data

* There is a new built-in `pipe` operator that can automatically pipeline operaions. The first argument is evaluated, the result is passed to the second argument and evaluated, the result is passed to the next argument and evaluated, and so forth until the last argument, the result of which is the value returned from the pipe operation. Application arguments are automatically passed the piped value. Operations that don't reference the new special `@pipe` reference or its shorthand `_` will have their argument list prepended with a reference to `@pipe`, which allows things like `pipe(some-list filter(=>age > 18) map(=>'"{name}\n{address}\n{city}, {state} {zip}"') join(','))`.

### Designer

* The designer now supports editing report context and exposes the report context to evaluated expressions and report runs.
* The designer will now persist the current report definition between reloads. It will also persist the current eval expression if it's not linked to something, like a widget or data source, and the bottom pane state (open, maximized). There is a half-second window before the state loads, and if the state is not loaded before a subsequent refresh, it will be cleared.


## 0.10.14

2022-07-05

### Data

* __BREAKING BUG__: The schema validator no longer considers a required object key to be valid if it is nullish, unless null is explicitly allowed in a type union.
* __BUG__: Relative dates will now satisfy the schema validator when it requires a date.
* `inspect` is now exposed as a built-in operator to allow generating a schema from an existing set of data.

### Parser

* __BREAKING BUG__: Built-in alpha operators and keywords are no longer considered valid reference names. This avoids strange parsing errors with what appears to be valid syntax.
* __BUG__: Trailing separators are now allowed in tuples.
* The parser now supports single-line-style comments before most expressions e.g. `// this is a comment`. Comments always apply to the succeeding expression, and the formatter makes this clear by adding a line before the comment.

### Designer

* The designer now supports more `fmt` options.
* The eval pane can now be expanded up using the additional arrow to the left of the original to allow editing more complex expressions.


## 0.10.13

2022-05-05

### Data

* __BUG__: The `time-span` operator can now handling `unit::d` spans where the date in the target month doesn't exist e.g. days between `2022-01-31` and `2022-02-28` will result in `28` rather than `31`.


## 0.10.12

2022-04-25

### Data

* __BUG__: The `date` operator will no longer try to parse `Date` objects.


## 0.10.11

2022-04-25

### Data

* The `date` operator and formatter will now parse string dates using the built-in date parser if possible, so that the resulting date is in local time rather than whatever `Date.parse` decides it should be in.
* The `date` operator, when used in non-relative/parse mode, can now set the year, month, and date when called and passed optional `y`, `m`, and `d` named arguments. The `m` month argument is calendar-based rather than 0-based. There is also a named argument `clamp` that will prevent `date('2020-02-01' d:31)` from resulting in `2020-03-02` and result in `2020-02-29` when truthy instead. The same applies to months e.g. `2020-13-31` will become `2021-01-31` without `clamp`, but with will result in `2020-12-31`.


## 0.10.10

2022-03-23

### Data

* __BUG:__ `diff` will no longer try to read properies of an `undefined` object in some scenarios.


## 0.10.9

2022-03-21

### Lib

* Export `labelDiff` in root module.


## 0.10.8

2022-03-18

`0.10.7` was also no fully built when published, so... yeah.

### Data

* There is now a `num` operator that will return the first positive number from a string, including an optional decimal.


## 0.10.6

2022-03-11

### Data

* __BUG__: The `date` operator, or more precisely the underlying function that converts a relative date to an ES `Date`, now handles timezones more consistently.
* The `filter` exported method will now operate directly on arrays and accept a non-`Context` context.
* The `diff` exported function can now be told to treat specific arrays as sets by providing an identity function for the arrays' members, with identity functions for specific arrays specified by keypath. The identity function can be `true`, a string, or a function. If `true`, the value itself is used. If a string, that key on each object is used e.g. `item[string]`. IF a function, the result of calling the function with the value is used.
* There is now a `diff-label` function that will take a `Diff` and a tree of labels and replace the keypaths in the diff with the matching label.


## 0.10.5

2022-03-09

`0.10.4` was not fully built when published, so let's pretend that didn't happen.

### Data

* __BUG:__ The `date` operator will now properly convert a relative date with a timezone.
* A delimited report with no defined fields will output all data.
* Sorts can now specify a descending operation as a string e.g. `['-=>some-expr' '-=>other-expr']`.
* Delimited reports with a grouped source will now ignore the group and use the ungrouped data.

### Designer

* There is now a dark mode that will automatically follow browser settings.
* Widgets will once again use the set font size.
* The designer now renders as more representative of the output by moving container control bars outside of the widget and hiding them when they aren't focused.
* Page footers in the designer are now placed where they will be in the output.
* The designer is now less mobile-hostile.
* Right-padded labels now render more accurately in the designer.
* There are now settings for the designer that control the theme, report output theme, and whether autosave is enabled.
  * Enabling autosave will save most of the relevant state of the designer before the designer unloads and load it back when the designer is loaded again. Autosave is also project-aware.
* There is now a project change indicator if a project is loaded.
* `pre` label widgets no longer render in the designer with a leading blank line.


## 0.10.3

2022-03-02

### Parser

* __BUG:__ The `any` schema type will no longer break the parser.
* __BUG:__ Named schema types can now start with any of the built-ins e.g. `anything` and `booleanish` are now valid names.


## 0.10.2

2022-03-02

### Data

* The `in` operator can now check for keys in objects.
* Checks in schemas now get access to a full context of the check, so the application can access other parts of the object tree being checked.
* Schemas can now declare named types, which can be used anywhere a primitive type could be used, including as arrays. Type declarations must come before the schema definition in a literal. Conditional checks can be used at both declaration and use sites.

### Parser

* __BUG:__ Stringifying a binary op will no longer drop arguments.
* Individual elements of a schema union can now have conditional checks.


## 0.10.1

2022-03-02

### Data

* __BUG:__ Binary operations that have an object for a second argument will no longer stringify it as named args.
* __BUG?:__ Postfix `get` on an operation will now stringify correctly.
* There are now `diff` and `deepEqual` functions exported by the main library. `Diff`s are a map of keypaths to a tuple of left value to right value for primitives that don't match.
  * `diff` is exposed as a default expression operator.
  * `deepEqual` is also exposed as `===` and `deep-is`, with the negated versions `!==` and `deep-is-not`.
* Add support for schema literals and a `validate` function that will check a value against a schema, which can include primitives, arrays, objects as interfaces, tuples, and type unions. There is also support for additional checks on types in the form of an applicative that can perform more specific checks at runtime.
  * `validate` returns `true` if there are no mismatches, or an array of error objects if there are.
  * There is a strict mode that will validate that no extra key or tuple values are in the checked value.
  * `validate` is exposed as an expression operator, and there's a boolean-only version exposed as `valid`.
  * There are `parseSchema` and `unparseSchema` functions exported by the library, and the `parse` and `unparse` expression operators can now be passed a `schema` flag.
* Application can now be called as operators if they are uniquely named in the data e.g. `let foo = |l r|=>l + r; foo(10 10)`.
* There is now a nullish coalescing operator `??` that will return the first non-null/non-undefined argument.

### Designer

* __BUG__: Alignment within expression viewers in widgets renders correctly again.
* ctrl+enter in the evaluation window will execute the expression.
* Highlighting for `let` and `set` match reference highlighting.
* There is now a compact format option that will turn on `noIndent` and set `listWrap` to `0` when formatting expressions.


## 0.10.0

2022-02-21

### Render

* __BUG:__ Heights in percentages now render correctly against total parent size. They also respect contain/expand box properties.
* There are now watermark and overlay containers available on displayed reports.
  * Watermarks are rendered below the report page content.
  * Overlays are rendered above the report page content.
  * In paged reports, both get access to the `@size` special reference, which has `x` and `y` properties that correspond to available page width and height, respectively. They also have access to the usual `@page` and `@pages` that headers and footers get.

### Data

* __BUG__: `date` properly supports time plus timezone time strings as the second argument. For instance, `date(#now# :midnight-10)` in `-5` will result in <F8>
* __BUG__: Date literals with a timezone will no longer shift when formatting as a timestamp.

### Designer

* __BUG:__ The widget tree can now remove page headers and footers in addition to the new watermarks and overlays.
* Containers with a set height will now render with a set height, though for percentages it is a percentage of the width because CSS.


## 0.9.5

2022-02-09

### Parser

* __BUG__: `parseTime` will now properly parse a time that could also parse as a timezone rather than parsing it as a timezone.

### Data

* The `date` operator now offers the option to `shift` a relative date to the target timezone rather than just setting the timezone on the date.
* You can now register multiple aliases for a formatter at the same time using a `string[]` as the name parameter.
* The `timestamp` is renamed to `iso8601` and a new `timestamp` formatter that results in a more human readable timestamp without a timezone replaces it. A more readable timestamp formatter with timezone is available as `timestamptz`.


## 0.9.4

2022-02-08

### Data

* The `date` operator now supports parsing in native mode, meaning it will return a raport date rather than a JS Date if asked. You can do so by passing a named argument (either `rel` or `parse`, which do the same thing) that's truthy e.g. `date(some-string rel:1)`. It will also adjust the time or timezone, if possible, on the resulting date if you pass it a second argument e.g. `date(some-date :-8 rel:1)` gives you `some-date` but in PST.
* There are now official `parse`/`unparse` operator to parse and stringify raport expressions, dates, times, and templates. `unparse` is an alias for `string` and will automatically put it into `raport` mode. `string` gets named arguments for requesting `json` mode and `raport` mode. In `raport` mode, any additional named arguments are passed to raport's `stringify` operator.

### Designer

* __BUG__: The projects tab will no longer automatically disappear if you don't have any stored projects. The flag to hide the tab is now `showProjects` rather than the already used `projects`.
* Longer expressions (5 or more lines, wrapped) will now automatically show line numbers in expression editors.


## 0.9.3

2022-02-04

### Library

* Builds will now properly update the typings.
* Report parameters now support `string`s with a `refine` property that can be used to change the designer-rendered editor. Current this supports `text` for a textarea/multiline input and `code` for an expression editor.
* Report parameters now support initialization via an `init` parameter that can be an expression. Parameters are initialized at report run, with `run` supplied parameters `Object.assign`ed over the init parameters.
* New helper function `initParameters` returns a parameter map composed of report parameters that have initializers.
* New helper function `template` will evaluate a template expression and return the resulting string, which is much more convenient than supplying the template parser to a context when evaluating the expression.

### Render

* Image widgets will now use an `<img>` tag for fit stretch so you can avoid needing to enable backgrounds when converting the HTML to PDF.
* Image fit can now be an expression.

### Data

* ___BUG__: Converting a relative date to an exact date now accounts for the time zone.
* The `date` format now supports outputting the time zone using `z`, `zz`, `zzz`, and `zzzz`.
* The `date` operator now supports moving the date into another time zone in addition to the existing support for adjusting the time.

### Parser

* Time zones can now be in the iso8601 format without a `:`.

### Designer

* __BUG__: New line handling in the middle of a expression editor no longer duplicates text.
* __BUG__: The expression editor textarea and displayed code no longer get their sizes out of sync when the parent font size is not 1 em.
* __BUG__: The root context root reference sigil is now `~` rather than the old `#`.
* __BUG__: Avoid exception caused by designer available sources becoming something other than an object.
* Property type switch buttons are now all normalized with the same icon.
* Properties with editors can now all be edited in the external expression editor.
* Expression properties that are being edited in the eval expression will unlink if their parent object gets removed or type changed from `object`.
* The expression editor now handles backspace in leading indent as outdent and home will jump between the beginning of the line and the first non-space character.
* The designer will now start with the report widget selected.
* The projects tab can be hidden, which is useful for embedding.
* `debounce` is now exported by the designer library.
* You can now re-initialize report parameters from the parameters entry pane. Parameters are automatically initialized if the report parameters array is replaced.


## 0.9.2

2022-01-30

### Render

* __BUG__: Image widgets stay within their bounds if they have a margin.
* __BREAKING__: Image widgets can now be set to cover, stretch, or contain, which is the default. This uses `background-image`, so it will require printing backgrounds to output the image.

### Designer

* __BUG__: The designer run output no longer includes html shadows for print output.
* Expression properties now use the code editor for input.
* The code editor will now maintain the indentation of lines.
* Irrelevant widget properties are no longer available in the property editor.


## 0.9.1

2022-01-29

### Render

* __BUG__: Another scenario with empty containers causing a `NaN` height to break layouts is now fixed.
* There is now support for report-level base font settings.
* Width handling has been expanded to allow choosing contain or expand for widths and margins, where contain will cause the final width of the widget to be the set width with the margins within and expand growing the width by the size of the margins. Percentage widths default to contain and other widths default to expand.
* Widths now support grow/fill mode, where they expand to fill the remaining `x` axis space in the layout. In manual layouts, this is the width of the container remaining from the `x` coordinate of the widget.
* The output of flowed reports with a set width will now be centered on screens.
* Containers now have the option to bridge page breaks, rendering what will fit at the bottom of one and resuming at the top of the next.

### Designer

* __BUG__: `classifyStyles` set to `false` is now exported correctly in compact mode.
* Changes to the defition can be undone/redone using `ctrl-z`/`ctrl-shift-z`.
* Widgets can be moved from one container to another using the widget tree. Click the move button to put that widget into move mode and then click a container to move the widget. You can cancel the move by clicking the widget again or using the button at the top of the left pane.


## 0.9.0

2022-01-27

### Render

* __BUG__: Empty containers will no longer cause a `NaN` height to break layout.
* Heights can now be set to `grow`, which will cause the widget to consume the remaining vertical space, accounting for margins.
* Manual layouts can now specify negative coordinates to specify offset from the right and bottom edges of the container. Since `-0` doesn't survive in JSON, `-1` is the starting edge for the right/bottom e.g. `-1, -1` will have the widget touching the bottom, right corner of its container. This is particularly useful when combined with `grow`ing containers.
* Computed properties like `height`, `width`, `margin`, `hide`, and `br` now get access to `@placement` and `@widget` special values in the computation context.


## 0.8.11

2022-01-11

### Render

* __BUG__: Measured labels now output classy styles correctly.
* __BUG__: Containers with a manual layout will now default the coordinates for any given child to 0, 0.
* __BUG__: Containers will now use their inner width (width widthout margins) as available inner space to avoid child overflow.
* __BUG__: Widgets with percentage widths will now render with an exact computed width rather than a percentage, so margins are fully respected.


## 0.8.10

2022-01-05

### Data

* __BUG__: `time-span` will now properly handle leap years.


## 0.8.9

2021-12-31

### Data

* __BUG__: `time-span` will once again compute `unit::d`, `unit::M`, and `unit:[:M :d]` as accurately as is possible with the given input. For exact spans with an anchored start timestamp, it should be exact.


## 0.8.8

2021-12-16

### Data

* __BUG__: `time-span` will once again handle DST boundaries correctly.


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
* The `time-span` operator can now handle producing exact spans from date to date when passed two dates as the first arguments.

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

* __BUG__: Filters once again correctly evaluate applications.

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
* The `Root` context class will now accept an `ExtendOptions` object to initialize parameters and special refs.

#### Report

* Paged reports now include `@page` style size that makes generating pdfs with puppeteer pretty painless.
* The repeater can now use an expression as a source.
* The report runner `run` function will now accept parameters or a context rather than just parameters.
* Reports may specify initialization data for the root context as part of their definition.
* `delimited` reports can now have the same `sources` specified as displayed reports. The main source can optionally be specified by name using `source`, and if none is provided, the first source from `sources` is used.


## 0.0.1

2019-10-08

* Initial release
