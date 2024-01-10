
# Raport API

## Operators

<dl><dt>

### `!=` (alias `is-not`)
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => boolean</code> (binary)</dt>
<dd>Returns true if the given values are not equal (not strict).</dd>
<dt><code>(any, schema) => boolean</code> (binary)</dt>
<dd>(Only applies to the 'is-not' alias) Returns true if the given value does not loosely conform to the given schema.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `!==` (alias `deep-is-not`)
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => boolean</code> (binary)</dt>
<dd>Do a deep inequality check on the first two arguments using loose equality for primitives.</dd>
<dt><code>(any, any, 'strict'|'loose'|application) => boolean</code></dt>
<dd>Do a deep inequality check on the first two arguments using the comparison method specified by the third argument. If an application is given, it will be called with each item being checked at each step in the recursive check to determine equality.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `%` (alias `modulus`)
---

</dt>
<dd>

<dl>
<dt><code>...any => number</code> (binary)</dt>
<dd>Returns the modulus of the given values starting with the first.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `&&` (alias `and`)
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => any</code> (binary)</dt>
<dd>Lazily evaluates its arguments and returns the final value or `false` if any of the values are not truthy.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `*` (alias `multiply`)
---

</dt>
<dd>

<dl>
<dt><code>...number => number</code> (binary)</dt>
<dd>Multiplies the given values starting with the first.</dd>
<dt><code>(string, number) => string</code> (binary)</dt>
<dd>Returns the given string copied number times.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `**` (alias `pow`)
---

</dt>
<dd>

<dl>
<dt><code>...number => number</code> (binary)</dt>
<dd>Applies exponentiation to the given arguments with right associativity.</dd>
<dd>e.g. <code>(** 1 2 3) is 1^(2^3)</code></dd>
</dl>

</dl>
<br/>

<dl><dt>

### `+` (alias `add`)
---

</dt>
<dd>

<dl>
<dt><code>...number => number</code> (binary)</dt>
<dd>Adds the given numbers together.</dd>
<dt><code>...any => string</code> (binary)</dt>
<dd>Concatenates the given arguments as strings.</dd>
<dt><code>any => number</code> (unary)</dt>
<dd>The unary + operator converts the given value to a number.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `-` (alias `subtract`)
---

</dt>
<dd>

<dl>
<dt><code>...any => number</code> (binary)</dt>
<dd>Subtracts the given values as numbers starting with the first.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `/` (alias `divide`)
---

</dt>
<dd>

<dl>
<dt><code>...any => number</code> (binary)</dt>
<dd>Divides the given values starting with the first.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `/%` (alias `intdiv`)
---

</dt>
<dd>

<dl>
<dt><code>...any => number</code> (binary)</dt>
<dd>Divides the given values with integer division starting with the first.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `<` (alias `lt`)
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => boolean</code> (binary)</dt>
<dd>Returns true if the first value is less than the second.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `<=` (alias `lte`)
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => boolean</code> (binary)</dt>
<dd>Returns true if the first value is less than or equal to the second.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `==` (alias `is`)
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => boolean</code> (binary)</dt>
<dd>Returns true if the given values are equal (not strict).</dd>
<dt><code>(any, schema) => boolean</code> (binary)</dt>
<dd>(Only applies to the 'is' alias) Returns true if the given value loosely conforms to the given schema.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `===` (alias `deep-is`)
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => boolean</code> (binary)</dt>
<dd>Do a deep equality check on the first two arguments using loose equality for primitives.</dd>
<dt><code>(any, any, 'strict'|'loose'|application) => boolean</code></dt>
<dd>Do a deep equality check on the first two arguments using the comparison method specified by the third argument. If an application is given, it will be called with each item being checked at each step in the recursive check to determine equality.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `>` (alias `gt`)
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => boolean</code> (binary)</dt>
<dd>Returns true if the first value is greater than the second value.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `>=` (alias `gte`)
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => boolean</code> (binary)</dt>
<dd>Returns true if the first value is greater than or equal to the second value.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `??`
---

</dt>
<dd>

<dl>
<dt><code>...any => any</code> (binary)</dt>
<dd>Returns the first non-null, non-undefined value.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `abs`
---

</dt>
<dd>

<dl>
<dt><code>number => number</code></dt>
<dd>Returns the absolute value of the given number.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `add` (alias `+`)
---

</dt>
<dd>

<dl>
<dt><code>...number => number</code> (binary)</dt>
<dd>Adds the given numbers together.</dd>
<dt><code>...any => string</code> (binary)</dt>
<dd>Concatenates the given arguments as strings.</dd>
<dt><code>any => number</code> (unary)</dt>
<dd>The unary + operator converts the given value to a number.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `and` (alias `&&`)
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => any</code> (binary)</dt>
<dd>Lazily evaluates its arguments and returns the final value or `false` if any of the values are not truthy.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `array`
---

</dt>
<dd>

<dl>
<dt><code>...any => any[]</code></dt>
<dd>Returns all of its arguments in an array.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `avg`
---

</dt>
<dd>

<dl>
<dt><code>() => number</code> (aggregate)</dt>
<dd>Computes the average of the current source.</dd>
<dt><code>number[] => number</code></dt>
<dd>Computes the average of the given array of numbers.</dd>
<dt><code>(any[], application) => number</code></dt>
<dd>Computes the average of the applications for the given array of values.</dd>
<dt><code>application => number</code> (aggregate)</dt>
<dd>Computes the average of the applications for the current source.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `block`
---

</dt>
<dd>

<dl>
<dt><code>...any => any</code></dt>
<dd>Evaluates each of its arguments and returns the value of the final argument.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `case` (alias `switch`)
---

</dt>
<dd>

<dl>
<dt><code>(any, ...(any|application, any)) => any</code></dt>
<dd>Evaluates its first argument and uses it as a basis for comparison for each subsequent pair of arguments, called matchers. The first value in a matcher is used for the comparison, and the second value is returned if the comparison holds. If the matcher first value is an application, the matcher matches if the application returns a truthy value when given the basis value. If the matcher first value is a value, the matcher matches if the first value and the basis value are loosely equal. The basis value is available as @case or the shorthand _ in each matcher.</dd>
<dd>e.g. <code>case 1+1 when 1 then :nope when =>4 - _ == _ then :yep else :other end</code></dd>
<dd>e.g. <code>case(1+1 1 :nope =>4 - _ == _ :yep :other)</code></dd>
</dl>

</dl>
<br/>

<dl><dt>

### `ceil`
---

</dt>
<dd>

<dl>
<dt><code>number => number</code></dt>
<dd>Returns the given number rounded up to the nearest integer.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `clamp`
---

</dt>
<dd>

<dl>
<dt><code>(number, number, number) => number</code></dt>
<dd>Takes a minimum, a value, and a maximum, and returns the minimum if the value is less than the minimum, the maximum if the value is more than the maximum, or the value otherwise.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `coalesce`
---

</dt>
<dd>

<dl>
<dt><code>...any => any</code></dt>
<dd>Lazily evalutes its arguments to return the first non-nullish one it encounters.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `coalesce-truth`
---

</dt>
<dd>

<dl>
<dt><code>...any => any</code></dt>
<dd>Lazily evalutes its arguments to return the first truthy one it encounters.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `contains`
---

</dt>
<dd>

<dl>
<dt><code>(any[], any) => boolean</code> (binary)</dt>
<dd>Returns true if the second argument is found in the first argument array using indexOf.</dd>
<dt><code>(any[], any[]) => boolean</code> (binary)</dt>
<dd>Returns true if each entry in the second argument is found in the first argument array using indexOf.</dd>
<dt><code>(any[], application) => boolean</code> (binary)</dt>
<dd>Returns true if the second argument application returns true for one of the values in the first argument array.</dd>
<dt><code>(object, application) => boolean</code> (binary)</dt>
<dd>Returns true if the second argument application returns true for one of the [value, index, key] tuples in the first argument array.</dd>
<dt><code>(string, string) => boolean</code> (binary)</dt>
<dd>Returns true if the second argument is a substring of the first argument.</dd>
<dt><code>(daterange, date) => boolean</code> (binary)</dt>
<dd>Returns true if the second argument is a falls within the first argument range.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `count`
---

</dt>
<dd>

<dl>
<dt><code>any[] => number</code></dt>
<dd>Returns the number of entries in the given array.</dd>
<dt><code>() => number</code> (aggregate)</dt>
<dd>Counts the number of entries in the current source.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `date`
---

</dt>
<dd>

