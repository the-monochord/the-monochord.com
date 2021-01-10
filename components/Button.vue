<template>
  <button>{{ label }}</button>
</template>
<script>
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    label: {
      type: String
    }
  },
  setup() {
    return {}
  }
})
</script>
