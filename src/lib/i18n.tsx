import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'ko' | 'en'
export type Bi = { ko: string; en: string }

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: 'ko',
  setLang: () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem('henry.lang')
      return saved === 'en' || saved === 'ko' ? saved : 'ko'
    } catch {
      return 'ko'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('henry.lang', lang)
    } catch {
      /* private mode */
    }
    document.documentElement.lang = lang
  }, [lang])

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}

export function useT() {
  const { lang } = useLang()
  return (b: Bi) => b[lang]
}