<dl>
<dt><code>string => date</code></dt>
<dd>Parses the given date as a platform date (JS), using the builtin parser first and the platform parser if that fails.</dd>
<dt><code>(string, string) => date</code></dt>
<dd>Parses the given date as a platform date (JS), using the builtin parser first and the platform parser if that fails. If the second argument is parseable as a time, the date is shifted to that time.</dd>
<dt><code>(date, string) => date</code></dt>
<dd>If the second argument is parseable as a time, the given date is shifted to that time.</dd>
<dt><code>date => date</code></dt>
<dd>Processes the given date and return the result with optional named arguments applied.</dd>
</dl>

#### <ins>Options</ins>

<dl>
<dt><code>rel</code> or <code>parse</code></dt><dd>Return a raport date rather than a platform date.</dd><dt><code>shift</code></dt><dd>When combined with a relative date and time argument with a timezone, will shift the time along with the timezone in the resulting date rather than just changing the timezone and leaving the time as is.</dd><dt><code>y</code></dt><dd>Set the target year on the resulting date. This is not applicable for relative dates.</dd><dt><code>m</code></dt><dd>Set the target month on the resulting date with a 1 indexed number e.g. January is 1 rather than 0. This is not applicable for relative dates.</dd><dt><code>d</code></dt><dd>Set the target day on the resulting date. This is not applicable for relative dates.</dd><dt><code>clamp</code></dt><dd>If m or d is specified, setting a number not in the normal range will cause the date to shift outside its bounds e.g. m:13 would be January of the following year. This option will prevent that behavior.</dd>
</dl>
</dl>
<br/>

<dl><dt>

### `deep-is` (alias `===`)
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => boolean</code> (binary)</dt>
<dd>Do a deep equality check on the first two arguments using loose equality for primitives.</dd>
<dt><code>(any, any, 'strict'|'loose'|application) => boolean</code></dt>
<dd>Do a deep equality check on the first two arguments using the comparison method specified by the third argument. If an application is given, it will be called with each item being checked at each step in the recursive check to determine equality.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `deep-is-not` (alias `!==`)
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => boolean</code> (binary)</dt>
<dd>Do a deep inequality check on the first two arguments using loose equality for primitives.</dd>
<dt><code>(any, any, 'strict'|'loose'|application) => boolean</code></dt>
<dd>Do a deep inequality check on the first two arguments using the comparison method specified by the third argument. If an application is given, it will be called with each item being checked at each step in the recursive check to determine equality.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `detect-delimeters`
---

</dt>
<dd>

<dl>
<dt><code>string => CSVOptions</code></dt>
<dd>Detects the field, record, and quote delimiters from the first 2048 characters of the given string.</dd>
<dt><code>(string, number) => CSVOptions</code></dt>
<dd>Detects the field, record, and quote delimiters from the first given number of characters of the given string.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `diff`
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => Diff</code></dt>
<dd>Does a deep comparison of the two arguments returning a map of deep keypath to a tuple of the left value and right value for differing paths.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `divide` (alias `/`)
---

</dt>
<dd>

<dl>
<dt><code>...any => number</code> (binary)</dt>
<dd>Divides the given values starting with the first.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `does-not-contain`
---

</dt>
<dd>

<dl>
<dt><code>(any[], any) => boolean</code> (binary)</dt>
<dd>Returns false if the second argument is found in the first argument array using indexOf.</dd>
<dt><code>(any[], any[]) => boolean</code> (binary)</dt>
<dd>Returns false if each entry in the second argument is found in the first argument array using indexOf.</dd>
<dt><code>(any[], application) => boolean</code> (binary)</dt>
<dd>Returns false if the second argument application returns true for one of the values in the first argument array.</dd>
<dt><code>(object, application) => boolean</code> (binary)</dt>
<dd>Returns false if the second argument application returns true for one of the [value, index, key] tuples in the first argument array.</dd>
<dt><code>(string, string) => boolean</code> (binary)</dt>
<dd>Returns false if the second argument is a substring of the first argument.</dd>
<dt><code>(daterange, date) => boolean</code> (binary)</dt>
<dd>Returns false if the second argument is a falls within the first argument range.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `each`
---

</dt>
<dd>

<dl>
<dt><code>(any[], application) => string</code></dt>
<dd>Iterates over the given array, executes the application for each value, and returns ther results joined with an empty string.</dd>
<dt><code>(any[], application, ...(boolean, result)) => string</code></dt>
<dd>Iterates over the given array, executes the application for each value, and returns ther results joined with an empty string. If the array is empty, then the final array of condition/result pairs are lazily evaluated to return one that matches.</dd>
<dt><code>(object, application) => string</code></dt>
<dd>Iterates over the given object entries, executes the application for each value, and returns ther results joined with an empty string.</dd>
<dt><code>(object, application, ...(boolean, result)) => string</code></dt>
<dd>Iterates over the given object entries, executes the application for each value, and returns ther results joined with an empty string. If the object is empty, then the final array of condition/result pairs are lazily evaluated to return one that matches.</dd>
</dl>

#### <ins>Options</ins>

<dl>
<dt><code>join</code></dt><dd>An alternate string to use to join the results.</dd>
</dl>
</dl>
<br/>

<dl><dt>

### `eval`
---

</dt>
<dd>

<dl>
<dt><code>string => any</code></dt>
<dd>Evaluates the given string as an expression.</dd>
</dl>

#### <ins>Options</ins>

<dl>
<dt><code>template</code></dt><dd>Evaluate the given string as a template in the current context.</dd><dt><code>context</code></dt><dd>The context in which to evaluate the expression. If not given, the current context will be used.</dd>
</dl>
</dl>
<br/>

<dl><dt>

### `filter`
---

</dt>
<dd>

<dl>
<dt><code>(any[], application) => any[]</code></dt>
<dd>Filters the given array using the given application to remove entries that return a false-y result.</dd>
<dt><code>(object, application) => object</code></dt>
<dd>Filters the given object using the given application to remove entries that return a false-y result.</dd>
<dt><code>(any[], application, sort[]) => any[]</code></dt>
<dd>Filters the given array using the given application to remove entries that return a false-y result. The result is then sorted using the given sort array.</dd>
<dt><code>(object, application, sort[]) => object</code></dt>
<dd>Filters the given object using the given application to remove entries that return a false-y result. The result is then sorted using the given sort array.</dd>
<dt><code>(any[], application, sort[], application|application[]) => any[]</code></dt>
<dd>Filters the given array using the given application to remove entries that return a false-y result. The result is then sorted using the given sort array. The result is finally grouped by the final application or array of applications.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `find`
---

</dt>
<dd>

<dl>
<dt><code>(any[], application) => any</code></dt>
<dd>Finds the first element in the given array that matches the given application and returns it.</dd>
<dt><code>(object, application) => any</code></dt>
<dd>Finds the first value in the given object that matches the given application and returns it. The application is passed the value, index, and key of each entry.</dd>
<dt><code>application => any</code> (aggregate)</dt>
<dd>Finds the first element in the current source that matches the given application and returns it.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `first`
---

</dt>
<dd>

<dl>
<dt><code>any[] => any</code></dt>
<dd>Returns the first element in the given array.</dd>
<dt><code>() => any</code> (aggregate)</dt>
<dd>Returns the first element in the current source.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `flatten`
---

</dt>
<dd>

<dl>
<dt><code>any[] => any[]</code> (aggregate)</dt>
<dd>Flattens nested arrays into a single non-nested array.</dd>
<dt><code>(any[], number) => any[]</code> (aggregate)</dt>
<dd>Flattens nested arrays into a single non-nested array, up to as many levels as specified by the second argument.</dd>
</dl>

#### <ins>Options</ins>

<dl>
<dt><code>flat</code></dt><dd>The number of levels of nested arrays to flatten. If this is not supplied or not a number, it defaults to 1.</dd>
</dl>
</dl>
<br/>

<dl><dt>

### `floor`
---

</dt>
<dd>

<dl>
<dt><code>number => number</code></dt>
<dd>Returns the given number rounded down to the nearest integer.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `fmt` (alias `format`)
---

</dt>
<dd>

<dl>
<dt><code>(any, string, ...args) => string</code></dt>
<dd>Applies the named formatted indicated by the second argument string to the given value, passing along any additional arguments to the formatter.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `format` (alias `fmt`)
---

</dt>
<dd>

<dl>
<dt><code>(any, string, ...args) => string</code></dt>
<dd>Applies the named formatted indicated by the second argument string to the given value, passing along any additional arguments to the formatter.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `generate`
---

</dt>
<dd>

