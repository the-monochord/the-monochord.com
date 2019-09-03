const languages = ['en', 'hu']

const i18nConfig = {
  debug: false,
  lng: 'en',
  fallbackLng: 'en',
  whitelist: languages,
  load: 'all',
  defaultNS: 'translation'
}

export { i18nConfig, languages }
