<template>
  <div>
    <TopBar />
    <Settings />

    <template v-if="state.isLoggedIn">
      <EditProfile />
      <br />
      <Logout />
    </template>
    <template v-else>
      <Login />
    </template>
  </div>
</template>

<script>
import { defineComponent, useContext, reactive, computed } from '@nuxtjs/composition-api'

export default defineComponent({
  setup: () => {
    const { store } = useContext()

    const state = reactive({
      isLoggedIn: computed(() => store.state.user.isLoggedIn)
    })

    return { state }
  },
  head: {}
})
</script>
