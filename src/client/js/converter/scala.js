import { map, both, propEq, compose, prop, complement, either } from 'ramda'

const POINTER_START = 0x01
const POINTER_FIRST_COMMENT_BLOCK = 0x02
const POINTER_DESCRIPTION = 0x04
const POINTER_NOTE_COUNT = 0x08
const POINTER_NOTES = 0x10
const POINTER_END = 0x20

const pointerName = {}
pointerName[POINTER_START] = 'beginning of the file'
pointerName[POINTER_FIRST_COMMENT_BLOCK] = 'first comment block'
pointerName[POINTER_DESCRIPTION] = 'description'
pointerName[POINTER_NOTE_COUNT] = 'note count'
pointerName[POINTER_NOTES] = 'notes'
pointerName[POINTER_END] = 'finished parsing the file'

const isBaseType = (type, value) =>
  both(propEq('type', type), compose(both(propEq(0, value), propEq(1, value)), prop('multipliers')))

const toJson = raw => {
  const lines = raw.split(/[ \t]*\r?\n[ \t]*/)

  const data = {
    description: '',
    noteCount: 0,
    notes: []
  }

  let pointer = POINTER_START
  let lineCounter = 0
  let expected = ''

  lines.some(line => {
    lineCounter++

    switch (pointer) {
      case POINTER_START:
        if (line.startsWith('!')) {
          pointer = POINTER_FIRST_COMMENT_BLOCK
        } else {
          pointer = POINTER_DESCRIPTION
          data.description = line
        }
        break
      case POINTER_FIRST_COMMENT_BLOCK:
        if (!line.startsWith('!')) {
          pointer = POINTER_DESCRIPTION
          data.description = line
        }
        break
      case POINTER_DESCRIPTION:
        if (!line.startsWith('!')) {
          data.noteCount = parseInt(line, 10)
          if (isNaN(data.noteCount) || data.noteCount < 0) {
            expected = 'A valid, positive integer, which indicates the number of notes in the scale'
            return true
          } else {
            pointer = data.noteCount === 0 ? POINTER_END : POINTER_NOTE_COUNT
          }
        }
        break
      case POINTER_NOTE_COUNT:
        if (!line.startsWith('!')) {
          let match = line.match(/^(\d+[ \t]*(?:\.[ \t]*\d*|\/[ \t]*\d+)?|-\d+\.\d*)(?:[ \t].*)?$/)

          if (match === null) {
            expected = 'A valid cent or ratio value, optionally with comments after it'
            return true
          }

          match = match[1]

          const d = {}

          if (match.includes('.')) {
            d.type = 'cent'
            d.multipliers = [0, parseFloat(match)]
          } else {
            d.type = 'ratio'
            const multipliers = match.split('/')
            if (multipliers.length === 1) {
              multipliers.push(multipliers[0])
            }
            d.multipliers = map(parseInt, multipliers)
          }

          data.notes.push(d)

          if (data.notes.length === data.noteCount) {
            pointer = lineCounter === lines.length ? POINTER_END : POINTER_NOTES
          }
        }
        break
      case POINTER_NOTES:
        if (line === '' && lineCounter === lines.length) {
          pointer = POINTER_END
        } else if (!line.startsWith('!')) {
          expected = 'A single empty line or comment'
          return true
        }
        break
    }
  })

  return new Promise((resolve, reject) => {
    if (pointer !== POINTER_END) {
      let got
      if (expected === '') {
        got = 'end of file'
        switch (pointer) {
          case POINTER_DESCRIPTION:
            expected = 'A valid, positive integer, which indicates the number of notes in the scale'
            break
          case POINTER_NOTE_COUNT:
            expected = 'Number of defined notes does not match with predefined note count'
            break
          case POINTER_NOTES:
            expected = 'A single empty line'
            break
        }
      } else {
        got = lines[lineCounter - 1]
      }

      const message = `Parse error of the SCL file at line ${lineCounter}! Last successfully parsed element was: ${pointerName[pointer]}`
      const error = Error(message)
      error.report = {
        atLine: lineCounter,
        lastParsed: pointerName[pointer],
        expected,
        got
      }

      reject(error)
    } else {
      if (
        data.noteCount > 0 &&
        compose(complement, either(isBaseType('ratio', 1), isBaseType('cent', 0)))(data.notes[0])
      ) {
        data.noteCount++
        data.notes.unshift({
          type: 'ratio',
          multipliers: [1, 1]
        })
      }

      resolve(data)
    }
  })
}

const fromJson = () => '' // TODO

export { toJson, fromJson }
