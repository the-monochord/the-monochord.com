// import colors from 'vuetify/es5/util/colors'

export default {
  head: {
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' }
    ],
    title: 'The Monochord'
    /*
    titleTemplate: '%s - the-monochord.com',
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
    */
  },

  css: [],

  plugins: [],

  components: true,

  buildModules: [
    '@nuxtjs/eslint-module',
    '@nuxtjs/stylelint-module',
    '@nuxtjs/vuetify',
    '@nuxtjs/composition-api'
  ],

  modules: ['@nuxtjs/axios', '@nuxtjs/pwa'],

  axios: {},

  vuetify: {
    // customVariables: ['~/assets/variables.scss'],
    theme: {
      dark: false
      /*
      themes: {
        dark: {
          primary: colors.blue.darken2,
          accent: colors.grey.darken3,
          secondary: colors.amber.darken3,
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: colors.deepOrange.accent4,
          success: colors.green.accent3
        }
      }
      */
    }
  },

  build: {}
}
