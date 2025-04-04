## 0.28.0

2025-03-29

### Parser

* __BUG:__ The parser will no longer infinitely recurse with some array schemas.
* __BREAKING:__ Applications with a block operator now share lexical scope/context with the block. This is *technically* a breaking change, but it generally has the effect of making accessing ancestor contexts much more intuitive.
* The delimited parser now allows blank lines before and after the data.
* The delimited parser can now accept a list of headers, allowing replacement of embedded headers or providing headers for data that has none.
* The delimited parser can now accept a header map application that can be used to change headers embedded in the data.

### Render

* Render delimited report to HTML will now use more semantic tables.
* Array of array data soures can now be run as delimited reports with automatically generated fields.

### Designer

* The expression editor will no longer populate with undefined for unset expressions.

### Data

* Accessing an object with an a array key will now return a new object containing only the keys that are in the array and the source object.
* The `count` operator can now be used for more complex cases using additional named arguments. `partition` allows returning a key for each value in the counted array. `sub` allows returning one or more keys and multiple applications for each value in the counted array. The result of either of the new modes is an object with the resulting keys and counts for each key.


## 0.27.0

2025-03-19

### Parser

* __BREAKING:__ Bracketed paths now support indicating that an index should be applied from the end rather than the start by ducking the index (following it with a <). This removes support for accessing array indexs from the right by passing a negative number, which was undocumented but still makes this a breaking change.
* Bracketed paths can now accept an additional index, which may also be ducked, that turns the access into a slice for array and string values. The order of the slice is maintained based on the given indices, so giving a larger index first will result in a reversed slice.
* Triple quoted strings and inline templates can now be stringified.

### Designer

* __BUG:__ Evaluations with locals will now clear the locals before evaluating on subsequent runs. This avoids locals that are removed from the evaluated expression still having a value.
* Containers with manual layouts now support sorting their children according to their y, x coordinates, making it easier to find adjacent children in the list.
* The left panes now have a minimum height of 1/3 of the viewport.


## 0.26.1

2025-03-11

### Data

* The `rand`/`random` operator now supports generating a random string from a set of characters and returning a random element from an array.
* Matching schemas against unions will now prefer to relay the union member with the fewest errors or with matching literals rather than simply relaying the errors of the last case. This tends to make errors with unions for tagged types much more relevant.
* The `parse` operator now has explicit support for JSON.
* The `string` operator now has an option to produce base64.
* The `format` operator and its postfix sugar now delegate to the regular operator application logic if there is no matching registered formatter.

### Parser

* Schemas can now include nested array types e.g. `Array<number[]>`.
* Schema unions can now include multiple array types e.g. `Array<{ foo: number }>|Array<string>`.
* Schema array types can now be specified as `any`, which is slightly different than the `[]` empty tuple, though it usually doesn't matter when checking a type against a schema.

### Designer

* __BUG:__ ctrl+enter will once again execute expressions in the evaluation pane.


## 0.26.0

2025-01-15

### Data

* __BUG:__ The `evaluate` function will no longer try to use the context position as an expression if there is a given expression. The avoids having `evaluate({ r: 'something' }, 'r == :something')` evaluate `something` as a reference.
* __BREAKING__: The `length`/`len` operator now works explicitly with strings, arrays, array datasets, and not just any object with a length attribute. If passed a non-array, non-dataset object, the number of keys will be returned. This is technically a breaking change but unlikely to have any actual negative effects.
* The `pad`, `padl`, and `padr` functions will now accept any value that converts to a single character string as padding.
* The `generate` function can now operator on a range.
* There is now a `cat` operator that replaces `+` for joining template portions, as `cat` will not consider actual addition under any circumstances.
* Date formats now support escpaing format characters so they can be included in the formatted date.
* Delimited reports now have access to the `@index` special reference corresponding to the index of the current row in the source dataset.
* Paged reports now have access to the `@page` special reference in any expression, where it was previously limited to page headers and footers.
* `diff` now has an option to compare only keys common to both objects.
* There is now a `patch` operator that can apply the results of one or more diffs to an object. The default moves forward, taking the object from the start point to the end point, but there is also an option to start with the end point and reverse to the starting point. There is also a strict mode that ensures the current value matches the starting point in the diff before adjusting to the ending point on a per-path basis.

### Parser

