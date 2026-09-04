import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { t } from '../utils/translations'

export default function Login() {
  const { login } = useAuth()
  const { language } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || t('login.error', language))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-space-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-emerald flex items-center justify-center">
              <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 0 4 10 15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0-4-10 15.3 15.3 0 0 0 4-10z" />
              </svg>
            </div>
            <div className="text-left">
              <h1 className="font-display text-2xl font-bold text-space-100">SATQUERY AI</h1>
              <p className="text-space-500 text-sm">SIH 2026 - Remote Sensing Assistant</p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-space-900/50 backdrop-blur-xl border border-space-700 rounded-2xl p-8">
          <h2 className="font-display text-xl font-semibold text-space-100 mb-2">
            {t('login.title', language)}
          </h2>
          <p className="text-space-500 text-sm mb-6">
            {t('login.subtitle', language)}
          </p>

          {error && (
            <div className="mb-6 p-3 bg-accent-rose/10 border border-accent-rose/20 rounded-lg flex items-center gap-2 text-accent-rose text-sm animate-in">
              <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-space-300 mb-1.5">
                {t('login.email', language)}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-space-500" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10 pr-4 py-2.5"
                  placeholder="user@example.com"
                  autoComplete="email"
                  required
                  aria-required="true"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-space-300 mb-1.5">
                {t('login.password', language)}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-space-500" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-12 py-2.5"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-space-500 hover:text-space-100"
                  aria-label={showPassword ? t('login.hidePassword', language) : t('login.showPassword', language)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox"
                  aria-label="Remember me"
                />
                <span className="text-sm text-space-400">{t('login.rememberMe', language)}</span>
              </label>
              <a href="/forgot-password" className="text-sm text-accent-cyan hover:underline">
                {t('login.forgotPassword', language)}
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center gap-2 py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {t('login.signingIn', language)}
                </>
              ) : (
                t('login.signIn', language)
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-space-500 text-sm">
              {t('login.noAccount', language)}
              <button
                onClick={() => navigate('/register')}
                className="ml-1 text-accent-cyan hover:underline font-medium"
              >
                {t('login.register', language)}
              </button>
            </p>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="mt-6 text-center text-xs text-space-600">
          <p>{t('login.demoNotice', language)}</p>
        </div>
      </div>
    </div>
  )
}