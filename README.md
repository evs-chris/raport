# Raport: Simple reports. No Ragrets.

Raport is a text/html reporting tool that takes one or more json data sources and uses a template to generate delimited text (csv, tsv, etc) or html that can be paginated for printing. When printing paged reports from chromium-based browsers, turn off the margins, as they're built into the report, and be sure to match the paper size and orientation.

While reports are it's main goal, raport templates happen to be pretty decent at rendering other sorts of printable media, like form letters, menus, and brochures.

## Reports

There are three ways to run reports: as delimited text using a single datasource, as a flowed html report using as many datasources as you like, and as a paged html report using as many datasources as you like. Any report datasource can be filtered and sorted, as can be seen in the data section below.

### Delimted

Delimited reports are not really meant to be viewed. Instead, they are meant to be consumed by another application e.g. a spreadsheet or a custom import program for some other application. As such, they are very limited in supported functionality. Here are the pieces of a delimited report definition beyond the datasource:

* **`header`**: An optional list of strings to be included as a header row.
* **`quote`**: An optional string to use when quoting fields. Any occurance of the quote string within the data is automatically doubled per the CSV "standard" e.g. `Joe's Magical Donut Shop` with a `'` quote will become `'Joe''s Magical Donut Shop'` in the output.
* **`field`**: An optional field delimiter string that defaults to `','` if not supplied.
* **`record`**: An optional record delimiter string that defaults to `'\n'` if not supplied.

That's pretty much it. When run, the datasource is evaluated, and a string is built from the parameters and records within the datasource.

### Displayed

Displayed reports are built from report widgets that either declare their sizes or are automatically sized based on the size and positions of their content widgets. The base building widget of a report is the `Container`, which is simply a widget that contains other widgets, optionally applying a layout to them or using a static layout that is defined using `x`, `y` coordinates within the container.

Any displayed report has a top-level array of widgets that are typically containers. Coordinates and sizes are specified in `rem` wherein an inch of "paper" is made of 6 `rem`.

**Context**

A context is simply a wrapper around a piece of data that includes the ability to access special values that may exist in that context that are not directly related to the peice of data. It also has access to its parents and roots. Context is implicitly introduced in certain widgets, and may be explicitly introduced in containers. References are resolved from a context during evaluation.

**Widgets**

In addition to containers, the basic widgets supplied in this library are the `Label`, `Repeater`, `Image`, `Measured`, and `HTML`.

* `Container`: This is simply a widget that holds other widgets and acts as a local reference for coordinates. Containers have pluggable layouts that default to something like a flex row. The other built-in option is a static list of `x, y` coordinates that are applied to the child widgets in the same order that they are specified.
* `Label`: This is pretty much what you'd expect. It renders a piece of text that can be composed of multiple parts. The parts may be literal values, references, operators, or spans, which are sort of a sub-label that is composed of a part and optional styling.
* `Measured Label`: This is a label that estimates its height based on its content and applied styles. The estimation is not exact and is based on average character width for a few standard font metrics.
* `Image`: This is also what you'd expect. You can supply a `url` as a literal, reference, or operator that is used to render the image into the output HTML.
* `Repeater`: This is the most useful widget for reporting purposes. It is composed of an optional `header`, an optional `footer`, optional `group` headers, and `row`s. The row `source` must be either an array or a grouping that eventually results in an array. A repeater will render each of its pieces in a page-aware way, so if there's not room left in the report for a header, footer, or row, it will suspend rendering and resume at the appropriate place when called again. Repeaters automatically handle grouped datasources and support footers for each nested group automatically if required. Footers get access to a special `@source` reference that allows aggregate operators to automatically apply to all of the rows in the repeater. 
* `HTML`: This is somewhat like a label, except it doesn't escape any html in its content. It also doesn't verify that there's nothing malformed, so it's possible to break your output with a missed closing tag.

  The grouping of the data source for a repeater will determine how many nested sections show up on the report with actual rows only being rendered for the innermost (rightmost in the array) grouping. The `group` key on the repeater widget is an array that can specify a header for each grouping in the source. The `groupEnds` key on the repeater widget specifies whether footers should be rendered for each group in reverse order with an additional entry at the end for the whole repeater, meaning that the first entry is for the innermost group, proceeding outward to the extra entry for all data before groupings are applied.

**Widget Properties**

