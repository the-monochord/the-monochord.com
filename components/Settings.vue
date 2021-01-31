<template>
  <div>
    <h2>Settings</h2>

    <v-container>
      <v-row>
        <v-col cols="2">
          <span>Main Volume</span>
        </v-col>
        <v-col cols="10">
          <VolumeControl
            :volume="state.volume"
            :muted="state.muted"
            @toggleMute="toggleMute"
            @volumeChanged="setVolume"
          />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
<script>
import { computed, defineComponent, reactive, useContext } from '@nuxtjs/composition-api'

export default defineComponent({
  setup() {
    const { store } = useContext()

    const state = reactive({
      muted: computed(() => store.state.settings.muted),
      volume: computed(() => store.state.settings.volume)
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

    return {
      state,
      toggleMute,
      setVolume
    }
  }
})
</script>
