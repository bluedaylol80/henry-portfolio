import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import type { SceneData } from './keyframes'
import { sceneState } from './sceneState'
import { COLOR_STOPS } from './util'

/**
 * The core particle field: a THREE.Points morphing through six keyframe
 * formations driven by `sceneState.phase`, with per-particle stagger,
 * organic wobble and a scroll-driven color story. Additive soft sprites.
 */

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPhase;
  uniform float uSize;
  uniform float uScale;
  uniform vec3 uColors[6];

  attribute vec3 aPos0;
  attribute vec3 aPos1;
  attribute vec3 aPos2;
  attribute vec3 aPos3;
  attribute vec3 aPos4;
  attribute vec3 aPos5;
  attribute float aSeed;

  varying vec3 vColor;

  vec3 posAt(int i) {
    if (i <= 0) return aPos0;
    if (i == 1) return aPos1;
    if (i == 2) return aPos2;
    if (i == 3) return aPos3;
    if (i == 4) return aPos4;
    return aPos5;
  }

  vec3 colAt(int i) {
    if (i <= 0) return uColors[0];
    if (i == 1) return uColors[1];
    if (i == 2) return uColors[2];
    if (i == 3) return uColors[3];
    if (i == 4) return uColors[4];
    return uColors[5];
  }

  void main() {
    float phase = clamp(uPhase, 0.0, 5.0);
    float idxf = floor(phase);
    int i0 = int(idxf);
    int i1 = i0 + 1;
    if (i1 > 5) i1 = 5;
    float f = phase - idxf;

    // per-particle stagger — delay start by up to 0.25, rescaled to still finish
    float st = aSeed * 0.25;
    float local = clamp((f - st) / (1.0 - st), 0.0, 1.0);
    local = local * local * (3.0 - 2.0 * local);

    vec3 p = mix(posAt(i0), posAt(i1), local);

    // organic time-based wobble
    float tw = 6.28318530718 * aSeed;
    p.x += sin(uTime * 0.6 + tw) * 0.06;
    p.y += cos(uTime * 0.5 + tw * 1.3) * 0.06;
    p.z += sin(uTime * 0.7 + tw * 0.7) * 0.06;

    // color story, ±10% per-particle brightness
    vec3 col = mix(colAt(i0), colAt(i1), f);
    col *= 0.9 + aSeed * 0.2;
    vColor = col;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * uScale * (0.7 + aSeed * 0.6) / max(-mv.z, 0.1);
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */ `
  varying vec3 vColor;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float a = 1.0 - smoothstep(0.0, 0.5, d);
    a = pow(a, 1.6);
    gl_FragColor = vec4(vColor, a * 0.85);
  }
`

const _size = new THREE.Vector2()

export default function ParticleField({ data }: { data: SceneData }) {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    // position doubles as aPos0 so the draw count / bounds are valid
    geo.setAttribute('position', new THREE.BufferAttribute(data.aPos[0], 3))
    for (let k = 0; k < 6; k++) {
      geo.setAttribute(`aPos${k}`, new THREE.BufferAttribute(data.aPos[k], 3))
    }
    geo.setAttribute('aSeed', new THREE.BufferAttribute(data.aSeed, 1))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 18)

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPhase: { value: 0 },
        uSize: { value: 0.045 },
        uScale: { value: 800 },
        uColors: {
          value: COLOR_STOPS.map((c) => new THREE.Vector3(c[0], c[1], c[2])),
        },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    })
    return { geometry: geo, material: mat }
  }, [data])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame(() => {
    if (document.hidden) return
    const u = material.uniforms
    u.uPhase.value = sceneState.phase
    u.uTime.value = sceneState.time
    // world-scaled point size: framebuffer height / (2 tan(fov/2))
    const h = gl.getDrawingBufferSize(_size).y
    const fov = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180
    u.uScale.value = h / (2 * Math.tan(fov / 2))
  })

  return <points geometry={geometry} material={material} frustumCulled={false} />
}