| Property | Type | Applies To | Description |
| -------- | ---- | ---------- | ----------- |
| `type` | `string` | *all* | Specifies what registered widget this should be. The built-ins are `container`, `label`, `measured`, `image`, `html`, and `repeater`. |
| `hide` | `boolean \| value` | *all* | If the property is or evaluates to `true` the widget will be skipped during render. |
| `font` | `font-object` | *all* | Specifies text properties for a widget and its children (CSS cascade). See below for supported properties. |
| `border` | `number \| number[] \| object \| value` | *all* | Specifies borders for a widget as widths in 16ths of a `rem`. If a `number`, specifies bottom border width. If an `object`, it may have `top`, `bottom`, `left`, and `right` properties with number values that correspond to those border widths. If a `number[]`, the arrity determines behavior: `1` sets all widths to the first element; `2` sets `top` and `bottom` to the first element and `left` and `right` to the second element; `3` sets `top` to the first element, `right` and `left` to the second element, and `bottom` to the third element; and `4` sets `top`, `bottom`, `left`, and `right` to the elements in that order. If a value, the evaluate can be a `number`, `number[]`, or `object` corresponding to the design-time constructs enumerated here. |
| `margin` | `number \| number[]` | *all* | Specifies the padding inside the widget in `rem`, as CSS margins don't play well with positioning inside containers. A `number` is shorthand for a `4` element array with the number as each element. The arity of the `number[]` determines which paddings get set: `2` sets the `top` and `bottom` to the first element, and `left` and `right` to the second element; and `4` sets the `top`, `right`, `bottom`, and `left` to the elements in that order. |
| `width` | `number \| object \| 'grow'` | *all* | If a `number`, sets the width of the widget in `rem`. If an `object` with a `percent` property, sets the width of the widget in percent. If not set, the widget with fill the full width of the parent. If `'grow'`, the widget will fill the remaining width of the parent, even with manual layouts based on the `x` coordinate. |
| `layout` | `string \| {x,y}[]` | containers | If a `string`, uses the named registered layout. If an array of objects with `x` and `y` properties, child widgets are placed at the coordinates specified at the index in the `layout` array that corresponds to their index in the `widgets` array. If a coordinate is negative, it will apply from the opposite side of the container i.e the right side for `x` and the bottom for `y`. |
| `widgets` | `widget[]` | containers | Child widgets to render within this widget. |
| `bridge` | `boolean` | container | Bridging allows a container to break over a page boundary. By default, containers must fit in the remaining space on a page in order to render, but bridging will render what fits in the remaining space and the rest on the following page. |
| `height` | `'auto' \| number \| object \| 'grow'` | *all* | If a `number`, specifies the height of the widget in `rem`. If an `object` with a `percent` property, specifies the height of the widget in percent of the available space. If `'auto'` or not set, sets the height to whatever contains its children or `1rem` if there are no children. If `'grow'`, the widget will fill the remaining available space in its parent. |
| `format` | `value` | `label` | The format to apply to the value produced by the label. This can be paired with a label `id` to allow aggregates to be applied to fields in a repeater without recomputing. |
| `fit` | `'contain'\|'cover'\|'stretch'\|value` | `image` | How to display the image within the allotted area. `'contain'` is the default and will fit the entire image in the area maintaining aspect ratio. `'cover'` will fit the image within the area maintaining aspect ratio and clip whatever doesn't fit outside the aspect ratio. `'stretch'` will stretch the image to fill the allotted area, skewing the aspect ratio if it doesn't match. This is the only option that will render in an `img` tag, which means background rendering doesn't need to be enabled when printing/rendering to PDF to have the image output. |
| `text` | `value \| object[]` | `label` | The text content for the `label`. If this is an array of `object`s, each object may specify a `text` property and a `font` property, where the `text` will be wrapped in a `<span>` with the `font` properties applied. |
| `text` | `value` | `measured` | The text content for the `measured` label. |
| `id` | `string` | `label` | A string used to collect the values of labels in a repeater. |
| `html` | `value` | `html` | The HTML content to be displayed, supplied as a template rather than a plain expression. |
| `url` | `value` | `image` | The url of the image to display. |
| `context` | `value` | `container` | A new context to add to the context stack for the widgets within the container. This can be used to introduce values that will need to be referenced from child widgets. |
| `source` | `value \| object` | `repeater` | The source of data for the repeater. If an `object`, this can be a report source with a `name` and optional `filter`, `sort`, and `group` properties. Otherwise, the evaluated value should be a source or an array. |
| `header` | `widget` | `repeater` | An optional header to be rendered before any data. |
| `row` | `widget` | `repeater` | A widget to be rendered for each element in the source. |
| `footer` | `widget` | `repeater` | A widget to be rendered after any data. If there are multiple groups in the source, rendering of the footer is controlled by the `groupEnd` property. |
| `group` | `widget[]` | `repeater` | An array of widgets to be rendered before any data at the beginning of each group. The widgets in the array correspond to the groups in the source, so the first widget will be rendered for each item in the first group source, and the second widget will be rendered for each item in the second group nested within the first, etc. |
| `groupEnds` | `boolean[]` | `repeater` | An array of `boolean`s that specify whether of not the `footer` should be rendered at the end of each group. The first element applies to the innermost group, the second to the next containing group, and so on. If there is one more element in the array than the number of groups in the source, it will control a final render of the footer for all of the data in the `repeater`. |

**Font Properties**

| Property | Type | Description |
| -------- | ---- | ----------- |
| `family` | `string` | Sets the CSS `font-family`. |
| `color` | `string` | Sets the CSS `color`. |
| `align` | `string` | Sets the CSS `text-align`. |
| `size` | `number` | Set the CSS `font-size` in `rem`. |
| `line` | `number` | Set the CSS `line-height` in `rem`. |
| `weight` | `number \| string` | Sets the CSS `font-weight`. |
| `pre` | `boolean` | If `true`, sets CSS `white-space` to `pre-wrap`. |
| `clamp` | `boolean` | If `true`, set CSS `white-space` to `nowrap` and `overflow` to `hidden`. |
| `right` | `number` | If not `margin` is set on the widget, this will set a right margin in `rem`. This is useful for right-aligned text next to left-aligned text to keep them from running together. |


#### Flowed

A flowed report may optionally have a width, but it never has a height. As such, a flowed report will continue on without interruption until all of its content is rendered.

Flowed reports can optionally include watermarks and overlays, which are only rendered once at the top of the report output. See the description in the Paged report section below for more information.

#### Paged

A paged report requires a page size in order to render, and an orientation can optionally be supplied too, where the runner will handle flipping the dimensions and margins around to handle the orientation.

Since a paged report has height constraints on any given piece of the report, rendering of widgets can be optionally interrupted and resumed on a new page. Whether or not a widget supports interruption is up to the individual widget, but by default most containers require that their entire content fit in the available space in order to render. If a widget can't fit on the page by itself, it will render as an error placeholder.

Paged reports can optionally include page headers and footers that are rendered at the top and bottom of each page if supplied. The context for headers and footers contain additional special variables `@page` and `@pages` the contain the current page number and total number of pages, respectively. Page headers and footers are always expected to be the same size.

Paged reports can optionally include watermarks and overlays that are rendered below and above the report content of each page if supplied. The context for watermarks and overlays contain the same special variables as headers and footers and additionally get a `@size` variable that has `x` and `y` properties corresponding to the usable page width and height respectively.

## Data

Most data is in a tree or graph format encapsulated in a datasource. Without a datasource, a report isn't going to do much good. Datasources are handled by the root context, which is simply a wrapper around an object that contains a `value`, a few special storage points, a reference to itself as root, and no parent reference. Further contexts can be extended from the root context that encapsulate a different value, but they will have pointers to the root context and the context from which they were extended, which may also be the root context.

Contexts are used to give a report access to data in a particular widget. The report base context is the root context, and widgets have the opportunity to modify their context or add additional contexts as they are rendered. They can also evaluate values from their context to retrieve or manipulate data.

### Values

Values are one of a reference, a literal, or an operation, which are composed of operators, references, and literals. There is a built-in expression syntax that simplifies building operations a bit using strings. The direct definition form uses a tree of nested objects and arrays.

