import React, { useState, useEffect } from 'react'
import { curry } from 'ramda'
import { NOP } from '../../../helpers/function'
import { debounce } from '../../../helpers/events'

// based on https://github.com/erikras/redux-form/issues/1835#issuecomment-249424667
const DebounceOnChange = curry((debounceTime, Component) => {
  let handleChange = NOP

  return props => {
    const { onChange, value, ...otherProps } = props

    const [displayedValue, setDisplayedValue] = useState(value)
    const [lastPropValue, setLastPropValue] = useState(value)

    useEffect(() => {
      const debouncedOnChange = debounce(event => {
        onChange(event.target.value)
      }, debounceTime)

      handleChange = event => {
        event.persist()
        setDisplayedValue(event.target.value)
        debouncedOnChange(event)
      }
    }, 1)

    const getValue = () => {
      if (value === lastPropValue) {
        return displayedValue
      } else {
        setLastPropValue(value)
        return value
      }
    }

    return <Component {...{ onChange: handleChange, value: getValue(), ...otherProps }} />
  }
})

export default DebounceOnChange
