import React from 'react'
import Slider from '../Slider'
import { NOP } from '../../../helpers/function'

const VolumeControl = props => {
  const { value, onChange = NOP } = props
  return <Slider min={0} max={1} step={0.01} value={value} onChange={onChange} />
}

export default VolumeControl