#### Literals

| Literal | Type | Example | Notes |
| ------- | ---- | ------- | ----- |
| `true` | `boolean` | `true` | |
| `false` | `boolean` | `false` | |
| `null` | any | `null` | |
| `undefined` | any | `undefined` | |
| number | `number` | `-3`, `10.420`, `1_723_636`, `-1.523e3` | Numbers follow the format `/[-+]?\d+[_\d]*(\.[_\d]*)?([eE][-+]?[_\d]+)?/`, which is a perfectly readable way to describe a number format. In actual words, that's an optional leading `+`/`-`, at least one digit, as many digits or underscore separators as you like, an optional decimal with as many digits and underscore spearators as you like, and an optional exponent (scientific notation) with as many digits and underscores as you like. |
| symbol string | `string` | `:joe`, `:some.string` | Symbol strings are a shorthand that avoid quotes. They start with a leading `:` and run until a space, quote, or brace/bracket/paren. |
| quoted string | `string` | `'a string'`, `"here're double quotes\nand an escape"` | Quoted strings are your typical strings with support for backslash escapes. They support the usual c-style single char escapes, 2-digit hex escapes, and 4 digit unicode escapes. Quotes supported are single, double, and backticks. |
| interpolated string | `string` | `'an {interpolated} string'` | Interpolated strings are actually syntax sugar for a `+` operation in most cases. They are like regular quoted strings, except any `{ ... }` sequences are evaluated and injected into the string. These support everything a quoted string does, except being quoted with double quotes. Backticks quoted strings require a `$` in front of the curly braces, like javascript. |
| date | `Date\|DateRel\|number` | `#2012-2-22#`, `#last week#`, `#2012-02-22 22:33#`, `#3 weeks 22 hours 7 seconds#` | Date literals allow you to refer to a date that is either exact (if it has a time down to the minute specified), as a millisecond interval (if it is just a timespan specified in a number of weeks, days, hours, minutes, seconds, and/or milliseconds), as a relative timespan if years or months are specified, or a range of times (if it is relative, like last week, today, 2012-2-22, or 2012). The exact form also accepts an optional timezone. Dates in the exact form that don't specify anything more precise than to the hour are automatically a range from the smallest possible value to the largest possible value e.g. 2012 is from 2012-01-01T00:00:00.000 to 2012-12-31T23:59:59.999. Converting a range to a date will default to the smaller value, but it can be set to use the larger value by including a `>` at the end of the literal e.g. `#2012>#` converts to the last millisecond of 2012. |

Literals in definition form are an object with a `v` property containing the literal value, and when in this form, the value can be any valid js value. Examples in definition form: `{ v: true }`, `{ v: 'some string' }`, `{ v: ['an', 'array'] }`, `{ v: someVariable }`. Dates are a bit more complicated, and I wouldn't recommend constructing them by hand.

#### References

References may appear in any mix of dotted path or bracketed path notation. Any character within a path may also be escaped with a backslash, which allows referencing dotted keys in object more easily e.g. `person.time\.span`. Number and string literals in bracketed paths are automatically converted to the dotted form, but any other expression will result in that expression being evaluated in the current context before being used as a key. References are resolved with the first key in their path starting in the current evaluation context. There are also a few sigils with special meaning that may appear at the beginning of a reference:

* `~`: Starts the reference from the root context rather than the current context.
* `!`: Refers to the report parameters.
* `*`: Refers to the report sources.
* `@`: Refers to the nearest context with special references. These are managed by the report widgets that build context e.g. a repeater or container.
* `^`: Starts the reference from the current context's parent. These can be stacked e.g. `^^` refers to the grandparent context.

In defintion form, references are an object with the path as a string at an `r` key. Examples in definition form: `{ r: 'name.length' }`, `{ r: '~info.address.line1' }`, `{ r: '@index' }`. The paths can also be specified already split with separated prefixes as `{ r: { k: ['name', 'length'] } }`, `{ r: { p: '~', k: ['info', 'address', 'line1'] } }`, `{ r: { p: '@', k: ['index'] } }`, and further, context bumps are a separate number e.g. `{ r: { p: '@', k: ['index'], u: 2 } }` would be `^^@index`. `*info.addresses[@index].line1` is an example of a bracketed, which would be `{ r: { p: '*', k: ['info', 'addresses', { r: { p: '@', k: ['index' ] } }, 'line1'] } }` in definition form.

##### Special references

There are a number of special references that are context-specific:

| Reference | Scope | Value |
| --------- | ----- | ----- |
| `@value` | any | The value of the current context. This is useful for passing the whole value of a context as an argument. |
| `_` | any | Sugar for `@value` |
| `_` | case condition | Sugar for `@case` |
| `@index` | repeater | The index of the nearest repeater iteration. |
| `@group` | repeater | The nearest group by value, if any. |
| `@level` | repeater | The nearest group level, if any. |
| `@source` | repeater | The nearest repeater source, if any. |
| `@values` | repeater | An object with keys pointing to an array of values collected from labels in the repeater ids mapping to keys. |
| `@case` | case | The value that is being checked against the conditional branches. |
| `@sources` | any | The root context sources. |
| `@parameters` | any | The root context parameters. |
| `@local`| any | The locals for the immediate context. |
| `@locals`| any | The locals for the nearest context that has any. |
| `@special`| any | The specials for the immediate context. |
| `@specials`| any | The specials for the nearest context that has any. |
| `@placement` | width, height, margin, hide, br expressions | The computed placement for the widget for which the property is being computed. |
| `@widget` | widgth, height, margin, hide, br expressions | The widget definition for the widget for which the property is being computed. |
| `@page` | page header, footer, watermark, and overlay | The current page number being rendered, starting with `1`. |
| `@pages` | page header, footer, watermark, and overlay | The number of pages in the report output. |
| `@size` | page header, footer, watermark, and overlay | An object with `x` and `y` properties corresponding to the usable width and height of the page. |

#### Operations

Raport has a universal call syntax based on s-expressions in addition to some sugar to make it a bit more comfortable to those who don't often frequent the lispy bushes on the fringes of programming languages. Anything that executes is called an operation, and there are three different types of operators that share the same syntax: simple, checked, and aggregate. All three accept arguments, and aggregates may accept an implicit source argument. The expression form looks like `(op-name arg1 arg2)` and the definition form looks like `{ op: 'op-name', args: ['arg1', 'arg2'] }`. Any of the arguments may be another expression, including another operation. Using that simple form, you can compose just about anything you could want to. Arguments may be separated by space and/or commas.

