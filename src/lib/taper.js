/**
 * Line breaks that make a centred paragraph taper like an inverted triangle.
 *
 * Every line gets a target width on a straight slope from `from` down to `to`,
 * and a small dynamic program picks the breaks that track those targets best.
 * Lines that overshoot their target are penalised harder than short ones,
 * because a line wider than the one above it is what breaks the silhouette.
 *
 * @param {number[]} widths  measured width of each word, in px
 * @param {number} space     width of one space, in px
 * @param {{ from: number, to: number, max: number }} shape  top width, bottom width, hard cap
 * @returns {number[]} indices of the words that start a new line (never 0)
 */
export function taperBreaks(widths, space, { from, to, max }) {
  const n = widths.length
  if (n < 2) return []

  const prefix = [0]
  for (const w of widths) prefix.push(prefix[prefix.length - 1] + w)
  const lineWidth = (a, b) => prefix[b] - prefix[a] + (b - a - 1) * space

  // The line count whose average target width best matches the text's total length.
  const guess = Math.max(1, Math.round((2 * lineWidth(0, n)) / (from + to)))
  let best = null
  for (let k = Math.max(1, guess - 2); k <= Math.min(n, guess + 2); k++) {
    const result = solve(k)
    if (result && (!best || result.cost < best.cost)) best = result
  }
  return best ? best.breaks : []

  function solve(k) {
    const target = (line) => (k === 1 ? from : from + ((to - from) * line) / (k - 1))
    const cost = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(Infinity))
    const start = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(-1))
    cost[0][0] = 0

    for (let line = 1; line <= k; line++) {
      const t = target(line - 1)
      for (let i = line; i <= n; i++) {
        for (let j = line - 1; j < i; j++) {
          if (cost[line - 1][j] === Infinity) continue
          const w = lineWidth(j, i)
          if (w > max && i - j > 1) continue // only a single overlong word may exceed the cap
          const over = Math.max(0, w - t)
          const c = cost[line - 1][j] + (w - t) ** 2 + 3 * over ** 2
          if (c < cost[line][i]) {
            cost[line][i] = c
            start[line][i] = j
          }
        }
      }
    }

    if (cost[k][n] === Infinity) return null
    const breaks = []
    for (let line = k, i = n; line > 1; line--) {
      i = start[line][i]
      breaks.unshift(i)
    }
    return { cost: cost[k][n] / k, breaks }
  }
}
