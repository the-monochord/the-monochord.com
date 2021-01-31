<template>
  <div>
    <h2>Settings</h2>

    <v-container>
      <v-row>
        <v-col cols="2">Main Volume</v-col>
        <v-col cols="10">
          <VolumeControl
            :volume="state.volume"
            :muted="state.muted"
            @toggleMute="toggleMute"
            @volumeChanged="setVolume"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="2">Dark Mode</v-col>
        <v-col cols="10">
          <v-switch inset :input-value="state.darkMode" @change="(value) => setDarkMode(value)" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
<script>
import {
  computed,
  defineComponent,
  watch,
  reactive,
  useContext,
  onMounted
} from '@nuxtjs/composition-api'

export default defineComponent({
  setup() {
    const { store, $vuetify } = useContext()

    const state = reactive({
      muted: computed(() => store.state.settings.muted),
      volume: computed(() => store.state.settings.volume),
      darkMode: computed(() => store.state.settings.darkMode)
    })

    const toggleMute = () => {
      if (state.muted) {
        store.commit('settings/unmute')
      } else {
        store.commit('settings/mute')
      }
    }

    const setVolume = (volume) => {
      store.commit('settings/setVolume', {
        volume
      })
    }

    const setDarkMode = (value) => {
      if (value) {
        store.commit('settings/turnDarkModeOn')
      } else {
        store.commit('settings/turnDarkModeOff')
      }
    }

    // ennél hamarabb nem tudjuk beállítani? ezzel villan a light mode
    onMounted(() => {
      $vuetify.theme.dark = state.darkMode
    })

    watch(
      () => [state.darkMode],
      ([value]) => {
        $vuetify.theme.dark = value
      }
    )

    return {
      state,
      toggleMute,
      setVolume,
      setDarkMode
    }
  }
})
</script>
