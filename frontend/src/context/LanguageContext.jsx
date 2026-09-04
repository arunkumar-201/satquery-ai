import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext(null)

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
]

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('satquery_language') || 'en'
  })

  useEffect(() => {
    localStorage.setItem('satquery_language', language)
  }, [language])

  const currentLanguage = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]

  const value = {
    language,
    setLanguage,
    currentLanguage,
    languages: LANGUAGES,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}