<dl>
<dt><code>(application) => any[]</code></dt>
<dd>Calls the given application, aggregating values until the application returns undefined. If the result is an array, the elements of the array are added to the result. If the result is an object matching { value?: any, state?: any }, then the value will be added to the result and the state, if supplied, will replace the state of the generator. Any other value will be added to the result. Each application is passed the state, last value, and index of the call. Each of the arguments is also available a special reference, @state, @last, and @index, respectively. The global defaults for generate have a max property, defaulting to 10000, that limits the number of iterations that can be run to avoid non-terminating generators.</dd>
</dl>

#### <ins>Options</ins>

<dl>
<dt><code>[state]</code></dt><dd>Any options passed to the operator are sent into the initial application as the state.</dd>
</dl>
</dl>
<br/>

<dl><dt>

### `get`
---

</dt>
<dd>

<dl>
<dt><code>(any, string) => any</code></dt>
<dd>Safely retrieves the value at the given path string from the value passed as the first argument.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `group`
---

</dt>
<dd>

<dl>
<dt><code>(any[], application|application[]) => any[]</code></dt>
<dd>Groups the given array using the given application or application array.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `gt` (alias `>`)
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => boolean</code> (binary)</dt>
<dd>Returns true if the first value is greater than the second value.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `gte` (alias `>=`)
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => boolean</code> (binary)</dt>
<dd>Returns true if the first value is greater than or equal to the second value.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `if`
---

</dt>
<dd>

<dl>
<dt><code>(...(boolean, any)) => any</code></dt>
<dd>Lazily evaluates each odd argument and returns the first subsequent even argument when a truthy odd argument is found. If no truthy odd argument is found and there is not a final even argument, the final odd argument is returned.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `ilike`
---

</dt>
<dd>

<dl>
<dt><code>(string, string) => any</code> (binary)</dt>
<dd>Checks to see if the first string matches the second string used as a pattern case insensitively.</dd>
<dt><code>(string[], string) => any</code> (binary)</dt>
<dd>Checks to see if any of the strings in the first argument array matches the second string used as a pattern case insensitively.</dd>
<dt><code>(string, string[]) => any</code> (binary)</dt>
<dd>Checks to see if first string matches any of the second argument strings used as patterns case insensitively.</dd>
<dt><code>(string[], string[]) => any</code> (binary)</dt>
<dd>Checks to see if any of the strings in the first argument array matches any of the second argument strings used as patterns case insensitively.</dd>
</dl>

#### <ins>Options</ins>

<dl>
<dt><code>free</code></dt><dd>Causes the patterns not to be anchored to the start and end of the target string.</dd>
</dl>
</dl>
<br/>

<dl><dt>

### `in`
---

</dt>
<dd>

<dl>
<dt><code>(any, any[]) => boolean</code> (binary)</dt>
<dd>Returns true if the first argument is found in the second argument array using indexOf.</dd>
<dt><code>(any[], any[]) => boolean</code> (binary)</dt>
<dd>Returns true if each entry in the first argument is found in the second argument array using indexOf.</dd>
<dt><code>(application, any[]) => boolean</code> (binary)</dt>
<dd>Returns true if the first argument application returns true for one of the values in the second argument array.</dd>
<dt><code>(application, object) => boolean</code> (binary)</dt>
<dd>Returns true if the first argument application returns true for one of the [value, index, key] tuples in the second argument array.</dd>
<dt><code>(string, string) => boolean</code> (binary)</dt>
<dd>Returns true if the first argument is a substring of the second argument.</dd>
<dt><code>(string|string[], object) => boolean</code> (binary)</dt>
<dd>Returns true if the strings in the first argument are all keys in the given object.</dd>
<dt><code>(date, daterange) => boolean</code> (binary)</dt>
<dd>Returns true if the first argument is a falls within the second argument range.</dd>
<dt><code>(number, range) => boolean</code> (binary)</dt>
<dd>Returns true if the first argument is a falls within the second argument range.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `index`
---

</dt>
<dd>

<dl>
<dt><code>(array, application) => object</code> (aggregate)</dt>
<dd>Returns a map of the given array keyed on the result of the application. If the application returns a tuple, the values in the map will be the second value in the tuple and the keys will be the first. If the key portion of the tuple is an array, the value will be set for each key in the keys array. If the application returns an empty tuple, the value in the array will be omitted from the result. The value may also be an object with a "key" or "keys" key and, optionally, a "value" key. The value may also be an object with a "many" key with an array value of multiple entries of any of the previous types to be added to the map.</dd>
</dl>

#### <ins>Options</ins>

<dl>
<dt><code>many</code></dt><dd>If enabled, the values in the map will be arrays aggregating all of the values with the same key. Otherwise, the last entry for a key will be the value for that key in the map.</dd>
</dl>
</dl>
<br/>

<dl><dt>

### `inspect`
---

</dt>
<dd>

<dl>
<dt><code>(any) => schema</code></dt>
<dd>Inspects the given value and returns a schema based on its contents.</dd>
</dl>

#### <ins>Options</ins>

<dl>
<dt><code>mode</code></dt><dd>If set to 'schema' the result will be unparsed into a schema literal.</dd><dt><code>flat</code></dt><dd>If enabled, deeply introspect objects to include nested types in the schema.</dd>
</dl>
</dl>
<br/>

<dl><dt>

### `intdiv` (alias `/%`)
---

</dt>
<dd>

<dl>
<dt><code>...any => number</code> (binary)</dt>
<dd>Divides the given values with integer division starting with the first.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `intersect`
---

</dt>
<dd>

<dl>
<dt><code>(any[], any[]) => any[]</code></dt>
<dd>Returns the intersection of the two given arrays with no duplicates.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `interval`
---

</dt>
<dd>

<dl>
<dt><code>string => interval</code></dt>
<dd>Parses the given string as an interval.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `is` (alias `==`)
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => boolean</code> (binary)</dt>
<dd>Returns true if the given values are equal (not strict).</dd>
<dt><code>(any, schema) => boolean</code> (binary)</dt>
<dd>(Only applies to the 'is' alias) Returns true if the given value loosely conforms to the given schema.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `is-not` (alias `!=`)
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => boolean</code> (binary)</dt>
<dd>Returns true if the given values are not equal (not strict).</dd>
<dt><code>(any, schema) => boolean</code> (binary)</dt>
<dd>(Only applies to the 'is-not' alias) Returns true if the given value does not loosely conform to the given schema.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `join`
---

</dt>
<dd>

<dl>
<dt><code>(any[], string) => string</code></dt>
<dd>Joins all of the elements in the given array with the given string.</dd>
<dt><code>(any[], application, string) => string</code></dt>
<dd>Joins all of the results of the given application of each element in the given array with the given string.</dd>
<dt><code>(any[], string, string) => string</code></dt>
<dd>Joins all of the elements in the given array with the given string. The last element is appended using the final string if there are more than two elements.</dd>
<dt><code>(any[], application, string, string) => string</code></dt>
<dd>Joins all of the results of the given application of each element in the given array with the given string. The last element is appended using the final string if there are more than two elements.</dd>
<dt><code>(any[], string, string, string) => string</code></dt>
<dd>Joins all of the elements in the given array with the given string. The elements are joined using the final string if there are only two elements. The last element is appended using the second string if there are more than two elements.</dd>
<dt><code>(any[], application, string, string, string) => string</code></dt>
<dd>Joins all of the results of the given application of each element in the given array with the given string. The elements are joined using the final string if there are only two elements. The last element is appended using the second string if there are more than two elements.</dd>
<dt><code>string => string</code> (aggregate)</dt>
<dd>Joins all of the elements in the current source with the given string.</dd>
<dt><code>(application, string) => string</code> (aggregate)</dt>
<dd>Joins all of the results of the given application of each element in the current source with the given string.</dd>
<dt><code>(string, string) => string</code> (aggregate)</dt>
<dd>Joins all of the elements in the current source with the given string. The last element is appended using the final string if there are more than two elements.</dd>
<dt><code>(application, string, string) => string</code> (aggregate)</dt>
<dd>Joins all of the results of the given application of each element in the current source with the given string. The last element is appended using the final string if there are more than two elements.</dd>
<dt><code>(string, string, string) => string</code> (aggregate)</dt>
<dd>Joins all of the elements in the current source with the given string. The elements are joined with the final string if there are only two elements. The last element is appended using the second string if there are more than two elements.</dd>
<dt><code>(application, string, string, string) => string</code> (aggregate)</dt>
<dd>Joins all of the results of the given application of each element in the current source with the given string. The elements are joined with the final string if there are only two elements. The last element is appended using the second string if there are more than two elements.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `keys`
---

