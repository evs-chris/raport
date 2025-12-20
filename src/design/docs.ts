export const operators = `[
  { op:['%' 'modulus'] sig:[
    { bin:1 proto:'...any => number' desc:'Returns the modulus of the given values starting with the first.' }
  ]}
  { op:['*' 'multiply'] sig:[
    { bin:1 proto:'...number => number' desc:'Multiplies the given values starting with the first.

If there is context-local rounding set, it will be applied to the result (see set-defaults).' }
    { bin:1 proto:'(string, number) => string' desc:'Returns the given string copied number times if the number is positive.'}
    { bin:1 proto:'(any[], number) => any[]' desc:'Returns the given array concatenated number times if the array has fewer than 1,000 elements and the number is positive and less than 10,000.'}
    { bin:1 proto:'(application, number) => any[]' desc:'Returns an array of the results of the application called once with each index the given y concatenated number times if the array has fewer than 1,000 elements and the number is positive and less than 10,000.'}
  ]}
  { op:['**' 'pow'] sig:[
    { bin:1 proto:'...number => number' desc:'Applies exponentiation to the given arguments with right associativity.

If there is context-local rounding set, it will be applied to the result (see set-defaults).' eg:'(** 1 2 3) is 1^(2^3)'}
  ]}
  { op:['+' 'add'] sig:[
    { bin:1 proto:'...number => number' desc:'Adds the given numbers together.

If there is context-local rounding set, it will be applied to the result (see set-defaults).' }
    { bin:1 proto:'...any => string' desc:'Concatenates the given arguments as strings.' }
    { bin:1 proto:'...object => object' desc:'Creates a shallow copy comprised of each given object where overlapping keys in later arguments override keys in earlier arguments.' }
    { bin:1 proto:'...any[] => object' desc:'Creates a shallow copy comprised of each given array concatenated.' }
    { bin:1 proto:'(date, timespan) => date' desc:'Adds the given timespan to the given date.' }
    { bin:1 proto:'...timespan => timespan' desc:'Adds the given timespans together.' }
    { un:1 proto:'any => number' desc:'The unary + operator converts the given value to a number.' }
  ]}
  { op:['-' 'subtract'] sig:[
    { bin:1 proto:'...any => number' desc:'Subtracts the given values as numbers starting with the first.

If there is context-local rounding set, it will be applied to the result (see set-defaults).' }
    { bin:1 proto:'(date, date) => timespan' desc:'Subtracts the second date from the first, resulting in the timespan between the two dates.' }
    { bin:1 proto:'(date, timespan) => date' desc:'Subtracts the second date from the first, resulting in the timespan between the two dates.' }
    { un:1 proto:'any => number' desc:'The unary - operator converts the given value to a number and negates it.' }
  ]}
  { op:['/' 'divide'] sig:[
    { bin:1 proto:'...any => number' desc:'Divides the given values starting with the first.

If there is context-local rounding set, it will be applied to the result (see set-defaults).' }
  ]}
  { op:['/%' 'intdiv'] sig:[
    { bin:1 proto:'...any => number' desc:'Divides the given values with integer division starting with the first.'}
  ]}
  { op:['<' 'lt'] sig:[
    { bin:1 proto:'(any, any) => boolean' desc:'Returns true if the first value is less than the second.' }
  ]}
  { op:['<=' 'lte'] sig:[
    { bin:1 proto:'(any, any) => boolean' desc:'Returns true if the first value is less than or equal to the second.' }
  ]}
  { op:['==' 'is'] sig:[
    { bin:1 proto:'(any, any) => boolean' desc:'Returns true if the given values are equal (not strict).' }
    { bin:1 proto:'(any, schema) => boolean' desc:'(Only applies to the \\'is\\' alias) Returns true if the given value loosely conforms to the given schema.' }
  ]}
  { op:['!=' 'is-not'] sig:[
    { bin:1 proto:'(any, any) => boolean' desc:'Returns true if the given values are not equal (not strict).' }
    { bin:1 proto:'(any, schema) => boolean' desc:'(Only applies to the \\'is-not\\' alias) Returns true if the given value does not loosely conform to the given schema.' }
  ]}
  { op:['===' 'deep-is'] sig:[
    { bin:1 proto: '(any, any) => boolean' desc:'Do a deep equality check on the first two arguments using loose equality for primitives.' }
    { proto: "(any, any, 'strict'|'loose'|'sql'|application) => boolean" desc:'Do a deep equality check on the first two arguments using the comparison method specified by the third argument. If an application is given, it will be called with each item being checked at each step in the recursive check to determine equality.' }
  ] opts:[
    { name::equal type:"'strict'|'loose'|'sql'|(any, any) => boolaen" desc:'What type of equality check should be used to determine whether two values are different.

The strings strict (===), loose (==), and sql (loose plus numbers, dates, and booleans have special handling when they are or are compared to strings) will use a built-in equality check.' }
  ]}
  { op:['!==' 'deep-is-not'] sig:[
    { bin:1 proto: '(any, any) => boolean' desc:'Do a deep inequality check on the first two arguments using loose equality for primitives.' }
    { proto: "(any, any, 'strict'|'loose'|'sql'|application) => boolean" desc:'Do a deep inequality check on the first two arguments using the comparison method specified by the third argument. If an application is given, it will be called with each item being checked at each step in the recursive check to determine equality.' }
  ] opts:[
    { name::equal type:"'strict'|'loose'|'sql'|(any, any) => boolaen" desc:'What type of equality check should be used to determine whether two values are different.

The strings strict (===), loose (==), and sql (loose plus numbers, dates, and booleans have special handling when they are or are compared to strings) will use a built-in equality check.' }
  ]}
  { op:['>' 'gt'] sig:[
    { bin:1 proto: '(any, any) => boolean' desc:'Returns true if the first value is greater than the second value.' }
  ]}
  { op:['>=' 'gte'] sig:[
    { bin:1 proto: '(any, any) => boolean' desc:'Returns true if the first value is greater than or equal to the second value.' }
  ]}
  { op:'??' sig:[
    { bin:1 proto:'...any => any' desc:'Returns the first non-null, non-undefined value.'}
  ]}
  { op:['||' 'or'] sig:[
    { bin:1 proto: '(any, any) => any' desc:"Lazily evaluates its arguments and returns the first truthy value or \`false\` if there aren't any." }
  ]}
  { op:['&&' 'and'] sig:[
    { bin:1 proto: '(any, any) => any' desc:'Lazily evaluates its arguments and returns the final value or \`false\` if any of the values are not truthy.' }
  ]}
  { op:'abs' sig:[
    { proto:'number => number' desc:'Returns the absolute value of the given number.'}
  ]}
  { op:'array' sig:[
    { proto:'...any => any[]' desc:'Returns all of its arguments in an array.'}
    { proto: 'range => number[]' desc:'Convert a range to an array of numbers covered by the range. The maximum number of elements in the resulting array is 10,000, and the default bounds are -100 to 200.'}
  ] opts:[
    { name::range type::boolean desc:'Use the range prototype of the operator. Without this, even a parsed range will result in an array with the range as the only element.' }
    { name::bounds type:'[number, number]' desc:'Sets the lower and upper bounds, respectively, of the resulting array. If the bounds are more than 10,000 apart, the lower bound will be set to 10,000 less than the upper bound.' }
  ]}
  { op:'avg' sig:[
    { agg:1 proto: '() => number' desc:'Computes the average of the current source.' }
    { proto:'number[] => number' desc:'Computes the average of the given array of numbers.' }
    { proto:'(any[], application) => number' desc:'Computes the average of the applications for the given array of values.' }
    { agg:1 proto:'application => number' desc:'Computes the average of the applications for the current source.' }
  ]}
  { op:'block' sig:[
    { proto:'...any => any' desc:'Evaluates each of its arguments and returns the value of the final argument.' }
  ]}
  { op:['case' 'switch'] sig:[
    { proto:'(any, ...(any|application, any)) => any' desc:'Evaluates its first argument and uses it as a basis for comparison for each subsequent pair of arguments, called matchers.

The first value in a matcher is used for the comparison, and the second value is returned if the comparison holds. If the matcher first value is an application, the matcher matches if the application returns a truthy value when given the basis value. If the matcher first value is a value, the matcher matches if the first value and the basis value are loosely equal.

The basis value is available as @case or the shorthand _ in each matcher.' eg:['case 1+1 when 1 then :nope when =>4 - _ == _ then :yep else :other end' 'case(1+1 1 :nope =>4 - _ == _ :yep :other)'] }
  ]}
  { op:'cat' sig:[
    { proto:'...any => string' desc:'Concatenates all of the given values into a string.' }
  ]}
  { op:'ceil' sig:[
    { proto:'number => number' desc:'Returns the given number rounded up to the nearest integer.' }
  ]}
  { op:'clamp' sig:[
    { proto:'(number, number, number) => number' desc:'Takes a minimum, a value, and a maximum, and returns the minimum if the value is less than the minimum, the maximum if the value is more than the maximum, or the value otherwise.' }
  ]}
  { op:'coalesce' sig:[
    { proto:'...any => any' desc:'Lazily evalutes its arguments to return the first non-nullish one it encounters.' }
  ]}
  { op:'coalesce-truth' sig:[
    { proto:'...any => any' desc:'Lazily evalutes its arguments to return the first truthy one it encounters.' }
  ]}
  { op:'contains' sig:[
    { bin:1 proto:'(any[], any) => boolean' desc:'Returns true if the second argument is found in the first argument array using indexOf.' }
    { bin:1 proto:'(any[], any[]) => boolean' desc:'Returns true if each entry in the second argument is found in the first argument array using indexOf.' }
    { bin:1 proto:'(any[], application) => boolean' desc:'Returns true if the second argument application returns true for one of the values in the first argument array.' }
    { bin:1 proto:'(object, application) => boolean' desc:'Returns true if the second argument application returns true for one of the [value, index, key] tuples in the first argument array.' }
    { bin:1 proto:'(string, string) => boolean' desc:'Returns true if the second argument is a substring of the first argument.' }
    { bin:1 proto:'(daterange, date) => boolean' desc:'Returns true if the second argument is a falls within the first argument range.' }
  ]}
  { op:'count' sig:[
    { proto:'any[] => number' desc:'Returns the number of entries in the given array.' }
    { agg:1 proto:'() => number' desc:'Counts the number of entries in the current source.' }
  ] opts:[
    { name::partition type::application desc:'Build a count object where the keys are determined by the application and the count associated with each key is how many times the application produces the key when applying it to each value in the array.' }
    { name::sub type::object desc:'Build a count object where the keys are determined by the sub object. Each key of the sub object must be an application. If the application returns a string, it will be used as the key. If it returns an array, each member will be used as a key. If it returns an otherise truthy value, the key associated with the application will be used as the key. The counts in the resulting object represent how many times each key appeared when each application was applied to each value in the array.' }
  ]}
  { op:'date' sig:[
    { proto:'string => date' desc:'Parses the given date as a platform date (JS), using the builtin parser first and the platform parser if that fails.' }
    { proto:'(string, string) => date' desc:'Parses the given date as a platform date (JS), using the builtin parser first and the platform parser if that fails. If the second argument is parseable as a time, the date is shifted to that time.' }
    { proto:'(date, string) => date' desc:'If the second argument is parseable as a time, the given date is shifted to that time.' }
    { proto:'date => date' desc:'Processes the given date and return the result with optional named arguments applied.' }
  ] opts:[
    { name:['rel' 'parse'] type:'boolean' desc:'Return a raport date rather than a platform date.' }
    { name:'shift' type:'boolean' desc:'When combined with a relative date and time argument with a timezone, will shift the time along with the timezone in the resulting date rather than just changing the timezone and leaving the time as is.' }
    { name:'y' type:'number' desc:'Set the target year on the resulting date. This is not applicable for relative dates.' }
    { name:'m' type:'number' desc:'Set the target month on the resulting date with a 1 indexed number e.g. January is 1 rather than 0. This is not applicable for relative dates.' }
    { name:'d' type:'number' desc:'Set the target day on the resulting date. This is not applicable for relative dates.' }
    { name:'clamp' type:'boolean' desc:'If m or d is specified, setting a number not in the normal range will cause the date to shift outside its bounds e.g. m:13 would be January of the following year. This option will prevent that behavior.' }
  ]}
  { op:'detect-delimeters' sig:[
    { proto:'string => CSVOptions' desc:'Detects the field, record, and quote delimiters from the first 2048 characters of the given string.' }
    { proto:'(string, number) => CSVOptions' desc:'Detects the field, record, and quote delimiters from the first given number of characters of the given string.' }
  ] opts:[
    { name:'context' type:'number' desc:'Set the limit for the number of characters to examine from the given string.' }
  ]}
  { op:'diff' sig:[
    { proto:'(any, any) => Diff' desc:'Does a deep comparison of the two arguments returning a map of deep keypath to a tuple of the left value and right value for differing paths.' }
    { proto:'(any, any, equal) => Diff' desc:'Does a deep comparison of the two arguments returning a map of deep keypath to a tuple of the left value and right value for differing paths. The third argument is used as the equality check for comparisons (see equal named argument).' }
  ] opts:[
    { name::equal type:"'strict'|'loose'|'sql'|(any, any) => boolaen" desc:'What type of equality check should be used to determine whether two values are different. The strings strict (===), loose (==), and sql (loose plus numbers, dates, and booleans have special handling when they are or are compared to strings) will use a built-in equality check.' }
     { name::keys type:"'all'|'common'" desc:'Which keys to include in object comparisons. The default all will result in any key in either object being compared. common will result in only keys preset in both objects being compared.' }
  ]}
  { op:'does-not-contain' sig:[
    { bin:1 proto:'(any[], any) => boolean' desc:'Returns false if the second argument is found in the first argument array using indexOf.' }
    { bin:1 proto:'(any[], any[]) => boolean' desc:'Returns false if each entry in the second argument is found in the first argument array using indexOf.' }
    { bin:1 proto:'(any[], application) => boolean' desc:'Returns false if the second argument application returns true for one of the values in the first argument array.' }
    { bin:1 proto:'(object, application) => boolean' desc:'Returns false if the second argument application returns true for one of the [value, index, key] tuples in the first argument array.' }
    { bin:1 proto:'(string, string) => boolean' desc:'Returns false if the second argument is a substring of the first argument.' }
    { bin:1 proto:'(daterange, date) => boolean' desc:'Returns false if the second argument is a falls within the first argument range.' }
  ]}
  { op:'each' sig:[
    { proto:'(any[], application) => string' desc:'Iterates over the given array, executes the application for each value, and returns ther results joined with an empty string.' }
    { proto:'(any[], application, ...(boolean, result)) => string' desc:'Iterates over the given array, executes the application for each value, and returns ther results joined with an empty string. If the array is empty, then the final array of condition/result pairs are lazily evaluated to return one that matches.' }
    { proto:'(object, application) => string' desc:'Iterates over the given object entries, executes the application for each value, and returns ther results joined with an empty string.' }
    { proto:'(object, application, ...(boolean, result)) => string' desc:'Iterates over the given object entries, executes the application for each value, and returns ther results joined with an empty string. If the object is empty, then the final array of condition/result pairs are lazily evaluated to return one that matches.' }
  ] opts:[
    { name:'join' type:'string' desc:'An alternate string to use to join the results.' }
  ]}
  { op:'eval' sig:[
    { proto:'string => any' desc:'Evaluates the given string as an expression.' }
  ] opts: [
    { name:'template' type:'boolean' desc:'Evaluate the given string as a template in the current context.' }
    { name:'context' type:'Context' desc:'The context in which to evaluate the expression. If not given, the current context will be used.' }
  ]}
  { op:'filter' sig:[
    { proto:'(any[], application) => any[]' desc:'Filters the given array using the given application to remove entries that return a false-y result.' }
    { proto:'(object, application) => object' desc:'Filters the given object using the given application to remove entries that return a false-y result.' }
    { proto:'(any[], application, sort[]) => any[]' desc:'Filters the given array using the given application to remove entries that return a false-y result. The result is then sorted using the given sort array.' }
    { proto:'(object, application, sort[]) => object' desc:'Filters the given object using the given application to remove entries that return a false-y result. The result is then sorted using the given sort array.' }
    { proto:'(any[], application, sort[], application|application[]) => any[]' desc:'Filters the given array using the given application to remove entries that return a false-y result. The result is then sorted using the given sort array. The result is finally grouped by the final application or array of applications.' }
  ] opts:[
    { name:'invert' type:'boolean|:first|number[]' desc:'Inverts the result of the sort, if any. If true, all sort segments will be inverted. If an array, each segment index in the array will be inverted. :first is a slightly more clear shorthand for [0]. The special reference, invert, is available to the sort expression during evaluation as true if there is an inversion passed in.' }
  ]}
  { op:'find' sig:[
    { proto:'(any[], application) => any' desc:'Finds the first element in the given array that matches the given application and returns it.' }
    { proto:'(object, application) => any' desc:'Finds the first value in the given object that matches the given application and returns it. The application is passed the value, index, and key of each entry.' }
    { agg:1 proto:'application => any' desc:'Finds the first element in the current source that matches the given application and returns it.' }
  ]}
  { op:'first' sig:[
    { proto:'any[] => any' desc:'Returns the first element in the given array.' }
    { agg:1 proto:'() => any' desc:'Returns the first element in the current source.' }
  ]}
  { op:'flatten' sig:[
    { agg:1 proto:'any[] => any[]' desc:'Flattens nested arrays into a single non-nested array.' }
    { agg:1 proto:'(any[], number) => any[]' desc:'Flattens nested arrays into a single non-nested array, up to as many levels as specified by the second argument.' }
  ], opts: [
    { name:'flat' type:'number' desc:'The number of levels of nested arrays to flatten. If this is not supplied or not a number, it defaults to 1.' }
  ]}
  { op:'floor' sig:[
    { proto:'number => number' desc:'Returns the given number rounded down to the nearest integer.' }
  ]}
  { op:['format' 'fmt'] sig:[
    { proto:'(any, string, ...args) => string' desc:'Applies the named formatted indicated by the second argument string to the given value, passing along any additional arguments to the formatter.' }
  ]}
  { op:'generate' sig:[
    { proto:'(application) => any[]' desc:'Calls the given application, aggregating values until the application returns undefined.

If the result is an array, the elements of the array are added to the result.
If the result is an object matching { value?: any, state?: any }, then the value will be added to the result and the state, if supplied, will replace the state of the generator.
Any other value will be added to the result.

Each application is passed the state, last value, and index of the call. Each of the arguments is also available a special reference, @state, @last, and @index, respectively.

The global defaults for generate have a max property, defaulting to 10000, that limits the number of iterations that can be run to avoid non-terminating generators.' }
    { proto:'(range) => number[]' desc:'Iterates the members of the range and returns an array of all of the included numbers. This takes into account excluded numbers and ranges and ignores any inclusive range that includes an infinite bound.

The global defaults for generate have a max property, defaulting to 10000, that limits the number of iterations that can be run to avoid non-terminating generators.' }
  ], opts: [
    { name:'[state]' type:'any' desc:'Any options passed to the operator are sent into the initial application as the state.' }
  ]}
  { op:'get' sig:[
    { proto:'(any, string) => any' desc:'Safely retrieves the value at the given path string from the value passed as the first argument.' }
  ]}
  { op:'group' sig:[
    { proto:'(any[], application|application[]) => any[]' desc:'Groups the given array using the given application or application array.' }
  ]}
  { op:'if' sig:[
    { proto:'(...(boolean, any)) => any' desc:'Lazily evaluates each odd argument and returns the first subsequent even argument when a truthy odd argument is found. If no truthy odd argument is found and there is not a final even argument, the final odd argument is returned.' }
  ]}
  { op:'ilike' sig:[
    { bin:1 proto:'(string, string) => any' desc:'Checks to see if the first string matches the second string used as a pattern case insensitively.' }
    { bin:1 proto:'(string[], string) => any' desc:'Checks to see if any of the strings in the first argument array matches the second string used as a pattern case insensitively.' }
    { bin:1 proto:'(string, string[]) => any' desc:'Checks to see if first string matches any of the second argument strings used as patterns case insensitively.' }
    { bin:1 proto:'(string[], string[]) => any' desc:'Checks to see if any of the strings in the first argument array matches any of the second argument strings used as patterns case insensitively.' }
  ] opts: [
    { name:'free' type:'boolean' desc:'Causes the patterns not to be anchored to the start and end of the target string.' }
  ]}
  { op:'in' sig:[
    { bin:1 proto:'(any, any[]) => boolean' desc:'Returns true if the first argument is found in the second argument array using indexOf.' }
    { bin:1 proto:'(any[], any[]) => boolean' desc:'Returns true if each entry in the first argument is found in the second argument array using indexOf.' }
    { bin:1 proto:'(application, any[]) => boolean' desc:'Returns true if the first argument application returns true for one of the values in the second argument array.' }
    { bin:1 proto:'(application, object) => boolean' desc:'Returns true if the first argument application returns true for one of the [value, index, key] tuples in the second argument array.' }
    { bin:1 proto:'(string, string) => boolean' desc:'Returns true if the first argument is a substring of the second argument.' }
    { bin:1 proto:'(string|string[], object) => boolean' desc:'Returns true if the strings in the first argument are all keys in the given object.' }
    { bin:1 proto:'(date, daterange) => boolean' desc:'Returns true if the first argument falls within the second argument range.' }
    { bin:1 proto:'(number, range) => boolean' desc:'Returns true if the first argument falls within the second argument range.' }
  ]}
  { op:'index' sig:[
    { agg:1 proto:'(array, application) => object' desc:'Returns a map of the given array keyed on the result of the application.

If the application returns a tuple, the values in the map will be the second value in the tuple and the keys will be the first. If the key portion of the tuple is an array, the value will be set for each key in the keys array.
If the application returns an empty tuple, the value in the array will be omitted from the result.
The value may also be an object with a "key" or "keys" key and, optionally, a "value" key.
The value may also be an object with a "many" key with an array value of multiple entries of any of the previous types to be added to the map.' }
  ] opts: [
    { name:'many' type::boolean desc:'If enabled, the values in the map will be arrays aggregating all of the values with the same key. Otherwise, the last entry for a key will be the value for that key in the map.' }
  ]}
  { op:'inspect' sig:[
    { proto:'(any) => schema' desc:'Inspects the given value and returns a schema based on its contents.' }
  ] opts:[
    { name:'mode' type:"'schema'" desc:"If set to 'schema' the result will be unparsed into a schema literal." }
    { name:'flat' type:'boolean' desc:'If enabled, deeply introspect objects to include nested types in the schema.' }
  ]}
  { op:'intersect' sig:[
    { proto:'(any[], any[]) => any[]' desc:'Returns the intersection of the two given arrays with no duplicates.' }
  ]}
  { op:'interval' sig:[
    { proto:'string => interval' desc:'Parses the given string as an interval.' }
  ]}
  { op:'join' sig:[
    { proto:'(any[], string) => string' desc:'Joins all of the elements in the given array with the given string.' }
    { proto:'(any[], application, string) => string' desc:'Joins all of the results of the given application of each element in the given array with the given string.' }
    { proto:'(any[], string, string) => string' desc:'Joins all of the elements in the given array with the given string. The last element is appended using the final string if there are more than two elements.' }
    { proto:'(any[], application, string, string) => string' desc:'Joins all of the results of the given application of each element in the given array with the given string. The last element is appended using the final string if there are more than two elements.' }
    { proto:'(any[], string, string, string) => string' desc:'Joins all of the elements in the given array with the given string. The elements are joined using the final string if there are only two elements. The last element is appended using the second string if there are more than two elements.' }
    { proto:'(any[], application, string, string, string) => string' desc:'Joins all of the results of the given application of each element in the given array with the given string. The elements are joined using the final string if there are only two elements. The last element is appended using the second string if there are more than two elements.' }
    { agg:1 proto:'string => string' desc:'Joins all of the elements in the current source with the given string.' }
    { agg:1 proto:'(application, string) => string' desc:'Joins all of the results of the given application of each element in the current source with the given string.' }
    { agg:1 proto:'(string, string) => string' desc:'Joins all of the elements in the current source with the given string. The last element is appended using the final string if there are more than two elements.' }
    { agg:1 proto:'(application, string, string) => string' desc:'Joins all of the results of the given application of each element in the current source with the given string. The last element is appended using the final string if there are more than two elements.' }
    { agg:1 proto:'(string, string, string) => string' desc:'Joins all of the elements in the current source with the given string. The elements are joined with the final string if there are only two elements. The last element is appended using the second string if there are more than two elements.' }
    { agg:1 proto:'(application, string, string, string) => string' desc:'Joins all of the results of the given application of each element in the current source with the given string. The elements are joined with the final string if there are only two elements. The last element is appended using the second string if there are more than two elements.' }
  ]}
  { op:'keys' sig:[
    { proto:'object => string[]' desc:'Returns an array of all of the keys in the given object.' }
    { proto:'(object, true) => string[]' desc:'Returns an array of all of the keys in the given object, including any from the prototype chain.' }
  ]}
  { op:'label-diff' sig:[
    { proto:'(Diff, LabelMap) => Diff' desc:'Takes the given diff and label map and swaps out paths in the diff for labels in the map.

The label map is a nested object with the keys being single key paths in the diff and the values being a label or tuple of a label and label map for nested sub structures.' eg:'label-diff(d { foo:[:Company { bar::Address }] }) where d = { :foo.bar: [:street :avenue] } will result in { "Company Address": [:street :avenue] }' }
  ] opts:[
    { name:'omit' type:'boolean' desc:'Remove any unlabelled diff entries from the output.' }
  ]}
  { op:'last' sig:[
    { proto:'any[] => any' desc:'Returns the last element in the given array.' }
    { agg:1 proto:'() => any' desc:'Returns the last element in the current source.' }
  ]}
  { op:'let' sig:[
    { proto:'(string, any) => interval' desc:'Sets the local value specified by the given path in the first argument the value supplied as the second argument and returns the value that was replaced, if any.' }
  ]}
  { op:['len' 'length'] sig:[
    { proto:'string|array|dataset|application|object => number' desc:'Returns the length of a given string or array, the length of a given array dataset, the number of keys in a given object, the number of named arguments of an application, or 0.' }
  ]}
  { op:'like' sig:[
    { bin:1 proto:'(string, string) => any' desc:'Checks to see if the first string matches the second string used as a pattern case sensitively.' }
    { bin:1 proto:'(string[], string) => any' desc:'Checks to see if any of the strings in the first argument array matches the second string used as a pattern case sensitively.' }
    { bin:1 proto:'(string, string[]) => any' desc:'Checks to see if first string matches any of the second argument strings used as patterns case sensitively.' }
    { bin:1 proto:'(string[], string[]) => any' desc:'Checks to see if any of the strings in the first argument array matches any of the second argument strings used as patterns case sensitively.' }
  ] opts: [
    { name:'free' type:'boolean' desc:'Causes the patterns not to be anchored to the start and end of the target string.' }
  ]}
  { op:'log' sig:[
    { proto:'...any => void' desc:'Sends the given arguments to the context logging facility, which defaults to console.log if none is provided.' }
  ]}
  { op:'lower' sig:[
    { proto:'string => string' desc:'Returns the given string in lower case.' }
  ]}
  { op:'map' sig:[
    { proto:'(any[], application) => any[]' desc:'Applies the given application to each element in the given array and returns an array containing the results.' }
    { proto:'application => any[]' desc:'Applies the given application to each element in the current source and returns an array containing the results.' }
    { proto:'(object, application) => object' desc:'Applies the given application to each [value, index, key] tuple in the given object and returns an object containing the results. If the application return a null, that entry will be left out of the result. If it returns a 2-tuple with a string as the first entry, the result will replace that entry. Otherwise, the entry will have its value replaced with the result of the application.' }
  ] opts: [
    { name:'array' type:'boolean' desc:'When truthy for an object map call, this will cause the result to be the array of application results rather than an object. The application in this case should only return result values.'}
    { name:'entries' type:'boolean' desc:'When truthy for an object map call, this will cause the result to be the array of resulting application entries rather than an object. The same handling for object entries still applies to this option as the operation without it.'}
    { name:'flat' type:'number' desc:'When applied to an array or an object call that results in an array, this will cause the array to be flattened up to the level specified by the value of the option. If the value is not a number but still truthy, the number defaults to 1.' }
  ]}
  { op:'max' sig:[
    { agg:1 proto: '() => number' desc:'Returns the largest entry in the current source.' }
    { proto:'number[] => number' desc:'Returns the largest entry in the given array of numbers.' }
    { proto:'(any[], application) => number' desc:'Returns the largest entry in the applications for the given array of values.' }
    { agg:1 proto:'application => number' desc:'Returns the largest entry in the applications for the current source.' }
    { proto:'...number => number' desc:'Returns the largest entry in the given list of number arguments. If no arguments are given the result will be 0.' }
  ]}
  { op:'min' sig:[
    { agg:1 proto: '() => number' desc:'Returns the smallest entry in the current source.' }
    { proto:'number[] => number' desc:'Returns the smallest entry in the given array of numbers.' }
    { proto:'(any[], application) => number' desc:'Returns the smallest entry in the applications for the given array of values.' }
    { agg:1 proto:'application => number' desc:'Returns the smallest entry in the applications for the current source.' }
    { proto:'...number => number' desc:'Returns the smallest entry in the given list of number arguments. If no arguments are given the result will be 0.' }
  ]}
  { op:'not' sig:[
    { un:1 proto:'any => boolean' desc:'Negates the truthiness of the given value.' }
  ]}
  { op:'not-ilike' sig:[
    { bin:1 proto:'(string, string) => any' desc:'Checks to see if the first string does not match the second string used as a pattern case insensitively.' }
    { bin:1 proto:'(string[], string) => any' desc:'Checks to see if all of the strings in the first argument array do not match the second string used as a pattern case insensitively.' }
    { bin:1 proto:'(string, string[]) => any' desc:'Checks to see if first string does not match any of the second argument strings used as patterns case insensitively.' }
    { bin:1 proto:'(string[], string[]) => any' desc:'Checks to see if all of the strings in the first argument array do not match any of the second argument strings used as patterns case insensitively.' }
  ] opts: [
    { name:'free' type:'boolean' desc:'Causes the patterns not to be anchored to the start and end of the target string.' }
  ]}
  { op:'not-in' sig:[
    { bin:1 proto:'(any, any[]) => boolean' desc:'Returns false if the first argument is found in the second argument array using indexOf.' }
    { bin:1 proto:'(any[], any[]) => boolean' desc:'Returns false if each entry in the first argument is found in the second argument array using indexOf.' }
    { bin:1 proto:'(application, any[]) => boolean' desc:'Returns false if the first argument application returns true for one of the values in the second argument array.' }
    { bin:1 proto:'(application, object) => boolean' desc:'Returns false if the first argument application returns true for one of the [value, index, key] tuples in the second argument array.' }
    { bin:1 proto:'(string, string) => boolean' desc:'Returns false if the first argument is a substring of the second argument.' }
    { bin:1 proto:'(string|string[], object) => boolean' desc:'Returns false if the strings in the first argument are all keys in the given object.' }
    { bin:1 proto:'(date, daterange) => boolean' desc:'Returns false if the first argument falls within the second argument range.' }
    { bin:1 proto:'(number, range) => boolean' desc:'Returns false if the first argument falls within the second argument range.' }
  ]}
  { op:'not-like' sig:[
    { bin:1 proto:'(string, string) => any' desc:'Checks to see if the first string does not match the second string used as a pattern case sensitively.' }
    { bin:1 proto:'(string[], string) => any' desc:'Checks to see if all of the strings in the first argument array do not match the second string used as a pattern case sensitively.' }
    { bin:1 proto:'(string, string[]) => any' desc:'Checks to see if first string does not match any of the second argument strings used as patterns case sensitively.' }
    { bin:1 proto:'(string[], string[]) => any' desc:'Checks to see if all of the strings in the first argument array do not match any of the second argument strings used as patterns case sensitively.' }
  ] opts: [
    { name:'free' type:'boolean' desc:'Causes the patterns not to be anchored to the start and end of the target string.' }
  ]}
  { op:'nth' sig:[
    { proto:'(any[], number) => any' desc:'Returns the nth item in the given array using a 1-based index. If the number is negative, the offset is from the end rather than the beginning.' }
    { agg:1 proto:'number => any' desc:'Returns the nth item in the current source using a 1-based index. If the number is negative, the offset is from the end rather than the beginning.' }
  ]}
  { op:'num' sig:[
    { proto:'string => number' desc:'Returns the first positive number found in the string, including an optional decimal.' }
  ]}
  { op:'object' sig:[
    { proto:'(...(string, any)) => object' desc:'Returns an object assembled from the arguments where each odd argument is a key and the subsequent even argument is its value.' eg: 'object(:key1 99 :key2 73)' }
    { proto:'(any[]) => object' desc:'Returns an object assembled from the given array members where each odd entry is a key and the subsequent even entry is its value.' eg: 'object([:key1 99 :key2 73])' }
  ]}
  { op:'overlap' sig:[
    { proto:'(string, string, number = 0.5) => string' desc:"Returns the first overlapping substring within the two given strings that is at least the given percentage of the smallest string's length long using the similar operator." }
  ]}
  { op:'pad' sig:[
    { proto:'(string, number) => string' desc:'Pads the given string with spaces at both ends such that it is at least the given number of characters long.' }
    { proto:'(string, number, stringy) => string' desc:'Pads the given string with the final string at both ends such that it is at least the given number of characters long. If the final string is not a single character, a single space will be used instead.' }
  ]}
  { op:'padl' sig:[
    { proto:'(string, number) => string' desc:'Pads the given string with spaces at the beginning such that it is at least the given number of characters long.' }
    { proto:'(string, number, stringy) => string' desc:'Pads the given string with the final string at the beginning such that it is at least the given number of characters long. If the final string is not a single character, a single space will be used instead.' }
  ]}
  { op:'padr' sig:[
    { proto:'(string, number) => string' desc:'Pads the given string with spaces at the end such that it is at least the given number of characters long.' }
    { proto:'(string, number, stringy) => string' desc:'Pads the given string with the final string at the end such that it is at least the given number of characters long. If the final string is not a single character, a single space will be used instead.' }
  ]}
  { op:'parse' sig:[
    { proto:'string => any' desc:'Parses the given string using the expression parser.' }
  ] opts: [
    { name:'date' type:'boolean' desc:'Use the date parser rather than the expression parser.' }
    { name:'template' type:'boolean' desc:'Use the template parser rather than the expression parser.' }
    { name:'time' type:'boolean' desc:'Use the time parser rather than the expression parser.' }
    { name:'schema' type:'boolean' desc:'Use the schema parser rather than the expression parser.' }
    { name:'json' type:'boolean' desc:'Use a JSON parser rather than the expression parser.' }
    { name:'base64' type:'boolean' desc:'Use a base64 parser to decode a base64 encoded string.' }
    { name:'xml' type:'boolean' desc:'Use the XML parser to read data. In JSON mode, properties and children are equivalent. Duplicate names result in all of the duplicate values being aggregated into an array rather than last in winning. In document mode, a document with a single element root is producted. Each element can have attributes, a namespace, a name, and children, which can be elements, string content, or comments.' }
    { name:'strict' type:'boolean' desc:'For the XML parser, be less forgiving about malformed content. Defaults to false.' }
    { name:'type' type:"'doc'|'json'" desc:'For the XML parser, set the parsing mode.' }
    { name:'csv' type:'boolean' desc:'Use the delimited text parser rather than the expression parser.' }
    { name:'delimited' type:'boolean' desc:'Use the delimited text parser rather than the expression parser.' }
    { name:'detect' type:'boolean' desc:'If using the delimited parser, detect the delimiters and use them to parse.' }
    { name:'header' type:'boolean|string[]|object' desc:'Only applies when using the delimited parser. If an array, each array element will be used as the header for the corresponding field in the rows. This will not consume the first row of non-tabular data to be used as the header. If an object with non-numeric keys, each header will be replaced with its corresponding value in the map if it is a non-empty string, removed if it is a non-nullish falsey value, or left alone if it is a nullish value. This will consume the first row of non-tabular data to use as a header. If an object with numeric keys, the results will be objects with the header map values as keys and the corresponding field index as values. This will not consume any data, so if there is a header row, it will need to be removed from the resulting data. If a truthy value, the first row of non-tabular data will be consumed to be used as a header.' }
    { name:'field' type:'string' desc:'If using the delimited parser, use the given string as the field delimiter.' }
    { name:'record' type:'string' desc:'If using the delimited parser, use the given string as the record delimiter.' }
    { name:'quote' type:'string' desc:'If using the delimited parser, use the given string as the field quote.' }
    { name:'order' type:'boolean' desc:'If set to false or 0, the fields in resulting objects generated from input with headers will not be keyed in alphabetical order.' }
    { name:'fixedSize' type:'boolean' desc:'Discard any delimited rows that are not at least as long as the header/first row.' }
  ]}
  { op:'patch' sig:[
    { proto:'(any,...Diff) => any' desc:'Applies the given diffs to a deep copy of the given object. The direction of the patch can be changed with a named argument. By default, patches are applied in the order given using the new values of the patch to place in the result object. When run backward, the patch list is reversed, and the patches are applied in order using the old values of the patch to place in the result object.' }
  ] opts: [
    { name:'dir' type:"'forward'|'backward'" desc:'If unsupplied or forward, patches are applied in given order using the new values. If backward, patches are applied in reverse order using the old values.' }
    { name:'strict' type:'boolean' desc:'If strict is truthy, each diff entry that is applied will ensure that the current state of the object matches the starting point of the diff before updating the object.' }
  ]}
  { op:['pipe' '|'] sig:[
    { bin:1 proto:'...any => any' desc:'This is a special built-in operator that evaluates its first argument, supplies that as an input to the next argument, supplies that result as an input to the next argument, and so on until the result of the last argument evaluation is returned. If any argument is an operation that does not reference \`@pipe\` or \`_\` as one of its arguments, then \`@pipe\` will be added as the first argument of that operation. Arguments that are applications are automatically applied with the piped value.' }
  ]}
  { op:['rand' 'random'] sig:[
    { proto:'() => number' desc:'Returns a random floating point number between 0 and 1, inclusive.' }
    { proto:'number => number' desc:'Returns a random integer between 1 and the given number, inclusive.' }
    { proto:'(number, true) => number' desc:'Returns a random floating point number between 1 and the given number, inclusive.' }
    { proto:'(number, number) => number' desc:'Returns a random integer between the given numbers, inclusive.' }
    { proto:'(number, number, true) => number' desc:'Returns a random floating point number between the given numbers, inclusive.' }
    { proto:'(string, number) => string' desc:'Returns a string consisting of the given characters randomly selected the given number of times.' }
    { proto:'(any[]) => any' desc:'Returns a random entry from the given array.' }
  ]}
  { op:'reduce' sig:[
    { proto:'(any[], application, any) => any' desc:'Folds the given array into the final argument value by passing each element in the given array into the application with the result of the last application (or the final argument for the first iteration) and returns the result of the final application.' }
    { agg:1 proto:'(application, any) => any' desc:'Folds the current source into the final argument value by passing each element in the current source into the application with the result of the last application (or the final argument for the first iteration) and returns the result of the final application.' }
  ]}
  { op:'replace-all' sig:[
    { proto:'(string, string, string) => string' desc:'Replaces all instances of the second string found in the first string with the third string.' }
    { proto:'(string, string, string, string) => string' desc:'Replaces all instances of a regular expression constructed with the seconds string as the expression and the fourth string as the flags, which may be empty, found in the first string with the third string.' }
  ]}
  { op:'replace' sig:[
    { proto:'(string, string, string) => string' desc:'Replaces the first instance of the second string found in the first string with the third string.' }
    { proto:'(string, string, string, string) => string' desc:'Replaces the first instance of a regular expression constructed with the seconds string as the expression and the fourth string as the flags, which may be empty, found in the first string with the third string.' }
  ]}
  { op:'reverse' sig:[
    { proto:'string => string' desc:'Reverses the given string.' }
    { proto:'any[] => any[]' desc:'Reverses the given array.' }
  ]}
  { op:'round' sig:[
    { proto:'number => number' desc:'Rounds the given number to the nearest integer.' }
    { proto:'(number, number, string) => number' desc:'Rounds the given number to the nearest decimal specified by the second number using the method specified by the string, defaulting to half-even. Supported methods are half-up, half-down, half-to-0, half-from-0, half-even, half-odd, to-0, from-0, up, and down. If the number of places negative, the number will be rounded left from the decimal point. All if the half methods look at the place to the right of the target number of places and round down if the digit is less than 5, up if the digit is more than 5, and based on the specific method if the digit is 5. For the non-half methods, if there is any amount to the right of the target place, the digit in the target place will be rounded based on specific method.' }
  ] note:"By default, the single-number signature will round to an integer, but if the round defaults are updated to include all-numeric as true, then it will return numbers rounded to the nearest default place. Round defaults are { places:2 all-numeric:false method::half-even }."
  opts:[
    { name:'places' type:'number' desc:'The number of places to round to' }
    { name:'method' type:':half-up|:half-down|:half-to-0|:half-from-0|:half-even|:half-odd|:to-0|:from-0|:up|:down' desc:'The rounding method to use' }
    { name:'string' type:'boolean' desc:'Return the number as a string rather than a number' }
  ]}
  { op:'set' sig:[
    { proto:'(string, any) => interval' desc:'Sets the root value specified by the given path in the first argument the value supplied as the second argument and returns the value that was replaced, if any.' }
  ]}
  { op:'set-defaults' sig:[
    { proto:"('format', string) => any" desc:'Sets the defaults for the given named formatter. Defaults should be passed in as named options that depend on the decorator.' }
    { proto:"('round') => any" desc:'Sets the defaults for rounding operations. Defaults should be passed in as named options, which can be places, all-numeric, and method. 

If a truthy option named context is supplied, the defaults will only be set in the current context and any derived from it in the future. With a context-local round default set, math operations performed in the context or its children will apply rounding as they are performed.

To clear a context-local round default, call this with truthy context and unset named options.' }
    { proto:"('generate') => any" desc:'Sets the defaults for generate operations. Defaults should be passed in as named options, which can be max. The default max is 10000.' }
  ]}
  { op:'similar' sig:[
    { proto:'(string, string, number = 0.5, number = 2) => [string, string, number]' desc:'Finds the first similar substrings within the two given strings based on a threshhold (3rd argument, defaults to 50%) and fudge factor (4th argument, defaults to 2). The two similar substrings are returned in a tuple with the similarity percentage.' }
  ]}
  { op:'similarity' sig:[
    { proto:'(string, string, number = 0.5, number = 2) => number' desc:'Finds the similarity percentage of the first similar substrings within the two given strings using the similar operator.' }
  ]}
  { op:['slice' 'substr'] sig:[
    { proto:'any[] => any[]' desc:'Returns a copy of the given array.' }
    { proto:'(any[], number) => any[]' desc:'Returns a copy of the given array starting from the element at the given index.' }
    { proto:'(any[], number, number) => any[]' desc:'Returns a copy of the given array starting from the element at the given index and ending immediately before the final given index. If the final index is negative, it is an offset from the end of the array.' }
    { proto:'(string, number) => string' desc:'Returns a substring of the given string starting from the character at the given index.' }
    { proto:'(string, number, number) => any[]' desc:'Returns a substring of the given string starting from the character at the given index and ending immediately before the final given index. If the final index is negative, it is an offset from the end of the string.' }
  ]}
  { op:'sort' sig:[
    { proto:'(any[], sort[]) => any[]' desc:'Sorts the given array using the given sort array.

Any array elements that are strings may indicate direction with a leading + or - for ascending and descending, respectively. The remainder of the string is parsed and used as an application.
Any array elements that are applications are applied directly to get a comparison value.
Any arguments that are objects may include a by key with an application value along with asc, desc, or dir flags.
If no sorts are provided, an identity sort will be applied.' }
    { proto:'(object, sort[]) => object' desc:'Sorts the given object keys using the given sort array.

Any array elements that are strings may indicate direction with a leading + or - for ascending and descending, respectively. The remainder of the string is parsed and used as an application.
Any array elements that are applications are applied directly to get a comparison value.
Any arguments that are objects may include a by key with an application value along with asc, desc, or dir flags.
If no sorts are provided, an identity sort will be applied to the keys.' }
  ] opts:[
    { name:'invert' type:'boolean|:first|number[]' desc:'Inverts the result of the sort. If true, all sort segments will be inverted. If an array, each segment index in the array will be inverted. :first is a slightly more clear shorthand for [0]. The special reference, invert, is available to the sort expression during evaluation as true if there is an inversion passed in.' }
  ]}
  { op:'source' sig:[
    { proto:'any => DataSet' desc:'Creates a DataSet from the given value, or returns the value if it is already a DataSet.' }
    { proto:'(any, application) => any' desc:'Creates a DateSet from the given value if it is not already a DataSet, and then sets that as the @source to call the given application. The result of the application is returned.' }
  ]}
  { op:'split' sig:[
    { proto:'string => string[]' desc:'Splits the given string into an array containing each of its characters.' }
    { proto:'(string, string) => string[]' desc:'Splits the given string into an array containing substrings delimited by the second argument.' }
  ]}
  { op:'strict-is' sig:[
    { bin:1 proto:'(any, any) => boolean' desc:'Returns true if the two arguments are the same literal value or are pointers to the same object.' }
    { bin:1 proto:'(any, schema) => boolean' desc:'(Only applies to the \\'strict-is\\' alias) Returns true if the given value strictly conforms to the given schema.' }
  ]}
  { op:'strict-is-not' sig:[
    { bin:1 proto:'(any, any) => boolean' desc:'Returns false if the two arguments are the same literal value or are pointers to the same object.' }
    { bin:1 proto:'(any, schema) => boolean' desc:'(Only applies to the \\'strict-is-not\\' alias) Returns true if the given value does not strictly conform to the given schema.' }
  ]}
  { op:'string' sig:[
    { proto:'any => string' desc:'Politely stringifies the given value, meaning that there are no undefined, null, or object prototype values strings returned.' }
  ] opts: [
    { name:'json' type:'boolean' desc:'Outputs the value as JSON.' }
    { name:'raport' type:'boolean' desc:'Outputs the value as a raport expresion. This can be paired with any options to the stringify function supplied by raport.' }
    { name:'schema' type:'boolean' desc:'Outputs the value as a raport schema.' }
    { name:'base64' type:'booolean' desc:'Outputs the value encoded as base64.' }
    { name:'styled' type:'boolean' desc:'Processes the value as a styled string.' }
    { name:'interval' type:'boolean' desc:'Process the value as a timespan, turning it into a human readable time interval.' }
    { name:'format' type:"'long'|'short'|'timer'|'longtimer'" desc:'When paired with interval, allows changing the format of the human readable timespan.' }
    { name:'precision' type:"'y'|'m'|'d'|'h'|'mm'|'s'|'ms'" desc:'When paired with interval, limit the output to the given unit and every larger unit.' }
  ]}
  { op:'wrap-count' sig:[
    { proto:'string,number?,font?' desc:'Calculates the number of lines that the given string will occupy in the given width in rem using the given font. If the width is not specified, the @widget.width or @placement.availableX will be used. If the font is not specified, the @widget.font will be used. Inherited fonts are not considered.' }
  ] opts: [
    { name:'width' type:'number' desc:'A named version of the second positional argument.' }
    { name:'font' type:'font' desc:'A named version of the third positional argument. This is an object with the relevant parts of the interface conforming to { family?:string, size?:number, line?:number, metric?: number }. family defaults to "sans", size defaults to 0.83, line defaults to size, and metric defaults to the constant pixel width of the font at 16px per em e.g. sans: 7.4, serif: 6.7, mono: 7.85, and narrow: 5.9.' }
    { name:'family' type:'string' desc:'Overrides the given font family.' }
    { name:'size' type:'number' desc:'Overrides the given font size.' }
    { name:'line' type:'number' desc:'Overrides the given font line height.' }
    { name:'metric' type:'string' desc:'Overrides the given font metric.' }
    { name:'break-word' type:'boolean' desc:'Determines whether words that exceed the width should be broken, defaulting to true.' }
  ]}
  { op:'sum' sig:[
    { agg:1 proto: '() => number' desc:'Computes the sum of the current source.' }
    { proto:'number[] => number' desc:'Computes the sum of the given array of numbers.' }
    { proto:'(any[], application) => number' desc:'Computes the sum of the applications for the given array of values.' }
    { agg:1 proto:'application => number' desc:'Computes the sum of the applications for the current source.' }
  ]}
  { op:['time-span' 'time-span-ms'] sig:[
    { proto:'number => number[]' desc:'Returns an array of time units based on options given that represent the number of milliseconds passed as the first argument.' }
    { proto:'(date, date) => number[]' desc:'Returns an array of time units based on options given that represent the distance between the two dates.' }
    { proto:'timespan => number[]' desc:'Returns an array of time units based on options given that represent the distance between the start and end of the given timespan.' }
  ] opts:[
    { name:'unit' type:'string|string[]' desc:"The units desired in the result. This can be either a string or array of strings with the units represented by [y]ears, [M|mo]nths, [w]eeks, [d]ays, [h]ours, [m|mm]inutes, [s]econds, [ms] where 'M' will get months and 'mm' or 'm' not followed by an 'o' will get minutes. The string form can only be used for unambiguous single character units. Units must be specified in descending order by size." }
    { name:'string' type:'boolean' desc:'Causes the output to be a string rather than an array.' }
    { name:'round' type:"'floor'|'ceil'|'round'" desc:"Determines how the results should be rounded. By default they are 'floor'ed, but this can also be 'ceil' or 'round'. Rounding is done based on the next largest available unit after the smallest requested unit e.g. hours if days are requested last or months if years are the only requested unit." }
  ] note:"If there's no way to get an accurate result from the given timespan e.g. you want years or months from a span specified in ms, approximations will be used. The approximations are 365.25 days in a year and 30.45 days in a month." }
  { op:'trim' sig:[
    { proto:'string => string' desc:'Trims whitespace from both ends of the given string.' }
  ]}
  { op:'triml' sig:[
    { proto:'string => string' desc:'Trims whitespace from the beginning of the given string.' }
  ]}
  { op:'trimr' sig:[
    { proto:'string => string' desc:'Trims whitespace from the end of the given string.' }
  ]}
  { op:'unique' sig:[
    { proto:'any[] => any[]' desc:'Returns a copy of the given array with no duplicate elements.' }
    { agg:1 proto:'() => any[]' desc:'Returns a copy of the current source with no duplicate elements.' }
    { proto:'(any[], application) => any[]' desc:'Returns a copy of the given array with no duplicate application results.' }
    { agg:1 proto:'application => any[]' desc:'Returns a copy of the current source with no duplicate application results.' }
  ]}
  { op:'unique-map' sig:[
    { proto:'(any[], application) => any[]' desc:'Returns an array of application results from the given array with no duplicate elements.' }
    { agg:1 proto:'application => any[]' desc:'Returns an array of application results of the current source with no duplicate elements.' }
  ]}
  { op:'unless' sig:[
    { proto:'(...(boolean, any)) => any' desc:'Lazily evaluates each odd argument and returns the first subsequent even argument when a false-y odd argument is found. If no false-y odd argument is found and there is not a final even argument, the final odd argument is returned.' }
  ]}
  { op:'unparse' sig:[
    { proto:'any => string' desc:'Stringifies the given value as a raport expression.' }
  ] opts:[
    { name:'noSymbols' type:'boolean' desc:'If truthy, disables the use of symbol-style strings.' }
    { name:'SExprOps' type:'boolean' desc:'If truthy, renders all operations as S-Expressions rather than sugary raport expressions.' }
    { name:'listCommas' type:'boolean' desc:'If truthy, enables outputting array and argument lists with comma separators.' }
    { name:'listWrap' type:'boolean|number|object' desc:'If a number, sets the target line length before triggering a wrap to a new line for lists of things like arrays, object contents, and operator arguments. If an object, can set individual wrapping targets as booleans or numbers. Available keys in the object for targets are base (that will be used for any other unspecified value), array, union (for type unions in schemas), args (for function call arguments), keys (for object literal contents ), ops (to specify if a binary operator argument is long), and opchain (to specify the number of characters to target when wrapping binary operator chains). If truthy, will wrap lists at a default 60 characters.' }
    { name:'template' type:'boolean' desc:'If truthy, outputs template formatted expressions.' }
    { name:'noIndent' type:'boolean' desc:'If truthy, outputs unindented single-line expressions.' }
    { name:'htmlSafe' type:'boolean' desc:'If truthy, outputs HTML-friendly binary operators.' }
    { name:'noChecks' type:'boolean' desc:'If truthy, outputs schema types without inline checks.' }
    { name:'pipes' type:"'op'|'call'" desc:'If :op, outputs all pipe operations as binary operator chains. If :call, outputs all pipe operators as pipe operator calls. If not supplied, outputs all pipe operations as they were when parsed.' }
    { name:'noArrayLiterals' type:'boolean' desc:'If truthy and combined with SExprOps, outputs arrays as array operator calls rather than literals.' }
    { name:'noObjectLiterals' type:'boolean' desc:'If truthy and combined with SExprOps, outputs objects as object operator calls rather than literals.' }
  ]}
  { op:'upper' sig:[
    { proto:'string => string' desc:'Converts the given string to upper case.' }
  ]}
  { op:'valid' sig:[
    { proto:'(any, schema) => boolean' desc:'Returns true if the given value validates against the given schema.' }
  ] opts:[
    { name:'strict' type:'boolean' desc:'Validate in strict mode rather than the default loose mode.' }
    { name: 'mode' type:"'strict'|'loose'|'missing'" desc:'Sets the mode of validation e.g. strict or loose or missing.'}
  ]}
  { op:'validate' sig:[
    { proto:'(any, schema) => true|error[]' desc:'Returns true if the given value validates against the given schema or an array of errors if it does not.' }
  ] opts:[
    { name:'strict' type:'boolean' desc:'Validate in strict mode rather than the default loose mode.' }
    { name: 'mode' type:"'strict'|'loose'|'missing'" desc:'Sets the mode of validation e.g. strict or loose or missing.'}
  ] note:"The schema of an error is @[{ error: string; type?: 'strict'; path?: string; actual?: string; expected?: string; value?: any }]. If the error is the result of a strict check, the type will be set to 'strict'. The path is the keypath from the root of the given value to the piece of data that caused the error. Missing mode requires that any referenced named types be declared. Strict mode additionally requires that there be no unspecified properties in objects and tuples." }
  { op:'values' sig:[
    { proto:'object => any[]' desc:'Returns an array of all of the values in the given object.' }
  ]}
  { op:'with' sig:[
    { proto:'(object, application) => any' desc:'Evaluates the given application with the given value as the context, returning the result of the application.' }
    { proto:'(object, application, any) => any' desc:'Evaluates the given application with the given value as the context, returning the result of the application. If the value is false-y, the final argument is returned instead.' }
  ]}
]`;

