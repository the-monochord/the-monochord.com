import { useRef, useEffect } from 'react'

// https://stackoverflow.com/a/53180013/1806628
const useDidUpdateEffect = (fn, inputs) => {
  const didMountRef = useRef(false)

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }

    fn()
  }, inputs)
}

export { useDidUpdateEffect }
