import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import SectionShell from '../components/SectionShell'
import { useLang, useT } from '../lib/i18n'
import { hero } from '../content/profile'
import { heroLink } from '../content/room'
import { onReady } from '../lib/appState'
import { prefersReducedMotion } from '../lib/quality'
import { EASE, DUR } from '../lib/motion'

const INTRO_TARGETS = [
  '.hero-eyebrow',
  '.hero-line',
  '.hero-sub',
  '.hero-room',
  '.hero-name',
  '.hero-quote',
  '.hero-cue',
]

export default function Hero() {
  const t = useT()
  const { lang } = useLang()
  const rootRef = useRef<HTMLDivElement>(null)
  const parallaxRef = useRef<HTMLDivElement>(null)

  const [line1, line2] = t(hero.title).split('\n')
  const [quote1, quote2] = t(hero.quote).split('\n')

  // Language-aware hero sizing: KO lines are short (4~2 glyphs) so they can run
  // much bigger; EN lines are long ("The Evolution") so use a gentler curve.
  const titleSize =
    lang === 'ko'
      ? 'text-[clamp(4.5rem,17vw,10rem)]'
      : 'text-[clamp(2.75rem,11.5vw,8.5rem)]'

  const { contextSafe } = useGSAP(
    () => {
      const reduce = prefersReducedMotion()
      if (reduce) {
        gsap.set(INTRO_TARGETS, { autoAlpha: 1, y: 0, yPercent: 0 })
        return
      }

      // Hidden initial states (set pre-paint; preloader also covers the flash).
      gsap.set('.hero-eyebrow', { autoAlpha: 0, y: 18 })
      gsap.set('.hero-line', { yPercent: 115 })
      gsap.set(['.hero-sub', '.hero-room', '.hero-name'], { autoAlpha: 0, y: 24 })
      gsap.set(['.hero-quote', '.hero-cue'], { autoAlpha: 0, y: 18 })

      // Scroll-cue light beam travelling down the hairline.
      gsap.fromTo(
        '.cue-travel',
        { yPercent: -100 },
        { yPercent: 260, duration: 1.7, ease: 'power1.inOut', repeat: -1 },
      )

      // Subtle parallax: the whole text block drifts up as the hero leaves.
      gsap.to(parallaxRef.current, {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom top', scrub: true },
      })

      // Fade the scroll cue once the user has scrolled a little.
      ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top top-=120',
        onEnter: () =>
          gsap.to('.hero-cue', { autoAlpha: 0, duration: 0.4, ease: EASE.out, overwrite: 'auto' }),
        onLeaveBack: () =>
          gsap.to('.hero-cue', { autoAlpha: 1, duration: 0.4, ease: EASE.out, overwrite: 'auto' }),
      })
    },
    { scope: rootRef },
  )

  // Intro master timeline plays after the preloader hands off via onReady().
  useEffect(() => {
    const play = contextSafe(() => {
      if (prefersReducedMotion()) {
        gsap.set(INTRO_TARGETS, { autoAlpha: 1, y: 0, yPercent: 0 })
        return
      }
      const tl = gsap.timeline({ defaults: { ease: EASE.out } })
      tl.to('.hero-eyebrow', { autoAlpha: 1, y: 0, duration: DUR.m })
        .to('.hero-line', { yPercent: 0, duration: 1.05, stagger: 0.12, ease: EASE.expo }, '-=0.45')
        .to('.hero-sub', { autoAlpha: 1, y: 0, duration: DUR.m }, '-=0.7')
        .to('.hero-room', { autoAlpha: 1, y: 0, duration: DUR.m }, '-=0.55')
        .to('.hero-name', { autoAlpha: 1, y: 0, duration: 0.8 }, '-=0.6')
        .to('.hero-quote', { autoAlpha: 1, y: 0, duration: 0.85 }, '-=0.5')
        .to('.hero-cue', { autoAlpha: 1, y: 0, duration: 0.85 }, '-=0.55')
    })
    return onReady(play)
  }, [contextSafe])

  return (
    <SectionShell id="hero" className="min-h-[100svh] overflow-hidden">
      <div ref={rootRef} className="relative min-h-[100svh]">
        <div ref={parallaxRef} className="container-std flex min-h-[100svh] flex-col pb-24 pt-32 md:pb-28">
          <div className="flex flex-1 flex-col justify-center">
            <p className="hero-eyebrow eyebrow">{t(hero.eyebrow)}</p>

            <h1 className={`mt-6 break-keep font-display ${titleSize} font-bold leading-[0.95] tracking-tight md:mt-8`}>
              <span className="block overflow-hidden pb-[0.06em]">
                <span className="hero-line block">{line1}</span>
              </span>
              <span className="block overflow-hidden pb-[0.06em]">
                <span className="hero-line block text-gradient">{line2}</span>
              </span>
            </h1>

            <p className="hero-sub mt-7 max-w-xl break-keep text-xl text-ink-dim md:mt-9 md:text-2xl">
              {t(hero.subtitle)}
            </p>

            <Link
              to="/room"
              data-cursor
              className="hero-room mt-5 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-dim transition-colors duration-200 hover:text-era-sky"
            >
              {t(heroLink)}
            </Link>

            <div className="hero-name mt-8">
              <span className="glass inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm text-ink-dim">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-era-amber opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-era-amber" />
                </span>
                {t(hero.name)}
              </span>
            </div>
          </div>

          <blockquote className="hero-quote mt-14 max-w-md border-l-2 border-era-amber pl-4 text-sm italic text-ink-mute md:text-base">
            <span className="block break-keep">{quote1}</span>
            <span className="block break-keep">{quote2}</span>
          </blockquote>
        </div>

        <div className="hero-cue pointer-events-none absolute inset-x-0 bottom-5 flex flex-col items-center gap-3 text-ink-mute">
          <span className="font-display text-[0.6rem] uppercase tracking-[0.4em]">{t(hero.scrollCue)}</span>
          <span className="relative block h-12 w-px overflow-hidden bg-white/10">
            <span className="cue-travel absolute inset-x-0 top-0 block h-1/2 bg-gradient-to-b from-transparent via-era-amber to-transparent" />
          </span>
        </div>
      </div>
    </SectionShell>
  )
}
