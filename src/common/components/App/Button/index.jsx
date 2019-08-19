import React from 'react'

const Button = props => {
  const { disabled = false, onClick, label, icon = null } = props
  return (
    <button type="button" {...{ disabled, onClick }}>
      {icon}
      {label}
    </button>
  )
}

export default Button