* The delimited text parser can now read markdown and some forms of ASCII table, and the detect function will produce a parsing config suitable for parsing tables.
* There is now experimental support for quoting strings with triple quotes to make embedding possibly quoted data, like csv or table data. Triple double-quoted strings do not support interpolation, but triple single-quoted strings do. There is not yet support for unparsing/stringifying triple quoted strings.
* There is now experimental support for inline templates in expressions using triple dollar signs as quotes. Everything within the dollar quotes is parsed as template, so block tags and interpolators can be used in raport expressions. There is also not yet support for unparsing/stringifying inline templates.

### Render

* The report runner can now run some rendered reports as delimited by finding the first repeater widget and creating a delimited definition using the expressions from row, and optionally, header label widgets.
* Repeaters now have the option to repeat their headers at regular intervals to make long report data easier to follow.

### Designer

* __BREAKING:__ The designer expression editor now uses a contenteditable div since textarea text wrapping and pre wrapping cannot be forced to be consistent. This does break some functionality with editing text, such as selected indent/outdent, since contenteditable can't be treated as just text.
* Boolean parameter labels will no longer add a question mark at the end of their label in the parameter editor.


## 0.25.0

2024-11-09

### Render

* __BUG:__ Widgets set to fill height can now be rendered after a non-full-width widget without an infinite loop.
* __BUG?:__ Delimited fields will now stringify field values that start with `[object` so JSON in a field is not lost.

### Data

* There is now a built-in `log` operator that can be hooked through the root context of an evaluation.
  * The designer now has a logging tab on the evaluation pane to view accumulated messages without having to access browser devtools.

### Parser

* Symbolic operators can now be parsed either with required space on either side or no space on either side e.g. `x==y` or `x == y`. Mixing spacing is not allowed to avoid ambiguity and for aesthetics. `x ==y` and `x== y` are not allowed. `let a = x + y\n-a` results in `-a` rather than trying to assign `x + y - a` to `a`.

### Designer

* Root context built for expression evaluation and designer context will now be cached until one of the bases for the root context is changed. This should result in much better performance for computation heavy sources and root contexts in the designer.
* Sources assembled while building root context for expression evaluation and designer context will now be passed a flag indicating that the source is not being requested for a full report run, allowing the source provider to return truncated or cached data.
* Embedders can now supply `extraProperties` that are added to the report property sheet.


## 0.24.9

2024-10-30

### Data

* __BUG:__ Date diffs that span years on the last day of the month will no longer swallow years.
* The similarity operator can now be asked for whole string similaroty in addition to the existing matching substring similarity.

### Render

* __BUG?:__ The renderer will no longer crash for report definitions with no widgets array.

### Designer

* The language reference is now exported for library use.


## 0.24.8

2024-07-27

### Designer

* There is now a print button in report output that is viewed as HTML.
* Evaluated data can be viewed as a tree.

### Data

* Rounding modes to-0 and from-0 now round fully from the target position regardless of the next position value. The previous to-0 and from-0 have been renamed the much more accurate half-to-0 and half-from-0.

### Render

* Autogenerated delimited reports will no longer add extraneous quotes to the header.

### Diff

* There is now a dark mode.
* Data can be CSV or XML in additional to JSON and Raport.
* Data can be displayed as a tree in addition to plain text.
* `undefined` is now handled more reasonably.


## 0.24.7

2024-06-12

### Designer

* The option to classify styles should now be less likely to be accidentally disabled.
* Custom external data loaders will now be passed additional parameters specifying whether the load is for a full report, what the designer set parameters values are, and the report definition.


## 0.24.6

2024-06-03

### Render

* __BUG:__ Border widths are no longer considered as taking additional space for box model contain widgets.
* __BUG:__ Floating point precision should affect scenarios where a widget takes exactly the remaining height, but some weird floatiness causes the calculated height to be 0.000000000001 more than the available space.
* __BUG:__ Maintaining an available vertical space is now done safely for flowed reports, and having the remaining space be exactly 0 is now correctly handled.

### Designer

* __BUG:__ The designer should now correctly show paper size for reloaded reports.
* There is now a `debugger` operator available to expressions run within the designer.


## 0.24.5

2024-06-02

### Render

* __BUG:__ Groups no longer require headers to be enabled to render the group container.
* __BUG:__ Header-per-page on a repeater will no longer repeat the header along with a group as the first item on a new page if the group doesn't have headers enabled.


## 0.24.4

2024-05-24

### Render

