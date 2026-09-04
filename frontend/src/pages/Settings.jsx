import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, Lock, Bell, Globe, Palette, Save, Loader2, CheckCircle, AlertCircle, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { authService } from '../services/authService'
import { t } from '../utils/translations'
import LanguageSelector from '../components/LanguageSelector'

export default function Settings() {
  const { user, logout } = useAuth()
  const { language, setLanguage } = useLanguage()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Form states
  const [profile, setProfile] = useState({
    name: '',
    email: '',
  })
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    analysisComplete: true,
    weeklyDigest: false,
  })
  const [appearance, setAppearance] = useState({
    theme: 'dark',
    compactMode: false,
  })

  const tabs = [
    { id: 'profile', label: t('settings.profile', language), icon: User },
    { id: 'security', label: t('settings.security', language), icon: Lock },
    { id: 'notifications', label: t('settings.notifications', language), icon: Bell },
    { id: 'appearance', label: t('settings.appearance', language), icon: Palette },
    { id: 'language', label: t('settings.language', language), icon: Globe },
  ]

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || '', email: user.email || '' })
    }
  }, [user])

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!profile.name.trim()) {
      setError(t('settings.nameRequired', language))
      return
    }
    if (!validateEmail(profile.email)) {
      setError(t('settings.invalidEmail', language))
      return
    }

    setLoading(true)
    try {
      await authService.updateProfile({ name: profile.name, email: profile.email })
      setSuccess(t('settings.profileSaved', language))
    } catch (err) {
      setError(err.message || t('settings.saveError', language))
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!password.current) {
      setError(t('settings.currentPasswordRequired', language))
      return
    }
    if (password.new.length < 8) {
      setError(t('settings.passwordTooShort', language))
      return
    }
    if (password.new !== password.confirm) {
      setError(t('settings.passwordsMismatch', language))
      return
    }

    setLoading(true)
    try {
      await authService.changePassword({ current_password: password.current, new_password: password.new })
      setPassword({ current: '', new: '', confirm: '' })
      setSuccess(t('settings.passwordChanged', language))
    } catch (err) {
      setError(err.message || t('settings.passwordError', language))
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationsSave = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await authService.updateNotifications(notifications)
      setSuccess(t('settings.notificationsSaved', language))
    } catch (err) {
      setError(err.message || t('settings.saveError', language))
    } finally {
      setLoading(false)
    }
  }

  const handleAppearanceSave = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await authService.updateAppearance(appearance)
      setSuccess(t('settings.appearanceSaved', language))
    } catch (err) {
      setError(err.message || t('settings.saveError', language))
    } finally {
      setLoading(false)
    }
  }

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    setSuccess(t('settings.languageChanged', language))
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  return (
    <div className="flex-1 p-6 lg:ml-64 pt-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="btn-ghost p-2" aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold text-space-100">{t('settings.title', language)}</h1>
              <p className="text-space-500 text-sm">{t('settings.subtitle', language)}</p>
            </div>
          </div>
          <LanguageSelector variant="compact" />
        </div>

        {/* Tabs */}
        <div className="bg-space-900/50 backdrop-blur-xl border border-space-700 rounded-xl overflow-hidden">
          <div className="border-b border-space-700 p-1">
            <nav className="flex flex-wrap gap-1" role="tablist" aria-label="Settings sections">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); clearMessages(); }}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.id}`}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-accent-cyan/10 text-accent-cyan'
                        : 'text-space-400 hover:text-space-100 hover:bg-space-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Panels */}
          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSave} id="panel-profile" role="tabpanel" aria-labelledby="tab-profile" className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-accent-cyan/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-10 w-10 text-accent-cyan" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-space-100">{t('settings.profileTitle', language)}</h2>
                    <p className="text-space-500 text-sm">{t('settings.profileDesc', language)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-space-300 mb-2">{t('settings.name', language)}</label>
                    <input
                      type="text"
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="input"
                      placeholder={t('settings.namePlaceholder', language)}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-space-300 mb-2">{t('settings.email', language)}</label>
                    <input
                      type="email"
                      id="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="input"
                      placeholder={t('settings.emailPlaceholder', language)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-space-700">
                  <button type="submit" disabled={loading} className="btn-primary gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {t('settings.save', language)}
                  </button>
                </div>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <form onSubmit={handlePasswordSave} id="panel-security" role="tabpanel" aria-labelledby="tab-security" className="space-y-6">
                <div>
                  <h2 className="font-display text-lg font-semibold text-space-100 mb-1">{t('settings.changePassword', language)}</h2>
                  <p className="text-space-500 text-sm">{t('settings.changePasswordDesc', language)}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-space-300 mb-2">{t('settings.currentPassword', language)}</label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={password.current}
                      onChange={(e) => setPassword({ ...password, current: e.target.value })}
                      className="input"
                      placeholder={t('settings.currentPasswordPlaceholder', language)}
                    />
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-space-300 mb-2">{t('settings.newPassword', language)}</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={password.new}
                      onChange={(e) => setPassword({ ...password, new: e.target.value })}
                      className="input"
                      placeholder={t('settings.newPasswordPlaceholder', language)}
                    />
                    <p className="text-xs text-space-600 mt-1">{t('settings.passwordHint', language)}</p>
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-space-300 mb-2">{t('settings.confirmPassword', language)}</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={password.confirm}
                      onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                      className="input"
                      placeholder={t('settings.confirmPasswordPlaceholder', language)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-space-700">
                  <button type="submit" disabled={loading} className="btn-primary gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    {t('settings.updatePassword', language)}
                  </button>
                </div>
              </form>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <form onSubmit={(e) => { e.preventDefault(); handleNotificationsSave(); }} id="panel-notifications" role="tabpanel" aria-labelledby="tab-notifications" className="space-y-6">
                <div>
                  <h2 className="font-display text-lg font-semibold text-space-100 mb-1">{t('settings.notificationPreferences', language)}</h2>
                  <p className="text-space-500 text-sm">{t('settings.notificationDesc', language)}</p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'email', label: t('settings.emailNotifications', language), desc: t('settings.emailNotificationsDesc', language) },
                    { key: 'push', label: t('settings.pushNotifications', language), desc: t('settings.pushNotificationsDesc', language) },
                    { key: 'analysisComplete', label: t('settings.analysisComplete', language), desc: t('settings.analysisCompleteDesc', language) },
                    { key: 'weeklyDigest', label: t('settings.weeklyDigest', language), desc: t('settings.weeklyDigestDesc', language) },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-space-800/50 border border-space-700 rounded-xl">
                      <div className="flex-1">
                        <p className="font-medium text-space-100">{item.label}</p>
                        <p className="text-sm text-space-500">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[item.key]}
                          onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-space-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-cyan/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-cyan"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-space-700">
                  <button type="submit" disabled={loading} className="btn-primary gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {t('settings.save', language)}
                  </button>
                </div>
              </form>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <form onSubmit={(e) => { e.preventDefault(); handleAppearanceSave(); }} id="panel-appearance" role="tabpanel" aria-labelledby="tab-appearance" className="space-y-6">
                <div>
                  <h2 className="font-display text-lg font-semibold text-space-100 mb-1">{t('settings.appearanceTitle', language)}</h2>
                  <p className="text-space-500 text-sm">{t('settings.appearanceDesc', language)}</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-space-300 mb-3">{t('settings.theme', language)}</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['dark', 'light', 'system'].map((theme) => (
                        <button
                          key={theme}
                          type="button"
                          onClick={() => setAppearance({ ...appearance, theme })}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            appearance.theme === theme
                              ? 'border-accent-cyan bg-accent-cyan/10'
                              : 'border-space-700 hover:border-space-600'
                          }`}
                        >
                          <div className={`w-full h-12 rounded-lg ${theme === 'dark' ? 'bg-space-900 border border-space-700' : theme === 'light' ? 'bg-white border border-gray-200' : 'bg-gradient-to-r from-space-900 to-white border border-space-700'}`} aria-hidden="true" />
                          <p className="text-center mt-2 capitalize text-space-100">{theme}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-space-800/50 border border-space-700 rounded-xl">
                    <div>
                      <p className="font-medium text-space-100">{t('settings.compactMode', language)}</p>
                      <p className="text-sm text-space-500">{t('settings.compactModeDesc', language)}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appearance.compactMode}
                        onChange={(e) => setAppearance({ ...appearance, compactMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-space-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-cyan/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-cyan"></div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-space-700">
                  <button type="submit" disabled={loading} className="btn-primary gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {t('settings.save', language)}
                  </button>
                </div>
              </form>
            )}

            {/* Language Tab */}
            {activeTab === 'language' && (
              <div id="panel-language" role="tabpanel" aria-labelledby="tab-language" className="space-y-6">
                <div>
                  <h2 className="font-display text-lg font-semibold text-space-100 mb-1">{t('settings.languageTitle', language)}</h2>
                  <p className="text-space-500 text-sm">{t('settings.languageDesc', language)}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
                    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
                    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        language === lang.code
                          ? 'border-accent-cyan bg-accent-cyan/10'
                          : 'border-space-700 hover:border-space-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl" aria-hidden="true">{lang.flag}</span>
                        <div>
                          <p className="font-medium text-space-100">{lang.name}</p>
                          <p className="text-sm text-space-500">{lang.nativeName}</p>
                        </div>
                      </div>
                      {language === lang.code && (
                        <CheckCircle className="h-5 w-5 text-accent-cyan ml-auto" aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-space-800/50 border border-space-700 rounded-xl">
                  <p className="text-sm text-space-400">{t('settings.languageNote', language)}</p>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            <div className="pt-6 border-t border-space-700">
              <h2 className="font-display text-lg font-semibold text-accent-rose mb-4">{t('settings.dangerZone', language)}</h2>
              <div className="p-4 bg-accent-rose/5 border border-accent-rose/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-accent-rose">{t('settings.logoutTitle', language)}</p>
                    <p className="text-sm text-space-500">{t('settings.logoutDesc', language)}</p>
                  </div>
                  <button onClick={handleLogout} className="btn-ghost gap-2 text-accent-rose hover:bg-accent-rose/10" disabled={loading}>
                    <LogOut className="h-4 w-4" /> {t('settings.logout', language)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toast Messages */}
        {(success || error) && (
          <div className={`fixed bottom-6 right-6 z-50 animate-slide-in p-4 rounded-xl shadow-lg flex items-center gap-3 max-w-md ${success ? 'bg-accent-emerald/90 border border-accent-emerald' : 'bg-accent-rose/90 border border-accent-rose'}`}>
            {success ? <CheckCircle className="h-5 w-5 text-white" /> : <AlertCircle className="h-5 w-5 text-white" />}
            <span className="text-white text-sm">{success || error}</span>
            <button onClick={clearMessages} className="ml-2 text-white/70 hover:text-white">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}