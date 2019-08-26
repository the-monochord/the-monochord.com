import { useRef, useEffect } from 'react'

// https://stackoverflow.com/a/53180013/1806628
const useEffectSkipFirst = (fn, inputs) => {
  const didMountRef = useRef(false)

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }

    fn()
  }, inputs)
}

const useEffectOnce = fn => {
  useEffect(fn, [])
}

export { useEffectSkipFirst, useEffectOnce }
