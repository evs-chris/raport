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
