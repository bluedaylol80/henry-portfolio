/**
 * Layout measurement harness (§23.7 follow-up) — prints, for every GLB furniture
 * unit (named "glb:<slug>") and every hotspot group, the WORLD-space:
 *   - full Box3 of visible meshes (proxies/sprites excluded)
 *   - robust vertex extents (p02/p98 per axis) → the DENSE band, i.e. the real
 *     unit without TripoSR stray-fragment inflation.
 * Wall planes: left x=-2.4, back z=-2.4. Run with the dev server up:
 *   node scripts/measure-layout.mjs [url]
 */
import puppeteer from 'puppeteer-core'

const URL = process.argv[2] ?? 'http://localhost:5199/henry-portfolio/'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--force-device-scale-factor=1', '--use-angle=default'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 })
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 12000))

const report = await page.evaluate(() => {
  const scene = window.__scene
  if (!scene) return { error: 'no __scene hook' }
  scene.updateMatrixWorld(true)

  const measure = (root) => {
    const xs = [], ys = [], zs = []
    let box = null
    const v = new (root.position.constructor)() // THREE.Vector3 via any instance
    root.traverse((o) => {
      if (!o.isMesh || o.isSprite) return
      const mat = o.material
      if (mat && mat.colorWrite === false) return // hit proxy
      if (o.userData && o.userData.noPick) return // decorative glow sprites
      const geo = o.geometry
      if (!geo || !geo.attributes || !geo.attributes.position) return
      const pos = geo.attributes.position
      const step = Math.max(1, Math.floor(pos.count / 4000))
      for (let i = 0; i < pos.count; i += step) {
        v.set(pos.getX(i), pos.getY(i), pos.getZ(i))
        o.localToWorld(v)
        xs.push(v.x); ys.push(v.y); zs.push(v.z)
        if (!box) box = { min: { x: v.x, y: v.y, z: v.z }, max: { x: v.x, y: v.y, z: v.z } }
        else {
          box.min.x = Math.min(box.min.x, v.x); box.max.x = Math.max(box.max.x, v.x)
          box.min.y = Math.min(box.min.y, v.y); box.max.y = Math.max(box.max.y, v.y)
          box.min.z = Math.min(box.min.z, v.z); box.max.z = Math.max(box.max.z, v.z)
        }
      }
    })
    if (!xs.length) return null
    const pct = (arr, p) => {
      const s = [...arr].sort((a, b) => a - b)
      return s[Math.min(s.length - 1, Math.max(0, Math.floor(p * (s.length - 1))))]
    }
    const r3 = (n) => Math.round(n * 1000) / 1000
    return {
      box: {
        x: [r3(box.min.x), r3(box.max.x)],
        y: [r3(box.min.y), r3(box.max.y)],
        z: [r3(box.min.z), r3(box.max.z)],
      },
      dense: {
        x: [r3(pct(xs, 0.02)), r3(pct(xs, 0.98))],
        y: [r3(pct(ys, 0.02)), r3(pct(ys, 0.98))],
        z: [r3(pct(zs, 0.02)), r3(pct(zs, 0.98))],
      },
      verts: xs.length,
    }
  }

  const out = { glb: {}, hotspots: {} }
  scene.traverse((o) => {
    if (o.name && o.name.startsWith('glb:')) out.glb[o.name.slice(4)] = measure(o)
  })
  scene.traverse((o) => {
    if (o.name && o.name.startsWith('hotspot:')) out.hotspots[o.name.slice(8)] = measure(o)
  })
  return out
})

console.log(JSON.stringify(report, null, 1))
await browser.close()
