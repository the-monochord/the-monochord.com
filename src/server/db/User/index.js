import { pick } from 'ramda'
import { queryOne } from '../helpers'

const findUserByFacebookId = facebookId =>
  queryOne(`SELECT * FROM public."User" WHERE "data"->'accounts'->'facebook'->>'id' = $1`, [facebookId])

const findUserById = id => queryOne(`SELECT * FROM public."User" WHERE "id" = $1`, [id])

const upsertUser = (newData, id) =>
  queryOne(
    `INSERT INTO public."User"("id", "data") VALUES($1, $2) ON CONFLICT ("id") DO UPDATE SET "data" = EXCLUDED."data" RETURNING *`,
    [id, pick(['accounts', 'drafts', 'personal', 'settings'], newData)]
  )

export { findUserByFacebookId, findUserById, upsertUser }
