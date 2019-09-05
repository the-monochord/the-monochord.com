import { includes, isNil } from 'ramda'
import i18n from 'i18next'
import Editor from '../components/App/Editor'
import Tools from '../components/App/Tools'
import Listen from '../components/App/Listen'
import Login from '../components/App/Login'
import Connect from '../components/App/Connect'
import { prefixIfNotEmpty } from '../helpers/string'

const routes = [
  {
    path: '/tools/:tool?/:input?',
    component: Tools,
    preCheck: (req, res, { tool, input }) => {
      if (!isNil(tool) && !includes(tool, ['convert-ratio-to-cents', 'convert-cents-to-ratio'])) {
        res.redirect('/tools')
        return true
      }
    },
    getSeoData: ({ tool, input }) => {
      switch (tool) {
        case 'convert-ratio-to-cents':
          if (isNil(input)) {
            return {
              title: i18n.t('Tools:Convert ratio to cents'),
              url: '/tools/convert-ratio-to-cents'
            }
          } else {
            return {
              title: i18n.t('Tools:Convert {{ratio}} to cents', { ratio: input }),
              url: `/tools/convert-ratio-to-cents/${input}`
            }
          }
        case 'convert-cents-to-ratio':
          if (isNil(input)) {
            return {
              title: i18n.t('Tools:Convert cents to ratio'),
              url: '/tools/convert-cents-to-ratio'
            }
          } else {
            return {
              title: i18n.t('Tools:Convert {{cents}} to ratio', { ratio: input }),
              url: `/tools/convert-cents-to-ratio/${input}`
            }
          }
        default:
          return {
            title: i18n.t('Tools:Tools'),
            url: '/tools'
          }
      }
    }
  },
  {
    path: '/listen/:notes/:timbre?',
    component: Listen,
    getSeoData: ({ notes, timbre }) => {
      if (isNil(notes)) {
        return {
          title: i18n.t('Listen:Listen'),
          url: '/listen'
        }
      } else {
        return {
          title: i18n.t('Listen:Listen to {{notes}}', { notes: notes }),
          url: `/listen/${notes}${prefixIfNotEmpty('/', timbre)}`
        }
      }
    }
  },
  {
    path: '/login/:strategy?',
    component: Login,
    preCheck: (req, res) => {
      if (req.isAuthenticated()) {
        res.redirect('/')
        return true
      }
    },
    getSeoData: ({ strategy }) => {
      if (isNil(strategy)) {
        return {
          title: i18n.t('Login:Login'),
          url: '/login'
        }
      } else {
        return {
          title: i18n.t('Login:Login with {{strategy}}', { strategy: strategy }),
          url: `/login/${strategy}`
        }
      }
    }
  },
  {
    path: '/connect/:strategy?',
    component: Connect,
    getSeoData: ({ strategy }) => {
      if (isNil(strategy)) {
        return {
          title: i18n.t('Connect:Connect'),
          url: '/connect'
        }
      } else {
        return {
          title: i18n.t('Connect:Connect with {{strategy}}', { strategy: strategy }),
          url: `/connect/${strategy}`
        }
      }
    }
  },
  {
    path: '/:hash?/:revision?',
    component: Editor,
    getSeoData: ({ hash, revision }) => {
      return {
        title: i18n.t('Editor:Editor'),
        url: `/${hash}${prefixIfNotEmpty('/', revision)}`
      }
    }
  }
]

export default routes
