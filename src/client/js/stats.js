/* global gtag */

// https://developers.google.com/analytics/devguides/collection/gtagjs/events

const onScaleImport = description => {
  gtag('event', 'import scale', {
    event_category: 'description',
    event_label: description
  })
}

const onPageSelect = pageID => {
  gtag('event', 'page select', {
    event_category: 'page',
    event_label: pageID
  })
}

export { onScaleImport, onPageSelect }
