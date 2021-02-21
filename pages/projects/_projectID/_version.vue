<template>
  <div>
    <strong>projectID:</strong> {{ state.projectID }}<br />
    <strong>version:</strong> {{ state.version }}<br />
    <NuxtLink :to="`/projects/${state.projectID}/${state.version + 1}`">new version</NuxtLink>
    <br />
    <br />
    {{ state.meta }}<br />
    {{ state.data }}
  </div>
</template>

<script>
import {
  defineComponent,
  useContext,
  reactive,
  computed,
  onMounted,
  onServerPrefetch,
  onUnmounted
} from '@nuxtjs/composition-api'

export default defineComponent({
  setup() {
    const { params, store } = useContext()

    const state = reactive({
      projectID: computed(() => params.value.projectID),
      version: computed(() => parseInt(params.value.version) || 0),
      meta: computed(() => store.state.project.meta),
      data: computed(() => store.state.project.data)
    })

    onServerPrefetch(() => {
      store.dispatch('project/bindProjectData', {
        projectID: state.projectID,
        version: state.version
      })
    })

    onMounted(() => {
      console.log('mounted')
      store.dispatch('project/bindProjectData', {
        projectID: state.projectID,
        version: state.version
      })
    })

    onUnmounted(() => {
      console.log('unmounted')
      store.dispatch('project/unbindProjectData')
    })

    return { state }
  }
})
</script>
