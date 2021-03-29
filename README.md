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

In addition to containers, the basic widgets supplied in this library are the `Label`, `Repeater`, `Image`, and `Measured`.

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
| `width` | `number \| object` | *all* | If a `number`, sets the width of the widget in `rem`. If an `object` with a `percent` property, sets the width of the widget in percent. If not set, the widget with fill the remaining width of the parent. |
| `layout` | `string \| {x,y}[]` | containers | If a `string`, uses the named registered layout. If an array of objects with `x` and `y` properties, child widgets are placed at the coordinates specified at the index in the `layout` array that corresponds to their index in the `widgets` array. |
| `widgets` | `object[]` | containers | Child widgets to render within this widget. |
| `height` | `'auto' \| number \| object` | *all* | If a `number`, specifies the height of the widget in `rem`. If an `object` with a `percent` property, specifies the height of the widget in percent of the available space. If `'auto'` or not set, sets the height to whatever contains its children or `1rem` if there are no children. |
| `format` | `value` | `label` | The format to apply to the value produced by the label. This can be paired with a label `id` to allow aggregates to be applied to fields in a repeater without recomputing. |
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
| `weight` | `number \| string` | Sets the CSS `font-weight`. |
| `pre` | `boolean` | If `true`, sets CSS `white-space` to `pre-wrap`. |
| `clamp` | `boolean` | If `true`, set CSS `white-space` to `nowrap` and `overflow` to `hidden`. |
| `right` | `number` | If not `margin` is set on the widget, this will set a right margin in `rem`. This is useful for right-aligned text next to left-aligned text to keep them from running together. |


#### Flowed

A flowed report may optionally have a width, but it never has a height. As such, a flowed report will continue on without interruption until all of its content is rendered.

#### Paged

A paged report requires a page size in order to render, and an orientation can optionally be supplied too, where the runner will handle flipping the dimensions and margins around to handle the orientation.

Since a paged report has height constraints on any given piece of the report, rendering of widgets can be optionally interrupted and resumed on a new page. Whether or not a widget supports interruption is up to the individual widget, but by default most containers require that their entire content fit in the available space in order to render.

Paged reports can optionally include page headers and footers that are rendered at the top and bottom of each page if supplied. The context for headers and footers contain additional special variables `@page` and `@pages` the contain the current page number and total number of pages, respectively. Page headers and footers are always expected to be the same size.

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
| interpolated string | `string` | `'an ${interpolated} string'` | Interpolated strings are actually syntax sugar for a `+` operation in most cases. They are like regular quoted strings, except any `${ ... }` sequences are evaluated and injected into the string. These support everything a quoted string does, except being quoted with double quotes. |
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
| `@index` | repeater | The index of the nearest repeater iteration. |
| `@group` | repeater | The nearest group by value, if any. |
| `@level` | repeater | The nearest group level, if any. |
| `@source` | repeater | The nearest repeater source, if any. |
| `@values` | repeater | An object with keys pointing to an array of values collected from labels in the repeater ids mapping to keys. |

#### Operations

Raport has a universal call syntax based on s-expressions in addition to some sugar to make it a bit more comfortable to those who don't often frequent the lispy bushes on the fringes of programming languages. Anything that executes is called an operation, and there are three different types of operators that share the same syntax: simple, checked, and aggregate. All three accept arguments, and aggregates may accept an implicit source argument. The expression form looks like `(op-name arg1 arg2)` and the definition form looks like `{ op: 'op-name', args: ['arg1', 'arg2'] }`. Any of the arguments may be another expression, including another operation. Using that simple form, you can compose just about anything you could want to. Arguments may be separated by space and/or commas.

Arguments may also be specified in a named form, which will result in them being collected into an object expression and moved to the end of the argument list. Named arguments have an identifier followed immediately be a `:`, any amount of whitespace, including none, and then an expression. For instance `time-span(#now# - #2012# unit::y)` is equivalent to `(time-span (- #now# #2012#) { unit: 'y' })` and will result in the number of whole years between now and the first millisecond of 2012. Built-in operators that support named arguments will list them individually.

##### Syntax sugar

