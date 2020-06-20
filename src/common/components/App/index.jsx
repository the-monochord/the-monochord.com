import React from 'react'
import cn from 'classnames'
import './style.scss'

const App = props => {
  const {
    data: { theme }
  } = props

  return <div className={cn(`theme-${theme}`)}>The Monochord - now with react</div>
}

export default App
