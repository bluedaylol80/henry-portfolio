import { useEffect, useRef, type ReactNode } from 'react'
import { registerSection } from '../lib/scroll'

/**
 * Wraps every content section: renders <section id> and feeds
 * scrollState.sections[id] (0→1 viewport progress) for the 3D scene.
 */
export default function SectionShell({
  id,
  className = '',
  children,
}: {
  id: string
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!ref.current) return
    return registerSection(id, ref.current)
  }, [id])

  return (
    <section id={id} ref={ref} className={`relative ${className}`}>
      {children}
    </section>
  )
}
