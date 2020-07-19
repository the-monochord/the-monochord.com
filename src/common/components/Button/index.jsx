import React from 'react'
import { NOP } from '../../helpers/function'

const Button = props => {
  const { onClick = NOP, children } = props
  return <button onClick={onClick}>{children}</button>
}

export default Button
