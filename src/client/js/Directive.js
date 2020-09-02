import angular from 'angular'
import './directive/autosize'
import './directive/change-on-keypress'
import './directive/holdclick'
import './directive/pointer'
import './directive/ui.codemirror'
import './directive/mobile-click'

angular.module('Directive', [
  'HoldClickDirective',
  'AutosizeDirective',
  'ChangeOnKeypress',
  'PointerDirective',
  'MobileClick'
])
