"use client"

import * as React from "react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/lib/api"
import en from "./locales/en.json"
import fr from "./locales/fr.json"

type TranslationKeys = typeof fr
type Language = 'en' | 'fr'

interface I18nContextType {
  locale: Language
  setLocale: (l: Language) => void
  t: (keyPath: string) => string
}

const translations: Record<Language, any> = { en, fr }

const I18nContext = React.createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = React.useState<Language>('fr')
  const { getToken, isLoaded } = useAuth()

  // Load locale from localStorage or DB on mount
  React.useEffect(() => {
    const loadLocale = async () => {
      let saved = localStorage.getItem('whappi_locale') as Language

      if (isLoaded) {
        try {
          const token = await getToken()
          if (token) {
            const profileReq = await api.users.getProfile(token)
            const profile = await profileReq.json()
            if (profile?.data?.language && (profile.data.language === 'en' || profile.data.language === 'fr')) {
              saved = profile.data.language as Language
            }
          }
        } catch (error) {
          console.error("Failed to fetch user language preference", error)
        }
      }

      if (saved && (saved === 'en' || saved === 'fr')) {
        setLocale(saved)
        localStorage.setItem('whappi_locale', saved)
      } else {
        const browserLang = navigator.language.split('-')[0]
        if (browserLang === 'en') {
          setLocale('en')
          localStorage.setItem('whappi_locale', 'en')
        }
      }
    }

    loadLocale()
  }, [isLoaded, getToken])

  const handleSetLocale = async (l: Language) => {
    setLocale(l)
    localStorage.setItem('whappi_locale', l)

    if (isLoaded) {
      try {
        const token = await getToken()
        if (token) {
          await api.users.updateProfile({ language: l }, token)
        }
      } catch (error) {
        console.error("Failed to update language preference in backend", error)
      }
    }
  }

  const t = (keyPath: string): string => {
    const keys = keyPath.split('.')
    let current = translations[locale]

    for (const key of keys) {
      if (current[key] === undefined) {
        // Fallback to FR if key missing in current locale
        let fallback = translations['fr']
        for (const fKey of keys) {
          if (fallback[fKey] === undefined) return keyPath // Give up
          fallback = fallback[fKey]
        }
        return typeof fallback === 'string' ? fallback : keyPath
      }
      current = current[key]
    }

    return typeof current === 'string' ? current : keyPath
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = React.useContext(I18nContext)
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}
