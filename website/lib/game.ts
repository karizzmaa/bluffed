import type { Puzzle } from './puzzles'

export type Move = { kind: 'clue' | 'word'; value: string; ok: boolean }
export type Save = { moves: Move[]; startedAt: number; endedAt?: number }
export type Status = 'playing' | 'won' | 'lost'

export const MAX_GUESSES = 4

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/^(the|a|an)\s+/, '')
    .replace(/[^a-z0-9]/g, '')

export const isCorrect = (p: Puzzle, guess: string) =>
  [p.answer, ...(p.aliases ?? [])].some((a) => norm(a) === norm(guess))

export function derive(p: Puzzle, save: Save) {
  const wrong = save.moves.filter((m) => !m.ok).length
  const clueMoves = save.moves.filter((m) => m.kind === 'clue')
  const marks = new Map<number, 'lie' | 'truth'>()
  clueMoves.forEach((m) => marks.set(+m.value, m.ok ? 'lie' : 'truth'))
  const lies = clueMoves.filter((m) => m.ok).length
  const totalLies = p.clues.filter((c) => c.isLie).length
  const foundWord = save.moves.some((m) => m.kind === 'word' && m.ok)
  const status: Status =
    foundWord && lies >= totalLies
      ? 'won'
      : wrong >= MAX_GUESSES
        ? 'lost'
        : 'playing'
  return {
    wrong,
    right: save.moves.length - wrong,
    marks,
    lies,
    totalLies,
    foundWord,
    status,
    left: MAX_GUESSES - wrong,
  }
}

export const formatTime = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export const shareText = (p: Puzzle, save: Save, status: Status) =>
  `Bluffed #${p.day} ${status === 'won' ? '✅' : '❌'} ${formatTime((save.endedAt ?? Date.now()) - save.startedAt)}\n` +
  save.moves.map((m) => (m.ok ? '🟩' : '🟥')).join('')

const k = (key: string) => `bluffed:v1:${key}`
export function loadSave(key: string): Save {
  try {
    const raw = localStorage.getItem(k(key))
    if (raw) return JSON.parse(raw) as Save
  } catch {}
  return { moves: [], startedAt: Date.now() }
}
export function persist(key: string, save: Save) {
  try {
    localStorage.setItem(k(key), JSON.stringify(save))
  } catch {}
}
