angular.module('radix-converter', ["ui.bootstrap"])
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
          throw new TypeError('Number must be between 2 and 36');
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
  
      var fractionLimit = -1;
      var crop = false;
      var delimiter = '.';
      function convert(num, inputRadix, outputRadix)
      {
        inputRadix = parseInt(inputRadix);
        outputRadix = parseInt(outputRadix);
        if (isNaN(outputRadix) || isNaN(inputRadix) || inputRadix < 2
          || inputRadix > 36 || outputRadix < 2 || outputRadix > 36) {
          throw new TypeError('Radix must been between 2 and 36');
        } else if (inputRadix === outputRadix) {
          throw new TypeError('Radixes are equal');
        }
    
        var result = 0;
        if (outputRadix === 10) {
          num = (num + '').toUpperCase();
          var maxCipher = toArbitrary(inputRadix - 1);
          if (maxCipher < 10) {
            var numberTest = new RegExp('^-?[0-' + maxCipher + ']*\\' +
              delimiter + '?[0-' + maxCipher + ']*$');
          } else {
            var numberTest = new RegExp('^-?[0-9A-' + maxCipher + ']*\\' +
              delimiter + '?[0-9A-' + maxCipher + ']*$');
          }
          if (!numberTest.test(num)) {
            throw new TypeError('Wrong input format');
          }
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
          }
        });
      Object.seal(convert);
      return convert;
    }
    var convert = new RadixConverter;
  });