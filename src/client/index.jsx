import React from 'react'
import { hydrate } from 'react-dom'
import { Provider } from 'react-redux'
import { I18nextProvider } from 'react-i18next'
import { createStore, applyMiddleware } from 'redux'
import { BrowserRouter } from 'react-router-dom'
import i18n from 'i18next'
import { values, forEach, compose, when, append, apply } from 'ramda'
import logger from 'redux-logger'
import App from '../common/components/App'
import combinedReducers from '../common/reducers'
import watchForHover from '../common/helpers/watchForHover'
import { removeElement } from '../common/helpers/dom'
import { loadLanguageFile, initI18n } from '../common/helpers/i18n'
import * as middlewares from '../common/middlewares'
import { postfixIfNeeded } from '../common/helpers/string'
import { createSocketClient } from './websocket'

const container = document.getElementById('app')
const mode = window.appData.constants.mode
/* eslint-disable */
__webpack_public_path__ = postfixIfNeeded('/', window.appData.constants.staticPath)
/* eslint-enable */

if (container) {
  ;(async () => {
    const appliedMiddlewares = compose(
      apply(applyMiddleware),
      when(() => mode === 'development', append(logger)),
      values
    )(middlewares)
    const store = createStore(combinedReducers, window.appData, appliedMiddlewares)
    const {
      settings: { language: currentLanguage },
      constants: { staticPath }
    } = store.getState()

    watchForHover(container)

    await initI18n(i18n)
    await loadLanguageFile(currentLanguage, staticPath, i18n)

    if (i18n.language !== currentLanguage) {
      await i18n.changeLanguage(currentLanguage)
    }

    hydrate(
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </I18nextProvider>
      </Provider>,
      container
    )

    createSocketClient(store, actions => {
      forEach(action => {
        store.dispatch(action)
      }, actions)
    })
  })()
}

delete window.appData
removeElement(document.getElementById('initialData'))

if (mode === 'production') {
  console.log(
    `%c
Interested in how the monochord works?

Check out https://github.com/the-monochord/the-monochord.com for the source code,
or check https://trello.com/b/SxXkNXkB/monochord to see what features are coming up next.
`,
    'color:red;font-size:1.2em'
  )
}
