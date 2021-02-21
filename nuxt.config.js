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

  plugins: [{ src: '~/plugins/vuetify.js', mode: 'server' }],

  components: true,

  buildModules: [
    '@nuxtjs/eslint-module',
    '@nuxtjs/stylelint-module',
    '@nuxtjs/vuetify',
    '@nuxtjs/composition-api'
  ],

  modules: ['@nuxtjs/axios', '@nuxtjs/pwa', '@nuxtjs/firebase'],

  axios: {},

  firebase: {
    // https://firebase.nuxtjs.org/guide/options
    config: {
      apiKey: 'AIzaSyBxBWK6rty_hSs7pAkHp0CnqQ0HjiyWM_M',
      authDomain: 'the-monochord.firebaseapp.com',
      databaseURL: 'https://the-monochord-default-rtdb.europe-west1.firebasedatabase.app',
      projectId: 'the-monochord',
      storageBucket: 'the-monochord.appspot.com',
      messagingSenderId: '213687865094',
      appId: '1:213687865094:web:c40991d13347f56667d887'
    },
    services: {
      auth: {
        persistence: 'local',
        ssr: true,
        initialize: {
          onAuthStateChangedAction: 'user/onAuthStateChanged',
          subscribeManually: false
        }
      },
      firestore: true
    }
  },

  vuetify: {
    theme: {
      dark: false
    }
  },

  build: {},

  pwa: {
    workbox: {
      importScripts: ['/firebase-auth-sw.js'],
      dev: process.env.NODE_ENV === 'development'
    }
  }
}
