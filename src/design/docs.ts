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
    { bin:1 proto:'(any, schema) => boolean' desc:'(Only applies to the \\'is\\' alias) Returns true if the given value loosely conforms to the given schema.' }
	]}
	{ op:['!=' 'is-not'] sig:[
		{ bin:1 proto:'(any, any) => boolean' desc:'Returns true if the given values are not equal (not strict).' }
    { bin:1 proto:'(any, schema) => boolean' desc:'(Only applies to the \\'is-not\\' alias) Returns true if the given value does not loosely conform to the given schema.' }
	]}
	{ op:['===' 'deep-is'] sig:[
		{ bin:1 proto: '(any, any) => boolean' desc:'Do a deep equality check on the first two arguments using loose equality for primitives.' }
		{ proto: "(any, any, 'strict'|'loose'|application) => boolean" desc:'Do a deep equality check on the first two arguments using the comparison method specified by the third argument. If an application is given, it will be called with each item being checked at each step in the recursive check to determine equality.' }
	]}
	{ op:['!==' 'deep-is-not'] sig:[
		{ bin:1 proto: '(any, any) => boolean' desc:'Do a deep inequality check on the first two arguments using loose equality for primitives.' }
		{ proto: "(any, any, 'strict'|'loose'|application) => boolean" desc:'Do a deep inequality check on the first two arguments using the comparison method specified by the third argument. If an application is given, it will be called with each item being checked at each step in the recursive check to determine equality.' }
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
		{ proto:'(object, application) => object' desc:'Filters the given object using the given application to remove entries that return a false-y result.' }
		{ proto:'(any[], application, sort[]) => any[]' desc:'Filters the given array using the given application to remove entries that return a false-y result. The result is then sorted using the given sort array.' }
		{ proto:'(object, application, sort[]) => object' desc:'Filters the given object using the given application to remove entries that return a false-y result. The result is then sorted using the given sort array.' }
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
  { op:'index' sig:[
    { agg:1 proto:'(array, application) => object' desc:'Returns a map of the given array keyed on the result of the application. If the application returns a tuple, the values in the map will be the second value in the tuple and the keys will be the first. If the application returns an empty tuple, the value in the array will be omitted from the result.' }
  ] opts: [
    { name:'many' type::boolean desc:'If enabled, the values will be lists of values with matching keys.' }
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
		{ proto:'(any[], number) => any' desc:'Returns the nth item in the given array using a 1-based index. If the number is negative, the offset is from the end rather than the beginning.' }
		{ agg:1 proto:'number => any' desc:'Returns the nth item in the current source using a 1-based index. If the number is negative, the offset is from the end rather than the beginning.' }
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
		{ proto:'(any[], sort[]) => any[]' desc:'Sorts the given array using the given sort array. Any array elements that are strings may indicate direction with a leading + or - for ascending and descending, respectively. The remainder of the string is parsed and used as an application. Any array elements that are applications are applied directly to get a comparison value. Any arguments that are objects may include a by key with an application value along with asc, desc, or dir flags. If no sorts are provided, an identity sort will be applied.' }
		{ proto:'(object, sort[]) => object' desc:'Sorts the given object keys using the given sort array. Any array elements that are strings may indicate direction with a leading + or - for ascending and descending, respectively. The remainder of the string is parsed and used as an application. Any array elements that are applications are applied directly to get a comparison value. Any arguments that are objects may include a by key with an application value along with asc, desc, or dir flags. If no sorts are provided, an identity sort will be applied to the keys.' }
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

export const languageReference = `<html>
<head><title>Raport Expression Language Reference</title></head>
<style>
  html {
	font-family: sans-serif;
	font-size: 1em;
	background-color: #eee;
  }
  h1 { text-align: center; }
  h2 { margin-top: 3em; }
  h3 { margin-top: 1.5em; }
  body { padding: 1em; }
  code {
	font-family: monospace;
	padding: 0.4em;
	vertical-align: baseline;
	font-size: 1.1em;
	line-height: 1em;
	box-sizing: border-box;
	display: inline-block;
	border: 1px solid #ddd;
	background-color: #f0f0f0;
  }

  div.indent {
	padding-left: 1em;
  }

  .ast-nodes .reference {
	color: #43b;
	font-weight: 500;
  }

  .ast-nodes .primitive,
  .ast-nodes .number,
  .ast-nodes .date,
  .ast-nides .timespan {
	color: #087;
	font-weight: 500;
  }

  .ast-nodes .format-op {
	color: #e81;
  }

  .ast-nodes .string,
  .ast-nodes .string > .ast-extra {
	color: #170;
  }

  .ast-nodes .string > .string-interpolation {
	font-style: oblique;
  }

  .ast-nodes .binary-op > .ast-extra,
  .ast-nodes .conditional > .ast-extra {
	color: #a66;
  }

  .ast-nodes .typelit,
  .ast-nodes .typelit > .ast-extra {
	color: #361;
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
	color: #4bc;
  }

  .ast-nodes .case-block > .ast-extra,
  .ast-nodes .unless-block > .ast-extra,
  .ast-nodes .if-block > .ast-extra {
	color: #1de;
  }

  .ast-nodes .with-block > .ast-extra {
	color: #29c;
  }
</style>
<body>

<h1 id="raport-expression-language-reference">Raport Expression Language Reference</h1>
<p>As implied by Raport Expression Language (REL), the language is composed entirely of expessions. There are no statements. The expressions are composed only of operations and values.</p>
<h2 id="syntax">Syntax</h2>
<div class=indent>
<p>The root syntax is based on LISP, but the most common usage relies on sugared syntax that more closely resembles other commom languages. The general LISP-y syntax is <code>([operator] ...args)</code>, where <code>args</code> are values or operations. The default parser will accept multiple expressions in sequence and automatically wrap them in a <code>block</code> operation.</p>
</div>

<h2 id="values">Values</h2>
<div class=indent>
<p>Built-in data types include numbers, strings, booleans, objects, arrays, applications, null, undefined, dates, and schemas. There is also a range pseudo-value available to certain operators that automaically parse it from a string in certain circumstances.</p>
<h3 id="numbers">Numbers</h3>
<p>Numbers may have an optional leading <code>-</code>, one or more digits, optionally separated by <code>_</code>, an optional <code>.</code> followed by one or more digits, optionally separated by <code>_</code>, and an optional <code>e</code> followed by an optional <code>-</code> and one or more digits, optionally separated by <code>_</code>.</p>
<p>Example: <code><span class=ast-nodes><span class="number">1</span></span></code>, <code><span class=ast-nodes><span class="number">-1</span></span></code>, <code><span class=ast-nodes><span class="number">0.1</span></span></code>, <code><span class=ast-nodes><span class="number">-0.1</span></span></code>, <code><span class=ast-nodes><span class="number">111_000</span></span></code>, <code><span class=ast-nodes><span class="number">-5_0</span></span></code>, <code><span class=ast-nodes><span class="number">3.14159e-10</span></span></code></p>
<h3 id="strings">Strings</h3>
<p>Strings come in three different flavors: symbolic, single-quoted with optional interpolation, and double-quoted. The symbolic form is constructed of a leading <code>:</code> followed character that is not whitespace or one of <code>():{}[]&lt;&gt;,;\\&amp;#</code> or a quote.</p>
<p>Single-quoted strings may be quoted with <code>&#39;</code> or <code>&#96;</code>, and interpolators are contained within <code>{}</code>, optionally prefixed with <code>$</code>.</p>
<p>Quoted strings may have any character within escaped with <code>\\</code>, including the interpolation delimiters within single-quoted strings. Any characters that are not the terminating quote are included in the string, including newlines.</p>
<p>Example: <code><span class=ast-nodes><span class="string">:foo22</span></span></code>, <code><span class=ast-nodes><span class="string">'test string'</span></span></code>, <code><span class=ast-nodes><span class="string">&quot;test string&quot;</span></span></code>, <code><span class=ast-nodes><span class="string"><span class="ast-extra">'an </span><span class="string-interpolation"><span class="ast-extra">{</span><span class="reference">interpolated</span><span class="ast-extra">}</span></span><span class="ast-extra"> string'</span></span></span></code></p>
<h3 id="booleans">Booleans</h3>
<p>Simply <code><span class="ast-nodes"><span class="primitive">true</span></span></code> and <code><span class="ast-nodes"><span class="primitive">false</span></span></code>. REL uses truthiness so as not to require explicit conversion of values to booleans. Anything that is not <code><span class="ast-nodes"><span class="primitive">null</span></span></code>, <code><span class="ast-nodes"><span class="primitive">undefined</span></span></code>, <code><span class="ast-nodes"><span class="primitive">false</span></span></code>, <code><span class="ast-nodes"><span class="number">0</span></span></code>, <code>NaN</code>, or an empty string is considered equivalent to <code><span class="ast-nodes"><span class="primitive">true</span></span></code>.</p>
<h3 id="objects">Objects</h3>
<p>Object literals consist of key/value pairs contained within <code>{}</code>s. Keys may be quoted, though it&#39;s only necessary for non-symbolic names or interpolation. Key/value pairs may be separated with <code>,</code>s, and the last pair may have a trailing <code>,</code>.</p>
<p>Example: <code><span class="ast-nodes"><span class="object"><span class="ast-extra">{ foo:</span><span class="string">:bar</span><span class="ast-extra"> baz:</span><span class="string">'bat'</span><span class="ast-extra"> bip:</span><span class="binary-op"><span class="reference">bop</span><span class="ast-extra"> * </span><span class="number">22</span></span><span class="ast-extra"> </span><span class="string">'some str'</span><span class="ast-extra">:</span><span class="number">99</span><span class="ast-extra"> </span><span class="string"><span class="ast-extra">'nine</span><span class="string-interpolation"><span class="ast-extra">{</span><span class="binary-op"><span class="number">9</span><span class="ast-extra"> + </span><span class="number">1</span></span><span class="ast-extra">}</span></span><span class="ast-extra">'</span></span><span class="ast-extra">:</span><span class="number">19</span><span class="ast-extra"> }</span></span></span></code></p>
<h3 id="arrays">Arrays</h3>
<p>Array literals consist of values contained within <code>[]</code>s. Values may be separated by <code>,</code>s, and the last value may have a trailing <code>,</code>.</p>
<p>Example: <code><span class="ast-nodes"><span class="array"><span class="ast-extra">[</span><span class="string">:a</span><span class="ast-extra"> </span><span class="string">:b</span><span class="ast-extra"> </span><span class="string">:c</span><span class="ast-extra"> </span><span class="number">1</span><span class="ast-extra"> </span><span class="number">2</span><span class="ast-extra"> </span><span class="number">3</span><span class="ast-extra">]</span></span></span></code></p>
<h3 id="applications">Applications</h3>
<p>An application is an expression that isn&#39;t immediately evaluated. Applications may optionally start with an argument list with named arguments listed between <code>||</code>s, then a required big arrow <code>=&gt;</code>, and an expression than may be enclosed in a block.</p>
<p>Example: <code><span class="ast-nodes"><span class="application"><span class="ast-extra">=&gt; </span><span class="binary-op"><span class="reference">_</span><span class="ast-extra"> + </span><span class="number">10</span></span></span></span></code>, <code><span class="ast-nodes"><span class="application"><span class="ast-extra">|a b c| =&gt; </span><span class="binary-op"><span class="reference">a</span><span class="ast-extra"> * </span><span class="reference">b</span><span class="ast-extra"> + </span><span class="reference">c</span></span></span></span></code></p>
<h3 id="null">Null</h3>
<p>Simply <code><span class="ast-nodes"><span class="primitive">null</span></span></code>. Null in a language with <code><span class="ast-nodes"><span class="primitive">undefined</span></span></code> is a bit of a strange concept, but it can be useful as a sort of &quot;this field intentionally left blank&quot; indicator. It also survives in JSON.</p>
<h3 id="undefined">Undefined</h3>
<p>Simply <code><span class="ast-nodes"><span class="primitive">undefined</span></span></code>. This will be omitted in JSON.</p>
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
<li>All remaining keys can be matched with the special key <code>...</code> to ensure that any other keys within an object arematch a certain type e.g. <code>{ a:number ...:string }</code> will match any object with an <code>a</code> key that is a number and all other keys, if any, that have string values.</li>
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
<li>a <code>*</code>, indicating any number</li>
</ul>
<p>Exmaple: <code><span class="ast-nodes"><span class="string">'1, 3, 5, 7, &gt;10'</span></span></code>, <code><span class="ast-nodes"><span class="string">'22-33 44 55-66'</span></span></code></p>
</div>

<h2 id="references">References</h2>
<div class=indent>
<p>REL is built around contexts that are somewhat analogous to stack frames that have an inherent base value. When an expression is being evaluated there is usually some value that is currently in scope as the focus of the context. The value of at the base of the current scope is available as the special reference <code><span class="ast-nodes"><span class="reference">@value</span></span></code> or <code>_</code>. If the value happens to have properties, they can be referenced directly by their names e.g. in a context with a value of <code>{ foo: 21, bar: 22 }</code>, the reference <code><span class="ast-nodes"><span class="reference">foo</span></span></code> will resolve to <code>21</code> when evaluated.</p>
<p>If the context value happens to have a nested structure built of object and/or arrays, further children of the primary property can be accessed using dotted path or bracketed path notation e.g. <code><span class="ast-nodes"><span class="reference">foo.bar</span></span></code>, <code><span class="ast-nodes"><span class="reference">array.1.prop</span></span></code> or <code><span class="ast-nodes"><span class="reference"><span class="ast-extra">array[</span><span class="number">1</span><span class="ast-extra">].prop</span></span></span></code>, and <code><span class="ast-nodes"><span class="reference"><span class="ast-extra">foo[</span><span class="binary-op"><span class="string">:ba</span><span class="ast-extra"> + </span><span class="string">:r</span></span><span class="ast-extra">]</span></span></span></code>. The bracketed notation allows for expressions to be used when resolving names. References are always resolved safely to <code>undefined</code>, so doing something like <code><span class="ast-nodes"><span class="binary-op"><span class="object"><span class="ast-extra">{ foo:</span><span class="string">:bar</span><span class="ast-extra"> }</span></span><span class="ast-extra">.baz.bat</span></span></span></code> does not cause an error.</p>
<p>Contexts may also have defined local variables, such as named arguments passed to an application, or any names defined by the <code>let</code> operator. These take precedent over context value properties in their scope, so to access a property with the same name as a local variable, you would have to use a special reference e.g. <code><span class="ast-nodes"><span class="reference">_.foo</span></span></code>.</p>
<h3 id="prefixes">Prefixes</h3>
<p>As indicated above, there are certain special references available in certain contexts. These references have the prefix <code>@</code>, and <code><span class="ast-nodes"><span class="reference">@value</span></span></code> is always available. Another example of a special reference is <code><span class="ast-nodes"><span class="reference">@index</span></span></code>, which is often available in contexts where iteration is taking place.</p>
<p>Report definitions may include named parameters that are kept in a separate namespace from the report root context value. These values are available in any context by prefixing their name with a <code>!</code> e.g. <code><span class="ast-nodes"><span class="reference">!date</span></span></code> would resolve the value passed for the <code>date</code> parameter.</p>
<p>Parent contexts are also available from their children by applying the context pop prefix <code>^</code> one or more times to a reference e.g. <code><span class="ast-nodes"><span class="reference">^foo</span></span></code> will resolve to whatever <code><span class="ast-nodes"><span class="reference">foo</span></span></code> would resolve to in the parent context, and <code><span class="ast-nodes"><span class="reference"><span class="ast-extra">^^^foo.bar[</span><span class="number">9</span><span class="ast-extra">]</span></span></span></code> will resolve to whatever <code><span class="ast-nodes"><span class="reference"><span class="ast-extra">foo.bar[</span><span class="number">9</span><span class="ast-extra">]</span></span></span></code> would resolve to in the great-grandparent context.</p>
<p>The root context value is also available in any context by prefixing a reference with the root context prefix <code>~</code> e.g. <code><span class="ast-nodes"><span class="reference">~foo.bar</span></span></code> will resolve to <code><span class="ast-nodes"><span class="reference">foo.bar</span></span></code> in the root context.</p>
<p>Report definitions may include named data sources that are kept in a separate namespace from the report root context value.  These data sources are available in any context by prefixing their name with a <code>*</code> e.g. <code><span class="ast-nodes"><span class="reference">*people</span></span></code> would resolve to the data passed or retrieved for the <code>people</code> data source.</p>
</div>

<h2 id="comments">Comments</h2>
<div class=indent>
<p>Any expression may be preceeded by any number of line comments, which start with <code>//</code> and include any subsequent characters up to a newline. The final line may not be comment, as comments must be followed by an expression.</p>
<p>Example: <pre><code><span class="ast-nodes"><span class="comment">// add a and b
</span><span class="binary-op"><span class="reference">a</span><span class="ast-extra"> + </span><span class="reference">b</span></span></span></code></pre></p>
</div>

<h2 id="variables">Variables</h2>
<div class=indent>
<p>Most of the data accessed in REL comes from a data source, and as such, it doesn&#39;t often make sense to change any values. There are some cases where local variables can be quite useful to allow breaking up complex calculations into steps or to foward an alias into an algorithm. For these purposes, REL has <code>let</code> and <code>set</code> operators, which change a value in the local scope and local context, respectively. The <code>let</code> operator works with the <code>^</code> prefix to allow accessing parent scopes. The <code>set</code> operator works with <code>~</code> and <code>^</code> prefixes to allow working with the root and parent contexts.</p>
<p>Example: <code><span class="ast-nodes"><span class="let"><span class="ast-extra">let </span><span class="reference">foo</span><span class="ast-extra"> = </span><span class="number">10</span></span></span></code>, <code><span class="ast-nodes"><span class="set"><span class="ast-extra">set </span><span class="reference">~name</span><span class="ast-extra"> = </span><span class="string">:Joe</span></span></span></code>, <code><span class="ast-nodes"><span class="let"><span class="ast-extra">let </span><span class="reference">^^type</span><span class="ast-extra"> = </span><span class="object"><span class="ast-extra">{ size: </span><span class="number">22</span><span class="ast-extra">, id:</span><span class="string">:1</span><span class="ast-extra"> }</span></span></span></span></code></p>
</div>

<h2 id="operations">Operations</h2>
<div class=indent>
<p>Operators are the foundational component of REL, as everything within REL other than a few of the primitive literals, references, and comments are built as operators. An operator may be called using LISP syntax, call syntax, or in many cases special syntax such as unary or boolean syntax. The following are equivalent:</p>
<ul>
<li><code><span class="ast-nodes"><span class="s-expression"><span class="ast-extra">(if </span><span class="binary-op"><span class="reference">foo</span><span class="ast-extra"> &gt; </span><span class="number">10</span></span><span class="ast-extra"> </span><span class="string">:large</span><span class="ast-extra"> </span><span class="binary-op"><span class="reference">foo</span><span class="ast-extra"> &lt; </span><span class="number">5</span></span><span class="ast-extra"> </span><span class="string">:small</span><span class="ast-extra"> </span><span class="string">:medium</span><span class="ast-extra">)</span></span></span></code></li>
<li><code><span class="ast-nodes"><span class="call"><span class="ast-extra">if(</span><span class="binary-op"><span class="reference">foo</span><span class="ast-extra"> &gt; </span><span class="number">10</span></span><span class="ast-extra"> </span><span class="string">:large</span><span class="ast-extra"> </span><span class="binary-op"><span class="reference">foo</span><span class="ast-extra"> &lt; </span><span class="number">5</span></span><span class="ast-extra"> </span><span class="string">:small</span><span class="ast-extra"> </span><span class="string">:medium</span><span class="ast-extra">)</span></span></span></code></li>
<li><code><span class="ast-nodes"><span class="conditional"><span class="ast-extra">if </span><span class="binary-op"><span class="reference">foo</span><span class="ast-extra"> &gt; </span><span class="number">10</span></span><span class="ast-extra"> then </span><span class="string">:large</span><span class="ast-extra"> elif </span><span class="binary-op"><span class="reference">foo</span><span class="ast-extra"> &lt; </span><span class="number">5</span></span><span class="ast-extra"> then </span><span class="string">:small</span><span class="ast-extra"> else </span><span class="string">:medium</span></span></span></code></li>
<li><code><span class="ast-nodes"><span class="conditional"><span class="ast-extra">if </span><span class="binary-op"><span class="reference">foo</span><span class="ast-extra"> &gt; </span><span class="number">10</span></span><span class="ast-extra"> </span><span class="block"><span class="ast-extra">{ </span><span class="string">:large</span><span class="ast-extra"> }</span></span><span class="ast-extra"> elif </span><span class="binary-op"><span class="reference">foo</span><span class="ast-extra"> &lt; </span><span class="number">5</span></span><span class="ast-extra"> </span><span class="block"><span class="ast-extra">{ </span><span class="string">:small</span><span class="ast-extra"> }</span></span><span class="ast-extra"> else </span><span class="block"><span class="ast-extra">{ </span><span class="string">:medium</span><span class="ast-extra"> }</span></span></span></span></code></li>
</ul>
<p>Most operators are limited to LISP and call syntax because that&#39;s how they&#39;re most reasonably used. <code>+</code> and <code>not</code> are available as unary operators. Supported binary operators in order of precedence are exponentiation (<code>**</code>), mutiplication/division/modulus/int division (<code>*</code>, <code>/</code>, <code>%</code>, <code>/%</code>), addition/subtraction (<code>+</code>, <code>-</code>), comparison (<code>&gt;=</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&lt;</code>, <code>ilike</code>, <code>in</code>, <code>like</code>, <code>not-ilike</code>, <code>not-like</code>, <code>not-in</code>, <code>contains</code>, <code>does-not-contain</code>, <code>gt</code>, <code>gte</code>, <code>lt</code>, <code>lte</code>), equality (<code>is</code>, <code>is-not</code>, <code>==</code>, <code>!=</code>, <code>deep-is</code>, <code>deep-is-not</code>, <code>strict-is</code>, <code>strict-is-not</code>, <code>===</code>, <code>!==</code>), boolean and (<code>and</code>, <code>&amp;&amp;</code>), and boolean or (<code>or</code>, <code>\|\|</code>) and nullish coalescing (<code>??</code>). At least one space is required on either side of a binary operator.</p>
<p>Most operators take a number of arguments, which are passed within their <code>()</code>s. Some operators will evaluate their arguments lazily, like <code>and</code> and <code>or</code>, and others will evaluate all of their arguments before processing them. Some operators will implicitly operate on their nearest data source, and these are internally configured as aggregate operators, including <code>sum</code> and <code>avg</code>.</p>
<p>Call operations may be attached to a reference such that the reference further refines the result of the call operation.</p>
<p>Example: <code><span class="ast-nodes"><span class="binary-op"><span class="call"><span class="ast-extra">find(</span><span class="reference">list</span><span class="ast-extra"> </span><span class="application"><span class="ast-extra">=&gt;</span><span class="binary-op"><span class="call"><span class="ast-extra">len(</span><span class="reference">parts</span><span class="ast-extra">)</span></span><span class="ast-extra"> &gt; </span><span class="number">10</span></span></span><span class="ast-extra">)</span></span><span class="ast-extra">.name</span></span></span></code></p>
<h3 id="named-arguments">Named arguments</h3>
<p>Operators that are called in LISP or call syntax may also accept named arguments that are specified as key/value pairs at the end of the argument list. These are often used to control specialized behavior or the operator using flags that would otherwise be cumbersome as positional arguments e.g. <code><span class="ast-nodes"><span class="call"><span class="ast-extra">parse(</span><span class="string">'1 3 5 7'</span><span class="ast-extra"> range:</span><span class="number">1</span><span class="ast-extra">)</span></span></span></code>, which asks the <code>parse</code> operator to parse the given string as a range rather than the default REL expression.</p>
<h3 id="formats">Formats</h3>
<p>There is a built-in format operator that formats values as strings using registered formatters. One example is the <code>date</code> formatter that outputs <code>date</code> values as strings in the <code>yyyy-MM-dd</code> format by default. It can also accept an argument that specifies the format to use when converting the date to a string. The <code>format</code> operator can be called explicitly or, since formatting values as strings is a fairly common need, using a special postfix format operation syntax that is a <code>#</code> followed by the name of the formatter and optionally any argument expressions separated by <code>,</code>s with no whitespaces. The following are equivalent:</p>
<ul>
<li><code><span class="ast-nodes"><span class="call"><span class="ast-extra">format(</span><span class="reference">@date</span><span class="ast-extra"> </span><span class="string">:date</span><span class="ast-extra"> </span><span class="string">'MM/dd/yyyy'</span><span class="ast-extra">)</span></span></span></code></li>
<li><code><span class="ast-nodes"><span class="binary-op"><span class="reference">@date</span><span class="format-op"><span class="ast-extra">#date,</span><span class="string">'MM/dd/yyyy'</span></span></span></span></code></li>
</ul>
<h3 id="pipes">Pipes</h3>
<p>Processing data often calls operators on the results of calling operators on the results of calling operators, resulting in large nested argument lists that can become hard to keep track of. To address this, REL has a special built-in <code>pipe</code> operator that accepts a starting value and forwards it through the list of calls supplied to it as arguments, replacing the value with the result of the previous call each time. If one of the arguments to a call is <code>_</code>, the call will be evaluated as-is, but if no reference to <code>_</code> appears in the call arguments list, <code>_</code> will be supplied as the first argument. The following are equivalent:</p>
<ul>
<li><code><span class="ast-nodes"><span class="call"><span class="ast-extra">join(</span><span class="call"><span class="ast-extra">map(</span><span class="call"><span class="ast-extra">filter(</span><span class="reference">things</span><span class="ast-extra"> </span><span class="application"><span class="ast-extra">=&gt;</span><span class="binary-op"><span class="reference">count</span><span class="ast-extra"> &gt; </span><span class="number">10</span></span></span><span class="ast-extra">)</span></span><span class="ast-extra"> </span><span class="application"><span class="ast-extra">=&gt;</span><span class="reference">name</span></span><span class="ast-extra">)</span></span><span class="ast-extra"> </span><span class="string">', '</span><span class="ast-extra">)</span></span></span></code></li>
<li><code><span class="ast-nodes"><span class="call"><span class="ast-extra">pipe(</span><span class="reference">things</span><span class="ast-extra"> </span><span class="call"><span class="ast-extra">filter(</span><span class="application"><span class="ast-extra">=&gt;</span><span class="binary-op"><span class="reference">count</span><span class="ast-extra"> &gt; </span><span class="number">10</span></span></span><span class="ast-extra">)</span></span><span class="ast-extra"> </span><span class="call"><span class="ast-extra">map(</span><span class="application"><span class="ast-extra">=&gt;</span><span class="reference">name</span></span><span class="ast-extra">)</span></span><span class="ast-extra"> </span><span class="call"><span class="ast-extra">join(</span><span class="string">', '</span><span class="ast-extra">)</span></span><span class="ast-extra">)</span></span></span></code></li>
</ul>
<p>The latter is a bit longer, but considerably more easy to follow.</p>
</div>

<h2 id="flow-control">Flow Control</h2>
<div class=indent>
<h3 id="block">block</h3>
<p>A block isn&#39;t really flow control, but being an expression-based language, a way to execute a number of expressions ignoring results until the final expression is quite useful. The <code>block</code> operator does just that. The built-in syntax for a block operation is one or more expressions placed with <code>{}</code>s, separated by whitespace and/or <code>;</code>s.</p>
<p>Blocks introduce their own lexical scope, so any variables declared within them will not escape their scope. You can still access parent contexts though, so it is possible to <code>let</code> variables from any context that is parent to the block scope using the appropriate reference.</p>
<p>Exmaple: <code><span class="ast-nodes"><span class="block"><span class="ast-extra">{ </span><span class="let"><span class="ast-extra">let </span><span class="reference">a</span><span class="ast-extra"> = </span><span class="number">10</span></span><span class="ast-extra">; </span><span class="let"><span class="ast-extra">let </span><span class="reference">b</span><span class="ast-extra"> = </span><span class="number">20</span></span><span class="ast-extra">; </span><span class="binary-op"><span class="reference">a</span><span class="ast-extra"> + </span><span class="reference">b</span></span><span class="ast-extra"> }</span></span></span></code></p>
<h3 id="if">if</h3>
<p>The primary form of conditional flow control is handled by the <code>if</code> operator, which takes a conditional argument followed by a truth case expression, any number of additional conditional and truth case expressions, and then an optional alternate expression. As an operator, <code>if</code> may be called as any other operator, but there is also built-in syntax to make it slightly more readable in the form <code>if</code> followed by a condition expression, followed by any number of alternate conditions and expressions in the form <code>else if</code> or <code>elseif</code> or <code>elsif</code> or <code>elif</code> followed by <code>then</code> and the value expression, optionally followed by <code>else</code> and a final alternate value expression.</p>
<p>The result of an <code>if</code> expression is the value of the value expression paired with the first matching conditional branch, the value of the final alternate branch if no conditions matched, or <code>undefined</code> if there were no matches and no final alternate value.</p>
<p>If an <code>if</code> needs to be nested in a way that may make further conditionals ambiguous, the expression can be ended with <code>end</code> or <code>fi</code>. The value expression of a branch may also be a block, which will also remove any ambiguity.</p>
<p>Example: <code><span class="ast-nodes"><span class="conditional"><span class="ast-extra">if </span><span class="binary-op"><span class="reference">count</span><span class="ast-extra"> &gt; </span><span class="number">23</span></span><span class="ast-extra"> then </span><span class="string">'there are dozens of us!'</span><span class="ast-extra"> elif </span><span class="binary-op"><span class="reference">count</span><span class="ast-extra"> &lt; </span><span class="number">0</span></span><span class="ast-extra"> then </span><span class="string">'not sure what happened'</span><span class="ast-extra"> else </span><span class="string">'something else'</span></span></span></code>, <code><span class="ast-nodes"><span class="conditional"><span class="ast-extra">if </span><span class="binary-op"><span class="reference">a</span><span class="ast-extra"> &gt; </span><span class="reference">b</span></span><span class="ast-extra"> then </span><span class="conditional"><span class="ast-extra">if </span><span class="binary-op"><span class="reference">b</span><span class="ast-extra"> &lt; </span><span class="number">12</span></span><span class="ast-extra"> then </span><span class="string">:c</span><span class="ast-extra"> else </span><span class="string">:d</span><span class="ast-extra"> end</span></span><span class="ast-extra"> elif </span><span class="binary-op"><span class="reference">b</span><span class="ast-extra"> &gt; </span><span class="reference">a</span></span><span class="ast-extra"> then </span><span class="string">:e</span><span class="ast-extra"> else </span><span class="string">:f</span></span></span></code></p>
<h3 id="unless">unless</h3>
<p>Unless is a negated <code>if</code>. If the conditional expression evaluates to a truthy value, then the value expression will be the result. <code>unless</code> also allows for an alternate value expression but does not allow additional condition cases. The built-in unless syntax starts with <code>unless</code> followed by a conditional expression, followed by <code>then</code> and a value expression, optionally followed by <code>else</code> and an alternate value expression, optionally followed by <code>end</code>.</p>
<p>Example: <code><span class="ast-nodes"><span class="conditional"><span class="ast-extra">unless </span><span class="reference">loggedIn</span><span class="ast-extra"> then </span><span class="string">'Please log in'</span></span></span></code></p>
<h3 id="case">case</h3>
<p>REL also has a case operator that allows for an alternate branch style that may be more comprehensible in some cases. Each branch condition is evaluated lazily, and if it is an expression will have the value being evaluated available as the special <code>@case</code> reference. If using the built-in syntax, <code>_</code> will also evaluate to <code>@case</code>. <code>case</code> expressions begin with <code>case</code> followed by a value expression, followed by any number of branches that start with <code>when</code> followed by a conditional value or expression, followed by <code>when</code> and a value expression, and finally optionally ending with an alternate <code>else</code> and value expression and optional <code>end</code> or <code>esac</code>.</p>
<p>Example:</p>
<pre><code><span class="ast-nodes"><span class="ast-extra">case </span><span class="reference">age</span><span class="ast-extra">
  when </span><span class="binary-op"><span class="reference">_</span><span class="ast-extra"> &lt; </span><span class="number">13</span></span><span class="ast-extra"> then </span><span class="string">'ask a parent'</span><span class="ast-extra">
  when </span><span class="number">15</span><span class="ast-extra"> then </span><span class="string">'happy quinceanera'</span><span class="ast-extra">
  when </span><span class="number">99</span><span class="ast-extra"> then </span><span class="string">'last year for legos, friend'</span><span class="ast-extra">
  when </span><span class="binary-op"><span class="reference">_</span><span class="ast-extra"> &gt;= </span><span class="number">18</span></span><span class="ast-extra"> then </span><span class="string">'ok'</span><span class="ast-extra">
  else </span><span class="string">'NaN, I guess'</span></span>
</code></pre>
</div>

</body>
</html>`;