Arguments may also be specified in a named form, which will result in them being collected into an object expression and moved to the end of the argument list. Named arguments have an identifier followed immediately be a `:`, any amount of whitespace, including none, and then an expression. For instance `time-span(#now# - #2012# unit::y)` is equivalent to `(time-span (- #now# #2012#) { unit: 'y' })` and will result in the number of whole years between now and the first millisecond of 2012. Built-in operators that support named arguments will list them individually.

##### Syntax sugar

| Name | Example | Notes |
| ---- | ------- | ----- |
| unary operator | `not true` | Supported unary operators are `not` and `+`. |
| binary operator | `2 + 5`, `7 * 4 ** 2 + 1`, `person.birthdate in #today#` | Supported binary operators in order of precedence are exponentiation (`**`), mutiplication/division (`*`, `/`, `%`), addition/subtraction (`+`, `-`), comparison (`>=`, `>`, `<=`, `<`, `in`, `like`, `not-like`, `not-in`, `contains`, `does-not-contain`, `gt`, `gte`, `lt`, `lte`), equality (`is`, `is-not`, `==`, `!=`), boolean and (`and`, `&&`), and boolean or (`or`, `||`). At least one space is required on either side of a binary operator. |
| call | `op-name(arg1 arg2)` | Call syntax is supported as convenience over s-expressions because it tends to be more familiar. It supports fewer operator names than the s-expression syntax, and the unavailable operators tend to be binary or unary. The example converts to `{ op: 'op-name', args: [{ r: { k: ['arg1'] } }, { r: { k: ['arg2'] } }] }` |
| array | `[1, 2, 3]`, `[first middle last]` | Array expressions are surrounded by square brackets and contain any number of space and/or comma separated expressions. If all of the expressions are literals, the result will be a literal. If not, the result will be an array operation e.g. `{ op: 'array', args: [{ r: 'first' }, { r: 'middle' }, { r: 'last' }] }`. |
| object | `{ "foo": 2, "bar": "baz" }`, `{ foo:2 bar:[1 2 3] }` | Object expressions are surrounded by curly braces and contain any number of key-value pairs. The keys are optionally quoted strings, followed by a `:`. The values are any expression, and pairs are separated by space and/or commas. Like array expressions, objects containing only literals evaluate to a literal, and are otherwise an `object` operation. |
| application | `=>_ like :%a%`, `\|name1 name2 name3\| => name1 + name2 + name3` | Application expressions evaluate to their expression's definition form. This is used in many operations, and just about all aggregate operations, to apply an expression to an internal context e.g. `find(*people =>name is :Susan)`, where the find operator iterates over its source, in this case the data source named `people`, and evaluates its second argument, an application, with the current iteration as the context. Applications can optionally take argument names between pipes before the arrow. Arguments passed to an application are stored as locals in an extended context. Within templates, you can use `=\` in place of `=>` to avoid weirdness with escaped entities. |
| postfix reference | `op-name(arg1).path[ref]` | Postfix references allow an operation's result to be further pared down using a `get` operation. The example is equivalent to `(get (op-name arg1) =>path[ref])`. |
| postfix format | `person.birthdate#date`, `(amount * rate)#number,4` | Postfix format expressions apply a format operation to their expression. The name of the formatter follows the `#`, and it can be passed any number or optional arguments by following the name with a comma with no extra space. Further arguments are also separated by commas with no extra space. The second example is equivalent to `(format (* amount rate) :number 4)`. You may add a trailing `,` after the last argument to avoid ambiguity with binary operations. |
| if | `if foo then bar else baz`, `if not true then 42`, `if birthdate in #this week# then 0.10 else if lower(name[0]) == :a then 0.2 else 0`, `if foo { bar } elsif baz { bat } else { bop }` | If expressions allow you to set up one or more conditional branches, where the first starts with `if`, followed by a condition expression, followed by `then`, followed by the result expression that is returned if the condition expression is truthy, followed by 0 or more conditional branches, followed by an optional final case with no condition. The conditional branches start with `else if`, `elseif`, `elsif`, or `elif`; followed by the condition expression, followed by `then`, followed by the result expression that is returne if the conditional expression is truthy. The final case with no condition starts with `else` followed by the result expression. If the if is nested within another block-like operator, it can be terminated with `end` or `fi` to avoid parser confusion on where a trailing `else` should be applied. These convert to an `if` operation in the form of `(if cond1 res1 cond2 res2 alt)` |
| case | `case foo when 1 then bar when _ > 10 then :large else :nope`, `case foo when 1 { bar } when _ > 10 { :large } else { :nope }` | Case expressions are similar to if expressions, but they evaluate their first argument and place it in scope for each of the branches. Branches can also compare by value or as a boolean. The `case` operator introduces a new scope and exposes the target value as `@case`, and it also translates `_` references to `@case` within the condition operations, unless the they are applications. Branches are specified with `when` followed by a condition. If the case is nested within another block-like operator, it can be terminated with `end` or `esac` to avoid parser confusion on where a trailing `else` should be applied. There is also a block form, as in the second example, that uses blocks rather than keywords to delimit branches. These convert to a `case` operation in the form of `(case value cond1 res1 cond2 res2 cond3 res3 alt)` |
| let, set | `let foo = 'bar'`, `set fizzy.lemon[ade][2] = 42` | `let` and `set` operators set local or value expressions respectively. `let` always affects its immediate context, unless you apply context pop prefixes e.g. `^foo`. `set` will check for matching locals, and if none are found, will set based on the context value. `set` also allows context pops in addition to root references with `~`. `let` and `set` operators parse to `let` and `set` operations with the keypath as the first argument in literal form and the value as the second argument. |
| block | `{ let foo = 42; foo * 10 }` | The block operator evaluates each of its arguments and results in the value of its last argument. It also gets a new context, which is convenient for locals. The example is equivalent to `(block (let :foo 42) (* foo 10))`. |

The complement to the parser, the stringifier, also works as a `fmt` in that it spits out source in the preferred format by default, though there are a few options that can be toggled.

