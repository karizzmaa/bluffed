import { useRef } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from 'framer-motion'
import logoLight from '../assets/logo.png'
import logoDark from '../assets/logo-dark.png'

const REPO = 'https://github.com/karizzmaa/bluffed'

// animation variants
const item: Variants = {
  hide: (i: number) => ({
    opacity: 0,
    scale: 0.82,
    y: i % 2 ? 46 : -46,
    filter: 'blur(10px)',
    transition: { delay: i * 0.06, duration: 0.5, ease: 'easeInOut' },
  }),
  show: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      delay: 0.1 + i * 0.09,
      type: 'spring',
      stiffness: 140,
      damping: 18,
    },
  }),
}

function Logo() {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const spring = { stiffness: 140, damping: 14 }
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), spring)
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), spring)
  return (
    <motion.div
      className="logo-float"
      animate={{ y: [0, -7, 0] }}
      transition={{ repeat: Infinity, duration: 4.2, ease: 'easeInOut' }}
    >
      <motion.div
        className="logo-wrap"
        style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95, rotate: -2.5 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          mx.set((e.clientX - r.left) / r.width - 0.5)
          my.set((e.clientY - r.top) / r.height - 0.5)
        }}
        onMouseLeave={() => {
          mx.set(0)
          my.set(0)
        }}
      >
        <img
          className="logo-light"
          src={logoLight}
          alt="Bluffed"
          draggable={false}
        />
        <img
          className="logo-dark"
          src={logoDark}
          alt=""
          aria-hidden
          draggable={false}
        />
      </motion.div>
    </motion.div>
  )
}

type Props = {
  theme: 'light' | 'dark'
  day: number | null
  ready: boolean
  missing: boolean
  notice?: string
  onPlay: (x: number, y: number) => void
}

export default function Menu({ day, ready, missing, notice, onPlay }: Props) {
  const btn = useRef<HTMLButtonElement>(null)
  return (
    <motion.main
      className="screen menu"
      initial="hide"
      animate="show"
      exit="hide"
    >
      <motion.div custom={0} variants={item}>
        <Logo />
      </motion.div>

      <motion.div custom={1} variants={item} className="chip">
        {missing ? (
          'No bluffs yet'
        ) : day != null ? (
          <>
            Bluff <b>#{day}</b>
          </>
        ) : (
          <span className="skeleton" />
        )}
      </motion.div>

      <motion.p custom={2} variants={item} className="tagline">
        Six clues, two of them are lying. Guess the word and catch the liars.
      </motion.p>

      <motion.button
        ref={btn}
        custom={3}
        variants={item}
        className="play"
        disabled={!ready}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => {
          const r = btn.current!.getBoundingClientRect()
          onPlay(r.left + r.width / 2, r.top + r.height / 2)
        }}
      >
        Play
      </motion.button>

      {notice && (
        <motion.div custom={4} variants={item} className="warn" role="status">
          {notice}
        </motion.div>
      )}

      <motion.a
        custom={5}
        variants={item}
        className="icon-btn github"
        href={REPO}
        target="_blank"
        rel="noreferrer"
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.94 }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
        </svg>
        <span>GitHub</span>
      </motion.a>
    </motion.main>
  )
}
