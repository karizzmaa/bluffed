import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Puzzle } from '../lib/puzzles'
import {
  MAX_GUESSES,
  derive,
  formatTime,
  isCorrect,
  loadSave,
  norm,
  persist,
  shareText,
  type Move,
  type Save,
} from '../lib/game'

type Props = {
  puzzle: Puzzle
  storageKey: string
  notice?: string
  onExit: () => void
}

export default function Game({ puzzle, storageKey, notice, onExit }: Props) {
  const [save, setSave] = useState<Save>(() => loadSave(storageKey))
  const [now, setNow] = useState(Date.now())
  const [selected, setSelected] = useState<number | null>(null)
  const [shake, setShake] = useState<string | null>(null)
  const [pulse, setPulse] = useState(0)
  const [word, setWord] = useState('')
  const [modal, setModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const s = derive(puzzle, save)
  const done = s.status !== 'playing'
  const elapsed = (save.endedAt ?? now) - save.startedAt

  useEffect(() => persist(storageKey, save), [save, storageKey])
  useEffect(() => {
    if (done) return
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [done])
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setModal(true), 900)
    return () => clearTimeout(t)
  }, [done])

  const flash = (k: string) => {
    setShake(k)
    setTimeout(() => setShake(null), 550)
  }
  const play = (m: Move) => {
    const next: Save = { ...save, moves: [...save.moves, m] }
    if (derive(puzzle, next).status !== 'playing') next.endedAt = Date.now()
    setSave(next)
    if (!m.ok) setPulse((p) => p + 1)
  }

  const callLie = (id: number) => {
    if (done || s.marks.has(id)) return
    if (selected !== id) return setSelected(id)
    setSelected(null)
    const ok = puzzle.clues.find((c) => c.id === id)!.isLie
    if (!ok) flash('c' + id)
    play({ kind: 'clue', value: String(id), ok })
  }

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const v = word.trim()
    if (!v || done || s.foundWord) return
    if (save.moves.some((m) => m.kind === 'word' && norm(m.value) === norm(v)))
      return flash('word')
    const ok = isCorrect(puzzle, v)
    if (!ok) flash('word')
    setWord('')
    play({ kind: 'word', value: v, ok })
  }

  const view = (id: number, isLie: boolean) =>
    s.status === 'won' ? (isLie ? 'lie' : 'truth') : s.marks.get(id)
  const letters = puzzle.answer.split('')
  const showAnswer = s.foundWord || s.status === 'lost'

  return (
    <main className="game">
      {pulse > 0 && <div key={pulse} className="vignette" />}
      <button className="back" onClick={onExit}>
        ← Menu
      </button>

      <header className="game-head">
        <span className="eyebrow">Bluff #{puzzle.day} · Topic</span>
        <h1>{puzzle.topic}</h1>
        <div className="meta">
          <div className="lives" aria-label={`${s.left} guesses left`}>
            {Array.from({ length: MAX_GUESSES }, (_, i) => (
              <motion.span
                key={i}
                className={'life' + (i < s.left ? '' : ' spent')}
                animate={
                  i < s.left
                    ? { rotate: [-3, 3, -3] }
                    : { scale: [1.3, 1], rotate: 0 }
                }
                transition={
                  i < s.left
                    ? { repeat: Infinity, duration: 3, delay: i * 0.2 }
                    : { duration: 0.3 }
                }
              >
                {i < s.left ? '' : '✕'}
              </motion.span>
            ))}
          </div>
          <span className="timer">{formatTime(elapsed)}</span>
        </div>
      </header>

      {notice && (
        <div className="warn" role="status">
          {notice}
        </div>
      )}

      <section className={'word-card' + (shake === 'word' ? ' shake bad' : '')}>
        <span className="eyebrow">The word</span>
        {showAnswer ? (
          <div className="tiles">
            {letters.map((ch, i) =>
              ch === ' ' ? (
                <span key={i} className="gap" />
              ) : (
                <motion.span
                  key={i}
                  className={'tile' + (s.foundWord ? ' ok' : ' reveal')}
                  initial={{ rotateX: 90, opacity: 0 }}
                  animate={{ rotateX: 0, opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                >
                  {ch.toUpperCase()}
                </motion.span>
              ),
            )}
          </div>
        ) : (
          <form onSubmit={submit} className="guess-row">
            <input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Type your guess"
              disabled={done}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="Guess the word"
            />
            <button type="submit" disabled={!word.trim() || done}>
              Guess
            </button>
          </form>
        )}
      </section>

      <p className="hint">
        <b>{s.totalLies}</b> of these {puzzle.clues.length} clues are lies - tap
        a clue twice to call it out.
        <em>
          {' '}
          {s.lies}/{s.totalLies} found.
        </em>
      </p>

      <section className="clues">
        {puzzle.clues.map((c, i) => {
          const v = view(c.id, c.isLie)
          const cls = [
            'clue',
            v ?? '',
            selected === c.id ? 'selected' : '',
            shake === 'c' + c.id ? 'shake bad' : '',
          ].join(' ')
          return (
            <motion.button
              key={c.id}
              className={cls}
              onClick={() => callLie(c.id)}
              disabled={done || !!s.marks.has(c.id)}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.15 + i * 0.07,
                type: 'spring',
                stiffness: 160,
                damping: 18,
              }}
              whileHover={!done && !v ? { y: -3 } : undefined}
              whileTap={!done && !v ? { scale: 0.98 } : undefined}
            >
              <span className="num">{c.id}</span>
              <span className="text">{c.text}</span>
              <span className="tag">
                {v === 'lie'
                  ? 'LIE'
                  : v === 'truth'
                    ? 'TRUE'
                    : selected === c.id
                      ? 'Tap again'
                      : ''}
              </span>
            </motion.button>
          )
        })}
      </section>

      {save.moves.length > 0 && (
        <section className="history" aria-label="Guess history">
          {save.moves.map((m, i) => (
            <span key={i} className={'pill ' + (m.ok ? 'ok' : 'no')}>
              {m.ok ? '✓' : '✕'}{' '}
              {m.kind === 'clue' ? `Clue ${m.value}` : m.value}
            </span>
          ))}
        </section>
      )}

      {done && !modal && (
        <button className="link" onClick={() => setModal(true)}>
          View results
        </button>
      )}

      <AnimatePresence>
        {modal && (
          <motion.div
            className="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModal(false)}
          >
            {s.status === 'won' &&
              Array.from({ length: 18 }, (_, i) => (
                <span
                  key={i}
                  className="confetti"
                  style={{
                    ['--x' as string]: `${(i * 37) % 100}vw`,
                    ['--d' as string]: `${2.4 + (i % 5) * 0.35}s`,
                    ['--r' as string]: `${i * 47}deg`,
                    animationDelay: `${(i % 6) * 0.12}s`,
                  }}
                />
              ))}
            <motion.div
              className="modal"
              role="dialog"
              aria-modal
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="eyebrow">Bluff #{puzzle.day}</span>
              <h2>
                {s.status === 'won' ? 'Bluff busted!' : 'You got bluffed.'}
              </h2>
              <p className="answer">
                The word was <b>{puzzle.answer}</b>
              </p>
              <div className="stats">
                <div>
                  <b>{formatTime(elapsed)}</b>
                  <span>Time</span>
                </div>
                <div>
                  <b className="g">{s.right}</b>
                  <span>Right</span>
                </div>
                <div>
                  <b className="r">{s.wrong}</b>
                  <span>Wrong</span>
                </div>
                <div>
                  <b>
                    {save.moves.length
                      ? Math.round((s.right / save.moves.length) * 100)
                      : 0}
                    %
                  </b>
                  <span>Accuracy</span>
                </div>
              </div>
              <div className="trail">
                {save.moves.map((m, i) => (
                  <i key={i} className={m.ok ? 'ok' : 'no'} />
                ))}
              </div>
              {s.status === 'lost' && (
                <p className="sub">
                  The lies are still hidden, see if you can work out which ones
                  were fake.
                </p>
              )}
              <div className="actions">
                <button
                  className="secondary"
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText(shareText(puzzle, save, s.status))
                      .then(() => {
                        setCopied(true)
                        setTimeout(() => setCopied(false), 1600)
                      })
                  }}
                >
                  {copied ? 'Copied!' : 'Copy result'}
                </button>
                <button onClick={() => setModal(false)}>
                  {s.status === 'won' ? 'Nice' : 'Review clues'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