</dt>
<dd>

<dl>
<dt><code>object => string[]</code></dt>
<dd>Returns an array of all of the keys in the given object.</dd>
<dt><code>(object, true) => string[]</code></dt>
<dd>Returns an array of all of the keys in the given object, including any from the prototype chain.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `label-diff`
---

</dt>
<dd>

<dl>
<dt><code>(Diff, LabelMap) => Diff</code></dt>
<dd>Takes the given diff and label map and swaps out paths in the diff for labels in the map. The label map is a nested object with the keys being single key paths in the diff and the values being a label or tuple of a label and label map for nested sub structures.</dd>
<dd>e.g. <code>label-diff(d { foo:[:Company { bar::Address }] }) where d = { :foo.bar: [:street :avenue] } will result in { "Company Address": [:street :avenue] }</code></dd>
</dl>

#### <ins>Options</ins>

<dl>
<dt><code>omit</code></dt><dd>Remove any unlabelled diff entries from the output.</dd>
</dl>
</dl>
<br/>

<dl><dt>

### `last`
---

</dt>
<dd>

<dl>
<dt><code>any[] => any</code></dt>
<dd>Returns the last element in the given array.</dd>
<dt><code>() => any</code> (aggregate)</dt>
<dd>Returns the last element in the current source.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `len` (alias `length`)
---

</dt>
<dd>

<dl>
<dt><code>any => number</code></dt>
<dd>Returns the length of the given value or 0 if it has none.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `length` (alias `len`)
---

</dt>
<dd>

<dl>
<dt><code>any => number</code></dt>
<dd>Returns the length of the given value or 0 if it has none.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `let`
---

</dt>
<dd>

<dl>
<dt><code>(string, any) => interval</code></dt>
<dd>Sets the local value specified by the given path in the first argument the value supplied as the second argument and returns the value that was replaced, if any.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `like`
---

</dt>
<dd>

<dl>
<dt><code>(string, string) => any</code> (binary)</dt>
<dd>Checks to see if the first string matches the second string used as a pattern case sensitively.</dd>
<dt><code>(string[], string) => any</code> (binary)</dt>
<dd>Checks to see if any of the strings in the first argument array matches the second string used as a pattern case sensitively.</dd>
<dt><code>(string, string[]) => any</code> (binary)</dt>
<dd>Checks to see if first string matches any of the second argument strings used as patterns case sensitively.</dd>
<dt><code>(string[], string[]) => any</code> (binary)</dt>
<dd>Checks to see if any of the strings in the first argument array matches any of the second argument strings used as patterns case sensitively.</dd>
</dl>

#### <ins>Options</ins>

<dl>
<dt><code>free</code></dt><dd>Causes the patterns not to be anchored to the start and end of the target string.</dd>
</dl>
</dl>
<br/>

<dl><dt>

### `lower`
---

</dt>
<dd>

<dl>
<dt><code>string => string</code></dt>
<dd>Returns the given string in lower case.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `lt` (alias `<`)
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => boolean</code> (binary)</dt>
<dd>Returns true if the first value is less than the second.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `lte` (alias `<=`)
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => boolean</code> (binary)</dt>
<dd>Returns true if the first value is less than or equal to the second.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `map`
---

</dt>
<dd>

<dl>
<dt><code>(any[], application) => any[]</code></dt>
<dd>Applies the given application to each element in the given array and returns an array containing the results.</dd>
<dt><code>application => any[]</code></dt>
<dd>Applies the given application to each element in the current source and returns an array containing the results.</dd>
<dt><code>(object, application) => object</code></dt>
<dd>Applies the given application to each [value, index, key] tuple in the given object and returns an object containing the results. If the application return a null, that entry will be left out of the result. If it returns a 2-tuple with a string as the first entry, the result will replace that entry. Otherwise, the entry will have its value replaced with the result of the application.</dd>
</dl>

#### <ins>Options</ins>

<dl>
<dt><code>array</code></dt><dd>When truthy for an object map call, this will cause the result to be the array of application results rather than an object. The application in this case should only return result values.</dd><dt><code>entries</code></dt><dd>When truthy for an object map call, this will cause the result to be the array of resulting application entries rather than an object. The same handling for object entries still applies to this option as the operation without it.</dd><dt><code>flat</code></dt><dd>When applied to an array or an object call that results in an array, this will cause the array to be flattened up to the level specified by the value of the option. If the value is not a number but still truthy, the number defaults to 1.</dd>
</dl>
</dl>
<br/>

<dl><dt>

### `max`
---

</dt>
<dd>

<dl>
<dt><code>() => number</code> (aggregate)</dt>
<dd>Returns the largest entry in the current source.</dd>
<dt><code>number[] => number</code></dt>
<dd>Returns the largest entry in the given array of numbers.</dd>
<dt><code>(any[], application) => number</code></dt>
<dd>Returns the largest entry in the applications for the given array of values.</dd>
<dt><code>application => number</code> (aggregate)</dt>
<dd>Returns the largest entry in the applications for the current source.</dd>
<dt><code>...number => number</code></dt>
<dd>Returns the largest entry in the given list of number arguments. If no arguments are given the result will be 0.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `min`
---

</dt>
<dd>

<dl>
<dt><code>() => number</code> (aggregate)</dt>
<dd>Returns the smallest entry in the current source.</dd>
<dt><code>number[] => number</code></dt>
<dd>Returns the smallest entry in the given array of numbers.</dd>
<dt><code>(any[], application) => number</code></dt>
<dd>Returns the smallest entry in the applications for the given array of values.</dd>
<dt><code>application => number</code> (aggregate)</dt>
<dd>Returns the smallest entry in the applications for the current source.</dd>
<dt><code>...number => number</code></dt>
<dd>Returns the smallest entry in the given list of number arguments. If no arguments are given the result will be 0.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `modulus` (alias `%`)
---

</dt>
<dd>

<dl>
<dt><code>...any => number</code> (binary)</dt>
<dd>Returns the modulus of the given values starting with the first.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `multiply` (alias `*`)
---

</dt>
<dd>

<dl>
<dt><code>...number => number</code> (binary)</dt>
<dd>Multiplies the given values starting with the first.</dd>
<dt><code>(string, number) => string</code> (binary)</dt>
<dd>Returns the given string copied number times.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `not`
---

</dt>
<dd>

<dl>
<dt><code>any => boolean</code> (unary)</dt>
<dd>Negates the truthiness of the given value.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `not-ilike`
---

</dt>
<dd>

<dl>
<dt><code>(string, string) => any</code> (binary)</dt>
<dd>Checks to see if the first string does not match the second string used as a pattern case insensitively.</dd>
<dt><code>(string[], string) => any</code> (binary)</dt>
<dd>Checks to see if all of the strings in the first argument array do not match the second string used as a pattern case insensitively.</dd>
<dt><code>(string, string[]) => any</code> (binary)</dt>
<dd>Checks to see if first string does not match any of the second argument strings used as patterns case insensitively.</dd>
<dt><code>(string[], string[]) => any</code> (binary)</dt>
<dd>Checks to see if all of the strings in the first argument array do not match any of the second argument strings used as patterns case insensitively.</dd>
</dl>

#### <ins>Options</ins>

<dl>
<dt><code>free</code></dt><dd>Causes the patterns not to be anchored to the start and end of the target string.</dd>
</dl>
</dl>
<br/>

<dl><dt>

### `not-in`
---

</dt>
<dd>

<dl>
<dt><code>(any, any[]) => boolean</code> (binary)</dt>
<dd>Returns false if the first argument is found in the second argument array using indexOf.</dd>
<dt><code>(any[], any[]) => boolean</code> (binary)</dt>
<dd>Returns false if each entry in the first argument is found in the second argument array using indexOf.</dd>
<dt><code>(application, any[]) => boolean</code> (binary)</dt>
<dd>Returns false if the first argument application returns true for one of the values in the second argument array.</dd>
<dt><code>(application, object) => boolean</code> (binary)</dt>
<dd>Returns false if the first argument application returns true for one of the [value, index, key] tuples in the second argument array.</dd>
<dt><code>(string, string) => boolean</code> (binary)</dt>
<dd>Returns false if the first argument is a substring of the second argument.</dd>
<dt><code>(string|string[], object) => boolean</code> (binary)</dt>
<dd>Returns false if the strings in the first argument are all keys in the given object.</dd>
<dt><code>(date, daterange) => boolean</code> (binary)</dt>
<dd>Returns false if the first argument is a falls within the second argument range.</dd>
<dt><code>(number, range) => boolean</code> (binary)</dt>
<dd>Returns false if the first argument is a falls within the second argument range.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `not-like`
---

