import angular from 'angular'

angular.module('AutosizeDirective', []).directive('autosize', [
  function() {
    function resizeInput() {
      this.style.width = `${this.value.length * 14}px`
    }

    return {
      restrict: 'A',
      link: (scope, elem, attrs) => {
        if (elem[0].matches('input[autosize][ng-model]')) {
          scope.$watch(attrs.ngModel, () => {
            resizeInput.apply(elem[0])
          })
          elem.on('keyup keydown', resizeInput)
        }
      }
    }
  }
])
