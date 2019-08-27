import React from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { If, Then, Else } from 'react-if'
import { useNamespaceSelector } from '../../../helpers/react'

const Navigation = props => {
  const { t } = useTranslation(['Navigation'])
  const { isLoggedIn } = useNamespaceSelector('user', ['isLoggedIn'])

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

export default Navigation