export const formats = `let dateparts = 'Available placeholders are:\\n\\n* y - year\\n* M - month\\n* d - date\\n* E - day of week\\n* H - hour (24 hour)\\n* h or k - hour (12 hour)\\n* m - minute\\n* s - second\\n* S - millisecond\\n* a - AM/PM\\n* z - timezone offset'
[
  { name:'base' desc:'Converts the given number to the given base' opts:[
    { name:'base' req:1 type:'number' desc:'The target base e.g. 2 or 8 or 16.' }
  ]}
  { name:'base64' desc:'Converts the given value to a base64 encoded string.' }
  { name:'case' desc:'Change the casing of the value.' opts:[
    { name:'case' req:1 type:"'upper'|'lower'|'snake'|'kebab'|'pascal'|'camel'|'proper'" desc:'The case format to use.'}
  ]}
  { name:'date' desc:'Formats the value as a date string using placeholder characters, where repeated characters render more descriptive or padded values. Any non-placeholder characters are rendered as entered. The default format is yyyy-MM-dd. Placeholders can be escaped with a \\\\ if the placeholder needs to be included in the output. Available placeholders are:\\n\\n* y - year\\n* M - month\\n* d - date\\n* E - day of week\\n* H - hour (24 hour)\\n* h or k - hour (12 hour)\\n* m - minute\\n* s - second\\n* S - millisecond\\n* a - AM/PM\\n* z - timezone offset' opts:[
    { name:'format' type:'string' desc:'The format template to apply.'}
  ]}
  { name:'dollar' desc:'Formats the value as a dollar amount with two decimal places by default.' opts:[
    { name:'dec' type:'number' desc:'The number of decimal places to render.' }
    { name:'group' type:'string' desc:'The string to use as a grouping divider.' }
    { name:'sign' type:'string' desc:'The currency symbol to render.' }
    { name:'neg' type:"'sign'|'wrap'|'both'" desc:'How to display negative values. Sign shows a leading minus symbol. Wrap wraps the value in parenteses.' }
  ]}
  { name:['hex'] desc:'Formats the given number in hexadecimal, or if the value is not a number, encodes it as string in hexadecimal.' }
  { name:['int' 'integer'] desc:'Formats the value as an integer.' opts:[
    { name:'group' type:'string' desc:'The string to use as a grouping divider.' }
    { name:'neg' type:"'sign'|'wrap'|'both'" desc:'How to display negative values. Sign shows a leading minus symbol. Wrap wraps the value in parenteses.' }
  ]}
  { name:'iso8601' desc:'Formats the value as an ISO-8601 timestamp.' }
  { name:'noxml' desc:'Escapes special XML characters so that the value may be safely rendered into xml.' }
  { name:['num' 'number'] desc:'Formats the value as an number.' opts:[
    { name:'dec' type:'number' desc:'The number of decimal places to render.' }
    { name:'group' type:'string' desc:'The string to use as a grouping divider.' }
    { name:'neg' type:"'sign'|'wrap'|'both'" desc:'How to display negative values. Sign shows a leading minus symbol. Wrap wraps the value in parenteses.' }
  ]}
  { name:'ordinal' desc:'Render the value as an ordinal number.' opts:[
    { name:'group' type:'string' desc:'The string to use as a grouping divider.' }
  ]}
  { name:'phone' desc:'Formats the value as phone number e.g. 111-2222, (111) 222-3333, 1-888-777-6666' }
  { name:'time' desc:'Formats a date value as a time string using placeholder characters, where repeated characters render more descriptive or padded values. Any non-placeholder characters are rendered as entered. The default format is HH:mm:ss. {dateparts}' opts:[
    { name:'format' type:'string' desc:'The format template to apply.'}
  ]}
  { name:'styled' desc:'Processes the value as a styled string.' }
  { name:'timespan' desc:'Formats a timespan as a human readable string.' opts:[
    { name:'precision' type:"'y'|'m'|'d'|'h'|'mm'|'s'|'ms'" desc:'Limit the precision of the output. For instance, to get years down to minutes, pass :mm and seconds and milliseconds will be left off.' }
    { name:'format' type:"'long'|'short'|'timer'|'longtimer'" desc:'Set the format of the output string, where long includes full words, short includes only the unit shorthand, timer presents the hours to milliseconds in a clock format, and timerlong is timer with full names for the days or greater units.' }
  ]}
  { name:'timestamp' desc:'Formats a date value as a timestamp using placeholder characters, where repeated characters render more descriptive or padded values. Any non-placeholder characters are rendered as entered. The default format is yyyy-MM-dd HH:mm:ss. {dateparts}' opts:[
    { name:'format' type:'string' desc:'The format template to apply.'}
  ]}
  { name:'timestamptz' desc:'Formats a date value as a timestamp with timezone offset using placeholder characters, where repeated characters render more descriptive or padded values. Any non-placeholder characters are rendered as entered. The default format is yyyy-MM-dd HH:mm:sszzz. {dateparts}' opts:[
    { name:'format' type:'string' desc:'The format template to apply.'}
  ]}
  { name:'xml' desc:'Converts the given value to XML if possible.' opts:[
    { name:'indent' type:'number' desc:'Indent each successive set of child nodes with this number of spaces.' }
  ]}
   { name:'[operator]' desc:'Calls the named operator as a formatter, passing the target value as the first argument with any arguments to the formatter following. Any set defaults for the formatter are passed as options to the operator.' }
]`;

