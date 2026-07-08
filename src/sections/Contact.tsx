import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import SectionShell from '../components/SectionShell'
import Whisper from '../components/Whisper'
import { useT } from '../lib/i18n'
import { prefersReducedMotion } from '../lib/quality'
import { DUR, EASE, STAGGER } from '../lib/motion'
import { contact } from '../content/profile'

function ArrowUpRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  )
}

export default function Contact() {
  const t = useT()
  const root = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | null>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contact.kakao)
    } catch {
      /* clipboard unavailable — still surface feedback */
    }
    setCopied(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 2000)
  }

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )

  useGSAP(
    () => {
      if (prefersReducedMotion()) return

      const tl = gsap.timeline({
        defaults: { ease: EASE.out },
        scrollTrigger: { trigger: root.current, start: 'top 72%', once: true },
      })

      tl.from('[data-eyebrow]', { autoAlpha: 0, y: 20, duration: DUR.m })
        .from('[data-title-line]', { yPercent: 115, duration: DUR.l }, '-=0.45')
        .from('[data-lede]', { autoAlpha: 0, y: 20, duration: DUR.m }, '-=0.8')
        .from('[data-email]', { autoAlpha: 0, y: 20, duration: DUR.m }, '-=0.65')
        .from(
          '[data-actions] > *',
          { autoAlpha: 0, y: 20, duration: DUR.s, stagger: STAGGER },
          '-=0.55',
        )
        .from('[data-whisper]', { autoAlpha: 0, y: 20, duration: DUR.m }, '-=0.35')
        .from('[data-note]', { autoAlpha: 0, y: 16, duration: DUR.s }, '-=0.5')
    },
    { scope: root },
  )

  return (
    <SectionShell id="contact" className="flex min-h-[90svh] items-center py-24 md:py-32">
      <div ref={root} className="container-std flex flex-col items-center text-center">
        <p data-eyebrow className="eyebrow">
          {t(contact.label)}
        </p>

        <h2 className="mt-6 max-w-5xl font-display text-[clamp(2.75rem,8vw,6.5rem)] font-bold leading-[1.02]">
          <span className="block overflow-hidden pb-[0.14em]">
            <span data-title-line className="text-gradient block break-keep">
              {t(contact.title)}
            </span>
          </span>
        </h2>

        <p
          data-lede
          className="mt-6 max-w-xl break-keep text-lg text-ink-dim md:text-xl"
        >
          {t(contact.lede)}
        </p>

        <a
          data-email
          data-cursor="true"
          href={`mailto:${contact.email}`}
          className="group relative mt-10 inline-block font-display text-xl font-medium text-ink transition-colors duration-300 hover:text-era-cyan md:mt-14 md:text-3xl"
        >
          {contact.email}
          <span
            aria-hidden="true"
            className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-era-cyan transition-transform duration-500 ease-lux group-hover:scale-x-100"
          />
        </a>

        <div
          data-actions
          className="mt-12 flex flex-wrap items-center justify-center gap-4 md:mt-16"
        >
          <a
            href={contact.calendly}
            target="_blank"
            rel="noreferrer"
            className="btn-island glass glow-cyan group py-1.5 pl-6 pr-1.5 text-sm font-semibold text-ink hover:border-era-cyan/40 md:text-base"
          >
            {t(contact.calendlyLabel)}
            <span aria-hidden className="btn-island-icon text-era-cyan">
              <ArrowUpRight />
            </span>
          </a>

          <a
            href={contact.instagram}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full border border-white/15 px-6 py-3.5 text-sm font-medium text-ink-dim transition-all duration-300 hover:-translate-y-0.5 hover:border-white/35 hover:text-ink md:text-base"
          >
            {t(contact.instagramLabel)}
          </a>

          <a
            href={contact.notion}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-medium text-ink-dim transition-all duration-300 hover:-translate-y-0.5 hover:border-white/35 hover:text-ink md:text-base"
          >
            {t(contact.notionLabel)}
            <ArrowUpRight />
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center rounded-full border border-white/15 px-6 py-3.5 text-sm font-medium text-ink-dim transition-all duration-300 hover:-translate-y-0.5 hover:border-white/35 hover:text-ink md:text-base"
          >
            <span aria-live="polite" className={copied ? 'text-era-cyan' : undefined}>
              {copied ? t(contact.copied) : t(contact.kakaoLabel)}
            </span>
          </button>
        </div>

        <div data-whisper className="mt-12 w-full md:mt-14">
          <Whisper />
        </div>

        <p data-note className="mt-10 text-sm text-ink-mute">
          {t(contact.note)}
        </p>
      </div>
    </SectionShell>
  )
}
