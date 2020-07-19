import React from 'react'

const Select = props => {
  const { options } = props
  return (
    <select>
      {options.map((option, idx) => {
        return <option key={idx}>{option}</option>
      })}
    </select>
  )
}

export default Select
