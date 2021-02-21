<template>
  <v-form @submit.prevent="updateProfile">
    <h2>Profile Settings</h2>

    <v-text-field v-model="state.displayName" label="displayName" />

    <v-btn type="submit">save</v-btn>
  </v-form>
</template>

<script>
import { computed, defineComponent, reactive, useContext } from '@nuxtjs/composition-api'

export default defineComponent({
  setup() {
    const { $fire, store } = useContext()

    const state = reactive({
      displayName: '',
      userData: computed(() => store.state.user)
    })

    state.displayName = state.userData.displayName

    const updateProfile = async () => {
      try {
        await $fire.auth.currentUser.updateProfile({
          displayName: state.displayName
        })
        store.commit('user/setUser', {
          displayName: state.displayName
        })
      } catch (e) {
        console.log('TODO: lekezelni az updateProfile hibát', e)
      }
    }

    return {
      state,
      updateProfile
    }
  }
})
</script>
