import React, { useState, useEffect } from 'react'
import { curry } from 'ramda'
import { NOP } from '../../../helpers/function'
import { debounce } from '../../../helpers/events'

// based on https://github.com/erikras/redux-form/issues/1835#issuecomment-249424667
const DebounceOnChange = curry((debounceTime, Component) => {
  let onChangeCanBeUpdated = true
  return props => {
    const { onChange = NOP, onChangeCommitted = NOP, value, ...otherProps } = props

    const [displayedValue, setDisplayedValue] = useState(value)
    const [lastPropValue, setLastPropValue] = useState(value)
    const [handleChange, setHandleChange] = useState(NOP)

    useEffect(() => {
      if (onChangeCanBeUpdated) {
        const debouncedOnChange = debounce(event => {
          onChangeCommitted(event.target.value)
          onChangeCanBeUpdated = true
        }, debounceTime)

        // https://medium.com/@pshrmn/react-hook-gotchas-e6ca52f49328 'Function as state' part
        setHandleChange(() => event => {
          event.persist()
          setDisplayedValue(event.target.value)
          debouncedOnChange(event)
          onChangeCanBeUpdated = false
          onChange(event)
        })
      }
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