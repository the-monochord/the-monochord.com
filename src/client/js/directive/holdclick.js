/* global window */
import angular from 'angular'

angular.module('HoldClickDirective', []).directive('holdClick', [
  '$parse',
  $parse => ({
    restrict: 'A',
    link: (scope, elem, attrs) => {
      let firstPeriod = null
      let secondPeriod = null
      let over
      let speed
      let action

      const matches = attrs.holdClick.match(/^(.*)\|(\d+)$/)
      if (matches === null) {
        action = $parse(attrs.holdClick)
        speed = 1
      } else {
        action = $parse(matches[1])
        speed = parseInt(matches[2])
      }

      const startHandler = () => {
        action(scope)
        scope.$apply()
        firstPeriod = setTimeout(() => {
          if (over) {
            action(scope)
            secondPeriod = setInterval(() => {
              if (over) {
                action(scope)
              }
              scope.$apply()
            }, 50 * speed)
          }
          scope.$apply()
        }, 700)
      }

      const stopHandler = () => {
        if (firstPeriod !== null) {
          clearTimeout(firstPeriod)
          firstPeriod = null
        }
        if (secondPeriod !== null) {
          clearInterval(secondPeriod)
          secondPeriod = null
        }
        scope.$apply()
      }

      if (window.TouchEvent && 'ontouchstart' in elem[0]) {
        over = true
        elem.on('touchstart', startHandler)
        window.addEventListener('touchend', stopHandler)
      } else {
        over = false
        elem
          .on('mousedown', e => {
            over = true
            // Safari/Mac uses e.button
            if ((e.buttons !== undefined && e.buttons === 1) || e.button === 0) {
              startHandler()
            }
          })
          .on('mouseover', () => {
            over = true
          })
          .on('mouseout', () => {
            over = false
          })

        window.addEventListener('mouseup', e => {
          // Safari/Mac uses e.button
          if ((e.buttons !== undefined && e.buttons !== 1) || e.button === 0) {
            stopHandler()
          }
        })
      }
    }
  })
])
