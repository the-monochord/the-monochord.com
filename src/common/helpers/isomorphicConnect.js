/* global __isBrowser__ */

// !! To use the staticContext in a component, you need to enhance it using withRouter from 'react-router-dom'

import React from 'react'
// TODO: only load 'react-redux' on the client side
import { connect } from 'react-redux'

const connectStaticContext = mapStateToProps => WrappedComponent => {
  return ({ staticContext, ...props }) => {
    return React.createElement(WrappedComponent, { ...mapStateToProps(staticContext), ...props })
  }
}

export default __isBrowser__ ? connect : connectStaticContext
