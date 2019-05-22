import { combineReducers } from 'redux'

import { reducer as accounts } from './accounts'
import { reducer as personal } from './personal'
import { reducer as constants } from './constants'
import { reducer as settings } from './settings'
import { reducer as drafts } from './drafts'
import { reducer as user } from './user'
import { reducer as seo } from './seo'
import { reducer as state } from './state'
import { reducer as midi } from './midi'
import { reducer as history } from './history'

export default combineReducers({
  accounts,
  personal,
  constants,
  settings,
  drafts,
  user,
  seo,
  state,
  midi,
  history
})
