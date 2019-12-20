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

  The grouping of the data source for a repeater will determine how many nested sections show up on the report with actual rows only being rendered for the innermost (rightmost in the array) grouping. The `group` key on the repeater widget is an array that can specify a header for each grouping in the source. The `groupEnds` key on the repeater widget specifies whether footers should be rendered for each group in reverse order with an additional entry at the end for the whole repeater, meaning that the first entry is for the innermost group, proceeding outward to the extra entry for all data before groupings are applied.

**Widget Properties**

| Property | Type | Applies To | Description |
| -------- | ---- | ---------- | ----------- |
| `type` | `string` | *all* | Specifies what registered widget this should be. The built-ins are `container`, `label`, `measured`, `image`, and `repeater`. |
| `hide` | `boolean \| value` | *all* | If the property is or evaluates to `true` the widget will be skipped during render. |
| `font` | `font-object` | *all* | Specifies text properties for a widget and its children (CSS cascade). See below for supported properties. |
| `border` | `number \| number[] \| object \| value` | *all* | Specifies borders for a widget as widths in 16ths of a `rem`. If a `number`, specifies bottom border width. If an `object`, it may have `top`, `bottom`, `left`, and `right` properties with number values that correspond to those border widths. If a `number[]`, the arrity determines behavior: `1` sets all widths to the first element; `2` sets `top` and `bottom` to the first element and `left` and `right` to the second element; `3` sets `top` to the first element, `right` and `left` to the second element, and `bottom` to the third element; and `4` sets `top`, `bottom`, `left`, and `right` to the elements in that order. If a value, the evaluate can be a `number`, `number[]`, or `object` corresponding to the design-time constructs enumerated here. |
| `margin` | `number \| number[]` | *all* | Specifies the padding inside the widget in `rem`, as CSS margins don't play well with positioning inside containers. A `number` is shorthand for a `4` element array with the number as each element. The arity of the `number[]` determines which paddings get set: `2` sets the `top` and `bottom` to the first element, and `left` and `right` to the second element; and `4` sets the `top`, `right`, `bottom`, and `left` to the elements in that order. |
| `width` | `number \| object` | *all* | If a `number`, sets the width of the widget in `rem`. If an `object` with a `percent` property, sets the width of the widget in percent. If not set, the widget with fill the remaining width of the parent. |
| `layout` | `string \| {x,y}[]` | containers | If a `string`, uses the named registered layout. If an array of objects with `x` and `y` properties, child widgets are placed at the coordinates specified at the index in the `layout` array that corresponds to their index in the `widgets` array. |
| `widgets` | `object[]` | containers | Child widgets to render within this widget. |
| `height` | `'auto' \| number \| object` | *all* | If a `number`, specifies the height of the widget in `rem`. If an `object` with a `percent` property, specifies the height of the widget in percent of the available space. If `'auto'` or not set, sets the height to whatever contains its children or `1rem` if there are no children. |
| `text` | `value \| object[]` | `label` | The text content for the `label`. If this is an array of `object`s, each object may specify a `text` property and a `font` property, where the `text` will be wrapped in a `<span>` with the `font` properties applied. |
| `text` | `value` | `measured` | The text content for the `measured` label. |
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

Literal expressions can be `true`, `false`, `null`, `undefined`, numbers without scientific notation but with as many `_`s as you want for separators, and strings with any of `'`, `"`, and `` ` `` as quotes and `\` to escape quotes or other backslashes. Literals in definition form are an object with a `v` property containing the literal value, and when in this form, the value can be any valid js value. Examples in definition form: `{ v: true }`, `{ v: 'some string' }`, `{ v: ['an', 'array'] }`, `{ v: someVariable }`.

References are in dotted path notation that start at the current context and include arrays as a simple number in the path. `.`s and `\`s can be escaped with `\`. There are also a number of prefixes to aid in referencing data that exists in the context but not specifically part of the piece of data at the core of the current context. Things like report parameters, access to the parent context, special data like the current iteration index, and report data sources are accessible using reference prefixes.

* `#`: Starts the reference from the root context rather than the current context.
* `!`: Refers to the report parameters.
* `+`: Refers to the report sources.
* `@`: Refers to the nearest context with special references. These are managed by the report widgets that build context e.g. a repeater or container.
* `^`: Starts the reference from the current context's parent. These can be stacked e.g. `^^` refers to the grandparent context.

