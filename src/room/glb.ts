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
}

export function useNormalizedGltf(url: string, opts: NormalizeOpts): THREE.Group {
  const { scene } = useGLTF(url)
  const { height, width, rotY = 0, preRotX = 0, preRotZ = 0 } = opts

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
    cloned.rotation.set(preRotX, 0, preRotZ)
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
    return wrap
  }, [scene, height, width, rotY, preRotX, preRotZ])
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
  ...rest
}: NormalizeOpts & { slug: string } & Record<string, unknown>) {
  const obj = useNormalizedGltf(modelUrl(slug), { height, width, rotY, preRotX, preRotZ })
  return createElement('primitive', { object: obj, ...rest })
}
