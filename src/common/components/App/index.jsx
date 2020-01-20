import React, { Component } from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import Loading, { LOADING_STATES } from '../Loading'
import './style.scss'

class App extends Component {
  constructor(props) {
    super(props)

    const { data } = props

    this.state = {
      ...data,
      loading: LOADING_STATES.LOADING
    }

    this.handleLoadingClick = this.handleLoadingClick.bind(this)
  }

  componentDidMount() {
    setTimeout(() => {
      if (this.state.loading !== LOADING_STATES.LOADED) {
        this.setState({
          loading: LOADING_STATES.FADING
        })

        setTimeout(() => {
          this.setState({
            loading: LOADING_STATES.LOADED
          })
        }, 1000)
      }
    }, 1000)
  }

  handleLoadingClick() {
    if (this.state.loading === LOADING_STATES.FADING) {
      this.setState({
        loading: LOADING_STATES.LOADED
      })
    }
  }

  render() {
    // theme should be in redux
    return (
      <div className={cn(`theme-${this.state.theme}`)}>
        The Monochord - now with react
        <Loading
          loadingState={this.state.loading}
          brand={this.state._.seo.brand}
          splash={this.state._.seo.splash}
          onClick={this.handleLoadingClick}
        />
      </div>
    )
  }
}

App.propTypes = {
  data: PropTypes.object.isRequired // TODO: turn this into a shape
}

export default App