* __BUG:__ Height checking now accounts for float precision by scaling to 8 decimals. This fixes some infinite recursion issues where things fit until you add them together and get a 0.000000000001 bonus added on.
* __BUG:__ Layouts now account for built-in margin reductions coming into the layout, so a widget 1rem tall in a container with 0.2rem padding that has an availableY of 1.1rem will now render and stick rather than rendering and subsequently triggering a wrap that discards the render.
* __BUG:__ Repeater footers will now bridge and continue like other containers.


## 0.24.3

2024-05-24

### Render

* __BUG__: IDed labels within a repeater that breaks will no longer duplicate aggregated values. There is now a commit cycle for IDed labels that the repeater controls to prevent repeated renders of the same row from polluting the values collections. Nested repeaters with IDed footer labels also behave correctly.
* __BUG__: Nested repeaters will no longer lose rendered data if they trigger a break in a non-bridging parent row.

### Designer

* __BUG__: The expression viewer no longer adds extraneous line height and padding, so label expressions in the designer are more representative of their output and can be viewed fully.
* There is now a logo favicon.
* The language reference now covers template expressions.
* Delimited fields now support move and copy operations.


## 0.24.2

2024-05-11

### Data

* __BUG:__ The `base` formatter will now actually return the converted value.
* __BUG:__ The `reverse` operator for arrays will now return a reversed copy rather than reversing the source array and returning it.
* `-` can now be used as a unary operator.
* Ranges can now have exclusions in the form of any of the existing range parts immeddiately preceded by a `!` e.g. `1-20 !12 !15-16`.
* Contexts can now have local rounding set, which will cause any math operators that execute in the context or any of its children to automatically apply the set local rounding to their results. Context-local rounding can be specified with `set-defaults`.

### Render

* Delimited reports now have support for row context, which allows for context to be set up for each value in the data source before fields are rendered in that context. If the row context expression returns a value, it will replace the value from the source before the fields are rendered.

### Designer

* While the designer is not really useful for much in mobile safari, it will now at least try to tell safari not to jump and zoom every time you happen to focus an input.
* The left menu will now automatically hide when it transfers focus to the expression pane. The widget tree and widget props icons on the left bar will cause the left menu to open with their respective sections shown exclusively.
* The expression editor is used in more places, like the source filter, sort, group, and context.
* The context pane is now more helpful for source, context, and delimited field expressions.
* The sample data included with the designer is now more complex. It is based on the northwinds schema and data that was available for SQLite. If a project is saved with a reference to sample data, it will now be injected into the project as it loads.
* There is now a `+F` button on the report entry in the widget tree for delimited reports to add a field.
* The editor should now get a little less out-of-sync between the actual text and the highlighted view, though there appears to be a bug in `word-break: break-all` in most browsers that causes some lines not have characters completely filling them. This causes line numbers to get misaligned for some very long lines.


## 0.24.1

2024-04-25

### Data

* __BUG:__ `filter` with a sort expression and no filter expression will no longer discard the result of the sort.
* Parsed expressions are now cached in namespaces associated with their parsers so that template expressions and plain expressions don't interfere with each other.


## 0.24.0

2024-04-25

### Render

* Delimited fields that produce `undefined` as a value will no longer output the string 'undefined'. If you need undefined to be the result, you can use a coalescing operator to return the string literally.
* The delimited runner can now render an HTML table rather than delimited data. This is intended for use in the designer but could be useful elsewhere.

### Designer

* __BUG__: The delimited output no longer overflows its container.
* __BUG__: The expression evaluation pane will no longer show undefined when the expression is cleared out.
* There is now helper for delimited headers that places the expression from the corresponding field in any blank headers.
* There is now an option to view delimited data as a table rather than as delimited text.


## 0.23.9

2024-04-19

### Data

* __BUG:__ The `sort` operator and internal filtering with no sort will no longer modify any input array.


## 0.23.8

2024-04-11

### Data

* __BUG:__ Passing a date and a non-string to an operator that accepts `equal::sql` will no longer throw.


## 0.23.7

2024-04-11

### Data

* The `deep-is`, `deep-is-not`, and `diff` operators can now take an `equal` named argument in place of the third positional argument, and it can be specified as `'sql'`, which has some additional loose handling around booleans, numbers, and dates as strings.


## 0.23.6

2024-03-26

### Designer

* __BUG:__ The designer for delimited reports will now correctly reload quotes and field and record delimiters from a report definition.
* The operators pane no longer has nested scrollbars.
* The parameters pane will now show placeholders for object- and array-typed parameters.


