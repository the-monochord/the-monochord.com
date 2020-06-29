/* global gtag */

// https://developers.google.com/analytics/devguides/collection/gtagjs/custom-dims-mets
// https://support.google.com/analytics/answer/1033861?hl=en
// metric = numeral data
// description = string data

const init = () => {
  const measurementID = 'UA-156810565-1'

  gtag('config', measurementID, {
    custom_map: {
      dimension1: 'description',
      dimension2: 'raw',
      dimension3: 'page'
    }
  })
}

const onScaleImport = (description, raw) => {
  gtag('event', 'import scale', { description, raw })
}

const onPageSelect = pageID => {
  gtag('event', 'page select', { page: pageID })
}

export { init, onScaleImport, onPageSelect }
