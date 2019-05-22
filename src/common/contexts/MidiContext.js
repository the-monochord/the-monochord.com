import { createContext } from 'react'
import Midi from '../helpers/Midi'

const MidiContext = createContext(new Midi())

export default MidiContext
