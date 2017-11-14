# Radix Calculator.JS
## Summary
Provides very simple API for converting and calculating numbers in various numeral systems with radixes between 2 and 36. Main feature is **visualisation** of calculations on a sheet in a boxes. Examples:
![Division](https://imgur.com/a/7kRH1)
![Multiplication](https://imgur.com/a/f3EvE)
![Addition](https://imgur.com/a/hJJ0y)
![Subtraction](https://imgur.com/a/4yqCb)
#### You can also see demo in [repo's subdirectory](https://github.com/shevchenkobn/radix-calculator/tree/master/demo).
## Usage
### Repo's structure
In [dist subdirectory](https://github.com/shevchenkobn/radix-calculator/tree/master/demo) there are two files. Hence Radix Calculator needs [jquery](https://github.com/jquery/jquery) to operate you can use `radix-calculator.bundle.js`, where jquery slim is included, or `radix-calculator.min.js` which contains only library itself.
##### Tested with jquery v3.2.1
### Library API
It consists of two classes:
* `RadixConverter`
* `RadixCalculator`

**RadixConverter()** is constructed with no arguments. Instance is function.
```js
function(number: [number, string], inputRadix: number, outputRadix: number)
```

Instance has following methods and properties:
* `fractionLimit: number` gets or sets fraction limit of number. **Negative by default**. If negative, it will not affect the number. If non-negative:
  * If converted number fraction length is smaller than limit, the difference will be filled by zeros.
  * If converted number fraction length is larger than limit, **nothing** will be done unless `crop === true`.
* `crop: bool` can be get or set. Combined with `fractionLimit`. If `crop` is true, `fractionLimit` is non-negative and number fraction exceeds the limit, fraction will be cropped.
* `delimiter: string` gets or sets decimal point character. Length must be 1.
* `convert(number, inputRadix, outputRadix)` instance function itself.
* `toDecimal(cypher: string): string` converts any radix cypher to decimal.
* `toArbitrary(cypher: string, number): string` converts decimal number to 36 radix cypher.
* `isAnyRadixCypher(cypher: string): bool`
* `isValidNumber(number: string, radix: number): bool` checks if number is valid within radix numeral system. Uses `delimeter` as decimal point.
* `isValidRadix(radix: number)` radix must be between 2 and 36.

**RadixCalculator(id: string[, delimiter: string]**, where `id` - id of container for visualisation output. Instance is function.
```js
function(action: instance.actionEnum, radix: number, args: Array<string>[, isTwoComplement: bool]): string
```
`args` - arguments for math example,
`isTwoComplement` - specifies if calculating a sum of binary numbers in two's complement, combined with `instance.actionEnum.ADD` (in this case `delimiter` separates sign of argument, not decimal part).
Return value: string with math action result.

Methods and properties:
* `fractionLimit: number` gets or sets quotient fraction length limit. Used only by division. If equals zero, quotient won't have fraction.
* `possibleDelimiters: Array<string>` gets array of possible delimiters.
* `delimiter: string` gets or sets fraction delimiter.
* `clearOutput(): undefined` clears example visualization container.
* `getConverterInstance(): RadixConverter`
* `calculate(action: instance.actionEnum, radix: number, args: Array<string>[, isTwoComplement: bool]): string` instance function.
* `actionEnum: object` object is used as enum. Specifies action for calculation. Available options:
  * `ADD`
  * `SUBTRACT`
  * `MULTIPLY`
  * `DIVIDE`
* `truncateZeros: bool` get or set. Defines if argument's fraction ending zeros should be truncated e.g. '1.234000' -> '1.234'.


