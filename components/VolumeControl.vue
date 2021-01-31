<template>
  <v-slider
    :prepend-icon="icon"
    hide-details
    :min="0"
    :max="100"
    :value="volume"
    track-color="grey lighten-2"
    @click:prepend="$emit('toggleMute')"
    @input="(value) => $emit('volumeChanged', value)"
  />
</template>

<script>
import { defineComponent, computed } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    volume: {
      type: Number,
      default: 100
    },
    muted: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const icon = computed(() => {
      if (props.muted) {
        return 'mdi-volume-mute'
      }

      if (props.volume === 0) {
        return 'mdi-volume-low'
      }

      if (props.volume < 67) {
        return 'mdi-volume-medium'
      }

      return 'mdi-volume-high'
    })

    return {
      icon
    }
  }
})
</script>
