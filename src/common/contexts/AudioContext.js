import { createContext } from 'react'
import Audio from '../helpers/Audio'

const AudioContext = createContext(new Audio())

export default AudioContext
