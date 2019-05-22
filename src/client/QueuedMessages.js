/* global DOMException, localStorage */

import EventEmitter from 'eventemitter3'
import { append, either, complement, propOr, last, isEmpty, isNil, memoizeWith } from 'ramda'
import { mergeDeepRightAll } from '../common/helpers/ramda'

// https://gist.github.com/paulirish/5558557#gistcomment-2305330
const isStorageAvailable = memoizeWith(toString, storageType => {
  let storage
  try {
    storage = window[storageType]
    const x = '__storage_test__'
    storage.setItem(x, x)
    storage.removeItem(x)
    return true
  } catch (e) {
    return (
      e instanceof DOMException &&
      (e.code === 22 ||
        e.code === 1014 ||
        e.name === 'QuotaExceededError' ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      (storage && storage.length !== 0)
    )
  }
})

const storageKey = 'queuedMessages'

class QueuedMessages extends EventEmitter {
  constructor() {
    super()

    if (!this._isValid()) {
      this._reset()
    }

    this._listening = false
  }

  listen() {
    if (this._listening) {
      return
    }

    this._listening = true
    if (isStorageAvailable('localStorage')) {
      const handleStorageChange = method => () => {
        // TODO: this event will always be triggered, when localStorage is changed
        // need to filter, if queuedMessages have really changed
        if (!this.isEmpty()) {
          const data = propOr({}, 'payload', method(this.getAll()))
          console.log('found unsynced changes in localStorage, applying changes', data)
          this.emit('change', { data })
        }
      }
      window.addEventListener('storage', handleStorageChange(last))
      handleStorageChange(mergeDeepRightAll)
    }
  }
  _reset() {
    if (isStorageAvailable('localStorage')) {
      localStorage.setItem(storageKey, '[]')
    } else {
      this._messages = []
    }
  }
  _isValid() {
    if (isStorageAvailable('localStorage')) {
      return either(isNil, complement(Array.isArray))(localStorage.getItem(storageKey))
    } else {
      return Array.isArray(this._messages)
    }
  }
  isEmpty() {
    if (isStorageAvailable('localStorage')) {
      try {
        return isEmpty(JSON.parse(localStorage.getItem(storageKey)))
      } catch (e) {
        return true
      }
    } else {
      return isEmpty(this._messages)
    }
  }
  add(message) {
    if (isStorageAvailable('localStorage')) {
      try {
        const messages = JSON.parse(localStorage.getItem(storageKey))
        localStorage.setItem(storageKey, JSON.stringify(append(message, messages)))
      } catch (e) {}
    } else {
      this._messages = append(message, this._messages)
    }
  }
  clear() {
    this._reset()
  }
  getAll() {
    if (isStorageAvailable('localStorage')) {
      try {
        return JSON.parse(localStorage.getItem(storageKey))
      } catch (e) {
        return []
      }
    } else {
      return this._messages
    }
  }
}

export default QueuedMessages
