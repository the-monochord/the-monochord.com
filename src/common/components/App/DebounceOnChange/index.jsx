import React, { useState, useEffect } from 'react'
import { curry } from 'ramda'
import { NOP } from '../../../helpers/function'
import { debounce } from '../../../helpers/events'

// based on https://github.com/erikras/redux-form/issues/1835#issuecomment-249424667
const DebounceOnChange = curry((debounceTime, Component) => {
  return props => {
    const { onChange, value, ...otherProps } = props

    const [displayedValue, setDisplayedValue] = useState(value)
    const [lastPropValue, setLastPropValue] = useState(value)
    const [handleChange, setHandleChange] = useState(NOP)

    useEffect(() => {
      const debouncedOnChange = debounce(event => {
        onChange(event.target.value)
      }, debounceTime)

      // https://medium.com/@pshrmn/react-hook-gotchas-e6ca52f49328 'Function as state' part
      setHandleChange(() => event => {
        event.persist()
        setDisplayedValue(event.target.value)
        debouncedOnChange(event)
      })
    }, [onChange])

    useEffect(() => {
      setDisplayedValue(value)
      setLastPropValue(value)
    }, [value])

    const getValue = () => {
      if (value === lastPropValue) {
        return displayedValue
      } else {
        setLastPropValue(value)
        return value
      }
    }

    return (
      <Component
        {...{
          onChange: handleChange || NOP, // useState is not ready yet, need default value
          value: getValue(),
          ...otherProps
        }}
      />
    )
  }
})

export default DebounceOnChange
