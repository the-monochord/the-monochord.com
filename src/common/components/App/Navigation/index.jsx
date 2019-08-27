import React from 'react'
import { NavLink, withRouter } from 'react-router-dom'
import { compose } from 'ramda'
import { useTranslation } from 'react-i18next'
import { If, Then, Else } from 'react-if'
import isomorphicConnect from '../../../helpers/isomorphicConnect'

const enhance = compose(
  withRouter,
  isomorphicConnect(
    state => ({
      isLoggedIn: state.user.isLoggedIn
    }),
    {}
  )
)

const Navigation = props => {
  const { isLoggedIn } = props

  const { t } = useTranslation(['Navigation'])

  return (
    <nav>
      <ul>
        <li>
          <NavLink to={'/'}>Home</NavLink>
        </li>
        <li>
          <NavLink to={'/listen/1:1-3:2-2:1/triangle'}>Listen to 1:1, 3:2 and 2:1</NavLink>
        </li>
        <li>
          <NavLink to={'/tools/convert-ratio-to-cents/5:4'}>
            {t('Convert {{ratio}} to cents', { ratio: '5:4' })}
          </NavLink>
        </li>
        <li>
          <If condition={isLoggedIn}>
            <Then>
              <a href="/logout">{t('Logout')}</a>
            </Then>
            <Else>
              <NavLink to={'/login'}>{t('Login')}</NavLink>
            </Else>
          </If>
        </li>
      </ul>
    </nav>
  )
}

export default enhance(Navigation)
