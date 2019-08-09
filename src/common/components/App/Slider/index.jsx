import React from 'react'
import { NOP } from '../../../helpers/function'

const Slider = props => {
  const { min, max, step, value, onChange = NOP } = props
  return <input type="range" {...{ min, max, step, value, onChange }} />
}

export default Slider
