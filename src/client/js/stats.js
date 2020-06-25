/* global gtag */

const onScaleImport = (description, raw) => {
  gtag('event', 'import scale', { description, raw })
}

const onPageSelect = pageID => {
  gtag('event', 'page select', { pageID })
}

export { onScaleImport, onPageSelect }
