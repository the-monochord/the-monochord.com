import { languages } from './i18n'

const emptyProject = {
  from: { hash: null, revision: 0 },
  isActive: true,
  cursorAt: 0,
  title: '',
  assets: {},
  tracks: [],
  bars: []
}

const valuesOfSettings = {
  language: languages,
  theme: ['dark', 'light']
}

export { emptyProject, valuesOfSettings }