| Name | Example | Notes |
| ---- | ------- | ----- |
| unary operator | `not true` | Supported unary operators are `not` and `+`. |
| binary operator | `2 + 5`, `7 * 4 ** 2 + 1`, `person.birthdate in #today#` | Supported binary operators in order of precedence are exponentiation (`**`), mutiplication/division (`*`, `/`, `%`), addition/subtraction (`+`, `-`), comparison (`>=`, `>`, `<=`, `<`, `in`, `like`, `not-like`, `not-in`, `contains`, `does-not-contain`), equality (`is`, `is-not`, `==`, `!=`), boolean and (`and`, `&&`), and boolean or (`or`, `||`). At least one space is required on either side of a binary operator. |
| call | `op-name(arg1 arg2)` | Call syntax is supported as convenience over s-expressions because it tends to be more familiar. It supports fewer operator names than the s-expression syntax, and the unavailable operators tend to be binary or unary. The example converts to `{ op: 'op-name', args: [{ r: { k: ['arg1'] } }, { r: { k: ['arg2'] } }] }` |
| array | `[1, 2, 3]`, `[first middle last]` | Array expressions are surrounded by square brackets and contain any number of space and/or comma separated expressions. If all of the expressions are literals, the result will be a literal. If not, the result will be an array operation e.g. `{ op: 'array', args: [{ r: 'first' }, { r: 'middle' }, { r: 'last' }] }`. |
| object | `{ "foo": 2, "bar": "baz" }`, `{ foo:2 bar:[1 2 3] }` | Object expressions are surrounded by curly braces and contain any number of key-value pairs. The keys are optionally quoted strings, followed by a `:`. The values are any expression, and pairs are separated by space and/or commas. Like array expressions, objects containing only literals evaluate to a literal, and are otherwise an `object` operation. |
| application | `=>_ like :%a%` | Application expressions evaluate to their expression's definition form. This is used in many operations, and just about all aggregate operations, to apply an expression to an internal context e.g. `find(*people =>name is :Susan)`, where the find operator iterates over its source, in this case the data source named `people`, and evaluates its second argument, an application, with the current iteration as the context. |
| postfix reference | `op-name(arg1).path[ref]` | Postfix references allow an operation's result to be further paired down using a `get` operation. The example is equivalent to `(get (op-name arg1) =>path[ref])`. |
| postfix format | `person.birthdate#date`, `(amount * rate)#number,4` | Postfix format expressions apply a format operation to their expression. The name of the formatter follows the `#`, and it can be passed any number or optional arguments by following the name with a comma with no extra space. Further arguments are also separated by commas with no extra space. The second example is equivalent to `(format (* amount rate) :number 4)`. |
| if | `if foo then bar else baz`, `if not true then 42`, `if birthdate in #this week# then 0.10 else if lower(name[0]) == :a then 0.2 else 0` | If expressions allow you to set up one or more conditional branches, where the first starts with `if`, followed by a condition expression, followed by `then`, followed by the result expression that is returned if the condition expression is truthy, followed by 0 or more conditional branches, followed by an optional final case with no condition. The conditional branches start with `else if`, `elseif`, `elsif`, or `elif`; followed by the condition expression, followed by `then`, followed by the result expression that is returne if the conditional expression is truthy. The final case with no condition starts with `else` followed by the result expression. These convert to an `if` operation in the form of `(if cond1 res1 cond2 res2 alt)` |

### Filtering, sorting, and grouping

