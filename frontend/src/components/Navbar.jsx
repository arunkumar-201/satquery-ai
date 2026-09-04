import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { LayoutDashboard, History, Settings, LogOut, User, Menu, X, Globe, AlertTriangle, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const { language, setLanguage, languages, currentLanguage } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [aiStatus, setAiStatus] = useState(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Fetch AI provider status on mount
  useEffect(() => {
    const fetchAIStatus = async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (token) {
          const response = await fetch('/api/ai/status', {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (response.ok) {
            const data = await response.json()
            setAiStatus(data)
          }
        }
      } catch (error) {
        console.debug('Could not fetch AI status:', error)
      }
    }
    fetchAIStatus()
  }, [])

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/history', label: 'History', icon: History },
    { path: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-space-950/90 backdrop-blur-lg border-b border-space-700">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="flex items-center gap-2" aria-label="SATQUERY AI Home">
              <span className="text-2xl" role="img" aria-label="satellite">🛰️</span>
              <span className="font-display font-bold text-xl text-space-100">SATQUERY AI</span>
            </a>
            {/* Demo Mode Indicator */}
            {aiStatus && aiStatus.provider === 'demo' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-900/30 border border-amber-700/50 text-amber-300 text-xs font-medium animate-pulse" title="Running in Demo Mode - no external AI provider configured">
                <Zap className="h-3 w-3" aria-hidden="true" />
                <span>Demo Mode</span>
              </span>
            )}
            {aiStatus && aiStatus.provider !== 'demo' && aiStatus.configured === false && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-900/30 border border-rose-700/50 text-rose-300 text-xs font-medium" title="AI Provider not configured">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                <span>AI Not Configured</span>
              </span>
            )}
            {aiStatus && aiStatus.provider !== 'demo' && aiStatus.configured === true && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/30 border border-emerald-700/50 text-emerald-300 text-xs font-medium" title={`AI Provider: ${aiStatus.provider} (${aiStatus.model || 'unknown'})`}>
                <Zap className="h-3 w-3" aria-hidden="true" />
                <span>AI Active</span>
              </span>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            {isAuthenticated && (
              <>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path
                  const Icon = item.icon
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-accent-cyan/10 text-accent-cyan'
                          : 'text-space-400 hover:text-space-100 hover:bg-space-800'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {item.label}
                    </button>
                  )
                })}
              </>
            )}

            {/* Language Selector in Navbar */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-space-300 hover:text-space-100 hover:bg-space-800 transition-colors"
                aria-expanded={langMenuOpen}
                aria-haspopup="true"
                aria-label={`Current language: ${currentLanguage.nativeName}`}
              >
                <Globe className="h-4 w-4" aria-hidden="true" />
                <span>{currentLanguage.flag}</span>
                <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
              </button>

              {langMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setLangMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 w-40 bg-space-900 border border-space-700 rounded-lg shadow-xl py-1 z-50 animate-in">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => { setLanguage(lang.code); setLangMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                          lang.code === language
                            ? 'bg-accent-cyan/10 text-accent-cyan'
                            : 'text-space-300 hover:bg-space-800 hover:text-space-100'
                        }`}
                        aria-current={lang.code === language ? 'true' : 'false'}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* User Menu */}
            <div className="relative ml-4">
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-space-300 hover:text-space-100 hover:bg-space-800 transition-colors"
                aria-label="User menu"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline max-w-[120px] truncate">{user?.name}</span>
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="btn-ghost px-3 py-2 text-sm"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="btn-ghost p-2"
              aria-expanded={langMenuOpen}
              aria-label={`Language: ${currentLanguage.nativeName}`}
            >
              <Globe className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">{currentLanguage.nativeName}</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn-ghost p-2"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-space-700 animate-in">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                const Icon = item.icon
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-accent-cyan/10 text-accent-cyan'
                        : 'text-space-400 hover:text-space-100 hover:bg-space-800'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {item.label}
                  </button>
                )
              })}
              <hr className="border-space-700 my-2" />
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-space-400">
                <User className="h-5 w-5" aria-hidden="true" />
                <span>{user?.name}</span>
                <span className="text-space-600 mx-2">•</span>
                <span>{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-accent-rose hover:bg-accent-rose/10 transition-colors"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Language Menu Mobile */}
        {langMenuOpen && (
          <div className="md:hidden py-2 border-t border-space-700 animate-in">
            <div className="flex flex-col gap-1 px-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { setLanguage(lang.code); setLangMenuOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    lang.code === language
                      ? 'bg-accent-cyan/10 text-accent-cyan'
                      : 'text-space-300 hover:bg-space-800 hover:text-space-100'
                  }`}
                  aria-current={lang.code === language ? 'true' : 'false'}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}