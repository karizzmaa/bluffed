import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Menu from './components/Menu'
import Game from './components/Game'
import { resolvePuzzle, type Puzzle } from './lib/puzzles'

type Theme = 'light' | 'dark'
type Ripple = { x: number; y: number; id: number }

export default function App() {
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.dataset.theme as Theme) || 'light',
  )
  const [screen, setScreen] = useState<'menu' | 'game'>('menu')
  const [resolution] = useState(() => resolvePuzzle())
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [ripple, setRipple] = useState<Ripple | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('bluffed:theme', theme)
    } catch {}
  }, [theme])

  useEffect(() => {
    resolution?.entry.load().then(setPuzzle)
  }, [resolution])

  const play = (x: number, y: number) => {
    if (!puzzle) return
    setRipple({ x, y, id: Date.now() })
    setScreen('game')
  }
  const reach = (Math.max(window.innerWidth, window.innerHeight) * 2.4) / 40

  return (
    <>
      <motion.button
        className="icon-btn theme-toggle"
        aria-label="Toggle dark mode"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.9, rotate: 25 }}
      >
        <motion.svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ rotate: theme === 'dark' ? 360 : 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        >
          {theme === 'dark' ? (
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          ) : (
            <>
              <circle cx="12" cy="12" r="4.2" />
              <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
            </>
          )}
        </motion.svg>
      </motion.button>

      <AnimatePresence mode="wait">
        {screen === 'menu' ? (
          <Menu
            key="menu"
            theme={theme}
            day={puzzle?.day ?? null}
            ready={!!puzzle}
            missing={!resolution}
            notice={resolution?.notice}
            onPlay={play}
          />
        ) : (
          puzzle &&
          resolution && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <Game
                puzzle={puzzle}
                storageKey={resolution.entry.key}
                notice={resolution.notice}
                onExit={() => setScreen('menu')}
              />
            </motion.div>
          )
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ripple && (
          <motion.div
            key={ripple.id}
            className="ripple"
            style={{ left: ripple.x, top: ripple.y }}
            initial={{ scale: 0, opacity: 0.55 }}
            animate={{ scale: reach, opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 0.7, 0.2, 1] }}
            onAnimationComplete={() => setRipple(null)}
          />
        )}
        {ripple && (
          <motion.div
            key={ripple.id + 'b'}
            className="ripple ring"
            style={{ left: ripple.x, top: ripple.y }}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: reach * 0.8, opacity: 0 }}
            transition={{
              duration: 1.3,
              delay: 0.12,
              ease: [0.22, 0.7, 0.2, 1],
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