Filters are simply expressions that are applied to each value in a dataset, where values that evaluate to a truthy value are included in the filtered set. Similarly, sorts are expressions that are applied to each value in the dataset and they used to sort the dataset (currently using `array.sort()`). Groupings are also expressions that are applied to each value in the dataset, and the result from the evaluation is used to group the values into a map of results with the group evaluations as keys.

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
| `*` | `...any` | `number` | Multiplies the given values starting with the first. |
| `**` |  `...number` | `number` | Applies exponentiation to the given arguments with right associativity e.g. `(** 1 2 3)` is `1^(2^3)`. |
| `+` | `...any` | `string\|number` | Adds the given values if they all pass `isNaN` or concatenates them as a string otherwise. |
| `-` | `...any` | `number` | Subtracts the given values starting with the first. |
| `/` | `...any` | `number` | Divides the given values starting with the first. |
| `/%` | `...any` | `number` | Divides the given values starting with the first using integer division. |
| `<` | `any, any` | `boolean` | Returns true if the first value is less than the second value. |
| `<=` | `any, any` | `boolean` | Returns true if the first value is less than or equal to the second value. |
| `==` | `...any` | `boolean` | This is an alias for `is`. |
| `>` | `any, any` | `boolean` | Returns true if the first value is greater than the second value. |
| `>=` | `any, any` | `boolean` | Returns true if the first value is greater than or equal to the second value. |
| `||` | `...any` | `boolean` | This is an alias for `or`. |
| `and` | `...any` | `boolean` | This will lazily evaluate its arguments and return false if any are not truthy or the last argument if all are truthy. |
| `array` | `...any` | `array` | Returns the given values in an array. |
| `avg` | aggregate | `number` | This will compute the average of the given application of source. |
| `call` | `object, string, ...args` or `function, ...args` | `any` | This will call the given method or function with the remaining args returning the result. This operator should be avoided if possible becuase it is very much dependent on a JS runtime. |
| `ceil` | `number` | `number` | This will return the given number rounded up if there is a decimal. |
| `clamp` | `number, number, number` | `number` | This takes a minimum, a value, and a maximum, and returns the minimum if the value is less than the minimum, the maximum if the value is more than the maximum, or the value otherwise. |
| `coalesce` | `...any` | `any` | This will lazily return its first non-nullish argument. |
| `coalesce-truth` | `...any` | `any` | This will lazily return its first truthy argument. |
| `contains` | `array\|string, any\|array` | `boolean` | Returns true if the given `array\|string` contains the given value using `indexOf`. If the value is an array, it will check for every value in the target array, returning `true` if all are found. |
| `count` | aggregate | `number` | This will count the values in the given source. |
| `date` | `string` | `date` | Creates a new `Date` with the given value. |
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
| `if` | `...(condition: boolean, result: any)` | `any` | This will lazily evaluate its arguments in pairs where if the first argument in the pair is truthy, the second argument in the pair will be the final value of the operation. If none of pairs has a truthy condition and there is an odd last argument, the odd last argument will be returned. This roughly mirrors `icase` functions from some languages. |
| `ilike` | `string\|array, string\|array, 'free'\|{free?:boolean}` | `boolean` | `like`, but case insensitive. |
| `in` | `any\|array, array\|string\|DateRange\|any` | `boolean` | Returns true if the given `array\|string` contains the given value using `indexOf`. If the target is a date range, it will check to see if the value as a date is in the range. If the value is an array, it will check for every value in the source in the target array, returning `true` if all are found. If the target is anything else, it will check for equality. |
| `intersect` | `array, array` | `array` | Returns an intersection of the two given arrays with no duplicates. |
| `is` | `any, any` | `boolean` | Returns true if the given values are equal (not strict). |
| `is-not` | `any, any` | `boolean` | Returns true if the given values are not equal (not strict). |
| `join` | aggregate `string` | `string` | This will join the values in the given source using the first non-local argument. |
| `keys` | `object, boolean` | `array` | This returns the keys of the given object. If the second argument is `true`, then prototype keys will also be included. |
| `last` | aggregate | This will return the last application in the given source. |
| `like` | `string\|array, string\|array, 'free'\|{free?:boolean}` | `boolean` | Returns true if the first string matches a regex created from the second string by replacing spaces, percent signs, and asterisks with `.*`, replacing question marks with `.`, and anchoring the pattern at the beginning and end. If the first argument is an array, this will check each element and return true if any match the pattern. If the second argument is an array, each element will be used as a pattern to check the first argument. If 'free' is passed as the last argument, the regular expression will not be anchored. |
| `lower` | `string` | `string` | Lowercases the given string. |
| `map` | aggregate | `array` | This will map the given source into a new array composed of the application for each value. |
| `max` | aggregate | `number` | This will return the largets application in the given source. |
| `min` | aggregate | `number` | This will return the smallest application in the given source. |
| `not-ilike` | `string\|array, string\|array, 'free'\|{free?:boolean}` | `boolean` | `not-like`, but case insensitive. |
| `not-in` | `any\|array, array\|string` | `boolean` | `in`, but negated. |
| `not-like` | `string\|array, string\|array, 'free'\|{free?:boolean}` | `boolean` | `like`, but negated. |
| `nth` | aggregate `number` | This will return the nth application in the given source, using the 1-based index specified by the parameter. |
| `object` | `...(key: string, value: any)` | `any` | Creates an object from the given values where the odd-numbered args are keys and their subsequent event-numbered args are values e.g. `(object 'foo' true 'bar' 3.14159)` is `{ foo: true, bar: 3.14159 }`. |
| `or` | `...any` | `boolean` | This will lazily evaluate its arguments and return the first truthy value or `false` if there aren't any. |
| `padl` | `string, number, string?` | `string` | Pads the given string to the given number of characters by adding the last argument or a space to the left side if necessary. |
| `padr` | `string, number, string?` | `string` | Pads the given string to the given number of characters by adding the last argument or a space to the right side if necessary. |
| `pow` | `...number` | `number` | This is an alias for `**`. |
| `rand` | `number?, number\|boolean?, number?` | `number` | Returns a random number. If one `number` param is passed, the result will be an integer between 1 and the given number, inclusive. If the second param is `true`, the number will be a float. If the second arg is a `number`, the result will be an integer between the first number and second number, inclusive. If two numbers and `true` are passed, the result will be a float. |
| `replace-all` | `string, string, string, string?` | `string` | Calling the arguments `haystack`, `needle`, `replacement`, `flags`, this replaces all instances of `needle` in the `haystack` with `replacement`. If `flags` is provided, and it may be empty, `needle` is a regex with the given `flags`. |
| `replace` | `string, string, string, string?` | `string` | Calling the arguments `haystack`, `needle`, `replacement`, `flags`, this replaces `needle` in the `haystack` with `replacement`. If `flags` is provided, and it may be empty, `needle` is a regex with the given `flags`. |
| `reverse` | `string\|array` | `string\|array` | Reverses the given string or array. |
| `round` | `number` | `number` | This will return the given number rounded to the nearest integer. |
| `slice` | `string\|array, number?, number?` | `string\|array` | Slices the given string or array from the first number argument index to the second number argument index. This is a proxy for the `slice` method on the first argument. |
| `sort` | `array, sort` | `array` | Like `filter`, but can only apply sorts. |
| `source` | `any` | `DataSet` | Takes the given value and turns it into a `DataSet` |
| `split` | `string, string?` | `string[]` | Takes the given string and splits it into an array of strings based on the second argument. If no second argument is provided, the resulting array will consist of each individual character of the source string. |
| `substr` | `string\|array, number?, number?` | `string\|array` | This is an alias for `slice`. |
| `sum` | aggregate | `number` | This will compute the sum of the given application of source. |
| `time-span` | `number, number = 1` or `number, number = 0, unit: string` | `string` | This takes the given number of milliseconds and produces a time span from the largest whole unit down to the number of units specified by the second number parameter, which defaults to 1. The largest possible unit is weeks, since without a reference point, months and years can't be determined with any accuracy. If the `unit` named argument is supplied, the precision defaults to `0` and only the number of the specified unit is returned. In that case, precision is the number of decimal places to include in the result. If months or years are specified as the return unit, they will be estimated as a year is 365.25 days and a month is 30.45 days. |
| `time-span-ms` | `number, number = 1` | `string` | This is an alias for `time-span`. |
| `trim` | `string` | `string` | Trims whitespace from both sides of the given string. |
| `triml` | `string` | `string` | Trims whitespace from the left side of the given string. |
| `trimr` | `string` | `string` | Trims whitespace from the right side of the given string. |
| `unique` | aggregate | `array` | This will create a new array from the given source ensuring that the same value does not appear more than once using `indexOf`. If an application is passed in, then the application is used to determine the uniqueness of the items. |
| `unique-map` | aggregate | `array` | This is similar to `unique` with an application, but it will return the unique applications rather than the records of the source. |
| `unless` | `...(condition: boolean, result: any)` | `any` | This will lazily evaluate its arguments in pairs where if the first argument in the pair is not truthy, the second argument in the pair will be the final value of the operation. If all of pairs have a truthy condition and there is an odd last argument, the odd last argument will be returned. This is the negated version of `if`. |
| `upper` | `string` | `string` | Uppercases the given string. |
| `values` | `object` | `array` | This will return an array of values from the given object, equivalent to `Object.values(arg)` |
| `with` | `any, application, any?` | `string` | This will set its value as the context in an extension of the current context and then return its application in that context. If the value is falsey, then the option last argument will be returned. |