In defintion form, references are an object with the path as a string at an `r` key. Examples in definition form: `{ r: 'name.length' }`, `{ r: '#info.address.line1' }`, `{ r: '@index' }`.

Operations in expression form can be one of two types: a function call or an aggregate. There are other types of operator, but they share the form of a function call syntactically. Any operation consists of an operator and optional arguments. An aggregate operator can also optionally specify a source, an application, and local arguments. In expression form, an operator is wrapped with `()` with the name first, followed by source, application, local arguments, and finally regular arguments `(op-name [+source] [=>application] [&(...local args)] [...args])`. Commas are optional between arguments, and any arguments are evaluated in the current context before being passed to the operator.

Aggregate operators evaluate their regular arguments in the context of the call and their local arguments within the context of each iteration. Local arguments are not particularly common. The source will default to the nearest `@source` special reference within the context stack or an empty array if none is found. The application is applied to each iteration of the aggregate before the iteration is passed to the operator, so for something like a `map` operator, `(map =>(upper name))` will result in an array of strings that are the uppercased name property of each element in the local source. In that example, `upper` is also an operator that simply uppercases its first argument.

### Filtering, sorting, and grouping

Filters are simply expressions that are applied to each value in a dataset, where values that evaluate to a truthy value are included in the filtered set. Similarly, sorts are expressions that are applied to each value in the dataset and they used to sort the dataset (currently using `array.sort()`). Groupings are also expressions that are applied to each value in the dataset, and the result from the evaluation is used to group the values into a map of results with the group evaluations as keys.

All of these operations are supported on any dataset in a report, and some widgets have their own data sources that can extend the report data sources.

### Source definitions

Report sources define the way a data set should be mapped into a report. A report source must have at least a name and a source, which should be provided as a data set in the source map when the report is run. Report sources may also specify a `base`, which is a value that will be evaluated against the value of the dataset before filtering, sorting, and grouping is applied. This is useful for data sets that contain more than one addressable piece of data. Report sources may also specify a `filter`, `sort`, and `group`. Any of theses properties, including the `base`, have access to any of the data that exists in the context at the point that sources are being initialized, which includes report-defined context and any parameters that are set on the report run. This makes things like parameteried grouping much easier to accomplish.

### Built-in operations

There are a few operations built-in to the library to handle common expressions:

