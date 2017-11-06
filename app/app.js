'use strict';
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
      var pointIndex = num.indexOf('.'),
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
        result += '.';
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
        tokens.push('.');
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
  
  convert.convert = convert;
  convert.toArbitrary = toArbitrary;
  convert.toDecimal = toDecimal;
  convert.isAnyRadixNumber = isAnyRadixCypher;
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
    isValidNumber: isValidNumber,
    isValidRadix: isValidRadix
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
  } else if (['.', ','].indexOf(delimiter) < 0) {
    throw new TypeError('Bad delimiter, see previous error');
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
    left: '0.8rem',
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
  function buildTable(rows, columns) {
    container.empty();
    var table = $('<table>').appendTo(container)
      .css(tableStyle);
    var cells = [];
    for (var i = 0; i < rows; i++) {
      var row = $('<tr>').appendTo(table);
      cells[i] = [];
      for (var j = 0; j < columns; j++) {
        cells[i][j] = $('<td>1</td>').appendTo(row)
          .css(tdStyle);
      }
    }
    return cells;
  }
  buildTable(5,5);
  // startArray = [row, column], lengthArray = [rowLength, columnLength]
  function underScore(borderPieces, startArray, lengthArray) {
    for (var i = startArray[0]; i < startArray[0] + lengthArray[0]; i++) {
      for (var j = startArray[1]; j < startArray[1] + lengthArray[1]; j++) {
        if (borderPieces & underScore.enum.TOP) {
          if (i > 0) {
            cells[i - 1][j].css('border-bottom-color', '#000');
          } else {
            cells[i][j].css('border-top-color', '#000');
          }
        }
        if (borderPieces & underScore.enum.RIGHT) {
          cells[i][j].css('border-right-color', '#000');
        }
        if (borderPieces & underScore.enum.BOTTOM) {
          cells[i][j].css('border-bottom-color', '#000');
        }
        if (borderPieces & underScore.enum.LEFT) {
          if (j > 0) {
            cells[i][j - 1].css('border-right-color', '#000');
          } else {
            cells[i][j].css('border-left-color', '#000');
          }
        }
      }
    }
  }
  underScore.enum = {
    TOP: 2,
    RIGHT: 4,
    BOTTOM: 8,
    LEFT: 16
  };
  
  var converter = new RadixConverter();
  converter.delimiter = delimiter;
  function calculate(action, radix, args) {
    if (args.length < 2) {
      throw new TypeError('Not enough arguments for operation');
    }
    for (var i = 0; i < args.length; i++) {
      if (!converter.isValidNumber(args[i], radix)) {
        throw new TypeError('Argument ' + args[i] + ' is invalid');
      }
      args[i] = args[i].split('');
    }
    switch (action) {
      case calculateEnum.ADD:
        var sum = getSum(args, radix);
        var rows = args.length + 1;
        var columns = args[0].indexOf(delimiter) >= 0 ?
          args[0].length : args[0].length + 1;
        var cells = buildTable(rows, columns);
        for (i = 0; i < args.length; i++) {
          for (var j = args[i].length - 1, c = cells[0].length;
               j >= 0; j--, c--) {
            if (args[i][j] !== delimiter) {
              cells[c].append(args[i][j]);
            } else {
              cells[c++].append(
                  $('<span>' + delimiter + '</span>').css(delimiterStyle)
                );
            }
          }
        }
        i--;
        for (j = sum.length - 1, c = cells[0].length;
             j >= 0; j--, c--) {
          if (sum[j] !== delimiter) {
            cells[i][c].append(sum[j]);
          } else {
            cells[i][c++].append(
              $('<span>' + delimiter + '</span>').css(delimiterStyle)
            );
          }
        }
        cells[0][1].append($('<span>+</span>').css(signStyle));
        underScore(underScore.enum.TOP, [rows - 1, 1], [1, columns - 1]);
        break;
      case calculateEnum.SUBTRACT:
        var difference = getDifference(args, radix);
        rows = args.length + 1;
        var index = difference.indexOf(delimiter);
        columns = args.reduce(function(prev, curr) {
            curr = index >= 0 ? curr.length : curr.length + 1;
            return Math.max(prev, curr);
          });
        cells = buildTable(rows, columns);
        for (i = 0; i < args.length; i++) {
          for (j = args[i].length - 1, c = cells[0].length;
               j >= 0; j--, c--) {
            if (args[i][j] !== delimiter) {
              cells[i][c].append(args[i][j]);
            } else {
              cells[i][c++].append(
                $('<span>' + delimiter + '</span>').css(delimiterStyle)
              );
            }
          }
        }
        i--;
        for (j = difference.length - 1, c = cells[0].length;
             j >= 0; j--, c--) {
          if (difference[j] !== delimiter) {
            cells[i][c].append(difference[j]);
          } else {
            cells[i][c++].append(
              $('<span>' + delimiter + '</span>').css(delimiterStyle)
            );
          }
        }
        cells[0][1].append($('<span>-</span>').css(signStyle));
        underScore(underScore.enum.TOP, [rows - 1, 1], [1, columns - 1]);
        break;
        break;
      // '✕'
    }
    function getSum(args, radix, isTrusted) {
      if (!isTrusted) {
        validateAndAlign(args);
      }
      args.sort(function(a, b) { return b.length - a.length; });
      var sum = args[0].map(toDecimal);
      for (var i = 1; i < args.length; i++) {
        var transitional = 0;
        for (var j = args[i].length - 1, r = sum.length;
             j >= 0; j--, r--) {
          if (!converter.isAnyRadixNumber(args[i][j])) {
            continue;
          }
          var result = sum[r] +
            converter.toDecimal(args[i][j]) + transitional;
          var newCipher = result % radix;
          sum[r] = converter.toArbitrary(newCipher);
          transitional = result - newCipher;
        }
        if (transitional) {
          sum.unshift(converter.toArbitrary(transitional));
        }
      }
      return sum.map(toArbitrary);
    }
    function getDifference(args, radix) {
      validateAndAlign(args);
      function toDecimalDecoder(cipher) {
        return converter.isAnyRadixNumber(cipher) ?
          converter.toDecimal(cipher) : cipher;
      }
      function isFirstLarger(first, second) {
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
        }
      }
      var difference = args[0].map(toDecimalDecoder);
      var negativeDifference = false;
      for (var i = 1; i < args.length; i++) {
        var temp = args[i].map(toDecimalDecoder);
        negativeDifference = !isFirstLarger(difference, temp);
        if (negativeDifference) {
          var t = temp;
          temp = difference;
          difference = t;
        }
        for (var j = temp.length - 1, d = difference.length;
             j >= 0 && d >= 0; j--, d--) {
          if (!converter.isAnyRadixNumber(temp[j])) {
            continue;
          }
          var result = difference[d] - temp[j];
          if (result < 0 && d !== 0) {
            for (var k = d; k > 0 && difference[k] <= 0; k--) {
              difference[k] += radix;
            }
            difference[k]--;
          }
        }
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
        var index = curr.indexOf(delimiter);
        curr = index >= 0 ? curr.length - 1 - index : 0;
        return Math.max(prev, curr);
      }, 0);
      if (maxFractionLength > 0) {
        for (var i = 0; i < args.length; i++) {
          var index = args[i].indexOf(delimiter);
          var zerosNumber = maxFractionLength - (index >= 0 ?
            args[i].length - 1 - index : 0);
          if (index < 0) {
            args[i].push(delimiter);
          } else if (index === 0) {
            args[i].unshift('0');
          }
          for (var j = 0; j < zerosNumber; j++) {
            args[i].push('0');
          }
        }
      }
    }
    function toArbitrary(cipher) {
      return converter.isAnyRadixNumber(cipher) ?
        converter.toArbitrary(cipher) : cipher;
    }
    function toDecimal(cipher) {
      return converter.isAnyRadixNumber(cipher) ?
        converter.toDecimal(cipher) : cipher;
    }
  }
  var calculateEnum = {
    ADD: '+',
    SUBTRACT: '-',
    MULTIPLY: '*',
    DIVIDE: '/'
  };
  Object.seal(calculateEnum);
}
RadixCalculator('output');

angular.module('radix-converter', [])
  .controller('mainController', function($scope) {
    $scope.dec = 0;
    $scope.hex = 0;
    $scope.oct = 0;
    $scope.bin = 0;
    // $scope.$watch('dec', function(newValue, oldValue, scope) {
    //   $scope.hex = convert(newValue, 10, 16);
    //   $scope.oct = convert(newValue, 10, 8);
    //   $scope.bin = convert(newValue, 10, 2);
    // });
    $scope.$watch('hex', function(newValue, oldValue, scope) {
      $scope.dec = convert(newValue, 16, 10);
      $scope.oct = convert(newValue, 16, 8);
      $scope.bin = convert(newValue, 16, 2);
    });
    // $scope.$watch('oct', function(newValue, oldValue, scope) {
    //   $scope.hex = convert(newValue, 8, 16);
    //   $scope.dec = convert(newValue, 8, 10);
    //   $scope.bin = convert(newValue, 8, 2);
    // });
    // $scope.$watch('bin', function(newValue, oldValue, scope) {
    //   $scope.hex = convert(newValue, 2, 16);
    //   $scope.oct = convert(newValue, 2, 8);
    //   $scope.dec = convert(newValue, 2, 10);
    // });

    var convert = new RadixConverter;
  });