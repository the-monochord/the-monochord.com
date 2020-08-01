const NOP = () => {}

// TODO: would be better off with something like:
//   const sleep = promisify(setTimeout)
// but we need promisify solution, which works in the browser
// node has utils.promisify
const sleep = time => new Promise(resolve => setTimeout(resolve, time))

export { NOP, sleep }
