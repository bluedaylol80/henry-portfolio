import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import SectionShell from '../components/SectionShell'
import { work } from '../content/profile'
import { useLang, useT } from '../lib/i18n'
import type { Stat } from '../content/types'
import { prefersReducedMotion } from '../lib/quality'
import { DUR, EASE, fadeUp, staggerContainer } from '../lib/motion'

/** Explicit bento span per item index (md+). Index 5 is a full-width banner. */
const SPAN: Record<number, string> = {
  0: 'md:col-span-4',
  1: 'md:col-span-2',
  2: 'md:col-span-2',
  3: 'md:col-span-2',
  4: 'md:col-span-2',
  5: 'md:col-span-6',
}

/** Format one localized Stat at a given (in-progress) numeric value. */
function formatStat(value: number, s: Stat): string {
  const decimals = s.decimals ?? 0
  const num = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return `${s.prefix ?? ''}${num}${s.suffix ?? ''}`
}

/**
 * Count-up number that:
 *  - animates 0 → value once when scrolled into view (top 80%),
 *  - snaps to the right precision + toLocaleString,
 *  - reformats to the current language's final value instantly on lang switch
 *    (no replay) once it has already counted.
 */
function StatCounter({
  statKo,
  statEn,
  className,
}: {
  statKo: Stat
  statEn: Stat
  className?: string
}) {
  const { lang } = useLang()
  const stat = lang === 'ko' ? statKo : statEn
  const elRef = useRef<HTMLSpanElement>(null)
  const [counted, setCounted] = useState(false)

  useGSAP(
    () => {
      const el = elRef.current
      if (!el) return
      const baked = stat // language captured at mount

      if (prefersReducedMotion()) {
        el.textContent = formatStat(baked.value, baked)
        setCounted(true)
        return
      }

      const decimals = baked.decimals ?? 0
      const proxy = { v: 0 }
      el.textContent = formatStat(0, baked)
      gsap.to(proxy, {
        v: baked.value,
        duration: 2,
        ease: EASE.out,
        snap: { v: decimals > 0 ? Math.pow(10, -decimals) : 1 },
        scrollTrigger: { trigger: el, start: 'top 80%', once: true },
        onUpdate: () => {
          el.textContent = formatStat(proxy.v, baked)
        },
        onComplete: () => {
          el.textContent = formatStat(baked.value, baked)
          setCounted(true)
        },
      })
    },
    { scope: elRef },
  )

  // Reformat the settled value to the current language without replaying.
  useEffect(() => {
    const el = elRef.current
    if (!el) return
    if (counted || prefersReducedMotion()) {
      el.textContent = formatStat(stat.value, stat)
    }
  }, [lang, counted, stat])

  return <span ref={elRef} className={className} />
}

export default function Achievements() {
  const t = useT()
  const headRef = useRef<HTMLDivElement>(null)
  const reduced = prefersReducedMotion()

  useGSAP(
    () => {
      const root = headRef.current
      if (!root) return
      const eyebrow = root.querySelector<HTMLElement>('[data-eyebrow]')
      const line = root.querySelector<HTMLElement>('[data-line]')
      const sub = root.querySelector<HTMLElement>('[data-sub]')
      if (!eyebrow || !line) return

      if (prefersReducedMotion()) {
        gsap.set(line, { yPercent: 0 })
        return
      }

      gsap.set(eyebrow, { opacity: 0, y: 14 })
      gsap.set(line, { yPercent: 110 })
      if (sub) gsap.set(sub, { opacity: 0, y: 20 })

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: 'top 75%', once: true },
      })
      tl.to(eyebrow, { opacity: 1, y: 0, duration: DUR.s, ease: EASE.out })
        .to(line, { yPercent: 0, duration: DUR.m, ease: EASE.out }, '-=0.15')
      if (sub) tl.to(sub, { opacity: 1, y: 0, duration: DUR.m, ease: EASE.out }, '-=0.6')
    },
    { scope: headRef },
  )

  return (
    <SectionShell id="work" className="section-pad">
      <div className="container-std">
        <div ref={headRef}>
          <p data-eyebrow className="eyebrow">
            {t(work.label)}
          </p>
          <h2 className="mt-5 font-display text-[clamp(2rem,5vw,3.75rem)] font-bold leading-[1.05] tracking-tight break-keep">
            <span className="block overflow-hidden pb-[0.1em]">
              <span data-line className="block">
                {t(work.title)}
              </span>
            </span>
          </h2>
          <p data-sub className="mt-5 max-w-xl text-base leading-relaxed text-ink-dim break-keep md:text-lg">
            {t(work.subtitle)}
          </p>
        </div>

        <motion.div
          className="mt-14 grid gap-4 md:mt-20 md:grid-cols-6 md:gap-5"
          variants={reduced ? undefined : staggerContainer}
          initial={reduced ? undefined : 'hidden'}
          whileInView={reduced ? undefined : 'show'}
          viewport={{ once: true, amount: 0.15 }}
        >
          {work.items.map((item, i) => {
            const isBanner = i === 5
            const statClass = `inline-block font-display font-bold leading-none tracking-tight tabular-nums text-[clamp(2.75rem,6vw,4.5rem)] ${
              item.emphasis ? 'text-gradient-cyan' : 'text-ink'
            }`
            // Flagship card (index 0) gets a cyan emphasis gradient + accent border.
            const surface =
              i === 0
                ? 'border-era-cyan/25 bg-gradient-to-br from-era-cyan/[0.10] via-white/[0.05] to-white/[0.03]'
                : 'border-white/10 bg-white/[0.04]'
            return (
              <motion.article
                key={item.tag + i}
                className={`group rounded-3xl border ${surface} p-7 backdrop-blur-md transition-[border-color,box-shadow] duration-300 hover:border-white/25 hover:shadow-[0_0_50px_-12px_rgba(139,92,246,0.45)] md:p-9 ${SPAN[i]} ${
                  isBanner
                    ? 'flex flex-col gap-6 md:flex-row md:items-center md:justify-between'
                    : 'flex min-h-[210px] flex-col justify-between md:min-h-[240px]'
                }`}
                variants={reduced ? undefined : fadeUp}
                whileHover={
                  reduced ? undefined : { y: -6, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }
                }
              >
                {isBanner ? (
                  <>
                    <div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="text-lg font-semibold text-ink break-keep md:text-xl">
                          {t(item.title)}
                        </h3>
                        <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">
                          {item.tag}
                        </span>
                      </div>
                      <div className="mt-3 text-sm font-medium text-ink-dim break-keep">{t(item.label)}</div>
                      <div className="mt-1 text-sm text-ink-mute break-keep">{t(item.sub)}</div>
                    </div>
                    <div className="shrink-0 md:pl-8 md:text-right">
                      <StatCounter statKo={item.stat.ko} statEn={item.stat.en} className={statClass} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-ink break-keep">{t(item.title)}</h3>
                      <span className="mt-1 shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">
                        {item.tag}
                      </span>
                    </div>

                    <div className="mt-8 md:mt-10">
                      <StatCounter statKo={item.stat.ko} statEn={item.stat.en} className={statClass} />
                      <div className="mt-3 text-sm font-medium text-ink-dim break-keep">{t(item.label)}</div>
                      <div className="mt-1 text-sm text-ink-mute break-keep">{t(item.sub)}</div>
                    </div>
                  </>
                )}
              </motion.article>
            )
          })}
        </motion.div>
      </div>
    </SectionShell>
  )
}