## 0.23.5

2024-03-05

### Render

* __BUG:__ The delimited report runner will now clear the expression cache after running headers so that template expressions from the headers that happen to match field expressions won't cause the fields to just render the header string again.


## 0.23.4

2024-03-01

### Data

* __BUG:__ Extracting days from a time-span will now consider adding a month to the last day of a month with less than 31 days to go to the last day of the next month.


## 0.23.3

2024-01-10

### Render

* __BUG:__ Labels using the old array-for-substyling method will no longer render escaped HTML.
* __BUG:__ Top-level macro widgets will now be processed fully.
* Macros can now be completely replaced with a new widget by returning a result in the form `{ replace: Widget }`

### Data

* There is a new `generate` operator that can be used to iteratively create arrays in a was similar to generators from other languages.

### Designer

* Labels will no longer offer to split their text into parts, though they can still be modified if they are already split. Styled labels are the preferred and superior replacement.
* The widget tree scroll-to-active function now targets center to better accomodate sticky nodes.
* Labeled fields in the UI with buttons next to the label will now align more pleasantly.
* Selecting a macro container or expression repeater will link the relevant property to the evaluation pane like label text.
* There are now tooltips for pasting and moving elements and more consistent behavior when pasting.
* Repeater source expressions will now use an Editor rather than a plain text field.
* Expression repeaters will now show their source in the widget tree.
* Provided data sources that don't parse as JSON but are still valid expressions will be processed correctly.
* A number of UI adjustments have been made to make navigating the designer more pleasant - like additional space between settings inputs and clipped widget link paths on the bottom bar.


## 0.23.2

2024-01-06

### Data

* The xml parser can now be more strict if requested.
* The xml stringifier will now properly indent a closing array tag.
* There is now a `flatten` operator and the `map` operator includes a `flat` option to allow flattening nested arrays.

### Designer

* Data sources that are xml-ish will attempt to parse the text as xml.
* The project name is now visible in the top tab bar.
* The designer UI has been slightly redesigned to allow more control over the size and contents of the side and bottom panes.
* Holding the shift key while mousing around the designer canvas will ignore container widget top bars, making it easier to select widgets just above containers.
* The operator docs are now a separate tab on the bottom bar with a search by docs and by operator name.


## 0.23.1

2023-12-31

### Data

* The `parse` operator can now parse basic well-formed XML with a new `xml` option. The parser is also exported from the library as `parseXML`.


## 0.23.0

2023-12-31

### Render

* __BREAKING BUG:__ At some point setting a widget to break changed from breaking after the widget to breaking before the widget. Since it changed in a much earlier version, this just notice that the docs were incorrect about how breaking widgets worked. The docs have been updated to reflect actual behavior.
* __BUG:__ Labels will no longer stop wrapping if they are children of containers that prevent overflow.
* The `@widget` and `@placement` special references are now available to context expressions.
* Line height is now used for measuring the height of text if available.
* Measured labels will now break words only if they can't fit on a single line by themselves. This matches the expectations of the measuring function.
* The measuring function for measured labels now also handles wrapping words that need to break.

### Data

* __BUG:__ The `phone` formatter will no longer break rendering if it's given a value that isn't a string or number.
* The measuring function for measured labels is now exposed as the `wrap-count` operator.
* There are a few new formatters available:
  * `base` - converts a number to a different base as a string.
  * `base64` - encodes a value as base64.
  * `hex` - converts a number to hex or a string to a hex encoding.
  * `noxml` - escapes lt, gt, and amp in a string so that it can be safely included in xml.
  * `xml` - renders a value as xml with optional indenting.
* The `parse` operator can now parse base64.

### Designer

* File imports and exports now default to `*.raport` for design files and `*.raport-proj` for project files.
* Ctrl-Shift-Enter key events in the output iframe are now forwarded to the designer to rerun the report.
* Measured labels can now have a line height set.
* Images and measured labels now have a preview string shown in the widget tree.


## 0.22.4

2023-12-26

### Project

* __BUG:__ The Widget type now has a field for `styled` so that styled labels will type check in definitions.
* There is a new diff tool next to the designer that uses the `diff` operator to compare to chunks of data.

### Data

* The `string` operator with a `raport` flag will now properly stringify numbers, booleans, null, and undefined.

### Render

