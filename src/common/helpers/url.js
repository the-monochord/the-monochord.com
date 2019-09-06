import { test } from 'ramda'

const isRatio = test(/^\d+(:\d+)*$/)
const isCent = test(/^\d+\.\d+$/)

export { isRatio, isCent }
