import { useContext } from '@nuxtjs/composition-api'
import { firestoreAction } from 'vuexfire'

export const state = () => {
  return {
    projectID: null,
    version: 0,
    meta: {},
    data: {},
    versions: []
  }
}

export const mutations = {
  setProject(state, payload) {
    const { projectID, version, meta, data } = payload
    state.projectID = projectID
    state.version = version
    state.meta = meta
    state.data = data
  }
}

export const actions = {
  bindProjectData: firestoreAction(({ bindFirestoreRef }, { projectID, version }) => {
    console.log(projectID, version)
    const { $fire } = useContext()

    const meta = $fire.firestore.collection('Projects').doc(projectID)
    bindFirestoreRef('meta', meta, { wait: true })

    const data = $fire.firestore
      .collection('Projects')
      .doc(projectID)
      .collection('versions')
      .doc(`${version}`)
    bindFirestoreRef('data', data, { wait: true })

    // const versions = $fire.firestore.collection('Projects').doc(projectID).collection('versions')
    // console.log(versions)
  }),
  unbindProjectData: firestoreAction(({ unbindFirestoreRef }) => {
    unbindFirestoreRef('meta', false)
    unbindFirestoreRef('data', false)
    // unbindFirestoreRef('versions', false)
  })
}