export const generateMarkdown = `let mkarr = =>if count(_) then _ else [_]

// expand operators such that there is one name per entry
let expandedOps = sort(reduce(operators |a c| =>
  a + map(mkarr(c.op) |o| =>{ op:o alias:filter(mkarr(c.op) =>_ != o) sig:c.sig opts:c.opts note:c.note })
 []) [=>op])

// expand formats such that there is one name per entry
let expandedFormats = sort(reduce(formats |a c| =>
  a + map(mkarr(c.name) |f| =>{ name:f alias:filter(mkarr(c.name) =>_ != f) desc:c.desc opts:c.opts })
 []) [=>name])

 // this is a bit wacky dues to markdown having significant leading space
'
# Raport API

## Operators

{each(expandedOps =>
  '<dl><dt>

### \`{op}\`{if count(alias) then ' (alias {join(map(alias =>'\`{_}\`') ', ')})'}
---

</dt>
<dd>
{if note then '
__NOTE:__ {note}
'}
<dl>
{each(sig =>
  '<dt><code>{proto}</code>{if bin then ' (binary)' elif un then ' (unary)' elif agg then ' (aggregate)'}</dt>
<dd>{desc}</dd>{if eg then each(mkarr(eg) =>'
<dd>e.g. <code>{_}</code></dd>')}
'
)}</dl>
{if count(opts) then '
#### <ins>Options</ins>

<dl>
{each(opts =>'<dt>{join(map(mkarr(name) =>'<code>{_}</code>') ' or ')}</dt><dd>{desc}</dd>')}
</dl>'}
</dl>
<br/>

'
)}

## Formats

{each(expandedFormats =>
  '<dl><dt>

### \`{name}\`{if count(alias) then ' (alias {join(map(alias =>'\`{_}\`') ', ')})'}
---

</dt>
<dd>

{desc}

{if count(opts) then '<dl><dt>

#### <ins>Options</ins>

</dt><dd><dl>

{each(opts =>'<dt><code>{name}</code> - <code>{type}</code></dt><dd>

{desc}

</dd>')}
</dl></dd></dl>'}
</dd></dl>
<br/>

')}
'`;