* __BUG:__ Template interpolators that result in `undefined` will once again render an empty string.


## 0.22.3

2023-12-19

### Render

* __BUG:__ Continuations in an auto layout will no longer be dropped.
* __BUG:__ Open blocks in styled text are now properly closed if left hanging at the end of the input.
* Computations that are undefined will no longer be computed.
* Text alignment can now be `justified`.

### Data

* The `index` operator can now index the same value by multiple keys, index multiple values from the same array entry, and has alternate forms of result to make certain operations easier to track.

### Designer

* __BUG:__ The font weight properly will now be set to numbers rather than strings.


## 0.22.2

2023-12-16

### Render

* __BUG:__ Auto layout containers with a set height will no longer prematurely limit the available vertical space for children when the first wrap occurs.
* __BUG:__ Containers with a fixed height and contents that overflow it will now render an error rather than trying to fit the container on a new page until the heat death of the universe or the engine kills the script, whichever comes first.

### Designer

* __BUG:__ The container height property can now be set to and show the `auto` setting.

## 0.22.1

2023-12-12

### Render

* Styled text now supports a rotate tag, which takes a number of turns and an optional direction to rotate the block. It may also optionally specify a translation origin as a set of x/y coordinates that may be numbers, percent, or positional e.g. top left.
* Styled text now supports a move tag, which takes an x and y position and performs translation. x and y may be specified as numbers or percent.
* The order in which move and rotate tags appear matter, as the one that appears first will be applied first.
* Styled tag values that are numeric may now be negative.
* __EXPERIMENTAL:__ Containers can now be configured as macros, which allows them to evaluate an expression in the local context that returns properties and/or contents.


## 0.22.0

2023-12-08

### Render

* __BUG:__ Labels containing html will now properly escape the html.
* Labels can now support inline styled text using a new styled markup parser that is also available to the `string` operator and as a formatter.

### Designer

* __BUG:__ The data source import editor should no longer get a cached string stuck for all data sources.


## 0.21.0

2023-10-12

### Render

* __BREAKING:__ Line heights will not be set to match widget height. The property tip for line height indicates that it will be set to font size, so the behavior matches that indication.
* __BUG:__ Preventing overflow will no longer interfere with significant space. Previous behavior would force the content into a single line with both enabled.
* Repeater rows can now be elided using a boolean or expression. The rows are still rendered, so any data collected through IDed labels is available in the footer, making this quite the same effect as hiding the row container.

### Designer

* There is now an option to scale the UI between 25 and 300%.


## 0.20.1

2023-10-07

### Render

* __BUG:__ Repeaters with per-page headers and groups will now render the per-page header.


## 0.20.0

2023-10-07

### Render

* __BREAKING:__ Grouped repeaters can now have headers enabled per group and at the top level.
* __BUG:__ Grouped repeater headers that happen to use the remaining space on a page will no longer be lost.
* Reports now have configurable margins. The page header and footer can potionally be included in the margin.

### Data

* __BUG:__ Formatters will now receive their default ops when called in postfix sugar mode.
* Operators can now be called as formatters, and `set-defaults` can set options for operators called as formatters. This allows operators like `round`, `join`, `uppoer`, and `lower` to be used directtly as formatters.
* The `eval` operator now has an option to evaluate the string as a template, and a context can be given for evaluation.
* The `length` operator now properly supports strings.
* The `get` operator now supports numeric indices.

### Designer

* Specialized containers now have their specialized name as a heading above their properties rather than just 'Container'.
* Empty margins now compact more compactly.
* The language reference colors will now follow the designer theme mode.
* The definition tab now includes a button to quickly copy the definition to the clipboard.
* Formatters are now listed as operators, and the operator listing is sourced entirely from the documentation.
* There is now a version number and link to the source repository at the top of the designer.
* There is now a way to close a project.
* Data source imports no longer try to import on change. There is now a button to process the import.

### Parser

* Format ops can now be chained if they use parenthetical or no argument lists.


## 0.19.1

2023-05-05

### Render

* __BUG:__ Widgets that use their remaining container space on either axis will now automatically contain unless they are explicitly set to expand. This makes full width widgets with borders become considerably less irritating to place.
* __BUG:__ Percentage and grow widths and heights within sized containers are now more accurate.
* __BUG:__ Containers now handle multiple large children that can break across pages more safely.
* __BUG:__ Containers with auto height will now account for borders when sizing to their contents.
* __BUG:__ Containers with 100% or grow dimensions will now account for their borders when rendering their children.
* __BUG:__ The first grow width element in an auto layout container will no longer shrink by the container's margin.

