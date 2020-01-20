/* global window */
import angular from 'angular'

angular
  .module('PointerDirective', [])
  .directive('pointerPress', [
    '$parse',
    $parse => ({
      restrict: 'A',
      link: (scope, elem, attrs) => {
        const action = $parse(attrs.pointerPress)

        if (window.TouchEvent && 'ontouchstart' in elem[0]) {
          elem.on('touchstart', () => {
            action(scope)
            scope.$apply()
          })
        } else {
          elem.on('mousedown', () => {
            action(scope)
            scope.$apply()
          })
        }
      }
    })
  ])
  .directive('pointerRelease', [
    '$parse',
    $parse => ({
      restrict: 'A',
      link: (scope, elem, attrs) => {
        const action = $parse(attrs.pointerRelease)

        if (window.TouchEvent && 'ontouchstart' in elem[0]) {
          elem.on('touchend', () => {
            action(scope)
            scope.$apply()
          })
        } else {
          elem.on('mouseup', () => {
            action(scope)
            scope.$apply()
          })
        }
      }
    })
  ])
  .directive('pointerOver', [
    '$parse',
    $parse => ({
      restrict: 'A',
      link: (scope, elem, attrs) => {
        const action = $parse(attrs.pointerOver)

        if (window.TouchEvent && 'ontouchstart' in elem[0]) {
          // TODO: touchmove
        } else {
          elem.on('mouseover', () => {
            action(scope)
            scope.$apply()
          })
        }
      }
    })
  ])
  .directive('pointerLeave', [
    '$parse',
    $parse => ({
      restrict: 'A',
      link: (scope, elem, attrs) => {
        const action = $parse(attrs.pointerLeave)

        if (window.TouchEvent && 'ontouchstart' in elem[0]) {
          // TODO: touchmove
        } else {
          elem.on('mouseleave', () => {
            action(scope)
            scope.$apply()
          })
        }
      }
    })
  ])
