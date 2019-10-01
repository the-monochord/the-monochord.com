const generateNEdo = n => {
  const pitches = []

  for (let i = 0; i <= 1200; i += 1200 / n) {
    pitches.push(i)
  }

  return pitches
}

export { generateNEdo }
