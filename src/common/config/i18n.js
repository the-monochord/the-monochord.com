const languages = ['en', 'hu']

const i18nConfig = {
  lng: 'en',
  fallbackLng: 'en',
  whitelist: languages,
  load: 'all',
  keySeparator: false,
  defaultNS: 'translation'
}

export { i18nConfig, languages }
