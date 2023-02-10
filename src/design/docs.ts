export const operators = `[
	{ op:['%' 'modulus'] sig:[
		{ bin:1 proto:'...any => number' desc:'Returns the modulus of the given values starting with the first.' }
	]}
	{ op:['*' 'multiply'] sig:[
		{ bin:1 proto:'...number => number' desc:'Multiplies the given values starting with the first.' }
		{ bin:1 proto:'(string, number) => string' desc:'Returns the given string copied number times.'}
	]}
	{ op:['**' 'pow'] sig:[
		{ bin:1 proto:'...number => number' desc:'Applies exponentiation to the given arguments with right associativity.' eg:'(** 1 2 3) is 1^(2^3)'}
	]}
	{ op:['+' 'add'] sig:[
		{ bin:1 proto:'...number => number' desc:'Adds the given numbers together.' }
		{ bin:1 proto:'...any => string' desc:'Concatenates the given arguments as strings.' }
		{ un:1 proto:'any => number' desc:'The unary + operator converts the given value to a number.' }
	]}
	{ op:['-' 'subtract'] sig:[
		{ bin:1 proto:'...any => number' desc:'Subtracts the given values as numbers starting with the first.' }
	]}
	{ op:['/' 'divide'] sig:[
		{ bin:1 proto:'...any => number' desc:'Divides the given values starting with the first.' }
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
	]}
	{ op:['!=' 'is-not'] sig:[
		{ bin:1 proto:'(any, any) => boolean' desc:'Returns true if the given values are not equal (not strict).' }
	]}
	{ op:['===' 'deep-is'] sig:[
		{ bin:1 proto: '(any, any) => boolean' desc:'Do a deep equality check on the first two arguments using loose equality for primitives.' }
		{ proto: "(any, any, 'strict'|'loose'|application) => boolean' desc:'Do a deep equality check on the first two arguments using the comparison method specified by the third argument. If an application is given, it will be called with each item being checked at each step in the recursive check to determine equality." }
	]}
	{ op:['!==' 'deep-is-not'] sig:[
		{ bin:1 proto: '(any, any) => boolean' desc:'Do a deep inequality check on the first two arguments using loose equality for primitives.' }
		{ proto: "(any, any, 'strict'|'loose'|application) => boolean' desc:'Do a deep inequality check on the first two arguments using the comparison method specified by the third argument. If an application is given, it will be called with each item being checked at each step in the recursive check to determine equality." }
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
		{ proto:'(any, ...(any|application, any)) => any' desc:'Evaluates its first argument and uses it as a basis for comparison for each subsequent pair of arguments, called matchers. The first value in a matcher is used for the comparison, and the second value is returned if the comparison holds. If the matcher first value is an application, the matcher matches if the application returns a truthy value when given the basis value. If the matcher first value is a value, the matcher matches if the first value and the basis value are loosely equal. The basis value is available as @case or the shorthand _ in each matcher.' eg:['case 1+1 when 1 then :nope when =>4 - _ == _ then :yep else :other end' 'case(1+1 1 :nope =>4 - _ == _ :yep :other)'] }
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
	]}
	{ op:'diff' sig:[
		{ proto:'(any, any) => Diff' desc:'Does a deep comparison of the two arguments returning a map of deep keypath to a tuple of the left value and right value for differing paths.' }
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
	]}
	{ op:'filter' sig:[
		{ proto:'(any[], application) => any[]' desc:'Filters the given array using the given application to remove entries that return a false-y result.' }
		{ proto:'(any[], application, sort[]) => any[]' desc:'Filters the given array using the given application to remove entries that return a false-y result. The result is then sorted using the given sort array.' }
		{ proto:'(any[], application, sort[], application|application[]) => any[]' desc:'Filters the given array using the given application to remove entries that return a false-y result. The result is then sorted using the given sort array. The result is finally grouped by the final application or array of applications.' }
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
	{ op:'floor' sig:[
		{ proto:'number => number' desc:'Returns the given number rounded down to the nearest integer.' }
	]}
	{ op:['format' 'fmt'] sig:[
		{ proto:'(any, string, ...args) => string' desc:'Applies the named formatted indicated by the second argument string to the given value, passing along any additional arguments to the formatter.' }
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
		{ bin:1 proto:'(date, daterange) => boolean' desc:'Returns true if the first argument is a falls within the second argument range.' }
		{ bin:1 proto:'(number, range) => boolean' desc:'Returns true if the first argument is a falls within the second argument range.' }
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
		{ agg:1 proto:'string => string' desc:'Joins all of the elements in the current source with the given string.' }
		{ proto:'(any[], string, string) => string' desc:'Joins all of the elements in the given array with the given string. The last element is appended using the final string.' }
		{ agg:1 proto:'(string, string) => string' desc:'Joins all of the elements in the current source with the given string. The last element is appended using the final string.' }
	]}
	{ op:'keys' sig:[
		{ proto:'object => string[]' desc:'Returns an array of all of the keys in the given object.' }
		{ proto:'(object, true) => string[]' desc:'Returns an array of all of the keys in the given object, including any from the prototype chain.' }
	]}
	{ op:'label-diff' sig:[
		{ proto:'(Diff, LabelMap) => Diff' desc:'Takes the given diff and label map and swaps out paths in the diff for labels in the map. The label map is a nested object with the keys being single key paths in the diff and the values being a label or tuple of a label and label map for nested sub structures.' eg:'label-diff(d { foo:[:Company { bar::Address }] }) where d = { :foo.bar: [:street :avenue] } will result in { "Company Address": [:street :avenue] }' }
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
		{ proto:'any => number' desc:'Returns the length of the given value or 0 if it has none.' }
	]}
	{ op:'like' sig:[
		{ bin:1 proto:'(string, string) => any' desc:'Checks to see if the first string matches the second string used as a pattern case sensitively.' }
		{ bin:1 proto:'(string[], string) => any' desc:'Checks to see if any of the strings in the first argument array matches the second string used as a pattern case sensitively.' }
		{ bin:1 proto:'(string, string[]) => any' desc:'Checks to see if first string matches any of the second argument strings used as patterns case sensitively.' }
		{ bin:1 proto:'(string[], string[]) => any' desc:'Checks to see if any of the strings in the first argument array matches any of the second argument strings used as patterns case sensitively.' }
	] opts: [
		{ name:'free' type:'boolean' desc:'Causes the patterns not to be anchored to the start and end of the target string.' }
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
	]}
	{ op:'max' sig:[
		{ agg:1 proto: '() => number' desc:'Returns the largest entry in the current source.' }
		{ proto:'number[] => number' desc:'Returns the largest entry in the given array of numbers.' }
		{ proto:'(any[], application) => number' desc:'Returns the largest entry in the applications for the given array of values.' }
		{ agg:1 proto:'application => number' desc:'Returns the largest entry in the applications for the current source.' }
	]}
	{ op:'min' sig:[
		{ agg:1 proto: '() => number' desc:'Returns the smallest entry in the current source.' }
		{ proto:'number[] => number' desc:'Returns the smallest entry in the given array of numbers.' }
		{ proto:'(any[], application) => number' desc:'Returns the smallest entry in the applications for the given array of values.' }
		{ agg:1 proto:'application => number' desc:'Returns the smallest entry in the applications for the current source.' }
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
		{ bin:1 proto:'(date, daterange) => boolean' desc:'Returns false if the first argument is a falls within the second argument range.' }
		{ bin:1 proto:'(number, range) => boolean' desc:'Returns false if the first argument is a falls within the second argument range.' }
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
		{ proto:'(any[], number) => any' desc:'Returns the nth item in the given array using a 1-based index.' }
		{ agg:1 proto:'number => any' desc:'Returns the nth item in the current source using a 1-based index.' }
	]}
	{ op:'num' sig:[
		{ proto:'string => number' desc:'Returns the first positive number found in the string, including an optional decimal.' }
	]}
	{ op:'object' sig:[
		{ proto:'(...(string, any)) => object' desc:'Returns an object assembled from the arguments where each odd argument is a key and the subsequent event argument is its value.' eg: 'object(:key1 99 :key2 73)' }
	]}
	{ op:'overlap' sig:[
		{ proto:'(string, string, number = 0.5) => string' desc:"Returns the first overlapping substring within the two given strings that is at least the given percentage of the smallest string's length long using the similar operator." }
	]}
	{ op:'pad' sig:[
		{ proto:'(string, number) => string' desc:'Pads the given string with spaces at both ends such that it is at least the given number of characters long.' }
		{ proto:'(string, number, string) => string' desc:'Pads the given string with the final string at both ends such that it is at least the given number of characters long.' }
	]}
	{ op:'padl' sig:[
		{ proto:'(string, number) => string' desc:'Pads the given string with spaces at the beginning such that it is at least the given number of characters long.' }
		{ proto:'(string, number, string) => string' desc:'Pads the given string with the final string at the beginning such that it is at least the given number of characters long.' }
	]}
	{ op:'padr' sig:[
		{ proto:'(string, number) => string' desc:'Pads the given string with spaces at the end such that it is at least the given number of characters long.' }
		{ proto:'(string, number, string) => string' desc:'Pads the given string with the final string at the end such that it is at least the given number of characters long.' }
	]}
	{ op:'parse' sig:[
		{ proto:'string => any' desc:'Parses the given string using the expression parser.' }
	] opts: [
		{ name:'date' type:'boolean' desc:'Use the date parser rather than the expression parser.' }
		{ name:'template' type:'boolean' desc:'Use the template parser rather than the expression parser.' }
		{ name:'time' type:'boolean' desc:'Use the time parser rather than the expression parser.' }
		{ name:'schema' type:'boolean' desc:'Use the schema parser rather than the expression parser.' }
		{ name:'csv' type:'boolean' desc:'Use the delimited text parser rather than the expression parser.' }
		{ name:'detect' type:'boolean' desc:'If using the delimited parser, detect the delimiters and use them to parse.' }
		{ name:'header' type:'boolean' desc:'If using the delimited parser, treat the first result as a header and use it to build objects with field names based on the header.' }
		{ name:'field' type:'string' desc:'If using the delimited parser, use the given string as the field delimiter.' }
		{ name:'record' type:'string' desc:'If using the delimited parser, use the given string as the record delimiter.' }
		{ name:'quote' type:'string' desc:'If using the delimited parser, use the given string as the field quote.' }
	]}
	{ op:'pipe' sig:[
		{ proto:'...any => any' desc:'This is a special built-in operator that evaluates its first argument, supplies that as an input to the next argument, supplies that result as an input to the next argument, and so on until the result of the last argument evaluation is returned. If any argument is an operation that does not reference \`@pipe\` or \`_\` as one of its arguments, then \`@pipe\` will be added as the first argument of that operation. Arguments that are applications are automatically applied with the piped value.' }
	]}
	{ op:['rand' 'random'] sig:[
		{ proto:'() => number' desc:'Returns a random floating point number between 0 and 1, inclusive.' }
		{ proto:'number => number' desc:'Returns a random integer between 1 and the given number, inclusive.' }
		{ proto:'(number, true) => number' desc:'Returns a random floating point number between 1 and the given number, inclusive.' }
		{ proto:'(number, number) => number' desc:'Returns a random integer between the given numbers, inclusive.' }
		{ proto:'(number, number, true) => number' desc:'Returns a random floating point number between the given numbers, inclusive.' }
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
	]}
	{ op:'set' sig:[
		{ proto:'(string, any) => interval' desc:'Sets the root value specified by the given path in the first argument the value supplied as the second argument and returns the value that was replaced, if any.' }
	]}
	{ op:'set-defaults' sig:[
		{ proto:'(string, string) => any' desc:'Sets the defaults for the given class and name of a defaulted thing. Currently, only format is supported as a class, and the name provided should be the name of the format for which to set defaults. Defaults should be passed in as named options.' }
	]}
	{ op:'similar' sig:[
		{ proto:'(string, string, number = 0.5, number = 2) => [string, string, number]' desc:'Finds the first similar substrings within the two given strings based on a threshhold (3rd argument, defaults to 50%) and fudge factor (4th argument, defaults to 2). The two similar substrings are returned in a tuple with the similarity percentage.' }
	]}
	{ op:'similarity' sig:[
		{ proto:'(string, string, number = 0.5, number = 2) => [string, string, number]' desc:'Finds the similarity percentage of the first similar substrings within the two given strings using the similar operator.' }
	]}
	{ op:['slice' 'substr'] sig:[
		{ proto:'any[] => any[]' desc:'Returns a copy of the given array.' }
		{ proto:'(any[], number) => any[]' desc:'Returns a copy of the given array starting from the element at the given index.' }
		{ proto:'(any[], number, number) => any[]' desc:'Returns a copy of the given array starting from the element at the given index and ending immediately before the final given index. If the final index is negative, it is an offset from the end of the array.' }
		{ proto:'(string, number) => string' desc:'Returns a substring of the given string starting from the character at the given index.' }
		{ proto:'(string, number, number) => any[]' desc:'Returns a substring of the given string starting from the character at the given index and ending immediately before the final given index. If the final index is negative, it is an offset from the end of the string.' }
	]}
	{ op:'sort' sig:[
		{ proto:'(any[], sort[]) => any[]' desc:'Sorts the given array using the given sort array. Any array elements that are strings may indicate direction with a leading + or - for ascending and descending, respectively. The remainder of the string is parsed and used as an application. Any array elements that are applications are applied directly to get a comparison value. Any arguments that are objects may include a by key with an application value along with asc, desc, or dir flags.' }
	]}
	{ op:'source' sig:[
		{ proto:'any => DataSet' desc:'Creates a DataSet from the given value.' }
	]}
	{ op:'split' sig:[
		{ proto:'string => string[]' desc:'Splits the given string into an array containing each of its characters.' }
		{ proto:'(string, string) => string[]' desc:'Splits the given string into an array containing substrings delimited by the second argument.' }
	]}
	{ op:'strict-is' sig:[
		{ proto:'(any, any) => boolean' desc:'Returns true if the two arguments are the same literal value or are pointers to the same object.' }
	]}
	{ op:'strict-is-not' sig:[
		{ proto:'(any, any) => boolean' desc:'Returns false if the two arguments are the same literal value or are pointers to the same object.' }
	]}
	{ op:'string' sig:[
		{ proto:'any => string' desc:'Politely stringifies the given value, meaning that there are no undefined, null, or object prototype values strings returned.' }
	] opts: [
		{ name:'json' type:'boolean' desc:'Forces the output string to be JSON.' }
		{ name:'raport' type:'boolean' desc:'Forces the output string to be a raport expresion. This can be paired with any options to the stringify function supplied by raport.' }
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
		{ name:'round' type:"'floor'|'ceil'|'round'" desc:"Determines how the results should be rounded. By default they are 'floor'ed, but this can also be 'ceil' or 'round'. Rounding is done based on the next largest available unit after the smallest requiested unit e.g. hours if days are requested last or months if years are the only requested unit." }
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
	{ name:'case' desc:'Change the casing of the value.' opts:[
		{ name:'case' type:"'upper'|'lower'|'snake'|'kebab'|'pascal'|'camel'|'proper'" desc:'The case format to use.'}
	]}
	{ name:'date' desc:'Formats the value as a date string using placeholder characters, where repeated characters render more descriptive or padded values. Any non-placeholder characters are rendered as entered. The default format is yyyy-MM-dd. Available placeholders are:\\n\\n* y - year\\n* M - month\\n* d - date\\n* E - day of week\\n* H - hour (24 hour)\\n* h or k - hour (12 hour)\\n* m - minute\\n* s - second\\n* S - millisecond\\n* a - AM/PM\\n* z - timezone offset' opts:[
		{ name:'format' type:'string' desc:'The format template to apply.'}
	]}
	{ name:'dollar' desc:'Formats the value as a dollar amount with two decimal places by default.' opts:[
		{ name:'dec' type:'number' desc:'The number of decimal places to render.' }
		{ name:'group' type:'string' desc:'The string to use as a grouping divider.' }
		{ name:'sign' type:'string' desc:'The currency symbol to render.' }
		{ name:'neg' type:"'sign'|'wrap'|'both'" desc:'How to display negative values. Sign shows a leading minus symbol. Wrap wraps the value in parenteses.' }
	]}
	{ name:['int' 'integer'] desc:'Formats the value as an integer.' opts:[
		{ name:'group' type:'string' desc:'The string to use as a grouping divider.' }
		{ name:'neg' type:"'sign'|'wrap'|'both'" desc:'How to display negative values. Sign shows a leading minus symbol. Wrap wraps the value in parenteses.' }
	]}
	{ name:'iso8601' desc:'Formats the value as an ISO-8601 timestamp.' }
	{ name:['num' 'number'] desc:'Formats the value as an number.' opts:[
		{ name:'dec' type:'number' desc:'The number of decimal places to render.' }
		{ name:'group' type:'string' desc:'The string to use as a grouping divider.' }
		{ name:'neg' type:"'sign'|'wrap'|'both'" desc:'How to display negative values. Sign shows a leading minus symbol. Wrap wraps the value in parenteses.' }
	]}
	{ name:'or' desc:'Renders the first argument if the value is not truthy.' }
	{ name:'ordinal' desc:'Render the value as an ordinal number.' opts:[
		{ name:'group' type:'string' desc:'The string to use as a grouping divider.' }
	]}
	{ name:'pad' desc:'Renders the given value as a string and ensures it is at least the given length by padding both ends with a configurable string that defaults to a single space.' opts: [
		{ name:'len' type:'number' desc:'Minimum length for the formatted string.' }
		{ name:'pad' type:'number' desc:'The string to use for padding.' }
	]}
	{ name:'padl' desc:'Renders the given value as a string and ensures it is at least the given length by padding the beginning with a configurable string that defaults to a single space.' opts: [
		{ name:'len' type:'number' desc:'Minimum length for the formatted string.' }
		{ name:'pad' type:'number' desc:'The string to use for padding.' }
	]}
	{ name:'padr' desc:'Renders the given value as a string and ensures it is at least the given length by padding the end with a configurable string that defaults to a single space.' opts: [
		{ name:'len' type:'number' desc:'Minimum length for the formatted string.' }
		{ name:'pad' type:'number' desc:'The string to use for padding.' }
	]}
	{ name:'phone' desc:'Formats the value as phone number e.g. 111-2222, (111) 222-3333, 1-888-777-6666' }
	{ name:'time' desc:'Formats a date value as a time string using placeholder characters, where repeated characters render more descriptive or padded values. Any non-placeholder characters are rendered as entered. The default format is HH:mm:ss. {dateparts}' opts:[
		{ name:'format' type:'string' desc:'The format template to apply.'}
	]}
	{ name:'timestamp' desc:'Formats a date value as a timestamp using placeholder characters, where repeated characters render more descriptive or padded values. Any non-placeholder characters are rendered as entered. The default format is yyyy-MM-dd HH:mm:ss. {dateparts}' opts:[
		{ name:'format' type:'string' desc:'The format template to apply.'}
	]}
	{ name:'timestamptz' desc:'Formats a date value as a timestamp with timezone offset using placeholder characters, where repeated characters render more descriptive or padded values. Any non-placeholder characters are rendered as entered. The default format is yyyy-MM-dd HH:mm:sszzz. {dateparts}' opts:[
		{ name:'format' type:'string' desc:'The format template to apply.'}
	]}
	{ name:'trim' desc:'Removes any whitespace from the ends of the value.' }
]`;

export const generateMarkdown = `let mkarr = =>if count(_) then _ else [_]

// expand operators such that there is one name per entry
let expandedOps = sort(reduce(operators |a c| =>
	a + map(mkarr(c.op) =>{ op:_ alias:filter(mkarr(^c.op) =>_ != ^^_) sig:^c.sig opts:^c.opts note:^c.note })
 []) [=>op])

// expand formats such that there is one name per entry
let expandedFormats = sort(reduce(formats |a c| =>
	a + map(mkarr(c.name) =>{ name:_ alias:filter(mkarr(^c.name) =>_ != ^^_) desc:^c.desc opts:^c.opts })
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
