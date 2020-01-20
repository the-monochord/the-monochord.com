const e = {
  enableAudio: '#enable-audio',
  tutorialExit: '#tutorial-exit',
  tutorialNext: '#tutorial-next',
  tutorialCounter: '#tutorial-counter',
  tutorialSeparator: '.tutorial-separator',
  scaleDesigner: '#scaleDesignerButton',
  addSet: '#add-set',
  masterVolume: '#master-volume',
  waveform: '#waveform',
  baseFrequency: '#base-frequency',
  retuneMethod: '#retune-method',
  settings: '#settings',
  firstSetLeft: '#sets tr:first-child td .railed',
  firstSetRight: '#sets tr:first-child td .fright',
  firstSetAdd: '#sets tr:first-child td .railed .icon-add',
  sets: '#sets',
  addSetType: '#add-set-type',
  duplicateSet: '#duplicate-set',
  pianoButton: '#pianoButton'
}

const steps = [
  {
    title: 'Welcome to the tutorial!',
    text:
      'You can exit this tutorial at any time by pressing the "exit tutorial" link on the bottom right hand corner.---Click "next step" in the bottom right hand corner to continue.',
    show: [e.tutorialSeparator, e.tutorialCounter, e.tutorialExit, e.tutorialNext],
    bind: [
      [e.tutorialExit, 'click', 'exit'],
      [e.tutorialNext, 'click', 'next']
    ]
  },
  {
    title: 'What is this app?',
    text:
      'Using The Mononchord you can stack harmonic ratios and cents, which will eventually add up to a complete scale, that we will use to tune our instruments. You can alter, shape and play your notes at any time, which is great for experimenting/learning microtonality, but also a great way to train your ears.---Click "next step" to continue.'
  },
  {
    title: `Let's begin!`,
    text:
      'We start off by going to the scale designer page, where we will learn the fundamentals of The Monochord.||On the top left hand part you see buttons to change the panels with.---Click on the tuning fork icon to bring forth the "scale designer" panel.',
    show: [e.scaleDesigner],
    hide: [e.tutorialNext],
    bind: [[e.scaleDesigner, 'click', 'next']]
  },
  {
    title: 'Adding a harmony',
    text:
      'At first we will take a look at simple harmonic ratios.---Click the "+" on the bottom left part of the screen to add a group of harmonics (set) with a single harmony.',
    show: [e.addSet],
    unbind: [[e.scaleDesigner, 'click', 'next']],
    bind: [[e.addSet, 'click', 'next']]
  },
  {
    title: "Let's hear it!",
    text:
      'By default the audio is disabled due to browser policies, so to get sound, you need to turn the audio on. Also, there is a slider called "master volume" for controlling volume. Try adjusting that to get the loudness you find comfortable.||If the settings are not visible, then it can be displayed by clicking the cogwheel icon on the top left hand corner.||NOTE: State changing buttons and links stay orange, while they are active.---When you are comfortable with the volume, click "next step".',
    hide: [e.addSet],
    show: [e.enableAudio, e.masterVolume, e.tutorialNext, e.settings],
    unbind: [[e.addSet, 'click', 'next']]
  },
  {
    title: 'Sine waves are boring.',
    text:
      'Though The Monochord is not aiming to become the best sounding synthesizer, it offers a fair bit of presets to choose from.||NOTE: after clicking the dropdown menu for the waveform, you can browse through all the sounds with the [UP] and [DOWN] keys on your keyboard.||{WARNING: square and sawtooth waves are significantly louder compared to other waveforms!}---Experiment with the various "waveforms" and when you are happy with the sound, click "next step".',
    show: [e.waveform]
  },
  {
    title: 'The base frequency',
    text:
      'The "base frequency" is the foundation of all the sounds in your tuning, every pitch is derivated from it. You can either change the base frequency by typing it in the input field (click on the number to get a cursor) or by using the plus and minus signs.||The default frequency is 262, which is the frequency of C, when A is tuned to the standard 440Hz||NOTE: most controls in The Monochord will repeat their functions, when held down.---Try changing the "base frequency", then click "next step" to move on.',
    show: [e.baseFrequency]
  },
  {
    title: 'The set',
    text:
      'A few steps ago we\'ve created a set of harmonics with a single 1st harmony in it. Harmonics by default are just multipliers of the base frequency.||Sets of harmonics are displayed as rows in the main screen. A row consists of two parts:---(click "next step")'
  },
  {
    title: 'The left part of a set',
    text:
      'This is where you get all the information about your set displayed in a nice and compact format. Looking from left to right, the green dot indicates, if the row has sound or it is muted.||Next is a small symbol indicating what the set is made up of: JI for harmonics and ¢ (cent symbol) for cents.||After that comes the individual elements (harmonies or cents) of the set with their own muted indicator on their top.||Finally a plus sign to add elements to the set.---Add an element by clicking on the plus sign in the set to continue.',
    hide: [e.tutorialNext],
    show: [e.firstSetLeft],
    bind: [[e.firstSetAdd, 'click', 'next']]
  },
  {
    title: 'The right part of a set',
    text:
      'This allows you to change the values of a set for a single element or for the set as a whole.||By clicking on the single arrows you can raise or lower all element values by 1.||Clicking on the double arrows will double or halve all the values.||The icon with the vertical bars "normalise" the harmonic ratio, converting the values to it\'s simplest form, e.g. 60:20 will become 3:1.||There is a speaker icon allowing you to change the muted state of a complete set.||Finally there is an icon to delete the set.||NOTE: when you mute a set, it will not make any sound, even when it has elements, which do make sound.---Click "next step" to continue.',
    hide: [e.firstSetLeft],
    show: [e.firstSetRight, e.tutorialNext],
    unbind: [[e.firstSetAdd, 'click', 'next']]
  },
  {
    title: 'Editing an element',
    text:
      'By clicking on an individual element in the left part of the set, the right part changes from set controls to element controls. Here you can edit the individual value similarly to how you edited the base frequency and you can also mute or unmute the element with the speaker icon.||To bring back the controls for the whole set, click on the selected element in the left part again (highlighted in orange).---Click "next step".',
    hide: [e.firstSetLeft, e.firstSetRight],
    show: [e.sets, e.addSet]
  },
  {
    title: 'Assembling harmonics',
    text:
      'Experiment with controlling the whole set. Try deleting or adding a new sets with the "+" sign.||Try creating a set, which contain a "2" and a "3" as harmonics. The ratio of those two harmonics will give you a pleasing perfect fifth and can be written as a ratio of "3:2".||Try creating a set with "4:3" (perfect fourth), "5:4" (major third), "3:4:5" (major chord) and if the tone is too high, then set the base frequency to a lower value.---When you are done, click the "next step"'
  },
  {
    title: 'Advanced topics: Dynamic retuning',
    text:
      'As mentioned earlier, harmonics are just multipliers of the base frequency. This is the default behavior and can be changed with "retune methods". Among the settings you can find this as a form of a drop-down menu.||By default, it is set to "none", indicating that there is no retuning in progress. For example, having a set with harmonics forming a ratio of 3:2 and base frequency of 100 Hz will produce two sounds: 300Hz and 200Hz.||By changing the retune method to "lowest to base frequency", the app will find the element in every set with the lowest value and it will assign the base frequency to that. The base frequency will get recalculated from the element\'s value and will be applied to the rest of the set, transforming a set of 3:2 to sound with 150Hz and 100Hz.||"highest to base frequency" is similar to the previous, but instead of the lowest, it will search for the highest element, resulting 3:2 to sound as 100Hz and 66.6Hz.---Try out these settings by changing your sets, then click "next step" to continue. (don\'t worry about the ones I didn\'t mention, we\'ll get back to those in a moment)',
    show: [e.retuneMethod]
  },
  {
    title: 'Working with cents',
    text:
      'So far we\'ve been only working with harmonics. These have the most pure sounding, but they are not evenly spread out and often hard to imagine how they sound just by looking at them.||There is a musical unit for describing ratios in a more mathematical way, which is called "cent". An octave is divided into 1200 equal cents and you can define keys on a piano by stacking multiples of 100 cents. Every semitone is +100 cents compared to the previous one.||The Monochord can work with cents, but you need a specific set for that, which you can enable by changing the set type with the dropdown menu next to the "+" sign in the bottom left hand corner.||NOTE: A set can only contain a single type of element, but you can have multiple type of sets in your tuning.||Try adding a set of cents with 0 and 400 cents as elements. You might want to type that value in, instead of using the +/- buttons.---Click the "next step", when you are done.',
    show: [e.addSetType]
  },
  {
    title: 'Stacking cents to form a chromatic scale',
    text:
      'Now delete your sets and have only a "cents" set with 0 and 100 as it\'s elements. Make sure to mute the lower element. Set the retune method to "lowest to previous\' highest".||This setting will act as "lowest to base frequency" for the first set, but the other sets will not retune to the base frequency, but to the calculated highest frequency in the prior set. This comes in really handy, when creating chromatic sets with equal steps.||The direction can be reversed by setting the retune method to "highest to previous\' lowest".||A shortcut for making chromatic sets is to select the set by clicking on the row on an empty part, then duplicating them with the "copy icon" in the bottom left hand corner. To unmark a set, simply click on it again or click on a different set.||Try duplicating the first set to have a total of 12 sets. This is now a complete scale, which you would get on any modern piano.||Try forming chords by muting certain elements of your tuning. You can quickly mute and unmute sets by clicking the green dot at their beginning.---Click "next step" to continue.',
    show: [e.duplicateSet]
  } /* {
  title: 'Onscreen piano',
  text: '',
  show: [e.pianoButton]
},
*/,

  // TODO: scala import
  {
    title: "You've completed the tutorial!",
    text:
      'There are many more features in The Monochord, which I could not cover in this tutorial, plus I would like to let you go explore the app.||If you get stuck or have any questions, then feel free to get in touch with me in email, my address can be found in the information panel, which can be accessed from the "i" icon in the top menu.---Click the exit tutorial button and have fun using The Monochord!',
    hide: [e.tutorialNext]
  }
]

