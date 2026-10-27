export type Clue = { id: number; text: string; isLie: boolean }
export type Puzzle = {
  day: number
  date: string
  topic: string
  clues: Clue[]
  answer: string
  aliases?: string[]
}
export type Entry = { key: string; time: number; load: () => Promise<Puzzle> }
export type Resolution = { entry: Entry; notice?: string }

export const OUTRAGEOUS_DAYS = 60
const DAY = 86_400_000

const modules = import.meta.glob<{ default: Puzzle }>(
  '../../../bluffs/*/*.json',
)

export const entries: Entry[] = Object.entries(modules)
  .flatMap(([path, loader]) => {
    const m = path.match(/(\d{4})\/(\d{1,2})\.(\d{1,2})\.json$/)
    if (!m) return []
    const [y, mo, d] = [+m[1], +m[2], +m[3]]
    return [
      {
        key: `${y}-${mo}-${d}`,
        time: Date.UTC(y, mo - 1, d),
        load: () => loader().then((x) => x.default),
      },
    ]
  })
  .sort((a, b) => a.time - b.time)

export function resolvePuzzle(now = new Date()): Resolution | null {
  if (!entries.length) return null
  const t = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const exact = entries.find((e) => e.time === t)
  if (exact) return { entry: exact }
  const first = entries[0]
  const last = entries[entries.length - 1]
  if (t < first.time || t > last.time + OUTRAGEOUS_DAYS * DAY)
    return { entry: last }
  const label = now.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  })
  return {
    entry: entries[Math.floor(Math.random() * entries.length)],
    notice: `No Bluff has been published for ${label} yet, playing a random one instead.`,
  }
}
