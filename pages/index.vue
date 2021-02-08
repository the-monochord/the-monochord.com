<template>
  <div>
    <TopBar />
    <Settings />
    <button @click="incCntr">{{ state.counter }}</button>
  </div>
</template>

<script>
import { defineComponent, useContext, reactive } from '@nuxtjs/composition-api'

export default defineComponent({
  setup: () => {
    const { $fire } = useContext()

    const state = reactive({
      counter: null
    })

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
  },
  head: {}
})
</script>