### Filtering, sorting, and grouping

Filters are simply expressions that are applied to each value in a dataset, where values that evaluate to a truthy value are included in the filtered set. Similarly, sorts are expressions that are applied to each value in the dataset and they used to sort the dataset (currently using `array.sort()`). A sort expression can be an array, where each expression is applied if the previous results in equality. Groupings are also expressions that are applied to each value in the dataset, and the result from the evaluation is used to group the values into a map of results with the group evaluations as keys.

All of these operations are supported on any dataset in a report, and some widgets have their own data sources that can extend the report data sources.

### Source definitions

Report sources define the way a data set should be mapped into a report. A report source must have at least a name and a source, which should be provided as a data set in the source map when the report is run. Report sources may also specify a `base`, which is a value that will be evaluated against the value of the dataset before filtering, sorting, and grouping is applied. This is useful for data sets that contain more than one addressable piece of data. Report sources may also specify a `filter`, `sort`, and `group`. Any of theses properties, including the `base`, have access to any of the data that exists in the context at the point that sources are being initialized, which includes report-defined context and any parameters that are set on the report run. This makes things like parameteried grouping much easier to accomplish.

### Built-in operations

There are a few operations built-in to the library to handle common expressions:

| Operator | Arguments | Result | Description |
| -------- | --------- | ------ | ----------- |
| `!=` | `...any` | `boolean` | This is an alias for `is-not`. |
| `%` | `...any` | `number` | Returns the modulus of the given values starting with the first. |
| `&&` | `...any` | `boolean` | This is an alias for `and`. |
| `*` | `...number`, `string, number` | `number`, `string` | Multiplies the given values starting with the first. If the first argument is a string and the second is a positive number, it will return the string copied that many times. |
| `**` |  `...number` | `number` | Applies exponentiation to the given arguments with right associativity e.g. `(** 1 2 3)` is `1^(2^3)`. |
| `+` | `...any` | `string\|number` | Adds the given values if they all pass `isNaN` or concatenates them as a string otherwise. If there's only one argument, it is parsed as a number and returned. |
| `-` | `...any` | `number` | Subtracts the given values starting with the first. |
| `/` | `...any` | `number` | Divides the given values starting with the first. |
| `/%` | `...any` | `number` | Divides the given values starting with the first using integer division. |
| `<` | `any, any` | `boolean` | Returns true if the first value is less than the second value. |
| `<=` | `any, any` | `boolean` | Returns true if the first value is less than or equal to the second value. |
| `==` | `...any` | `boolean` | This is an alias for `is`. |
| `>` | `any, any` | `boolean` | Returns true if the first value is greater than the second value. |
| `>=` | `any, any` | `boolean` | Returns true if the first value is greater than or equal to the second value. |
| `\|\|` | `...any` | `boolean` | This is an alias for `or`. |
| `and` | `...any` | `boolean` | This will lazily evaluate its arguments and return false if any are not truthy or the last argument if all are truthy. |
| `array` | `...any` | `array` | Returns the given values in an array. |
| `avg` | aggregate | `number` | This will compute the average of the given application of source. |
| `block` | aggregate | `any` | This will evaluate each argument and return the value of the last. |
| `call` | `object, string, ...args` or `function, ...args` | `any` | This will call the given method or function with the remaining args returning the result. This operator should be avoided if possible becuase it is very much dependent on a JS runtime. |
| `case` | `any, ...(match: value\|boolean applicative, result: any)` | `any` | This will match the first value against the given conditional branches. If the condition of the branch is an applicative, the branch checks for a true value, otherwise it will compare the first value to the condition value for equality. Like `if`, this also lazily evaluates. It also supplies the special variable `@case` to the context of all of its branch conditions. |
| `ceil` | `number` | `number` | This will return the given number rounded up if there is a decimal. |
| `clamp` | `number, number, number` | `number` | This takes a minimum, a value, and a maximum, and returns the minimum if the value is less than the minimum, the maximum if the value is more than the maximum, or the value otherwise. |
| `coalesce` | `...any` | `any` | This will lazily return its first non-nullish argument. |
| `coalesce-truth` | `...any` | `any` | This will lazily return its first truthy argument. |
| `contains` | `array\|string, any\|array` | `boolean` | Returns true if the given `array\|string` contains the given value using `indexOf`. If the value is an array, it will check for every value in the target array, returning `true` if all are found. |
| `count` | aggregate | `number` | This will count the values in the given source. |
| `date` | `string\|date, string\|array, { rel?: boolean, parse?: boolean, shift?: boolean}` | `date` | Creates a new `Date` with the given value. If the date happens to be parseable as a raport date literal, with or without the `#`s, it will parse with the raport date literal parser. The second argument can be used to speciffy the time for the resulting date, including time zone. If given as a string, it will be parsed with the exact date parser. Named arguments `rel` or `parse`, which are aliases for each other, can be used to return a raport relative date rather than a JS Date. The `time` adjustment will also be applied the relative date if possible, and a timezone adjustment will apply to any relative date. If given a date and a timezone, the date will be shifted to the target timezone, however as JS dates have no timezone stored in them, the date will still have the local timezone attached. If you need to persist a timezone, you can turn on relative mode, specify a timezone, and enable shifting (`shift:1`), as just passing a timezone will simply set the timezone on the relative date without modifying it. |
| `does-not-contain` | `array\|string, any\|array` | `boolean` | `contains`, but negated. |
| `each` | `array\|object, application, ...(condition: boolean, result: any)` | `string` | This will iterate over its source array or object and evaluate the body application once for each iteration. The results are then concatenated. Special references provided within the iteration context are `@index`, `@last` (the index of the last iteration), `@key`, `@last-key` (the key of the last iteration). For array values, `@key` and `@last-key` are the same as `@index` and `@last`, respectively. |
| `filter` | `array, filter?, sort?, group?` | `array\|any` | Applies any supplied filter, sort, and group to the given array. This operator is an interface the function that powers report sources. |
| `find` | `array, value` | `any` | Finds the first element in the given array that matches the second argument, where the second argument is a data value e.g. an operation, reference, or literal that evaluates to true when the element matches. |
| `first` | aggregate | `any` | This will return the first application in the given source. |
| `floor` | `number` | `number` | This will return the given number rounded down if there is a decimal. |
| `fmt` | `any, string, ...any` | `string` | This is an alias for `format`. |
| `format` | `any, string, ...any` | `string` | Formats the first argument as a string using the formatter named by the second argument, passing any further arguments the formatter. |
| `get` | `any, string` | `any` | Safely retrieves the value at the path given by the `string` from the given value. |
| `group` | `array, group` | `any` | Like `filter`, but can only apply groupings. |
| `gt` | `any, any` | `boolean` | Returns true if the first value is greater than the second value. |
| `gte` | `any, any` | `boolean` | Returns true if the first value is greater than or equal to the second value. |
| `if` | `...(condition: boolean, result: any)` | `any` | This will lazily evaluate its arguments in pairs where if the first argument in the pair is truthy, the second argument in the pair will be the final value of the operation. If none of pairs has a truthy condition and there is an odd last argument, the odd last argument will be returned. This roughly mirrors `icase` functions from some languages. |
| `ilike` | `string\|array, string\|array, 'free'\|{free?:boolean}` | `boolean` | `like`, but case insensitive. |
| `in` | `any\|array, array\|string\|DateRange\|any` | `boolean` | Returns true if the given `array\|string` contains the given value using `indexOf`. If the target is a date range, it will check to see if the value as a date is in the range. If the value is an array, it will check for every value in the source in the target array, returning `true` if all are found. If the target is anything else, it will check for equality. |
| `intersect` | `array, array` | `array` | Returns an intersection of the two given arrays with no duplicates. |
| `interval` | `string` | `interval` | Returns the given string as an interval. The `#`s in the interval literal syntax can be supplied but are not required. |
| `is` | `any, any` | `boolean` | Returns true if the given values are equal (not strict). |
| `is-not` | `any, any` | `boolean` | Returns true if the given values are not equal (not strict). |
| `join` | aggregate `string` | `string` | This will join the values in the given source using the first non-local argument. |
| `keys` | `object, boolean` | `array` | This returns the keys of the given object. If the second argument is `true`, then prototype keys will also be included. |
| `last` | aggregate | This will return the last application in the given source. |
| `let` | `path, any` | `void` | This will set the given path in the context locals to the given value. |
| `like` | `string\|array, string\|array, 'free'\|{free?:boolean}` | `boolean` | Returns true if the first string matches a regex created from the second string by replacing spaces, percent signs, and asterisks with `.*`, replacing question marks with `.`, and anchoring the pattern at the beginning and end. If the first argument is an array, this will check each element and return true if any match the pattern. If the second argument is an array, each element will be used as a pattern to check the first argument. If 'free' is passed as the last argument, the regular expression will not be anchored. |
| `lower` | `string` | `string` | Lowercases the given string. |
| `lt` | `any, any` | `boolean` | Returns true if the first value is less than the second value. |
| `lte` | `any, any` | `boolean` | Returns true if the first value is less than or equal to the second value. |
| `map` | aggregate | `array` | This will map the given source into a new array composed of the application for each value. |
| `max` | aggregate | `number` | This will return the largets application in the given source. |
| `min` | aggregate | `number` | This will return the smallest application in the given source. |
| `not-ilike` | `string\|array, string\|array, 'free'\|{free?:boolean}` | `boolean` | `not-like`, but case insensitive. |
| `not-in` | `any\|array, array\|string` | `boolean` | `in`, but negated. |
| `not-like` | `string\|array, string\|array, 'free'\|{free?:boolean}` | `boolean` | `like`, but negated. |
| `nth` | aggregate | `number` | This will return the nth application in the given source, using the 1-based index specified by the parameter. |
| `object` | `...(key: string, value: any)` | `any` | Creates an object from the given values where the odd-numbered args are keys and their subsequent event-numbered args are values e.g. `(object 'foo' true 'bar' 3.14159)` is `{ foo: true, bar: 3.14159 }`. |
| `or` | `...any` | `boolean` | This will lazily evaluate its arguments and return the first truthy value or `false` if there aren't any. |
| `overlap` | `string, string, number = 0.5` | `string` | Finds the first overlapping substring within the two given strings that is at least a certain percentage of the smallest string's length long (3rd argument, defaults to 50%) using the `similar` operator. |
| `padl` | `string, number, string?` | `string` | Pads the given string to the given number of characters by adding the last argument or a space to the left side if necessary. |
| `padr` | `string, number, string?` | `string` | Pads the given string to the given number of characters by adding the last argument or a space to the right side if necessary. |
| `pow` | `...number` | `number` | This is an alias for `**`. |
| `rand` | `number?, number\|boolean?, number?` | `number` | Returns a random number. If one `number` param is passed, the result will be an integer between 1 and the given number, inclusive. If the second param is `true`, the number will be a float. If the second arg is a `number`, the result will be an integer between the first number and second number, inclusive. If two numbers and `true` are passed, the result will be a float. |
| `reduce` | aggregate, `application, any` | `any` | This is equivalent to a JS array.reduce, where the application will probably use named locals e.g. `reduce([1 2 3] [sum num]=>sum + num 0)` which results in `6`. |
| `replace-all` | `string, string, string, string?` | `string` | Calling the arguments `haystack`, `needle`, `replacement`, `flags`, this replaces all instances of `needle` in the `haystack` with `replacement`. If `flags` is provided, and it may be empty, `needle` is a regex with the given `flags`. |
| `replace` | `string, string, string, string?` | `string` | Calling the arguments `haystack`, `needle`, `replacement`, `flags`, this replaces `needle` in the `haystack` with `replacement`. If `flags` is provided, and it may be empty, `needle` is a regex with the given `flags`. |
| `reverse` | `string\|array` | `string\|array` | Reverses the given string or array. |
| `round` | `number` | `number` | This will return the given number rounded to the nearest integer. |
| `set` | `path, any` | `void` | This will set the given path in a local if one matches or in the context value otherwise. |
| `similar` | `string, string, number = 0.5, number = 2` | `[string, string, number]` | Finds the first similar substrings within the two given strings based on a threshhold (3rd argument, defaults to 50%) and fudge factor (4th argument, defaults to 2). The two similar substrings are returned in a tuple with the similarity percentage. |
| `similarity` | `string, string, number = 0.5, number = 2` | `number` | Finds the similarity percentage of the first similar substrings within the two given strings using the `similar` operator. |
| `slice` | `string\|array, number?, number?` | `string\|array` | Slices the given string or array from the first number argument index to the second number argument index. This is a proxy for the `slice` method on the first argument. |
| `sort` | `array, sort` | `array` | Like `filter`, but can only apply sorts. |
| `source` | `any` | `DataSet` | Takes the given value and turns it into a `DataSet` |
| `split` | `string, string?` | `string[]` | Takes the given string and splits it into an array of strings based on the second argument. If no second argument is provided, the resulting array will consist of each individual character of the source string. |
| `string` | `any, { json?: boolean, raport?: boolean }` | `string` | Convert any value into a string. Without any named arguments, this will convert the value to a string only if it is defined and will attempt to format it nicely. This function is used by default in template interpolators. You can force JSON output by passing a truthy `json` named argument or `raport` output using a truthy `raport` named argument. If raport-style output is used, additional arguments to `stringify` can be passed as named arguments. |
| `substr` | `string\|array, number?, number?` | `string\|array` | This is an alias for `slice`. |
| `sum` | aggregate | `number` | This will compute the sum of the given application of source. |
| `time-span` | `number` or `timespan` or `date, date` with named arguments `unit: string\|string[]`, `round: true\|'ceil'\|'floor'`, `string: boolean` | `string\|number\|number[]` | This takes a given timespan and returns it in terms of one or more units, possibly as a string. If given a number, it is assumed to be a number of milliseconds. If given to date-like things, it will create a timespan from them. If given a timespan, well it will just use the given timespan. One or more units can be specified for the returned value, with multiple units supplied as an array. Valid units are `[y]ears, [M|m]onths, [w]eeks, [d]ays, [h]ours, [m|mm]inutes, [s]econds, [ms]` where `M` will get months and `mm` or `m` not followed by an `o` will get minutes. If there's no way to get an exact measurement from the given span, estimates are made based on the average number of milliseconds in a term e.g. 365.25 days in a year and 30.45 days in a month. If passed a unit array, this will return an array of those units, unless you request it return a string. If passed a single unit as a string, it will return the single unit. By default, the final requested unit is `floor`ed, but you can request it be rounded or `ceil`inged with the `round` named argument. Rounding is done based on the next largest available unit after the smallest requiested unit e.g. hours if days are requested last or months if years are the only requested unit. Units must be specified in descending order by size. |
| `time-span-ms` | `number` or `timespan` or `date, date` with named arguments `unit: string\|string[]`, `round: true\|'ceil'\|'floor'`, `string: boolean` | `string\|number\|number[]` | This is an alias for `time-span`. |
| `trim` | `string` | `string` | Trims whitespace from both sides of the given string. |
| `triml` | `string` | `string` | Trims whitespace from the left side of the given string. |
| `trimr` | `string` | `string` | Trims whitespace from the right side of the given string. |
| `unique` | aggregate | `array` | This will create a new array from the given source ensuring that the same value does not appear more than once using `indexOf`. If an application is passed in, then the application is used to determine the uniqueness of the items. |
| `unique-map` | aggregate | `array` | This is similar to `unique` with an application, but it will return the unique applications rather than the records of the source. |
| `unless` | `...(condition: boolean, result: any)` | `any` | This will lazily evaluate its arguments in pairs where if the first argument in the pair is not truthy, the second argument in the pair will be the final value of the operation. If all of pairs have a truthy condition and there is an odd last argument, the odd last argument will be returned. This is the negated version of `if`. |
| `unparse` | `any` | `string` | This is an alias for `string` with `raport` output forced on. |
| `upper` | `string` | `string` | Uppercases the given string. |
| `values` | `object` | `array` | This will return an array of values from the given object, equivalent to `Object.values(arg)` |
| `with` | `any, application, any?` | `string` | This will set its value as the context in an extension of the current context and then return its application in that context. If the value is falsey, then the option last argument will be returned. |

