/* global gtag */

const onScaleImport = (description, raw) => {
  gtag('event', 'import scale', { description, raw })
}

const onPageSelect = pageID => {
  gtag('event', 'screen_view', {
    app_name: 'monochord',
    screen_name: pageID
  })
}

export { onScaleImport, onPageSelect }
