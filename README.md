# Raport: Simple reports. No Ragrets.

Raport is a text/html reporting tool that takes one or more json data sources and uses a template to generate delimited text (csv, tsv, etc) or html that can be paginated for printing. When printing paged reports from chromium-based browsers, turn off the margins, as they're built into the report, and be sure to match the paper size and orientation.

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

In addition to containers, the basic widgets supplied in this library are the `Container`, `Label`, `Repeater`, and `Image`.

* `Container`: This is simply a widget that holds other widgets and acts as a local reference for coordinates. Containers have pluggable layouts that default to something like a flex row. The other built-in option is a static list of `x, y` coordinates that are applied to the child widgets in the same order that they are specified.
* `Label`: This is pretty much what you'd expect. It renders a piece of text that can be composed of multiple parts. The parts may be literal values, references, operators, or spans, which are sort of a sub-label that is composed of a part and optional styling.
* `Image`: This is also what you'd expect. You can supply a `url` as a literal, reference, or operator that is used to render the image into the output HTML.
* `Repeater`: This is the most useful widget for reporting purposes. It is composed of an optional header, and optional footer, optional group headers, and rows. The row source must be wither an array or a grouping that eventually results in an array. A repeater will render each of its pieces in a page-aware way, so if there's not room left in the report for a header, footer, or row, it will suspend rendering and resume at the appropriate place when called again. Repeaters automatically handle grouped datasources and support footers for each nested group automatically if required. Footers get access to a special `@source` reference that allows aggregate operators to automatically apply to all of the rows in the repeater. 

#### Flowed

A flowed report may optionally have a width, but it never has a height. As such, a flowed report will continue on without interruption until all of its content is rendered.

#### Paged

A paged report requires a page size in order to render, and an orientation can optionally be supplied to, where the runner will handle flipping the dimensions and margins around to handle the orientation.

Since a paged report has height constraints on any given piece of the report, rendering of widgets can be optionally interrupted and resumed on a new page. Whether or not a widget supports interruption is up to the individual widget, but by default most containers require that there entire content fit in the available space in order to render.

Paged reports can optionally include page headers and footers that are rendered at the top and bottom of each page if supplied. The context for headers and footers contain additional special variables `@page` and `@pages` the contain the current page number and total number of pages, respectively.

## Data

Most data is in a tree or graph format encapsulated in a datasource. Without a datasource, a report isn't going to do much good. Datasources are handled by the root context, which is simply a wrapper around an object that contains a `value`, a few special storage points, a reference to itself as root, and no parent reference. Further contexts can be extended from the root context that encapsulate a different value, but they will have pointers to the root context and the context from which they were extended, which may also be the root context.

Contexts are used to give a report access to data in a particular widget. The report base context is the root context, and widgets have the opportunity to modify their context or add additional contexts as they are rendered. They can also evaluate values from their context to retrieve data or manipulate data.

### Values

Values are one of a reference, a literal, or an operation, which are composed of operators, references, and literals. There is a built-in expression syntax that simplifies building operations a bit using strings. The direct definition form uses a tree of nested objects and arrays.

Literal expressions can be `true`, `false`, `null`, `undefined`, numbers without scientific notation but with as many `_` as you want for separators, and strings with any of `'`, `"`, and `` as quotes and `\` to escape quotes or other backslashes. Literals in definition form are an object with a `v` property containing the literal value, and when in this form, the value can be any valid js value.

References are in dotted path notation that start at the current context and include arrays as a simple number in the path. `.`s and `\` can be escaped with `\`. There are also a number of prefixes to aid in referencing data that exists in the context but not specifically part of the piece of data at the core of the current context. Things like report parameters, access to the parent context, special data like the current iteration index, and report data sources are accessible using reference prefixes.

* `#`: Starts the reference from the root context rather than the current context.
* `!`: Refers to the report parameters.
* `+`: Refers to the report sources.
* `@`: Refers to the nearest context with special references. These are managed by the report widgets that build context e.g. a repeater or container.
* `^`: Starts the reference from the current context's parent. These can be stacked e.g. `^^` refers to the grandparent context.

In defintion form, references are an object with the path as a string at an `r` key.

Operations in expression form can be one of two types: a function call or an aggregate. There are other types of operator, but they share the form of a function call syntactically. Any operation consists of an operator and optional arguments. An aggregate operator can also optionally specify a source, an application, and local arguments. In expression form, an operator is wrapped with `()` with the name first, followed by source, application, local arguments, and finally regular arguments `(op-name [+source] [=>application] [&(...local args)] [...args])`. Commas are optional between arguments, and any arguments are evaluated in the current context before being passed to the operator.

Aggregate operators evaluate their regular arguments in the context of the call and their local arguments within the context of each iteration. Local arguments are not particularly common. The source will default to the nearest `@source` special reference within the context stack or an empty array if none is found. The application is applied to each iteration of the aggregate before the iteration is passed to the operator, so for something like a `map` operator, `(map =>(upper name))` will result in an array of strings that are the uppercased name property of each element in the local source. In that example, `upper` is also an operator that simply uppercases its first argument.

### Filtering, sorting, and grouping

Filters are simply expressions that are applied to each value in a dataset, where values that evaluate to a truthy value are included in the filtered set. Similarly, sorts are expressions that are applied to each value in the dataset and they used to sort the dataset (currently using `array.sort()`). Groupings are also expressions that are applied to each value in the dataset, and the result from the evaluation is used to group the values into a map of results with the group evaluations as keys.

All of these operations are supported on any dataset in a report, and some widgets have their own data sources that can extend the report data sources.

## TODO

* Tests!
* Better docs
* Designer and schema generator
* Some sort of simple built-in graph widget
* Cleaner output styles

## Development environment

Raport is writting in typescript and bundled with rollup using npm scripts.

To build raport, you'll need a posix-ish environment. There is a sort of a playground page in the `play` directory, and the script that runs in it is located at `src/play/index.ts`.

Running `npm run build` will compile the typescript to `build`, roll the play script and a UMD version of raport up to `build`, and finally copy the modules and UMD build to `lib` and the play script to `play`.

```sh
# clone the repo to wherever
git clone https://github.com/evs-chris/raport raport

# install the deps
npm i

# if you build it, they will come
npm run build

# play with the playground
firefox play/index.html
```
