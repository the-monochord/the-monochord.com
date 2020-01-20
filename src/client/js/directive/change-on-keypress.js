import angular from 'angular'

// based on http://stackoverflow.com/a/22633038/1806628
angular.module('ChangeOnKeypress', []).directive('changeOnKeypress', () => ({
  restrict: 'A',
  require: '?ngModel',
  scope: false,
  link: (scope, element, attrs, ngModel) => {
    if (ngModel) {
      element.bind('keyup', () => {
        element.triggerHandler('change')
      })
    }
  }
}))
