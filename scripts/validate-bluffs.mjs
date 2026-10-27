import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('../bluffs/', import.meta.url).pathname
const errors = []
const seen = []

for (const year of readdirSync(root)) {
  for (const file of readdirSync(join(root, year))) {
    const m = file.match(/^(\d{1,2})\.(\d{1,2})\.json$/)
    const where = `${year}/${file}`
    if (!m) {
      errors.push(
        `${where}: file name must look like M.D.json (e.g. 10.26.json)`,
      )
      continue
    }
    let p
    try {
      p = JSON.parse(readFileSync(join(root, year, file), 'utf8'))
    } catch (e) {
      errors.push(`${where}: invalid JSON (${e.message})`)
      continue
    }
    const expected = `${year}-${String(m[1]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`
    if (p.date !== expected)
      errors.push(`${where}: "date" is ${p.date}, expected ${expected}`)
    if (!Number.isInteger(p.day))
      errors.push(`${where}: "day" must be an integer`)
    if (!p.topic || !p.answer)
      errors.push(`${where}: "topic" and "answer" are required`)
    if (!Array.isArray(p.clues) || p.clues.length !== 6)
      errors.push(`${where}: needs exactly 6 clues`)
    else {
      const lies = p.clues.filter((c) => c.isLie).length
      if (lies !== 2)
        errors.push(`${where}: needs exactly 2 lies (found ${lies})`)
      p.clues.forEach((c, i) => {
        if (c.id !== i + 1 || !c.text || typeof c.isLie !== 'boolean')
          errors.push(`${where}: clue #${i + 1} is malformed (ids must be 1-6)`)
      })
    }
    seen.push({ date: expected, day: p.day, where })
  }
}
seen.sort((a, b) => a.date.localeCompare(b.date))
seen.forEach((s, i) => {
  if (i && s.day <= seen[i - 1].day)
    errors.push(`${s.where}: "day" must increase with the date`)
})

if (errors.length) {
  console.error(
    'Bluff validation failed:\n' + errors.map((e) => '  - ' + e).join('\n'),
  )
  process.exit(1)
}
console.log(`${seen.length} bluffs ok`)
