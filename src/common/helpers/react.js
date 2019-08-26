import { useRef, useEffect } from 'react'

const useEffectSkipFirst = (fn, inputs) => {
  const isFirstCallRef = useRef(true)

  useEffect(() => {
    if (isFirstCallRef.current) {
      isFirstCallRef.current = false
      return
    }

    return fn()
  }, inputs)
}

const useEffectOnce = fn => {
  useEffect(fn, [])
}

export { useEffectSkipFirst, useEffectOnce }
