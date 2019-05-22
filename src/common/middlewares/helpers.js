import { compose, head, split, prop } from 'ramda'

const getSliceFromAction = compose(
  head,
  split('/'),
  prop('type')
)

export { getSliceFromAction }
