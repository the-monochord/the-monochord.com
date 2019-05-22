import path from 'path'
import expressSession from 'express-session'
import sessionFileStore from 'session-file-store'
import { sessionConfig } from './config'

const initSession = () => {
  const FileStore = sessionFileStore(expressSession)
  const fileStore = new FileStore({
    path: path.resolve(__dirname, '../../sessions'),
    ttl: sessionConfig.cookie.maxAge / 1000
  })

  return expressSession({
    ...sessionConfig,
    store: fileStore
  })
}

export default initSession
