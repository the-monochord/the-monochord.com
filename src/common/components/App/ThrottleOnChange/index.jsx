import React, { useEffect, useState } from 'react'
import { curry } from 'ramda'
import { NOP } from '../../../helpers/function'
import { throttle } from '../../../helpers/events'

const ThrottleOnChange = curry((throttleInterval, Component) => {
  let onChangeCanBeUpdated = true
  return props => {
    const { onChange = NOP, value, ...otherProps } = props

    const [displayedValue, setDisplayedValue] = useState(value)
    const [lastPropValue, setLastPropValue] = useState(value)
    const [handleChange, setHandleChange] = useState(NOP)

    useEffect(() => {
      if (onChangeCanBeUpdated) {
        const throttledOnChange = throttle(event => {
          onChange(event)
          setDisplayedValue(event.target.value)
          onChangeCanBeUpdated = true
        }, throttleInterval)

        // https://medium.com/@pshrmn/react-hook-gotchas-e6ca52f49328 'Function as state' part
        setHandleChange(() => event => {
          event.persist()
          throttledOnChange(event)
          onChangeCanBeUpdated = false
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

export default ThrottleOnChange
