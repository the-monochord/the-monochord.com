import { createContext } from 'react'
import Audio from '../audio/Audio'

const audio = new Audio()
const AudioContext = createContext(audio)

export default AudioContext
export { audio }
