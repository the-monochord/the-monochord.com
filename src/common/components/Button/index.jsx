import React from 'react'
import { noop } from 'ramda-adjunct'

const Button = props => {
  const { onClick = noop, children } = props
  return <button onClick={onClick}>{children}</button>
}

export default Button
