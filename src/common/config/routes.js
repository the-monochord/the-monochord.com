import { includes, isNil } from 'ramda'
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
    }
  },
  {
    path: '/listen/:notes/:timbre?',
    component: Listen
  },
  {
    path: '/login/:strategy?',
    component: Login,
    preCheck: (req, res) => {
      if (req.isAuthenticated()) {
        res.redirect('/')
        return true
      }
    }
  },
  {
    path: '/connect/:strategy?',
    component: Connect
  },
  {
    path: '/:hash?/:revision?',
    component: Main,
    appData: {
      seo: {
        title: 'AAA', // TODO
        description: 'BBB'
      }
    }
  }
]

export default routes
