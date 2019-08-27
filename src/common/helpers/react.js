/* global __isBrowser__ */

import { useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import useRouter from 'use-react-router'
import { compose, prop, pick } from 'ramda'
import { NOP } from './function'

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

const isomorphicUseSelector = selector => {
  if (__isBrowser__) {
    return useSelector(selector)
  } else {
    const { staticContext } = useRouter()
    return selector(staticContext)
  }
}

const isomorphicUseDispatch = __isBrowser__ ? useDispatch : NOP

const useNamespaceSelector = (namespace, keys) =>
  isomorphicUseSelector(
    compose(
      pick(keys),
      prop(namespace)
    )
  )

export {
  useEffectSkipFirst,
  useEffectOnce,
  isomorphicUseSelector as useSelector,
  isomorphicUseDispatch as useDispatch,
  useNamespaceSelector
}
