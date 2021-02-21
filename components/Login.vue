<template>
  <v-form @submit.prevent="login">
    <h2>Login</h2>

    <p v-if="state.errorMessage !== ''">{{ state.errorMessage }}</p>
    <v-text-field v-model="state.email" label="email" type="email" />
    <v-text-field v-model="state.password" label="password" type="password" />

    <v-btn type="submit" :loading="state.loading">Login</v-btn>
  </v-form>
</template>
<script>
import { defineComponent, reactive, useContext } from '@nuxtjs/composition-api'

export default defineComponent({
  setup() {
    const { $fire, store } = useContext()

    const state = reactive({
      loading: false,
      email: '',
      password: '',
      errorMessage: ''
    })

    const login = async () => {
      if (state.loading) {
        return
      }

      state.loading = true

      try {
        const { user } = await $fire.auth.signInWithEmailAndPassword(state.email, state.password)
        store.dispatch('user/onAuthStateChanged', {
          authUser: user
        })
      } catch (e) {
        const { code, message } = e
        // https://firebase.google.com/docs/auth/admin/errors
        console.log('TODO: handle login error', code, message)
        state.errorMessage = message
      }

      state.loading = false
    }

    return {
      state,
      login
    }
  }
})
</script>
