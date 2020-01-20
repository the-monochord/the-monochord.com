import angular from 'angular'

// https://stackoverflow.com/a/34579185/1806628
angular.module('MobileClick', []).directive('mobileClick', [
  '$parse',
  $parse => ({
    restrict: 'A',
    link: (scope, elem, attrs) => {
      const action = $parse(attrs.mobileClick)

      elem.on('touchstart click', e => {
        e.stopPropagation()

        action(scope)
        scope.$apply()
      })
    }
  })
])
