<template>
  <div>
    <TopBar />
    <Settings />

    <template v-if="state.isLoggedIn">
      <EditProfile />
      <Logout />
    </template>
    <template v-else>
      <Login />
    </template>

    <!-- <button @click="incCntr">{{ state.counter }}</button> -->
  </div>
</template>

<script>
import { defineComponent, useContext, reactive, computed } from '@nuxtjs/composition-api'

export default defineComponent({
  setup: () => {
    const { store /*, $fire */ } = useContext()

    const state = reactive({
      isLoggedIn: computed(() => store.state.user.isLoggedIn)
    })

    /*
    const cntr = $fire.database.ref('counter')
    cntr.on('value', (snapshot) => {
      state.counter = snapshot.val()
    })

    const incCntr = () => {
      const num = Math.floor(Math.random() * 100)
      console.log('setting counter to', num)
      cntr.set(num)
    }

    return { state, incCntr }
    */
    return { state }
  },
  head: {}
})
</script>