const TutorialUI = function($scope) {
  $scope.ui.tutorial = {
    active: false,
    step: null,
    title: '',
    text: ''
  }

  function hasNext() {
    return $scope.ui.tutorial.step < steps.length - 1
  }

  const methods = {
    next: function() {
      if (hasNext()) {
        $scope.ui.tutorial.step++
        $scope.$apply()
      }
    },
    exit: function() {
      $scope.ui.tutorial.active = false
      $scope.ui.tutorial.step = null
      Array.from(document.querySelectorAll('.tutorial')).forEach(function(elem) {
        elem.classList.remove('tutorial')
      })
      // restore $scope
      $scope.$apply()
    }
  }

  this.start = function() {
    // save $scope
    // clear $scope
    $scope.sets = []
    $scope.baseVolume = 30
    $scope.baseFrequency = 262
    $scope.ui.tutorial.active = true
    $scope.ui.tutorial.step = 0
    $scope.ui.tutorial.totalSteps = steps.length
  }

  $scope.$watch('ui.tutorial.step', function(value) {
    if (!steps[value]) {
      return false
    }

    const step = steps[value]
    ;(Array.isArray(step.hide) ? step.hide : [])
      .reduce(function(prev, current) {
        return prev.concat(Array.from(document.querySelectorAll(current)))
      }, [])
      .forEach(function(element) {
        element.classList.remove('tutorial')
      })
    ;(Array.isArray(step.show) ? step.show : [])
      .reduce(function(prev, current) {
        return prev.concat(Array.from(document.querySelectorAll(current)))
      }, [])
      .forEach(function(element) {
        element.classList.add('tutorial')
      })
    ;(Array.isArray(step.bind) ? step.bind : []).forEach(function(current) {
      const selector = current[0]
      const event = current[1]
      const handler = methods[current[2]]

      Array.from(document.querySelectorAll(selector)).forEach(function(element) {
        element.addEventListener(event, handler)
      })
    })
    ;(Array.isArray(step.unbind) ? step.unbind : []).forEach(function(current) {
      const selector = current[0]
      const event = current[1]
      const handler = methods[current[2]]

      Array.from(document.querySelectorAll(selector)).forEach(function(element) {
        element.removeEventListener(event, handler)
      })
    })

    $scope.ui.tutorial.title = step.title
    $scope.ui.tutorial.text = step.text
      .replace(/\|/g, '<br />')
      .replace(/\{/g, '<span class="warning">')
      .replace(/\}/g, '</span>')
      .replace(/---/g, '<hr />')
  })
}

export default TutorialUI
