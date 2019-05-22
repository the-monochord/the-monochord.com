import { propOr } from 'ramda'
import { getDBPool } from './setup'

const query = (statement, values) => {
  const pool = getDBPool()
  if (pool) {
    return pool.connect().then(client => {
      return client
        .query(statement, values)
        .then(res => {
          client.release()
          return res.rows
        })
        .catch(e => {
          client.release()
        })
    })
  } else {
    return Promise.reject(new Error('DB pool is not connected'))
  }
}

const queryOne = (statement, values) => query(statement, values).then(propOr(null, 0))

export { query, queryOne }