</dt>
<dd>

<dl>
<dt><code>(string, string) => any</code> (binary)</dt>
<dd>Checks to see if the first string does not match the second string used as a pattern case sensitively.</dd>
<dt><code>(string[], string) => any</code> (binary)</dt>
<dd>Checks to see if all of the strings in the first argument array do not match the second string used as a pattern case sensitively.</dd>
<dt><code>(string, string[]) => any</code> (binary)</dt>
<dd>Checks to see if first string does not match any of the second argument strings used as patterns case sensitively.</dd>
<dt><code>(string[], string[]) => any</code> (binary)</dt>
<dd>Checks to see if all of the strings in the first argument array do not match any of the second argument strings used as patterns case sensitively.</dd>
</dl>

#### <ins>Options</ins>

<dl>
<dt><code>free</code></dt><dd>Causes the patterns not to be anchored to the start and end of the target string.</dd>
</dl>
</dl>
<br/>

<dl><dt>

### `nth`
---

</dt>
<dd>

<dl>
<dt><code>(any[], number) => any</code></dt>
<dd>Returns the nth item in the given array using a 1-based index. If the number is negative, the offset is from the end rather than the beginning.</dd>
<dt><code>number => any</code> (aggregate)</dt>
<dd>Returns the nth item in the current source using a 1-based index. If the number is negative, the offset is from the end rather than the beginning.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `num`
---

</dt>
<dd>

<dl>
<dt><code>string => number</code></dt>
<dd>Returns the first positive number found in the string, including an optional decimal.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `object`
---

</dt>
<dd>

<dl>
<dt><code>(...(string, any)) => object</code></dt>
<dd>Returns an object assembled from the arguments where each odd argument is a key and the subsequent even argument is its value.</dd>
<dd>e.g. <code>object(:key1 99 :key2 73)</code></dd>
</dl>

</dl>
<br/>

<dl><dt>

### `or` (alias `||`)
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => any</code> (binary)</dt>
<dd>Lazily evaluates its arguments and returns the first truthy value or `false` if there aren't any.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `overlap`
---

</dt>
<dd>

<dl>
<dt><code>(string, string, number = 0.5) => string</code></dt>
<dd>Returns the first overlapping substring within the two given strings that is at least the given percentage of the smallest string's length long using the similar operator.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `pad`
---

</dt>
<dd>

<dl>
<dt><code>(string, number) => string</code></dt>
<dd>Pads the given string with spaces at both ends such that it is at least the given number of characters long.</dd>
<dt><code>(string, number, string) => string</code></dt>
<dd>Pads the given string with the final string at both ends such that it is at least the given number of characters long.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `padl`
---

</dt>
<dd>

<dl>
<dt><code>(string, number) => string</code></dt>
<dd>Pads the given string with spaces at the beginning such that it is at least the given number of characters long.</dd>
<dt><code>(string, number, string) => string</code></dt>
<dd>Pads the given string with the final string at the beginning such that it is at least the given number of characters long.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `padr`
---

</dt>
<dd>

<dl>
<dt><code>(string, number) => string</code></dt>
<dd>Pads the given string with spaces at the end such that it is at least the given number of characters long.</dd>
<dt><code>(string, number, string) => string</code></dt>
<dd>Pads the given string with the final string at the end such that it is at least the given number of characters long.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `parse`
---

</dt>
<dd>

<dl>
<dt><code>string => any</code></dt>
<dd>Parses the given string using the expression parser.</dd>
</dl>

#### <ins>Options</ins>

<dl>
<dt><code>date</code></dt><dd>Use the date parser rather than the expression parser.</dd><dt><code>template</code></dt><dd>Use the template parser rather than the expression parser.</dd><dt><code>time</code></dt><dd>Use the time parser rather than the expression parser.</dd><dt><code>schema</code></dt><dd>Use the schema parser rather than the expression parser.</dd><dt><code>base64</code></dt><dd>Use a base64 parser to decode a base64 encoded string.</dd><dt><code>xml</code></dt><dd>Use the XML parser to read data. Properties and children are equivalent. Duplicate names result in all of the duplicate values being aggregated into an array rather than last in winning.</dd><dt><code>strict</code></dt><dd>For the XML parser, be less forgiving about malformed content. Defaults to false.</dd><dt><code>csv</code></dt><dd>Use the delimited text parser rather than the expression parser.</dd><dt><code>detect</code></dt><dd>If using the delimited parser, detect the delimiters and use them to parse.</dd><dt><code>header</code></dt><dd>If using the delimited parser, treat the first result as a header and use it to build objects with field names based on the header.</dd><dt><code>field</code></dt><dd>If using the delimited parser, use the given string as the field delimiter.</dd><dt><code>record</code></dt><dd>If using the delimited parser, use the given string as the record delimiter.</dd><dt><code>quote</code></dt><dd>If using the delimited parser, use the given string as the field quote.</dd>
</dl>
</dl>
<br/>

<dl><dt>

### `pipe`
---

</dt>
<dd>

<dl>
<dt><code>...any => any</code></dt>
<dd>This is a special built-in operator that evaluates its first argument, supplies that as an input to the next argument, supplies that result as an input to the next argument, and so on until the result of the last argument evaluation is returned. If any argument is an operation that does not reference `@pipe` or `_` as one of its arguments, then `@pipe` will be added as the first argument of that operation. Arguments that are applications are automatically applied with the piped value.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `pow` (alias `**`)
---

</dt>
<dd>

<dl>
<dt><code>...number => number</code> (binary)</dt>
<dd>Applies exponentiation to the given arguments with right associativity.</dd>
<dd>e.g. <code>(** 1 2 3) is 1^(2^3)</code></dd>
</dl>

</dl>
<br/>

<dl><dt>

### `rand` (alias `random`)
---

</dt>
<dd>

<dl>
<dt><code>() => number</code></dt>
<dd>Returns a random floating point number between 0 and 1, inclusive.</dd>
<dt><code>number => number</code></dt>
<dd>Returns a random integer between 1 and the given number, inclusive.</dd>
<dt><code>(number, true) => number</code></dt>
<dd>Returns a random floating point number between 1 and the given number, inclusive.</dd>
<dt><code>(number, number) => number</code></dt>
<dd>Returns a random integer between the given numbers, inclusive.</dd>
<dt><code>(number, number, true) => number</code></dt>
<dd>Returns a random floating point number between the given numbers, inclusive.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `random` (alias `rand`)
---

</dt>
<dd>

<dl>
<dt><code>() => number</code></dt>
<dd>Returns a random floating point number between 0 and 1, inclusive.</dd>
<dt><code>number => number</code></dt>
<dd>Returns a random integer between 1 and the given number, inclusive.</dd>
<dt><code>(number, true) => number</code></dt>
<dd>Returns a random floating point number between 1 and the given number, inclusive.</dd>
<dt><code>(number, number) => number</code></dt>
<dd>Returns a random integer between the given numbers, inclusive.</dd>
<dt><code>(number, number, true) => number</code></dt>
<dd>Returns a random floating point number between the given numbers, inclusive.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `reduce`
---

</dt>
<dd>

<dl>
<dt><code>(any[], application, any) => any</code></dt>
<dd>Folds the given array into the final argument value by passing each element in the given array into the application with the result of the last application (or the final argument for the first iteration) and returns the result of the final application.</dd>
<dt><code>(application, any) => any</code> (aggregate)</dt>
<dd>Folds the current source into the final argument value by passing each element in the current source into the application with the result of the last application (or the final argument for the first iteration) and returns the result of the final application.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `replace`
---

</dt>
<dd>

<dl>
<dt><code>(string, string, string) => string</code></dt>
<dd>Replaces the first instance of the second string found in the first string with the third string.</dd>
<dt><code>(string, string, string, string) => string</code></dt>
<dd>Replaces the first instance of a regular expression constructed with the seconds string as the expression and the fourth string as the flags, which may be empty, found in the first string with the third string.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `replace-all`
---

</dt>
<dd>

<dl>
<dt><code>(string, string, string) => string</code></dt>
<dd>Replaces all instances of the second string found in the first string with the third string.</dd>
<dt><code>(string, string, string, string) => string</code></dt>
<dd>Replaces all instances of a regular expression constructed with the seconds string as the expression and the fourth string as the flags, which may be empty, found in the first string with the third string.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `reverse`
---

</dt>
<dd>

