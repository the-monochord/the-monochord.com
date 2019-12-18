import React, { useState } from 'react'

const ModalDialog = props => {
  const { children } = props

  const [isOpened, setIsOpened] = useState(false)

  return (
    <div className="ModalDialog" style={{ display: isOpened ? 'block' : 'none' }}>
      {children}
      <button onClick={() => setIsOpened(false)}>x</button>
    </div>
  )
}

export default ModalDialog
