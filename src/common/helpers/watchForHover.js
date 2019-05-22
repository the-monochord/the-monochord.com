const hoverClass = 'hover-available'

export default container => {
  let lastTouchTime = 0

  const enableHover = () => {
    if (new Date() - lastTouchTime >= 500) {
      container.classList.add(hoverClass)
    }
  }

  const disableHover = () => {
    lastTouchTime = new Date()
    container.classList.remove(hoverClass)
  }

  document.addEventListener('touchstart', disableHover, true)
  document.addEventListener('mousemove', enableHover, true)

  enableHover()
}