### Data

* The `round` operator now supports alternate rounding methods half even, half odd, half up, half down, to 0, and from 0.
* The `round` operator can now round to the nearest whole number place by specifing a negative number of digits where -1 is to the nearest 10, -2 is the nearest 100, etc.
* The `set-defaults` operator can now set defaults for the `round` operator.

### Designer

* __BUG:__ Numeric widget properties now use a lazy binding to avoid type switches for 0 and decimal values that don't immediately parse to a valid number.
* __BUG:__ Repeater groups, header, footer, and alternate can now be removed using the x in the widget tree.
* The local context for widget expressions in the evaluation pane now more closely matches what it is at runtime.
* Local variables are now shown in the evaluation pane.
* There is now a language reference in the bottom pane on a tab next to the expression evaluator.
* The operator search now includes the operator docs when matching.
* The widget tree will now show a repeater's data source and a label's ID.
* Moving and copying elements can now be done against any widget. If the target widget is not a container, clicking it will place the source element above it. If it is a container, the source will be appended to its children. If the CTRL key is being held and the target is a container, the source will be placed above the target.
* Headers, footers, groups, overlays, watermarks, and alternates can now be added to the report and repeaters from the widget tree.


## 0.19.0

2023-04-28

### Render

* __BREAKING__: Container context will now capture locals, so any locals set while evaluating the context expression will be available to any nested context as well.

### Data

* __BUG__: The deep equality operators will no longer break if given a null.
* __BUG__: The `string` and `parse` operators will once again properly use named arguments in addition to supporting a second option object, which takes precedent over named arguments.
* The `date` operator will now return `undefined` rather than an invalid date.
* The basic equality check will now compare JS dates and raport dates if possible.
* The `block` operator now has an `implicit` mode that use the parent context locals, so any locals that are set within the implicit block will remain with the parent context.

### Parser

* __BREAKING__: `end`, `with`, `each`, `esac`, and `fi` are now illegal references.
* The final type alias in a schema may now include a trailing `;`.
* `unless` expressions can now be closed with `end` to allow disambiguation in a nested conditional.

### Designer

* External provided sources are now longer cached for report runs. This limits churn while navigating context while ensuring correct data is available when the report is run.
* There is now an export `highlight` function that accepts an expression string and returns classified HTML.
* The designer now includes a language reference on a tab next to the evaluation pane.


## 0.18.1

2023-04-12

### Data

* The `index` operator now supports a `many` option that aggregates values that have the same key into lists rather than overwriting the same key in the resulting map.


## 0.18.0

2023-04-12

### Data

* There is a new `index` operator that converts an array into a map using a given application that returns an empty array to omit, a key or single-entry tuple for the key, or a tuple of key and value.


## 0.17.3

2023-04-07

### Designer

* Delimited reports will now have widget and size entries left over from switching report types removed from their compact definitions.

### Data

* Building a DataSet from a source value is now normalized by using the new `toDataSet` method that ensures sources match the expected interface.


## 0.17.2

2023-04-05

### Designer

* Delimited reports can now have multiple defined sources, and the primary source is now selected in report properties, defaulting to the first defined source.


## 0.17.1

2023-03-21

### Data

* __BUG__: The `join` operator now behaves as indicated by its docs. It can now be given special final separators for two and three or more items.

### Designer

* __BUG__: The source editor will no longer break when switching between report sources and widget sources.


## 0.17.0

2023-03-20

### Data

* __BUG__: Special variables are now handled safely when forking a context. This keeps specials from disappearing from scope when evaluating some applications.

### Render

* Repeaters can now provide an alternate container that will be rendered in the body if there is no data available in the row source.

### Designer

* Top-level report widgets and those in the overlay and watermark can now be positioned manually by the designer.
* The widget tree now shows groups, headers, footers, and alternates and the overlay and watermark in a more logical order for how they appear in a rendered report.


## 0.16.2

2023-03-20

### Data

* __BUG__: Data sources that are based on a data set will no longer erroneously wrap it in a further data set.

### Designer

* __BUG__: The source editor now correctly distinguishes between a report source, which has access to provided sources, and a widget source, which has access to report sources.
* __BUG__: Cached sources that result in a data set will no longer introduce an additional wrapper data set while building report context.


