export default {
  head: {
    title: 'The Monochord',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: 'The Monochord is an app, which lets you experiment with microtonal scales'
      },

      { property: 'og:url', content: 'https://the-monochord.com' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'The Monochord' },
      {
        property: 'og:description',
        content: 'The Monochord is an app, which lets you experiment with microtonal scales'
      },
      {
        property: 'og:image',
        content: '/img/monochord-logo.png'
      },
      { property: 'og:image:type', content: 'image/png' },
      { property: 'og:image:width', content: '1024' },
      { property: 'og:image:height', content: '1024' },
      { name: 'apple-mobile-web-app-title', content: 'The Monochord' },
      { name: 'application-name', content: 'The Monochord' },
      { name: 'msapplication-config', content: '/img/browserconfig.xml' },
      { name: 'theme-color', content: '#33332b' }
    ],
    link: [
      { rel: 'canonical', href: 'https://the-monochord.com/' },
      {
        rel: 'apple-rouch-icon',
        sizes: '180x180',
        href: '/img/apple-touch-icon.png'
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/img/favicon-32x32.png'
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/img/favicon-16x16.png'
      },
      { rel: 'manifest', href: '/img/manifest.json' },
      {
        rel: 'mask-icon',
        href: '/img/safari-pinned-tab.svg',
        color: '#33332b'
      },
      { rel: 'shortcut icon', href: '/img/favicon.ico' }
    ]
  },

  // Global CSS (https://go.nuxtjs.dev/config-css)
  css: [],

  // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
  plugins: [],

  // Auto import components (https://go.nuxtjs.dev/config-components)
  components: true,

  // Modules for dev and build (recommended) (https://go.nuxtjs.dev/config-modules)
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module',
    // https://go.nuxtjs.dev/stylelint
    '@nuxtjs/stylelint-module',
    '@nuxtjs/composition-api'
  ],

  // Modules (https://go.nuxtjs.dev/config-modules)
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    // https://go.nuxtjs.dev/pwa
    '@nuxtjs/pwa'
  ],

  // Axios module configuration (https://go.nuxtjs.dev/config-axios)
  axios: {},

  // Build Configuration (https://go.nuxtjs.dev/config-build)
  build: {}
}