#### Built-in formats

| Name | Arguments | Description |
| ---- | --------- | ----------- |
| `case` | `string` | Returns the string formatted in the given case. Support cases are `upper`, `lower`, `snake`, `kebab`, `pascal`, `camel`, and `proper` e.g. `UPPER CASE`, `lower case`, `snake_case`, `kebab-case`, `PascalCase`, `camelCase`, and `Proper Case` |
| `dollar` | | Returns the number with grouped whole number, two decimals, and a leadng dollar sign. |
| `date` | `string` | Return the date formatted using the given string. See below for the breakdown of the format string. |
| `integer` | `string? = ','` | Returns the number with grouped whole number and no decimals. The argument can specify the group string. This is also aliased as `int`. |
| `iso8601` | | Returns the given Date or relative date as a timestamp in the form `yyyy-MM-ddTHH:mm:sszzz`. |
| `number` | `number, string? = ','` | Returns the number with grouped whole number and the specified number of decimals. The second argument can specify the group string. This is also aliased as `num`. |
| `or` | `any` | Returns the given argument if the value is falsey e.g. `false#or,:N/A` results in `N/A`. |
| `ordinal` | `string? = ','` | Returns the number as an ordinal e.g. `1` becomes `1st` and `5280` becomes `5,280th`. The argument can specify the group string. |
| `padl` | `number, string` | Returns the value padded to `number` places using `string` in a prefix position e.g. `23#padl,3,:0` results in `023`. |
| `padr` | `number, string` | Returns the value padded to `number` places using `string` in a suffix position e.g. `23#padr,3,:0` results in `230`. |
| `phone` | | Returns the given number formatted as 7-, 10-, or 11-digit number e.g. `555-5555`, `(555) 555-5555`, `1-555-555-5555`. |
| `time` | | Returns the time portion of the given Date or relative date in the form `HH:mm:ss`. |
| `timestamp` | | Returns the given Date or relative date as a timestamp in the form `yyyy-MM-dd HH:mm:ss`. |
| `timestamptz` | | Returns the given Date or relative date as a timestamp in the form `yyyy-MM-dd HH:mm:sszzz`. |
| `trim` | | Returns the given value with whitespace removed from the ends e.g. `'\r\n foo\nbar '#trim` results in `'foo\nbar'`. |

