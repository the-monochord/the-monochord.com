import { Pool } from 'pg'
import { dbConfig } from '../config'
import { logger } from '../log'

let pool = null

const createDBPool = () => {
  if (pool === null) {
    pool = new Pool(dbConfig)

    pool.on('error', (e, client) => {
      logger.error(`Unexpected error on idle client: ${e.message}`)
      process.exit(-1)
    })
  }
}

const getDBPool = () => pool

const destroyDBPool = () => {
  if (pool === null) {
    return Promise.resolve()
  } else {
    return pool.end().then(() => {
      pool = null
    })
  }
}

export { createDBPool, getDBPool, destroyDBPool }