## 0.16.1

2023-03-15

### Designer

* The context list of the expression evaluation pane can now be filtered to show branch nodes and leaves that contain a filter string.


## 0.16.0

2023-03-15

### Data

* __BUG:__ Applications as custom operators can now be called without arguments.
* __BREAKING:__ Applications that need to be parsed will now be evaulated in the same way they would have been had they been pre-parsed.
* __BREAKING:__ The context used in applications and blocks will now fork the current context if there are no locals defined in the current context to eliminate the need to use context parent prefixes where unnecessary.
* Internal sort functionality has been refactored to be more useful for the `sort` operator, which allows the `sort` operator to work on objects in addition to arrays. Objects can now have their keys sorted by arbitrary application.
* The `sort` operator can now accept a single sort specifier without a wrapping array, and it now defaults to an identity sort if no specifiers are provided.
* The `is` and `is-not` operators, but not their symbolic aliases, can now be used to verify that a value conforms to a schema e.g. `{ name::dave } is @[{ name: string }]` will return `true`. The check is done with loose validation.
* Similarly, `strict-is` and `strict-is-not` can be used to verify that a value strictly conforms to a schema.

### Parser

* __BUG:__ The stringifier will now take into account wrap settings when stringifying object and array literals.
* Nullish settings for stringifier wrap options will now apply the base setting rather than `0`.

### Designer

