export default (context) => {
  const { store, $vuetify } = context
  $vuetify.theme.isDark = store.state.settings.darkMode
}
