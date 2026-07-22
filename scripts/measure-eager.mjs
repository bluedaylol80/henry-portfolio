/**
 * Eager-set budget probe (v21 P1 gate, SDD §5). Parses dist/index.html and sums
 * the gzipped size of the EAGER download set = module <script src> +
 * <link rel="modulepreload" href>. This is the set the browser must fetch before
 * first interaction; gsap must NOT appear here (it lives behind the lazy route
 * boundary). Reports per-file gz + raw and the total so the PoC can prove the
 * budget did not regress from the v20 baseline (136.9KB gz).
 *
 * Usage: node scripts/measure-eager.mjs [distDir]
 */
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const dist = process.argv[2] ?? 'dist'
const html = readFileSync(join(dist, 'index.html'), 'utf8')

const refs = new Set()
// Module scripts: <script ... type="module" ... src="...">
for (const tag of html.match(/<script\b[^>]*>/g) ?? []) {
  if (!/type="module"/.test(tag)) continue
  const src = tag.match(/\bsrc="([^"]+)"/)
  if (src) refs.add(src[1])
}
// Preloaded modules: <link rel="modulepreload" href="...">
for (const tag of html.match(/<link\b[^>]*>/g) ?? []) {
  if (!/rel="modulepreload"/.test(tag)) continue
  const href = tag.match(/\bhref="([^"]+)"/)
  if (href) refs.add(href[1])
}

const toRel = (p) => p.replace(/^\/henry-portfolio\//, '').replace(/^\//, '')

let total = 0
const rows = []
for (const ref of refs) {
  const rel = toRel(ref)
  const buf = readFileSync(join(dist, rel))
  const gz = gzipSync(buf).length
  total += gz
  rows.push({ rel, raw: buf.length, gz })
}
rows.sort((a, b) => b.gz - a.gz)

// The load-bearing check: is a gsap-named chunk in the EAGER set? (filename, not
// a substring inside index.js — the lazy import map references the chunk name.)
const gsapInEager = rows.some((r) => /gsap/i.test(r.rel))

console.log('EAGER SET (script + modulepreload):')
for (const r of rows) {
  console.log(`  ${(r.gz / 1024).toFixed(2)} KB gz  (${(r.raw / 1024).toFixed(1)} KB raw)  ${r.rel}`)
}

// Stylesheet is NOT part of the script+modulepreload budget — shown for context.
for (const tag of html.match(/<link\b[^>]*>/g) ?? []) {
  if (!/rel="stylesheet"/.test(tag)) continue
  const href = tag.match(/\bhref="([^"]+)"/)
  if (!href) continue
  const buf = readFileSync(join(dist, toRel(href[1])))
  console.log(`  [css, not in budget] ${(gzipSync(buf).length / 1024).toFixed(2)} KB gz  ${toRel(href[1])}`)
}

console.log('')
console.log(`  files=${rows.length}  gsap-chunk-in-eager=${gsapInEager}`)
console.log(`  EAGER TOTAL (script+modulepreload) = ${total} bytes = ${(total / 1024).toFixed(2)} KB gz`)
