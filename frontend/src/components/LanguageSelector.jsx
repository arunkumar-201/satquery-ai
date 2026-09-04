import { useLanguage } from '../context/LanguageContext'
import { Globe, ChevronDown, Check } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function LanguageSelector({ variant = 'dropdown', className = '' }) {
  const { language, setLanguage, languages, currentLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (variant === 'compact') {
    return (
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className={`input py-1.5 px-3 pr-8 appearance-none bg-space-800/50 ${className}`}
        aria-label="Select language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.nativeName}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-3 py-2 bg-space-800/50 border border-space-600 rounded-lg text-sm font-medium text-space-100 hover:border-accent-cyan/50 focus:outline-none focus:ring-2 focus:ring-accent-cyan/20 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Current language: ${currentLanguage.nativeName}`}
      >
        <Globe className="h-4 w-4 text-space-400" aria-hidden="true" />
        <span className="flex-1 text-left">{currentLanguage.flag}</span>
        <span className="flex-1 text-left">{currentLanguage.nativeName}</span>
        <ChevronDown className={`h-4 w-4 text-space-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-space-900 border border-space-700 rounded-lg shadow-xl py-1 z-50 animate-in" role="listbox" aria-label="Select language">
          {languages.map((lang) => (
            <li key={lang.code} role="option" aria-selected={lang.code === language}>
              <button
                onClick={() => { setLanguage(lang.code); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                  lang.code === language
                    ? 'bg-accent-cyan/10 text-accent-cyan'
                    : 'text-space-300 hover:bg-space-800 hover:text-space-100'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1">{lang.nativeName}</span>
                {lang.code === language && <Check className="h-4 w-4 text-accent-cyan flex-shrink-0" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}