export function languageReference(zoom = 100, theme = 'dark') {
  return `<html>
<head><title>Raport Expression Language Reference</title>
<style>
  html {
    font-family: sans-serif;
    font-size: ${zoom}%;
  }
  h2 { margin-top: 3em; }
  h3 { margin-top: 1.5em; }
  body { padding: 1em; max-width: 60em; margin: auto; }
  body.dark { color: #ccc; }
  body.light { color: #222; }
  code {
    font-family: monospace;
    padding: 0.4em;
    vertical-align: baseline;
    font-size: 1.1em;
    line-height: 1em;
    box-sizing: border-box;
    display: inline-block;
    border: 1px solid;
  }
  details summary { font-size: 1.2em; font-weight: 600; }
  details table { border-collapse: collapse; margin: 1em; }
  details table td { border: 1px solid; padding: 0.25em; }
  li { margin: 0.5rem 0; line-height: 1.75rem; }
  .dark code { border-color: #777; }
  .light code { border-color: #ddd; }

  div.indent {
    padding-left: 1em;
  }

  .ast-nodes .reference {
    color: #43b;
    font-weight: 500;
  }
  .dark .ast-nodes .reference { color: #98d; }

  .ast-nodes .primitive,
  .ast-nodes .number,
  .ast-nodes .date,
  .ast-nides .timespan {
    color: #087;
    font-weight: 500;
  }
  .dark .ast-nodes .primitive,
  .dark .ast-nodes .number,
  .dark .ast-nodes .date,
  .dark .ast-nodes .timespan {
    color: #0ca;
  }

  .ast-nodes .format-op {
    color: #e81;
  }

  .ast-nodes .string,
  .ast-nodes .string > .ast-extra {
    color: #170;
  }
  .dark .ast-nodes .string,
  .dark .ast-nodes .string > .ast-extra {
    color: #1a0;
  }

  .ast-nodes .string > .string-interpolation {
    font-style: oblique;
  }

  .ast-nodes .binary-op > .ast-extra,
  .ast-nodes .conditional > .ast-extra {
    color: #a66;
  }
  .dark .ast-nodes .binary-op > .ast-extra,
  .dark .ast-nodes .conditional > .ast-extra {
    color: #b88;
  }

  .ast-nodes .typelit,
  .ast-nodes .typelit > .ast-extra {
    color: #361;
  }
  .dark .ast-nodes .typelit,
  .dark .ast-nodes .typelit > .ast-extra {
    color: #491;
  }

  .ast-nodes .typelit .type {
    color: #67f;
    font-weight: 500;
  }

  .ast-nodes .typelit .key,
  .ast-nodes .typelit .literal {
    font-weight: 500;
    color: #557;
  }
  .dark .ast-nodes .typelit .key,
  .dark .ast-nodes .typelit .literal {
    font-weight: 500;
    color: #99b;
  }

  .ast-nodes .typelit .key {
    color: #b61;
  }

  .ast-nodes .typelit .condition {
    font-weight: 700;
  }

  .ast-nodes .ast-fail {
    color: #f00;
  }

  .ast-nodes .interpolator,
  .ast-nodes .each-block > .ast-extra,
  .ast-nodes .if-block > .ast-extra,
  .ast-nodes .unless-block > .ast-extra,
  .ast-nodes .case-block > .ast-extra,
  .ast-nodes .with-block > .ast-extra {
    font-weight: 600;
  }

  .ast-nodes .each-block > .ast-extra {
    color: #167;
  }
  .dark .ast-nodes .each-block > .ast-extra {
    color: #4bc;
  }

  .ast-nodes .case-block > .ast-extra,
  .ast-nodes .unless-block > .ast-extra,
  .ast-nodes .if-block > .ast-extra {
    color: #189;
  }
  .dark .ast-nodes .case-block > .ast-extra,
  .dark .ast-nodes .unless-block > .ast-extra,
  .dark .ast-nodes .if-block > .ast-extra {
    color: #1de;
  }

  .ast-nodes .with-block > .ast-extra {
    color: #145;
  }
  .dark .ast-nodes .with-block > .ast-extra {
    color: #29c;
  }

  .ast-nodes .interpolator > .ast-extra {
    color: #555;
  }
  .dark .ast-nodes .interpolator > .ast-extra {
    color: #ccc;
  }
</style>
</head>
<body class="${theme}">

<h2 id="raport-expression-language-reference" style="text-align: center; margin-top: 1rem;">Raport Expression Language Reference</h2>
<p>As implied by Raport Expression Language (REL), the language is composed entirely of expessions. There are no statements. The expressions are composed only of operations and values.</p>
<h2 id="syntax">Syntax</h2>
<div class=indent>
<p>The root syntax is based on LISP, but the most common usage relies on sugared syntax that more closely resembles other common languages. The general LISP-y syntax is <code>([operator] ...args)</code>, where <code>args</code> are values or operations. The default parser will accept multiple expressions in sequence and automatically wrap them in a <code>block</code> operation.</p>
</div>

<h2 id="values">Values</h2>
<div class=indent>
<p>Built-in data types include numbers, strings, booleans, objects, arrays, applications, null, undefined, dates, and schemas. There is also a range pseudo-value available to certain operators that automaically parse it from a string in certain circumstances.</p>
<h3 id="numbers">Numbers</h3>
<p>Numbers may have an optional leading <code>-</code>, one or more digits, optionally separated by <code>_</code>, an optional <code>.</code> followed by one or more digits, optionally separated by <code>_</code>, and an optional <code>e</code> followed by an optional <code>-</code> and one or more digits, optionally separated by <code>_</code>.</p>
<p>Example: <code><span class=ast-nodes><span class="number">1</span></span></code>, <code><span class=ast-nodes><span class="number">-1</span></span></code>, <code><span class=ast-nodes><span class="number">0.1</span></span></code>, <code><span class=ast-nodes><span class="number">-0.1</span></span></code>, <code><span class=ast-nodes><span class="number">111_000</span></span></code>, <code><span class=ast-nodes><span class="number">-5_0</span></span></code>, <code><span class=ast-nodes><span class="number">3.14159e-10</span></span></code></p>
<h3 id="strings">Strings</h3>
<p>Strings come in five different flavors: symbolic, single-quoted with optional interpolation, quoted, triple-quoted, and inline template. The symbolic form is constructed of a leading <code>:</code> followed by one or more characters that is not whitespace or one of <code>():{}[]&lt;&gt;,;\\&amp;#</code> or a quote.</p>
<p>Single-quoted strings may be quoted with <code>&#39;</code> or <code>&#96;</code>, and interpolators are contained within <code>{}</code>, optionally prefixed with <code>$</code>.</p>
<p>Triple quoted strings start and end with a matching set of three matching quote characters. Non-interpolated triple quoted strings start and end with <code>&quot;&quot;&quot;</code>. Interpolated triple quoted strings start and end with either <code>&#39;&#39;&#39;</code> or <code>&#96;&#96;&#96;</code>. The non-interpolated form is particularly useful for pasting small data sets from markdown tables, csv, or CLI command output like psql data into an expression without having to worry about escaping quotes.</p>
<p>Quoted strings may have any character within escaped with <code>\\</code>, including the interpolation delimiters within single-quoted strings. Any characters that are not the terminating quote are included in the string, including newlines.</p>
<p>Inline templates enable using REL templates directly within an expression. They are particularly useful for more conveniently converting a set of data into a structured string, like HTML. Inline templates start and end with <code>$$$</code>, and everything between those delimiters is parsed with the template parser, meaning interopolators and <code>if</code>, <code>each</code>, <code>with</code>, <code>case</code>, and <code>unless</code> blocks are available.</p>
<p>Example: <code><span class=ast-nodes><span class="string">:foo22</span></span></code>, <code><span class=ast-nodes><span class="string">'test string'</span></span></code>, <code><span class=ast-nodes><span class="string">&quot;test string&quot;</span></span></code>, <code><span class=ast-nodes><span class="string"><span class="ast-extra">'an </span><span class="string-interpolation"><span class="ast-extra">{</span><span class="reference">interpolated</span><span class="ast-extra">}</span></span><span class="ast-extra"> string'</span></span></span></code></p>
<h3 id="booleans">Booleans</h3>
<p><code><span class="ast-nodes"><span class="primitive">true</span></span></code> and <code><span class="ast-nodes"><span class="primitive">false</span></span></code>. REL uses truthiness so as not to require explicit conversion of values to booleans. Anything that is not <code><span class="ast-nodes"><span class="primitive">null</span></span></code>, <code><span class="ast-nodes"><span class="primitive">undefined</span></span></code>, <code><span class="ast-nodes"><span class="primitive">false</span></span></code>, <code><span class="ast-nodes"><span class="number">0</span></span></code>, <code>NaN</code>, or an empty string is considered equivalent to <code><span class="ast-nodes"><span class="primitive">true</span></span></code>.</p>
<h3 id="objects">Objects</h3>
<p>Object literals consist of key/value pairs contained within <code>{}</code>s. Keys may be quoted, though it&#39;s only necessary for non-symbolic names or interpolation. Key/value pairs may be separated with <code>,</code>s, and the last pair may have a trailing <code>,</code>.</p>
<p>Example: <code><span class="ast-nodes"><span class="object"><span class="ast-extra">{ foo:</span><span class="string">:bar</span><span class="ast-extra"> baz:</span><span class="string">'bat'</span><span class="ast-extra"> bip:</span><span class="binary-op"><span class="reference">bop</span><span class="ast-extra"> * </span><span class="number">22</span></span><span class="ast-extra"> </span><span class="string">'some str'</span><span class="ast-extra">:</span><span class="number">99</span><span class="ast-extra"> </span><span class="string"><span class="ast-extra">'nine</span><span class="string-interpolation"><span class="ast-extra">{</span><span class="binary-op"><span class="number">9</span><span class="ast-extra"> + </span><span class="number">1</span></span><span class="ast-extra">}</span></span><span class="ast-extra">'</span></span><span class="ast-extra">:</span><span class="number">19</span><span class="ast-extra"> }</span></span></span></code></p>
<h3 id="arrays">Arrays</h3>
<p>Array literals consist of values contained within <code>[]</code>s. Values may be separated by <code>,</code>s, and the last value may have a trailing <code>,</code>.</p>
<p>Example: <code><span class="ast-nodes"><span class="array"><span class="ast-extra">[</span><span class="string">:a</span><span class="ast-extra"> </span><span class="string">:b</span><span class="ast-extra"> </span><span class="string">:c</span><span class="ast-extra"> </span><span class="number">1</span><span class="ast-extra"> </span><span class="number">2</span><span class="ast-extra"> </span><span class="number">3</span><span class="ast-extra">]</span></span></span></code></p>
<h3 id="applications">Applications</h3>
<p>An application is an expression that isn&#39;t immediately evaluated. Applications may optionally start with an argument list with named arguments listed between <code>||</code>s, then a required big arrow <code>=&gt;</code>, and an expression that may be enclosed in a block.</p>
<p>Example: <code><span class="ast-nodes"><span class="application"><span class="ast-extra">=&gt; </span><span class="binary-op"><span class="reference">_</span><span class="ast-extra"> + </span><span class="number">10</span></span></span></span></code>, <code><span class="ast-nodes"><span class="application"><span class="ast-extra">|a b c| =&gt; </span><span class="binary-op"><span class="reference">a</span><span class="ast-extra"> * </span><span class="reference">b</span><span class="ast-extra"> + </span><span class="reference">c</span></span></span></span></code></p>
<h3 id="null">Null</h3>
<p><code><span class="ast-nodes"><span class="primitive">null</span></span></code>. Null in a language with <code><span class="ast-nodes"><span class="primitive">undefined</span></span></code> is a bit of a strange concept, but it can be useful as a sort of &quot;this field intentionally left blank&quot; indicator. It also survives in JSON.</p>
<h3 id="undefined">Undefined</h3>
<p><code><span class="ast-nodes"><span class="primitive">undefined</span></span></code>. This will be omitted in JSON.</p>
<h3 id="dates">Dates</h3>
<p>Date literals include single dates, date ranges, and intervals of time. Dates are specified in a relaxed ISO-8601 format enclosed in <code>##</code>s. A date that isn&#39;t specified down to the millisecond is a range from the start of the specified time to the end e.g. <code><span class="ast-nodes"><span class="date">#2022-01-01#</span></span></code> spans from midnight to a millisecond before midnight on 2022-01-02. When dates are converted to an instant, the default is to resolve to the start of the range. To default to the end of the range, there can be a <code>&lt;</code> immediately before the closing <code>#</code>.</p>
<p>Example: <code><span class="ast-nodes"><span class="date">#2020#</span></span></code>, <code><span class="ast-nodes"><span class="date">#1999-01-01 17:45#</span></span></code>, <code><span class="ast-nodes"><span class="date">#1970-06-15T00:00:01.443+04:30#</span></span></code></p>
<p>Intervals are also specified enclosed in <code>##</code>s with each portion of the interval, optionally separated by spaces. Intervals may include years, months, weeks, days, hours, minutes, seconds, and milliseconds.</p>
<p>Example: <code><span class="ast-nodes"><span class="date">#2 years#</span></span></code>, <code><span class="ast-nodes"><span class="date">#5M3d#</span></span></code>, <code><span class="ast-nodes"><span class="date">#15 weeks 2 days 9 minutes 17 seconds#</span></span></code></p>
<p>There are also a few special relative dates available: <code><span class="ast-nodes"><span class="date">#yesterday#</span></span></code>, <code><span class="ast-nodes"><span class="date">#today#</span></span></code>, <code><span class="ast-nodes"><span class="date">#tomorrow#</span></span></code>, <code><span class="ast-nodes"><span class="date">#last week#</span></span></code>, <code><span class="ast-nodes"><span class="date">#this week#</span></span></code>, <code><span class="ast-nodes"><span class="date">#next week#</span></span></code>, <code><span class="ast-nodes"><span class="date">#last month#</span></span></code>, <code><span class="ast-nodes"><span class="date">#this month#</span></span></code>, <code><span class="ast-nodes"><span class="date">#next month#</span></span></code>, <code><span class="ast-nodes"><span class="date">#last year#</span></span></code>, <code><span class="ast-nodes"><span class="date">#this year#</span></span></code>, and <code><span class="ast-nodes"><span class="date">#next year#</span></span></code>. Like the ISO-ish dates, these are ranges that cover their narrowest specification, so last week is from midnight on the first day of the week to the last millisecond of the last day of the week.</p>
<h3 id="schemas">Schemas</h3>
<p>Schemas describe the type structure of a value. They consist of any number of type definitions followed by the root definition and are contained within <code>@[]</code>.</p>
<ul>
<li>Built-in primitive types include <code>number</code>, <code>string</code>, <code>boolean</code>, <code>date</code>, and <code>any</code>.</li>
<li>Types may also be followed by <code>[]</code> to indicate an array of that type of any length e.g. <code>string[]</code>. Complex array types may also be specified by wrapping a type within an <code>Array&lt;&gt;</code> e.g. <code>Array&lt;string|number&gt;</code>.</li>
<li>Literal values are also accepted as types e.g. <code>12</code> is a type that only matches the number <code>12</code>, and <code>&#39;yes&#39;</code> is a type that only matches the string <code>&quot;yes&quot;</code>.<ul>
<li>Other supported literal values are <code>true</code>, <code>false</code>, <code>null</code>, and <code>undefined</code>.</li>
</ul>
</li>
<li>Tuple types are composed of an array literal of other types e.g. <code>[number number boolean]</code> will match the value <code>[10 12 false]</code>.</li>
<li>Type unions are composed by separating types with a <code>|</code> e.g. <code>string|number</code> will match a string or number.</li>
<li>Object types are specified as object literals with types as the values of their pairs e.g. <code>{ a:number b:string }</code> will match the value <code>{ a:21 b::sure }</code>.<ul>
<li>Any key within an object type may be marked as optional by following its name with a <code>?</code> e.g. <code>{ a:number b?:date }</code> will match the value <code>{ a:21 }</code>.</li>
<li>All remaining keys can be matched with the special key <code>...</code> to ensure that any other keys within an object match a certain type e.g. <code>{ a:number ...:string }</code> will match any object with an <code>a</code> key that is a number and all other keys, if any, that have string values.</li>
</ul>
</li>
<li>Type aliases may be defined using the <code>type</code> keyword followed by a name and a definition e.g. <code>type Foo = { a:number b:string }</code>, followed by at least one whitespace or <code>;</code>. Type aliases may be used anywhere a primitive type would be, including in unions, tuples, and with array specifiers.</li>
<li>Any type may have conditions that are specified as applications that receive the value being validated and return true or false. Conditions are specified with a trailing <code>?</code> and application e.g. <code>type LargeNumber = number ? =&gt; _ &gt; 100000000</code>. More than one condition may be applied to a type.</li>
</ul>
<p>Example: <code><span class="ast-nodes"><span class="typelit"><span class="ast-extra">@[</span><span class="type">number</span><span class="ast-extra">|</span><span class="type">string</span><span class="ast-extra">]</span></span></span></code>, <code><span class="ast-nodes"><span class="typelit"><span class="ast-extra">@[type </span><span class="type">Foo</span><span class="ast-extra"> = { </span><span class="key">t</span><span class="ast-extra">:</span><span class="literal">'strings'</span><span class="ast-extra">, ...:</span><span class="type">string</span><span class="ast-extra"> }; type </span><span class="type">Bar</span><span class="ast-extra"> = { </span><span class="key">t</span><span class="ast-extra">:</span><span class="literal">'numbers'</span><span class="ast-extra">, ...:</span><span class="type">number</span><span class="ast-extra"> }; Array&lt;</span><span class="type">Foo</span><span class="ast-extra">|</span><span class="type">Bar</span><span class="ast-extra">&gt;]</span></span></span></code></p>
<h3 id="ranges">Ranges</h3>
<p>Ranges don&#39;t have any special syntax built directly into REL, but there is a built-in parser that several operators use to see if numbers fall into ranges. The range itself is an array of arrays or numbers, where a number is considered to be in the range if it appears directly in the array or in the inclusive range bounded by the first and second elements of an inner array. The components of a range may be specified by any of the following, separated by whitespace and optionally <code>,</code>s:</p>
<ul>
<li>Any integer, indicating exactly that integer</li>
<li>Two integers with nothing but a <code>-</code> between them, indicating any number that falls within the inclusive range of the left and right integer</li>
<li>a <code>&lt;</code> followed by an integer with optional preceding whitespace, indicating any number less than the integer</li>
<li>a <code>&gt;</code> followed by an integer with optional preceding whitespace, indicating any number greater than the integer</li>
<li>a <code>!</code> followed by any of the preceding range types, indicating that the range type should be excluded from the range</li>
<li>a <code>*</code>, indicating any number</li>
</ul>
<p>Exmaple: <code><span class="ast-nodes"><span class="string">'1, 3, 5, 7, &gt;10'</span></span></code>, <code><span class="ast-nodes"><span class="string">'22-33 44 55-66'</span></span></code>, <code><span class="ast-nodes"><span class="string">'1-100 !23 !34 !88'</span></span></code></p>
</div>

<h2 id="references">References</h2>
<div class=indent>
<p>REL is built around contexts that are somewhat analogous to stack frames that have an inherent base value. When an expression is being evaluated there is usually some value that is currently in scope as the focus of the context. The value of at the base of the current scope is available as the special reference <code><span class="ast-nodes"><span class="reference">@value</span></span></code> or <code>_</code>. If the value happens to have properties, they can be referenced directly by their names e.g. in a context with a value of <code>{ foo: 21, bar: 22 }</code>, the reference <code><span class="ast-nodes"><span class="reference">foo</span></span></code> will resolve to <code>21</code> when evaluated.</p>
<p>Each context also has a local lexical scope attached to it that is not directly connected with the underlying data in the context. This allows for passing named arguments to applications or utiliyzing locally scoped variables without clobbering the associated data in the context. Some operators will introduce a new lexical scope while retaining the exising context, while others may introduce both a new context and a new lexical scope.</p>
<p>If the value resolved by a reference happens to have a nested structure built of objects and/or arrays, further children of the primary property can be accessed using dotted path or bracketed path notation e.g. <code><span class="ast-nodes"><span class="reference">foo.bar</span></span></code>, <code><span class="ast-nodes"><span class="reference">array.1.prop</span></span></code> or <code><span class="ast-nodes"><span class="reference"><span class="ast-extra">array[</span><span class="number">1</span><span class="ast-extra">].prop</span></span></span></code>, and <code><span class="ast-nodes"><span class="reference"><span class="ast-extra">foo[</span><span class="binary-op"><span class="string">:ba</span><span class="ast-extra"> + </span><span class="string">:r</span></span><span class="ast-extra">]</span></span></span></code>. The bracketed notation allows for expressions to be used when resolving names. References are always resolved safely to <code>undefined</code>, so doing something like <code><span class="ast-nodes"><span class="binary-op"><span class="object"><span class="ast-extra">{ foo:</span><span class="string">:bar</span><span class="ast-extra"> }</span></span><span class="ast-extra">.baz.bat</span></span></span></code> does not cause an error.</p>
<p>Backeted path notation also allows for some special handling of strings and arrays by way of ducking indices. Adding a <code><span class="ast-nodes"><span class="ast-extra">&lt;</span></span></code> before the closing bracket (and making the index look like a duck or pointing the direction that index will start from) makes the index relative to the end of value rather than the beginning e.g. <code><span class="ast-nodes"><span class="ast-extra"><span class="string">'abcdefg'</span>[<span class="number">0</span>&lt;]</span></span></code> returns <code><span class="ast-nodes"><span class="string">'g'</span></span></code>, since <code><span class="ast-nodes"><span class="string">'g'</span></span></code> is the 0th character from the end of <code><span class="ast-nodes"><span class="string">'abcdefg'</span></span></code>. Similarly, <code><span class="ast-nodes"><span class="ast-extra">[<span class="number">0 1 2 3</span>][<span class="number">1</span>&lt;]</span></span></code> results in <code><span class="ast-nodes"><span class="number">2</span></span></code>, because that is the 1st element from the end of the array. Arrays and strings also support a second index in their bracketed paths, which will result in slicing the value from the first index to the second index, inclusive. This also preserves the order of elements/characters requested in the slice, so <code><span class="ast-nodes"><span class="ast-extra"><span class="string">'abcdefg'</span>[<span class="number">0</span>&lt; <span class="number">2</span>]</span></span></code> results in <code><span class="ast-nodes"><span class="string">'gfedc'</span></span></code>. Either index can be ducked, and ducking can be applied to any expression, including references. If either of the indices exceeds the range of its value, the range will be clamped to the bounds of the value e.g. <code><span class="ast-nodes"><span class="ast-extra"><span class="string">'123'</span>[<span class="number">100</span>&lt; <span class="number">100</span>]</span></span></code> will result in <code><span class="ast-nodes"><span class="string">'123'</span></span></code>. Any amount of whitespace may appear between a duck index and its bill.</p>
<p>Bracketed path notation also allows for slicing of objects when an array of strings is passed as an index. When given an array of strings, an shallow copy of the object being accessed will be returned, and it will only contain keys that exist in both the object being accessed and the array of strings used as the index.</p>
<p>Any variables defined in the lexical scope will take precedent over values of the same name in the local context. To access a value in the context that has the same name as a local variable, you can start from the context special reference e.g. <code><span class="ast-nodes"><span class="reference">_.foo</span></span></code> would refer to the context <code>foo</code> value where <code><span class="ast-nodes"><span class="reference">foo</span></span></code> refers to a local variable.</p>
<h3 id="prefixes">Prefixes</h3>
<p>As indicated above, there are certain special references available in certain contexts. These references have the prefix <code>@</code>, and <code><span class="ast-nodes"><span class="reference">@value</span></span></code> is always available. Another example of a special reference is <code><span class="ast-nodes"><span class="reference">@index</span></span></code>, which is often available in contexts where iteration is taking place.</p>
<p>Report definitions may include named parameters that are kept in a separate namespace from the report root context value. These values are available in any context by prefixing their name with a <code>!</code> e.g. <code><span class="ast-nodes"><span class="reference">!date</span></span></code> would resolve the value passed for the <code>date</code> parameter.</p>
<p>Parent contexts are also available from their children by applying the context pop prefix <code>^</code> one or more times to a reference e.g. <code><span class="ast-nodes"><span class="reference">^foo</span></span></code> will resolve to whatever <code><span class="ast-nodes"><span class="reference">foo</span></span></code> would resolve to in the parent context, and <code><span class="ast-nodes"><span class="reference"><span class="ast-extra">^^^foo.bar[</span><span class="number">9</span><span class="ast-extra">]</span></span></span></code> will resolve to whatever <code><span class="ast-nodes"><span class="reference"><span class="ast-extra">foo.bar[</span><span class="number">9</span><span class="ast-extra">]</span></span></span></code> would resolve to in the great-grandparent context.</p>
<p>The root context value is also available in any context by prefixing a reference with the root context prefix <code>~</code> e.g. <code><span class="ast-nodes"><span class="reference">~foo.bar</span></span></code> will resolve to <code><span class="ast-nodes"><span class="reference">foo.bar</span></span></code> in the root context.</p>
<p>Report definitions may include named data sources that are kept in a separate namespace from the report root context value.  These data sources are available in any context by prefixing their name with a <code>*</code> e.g. <code><span class="ast-nodes"><span class="reference">*people</span></span></code> would resolve to the data passed or retrieved for the <code>people</code> data source.</p>
<details id="special-references"><summary>Special References</summary>
  <table>
  <thead>
    <tr><th>Reference</th><th>Scope</th><th>Value</th></tr>
  </thead>
  <tbody>
  <tr>
    <td>@value</td>
    <td>any</td>
    <td>The value of the current context. This is useful for passing the whole value of a context as an argument.</td>
  </tr>
  <tr>
    <td>@options</td>
    <td>operator</td>
    <td>The named arguments passed to the nearest operation in the context stack.</td>
  </tr>
  <tr>
    <td>@arguments</td>
    <td>application operator</td>
    <td>The arguments passed to the nearest application called as an operator in the context stack.</td>
  </tr>
  <tr>
    <td>@index</td>
    <td>repeater, each</td>
    <td>The index of the nearest iteration.</td>
  </tr>
  <tr>
    <td>@key</td>
    <td>repeater, each</td>
    <td>The key of the nearest iteration. For array iteration, this is the same as the <code>@index</code>.</td>
  </tr>
  <tr>
    <td>@last</td>
    <td>repeater, each</td>
    <td>The index of the final nearest iteration.</td>
  </tr>
  <tr>
    <td>@last-key</td>
    <td>repeater, each</td>
    <td>The key of the nearest final iteration. For array iteration, this is the same as the <code>@last</code>.</td>
  </tr>
  <tr>
    <td>@count</td>
    <td>repeater, each</td>
    <td>The total number of iterations for the nearest iterable.</td>
  </tr>
  <tr>
    <td>@case</td>
    <td>case condition</td>
    <td>The value that is being checked against the conditional branches.</td>
  </tr>
  <tr>
    <td>@pipe</td>
    <td>pipe arguments</td>
    <td>The value from the previous piped argument.</td>
  </tr>
  <tr>
    <td>@sources</td>
    <td>any</td>
    <td>The root context sources.</td>
  </tr>
  <tr>
    <td>@parameters</td>
    <td>any</td>
    <td>The root context parameters.</td>
  </tr>
  <tr>
    <td>@local</td>
    <td>any</td>
    <td>The locals for the immediate context.</td>
  </tr>
  <tr>
    <td>@locals</td>
    <td>any</td>
    <td>The locals for the nearest context that has any.</td>
  </tr>
  <tr>
    <td>@special</td>
    <td>any</td>
    <td>The specials for the immediate context.</td>
  </tr>
  <tr>
    <td>@specials</td>
    <td>any</td>
    <td>The specials for the nearest context that has any.</td>
  </tr>
  <tr>
    <td>@group</td>
    <td>repeater</td>
    <td>The nearest group by value, if any.</td>
  </tr>
  <tr>
    <td>@grouped</td>
    <td>repeater</td>
    <td>Whether the current context is within a group.</td>
  </tr>
  <tr>
    <td>@level</td>
    <td>repeater</td>
    <td>The nearest group level, if any.</td>
  </tr>
  <tr>
    <td>@source</td>
    <td>source, repeater</td>
    <td>The nearest source, if any.</td>
  </tr>
  <tr>
    <td>@values</td>
    <td>repeater</td>
    <td>An object with keys pointing to an array of values collected from labels in the repeater ids mapping to keys.</td>
  </tr>
  <tr>
    <td>@placement</td>
    <td>width, height, margin, hide, br expressions</td>
    <td>The computed placement for the widget for which the property is being computed.</td>
  </tr>
  <tr>
    <td>@widget</td>
    <td>widgth, height, margin, hide, br expressions</td>
    <td>The widget definition for the widget for which the property is being computed.</td>
  </tr>
  <tr>
    <td>@page</td>
    <td>page header, footer, watermark, and overlay</td>
    <td>The current page number being rendered, starting with <code>1</code>.</td>
  </tr>
  <tr>
    <td>@pages</td>
    <td>page header, footer, watermark, and overlay</td>
    <td>The number of pages in the report output.</td>
  </tr>
  <tr>
    <td>@size</td>
    <td>page header, footer, watermark, and overlay</td>
    <td>An object with <code>x</code> and <code>y</code> properties corresponding to the usable width and height of the page.</td>
  </tr>
  </tbody>
  </table>
</details>
</div>

<h2 id="comments">Comments</h2>
<div class=indent>
<p>Any expression may be preceeded by any number of line comments, which start with <code>//</code> and include any subsequent characters up to a newline. The final line may not be comment, as comments must be followed by an expression.</p>
<p>Example: <pre><code><span class="ast-nodes"><span class="comment">// add a and b
</span><span class="binary-op"><span class="reference">a</span><span class="ast-extra"> + </span><span class="reference">b</span></span></span></code></pre></p>
</div>

<h2 id="variables">Variables</h2>
<div class=indent>
<p>Most of the data accessed in REL comes from a data source, and as such, it doesn&#39;t often make sense to change any values. There are some cases where local variables can be quite useful to allow breaking up complex calculations into steps or to foward an alias into an algorithm. For these purposes, REL has <code>let</code> and <code>set</code> operators, which change a value in the local lexical scope and local context, respectively. The <code>let</code> operator works with the <code>^</code> prefix to allow accessing parent scopes. The <code>set</code> operator works with <code>~</code> and <code>^</code> prefixes to allow working with the root and parent contexts.</p>
<p>Example: <code><span class="ast-nodes"><span class="let"><span class="ast-extra">let </span><span class="reference">foo</span><span class="ast-extra"> = </span><span class="number">10</span></span></span></code>, <code><span class="ast-nodes"><span class="set"><span class="ast-extra">set </span><span class="reference">~name</span><span class="ast-extra"> = </span><span class="string">:Joe</span></span></span></code>, <code><span class="ast-nodes"><span class="let"><span class="ast-extra">let </span><span class="reference">^^type</span><span class="ast-extra"> = </span><span class="object"><span class="ast-extra">{ size: </span><span class="number">22</span><span class="ast-extra">, id:</span><span class="string">:1</span><span class="ast-extra"> }</span></span></span></span></code></p>
</div>

<h2 id="operations">Operations</h2>
<div class=indent>
<p>Operators are the foundational component of REL, as everything within REL other than a few of the primitive literals, references, and comments are built as operators. An operator may be called using LISP syntax, call syntax, or in many cases special syntax such as unary or binary syntax. The following are equivalent:</p>
<ul>
<li><code><span class="ast-nodes"><span class="s-expression"><span class="ast-extra">(if </span><span class="binary-op"><span class="reference">foo</span><span class="ast-extra"> &gt; </span><span class="number">10</span></span><span class="ast-extra"> </span><span class="string">:large</span><span class="ast-extra"> </span><span class="binary-op"><span class="reference">foo</span><span class="ast-extra"> &lt; </span><span class="number">5</span></span><span class="ast-extra"> </span><span class="string">:small</span><span class="ast-extra"> </span><span class="string">:medium</span><span class="ast-extra">)</span></span></span></code></li>
<li><code><span class="ast-nodes"><span class="call"><span class="ast-extra">if(</span><span class="binary-op"><span class="reference">foo</span><span class="ast-extra"> &gt; </span><span class="number">10</span></span><span class="ast-extra"> </span><span class="string">:large</span><span class="ast-extra"> </span><span class="binary-op"><span class="reference">foo</span><span class="ast-extra"> &lt; </span><span class="number">5</span></span><span class="ast-extra"> </span><span class="string">:small</span><span class="ast-extra"> </span><span class="string">:medium</span><span class="ast-extra">)</span></span></span></code></li>
<li><code><span class="ast-nodes"><span class="conditional"><span class="ast-extra">if </span><span class="binary-op"><span class="reference">foo</span><span class="ast-extra"> &gt; </span><span class="number">10</span></span><span class="ast-extra"> then </span><span class="string">:large</span><span class="ast-extra"> elif </span><span class="binary-op"><span class="reference">foo</span><span class="ast-extra"> &lt; </span><span class="number">5</span></span><span class="ast-extra"> then </span><span class="string">:small</span><span class="ast-extra"> else </span><span class="string">:medium</span></span></span></code></li>
<li><code><span class="ast-nodes"><span class="conditional"><span class="ast-extra">if </span><span class="binary-op"><span class="reference">foo</span><span class="ast-extra"> &gt; </span><span class="number">10</span></span><span class="ast-extra"> </span><span class="block"><span class="ast-extra">{ </span><span class="string">:large</span><span class="ast-extra"> }</span></span><span class="ast-extra"> elif </span><span class="binary-op"><span class="reference">foo</span><span class="ast-extra"> &lt; </span><span class="number">5</span></span><span class="ast-extra"> </span><span class="block"><span class="ast-extra">{ </span><span class="string">:small</span><span class="ast-extra"> }</span></span><span class="ast-extra"> else </span><span class="block"><span class="ast-extra">{ </span><span class="string">:medium</span><span class="ast-extra"> }</span></span></span></span></code></li>
</ul>
<p>Most operators are limited to LISP and call syntax because that&#39;s how they&#39;re most reasonably used. <code>+</code>, <code>-</code>, and <code>not</code> are available as unary operators. Supported binary operators in order of precedence are pipe (<code>|</code>), exponentiation (<code>**</code>), mutiplication/division/modulus/int division (<code>*</code>, <code>/</code>, <code>%</code>, <code>/%</code>), addition/subtraction (<code>+</code>, <code>-</code>), comparison (<code>&gt;=</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&lt;</code>, <code>ilike</code>, <code>in</code>, <code>like</code>, <code>not-ilike</code>, <code>not-like</code>, <code>not-in</code>, <code>contains</code>, <code>does-not-contain</code>, <code>gt</code>, <code>gte</code>, <code>lt</code>, <code>lte</code>), equality (<code>is</code>, <code>is-not</code>, <code>==</code>, <code>!=</code>, <code>deep-is</code>, <code>deep-is-not</code>, <code>strict-is</code>, <code>strict-is-not</code>, <code>===</code>, <code>!==</code>), boolean and (<code>and</code>, <code>&amp;&amp;</code>), boolean or (<code>or</code>, <code>\|\|</code>) and nullish coalescing (<code>??</code>). At least one space is required on either side of a binary operator, unless it is symbolic, in which case it must have either zero spaces on either side or at least one space on either side.</p>
<p>Most operators take a number of arguments, which are passed within their <code>()</code>s. Some operators will evaluate their arguments lazily, like <code>and</code> and <code>or</code>, and others will evaluate all of their arguments before processing them. Some operators will implicitly operate on their nearest data source, and these are internally configured as aggregate operators, including <code>sum</code> and <code>avg</code>.</p>
<p>Call operations may be attached to a reference such that the reference further refines the result of the call operation.</p>
<p>Example: <code><span class="ast-nodes"><span class="binary-op"><span class="call"><span class="ast-extra">find(</span><span class="reference">list</span><span class="ast-extra"> </span><span class="application"><span class="ast-extra">=&gt;</span><span class="binary-op"><span class="call"><span class="ast-extra">len(</span><span class="reference">parts</span><span class="ast-extra">)</span></span><span class="ast-extra"> &gt; </span><span class="number">10</span></span></span><span class="ast-extra">)</span></span><span class="ast-extra">.name</span></span></span></code></p>
<h3 id="named-arguments">Named arguments</h3>
<p>Operators that are called in LISP or call syntax may also accept named arguments that are specified as key/value pairs at the end of the argument list. These are often used to control specialized behavior or the operator using flags that would otherwise be cumbersome as positional arguments e.g. <code><span class="ast-nodes"><span class="call"><span class="ast-extra">parse(</span><span class="string">'1 3 5 7'</span><span class="ast-extra"> range:</span><span class="number">1</span><span class="ast-extra">)</span></span></span></code>, which asks the <code>parse</code> operator to parse the given string as a range rather than the default REL expression.</p>
<h3 id="formats">Formats</h3>
<p>There is a built-in format operator that formats values as strings using registered formatters. One example is the <code>date</code> formatter that outputs <code>date</code> values as strings in the <code>yyyy-MM-dd</code> format by default. It can also accept an argument that specifies the format to use when converting the date to a string. The <code>format</code> operator can be called explicitly or, since formatting values as strings is a fairly common need, using a special postfix format operation syntax that is a <code>#</code> followed by the name of the formatter and optionally any argument expressions separated by <code>,</code>s with no whitespaces. The arguments to a postfix format may also be surrounded with parentheses, which also enables passing named arguments. The following are equivalent:</p>
<ul>
<li><code><span class="ast-nodes"><span class="call"><span class="ast-extra">format(</span><span class="reference">@date</span><span class="ast-extra"> </span><span class="string">:date</span><span class="ast-extra"> </span><span class="string">'MM/dd/yyyy'</span><span class="ast-extra">)</span></span></span></code></li>
<li><code><span class="ast-nodes"><span class="binary-op"><span class="reference">@date</span><span class="format-op"><span class="ast-extra">#date,</span><span class="string">'MM/dd/yyyy'</span></span></span></span></code></li>
<li><code><span class="ast-nodes"><span class="binary-op"><span class="reference">@date</span><span class="format-op"><span class="ast-extra">#date(</span><span class="string">:MM/dd/yyyy</span><span class="ast-extra">)</span></span></span></span></code></li>
</ul>
<p>Any format expression that calls a formatter that is not registered will look for an operator with a matching name. If one is found, the matching operator will be called with the format value as the first argument, the format arguments as successive arguments, and any named arguments passed through.</p>
<p>If no registered formatters or matching operators are found, the format operator will return its passed value directly.</p>
<h3 id="call-applications">Calling Applications</h3>
<p>Some form of reusable logic construct is helpful when handling repeated complex operations. In most languages functions and methods serve this purpose. In REL, an application can be assigned to a reference, in either data or the context stack, and called with the same syntax as an operation. The body of the application will have access to the <code>@options</code> and <code>@arguments</code> special references, as there is no way to bind named arguments passed to an application to names. There is also no other way to accept variadic arguments for an application.</p>
<pre><code style="display: block;"><span class="ast-nodes"><span class="let"><span class="ast-extra">let </span><span class="reference">opts</span><span class="ast-extra"> = </span><span class="application"><span class="ast-extra">=&gt;</span><span class="call"><span class="ast-extra">log(</span><span class="string"><span class="ast-extra">$$$</span><span class="interpolator"><span class="ast-extra">{{</span><span class="reference">@options</span><span class="ast-extra">}}</span></span><span class="ast-extra"> </span><span class="interpolator"><span class="ast-extra">{{</span><span class="reference">@arguments</span><span class="ast-extra">}}</span></span><span class="ast-extra">$$$</span></span><span class="ast-extra">)</span></span></span></span>
<span class="call"><span class="ast-extra">opts(</span><span class="number">1</span><span class="ast-extra"> </span><span class="string">:a</span><span class="ast-extra"> name:</span><span class="string">:opts</span><span class="ast-extra"> action:</span><span class="string">:log</span><span class="ast-extra">)</span></span></span></code></pre>
<h3 id="pipes">Pipes</h3>
<p>Processing data often calls operators on the results of calling operators on the results of calling operators, resulting in large nested argument lists that can become hard to keep track of. To address this, REL has a special built-in <code>pipe</code> operator that accepts a starting value and forwards it through the list of calls supplied to it as arguments, replacing the value with the result of the previous call each time. If one of the arguments to a call is <code>_</code>, the call will be evaluated as-is, but if no reference to <code>_</code> appears in the call arguments list, <code>_</code> will be supplied as the first argument. The following are equivalent:</p>
<ul>
<li><code><span class="ast-nodes"><span class="call"><span class="ast-extra">join(</span><span class="call"><span class="ast-extra">map(</span><span class="call"><span class="ast-extra">filter(</span><span class="reference">things</span><span class="ast-extra"> </span><span class="application"><span class="ast-extra">=&gt;</span><span class="binary-op"><span class="reference">count</span><span class="ast-extra"> &gt; </span><span class="number">10</span></span></span><span class="ast-extra">)</span></span><span class="ast-extra"> </span><span class="application"><span class="ast-extra">=&gt;</span><span class="reference">name</span></span><span class="ast-extra">)</span></span><span class="ast-extra"> </span><span class="string">', '</span><span class="ast-extra">)</span></span></span></code></li>
<li><code><span class="ast-nodes"><span class="call"><span class="ast-extra">pipe(</span><span class="reference">things</span><span class="ast-extra"> </span><span class="call"><span class="ast-extra">filter(</span><span class="application"><span class="ast-extra">=&gt;</span><span class="binary-op"><span class="reference">count</span><span class="ast-extra"> &gt; </span><span class="number">10</span></span></span><span class="ast-extra">)</span></span><span class="ast-extra"> </span><span class="call"><span class="ast-extra">map(</span><span class="application"><span class="ast-extra">=&gt;</span><span class="reference">name</span></span><span class="ast-extra">)</span></span><span class="ast-extra"> </span><span class="call"><span class="ast-extra">join(</span><span class="string">', '</span><span class="ast-extra">)</span></span><span class="ast-extra">)</span></span></span></code></li>
<li><code><span class="ast-nodes"><span class="reference">things</span><span class="ast-extra"> <span class="binary-op">|</span> </span><span class="call"><span class="ast-extra">filter(</span><span class="application"><span class="ast-extra">=&gt;</span><span class="binary-op"><span class="reference">count</span><span class="ast-extra"> &gt; </span><span class="number">10</span></span></span><span class="ast-extra">)</span></span><span class="ast-extra"> <span class="binary-op">|</span> </span><span class="call"><span class="ast-extra">map(</span><span class="application"><span class="ast-extra">=&gt;</span><span class="reference">name</span></span><span class="ast-extra">)</span></span><span class="ast-extra"> <span class="binary-op">|</span> </span><span class="call"><span class="ast-extra">join(</span><span class="string">', '</span><span class="ast-extra">)</span></span></span></code></li>
</ul>
<p>The latter are a bit longer, but tend to be easier to follow the value through the flow, especially when the intermediate steps get longer or more complicated. The binary pipe operator is parsed with the highest precedence, above exponentiation, so any other binary operators in a chain will end up with piped values as operands.</p>
<h3 id="calling-conventions">Calling Conventions</h3>
<p>Many operators will accept either an array or variadic arguments as operands. For those that only accept variadic arguments that need to be called with an unknown number of arguments from data, there is a calling convention using a special named argument (<code>_</code>, since it is not usable as a reference other than context value) to supply an array of arguments e.g. <code><span class="ast-nodes"><span class="call"><span class="ast-extra">op(_:</span><span class="array"><span class="ast-extra">[</span><span class="number">1</span><span class="ast-extra"> </span><span class="number">2</span><span class="ast-extra"> </span><span class="number">3</span><span class="ast-extra">]</span></span><span class="ast-extra">)</span></span></span></code>. Any arguments supplied using the <code>_</code> convention will lose access to any lazy evaluation that may have been applied by the operator.</p>
<p>Similarly, for operators that accept named arguments that need to be called with an unknown set of arguments from data, the same special named argument can be used with an object to directly supply named arguments e.g. <code><span class="ast-nodes"><span class="call"><span class="ast-extra">op(_:</span><span class="object"><span class="ast-extra">{ arg1:</span><span class="number">1</span><span class="ast-extra"> arg2:</span><span class="string">:a</span><span class="ast-extra"> }</span></span><span class="ast-extra">)</span></span></span></code>. Named arguments applied directly the function will override any supplied through the <code>_</code> convention.</p>
<p>Both of these conventions can be applied at the same time by passing an options object that includes <code>options</code> and/or <code>arguments</code> keys with corresponding values for each. Because of the way the options convention is applied, the options value may also contain an <code>arguments</code> array that will be used to override the arguments for the operator e.g.</p>
<ul>
  <li><code><span class="ast-nodes"><span class="call"><span class="ast-extra">op(_:</span><span class="object"><span class="ast-extra">{options:</span><span class="object"><span class="ast-extra">{a:</span><span class="string">:1</span><span class="ast-extra"> b:</span><span class="string">:2</span><span class="ast-extra">}</span></span><span class="ast-extra"> arguments:</span><span class="array"><span class="ast-extra">[</span><span class="number">1</span><span class="ast-extra"> </span><span class="number">2</span><span class="ast-extra">]</span></span><span class="ast-extra">}</span></span><span class="ast-extra">)</span></span></span></code>
  <li><code><span class="ast-nodes"><span class="call"><span class="ast-extra">op(_:</span><span class="object"><span class="ast-extra">{options:</span><span class="object"><span class="ast-extra">{a:</span><span class="string">:1</span><span class="ast-extra"> b:</span><span class="string">:2</span><span class="ast-extra"> arguments:</span><span class="array"><span class="ast-extra">[</span><span class="number">1</span><span class="ast-extra"> </span><span class="number">2</span><span class="ast-extra">]</span></span><span class="ast-extra">}</span></span><span class="ast-extra">}</span></span><span class="ast-extra">)</span></span></span></code> has the same resulting arguemtns.
  <li><code><span class="ast-nodes"><span class="call"><span class="ast-extra">op(_:</span><span class="object"><span class="ast-extra">{options:</span><span class="object"><span class="ast-extra">{a:</span><span class="string">:1</span><span class="ast-extra"> b:</span><span class="string">:2</span><span class="ast-extra"> arguments:</span><span class="array"><span class="ast-extra">[</span><span class="number">3</span><span class="ast-extra"> </span><span class="number">4</span><span class="ast-extra">]</span></span><span class="ast-extra">}</span></span><span class="ast-extra"> arguments:</span><span class="array"><span class="ast-extra">[</span><span class="number">1</span><span class="ast-extra"> </span><span class="number">2</span><span class="ast-extra">]</span></span><span class="ast-extra">}</span></span><span class="ast-extra">)</span></span></span></code> will result in <code>3</code> and <code>4</code> as the arguments.
</ul>
</div>

<h2 id="flow-control">Flow Control</h2>
<div class=indent>
<h3 id="block">block</h3>
<p>A block isn&#39;t really flow control, but being an expression-based language, a way to execute a number of expressions ignoring results until the final expression is quite useful. The <code>block</code> operator does just that. The built-in syntax for a block operation is one or more expressions placed with <code>{}</code>s, separated by whitespace and/or <code>;</code>s.</p>
<p>Blocks introduce their own lexical scope, so any variables declared within them will not escape their scope. You can still access parent contexts though, so it is possible to <code>let</code> variables from any context that is parent to the block scope using the appropriate reference.</p>
<p>Exmaple: <code><span class="ast-nodes"><span class="block"><span class="ast-extra">{ </span><span class="let"><span class="ast-extra">let </span><span class="reference">a</span><span class="ast-extra"> = </span><span class="number">10</span></span><span class="ast-extra">; </span><span class="let"><span class="ast-extra">let </span><span class="reference">b</span><span class="ast-extra"> = </span><span class="number">20</span></span><span class="ast-extra">; </span><span class="binary-op"><span class="reference">a</span><span class="ast-extra"> + </span><span class="reference">b</span></span><span class="ast-extra"> }</span></span></span></code></p>
<h3 id="if">if</h3>
<p>The primary form of conditional flow control is handled by the <code>if</code> operator, which takes a conditional argument followed by a truth case expression, any number of additional conditional and truth case expressions, and then an optional alternate expression. As an operator, <code>if</code> may be called as any other operator, but there is also built-in syntax to make it slightly more readable in the form <code>if</code> followed by a condition, <code>then</code>, and an expression; followed by any number of alternate conditions and expressions in the form <code>else if</code> or <code>elseif</code> or <code>elsif</code> or <code>elif</code> followed by <code>then</code> and the value expression; optionally followed by <code>else</code> and a final alternate value expression.</p>
<p>The result of an <code>if</code> expression is the value of the value expression paired with the first matching conditional branch, the value of the final alternate branch if no conditions matched, or <code>undefined</code> if there were no matches and no final alternate value.</p>
<p>If an <code>if</code> needs to be nested in a way that may make further conditionals ambiguous, the expression can be ended with <code>end</code> or <code>fi</code>. The value expression of a branch may also be a block, which will also remove any ambiguity.</p>
<p>Example: <code><span class="ast-nodes"><span class="conditional"><span class="ast-extra">if </span><span class="binary-op"><span class="reference">count</span><span class="ast-extra"> &gt; </span><span class="number">23</span></span><span class="ast-extra"> then </span><span class="string">'there are dozens of us!'</span><span class="ast-extra"> elif </span><span class="binary-op"><span class="reference">count</span><span class="ast-extra"> &lt; </span><span class="number">0</span></span><span class="ast-extra"> then </span><span class="string">'not sure what happened'</span><span class="ast-extra"> else </span><span class="string">'something else'</span></span></span></code>, <code><span class="ast-nodes"><span class="conditional"><span class="ast-extra">if </span><span class="binary-op"><span class="reference">a</span><span class="ast-extra"> &gt; </span><span class="reference">b</span></span><span class="ast-extra"> then </span><span class="conditional"><span class="ast-extra">if </span><span class="binary-op"><span class="reference">b</span><span class="ast-extra"> &lt; </span><span class="number">12</span></span><span class="ast-extra"> then </span><span class="string">:c</span><span class="ast-extra"> else </span><span class="string">:d</span><span class="ast-extra"> end</span></span><span class="ast-extra"> elif </span><span class="binary-op"><span class="reference">b</span><span class="ast-extra"> &gt; </span><span class="reference">a</span></span><span class="ast-extra"> then </span><span class="string">:e</span><span class="ast-extra"> else </span><span class="string">:f</span></span></span></code></p>
<h3 id="unless">unless</h3>
<p>Unless is a negated <code>if</code>. If the conditional expression evaluates to a truthy value, then the value expression will be the result. <code>unless</code> also allows for an alternate value expression but does not allow additional condition cases. The built-in unless syntax starts with <code>unless</code> followed by a conditional expression, followed by <code>then</code> and a value expression, optionally followed by <code>else</code> and an alternate value expression, optionally followed by <code>end</code>.</p>
<p>Example: <code><span class="ast-nodes"><span class="conditional"><span class="ast-extra">unless </span><span class="reference">loggedIn</span><span class="ast-extra"> then </span><span class="string">'Please log in'</span></span></span></code></p>
<h3 id="case">case</h3>
<p>REL also has a case operator that allows for an alternate branch style that may be more comprehensible in some cases. Each branch condition is evaluated lazily, and if it is an expression will have the value being evaluated available as the special <code>@case</code> reference. If using the built-in syntax, <code>_</code> will also evaluate to <code>@case</code>. <code>case</code> expressions begin with <code>case</code> followed by a value expression, followed by any number of branches that start with <code>when</code> followed by a conditional value or expression, followed by <code>then</code> and a value expression, and finally optionally ending with an alternate <code>else</code> and value expression and optional <code>end</code> or <code>esac</code>.</p>
<p>Example:</p>
<pre><code><span class="ast-nodes"><span class="ast-extra">case </span><span class="reference">age</span><span class="ast-extra">
  when </span><span class="binary-op"><span class="reference">_</span><span class="ast-extra"> &lt; </span><span class="number">13</span></span><span class="ast-extra"> then </span><span class="string">'ask a parent'</span><span class="ast-extra">
  when </span><span class="number">15</span><span class="ast-extra"> then </span><span class="string">'happy quinceanera'</span><span class="ast-extra">
  when </span><span class="number">99</span><span class="ast-extra"> then </span><span class="string">'last year for legos, friend'</span><span class="ast-extra">
  when </span><span class="binary-op"><span class="reference">_</span><span class="ast-extra"> &gt;= </span><span class="number">18</span></span><span class="ast-extra"> then </span><span class="string">'ok'</span><span class="ast-extra">
  else </span><span class="string">'NaN, I guess'</span></span>
</code></pre>
</div>

<h2 id="templates">Templates</h2>
<div class=indent>
<p>There are some contexts in which output is always a string, like names and HTML. In these cases it makes sense not to require wrapping the entire string in a set of quotes and using nested interpolators or concatenation. For this purpose, Raport has a template version of expressions that are similar to mustache or handlebars templates, where double curly braces delimit interpolation with special cases for iteration, branching, and context management, and everything else is plain text, including any special characters.</p>
<h3>Blocks</h3>
<p>There are five special interpolators that are treated as blocks with bodies and require a closing delimiter to indicate where their body ends. The opening delimiter includes the special name, and the closing delimiter includes a <code>/</code>, optionally followed by any text, typically the special name e.g. <code class="ast-nodes"><span><span class="if-block"><span class="ast-extra">{{if </span><span class="reference">user.logged-in</span><span class="ast-extra">}}</span><span class="content">Hello, </span><span class="interpolator"><span class="ast-extra">{{</span><span class="reference">user.name</span><span class="ast-extra">}}</span></span><span class="content">!</span><span class="ast-extra">{{/if}}</span></span></span></code>. Most of the block operators also accept sub-interpolators that split their body into multiple parts. This is used for different branches in an <code>if</code> and an alternative body for an <code>each</code> that has nothing to iterate over. Every sub-block will start with <code>else</code>, <code>else if</code>. <code>elseif</code>, <code>elsif</code>, <code>elif</code>, or <code>when</code>. The sub-blocks do not have their own closing delimiter.</p>
<ul>
<li><p>The <code>each</code> block accepts an expression that evaluates to a data source and renders its body once for each value in the source with the value set as the context of the body. The current index is available as <code>@index</code>, the last index is available as <code>@last</code>, the current key is available as <code>@key</code>, and the last key is available as <code>@last-key</code>. The body of an <code>each</code> may specify an alternative for use if there is nothing to iterate over using an <code>else</code> tag e.g. <pre><code class="ast-nodes"><span><span class="each-block"><span class="ast-extra">{{each </span><span class="reference">order.items</span><span class="ast-extra">}}</span><span class="interpolator"><span class="ast-extra">{{</span><span class="reference">name</span><span class="ast-extra">}}</span></span><span class="content"> - </span><span class="interpolator"><span class="ast-extra">{{</span><span class="reference">quantity</span><span class="ast-extra">}}</span></span><span class="content">
</span><span class="ast-extra">{{else}}</span><span class="content">No items.</span><span class="ast-extra">{{/}}</span></span></span></code></pre></p></li>
<li><p>The <code>if</code> block accepts an expression that evaluates to a boolean, and if the value is truthy, renders its body. The body of an <code>if</code> block can supply multiple alternate sub-blocks using <code>else if</code> interpolators, that each accept an expression, and a final <code>else</code> interpolator that does not accept an expression e.g. <code class="ast-nodes"><span><span class="interpolator"><span class="ast-extra">{{</span><span class="let"><span class="ast-extra">let </span><span class="reference">month</span><span class="ast-extra"> = </span><span class="binary-op"><span class="ast-extra">+(</span><span class="binary-op"><span class="reference">@date</span><span class="format-op"><span class="ast-extra">#date,</span><span class="string">:M</span></span></span><span class="ast-extra">)</span></span></span><span class="ast-extra">}}</span></span><span class="if-block"><span class="ast-extra">{{if </span><span class="binary-op"><span class="reference">month</span><span class="ast-extra"> in </span><span class="string">'11-12 1-3'</span></span><span class="ast-extra">}}</span><span class="content">Chilly outside, isn't it?</span><span class="ast-extra">{{else if </span><span class="binary-op"><span class="reference">month</span><span class="ast-extra"> == </span><span class="number">4</span></span><span class="ast-extra">}}</span><span class="content">Is it raining?</span><span class="ast-extra">{{else if </span><span class="binary-op"><span class="reference">month</span><span class="ast-extra"> in </span><span class="string">'7 8'</span></span><span class="ast-extra">}}</span><span class="content">Geez it's hot.</span><span class="ast-extra">{{else}}</span><span class="content">Nice out today, no?</span><span class="ast-extra">{{/if}}</span></span></span></code></p></li>
<li><p>The <code>unless</code> block accepts an expression that evaluates to a boolan, and if the value is <strong>not</strong> truthy, renders its body e.g. <code class="ast-nodes"><span><span class="unless-block"><span class="ast-extra">{{unless </span><span class="reference">logged-in</span><span class="ast-extra">}}</span><span class="content">Please log in.</span><span class="ast-extra">{{/unless}}</span></span></span></code>. The <code>unless</code> block does not support any sub-blocks.</p></li>
<li><p>The <code>case</code> block accepts an expression, the keyword <code>when</code>, and another expression. The first expression is evaluated, and the second expression is used with the first <code>when</code> block. The sub-blocks must be either <code>when</code> blocks, which accept an expression argument, or a final <code>else</code> block that is rendered if none of the <code>when</code> blocks match e.g. <pre><code class="ast-nodes"><span><span class="case-block"><span class="ast-extra">{{case </span><span class="reference">user</span><span class="ast-extra"> when </span><span class="reference">_.is-admin</span><span class="ast-extra">}}</span><span class="content">Hello admin user!
  </span><span class="ast-extra">{{when </span><span class="binary-op"><span class="reference">@date</span><span class="format-op"><span class="ast-extra">#date,</span><span class="binary-op"><span class="string">:H</span><span class="ast-extra"> &lt; </span><span class="number">12</span></span></span></span><span class="ast-extra">}}</span><span class="content">Good morning!
  </span><span class="ast-extra">{{else}}</span><span class="content">Good day!
</span><span class="ast-extra">{{/}}</span></span></span></code></pre>
<li><p>The <code>with</code> block accepts an expression, evaluates it, and sets the result as the context for its body. The <code>with</code> block accepts a an alternative sub-block in the form of an <code>else</code> that will be rendered if the value it is given is false-y. <code class="ast-nodes"><span><span class="with-block"><span class="ast-extra">{{with </span><span class="reference">user</span><span class="ast-extra">}}</span><span class="content">Hello, </span><span class="interpolator"><span class="ast-extra">{{</span><span class="reference">name</span><span class="ast-extra">}}</span></span><span class="content">.</span><span class="ast-extra">{{else}}</span><span class="content">Please log in.</span><span class="ast-extra">{{/with}}</span></span></span></code></p></li>
</ul>
<h3>Inline</h3>
<p>Any other interpolators encountered have their contents treated as expressions and will render the resulting value after passing it through the <code>string</code> operator.</p>
</div>

<h2 id="styled-text">Styled Text</h2>
<div class=indent>
<p>Reports often benefit from styled text, and while most of the raport controls include properties that style their rendered text, it is usually only easily applied to the entire string at once. Labels can be split into an array of parts that are individually styled, but that makes interpolation within the label text difficult when flow control and styling interleave. To address this, raport also provides a light markup language that can be used to apply styling to plain text.</p>
<p>The syntax consists of markup tags interspersed within the text, where each tag may include multiple properties that are inline or block and boolean or valued. Inline properties are typically boolean and can be enabled and disabled at any place within the text. Block properties are grouped with other block properties within their initial tag and are enabled and disabled together. Boolean properties are toggled with each tag, and valued properties form a stack.</p>
<p>A tag is delimited by <code>|</code>s, and the properties within are delimited with <code>,</code>s. Valued properties specify their value with an <code>=</code>, which pushes a value onto the stack. Valued properties specified without a value will pop a value from the stack. Properties are named as identifiers, some of which also have shorthand aliases.</p>
<h3>Inline Properties</h3>
<p>Inline properties are treated as a flat structure, so that they can be interleaved. For instance, <code>this |b|is |i|a|b| test|i| string</code> will yield <code>this</code> plain, <code>is</code> bolded, <code>a</code> bolded and italicized, <code>test</code> italicized, and <code>string</code> plain. <code>|b,u|this is bold and underlined</code> will render the entire text bolded and underlined.</p>
<ul>
<li><code>background</code>, <code>back</code>, <code>bg</code> - sets the background color of the marked text to the given color specified in hexadecimal <code>rgb</code>, <code>rgba</code>, <code>rrggbb</code>, or <code>rrggbbaa</code>, optionally prefixed with a <code>#</code> e.g., <code>|bg=000|</code> or <code>|bg=#08296b|</code>.</li>
<li><code>bold</code>, <code>b</code> - bolds the marked text</li>
<li><code>br</code> - a special tag that inserts a line break. Multiple <code>br</code> tags may appear together to insert multiple line breaks e.g., <code>|br,br,br|</code> produces three line breaks.</li>
<li><code>color</code>, <code>fore</code>, <code>fg</code> - sets the text color of the marked text to the given color specified in hexadecimal <code>rgb</code>, <code>rgba</code>, <code>rrggbb</code>, or <code>rrggbbaa</code>, optionally prefixed with a <code>#</code> e.g., <code>|fg=#f00|</code>.</li>
<li><code>font</code> - sets the font for the marked text to the given value, which is read up to the next <code>,</code> or <code>|</code> e.g., <code>|font=liberation sans narrow|</code>.</li>
<li><code>italic</code>, <code>i</code> - italicizes the marked text</li>
<li><code>line</code> - sets the line height of the marked text to the given value in <code>rem</code> e.g., <code>|line=2.2|</code> sets the line height to 220% of the default 1rem. The decimal is optional.</li>
<li><code>overline</code> - adds an overline to the marked text</li>
<li><code>pre</code> - treats the marked text as white space sensitive</li>
<li><code>size</code> - sets the font size of the marked text to the given size in <code>rem</code> e.g., <code>|font=2.2|</code> sets the font size to 220% of the default. The decimal is optional.</li>
<li><code>strike</code> - adds a strike-through to the marked text</li>
<li><code>sub</code> - sets the marked text as subscripted</li>
<li><code>sup</code> - sets the marked text as superscripted</li>
<li><code>valign</code> - sets the marked text to vertically align with surrounding text to the given value, which may be <code>top</code>, <code>middle</code>, <code>base</code>, or <code>bottom</code>, corresponding to the top, center, baseline, and bottom e.g., <code>|valign=bottom|</code>.</li>
</ul>
<h3>Block Properties</h3>
<p>Block properties create a block around their content and contain any subsequent content until a closing property for one of the values in the initial tag is encountered e.g., <code>|w=10,align=middle center,border=1|this is in the block.|i|as is this.|w| this is not, but is still italicized</code>. By default, the contents of a block may not exceed its bounds.</p>
<ul>
<li><code>align</code> - sets the vertical and/or horizontal alignment of the block content. One or two values may be specified in any order with <code>top</code>, <code>middle</code>, <code>base</code>, and <code>bottom</code> specifying vertical alignment and <code>left</code>, <code>center</code>, and <code>right</code> specifying horizontal alignment.</li>
<li><code>background</code>, <code>back</code>, <code>bg</code> - sets the background color of the block. This is a special case of the inline <code>bg</code> property that will also end with the block.</li>
<li><code>border</code> - sets the border of block. The value given for a border property must include at least one width, but the rest of the properties are optional. The full signature is <code>[solid|dash|dot|double] &lt;width1&gt; [width2] [width3] [width4] [/ &lt;radius&gt; [radius2] [radius3] [radius4]] [color]</code>. If a type is not specified, it defaults to <code>solid</code>. The behavior of width1-4 depends on how many are supplied: 1 makes all four borders to width1; 2 sets the top and bottom to width1 and the left and right to width2; 3 sets top to width 1, right and left to width2, and bottom to width3; and 4 sets the top, right, bottom, and left to width1, width2, width3, and width4, respectively. Width values are integers and specify pixels. The radius value behaves similarly, but corresponds to the top-left, top-right, bottom-right, and bottom-left radii. Radius values can be decimals and specify <code>rem</code>. The color can be specified in hexadecimal <code>rgb</code>, <code>rgba</code>, <code>rrggbb</code>, or <code>rrggbbaa</code> with an optional leading <code>#</code>.</li>
<li><code>height</code>, <code>h</code> - sets the height of the block in <code>rem</code>, e.g., <code>|h=10|this is 10rem tall</code>. The height does not include any padding or margin, in contrast to the behavior of the height and margin properties of raport widgets. Height may also be set as a percentage of its container, making it easier to align text within a widget e.g., <code>|h=100%,align=middle|this is centered in the container</code>.</li>
<li><code>margin</code> - sets the margin of the block in <code>rem</code>. The value specified may be a decimal, and up to four values may be provided. If one is provided, all four sides will have the given value. If two are specified, the top and left will be set to the first, and the left and right will be set to the second. If three are specified, the top will be set to the first, the left and right will be set to the second, and the bottom will be set to the third. If four are specified, they will correspond to the top, right, bottom, and left values. Margins will add to any height or width values given.</li>
<li><code>move</code> - translates the block by the given <code>x</code> and <code>y</code> amounts. The coordinates may be specified as numbers corresponding to <code>rem</code> or percentages. The order of <code>move</code> and <code>rotate</code> tags will affect how they are applied.</li>
<li><code>nowrap</code> - specifies that text within the block should not wrap.</li>
<li><code>overflow</code> - specifies that the contents of the block may exceed its bounds.</li>
<li><code>pad</code> - sets the padding of the block in <code>rem</code>. The value specified may be a decimal, and up to four values may be provided. If one is provided, all four sides will have the given value. If two are specified, the top and left will be set to the first, and the left and right will be set to the second. If three are specified, the top will be set to the first, the left and right will be set to the second, and the bottom will be set to the third. If four are specified, they will correspond to the top, right, bottom, and left values. Padding will add to any height or width values given.</li>
<li><code>rotate</code> - rotates the block by the given number of turns. The direction may be specified as <code>left</code> or <code>right</code> and defaults to right. An addition set of coordinates may be supplied to set the point of rotation, and they may be numbers corresponding to <code>rem</code>, percentages, or relative values <code>top</code>, <code>left</code>, <code>bottom</code>, <code>right</code>, and <code>center</code>. The order of <code>move</code> and <code>rotate</code> tags will affect how they are applied.</li>
<li><code>width</code>, <code>w</code> - sets the width of the block in <code>rem</code>, e.g., <code>|w=10|this is 10rem wide</code>. The width does not include any padding or margin, in contrast to the behavior of the width and margin properties of raport widgets. Width may also be set as a percentage of its container, making it easier to align text within a widget e.g., <code>|w=100%,align=center|this is centered in the container</code>.</li>
</ul>
</div>

</body>
</html>`;
}