##### Date format

| Char | Count | Result |
| ---- | ----- | ------ |
| `y` | 2 | 2-digit year |
| `yyyy` | 3+ | 4-digit year |
| `M` | 1 | non-padded month integer |
| `MM` | 2 | zero-padded month integer |
| `MMM` | 3 | 3-char month name |
| `MMMM` | 4+ | full month name |
| `d` | 1 | non-padded date integer |
| `dd` | 2 | zero-padded date integer |
| `ddd` | 3+ | ordinal date integer |
| `E` | 1 | day of week as ingeter |
| `EE` | 2 | 3-char day of week |
| `EEE` | 3+ | full day of week name |
| `H` | 1 | non-padded hour integer (24 hour) |
| `HH` | 2+ | zero-padded hour integer (24 hour) |
| `m` | 1 | non-padded minute integer |
| `mm` | 2+ | zero-padded minute integer |
| `s` | 1 | non-padded second integer |
| `ss` | 2+ | zero-padded second integer |
| `S` | 1 | millisecond integer |
| `SSS` | 2+ | zero-padded millisecond integer |
| `k` or `h` | 1+ | non-padded hour integer (12 hour) |
| `a` | 1+ | AM or PM |

## Templates

There is a second mode available for the raport parser that reads templates similar to mustache/handlebars templates. In this mode, interpolators are surrounded by `{{` and `}}`, and there are four special interpolators for conditionals, context, and looping. All of the special interpolators must be closed with an end tag `{{/}}`, where there may be any text between the `/` and the `}}`. Each block level has all of its contents concatenated, so this mode is effectively equivalent to bulding expression trees with concatenation operations.