#### Built-in formats

| Name | Arguments | Description |
| ---- | --------- | ----------- |
| `dollar` | | Returns the number with grouped whole number, two decimals, and a leadng dollar sign. |
| `date` | `string` | Return the date formatted using the given string. See below for the breakdown of the format string. |
| `integer` | | Returns the number with grouped whole number and no decimals. |
| `number` | `number` | Returns the number with grouped whole number and the specified number of decimals. |
| `phone` | | Returns the given number formatted as 7-, 10-, or 11-digit number e.g. `555-5555`, `(555) 555-5555`, `1-555-555-5555`. |

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
| `dd` | 2+ | zero-padded date integer |
| `E` | 1 | day of week as ingeter |
| `EE` | 2 | 3-char day of week |
| `EEE` | 3+ | full day of week name |
| `H` | 1 | non-padded hour integer (24 hour) |
| `HH` | 2+ | zero-padded hour integer (24 hour) |
| `m` | 1 | non-padded minute integer |
| `mm` | 2+ | zero-padded minute integer |
| `s` | 1 | non-padded second integer |
| `ss` | 2+ | zero-padded second integer |
| `k` or `h` | 1+ | non-padded hour integer (12 hour) |
| `a` | 1+ | AM or PM |

## Templates

There is a second mode available for the raport parser that reads templates similar to mustache/handlebars templates. In this mode, interpolators are surrounded by `{{` and `}}`, and there are four special interpolators for conditionals, context, and looping. All of the special interpolators must be closed with an end tag `{{/}}`, where there may be any text between the `/` and the `}}`. Each block level has all of its contents concatenated, so this mode is effectively equivalent to bulding expression trees with concatenation operations.

