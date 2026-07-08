import { useT } from '../lib/i18n'
import { contact, footer } from '../content/profile'

/**
 * Slim site footer: copyright + tagline on the left, mini contact links and the
 * build credit on the right. Wraps to a column on small screens.
 */
export default function Footer() {
  const t = useT()

  return (
    <footer className="relative z-10 border-t border-white/5">
      <div className="container-std flex flex-col items-start gap-6 py-10 text-sm text-ink-mute sm:flex-row sm:items-center sm:justify-between">
        <p className="break-keep">
          © 2026 Henry Lim — <span className="text-ink-dim">{t(footer.tagline)}</span>
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
          <div className="flex items-center gap-5">
            <a
              href={`mailto:${contact.email}`}
              className="transition-colors duration-200 hover:text-ink"
              aria-label={contact.email}
            >
              Email
            </a>
            <a
              href={contact.instagram}
              target="_blank"
              rel="noreferrer"
              className="transition-colors duration-200 hover:text-ink"
              aria-label={t(contact.instagramLabel)}
            >
              Instagram
            </a>
            <a
              href={contact.calendly}
              target="_blank"
              rel="noreferrer"
              className="transition-colors duration-200 hover:text-ink"
              aria-label={t(contact.calendlyLabel)}
            >
              Calendly
            </a>
          </div>
          <span className="text-ink-mute/70">
            {t(footer.credit)} · {t(footer.music)}
          </span>
        </div>
      </div>
    </footer>
  )
}