| Thing | Expression? | Content |
| ----- | ----------- | ------- |
| text | no | Just plain old text. This is the stuff outside of the interpolators. |
| `{{if [expression]}}` | yes | Branches (see below, `else if` and `else`) are evaluated and the first true condition or the final default will have its body rendered. |
| `{{case [expression] when [expression]}}` | yes | Branches (see below, `when` and `else`) are evaluated and the first matching branch or the final default will have its body rendered. |
| `{{unless [expression]}}` | yes | If the value is true the body is rendered. Alternate branches are not supported. |
| `{{with [expression]}}` | yes | The `with` interpolator sets its value as the context for its body and renders the body. If the value is falsey, the body will not be rendered. |
| `{{each [expression]}}` | yes | The `each` interpolator will iterate over its value and render the body once for each iteration. This supports alternate branches if the value is not iterable (an object or array). |
| `{{[expression]}}` | yes | A plain interpolator will render its value through the `string` operator. |
| `@index` | no | A special reference provided for the current iteration index. |
| `@key` | no | A special reference provided for the current iteration key. |
| `@last` | no | A special reference provided for the index of the last iteration. |
| `@last-key` | no | A special reference provided for the key of the last iteration. |
| `{{else if [expression]}}`, `{{elseif [expression]}}`, `{{elsif [expression]}}`, `{{elif [expression]}}` | yes | An alternate branch that may appear within and `if` body or an `each` body. |
| `{{else}}` | no | A default branch that may appear within an `if`, `case`, `each`, or `with` body. |
| `{{when [expression]}}` | yes | A `case` branch that may follow the first that is required in the opening block. |

## Designer

The [raport designer](https://evs-chris.github.io/raport/) is a [Ractive.js](https://ractive.js.org) component that can be used to build report definitions and evaluate expressions. The demo version linked in the first sentence of this section has one provided source with a bunch of random people. With a non-demo implementation, you can provide any number of sources that can either contain data directly or run an async function that accepts the parameter values for the report and returns data. You can also import JSON data sources, and there are plans to add a CSV importer and a way to run a fetch to import data.

The designer is not mobile-friendly at the moment and is laid out as a side panel where widget properties are managed, a main pain where the designer, definition, and output are shown, and a hide-able bottom pane where evaluation and more complex report properties, like sources and parameters, are edited. If any particular tab is currently linked to some property, the path will appear to the right of the tab along with an `x` button to unlink the property.

In manual layout mode, widgets within a container can be dragged around with the mouse once they are selected. Selecting a label will automatically link its `text` property to the evaluation pane. Selecting an html widget will automatically like its `html` property to the evaluation pane. Hovering over a widget in the designer pane will expose action buttons for the widget on the right of the widget's placeholder. Widgets try to appear on the screen with the same dimensions that they'll have in a rendered report, but for some widgets, like repeaters and containers, there is also a title bar that exposes more control.

At the top of the left pane is the widget tree as it exists within the current report. If a widget that can have children is selected, a select with widget types and a `+` button will appear at the top. Changing the select or clicking the `+` will result in a widget being added to the selected widget. You can move children up and down within a widget, but you cannot currently move a child from one container to another. Hovering over a widget in the tree will also highlight the widget in the designer.

The triangle-y play buttons to the left of tabs will run things - the report for the main pane, and the expression for the bottom evaluation pane. If there is a problem with an expression, the bottom play button will turn red, as will the parsed tab, which will have a description of the error.

The definition tab of the main pane can be used to load and save report definitions to your local machine in a plain old JSON format.


## TODO

* [ ] Moar tests!
* [x] (slightly) Better docs
* [x] Designer and schema generator
* [ ] Some sort of simple built-in graph widget
* [x] Cleaner output styles

## Development environment

Raport is written in typescript and bundled with rollup using npm scripts.

To build raport, you'll need a posix-ish environment. There is a sort of a playground page in the `play` directory, and the script that runs in it is located at `src/play/index.ts`. It currently builds the designer and bootstraps it with a sample data source.

Running `npm run build` will compile the typescript to `build`, roll the play script and a UMD version of raport up to `build`, and finally copy the modules and UMD build to `lib` and the play script to `play`.

```sh
# clone the repo to wherever
git clone https://github.com/evs-chris/raport raport

cd raport

# install the deps
npm i

# test all the things... or at least some of the things
npm run test

# if you build it, they will come
npm run build

# you can also have a watched build
npm start

# play with the playground
firefox play/index.html

# make a production build
npm run package
```

## Designer

There is a basic report designer, which is built as a [Ractive.js](https://ractive.js.org/) component, with an environment to design reports in paged, flowed, or delimited formats. It also has a expression evaluation engine that takes into account context in most cases and can `fmt` your expressions.
