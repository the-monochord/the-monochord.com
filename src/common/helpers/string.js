import {
  curry,
  compose,
  join,
  toUpper,
  adjust,
  unless,
  isEmpty,
  startsWith,
  endsWith,
  assoc,
  prop,
  dissoc,
  is
} from 'ramda'

// prefix :: String -> String -> String
const prefix = curry((left, text) => left + text)

// postfix :: String -> String -> String
const postfix = curry((right, text) => text + right)

// prefixIfNotEmpty :: String -> String -> String
const prefixIfNotEmpty = curry((left, text) => unless(isEmpty, prefix(left))(text))

// postfixIfNotEmpty :: String -> String -> String
const postfixIfNotEmpty = curry((right, text) => unless(isEmpty, postfix(right))(text))

// prefixIfNeeded :: String -> String -> String
const prefixIfNeeded = curry((left, text) => unless(startsWith(left), prefix(left))(text))

// postfixIfNeeded :: String -> String -> String
const postfixIfNeeded = curry((right, text) => unless(endsWith(right), postfix(right))(text))

// wrap :: String -> String -> String -> String
const wrap = curry((left, right, text) => left + text + right)

// capitalize :: String -> -> String
const capitalize = compose(
  join(''),
  adjust(0, toUpper)
)

// copyProp :: String -> String -> Object -> Object
const copyProp = curry((fromName, toName, data) => assoc(toName, prop(fromName, data), data))

// renameProp :: String -> String -> Object -> Object
const renameProp = curry((fromName, toName, data) => dissoc(fromName, copyProp(fromName, toName, data)))

// stringifyIfNeeded :: any -> String
const stringifyIfNeeded = unless(is(String), toString)

export {
  prefix,
  postfix,
  prefixIfNotEmpty,
  postfixIfNotEmpty,
  prefixIfNeeded,
  postfixIfNeeded,
  wrap,
  capitalize,
  copyProp,
  renameProp,
  stringifyIfNeeded
}
