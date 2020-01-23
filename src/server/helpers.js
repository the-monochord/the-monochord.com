import { networkInterfaces } from 'os'
import { compose, values, flatten, find, both, propEq, prop } from 'ramda'

const getLocalIP = () =>
  compose(
    prop('address'),
    find(both(propEq('family', 'IPv4'), propEq('internal', false))),
    flatten,
    values
  )(networkInterfaces())

export { getLocalIP }