| Operator | Arguments | Result | Description |
| -------- | --------- | ------ | ----------- |
| `is` | `any, any` | `boolean` | Returns true if the given values are equal (not strict). |
| `is-not` | `any, any` | `boolean` | Returns true if the given values are not equal (not strict). |
| `<` | `any, any` | `boolean` | Returns true if the first value is less than the second value. |
| `<=` | `any, any` | `boolean` | Returns true if the first value is less than or equal to the second value. |
| `>` | `any, any` | `boolean` | Returns true if the first value is greater than the second value. |
| `>=` | `any, any` | `boolean` | Returns true if the first value is greater than or equal to the second value. |
| `like` | `string, string` | `boolean` | Returns true if the first string matches a regex created from the second string by replacing spaces, percent signs, and asterisks with `.*`, replacing question marks with `.`, and anchoring the pattern at the beginning and end. |
| `ilike` | `string, string` | `boolean` | `like`, but case insensitive. |
| `not-like` | `string, string` | `boolean` | `like`, but negated. |
| `not-ilike` | `string, string` | `boolean` | `not-like`, but case insensitive. |
| `in` | `any, array\|string` | `boolean` | Returns true if the given `array\|string` contains the given value using `indexOf` |
| `not-in` | `any, array\|string` | `boolean` | `in`, but negated. |
| `contains` | `array\|string, any` | `boolean` | Returns true if the given `array\|string` contains the given value using `indexOf` |
| `does-not-contain` | `array\|string, any` | `boolean` | `contains`, but negated. |
| `get` | `any, string` | `any` | Safely retrieves the value at the path given by the `string` from the given value. |
| `array` | `...any` | `array` | Returns the given values in an array. |
| `object` | `...(key: string, value: any)` | `any` | Creates an object from the given values where the odd-numbered args are keys and their subsequent event-numbered args are values e.g. `(object 'foo' true 'bar' 3.14159)` is `{ foo: true, bar: 3.14159 }`. |
| `filter` | `array, filter?, sort?, group?` | `array\|any` | Applies any supplied filter, sort, and group to the given array. This operator is an interface the function that powers report sources. |
| `find` | `array, value` | `any` | Finds the first element in the given array that matches the second argument, where the second argument is a data value e.g. an operation, reference, or literal that evaluates to true when the element matches. |
| `source` | `any` | `DataSet` | Takes the given value and turns it into a `DataSet` |
| `group` | `array, group` | `any` | Like `filter`, but can only apply groupings. |
| `sort` | `array, sort` | `array` | Like `filter`, but can only apply sorts. |
| `+` | `...any` | `string\|number` | Adds the given values if they all pass `isNaN` or concatenates them as a string otherwise. |
| `-` | `...any` | `number` | Subtracts the given values starting with the first. |
| `*` | `...any` | `number` | Multiplies the given values starting with the first. |
| `/` | `...any` | `number` | Divides the given values starting with the first. |
| `%` | `...any` | `number` | Returns the modulus of the given values starting with the first. |
| `padl` | `string, number, string?` | `string` | Pads the given string to the given number of characters by adding the last argument or a space to the left side if necessary. |
| `padr` | `string, number, string?` | `string` | Pads the given string to the given number of characters by adding the last argument or a space to the right side if necessary. |
| `triml` | `string` | `string` | Trims whitespace from the left side of the given string. |
| `trimr` | `string` | `string` | Trims whitespace from the right side of the given string. |
| `trim` | `string` | `string` | Trims whitespace from both sides of the given string. |
| `slice` | `string\|array, number?, number?` | `string\|array` | Slices the given string or array from the first number argument index to the second number argument index. This is a proxy for the `slice` method on the first argument. |
| `substr` | `string\|array, number?, number?` | `string\|array` | This is an alias for `slice`. |
| `replace` | `string, string, string, string?` | `string` | Calling the arguments `haystack`, `needle`, `replacement`, `flags`, this replaces `needle` in the `haystack` with `replacement`. If `flags` is provided, and it may be empty, `needle` is a regex with the given `flags`. |
| `replace-all` | `string, string, string, string?` | `string` | Calling the arguments `haystack`, `needle`, `replacement`, `flags`, this replaces all instances of `needle` in the `haystack` with `replacement`. If `flags` is provided, and it may be empty, `needle` is a regex with the given `flags`. |
| `reverse` | `string\|array` | `string\|array` | Reverses the given string or array. |
| `date` | `string` | `date` | Creates a new `Date` with the given value. |
| `upper` | `string` | `string` | Uppercases the given string. |
| `lower` | `string` | `string` | Lowercases the given string. |
| `format` | `any, string, ...any` | `string` | Formats the first argument as a string using the formatter named by the second argument, passing any further arguments the formatter. |
| `fmt` | `any, string, ...any` | `string` | This is an alias for `format`. |
| `and` | `...any` | `boolean` | This will lazily evaluate its arguments and return false if any are not truthy. |
| `or` | `...any` | `boolean` | This will lazily evaluate its arguments and return true if any are truthy. |
| `if` | `...(condition: boolean, result: any)` | `any` | This will lazily evaluate its arguments in pairs where if the first argument in the pair is truthy, the second argument in the pair will be the final value of the operation. If none of pairs has a truthy condition and there is an odd last argument, the odd last argument will be returned. This roughly mirrors `icase` functions from some languages. |
| `unless` | `...(condition: boolean, result: any)` | `any` | This will lazily evaluate its arguments in pairs where if the first argument in the pair is not truthy, the second argument in the pair will be the final value of the operation. If all of pairs have a truthy condition and there is an odd last argument, the odd last argument will be returned. This is the negated version of `if`. |
| `coalesce` | `...any` | `any` | This will lazily return its first non-nullish argument. |
| `coalesce-truth` | `...any` | `any` | This will lazily return its first truthy argument. |
| `avg` | aggregate | `number` | This will compute the average of the given application of source. |
| `sum` | aggregate | `number` | This will compute the sum of the given application of source. |
| `count` | aggregate | `number` | This will count the values in the given source. |
| `map` | aggregate | `array` | This will map the given source into a new array composed of the application for each value. |
| `unique` | aggregate | `array` | This will create a new array from the given source ensuring that the same value does not appear more than once using `indexOf` |
| `join` | aggregate `string` | `string` | This will join the values in the given source using the first non-local argument. |

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


## TODO

* [ ] Tests!
* [x] (slightly) Better docs
* [ ] Designer and schema generator
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

# if you build it, they will come
npm run build

# play with the playground
firefox play/index.html
```

Note that the print function in the playground only seems to reliably work with Chrome.