<dl>
<dt><code>string => string</code></dt>
<dd>Reverses the given string.</dd>
<dt><code>any[] => any[]</code></dt>
<dd>Reverses the given array.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `round`
---

</dt>
<dd>

__NOTE:__ By default, the single-number signature will round to an integer, but if the round defaults are updated to include all-numeric as true, then it will return numbers rounded to the nearest default place. Round defaults are { places:2 all-numeric:false method::half-even }.

<dl>
<dt><code>number => number</code></dt>
<dd>Rounds the given number to the nearest integer.</dd>
<dt><code>(number, number, string) => number</code></dt>
<dd>Rounds the given number to the nearest decimal specified by the second number using the method specified by the string, defaulting to half-even. Supported methods are half-up, half-down, to-0, from-0, half-even, and half-odd. If the number of places negative, the number will be rounded left from the decimal point.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `set`
---

</dt>
<dd>

<dl>
<dt><code>(string, any) => interval</code></dt>
<dd>Sets the root value specified by the given path in the first argument the value supplied as the second argument and returns the value that was replaced, if any.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `set-defaults`
---

</dt>
<dd>

<dl>
<dt><code>('format', string) => any</code></dt>
<dd>Sets the defaults for the given named formatter. Defaults should be passed in as named options that depend on the decorator.</dd>
<dt><code>('round') => any</code></dt>
<dd>Sets the defaults for rounding operations. Defaults should be passed in as named options, which can be places, all-numeric, and method.</dd>
<dt><code>('generate') => any</code></dt>
<dd>Sets the defaults for generate operations. Defaults should be passed in as named options, which can be max. The default max is 10000.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `similar`
---

</dt>
<dd>

<dl>
<dt><code>(string, string, number = 0.5, number = 2) => [string, string, number]</code></dt>
<dd>Finds the first similar substrings within the two given strings based on a threshhold (3rd argument, defaults to 50%) and fudge factor (4th argument, defaults to 2). The two similar substrings are returned in a tuple with the similarity percentage.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `similarity`
---

</dt>
<dd>

<dl>
<dt><code>(string, string, number = 0.5, number = 2) => [string, string, number]</code></dt>
<dd>Finds the similarity percentage of the first similar substrings within the two given strings using the similar operator.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `slice` (alias `substr`)
---

</dt>
<dd>

<dl>
<dt><code>any[] => any[]</code></dt>
<dd>Returns a copy of the given array.</dd>
<dt><code>(any[], number) => any[]</code></dt>
<dd>Returns a copy of the given array starting from the element at the given index.</dd>
<dt><code>(any[], number, number) => any[]</code></dt>
<dd>Returns a copy of the given array starting from the element at the given index and ending immediately before the final given index. If the final index is negative, it is an offset from the end of the array.</dd>
<dt><code>(string, number) => string</code></dt>
<dd>Returns a substring of the given string starting from the character at the given index.</dd>
<dt><code>(string, number, number) => any[]</code></dt>
<dd>Returns a substring of the given string starting from the character at the given index and ending immediately before the final given index. If the final index is negative, it is an offset from the end of the string.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `sort`
---

</dt>
<dd>

<dl>
<dt><code>(any[], sort[]) => any[]</code></dt>
<dd>Sorts the given array using the given sort array. Any array elements that are strings may indicate direction with a leading + or - for ascending and descending, respectively. The remainder of the string is parsed and used as an application. Any array elements that are applications are applied directly to get a comparison value. Any arguments that are objects may include a by key with an application value along with asc, desc, or dir flags. If no sorts are provided, an identity sort will be applied.</dd>
<dt><code>(object, sort[]) => object</code></dt>
<dd>Sorts the given object keys using the given sort array. Any array elements that are strings may indicate direction with a leading + or - for ascending and descending, respectively. The remainder of the string is parsed and used as an application. Any array elements that are applications are applied directly to get a comparison value. Any arguments that are objects may include a by key with an application value along with asc, desc, or dir flags. If no sorts are provided, an identity sort will be applied to the keys.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `source`
---

</dt>
<dd>

<dl>
<dt><code>any => DataSet</code></dt>
<dd>Creates a DataSet from the given value, or returns the value if it is already a DataSet.</dd>
<dt><code>(any, application) => any</code></dt>
<dd>Creates a DateSet from the given value if it is not already a DataSet, and then sets that as the @source to call the given application. The result of the application is returned.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `split`
---

</dt>
<dd>

<dl>
<dt><code>string => string[]</code></dt>
<dd>Splits the given string into an array containing each of its characters.</dd>
<dt><code>(string, string) => string[]</code></dt>
<dd>Splits the given string into an array containing substrings delimited by the second argument.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `strict-is`
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => boolean</code> (binary)</dt>
<dd>Returns true if the two arguments are the same literal value or are pointers to the same object.</dd>
<dt><code>(any, schema) => boolean</code> (binary)</dt>
<dd>(Only applies to the 'strict-is' alias) Returns true if the given value strictly conforms to the given schema.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `strict-is-not`
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => boolean</code> (binary)</dt>
<dd>Returns false if the two arguments are the same literal value or are pointers to the same object.</dd>
<dt><code>(any, schema) => boolean</code> (binary)</dt>
<dd>(Only applies to the 'strict-is-not' alias) Returns true if the given value does not strictly conform to the given schema.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `string`
---

</dt>
<dd>

<dl>
<dt><code>any => string</code></dt>
<dd>Politely stringifies the given value, meaning that there are no undefined, null, or object prototype values strings returned.</dd>
</dl>

#### <ins>Options</ins>

<dl>
<dt><code>json</code></dt><dd>Forces the output string to be JSON.</dd><dt><code>raport</code></dt><dd>Forces the output string to be a raport expresion. This can be paired with any options to the stringify function supplied by raport.</dd><dt><code>string</code></dt><dd>Processes the value as a styled string.</dd>
</dl>
</dl>
<br/>

<dl><dt>

### `substr` (alias `slice`)
---

</dt>
<dd>

<dl>
<dt><code>any[] => any[]</code></dt>
<dd>Returns a copy of the given array.</dd>
<dt><code>(any[], number) => any[]</code></dt>
<dd>Returns a copy of the given array starting from the element at the given index.</dd>
<dt><code>(any[], number, number) => any[]</code></dt>
<dd>Returns a copy of the given array starting from the element at the given index and ending immediately before the final given index. If the final index is negative, it is an offset from the end of the array.</dd>
<dt><code>(string, number) => string</code></dt>
<dd>Returns a substring of the given string starting from the character at the given index.</dd>
<dt><code>(string, number, number) => any[]</code></dt>
<dd>Returns a substring of the given string starting from the character at the given index and ending immediately before the final given index. If the final index is negative, it is an offset from the end of the string.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `subtract` (alias `-`)
---

</dt>
<dd>

<dl>
<dt><code>...any => number</code> (binary)</dt>
<dd>Subtracts the given values as numbers starting with the first.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `sum`
---

</dt>
<dd>

<dl>
<dt><code>() => number</code> (aggregate)</dt>
<dd>Computes the sum of the current source.</dd>
<dt><code>number[] => number</code></dt>
<dd>Computes the sum of the given array of numbers.</dd>
<dt><code>(any[], application) => number</code></dt>
<dd>Computes the sum of the applications for the given array of values.</dd>
<dt><code>application => number</code> (aggregate)</dt>
<dd>Computes the sum of the applications for the current source.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `switch` (alias `case`)
---

</dt>
<dd>

<dl>
<dt><code>(any, ...(any|application, any)) => any</code></dt>
<dd>Evaluates its first argument and uses it as a basis for comparison for each subsequent pair of arguments, called matchers. The first value in a matcher is used for the comparison, and the second value is returned if the comparison holds. If the matcher first value is an application, the matcher matches if the application returns a truthy value when given the basis value. If the matcher first value is a value, the matcher matches if the first value and the basis value are loosely equal. The basis value is available as @case or the shorthand _ in each matcher.</dd>
<dd>e.g. <code>case 1+1 when 1 then :nope when =>4 - _ == _ then :yep else :other end</code></dd>
<dd>e.g. <code>case(1+1 1 :nope =>4 - _ == _ :yep :other)</code></dd>
</dl>

</dl>
<br/>

<dl><dt>

### `time-span` (alias `time-span-ms`)
---

</dt>
<dd>

__NOTE:__ If there's no way to get an accurate result from the given timespan e.g. you want years or months from a span specified in ms, approximations will be used. The approximations are 365.25 days in a year and 30.45 days in a month.

