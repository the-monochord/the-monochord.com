<template>
  <v-btn @click="logout">Logout</v-btn>
</template>
<script>
import { defineComponent, useContext } from '@nuxtjs/composition-api'

export default defineComponent({
  setup() {
    const { $fire, store } = useContext()

    const logout = async () => {
      await $fire.auth.signOut()
      store.dispatch('user/logout')
    }

    return {
      logout
    }
  }
})
</script>
