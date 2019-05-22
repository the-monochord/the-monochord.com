import React from 'react'

const Button = props => {
  const { disabled = false, onClick, label, icon } = props
  return (
    <button type="button" {...{ disabled, onClick }}>
      {icon && `[${icon}]`}
      {label}
    </button>
  )
}

export default Button
