import { createContext } from 'react'
import Audio from '../audio/Audio'

const AudioContext = createContext(new Audio())

export default AudioContext
