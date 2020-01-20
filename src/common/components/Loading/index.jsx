import React from 'react'
import cn from 'classnames'
import PropTypes from 'prop-types'
import { values } from 'ramda'
import s from './style.scss'

export const LOADING_STATES = {
  LOADING: 'loading',
  FADING: 'fadeout',
  LOADED: 'loaded'
}

const Loading = ({ loadingState, splash, brand, theme, ...props }) => {
  if (loadingState === LOADING_STATES.LOADED) {
    return null
  } else {
    return (
      <div
        id={s.loading}
        className={cn(
          s[`theme-${theme}`],
          loadingState === LOADING_STATES.FADING && s.fading,
          loadingState === LOADING_STATES.LOADED && s.hidden
        )}
        {...props}
      >
        <div className={s.logo}>
          <h1 className={s.brand}>{brand}</h1>
          <div>{splash}</div>
        </div>
      </div>
    )
  }
}

Loading.propTypes = {
  loadingState: PropTypes.oneOf(values(LOADING_STATES)).isRequired,
  splash: PropTypes.string.isRequired,
  brand: PropTypes.string.isRequired
}

export default Loading