| Thing | Expression? | Content |
| ----- | ----------- | ------- |
| text | no | Just plain old text. This is the stuff outside of the interpolators. |
| `{{if [expression]}}` | yes | Branches (see below) are evaluated and the first true condition or the final default will have its body rendered. |
| `{{unless [expression]}}` | yes | If the value is true the body is rendered. Alternate branches are not supported. |
| `{{with [expression]}}` | yes | The `with` interpolator sets its value as the context for its body and renders the body. If the value is falsey, the body will not be rendered. |
| `{{each [expression]}}` | yes | The `each` interpolator will iterate over its value and render the body once for each iteration. This supports alternate branches if the value is not iterable (an object or array). |
| `{{[expression]}}` | yes | A plain interpolator will render its value through the `string` operator. |
| `@index` | no | A special reference provided for the current iteration index. |
| `@key` | no | A special reference provided for the current iteration key. |
| `@last` | no | A special reference provided for the index of the last iteration. |
| `@last-key` | no | A special reference provided for the key of the last iteration. |
| `{{else if [expression]}}`, `{{elseif [expression]}}`, `{{elsif [expression]}}`, `{{elif [expression]}}` | yes | An alternate branch that may appear within and `if` body or an `each` body. |
| `{{else}}` | no | A default branch that may appear within an `if`, `each`, or `with` body. |

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

To build raport, you'll need a posix-ish environment. There is a sort of a playground page in the `play` directory, and the script that runs in it is located at `src/play/index.ts`.

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

There is a basic report designer, which is built as a [Ractive.js](https://ractive.js.org/) component, with an environment to design reports in paged, flowed, or delimited formats. It also has a expression evaluation engine that takes into account context in most cases.

## Notes

Note that the print function in the playground only seems to reliably work with Chrome, as Firefox has issues from the second page on for... uh... reasons?
