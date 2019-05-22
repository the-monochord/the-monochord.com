import React from 'react'
import cn from 'classnames'
import { NOP } from '../../../helpers/function'
import s from './style.scss'

const ToggleSwitch = props => {
  const { on, onChange = NOP, disabled = false, className, label } = props
  return (
    <label className={cn(s.ToggleSwitch, className)}>
      <input type="checkbox" checked={on} onChange={onChange} disabled={disabled} />
      <span className={s.slider} />
      <span className={s.label}>{label}</span>
    </label>
  )
}

export default ToggleSwitch
