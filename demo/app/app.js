angular.module('radix-calculator', [])
  .controller('converter', function($scope) {
    $scope.radixInfo = {
      10: 'Decimal',
      2: 'Binary',
      8: 'Octal',
      16: 'Hexadecimal'
    };
    var watchers = {};
    var values = {
      2: 0,
      8: 0,
      10: 0,
      16: 0
    };
    $scope.values = values;
  
    var convert = new RadixConverter;
    Object.defineProperties(watchers, {
      register: {
        value: function (inputRadix) {
          for (var radix in this) {
            if (this.hasOwnProperty(radix) && typeof this[radix] === 'function') {
              this[radix](); // unregister all watchers
            }
          }
          var watcher = function(newValue, oldValue, scope) {
            for (var radix in values) {
              if (values.hasOwnProperty(radix) && inputRadix != radix) {
                values[radix] = convert(newValue, inputRadix, radix);
              }
            }
          }.bind(this);
          this[inputRadix] = $scope.$watch('values[' + inputRadix + ']', watcher);
        }.bind(watchers)
      }
    });
    $scope.switchRadix = watchers.register;
  }).controller('calculator', function($scope) {
    var calculator = new RadixCalculator('output');
    function Args(count) {
      for (var i = 0; i < count; i++) {
        this[i] = 0;
      }
    }
    Args.prototype = Object.create(Object.prototype, {
      toArray: {
        value: function () {
          var arr = [];
          for (var prop in this) {
            if (this.hasOwnProperty(prop)) {
              arr[+prop] = this[prop];
            }
          }
          return arr;
        }
      },
      count: {
        get: function() {
          var count = 0;
          for (var prop in this) {
            if (this.hasOwnProperty(prop)) {
              count++;
            }
          }
          return count;
        }
      }
    });
    var args = new Args(2);
    $scope.radix = 10;
    $scope.actions = calculator.actionEnum;
    $scope.possibleDelimiters = calculator.possibleDelimiters;
    $scope.delimiter = calculator.delimiter;
    $scope.$watch('delimiter', function(newVal, oldVal, scope) {
      calculator.delimiter = newVal;
    });
    $scope.fractionLimit = calculator.fractionLimit;
    $scope.$watch('fractionLimit', function(newVal, oldVal, scope) {
      calculator.fractionLimit = newVal;
    });
    $scope.truncateZeros = calculator.truncateZeros;
    $scope.twosComplement = false;
    $scope.$watch('truncateZeros', function(newVal, oldVal, scope) {
      calculator.truncateZeros= newVal;
    });
    $scope.action = $scope.actions.ADD;
    $scope.args = args;
    $scope.calculate = function() {
      $scope.result = calculator($scope.action, $scope.radix,
        $scope.args.toArray(), $scope.twosComplement);
    };
    $scope.addArg = function() {
      args[args.count] = 0;
    };
    $scope.removeArg = function() {
      var count = args.count;
      if (count > 2) {
        delete args[count - 1];
      }
    };
  });