<dl>
<dt><code>number => number[]</code></dt>
<dd>Returns an array of time units based on options given that represent the number of milliseconds passed as the first argument.</dd>
<dt><code>(date, date) => number[]</code></dt>
<dd>Returns an array of time units based on options given that represent the distance between the two dates.</dd>
<dt><code>timespan => number[]</code></dt>
<dd>Returns an array of time units based on options given that represent the distance between the start and end of the given timespan.</dd>
</dl>

#### <ins>Options</ins>

<dl>
<dt><code>unit</code></dt><dd>The units desired in the result. This can be either a string or array of strings with the units represented by [y]ears, [M|mo]nths, [w]eeks, [d]ays, [h]ours, [m|mm]inutes, [s]econds, [ms] where 'M' will get months and 'mm' or 'm' not followed by an 'o' will get minutes. The string form can only be used for unambiguous single character units. Units must be specified in descending order by size.</dd><dt><code>string</code></dt><dd>Causes the output to be a string rather than an array.</dd><dt><code>round</code></dt><dd>Determines how the results should be rounded. By default they are 'floor'ed, but this can also be 'ceil' or 'round'. Rounding is done based on the next largest available unit after the smallest requiested unit e.g. hours if days are requested last or months if years are the only requested unit.</dd>
</dl>
</dl>
<br/>

<dl><dt>

### `time-span-ms` (alias `time-span`)
---

</dt>
<dd>

__NOTE:__ If there's no way to get an accurate result from the given timespan e.g. you want years or months from a span specified in ms, approximations will be used. The approximations are 365.25 days in a year and 30.45 days in a month.

<dl>
<dt><code>number => number[]</code></dt>
<dd>Returns an array of time units based on options given that represent the number of milliseconds passed as the first argument.</dd>
<dt><code>(date, date) => number[]</code></dt>
<dd>Returns an array of time units based on options given that represent the distance between the two dates.</dd>
<dt><code>timespan => number[]</code></dt>
<dd>Returns an array of time units based on options given that represent the distance between the start and end of the given timespan.</dd>
</dl>

#### <ins>Options</ins>

<dl>
<dt><code>unit</code></dt><dd>The units desired in the result. This can be either a string or array of strings with the units represented by [y]ears, [M|mo]nths, [w]eeks, [d]ays, [h]ours, [m|mm]inutes, [s]econds, [ms] where 'M' will get months and 'mm' or 'm' not followed by an 'o' will get minutes. The string form can only be used for unambiguous single character units. Units must be specified in descending order by size.</dd><dt><code>string</code></dt><dd>Causes the output to be a string rather than an array.</dd><dt><code>round</code></dt><dd>Determines how the results should be rounded. By default they are 'floor'ed, but this can also be 'ceil' or 'round'. Rounding is done based on the next largest available unit after the smallest requiested unit e.g. hours if days are requested last or months if years are the only requested unit.</dd>
</dl>
</dl>
<br/>

<dl><dt>

### `trim`
---

</dt>
<dd>

<dl>
<dt><code>string => string</code></dt>
<dd>Trims whitespace from both ends of the given string.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `triml`
---

</dt>
<dd>

<dl>
<dt><code>string => string</code></dt>
<dd>Trims whitespace from the beginning of the given string.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `trimr`
---

</dt>
<dd>

<dl>
<dt><code>string => string</code></dt>
<dd>Trims whitespace from the end of the given string.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `unique`
---

</dt>
<dd>

<dl>
<dt><code>any[] => any[]</code></dt>
<dd>Returns a copy of the given array with no duplicate elements.</dd>
<dt><code>() => any[]</code> (aggregate)</dt>
<dd>Returns a copy of the current source with no duplicate elements.</dd>
<dt><code>(any[], application) => any[]</code></dt>
<dd>Returns a copy of the given array with no duplicate application results.</dd>
<dt><code>application => any[]</code> (aggregate)</dt>
<dd>Returns a copy of the current source with no duplicate application results.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `unique-map`
---

</dt>
<dd>

<dl>
<dt><code>(any[], application) => any[]</code></dt>
<dd>Returns an array of application results from the given array with no duplicate elements.</dd>
<dt><code>application => any[]</code> (aggregate)</dt>
<dd>Returns an array of application results of the current source with no duplicate elements.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `unless`
---

</dt>
<dd>

<dl>
<dt><code>(...(boolean, any)) => any</code></dt>
<dd>Lazily evaluates each odd argument and returns the first subsequent even argument when a false-y odd argument is found. If no false-y odd argument is found and there is not a final even argument, the final odd argument is returned.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `unparse`
---

</dt>
<dd>

<dl>
<dt><code>any => string</code></dt>
<dd>Stringifies the given value as a raport expression.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `upper`
---

</dt>
<dd>

<dl>
<dt><code>string => string</code></dt>
<dd>Converts the given string to upper case.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `valid`
---

</dt>
<dd>

<dl>
<dt><code>(any, schema) => boolean</code></dt>
<dd>Returns true if the given value validates against the given schema.</dd>
</dl>

#### <ins>Options</ins>

<dl>
<dt><code>strict</code></dt><dd>Validate in strict mode rather than the default loose mode.</dd><dt><code>mode</code></dt><dd>Sets the mode of validation e.g. strict or loose or missing.</dd>
</dl>
</dl>
<br/>

<dl><dt>

### `validate`
---

</dt>
<dd>

__NOTE:__ The schema of an error is @[{ error: string; type?: 'strict'; path?: string; actual?: string; expected?: string; value?: any }]. If the error is the result of a strict check, the type will be set to 'strict'. The path is the keypath from the root of the given value to the piece of data that caused the error. Missing mode requires that any referenced named types be declared. Strict mode additionally requires that there be no unspecified properties in objects and tuples.

<dl>
<dt><code>(any, schema) => true|error[]</code></dt>
<dd>Returns true if the given value validates against the given schema or an array of errors if it does not.</dd>
</dl>

#### <ins>Options</ins>

<dl>
<dt><code>strict</code></dt><dd>Validate in strict mode rather than the default loose mode.</dd><dt><code>mode</code></dt><dd>Sets the mode of validation e.g. strict or loose or missing.</dd>
</dl>
</dl>
<br/>

<dl><dt>

### `values`
---

</dt>
<dd>

<dl>
<dt><code>object => any[]</code></dt>
<dd>Returns an array of all of the values in the given object.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `with`
---

</dt>
<dd>

<dl>
<dt><code>(object, application) => any</code></dt>
<dd>Evaluates the given application with the given value as the context, returning the result of the application.</dd>
<dt><code>(object, application, any) => any</code></dt>
<dd>Evaluates the given application with the given value as the context, returning the result of the application. If the value is false-y, the final argument is returned instead.</dd>
</dl>

</dl>
<br/>

<dl><dt>

### `wrap-count`
---

</dt>
<dd>

<dl>
<dt><code>string,number?,font?</code></dt>
<dd>Calculates the number of lines that the given string will occupy in the given width in rem using the given font. If the width is not specified, the @widget.width or @placement.availableX will be used. If the font is not specified, the @widget.font will be used. Inherited fonts are not considered.</dd>
</dl>

#### <ins>Options</ins>

<dl>
<dt><code>width</code></dt><dd>A named version of the second positional argument.</dd><dt><code>font</code></dt><dd>A named version of the third positional argument. This is an object with the relevant parts of the interface conforming to { family?:string, size?:number, line?:number, metric?: number }. family defaults to "sans", size defaults to 0.83, line defaults to size, and metric defaults to the constant pixel width of the font at 16px per em e.g. sans: 7.4, serif: 6.7, mono: 7.85, and narrow: 5.9.</dd><dt><code>family</code></dt><dd>Overrides the given font family.</dd><dt><code>size</code></dt><dd>Overrides the given font size.</dd><dt><code>line</code></dt><dd>Overrides the given font line height.</dd><dt><code>metric</code></dt><dd>Overrides the given font metric.</dd><dt><code>break-word</code></dt><dd>Determines whether words that exceed the width should be broken, defaulting to true.</dd>
</dl>
</dl>
<br/>

<dl><dt>

### `||` (alias `or`)
---

</dt>
<dd>

<dl>
<dt><code>(any, any) => any</code> (binary)</dt>
<dd>Lazily evaluates its arguments and returns the first truthy value or `false` if there aren't any.</dd>
</dl>

</dl>
<br/>



## Formats

<dl><dt>

### `[operator]`
---

</dt>
<dd>

Calls the named operator as a formatter, passing the target value as the first argument with any arguments to the formatter following. Any set defaults for the formatter are passed as options to the operator.


