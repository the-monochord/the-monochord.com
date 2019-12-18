// source: https://codeburst.io/throttling-and-debouncing-in-javascript-b01cad5c8edf

const debounce = (func, delay) => {
  let inDebounce
  return (...args) => {
    clearTimeout(inDebounce)
    inDebounce = setTimeout(() => func.apply(null, args), delay)
  }
}

const throttle = (func, interval) => {
  let lastRan
  let delay
  return (...args) => {
    const now = Date.now()
    if (lastRan) {
      clearTimeout(delay)
      delay = setTimeout(() => {
        const future = Date.now()
        if (future - lastRan >= interval) {
          console.log('xxxx')
          func.apply(null, args)
          lastRan = future
        }
      }, interval - (now - lastRan))
    } else {
      setTimeout(() => {
        func.apply(null, args)
        lastRan = now
      }, 0)
    }
  }
}

export { debounce, throttle }
