;(function() {
  'use strict';
  function getPropDescriptor(value, notEnum) {
    var obj = {value: value};
    if (!notEnum) {
      obj.enumerable = true;
    }
    return obj;
  }
  function RadixConverter() {
    var convertTokens = {};
    function toDecimal(token) {
      if (!convertTokens[token]) {
        var num = parseInt(token);
        if (num >= 0 && num < 10) {
          convertTokens[token] = num;
        } else {
          token += '';
          var code = token.charCodeAt(0);
          if (convertTokens[token] < 65 ||
            convertTokens[token] > 90) {
            throw new TypeError('Not an uppercase letter nor number');
          }
          convertTokens[token] = code - 55;
        }
      }
      return convertTokens[token];
    }
    function toArbitrary(num) {
      if (typeof num !== 'number' || num < 0 || num > 36) {
        throw new RangeError('Number must be between 2 and 36');
      }
      num = parseInt(num);
      if (!convertTokens[num]) {
        if (num < 10) {
          convertTokens[num] = num;
        } else {
          convertTokens[num] = String.fromCharCode(55 + num);
        }
      }
      return convertTokens[num];
    }
    var alphaNumRegex = /^[A-Z0-9]+$/;
    function isAnyRadixCypher(str) {
      return alphaNumRegex.test(str);
    }
    function isValidRadix(radix) {
      radix = parseInt(radix);
      return !(isNaN(radix) || radix < 2 || radix > 36);
    }
    function validateRadix() {
      for (var i = 0; i < arguments.length; i++) {
        if (!isValidRadix(arguments[i])) {
          throw new RangeError('Radix must been between 2 and 36');
        }
      }
      return true;
    }
    function isValidNumber(num, radix) {
      validateRadix(radix);
      num = (num + '').toUpperCase();
      var maxCipher = toArbitrary(radix - 1);
      if (maxCipher < 10) {
        var numberTest = new RegExp('^-?[0-' + maxCipher + ']*\\' +
          delimiter + '?[0-' + maxCipher + ']*$');
      } else {
        var numberTest = new RegExp('^-?[0-9A-' + maxCipher + ']*\\' +
          delimiter + '?[0-9A-' + maxCipher + ']*$');
      }
      return numberTest.test(num);
    }
    
    var fractionLimit = -1;
    var crop = false;
    var delimiter = '.';
    function convert(num, inputRadix, outputRadix)
    {
      inputRadix = parseInt(inputRadix);
      outputRadix = parseInt(outputRadix);
      validateRadix(inputRadix, outputRadix);
      if (inputRadix === outputRadix) {
        throw new TypeError('Radixes are equal');
      }
      
      var result = 0;
      if (outputRadix === 10) {
        if (!isValidNumber(num, inputRadix)) {
          throw new TypeError('Wrong input format');
        }
        num = (num + '').toUpperCase();
        var pointIndex = num.indexOf(delimiter),
          power = pointIndex < 0 ? num.length - 1 : pointIndex - 1;
        if (num[0] === '-') {
          power--;
        }
        for (var i = 0; i < num.length; i++) {
          if (!isAnyRadixCypher(num[i])) {
            continue;
          }
          result += toDecimal(num[i])
            * Math.pow(inputRadix, power);
          power--;
        }
        result = '' + (num[0] === '-' ? -result : result);
        pointIndex = result.indexOf(delimiter);
        if (pointIndex < 0 && fractionLimit > 0) {
          pointIndex = result.length + 1;
          result += delimiter;
        } else {
          pointIndex++;
        }
        var fractionLength = result.length - pointIndex;
        if (pointIndex >= 0 && fractionLength < fractionLimit ) {
          result += '0'.repeat(fractionLimit - fractionLength);
        } else if (crop && fractionLimit - fractionLength < 0) {
          result = result.slice(0, fractionLimit - fractionLength);
        }
        return result;
      } else {
        if (inputRadix === 10) {
          num = +num;
        } else {
          num = +convert(num, inputRadix, 10);
        }
        if (isNaN(num)) {
          return 0;
        }
        var tokens = [];
        var fraction = Math.abs(num % 1), int = Math.abs(num) - fraction;
        while (int >= outputRadix) {
          var newInt = parseInt(int / outputRadix);
          tokens.push(toArbitrary(int - newInt * outputRadix));
          int = newInt
        }
        if (int !== 0) {
          tokens.push(toArbitrary(int));
        }
        tokens.reverse();
        if (tokens.length === 0) {
          tokens.push('0');
        }
        var intLength = tokens.length;
        if (fractionLimit > 0 || fraction > 0) {
          tokens.push(delimiter);
        }
        if (fraction > 0)
        {
          while (fraction !== 0 && (tokens[tokens.length - 1] == 0 ||
            fractionLimit < 0 || !crop ||
            tokens.length < fractionLimit + intLength)) {
            int = fraction * outputRadix;
            fraction = int % 1;
            tokens.push(toArbitrary(int - fraction));
          }
        }
        var repeatTimes = fractionLimit + intLength - tokens.length + 1;
        if (fractionLimit > 0 && repeatTimes > 0) {
          tokens.push('0'.repeat(repeatTimes));
        }
        result = (num < 0 ? '-' : '') +
          (tokens.length ? tokens.join('') : '0');
        return result;
      }
    }
    
    Object.defineProperties(convert, {
      fractionLimit: {
        get: function() {
          return fractionLimit;
        },
        set: function(number) {
          if (!isNaN(number = +number) && number >= 0) {
            fractionLimit = number;
          }
        }
      },
      delimiter: {
        get: function() {
          return delimiter;
        },
        set: function(str) {
          if (str.length === 1 && !isAnyRadixCypher(str)) {
            delimiter = str;
          }
        }
      },
      crop: {
        get: function() {
          return crop;
        },
        set: function(fill) {
          crop = !!fill;
        }
      },
      convert: getPropDescriptor(convert),
      toDecimal: getPropDescriptor(toDecimal),
      toArbitrary: getPropDescriptor(toArbitrary),
      isAnyRadixCypher: getPropDescriptor(isAnyRadixCypher),
      isValidNumber: getPropDescriptor(isValidNumber),
      isValidRadix: getPropDescriptor(isValidRadix)
    });
    Object.seal(convert);
    return convert;
  }
  function RadixCalculator(id, delimiter) {
    if (!window.$) {
      if (!window.jQuery) {
        throw new ReferenceError('jQuery is not found. Tested with 3.2.1. ' +
          'Get at https://code.jquery.com/jquery-3.2.1.min.js or ' +
          'https://jquery.com/download/');
      }
    }
    if (id[0] !== '#') {
      id = '#' + id;
    }
    try {
      var container = $(id);
    } catch (e) {
      console.error(e);
      throw new TypeError('Bad container id');
    }
    if (!delimiter) {
      delimiter = '.';
    } else if (isValidDelimiter(delimiter)) {
      throw new TypeError('Bad delimiter, see previous error');
    }
    var possibleDelimiters = ['.', ','];
    function isValidDelimiter(delimiter) {
      return possibleDelimiters.indexOf(delimiter) >= 0;
    }
    
    var tdStyle = {
      width: '1rem',
      height: '1rem',
      'line-height': '100%',
      padding: 0,
      border: '1px solid #aaa',
      'text-align': 'center',
      'position': 'relative'
    };
    var tableStyle = {
      color: '#000',
      'font-size': '1rem',
      'font-family': ['Arial', 'Helvetica', 'sans-serif'],
      'font-weight': '600',
      'border-collapse': 'collapse',
      'table-layout': 'fixed'
    };
    var delimiterStyle = {
      position: 'absolute',
      height: '100%',
      top: '0.1rem',
      right: '0.8rem',
      'font-weight': '900',
      'font-size': '1.2rem',
      'z-index': 999,
      'border-width': 0
    };
    var signStyle = {
      position: 'absolute',
      height: '100%',
      top: '0.5rem',
      left: '0.7rem',
      'font-weight': '900',
      'font-size': '1.2rem',
      'z-index': 999,
      'border-width': 0
    };
    var cells;
    function buildTable(rows, columns) {
      container.empty();
      var table = $('<table>').appendTo(container)
        .css(tableStyle);
      cells = [];
      for (var i = 0; i < rows; i++) {
        var row = $('<tr>').appendTo(table);
        cells[i] = [];
        for (var j = 0; j < columns; j++) {
          cells[i][j] = $('<td>').appendTo(row)
            .css(tdStyle);
        }
      }
      $('<p>Rows: ' + rows + '; Columns: ' + columns + "</p>").appendTo(container);
      return cells;
    }
    function putMessage(msg) {
      container.empty();
      $('<h3>' + msg + '</h3>').appendTo(container);
    }
    // startArray = [row, column], lengthArray = [rowLength, columnLength]
    function underscore(borderPieces, startArray, lengthArray) {
      for (var i = startArray[0]; i < startArray[0] + lengthArray[0]; i++) {
        for (var j = startArray[1]; j < startArray[1] + lengthArray[1]; j++) {
          if (borderPieces & underscore.enum.TOP) {
            if (i > 0) {
              cells[i - 1][j].css('border-bottom-color', '#000');
            } else {
              cells[i][j].css('border-top-color', '#000');
            }
          }
          if (borderPieces & underscore.enum.RIGHT) {
            cells[i][j].css('border-right-color', '#000');
          }
          if (borderPieces & underscore.enum.BOTTOM) {
            cells[i][j].css('border-bottom-color', '#000');
          }
          if (borderPieces & underscore.enum.LEFT) {
            if (j > 0) {
              cells[i][j - 1].css('border-right-color', '#000');
            } else {
              cells[i][j].css('border-left-color', '#000');
            }
          }
        }
      }
    }
    underscore.enum = {
      TOP: 2,
      RIGHT: 4,
      BOTTOM: 8,
      LEFT: 16
    };
    function fillRowsFromTop(args) {
      for (var i = 0; i < args.length; i++) {
        fillRowInv(args[i], i);
      }
    }
    function fillRow(arg, i, start) {
      if (typeof start === 'undefined') {
        start = 0;
      } else if (start < 0) {
        start = cells[0].length - start;
      }
      for (var j = 0, c = start; j < arg.length; j++, c++) {
        if (arg[j] !== delimiter) {
          cells[i][c].append(arg[j]);
        } else {
          cells[i][c--].append(
            $('<span>' + delimiter + '</span>').css(delimiterStyle)
          );
        }
      }
    }
    // we can not start from the first cell in the row
    function fillRowInv(arg, i, limit) {
      if (typeof limit === 'undefined') {
        limit = cells[0].length - 1;
      } else if (limit <= 0) {
        limit = cells[0].length + limit - 1;
      }
      for (var j = arg.length - 1, c = limit;
           j >= 0; j--, c--) {
        if (arg[j] !== delimiter) {
          cells[i][c].append(arg[j]);
        } else {
          cells[i][++c].append(
            $('<span>' + delimiter + '</span>').css(delimiterStyle)
          );
        }
      }
    }
    function putResultAndUnderscore(result, underscoreLength) {
      fillRowInv(result, cells.length - 1);
      underscore(underscore.enum.TOP,
        [cells.length - 1, 1],
        [1, underscoreLength ? underscoreLength : getCellsNumber(result) - 1]);
    }
    function putSign(sign, row, col) {
      if (!row || row < 0) {
        row = 0;
      }
      if (!col || col < 0) {
        col = 0;
      }
      cells[row][col].append($('<span>' + sign + '</span>')
        .css(signStyle));
    }
    function getCellsNumber(arg) {
      return arg.indexOf(delimiter) >= 0 ?
        arg.length : arg.length + 1;
    }
    
    var converter = new RadixConverter();
    
    function updateDelimiter(value) {
      if (isValidDelimiter(value)) {
        delimiter = value;
        converter.delimiter = delimiter;
      }
    }
    updateDelimiter(delimiter);
    var truncateZeros = true;
    function calculateAndDisplay(action, radix, args, isTwosComplement) {
      if (args.length < 2) {
        throw new TypeError('Not enough arguments for operation');
      }
      args = args.map(function(arg) {
        if (!converter.isValidNumber(arg, radix)) {
          throw new TypeError('Argument ' + arg + ' is invalid');
        }
        arg = arg.length ? (arg + '').toUpperCase().split('') : ['0'];
        if (arg[0] === delimiter) {
          arg.unshift('0');
        } else {
          arg = removeLeadingZeros(arg);
          if (!isTwosComplement && truncateZeros) {
            arg = removeEndingZeros(arg);
          }
        }
        return arg;
      });
      var result;
      switch (action) {
        case calculateEnum.ADD:
          var sum = !!isTwosComplement ? getTwoComplementSum(args, radix) :
            getSum(args, radix);
          var rows = args.length + 1;
          var columns = getCellsNumber(sum);
          buildTable(rows, columns);
          fillRowsFromTop(args);
          putSign('+', 0, columns - getCellsNumber(args[0]));
          putResultAndUnderscore(sum);
          result = sum;
          break;
        case calculateEnum.SUBTRACT:
          var difference = getDifference(args, radix);
          rows = args.length + 1;
          var argsMaxLength = args.reduce(function(prev, curr) {
            return Math.max(prev, getCellsNumber(curr));
          }, 0);
          columns = Math.max(argsMaxLength, getCellsNumber(difference));
          buildTable(rows, columns);
          fillRowsFromTop(args);
          putSign('-', 0, columns - argsMaxLength);
          putResultAndUnderscore(difference, columns - 1);
          result = difference;
          break;
        case calculateEnum.MULTIPLY:
          if (args.length >= 2) {
            args = args.slice(0, 2);
          }
          var product = getProduct(args, radix);
          var nonZeroLength = product.tempCalculations.reduce(
            function(prev, curr) {
              return +curr !== 0 ? prev + 1 : prev;
            }, 0);
          rows = 3 + (nonZeroLength === 1 ? 0 : nonZeroLength);
          columns = getCellsNumber(product.product);
          buildTable(rows, columns);
          fillRowsFromTop(args);
          var multipliersLength = Math.max(getCellsNumber(args[0]),
            getCellsNumber(args[1])) - 1;
          var c = columns - multipliersLength;
          putSign('x', 0, c - 1);
          underscore(underscore.enum.TOP, [args.length, c],
            [1, multipliersLength]);
          var i = 0;
          if (nonZeroLength !== 1) {
            for (var r = args.length; i < product.tempCalculations.length;
                 i++, r++) {
              if (+product.tempCalculations[i].join('') === 0) {
                r--;
                continue;
              }
              fillRowInv(product.tempCalculations[i], r, -i);
            }
          }
          putResultAndUnderscore(product.product);
          result = product.product;
          break;
        case calculateEnum.DIVIDE:
          var quotient = getQuotient(args, radix);
          var tempValues = quotient.tempCalculation;
          var dividendLength = getCellsNumber(args[0]);
          var dividerLength = getCellsNumber(args[1]);
          var quotientLength = getCellsNumber(quotient.quotient);
          var remainingLength = Math.max(dividerLength, quotientLength) - 1;
          columns = dividendLength + remainingLength;
          var nonZeroSteps = tempValues.reduce(function(prev, curr) {
            return +curr[1] === 0 ? prev : prev + 1;
          }, 0);
          rows = nonZeroSteps * 2 + 1 + (+tempValues[0][1] === 0 ? 2 : 0) +
            (+tempValues[tempValues.length - 1][1] === 0 &&
            (+tempValues[tempValues.length - 1][0] !== 0 ? 2 : 0));
          buildTable(rows, columns);
          underscore(underscore.enum.LEFT, [0, dividendLength], [2, 1]);
          underscore(underscore.enum.BOTTOM, [0, dividendLength],
            [1, remainingLength]);
          fillRow(args[0], 0, 1);
          fillRow(args[1], 0, dividendLength);
          fillRow(quotient.quotient, 1, dividendLength);
          var offset = tempValues[0][0].length;
          var delimiterIndex = quotient.quotient.indexOf(delimiter);
          for (i = 0, r = 1; i < tempValues.length; i++, r += 2) {
            fillRowInv(tempValues[i][1], r, offset);
            putSign('-', r - 1, offset - tempValues[i][0].length);
            if (i !== tempValues.length - 1) {
              var hasNextZero = false;
              var delta = +tempValues[i][2] === 0 ?
                  tempValues[i][0].length - (hasNextZero =
                    (+tempValues[i + 1][0] === 0) ? 1 : 0) :
                tempValues[i][2].length - tempValues[i][2].length + 1;
              var j = i;
              var hasLastZero = false;
              while (j < tempValues.length - 1 && +tempValues[j + 1][1] === 0) {
                if (j + 1 === tempValues.length - 1) {
                  hasLastZero = true;
                  break;
                }
                delta++;
                j++;
              }
              var offsetDelta = 0;
              if (delimiterIndex < 0 && i < delimiterIndex && j > delimiterIndex) {
                offsetDelta = j - delimiterIndex;
                delta -= offsetDelta;
              }
              if (hasLastZero) {
                j = tempValues.length - 1;
                if (+tempValues[j][0] !== 0) {
                  delta = tempValues[j][0].length - tempValues[i][2].length;
                  underscore(underscore.enum.BOTTOM,
                    [r, offset - tempValues[i][0].length + 1],
                    [1, tempValues[i][0].length + delta]);
                  fillRowInv(tempValues[j][0], r + 1, offset += delta);
                  i = j - 1;
                  continue;
                } else {
                  fillRowInv(tempValues[j - 1][2], r + 1, offset);
                  underscore(underscore.enum.BOTTOM, [r, offset - tempValues[i][0].length + 1],
                    [1, tempValues[i][0].length]);
                  break;
                }
              }
              underscore(underscore.enum.BOTTOM,
                [r, offset - tempValues[i][0].length + 1],
                [1, delta + tempValues[i][0].length]);
              i = j;
              fillRowInv(tempValues[i + 1][0], r + 1, offset += delta);
              offset += offsetDelta;
            } else {
              fillRowInv(tempValues[i][2], r + 1, offset);
              underscore(underscore.enum.BOTTOM, [r, offset - tempValues[i][0].length + 1],
                [1, tempValues[i][0].length])
            }
          }
          result = quotient.quotient;
          break;
      }
      return result.join('');
      function getSum(args, radix, isTrusted) {
        if (!isTrusted) {
          validateAndAlign(args);
        }
        args.sort(function(a, b) { return b.length - a.length; });
        var sum = args[0].map(toDecimal);
        for (var i = 1; i < args.length; i++) {
          var transitional = 0;
          for (var j = args[i].length - 1, r = sum.length - 1;
               j >= 0; j--, r--) {
            if (!converter.isAnyRadixCypher(args[i][j])) {
              continue;
            }
            var result = sum[r] +
              converter.toDecimal(args[i][j]) + transitional;
            sum[r] = result % radix;
            transitional = ~~((result - sum[r]) / radix);
          }
          if (transitional) {
            while (transitional && r >= 0) {
              result = sum[r] + transitional;
              sum[r] = result % radix;
              transitional = ~~((result - sum[r]) / radix);
              r--;
            }
            if (r < 0 && transitional) {
              sum.unshift(transitional);
            }
          }
        }
        return sum.map(toArbitrary);
      }
      function getTwoComplementSum(args, radix) {
        if (radix !== 2) {
          console.warn(new TypeError("Radix doesn't equal;" +
            " will be calculated an ordinary sum"));
          return getSum(args, radix);
        }
        var maxNumberLength = args.reduce(function(prev, curr) {
          if (curr[0] === '-') {
            throw new RangeError('All arguments must be non-negative');
          }
          if (curr[1] !== delimiter) {
            throw new TypeError('Argument ' + arg.join('') + " is not in two's complement");
          }
          return Math.max(prev, getFractionLength(curr));
        }, 0);
        args.forEach(function(arg, index, args) {
          var filling = +arg[0];
          if (filling) {
            arg.forEach(function (curr, i, arg) {
              if (i < 2) {
                return;
              }
              arg[i] = +!+curr;
            });
          }
          if (maxNumberLength - arg.length + 2) {
            var padding = [];
            for (var i = 0; i < maxNumberLength - arg.length + 2; i++) {
              padding[i] = filling;
            }
            args[index] = args[index].slice(0, 2).concat(padding,
              getSum([args[index].slice(2), [1]], radix, true));
          }
        });
        return getSum(args, radix, true);
      }
      function getDifference(args, radix, isTrusted) {
        if (!isTrusted) {
          validateAndAlign(args);
        }
        var difference = args[0].map(toDecimal);
        var negativeDifference = false;
        for (var i = 1; i < args.length; i++) {
          var temp = args[i].map(toDecimal);
          negativeDifference = !isFirstLargerOrEqual(difference, temp);
          if (negativeDifference) {
            var t = temp;
            temp = difference;
            difference = t;
          }
          for (var j = temp.length - 1, d = difference.length - 1;
               j >= 0; j--, d--) {
            if (!converter.isAnyRadixCypher(temp[j])) {
              continue;
            }
            difference[d] -= temp[j];
            var notCypher = false;
            if (difference[d] < 0 && d !== 0) {
              difference[d] += radix;
              for (var k = d - 1; k > 0 &&
              (difference[k] <= 0 ||
                (notCypher = !converter.isAnyRadixCypher(difference[k])));
                   k--) {
                if (!notCypher) {
                  difference[k] += radix - 1;
                }
              }
              difference[k]--;
            }
          }
          difference = removeLeadingZeros(difference);
          if (negativeDifference) {
            negativeDifference = true;
            temp = [difference.map(toArbitrary)].concat(args.slice(i + 1));
            difference = getSum(temp, radix, true);
            break;
          }
        }
        if (negativeDifference) {
          difference.unshift('-');
          return difference;
        }
        return difference.map(toArbitrary);
      }
      function validateAndAlign(args) {
        var maxFractionLength = args.reduce(function(prev, curr) {
          if (curr[0] === '-') {
            throw new RangeError('All arguments must be non-negative');
          }
          return Math.max(prev, getFractionLength(curr));
        }, 0);
        for (var i = 0; i < args.length; i++) {
          if (maxFractionLength > 0) {
            var index = args[i].indexOf(delimiter);
            if (index < 0) {
              args[i].push(delimiter);
            }
            var zerosNumber = maxFractionLength - getFractionLength(args[i]);
            for (var j = 0; j < zerosNumber; j++) {
              args[i].push('0');
            }
          }
        }
      }
      function removeLeadingZeros(arg, index) {
        if (typeof index === "undefined") {
          index = arg.indexOf(delimiter);
        }
        var lastZeroIndex = -1;
        for (var i = 0, maxLeadingZeros = (index < 0 ?
          arg.length : index) - 1;
             i < maxLeadingZeros && +arg[i] === 0;
             i++, lastZeroIndex++) {}
        if (lastZeroIndex >= 0) {
          arg = arg.slice(lastZeroIndex + 1);
        }
        return arg;
      }
      function removeEndingZeros(arg, index) {
        if (typeof index === "undefined") {
          index = arg.indexOf(delimiter);
        }
        if (index < 0) {
          return arg;
        }
        var firstZeroIndex = arg.length;
        for (var i = arg.length - 1, minEndingZeros = index;
             i > minEndingZeros && +arg[i] === 0;
             i--, firstZeroIndex--) {}
        if (firstZeroIndex < arg.length) {
          arg = arg.slice(0, firstZeroIndex === index + 1 ?
            i : firstZeroIndex);
        }
        return arg;
      }
      function getProduct(args, radix) {
        var tempCalculations = [],
          firstMultiplier = args[0].map(toDecimal);
        for (var i = args[1].length - 1; i >= 0; i--) {
          if (!converter.isAnyRadixCypher(args[1][i])) {
            continue;
          }
          var transitional = 0;
          var temp = [];
          for (var j = firstMultiplier.length - 1; j >= 0; j--) {
            if (!converter.isAnyRadixCypher(firstMultiplier[j])) {
              continue;
            }
            var result = firstMultiplier[j] *
              converter.toDecimal(args[1][i]) + transitional;
            var newCipher = result % radix;
            temp.push(converter.toArbitrary(newCipher));
            transitional = ~~((result - newCipher) / radix);
          }
          if (transitional !== 0) {
            temp.push(converter.toArbitrary(transitional));
          }
          temp.reverse();
          var tempString = temp.join('');
          if (radix === 10 && +tempString || radix !== 10 &&
            +converter(tempString, radix, 10) !== 0) {
            tempCalculations.push(temp);
          } else {
            tempCalculations.push(['0']);
          }
        }
        if (tempCalculations.length < 1) {
          var product = tempCalculations[0];
        } else {
          product = getSum(tempCalculations.map(function (arg, index) {
            var zeros = [];
            for (var i = 0; i < index; i++) {
              zeros.push('0');
            }
            return arg.concat(zeros);
          }), radix, true);
        }
        var fractionLength = getFractionLength(args[0]) + getFractionLength(args[1]);
        if (fractionLength !== 0) {
          if (fractionLength >= product.length) {
            var zeros = ['0', delimiter];
            for (i = product.length; i < fractionLength; i++) {
              zeros.push('0');
            }
            product = zeros.concat(product);
          } else {
            product.splice(-fractionLength, 0, delimiter);
          }
        }
        if (args[0][0] === '-' ^ args[1][0] === '-') {
          product.unshift('-');
        }
        return {
          tempCalculations: tempCalculations,
          product: product
        };
      }
      function getQuotient(args, radix) {
        var divider = +convertNumberFromTo(args[1].join(''), true);
        if (!divider) {
          throw new TypeError('Divider mustn\'t be equal to zero');
        }
        alignAndEvalForDivision(args);
        var tempCalculations = [];
        var quotient = [];
        var dividend = '', i = 0, remainder, isLess;
        while((isLess = !isFirstLargerOrEqual(dividend, args[1])) && i < args[0].length) {
          dividend += args[0][i++];
        }
        divider = +convertNumberFromTo(args[1].join(''), true);
        dividend = convertNumberFromTo(dividend, true);
        if (!isLess) {
          for (; i < args[0].length; i++) {
            makeDivisionStep(converter.toDecimal(args[0][i]));
          }
        }
        makeDivisionStep();
        if (fractionLimit && dividend !== 0) {
          quotient.push(delimiter);
          i = fractionLimit;
          while (dividend !== 0 && i > 0) {
            makeDivisionStep();
            i--;
          }
        }
        return {
          tempCalculation: tempCalculations,
          quotient: quotient
        };
        function makeDivisionStep(additive) {
          if (typeof additive === 'undefined') {
            additive = 0;
          }
          var result = ~~(dividend / divider);
          quotient.push(converter.toArbitrary(result));
          result *= divider;
          remainder = dividend - result;
          tempCalculations.push([convertNumberFromTo(dividend) + '',
            convertNumberFromTo(result) + '',
            convertNumberFromTo(remainder) + '']);
          dividend = remainder * radix + additive;
        }
      }
      function alignAndEvalForDivision(args) {
        var fractions = [];
        var max;
        for (var i = 0; i < 2; i++) {
          if (args[i][0] === '-') {
            throw new TypeError('Arguments must be non-negative');
          }
          fractions[i] = getFractionLength(args[i]);
          if (i === 0) {
            max = fractions[i];
          } else {
            max = Math.max(max, fractions[i]);
          }
        }
        var delta;
        if (max === 0) {
          return;
        }
        for (i = 0; i < 2; i++) {
          if (fractions[i]) {
            args[i].splice(-fractions[i] - 1, 1);
          }
          if ((delta = max - fractions[i]) > 0) {
            for (var j = 0; j < delta; j++) {
              args[i].push('0');
            }
          }
        }
      }
      function toArbitrary(cipher) {
        return converter.isAnyRadixCypher(cipher) ?
          converter.toArbitrary(cipher) : cipher;
      }
      function toDecimal(cipher) {
        return converter.isAnyRadixCypher(cipher) ?
          converter.toDecimal(cipher) : cipher;
      }
      function getFractionLength(arg) {
        var index = arg.indexOf(delimiter);
        return index >= 0 ? arg.length - 1 - index : 0;
      }
      function isFirstLargerOrEqual(first, second) {
        if (second.length > first.length) {
          return false;
        } else if (second.length < first.length) {
          return true;
        } else {
          for (var i = 0; i < first.length; i++) {
            if (first[i] > second[i]) {
              return true;
            } else if (first[i] < second[i]) {
              return false;
            }
          }
          return true;
        }
      }
      function convertNumberFromTo(arg, toDecimal) {
        if (toDecimal) {
          var from = radix, to = 10;
        } else {
          from = 10, to = radix;
        }
        return radix === 10 ? arg :
          converter(arg, from, to);
      }
    }
    function safeCalculate(action, radix, args, isTwoComplement) {
      try {
        return calculateAndDisplay(action, radix, args, isTwoComplement);
      } catch (ex) {
        putMessage(ex.message);
        console.warn(ex);
        return NaN;
      }
    }
    var fractionLimit = 10;
    var calculateEnum = {};
    Object.defineProperties(calculateEnum, {
      ADD: getPropDescriptor('+'),
      SUBTRACT: getPropDescriptor('-'),
      MULTIPLY: getPropDescriptor('*'),
      DIVIDE: getPropDescriptor('/')
    });
    Object.seal(calculateEnum);
    Object.defineProperties(safeCalculate, {
      fractionLimit: {
        get: function () {
          return fractionLimit;
        },
        set: function (value) {
          value = +value;
          if (!isNaN(value)) {
            if (value < 0) {
              fractionLimit = 0
            } else {
              fractionLimit = ~~value;
            }
          }
        }
      },
      delimiter: {
        get: function() {
          return delimiter;
        },
        set: updateDelimiter
      },
      possibleDelimiters: {
        get: function() {
          return possibleDelimiters.slice();
        }
      },
      clearOutput: getPropDescriptor(function() {
        container.empty();
      }, true),
      getConverterInstance: getPropDescriptor(function() {
        return new RadixConverter();
      }, true),
      calculate: getPropDescriptor(safeCalculate, true),
      actionEnum: getPropDescriptor(calculateEnum),
      truncateZeros: {
        get: function() {
          return truncateZeros;
        },
        set: function(value) {
          truncateZeros = !!value;
        }
      }
    });
    Object.seal(safeCalculate);
    return safeCalculate;
  }
  Object.defineProperties(window, {
    RadixConverter: getPropDescriptor(RadixConverter),
    RadixCalculator: getPropDescriptor(RadixCalculator)
  });
})();