</dd></dl>
<br/>

<dl><dt>

### `base`
---

</dt>
<dd>

Converts the given number to the given base

<dl><dt>

#### <ins>Options</ins>

</dt><dd><dl>

<dt><code>base</code> - <code>number</code></dt><dd>

The target base e.g. 2 or 8 or 16.

</dd>
</dl></dd></dl>
</dd></dl>
<br/>

<dl><dt>

### `base64`
---

</dt>
<dd>

Converts the given value to a base64 encoded string.


</dd></dl>
<br/>

<dl><dt>

### `case`
---

</dt>
<dd>

Change the casing of the value.

<dl><dt>

#### <ins>Options</ins>

</dt><dd><dl>

<dt><code>case</code> - <code>'upper'|'lower'|'snake'|'kebab'|'pascal'|'camel'|'proper'</code></dt><dd>

The case format to use.

</dd>
</dl></dd></dl>
</dd></dl>
<br/>

<dl><dt>

### `date`
---

</dt>
<dd>

Formats the value as a date string using placeholder characters, where repeated characters render more descriptive or padded values. Any non-placeholder characters are rendered as entered. The default format is yyyy-MM-dd. Available placeholders are:

* y - year
* M - month
* d - date
* E - day of week
* H - hour (24 hour)
* h or k - hour (12 hour)
* m - minute
* s - second
* S - millisecond
* a - AM/PM
* z - timezone offset

<dl><dt>

#### <ins>Options</ins>

</dt><dd><dl>

<dt><code>format</code> - <code>string</code></dt><dd>

The format template to apply.

</dd>
</dl></dd></dl>
</dd></dl>
<br/>

<dl><dt>

### `dollar`
---

</dt>
<dd>

Formats the value as a dollar amount with two decimal places by default.

<dl><dt>

#### <ins>Options</ins>

</dt><dd><dl>

<dt><code>dec</code> - <code>number</code></dt><dd>

The number of decimal places to render.

</dd><dt><code>group</code> - <code>string</code></dt><dd>

The string to use as a grouping divider.

</dd><dt><code>sign</code> - <code>string</code></dt><dd>

The currency symbol to render.

</dd><dt><code>neg</code> - <code>'sign'|'wrap'|'both'</code></dt><dd>

How to display negative values. Sign shows a leading minus symbol. Wrap wraps the value in parenteses.

</dd>
</dl></dd></dl>
</dd></dl>
<br/>

<dl><dt>

### `hex`
---

</dt>
<dd>

Formats the given number in hexadecimal, or if the value is not a number, encodes it as string in hexadecimal.


</dd></dl>
<br/>

<dl><dt>

### `int` (alias `integer`)
---

</dt>
<dd>

Formats the value as an integer.

<dl><dt>

#### <ins>Options</ins>

</dt><dd><dl>

<dt><code>group</code> - <code>string</code></dt><dd>

The string to use as a grouping divider.

</dd><dt><code>neg</code> - <code>'sign'|'wrap'|'both'</code></dt><dd>

How to display negative values. Sign shows a leading minus symbol. Wrap wraps the value in parenteses.

</dd>
</dl></dd></dl>
</dd></dl>
<br/>

<dl><dt>

### `integer` (alias `int`)
---

</dt>
<dd>

Formats the value as an integer.

<dl><dt>

#### <ins>Options</ins>

</dt><dd><dl>

<dt><code>group</code> - <code>string</code></dt><dd>

The string to use as a grouping divider.

</dd><dt><code>neg</code> - <code>'sign'|'wrap'|'both'</code></dt><dd>

How to display negative values. Sign shows a leading minus symbol. Wrap wraps the value in parenteses.

</dd>
</dl></dd></dl>
</dd></dl>
<br/>

<dl><dt>

### `iso8601`
---

</dt>
<dd>

Formats the value as an ISO-8601 timestamp.


</dd></dl>
<br/>

<dl><dt>

### `noxml`
---

</dt>
<dd>

Escapes special XML characters so that the value may be safely rendered into xml.


</dd></dl>
<br/>

<dl><dt>

### `num` (alias `number`)
---

</dt>
<dd>

Formats the value as an number.

<dl><dt>

#### <ins>Options</ins>

</dt><dd><dl>

<dt><code>dec</code> - <code>number</code></dt><dd>

The number of decimal places to render.

</dd><dt><code>group</code> - <code>string</code></dt><dd>

The string to use as a grouping divider.

</dd><dt><code>neg</code> - <code>'sign'|'wrap'|'both'</code></dt><dd>

How to display negative values. Sign shows a leading minus symbol. Wrap wraps the value in parenteses.

</dd>
</dl></dd></dl>
</dd></dl>
<br/>

<dl><dt>

### `number` (alias `num`)
---

</dt>
<dd>

Formats the value as an number.

<dl><dt>

#### <ins>Options</ins>

</dt><dd><dl>

<dt><code>dec</code> - <code>number</code></dt><dd>

The number of decimal places to render.

</dd><dt><code>group</code> - <code>string</code></dt><dd>

The string to use as a grouping divider.

</dd><dt><code>neg</code> - <code>'sign'|'wrap'|'both'</code></dt><dd>

How to display negative values. Sign shows a leading minus symbol. Wrap wraps the value in parenteses.

</dd>
</dl></dd></dl>
</dd></dl>
<br/>

<dl><dt>

### `ordinal`
---

</dt>
<dd>

Render the value as an ordinal number.

<dl><dt>

#### <ins>Options</ins>

</dt><dd><dl>

<dt><code>group</code> - <code>string</code></dt><dd>

The string to use as a grouping divider.

</dd>
</dl></dd></dl>
</dd></dl>
<br/>

<dl><dt>

### `phone`
---

</dt>
<dd>

Formats the value as phone number e.g. 111-2222, (111) 222-3333, 1-888-777-6666


</dd></dl>
<br/>

<dl><dt>

### `styled`
---

</dt>
<dd>

Processes the value as a styled string.


</dd></dl>
<br/>

<dl><dt>

### `time`
---

</dt>
<dd>

Formats a date value as a time string using placeholder characters, where repeated characters render more descriptive or padded values. Any non-placeholder characters are rendered as entered. The default format is HH:mm:ss. Available placeholders are:

* y - year
* M - month
* d - date
* E - day of week
* H - hour (24 hour)
* h or k - hour (12 hour)
* m - minute
* s - second
* S - millisecond
* a - AM/PM
* z - timezone offset

<dl><dt>

#### <ins>Options</ins>

</dt><dd><dl>

<dt><code>format</code> - <code>string</code></dt><dd>

The format template to apply.

</dd>
</dl></dd></dl>
</dd></dl>
<br/>

<dl><dt>

### `timestamp`
---

</dt>
<dd>

Formats a date value as a timestamp using placeholder characters, where repeated characters render more descriptive or padded values. Any non-placeholder characters are rendered as entered. The default format is yyyy-MM-dd HH:mm:ss. Available placeholders are:

* y - year
* M - month
* d - date
* E - day of week
* H - hour (24 hour)
* h or k - hour (12 hour)
* m - minute
* s - second
* S - millisecond
* a - AM/PM
* z - timezone offset

<dl><dt>

#### <ins>Options</ins>

</dt><dd><dl>

<dt><code>format</code> - <code>string</code></dt><dd>

The format template to apply.

</dd>
</dl></dd></dl>
</dd></dl>
<br/>

<dl><dt>

### `timestamptz`
---

</dt>
<dd>

Formats a date value as a timestamp with timezone offset using placeholder characters, where repeated characters render more descriptive or padded values. Any non-placeholder characters are rendered as entered. The default format is yyyy-MM-dd HH:mm:sszzz. Available placeholders are:

* y - year
* M - month
* d - date
* E - day of week
* H - hour (24 hour)
* h or k - hour (12 hour)
* m - minute
* s - second
* S - millisecond
* a - AM/PM
* z - timezone offset

<dl><dt>

#### <ins>Options</ins>

</dt><dd><dl>

<dt><code>format</code> - <code>string</code></dt><dd>

The format template to apply.

</dd>
</dl></dd></dl>
</dd></dl>
<br/>

<dl><dt>

### `xml`
---

</dt>
<dd>

Converts the given value to XML if possible.

<dl><dt>

#### <ins>Options</ins>

</dt><dd><dl>

<dt><code>indent</code> - <code>number</code></dt><dd>

Indent each successive set of child nodes with this number of spaces.

</dd>
</dl></dd></dl>
</dd></dl>
<br/>



