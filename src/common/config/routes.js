import { includes, isNil, mergeDeepLeft } from 'ramda'
import Main from '../components/App/Main'
import Tools from '../components/App/Tools'
import Listen from '../components/App/Listen'
import Login from '../components/App/Login'
import Connect from '../components/App/Connect'

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
    updateAppData: ({ tool, input }, appData) => {
      return mergeDeepLeft(
        {
          seo: {
            title: 'Tools',
            description: 'Tools',
            url: '/tools'
          }
        },
        appData
      )
    }
  },
  {
    path: '/listen/:notes/:timbre?',
    component: Listen,
    updateAppData: ({ notes, timbre }, appData) => {
      return mergeDeepLeft(
        {
          seo: {
            title: 'Listen',
            description: 'Listen',
            url: '/listen'
          }
        },
        appData
      )
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
    updateAppData: ({ strategy }, appData) => {
      return mergeDeepLeft(
        {
          seo: {
            title: 'Login',
            description: 'Login',
            url: '/login'
          }
        },
        appData
      )
    }
  },
  {
    path: '/connect/:strategy?',
    component: Connect,
    updateAppData: ({ strategy }, appData) => {
      return mergeDeepLeft(
        {
          seo: {
            title: 'Connect',
            description: 'Connect',
            url: '/connect'
          }
        },
        appData
      )
    }
  },
  {
    path: '/:hash?/:revision?',
    component: Main,
    updateAppData: ({ hash, revision }, appData) => {
      return mergeDeepLeft(
        {
          seo: {
            title: 'Main',
            description: 'Main',
            url: '/'
          }
        },
        appData
      )
    }
  }
]

export default routes
