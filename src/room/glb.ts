import { createElement, useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'

/**
 * GLB loading + normalisation helper (SPEC §23.1).
 *
 * The owner produced 10 clean furniture images; they were converted to
 * draco-compressed GLBs in `public/models/*.glb`. Every converted model has an
 * ARBITRARY scale, origin and orientation (and is vertex-coloured — no texture
 * maps). This helper makes a GLB drop-in-placeable exactly like our procedural
 * groups:
 *   1. clone the cached scene (the drei cache is shared → never mutate it),
 *   2. compute its Box3, uniform-scale so the requested dim (`height` OR `width`)
 *      hits the target size in world units,
 *   3. recentre so the footprint centre sits on the local origin and the model
 *      bottom rests at y=0 (so a parent placed at floor level y0 sits ON the
 *      floor — no floating, §23.5),
 *   4. apply the visually-found `rotY` (the converted facing is arbitrary — every
 *      per-item rotY in the object modules was found by screenshot iteration).
 *   5. enable cast/receiveShadow on every mesh so the GLBs ground like the
 *      procedural props under the full-tier shadow map + ContactShadows.
 *
 * The returned group is memoised on (url,target,rotY) so we don't re-normalise
 * each render. `useGLTF.preload(...)` is called at module scope by each consumer
 * so the ≈2MB payload fetches in parallel (§23.5).
 */
export interface NormalizeOpts {
  /** target world height (mutually exclusive with width; one is required). */
  height?: number
  /** target world width (x-extent). */
  width?: number
  /** Y rotation in radians applied AFTER normalisation (found visually). */
  rotY?: number
  /** Corrective X pre-rotation (radians) BAKED before Box3 normalisation, so a
   *  GLB whose rest pose leans off-vertical is levelled first and STILL grounds
   *  (bottom → y0) on its corrected pose (§23.4-fix v15fix). Found visually. */
  preRotX?: number
  /** Corrective Z pre-rotation (radians), same pre-normalisation timing. */
  preRotZ?: number
  /** Corrective Y pre-rotation (radians), same pre-normalisation timing — lets a
   *  GLB be re-yawed BEFORE the footprint-centre recentring, so an off-axis part
   *  (e.g. a facing panel) squares up to world axes before `rotY` faces it into
   *  the room (§23.6-calib). Found visually. */
  preRotY?: number
}

/* ───────────────────────────────────────────────────────────────────────────
 * §23.6 — systematic per-model baked-lean calibration (2026-07-11)
 *
 * The furniture GLBs were TripoSR-reconstructed from 3/4-view photos, so each
 * inherits the PHOTO's camera pitch as a baked lean (the object is not plumb in
 * its own rest frame). Phase-1 calibration (scripts/calib/): each GLB was loaded
 * in three.js, its baked tilt measured by (a) PCA of the vertex covariance and
 * (b) a least-squares plane fit to the bottom-slab (feet) vertices, then a
 * candidate preRot was rendered through THIS exact normalisation path and the
 * silhouette checked plumb against a ground/vertical reference grid. Values were
 * finalised by the in-room Phase-3 checklist (plumb / grounded / facing).
 *
 *   slug       preRotX  preRotZ  preRotY   rotY(facing)     baked lean found
 *   ────────── ───────  ───────  ───────   ───────────────  ─────────────────
 *   bookshelf   +0.26     0         0       −π/2             ~15° fwd pitch (kept)
 *   server      +0.30     0         0       −π/2+0.35        ~18° fwd pitch (side)
 *   desk        +0.16    −0.06      0       π+0.55           ~16° pitch + slt roll
 *   chair       +0.05    +0.22      0       +π/2             ~13° roll + 6° pitch
 *   sofa         0       −0.19      0        0 (seat→−Z)     ~11° roll (feet unlevel)
 *   plant       +0.05     0         0        0               pot ~plumb (leaves splay)
 *   guitar      +0.05    −0.02      0       −0.6             ~8° (near plumb) +0.12 wall-lean
 *   coffee       0         0        0        0               base ~level (mug malformed)
 *   speaker     REVERTED to pre-v15 procedural — the GLB reads as a wooden
 *               cabinet with a separate box on top (TripoSR malformed); no
 *               rotation makes it read as a hi-fi speaker (§23.3 fallback).
 * ─────────────────────────────────────────────────────────────────────────── */

export function useNormalizedGltf(url: string, opts: NormalizeOpts): THREE.Group {
  const { scene } = useGLTF(url)
  const { height, width, rotY = 0, preRotX = 0, preRotZ = 0, preRotY = 0 } = opts

  return useMemo(() => {
    // Clone so we never mutate drei's shared cache (this GLB may be re-normalised
    // on a hot reload / remount). SkeletonUtils not needed — furniture is static.
    const cloned = scene.clone(true)

    // Enable shadows on every mesh (§23.1) so the GLBs ground like the procedural
    // props under the full-tier shadow map.
    cloned.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })

    // Corrective pre-rotation (§23.4-fix): some converted GLBs have a rest pose
    // that leans off-vertical (baked into the mesh). Rotate the cloned scene
    // FIRST, inside a wrapper `root`, so the Box3 below measures the LEVELLED
    // pose — the bottom then rests flush on the floor and verticals are plumb.
    const root = new THREE.Group()
    cloned.rotation.set(preRotX, preRotY, preRotZ)
    root.add(cloned)

    // Measure the raw model, then uniform-scale so the chosen dim hits target.
    const box = new THREE.Box3().setFromObject(root)
    const size = new THREE.Vector3()
    box.getSize(size)
    let scale = 1
    if (typeof height === 'number' && size.y > 1e-6) scale = height / size.y
    else if (typeof width === 'number' && size.x > 1e-6) scale = width / size.x
    root.scale.setScalar(scale)

    // Re-measure at the new scale to recentre precisely (bottom → y0, footprint
    // centre → origin). Scaling first then re-boxing avoids compounding rounding.
    const box2 = new THREE.Box3().setFromObject(root)
    const centre = new THREE.Vector3()
    box2.getCenter(centre)
    root.position.x -= centre.x
    root.position.z -= centre.z
    root.position.y -= box2.min.y // rest bottom on the floor plane

    // Wrap in an outer group that carries the visually-found facing rotation, so
    // the caller can place the group at a world slot and trust y0 == floor.
    const wrap = new THREE.Group()
    wrap.add(root)
    wrap.rotation.y = rotY
    // Name carries the model slug (e.g. "glb:bookshelf") so layout tooling can
    // find each furniture unit in the scene graph (harmless in prod).
    wrap.name = 'glb:' + (url.split('/').pop() ?? url).replace(/\.glb$/, '')
    return wrap
  }, [scene, url, height, width, rotY, preRotX, preRotZ, preRotY])
}

/** BASE_URL-prefixed model URL for GitHub Pages (§23.1); never root-absolute. */
export function modelUrl(slug: string): string {
  return import.meta.env.BASE_URL + 'models/' + slug + '.glb'
}

/**
 * Thin renderer for a normalised GLB (§23.1). Consumers wrap it in
 * `<Suspense fallback={null}>` (useGLTF suspends). Written with createElement so
 * this stays a plain `.ts` module (no JSX). Any extra props (position, etc.) are
 * forwarded to the <primitive> so callers can offset/rotate the whole thing.
 */
export function GlbModel({
  slug,
  height,
  width,
  rotY,
  preRotX,
  preRotZ,
  preRotY,
  ...rest
}: NormalizeOpts & { slug: string } & Record<string, unknown>) {
  const obj = useNormalizedGltf(modelUrl(slug), { height, width, rotY, preRotX, preRotZ, preRotY })
  return createElement('primitive', { object: obj, ...rest })
}