The designer has been adjusted to be more amenable to embedding within other projects (see [pg-difficult](https://github.com/evs-chris/pg-difficult) for example), mostly by enhancing the 'no-project' mode enabled by setting `showProjects` to `false`. There are also several new events that fire in place of undesirable standalone behavior, like providing a source or saving a project.

* __BUG:__ The page widget header will remain legible while the page is not the active widget.
* `<ctrl>+<enter>` will now activate the eval pane if it's not focused or run the expression if it is focused.
* Eval results can now be rendered as compact JSON and Raport expression.
* The parsed eval AST now has an option to display as a pretty-printed Raport expression.


## 0.15.1

2023-02-16

### Render

* __BUG:__ Containers that land on a page boundary but are not allowed to break will now resume correctly (from the first widget) on the following page.
* __BUG:__ Repeaters with non-full-width rows will now properly allocate height for incomplete width use i.e. when only a portion of the available width is consumed, the row will still use its full height.
__BUG:__ Automatic layouts now take the current y-axis offset into account when determining the available height for a widget i.e. in an available height of 10, a widget being rendered at y=2 would only have an available height of 8 rather than 10.

### Data

* __BUG:__ The `nth` operator now accesses elements with a 1-based index to match its documentation.
* __BUG:__ Aggregate operators can now correctly access implicit data sources that in DataSet form.
* Negative indexes into an array will now access from the end of the array rather than returning undefined.
* The `nth` operator also now allows negative index access.
* The `min` and `max` operators will now check all of their arguments if there is no current source, an array is not given, and the first argument is not an application.
* The `source` operator will no longer turn an existing source into a source. It also now accepts a second application argument that, if given, will call the application with the given source installed and return the application's result.

### Designer

* __BUG:__ Selecting the report will no longer collapse all container widgets in the tree.


## 0.15.0

2023-02-11

### Data

* __BREAKING:__ Formatters can now register default options. The builtin formatters will fall back to the defaults for arguments that aren't passed in.
* __BUG:__ `eeach` and `with` will now properly handle undefined values.
* __BUG:__ The `label-diff` operator now passes through its options the to `labelDiff` function and will not longer fail if no options are provided.
* There is a new `set-defaults` operator that can be used to override builtin formatter defaults. This is probably best called from a report definition's extra context.
* The `each` operator can now accept a `join` option when called from a non-template expression.
* The `inspect` operator now accepts `mode` and `flat` options.
* There is now a `pad` operator that will center its string with padding. There is also a new matching formatter.
* `let` and `set` and the `safeSet` function will now return the value that is being replaced, if any.
* The `group` operator will now properly handle non-array grouping arguments.

### Parser

* __BREAKING:__ Named arguments to operators are no longer gathered into an object expression and appended to the arguments list. They are now collected during parsing into a new field in the operator AST, which allows them to be used more reliably in operators that are sensitive to argument count. Named arguments are now known as operator options internally. The stringifier no longer accepts the option to not use named arguments.
* __BREAKING:__ Formatters can now be applied with call-style arguments, which allows them to accept operator options. Most of the existing formatters now accept their positional arguments as options as well. The strigifier prefers shorter argument format if there is no need for the call-style.

### Designer

* `ctrl-s` will now save changes to the loaded project.
* The designer root context will now include any extra context set in the report definition.
* If you refresh the designer with a project open and unsaved, the designer will now reload the project before applying unsaved changes.
* You can now double-click the `Plain` evaluation output toggle to copy the output to the clipboard.
* More of the UI elements have tooltips that describe their intended purpose.
* The widget tree now uses sticky positioning for nodes with children to keep the path to the displayed widgets visible if there is available space.
* The evaluate pane operators listing is now searchable, which is useful when combined with the operator docs tooltips. You can also shift click an operator to pop its docs up in an alert.
* You can now import/export all projects at once.
* New projects will now start with the correct default config for a paged report.
* The main designer view is now slightly more navigable for tightly packed widgets, especially when the target container is the active widget.

### Project

* The operator and formatter docs are now automatically exported to [Operators.md](./Operators.md) when packaging the project.


## 0.14.1

2023-02-08

### Data

* When evaluating an operator that cannot be found, the root context will now be checked if the operator is not found in the local context.

### Designer

* The report context sections now have tooltips to explain what they do.


## 0.14.0

2023-02-08

### Data

* __BUG:__ Applications with named args are now properly detected by the internal `isApplication` check.
* The `map` operator can now return an array of entries or an array of results when applied to an object if the `entries` or `array` option is supplied, respectively.
* There is a new `detect-delimiters` operator that can detect delimited text delimiters, like CSV or TSV, for a given text and optional character count and return delimited text parsing options.
* The `parse` operator can now read delimited text with the `csv` option. The given options may also include delimited text parsing options or the `detect` option to automatically detect delimiters.

### Render

* __BREAKING:__ Delimited text reports now process their headers in template rather than expression mode. This more closely matches their common use.
* __BREAKING:__ Unset delimited fields now render as empty strings rather than `undefined`.

### Designer

* Provided data sources may now be delimited text or an expression that evaluates to data, JSON, or delimited text.
* All of the widget properties now have tooltips.
* The widget tree for delimited reports now shows the header text for each field, if available.
* The context will now be read correctly if a delimited report source happens to be grouped.
* There are a handful of console warnings fixed and style issues resolved.


## 0.13.6

2023-02-02

### Parser

* __BUG__: Stringifying a unary `+` operation with a string literal will no longer break the stringifier.

### Data

* The `min` and `max` operators will now ignore `NaN` values.

### Designer

* __BUG__: The widget tree will no longer get stuck on collapsed.
* The designer is now slightly more iframe embed friendly.


## 0.13.5

2023-01-20

### Render

* __BUG__: The `@size` reference is now actually available in page headers and footers.
* Repeater rows and footers now get access to `@last` and `@count` special references, which are the last index and total count of the repeating source, respectively.

### Parser

* __BUG:__ References with non-identifier-safe path parts will now stringify correctly.

### Designer

* __BUG:__ Sources are no longer exposed as root references in the context section of the expression editor. Instead, they appear as valid source references e.g. `*some-source`.
* __BUG:__ Linked references now show the correct parsed value in the expression editor.
* Root references now include their full schema in the expression editor context section.
* The expression editor now shows special references for specific contexts e.g. `@page` for page headers and footers and `@group` for grouped repeaters.


## 0.13.4

2023-01-19

### Designer

* __BUG:__ Moving a widget in a manual layout container down the list of widgets in the container will no longer break the container layout.
* Labels and containers in the widget tree will now show a little info about their content, so they're a little easier to tell apart.
* Holding shift while moving a widget up or down the tree will move the widget to the top or bottom, respectively.
* Holding control while moving a widget in a manual layout container up or down the tree will stop its layout corrdinate from moving with it, effectively swapping the coordinates of the swapped widgets.
* There is now a copy action button in the widget tree to allow easily duplicating a widget and its children.
* Containers in the widget tree now support collapsing their nodes, making it easier to deal with adjacent widgets that have many children.


## 0.13.3

2023-01-17

### Data

* __BUG:__ The `map` operator will no longer throw when applied to an undefined value.

### Render

* __BUG:__ Manually positioned widgets without explicit x,y coordinates in an auto sized container will now properly be assigned 0,0 rather than breaking the height calculation on the container.


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
