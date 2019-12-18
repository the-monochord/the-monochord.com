import {
  compose,
  mergeDeepRight,
  __,
  pathOr,
  concat,
  reject,
  equals,
  map,
  evolve,
  F,
  T,
  assoc,
  isNil,
  unless,
  any,
  propEq,
  adjust
} from 'ramda'
import passport from 'passport'
import { Strategy as FacebookStrategy } from 'passport-facebook'
import moment from 'moment'
import uuidV4 from 'uuid/v4'
import { emptyProject } from '../common/config/defaults'
import { facebookConfig, defaultSessionData } from './config'
import { findUserByFacebookId, findUserById, upsertUser } from './db/User'
import { getSessionData } from './helpers'

const isEmptyProject = equals(emptyProject)

const setupPassport = () => {
  passport.use(
    new FacebookStrategy(facebookConfig, async (req, accessToken, refreshToken, profile, done) => {
      try {
        const user = await findUserByFacebookId(profile.id)
        const { drafts, settings } = getSessionData(req)
        req.session.data = { ...defaultSessionData, settings }
        const facebookProfileData = assoc(
          'validUntil',
          moment()
            .add(30, 'days')
            .format(),
          profile._json
        )

        if (isNil(user)) {
          const newUserData = {
            id: uuidV4(),
            data: {
              accounts: {
                local: null,
                facebook: facebookProfileData,
                google: null
              },
              drafts,
              settings,
              personal: {
                picture: pathOr(null, ['picture', 'data', 'url'], facebookProfileData),
                displayName: profile.displayName,
                publicContacts: [],
                favourites: [],
                likes: []
              }
            }
          }
          done(null, newUserData)
        } else {
          const updatedUserData = compose(
            mergeDeepRight(__, {
              data: {
                accounts: {
                  facebook: facebookProfileData
                },
                personal: {
                  picture: pathOr(null, ['picture', 'data', 'url'], facebookProfileData)
                }
              }
            }),
            evolve({
              data: {
                drafts: {
                  projects: compose(
                    unless(any(propEq('isActive', true)), adjust(-1, evolve({ isActive: T }))),
                    concat(__, reject(isEmptyProject, drafts.projects)),
                    map(evolve({ isActive: F }))
                  )
                }
              }
            })
          )(user)
          done(null, updatedUserData)
        }
      } catch (err) {
        done(err)
      }
    })
  )

  passport.serializeUser(({ id, data }, done) => {
    upsertUser(data, id).then(({ id }) => {
      done(null, id)
    })
  })

  passport.deserializeUser(async (userId, done) => {
    try {
      const user = await findUserById(userId)
      done(null, user)
    } catch (err) {
      done(err)
    }
  })
}

export default setupPassport
