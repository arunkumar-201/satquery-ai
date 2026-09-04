import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { t } from '../utils/translations'

export default function ForgotPassword() {
  const { forgotPassword, resetPassword } = useAuth()
  const { language } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [step, setStep] = useState(token ? 'reset' : 'request')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRequest = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err.message || t('forgot.error', language))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError(t('forgot.invalidToken', language))
      return
    }

    if (password !== confirmPassword) {
      setError(t('forgot.passwordMismatch', language))
      return
    }

    if (password.length < 8) {
      setError(t('forgot.weakPassword', language))
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => navigate('/login?reset=true'), 2000)
    } catch (err) {
      setError(err.message || t('forgot.resetError', language))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-space-950 px-4 py-8">
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

        {/* Form Card */}
        <div className="bg-space-900/50 backdrop-blur-xl border border-space-700 rounded-2xl p-8">
          {step === 'request' && !success ? (
            <>
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={() => navigate('/login')}
                  className="p-2 text-space-500 hover:text-space-100 rounded-lg hover:bg-space-800"
                  aria-label="Back to login"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="font-display text-xl font-semibold text-space-100">
                  {t('forgot.title', language)}
                </h2>
              </div>
              <p className="text-space-500 text-sm mb-6">
                {t('forgot.subtitle', language)}
              </p>

              {error && (
                <div className="mb-6 p-3 bg-accent-rose/10 border border-accent-rose/20 rounded-lg flex items-center gap-2 text-accent-rose text-sm animate-in">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-space-300 mb-1.5">
                    {t('forgot.email', language)}
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary justify-center gap-2 py-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      {t('forgot.sending', language)}
                    </>
                  ) : (
                    t('forgot.sendLink', language)
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-space-500 text-sm">
                  {t('forgot.rememberPassword', language)}
                  <button
                    onClick={() => navigate('/login')}
                    className="ml-1 text-accent-cyan hover:underline font-medium"
                  >
                    {t('forgot.backToLogin', language)}
                  </button>
                </p>
              </div>
            </>
          ) : step === 'reset' && !success ? (
            <>
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={() => navigate('/login')}
                  className="p-2 text-space-500 hover:text-space-100 rounded-lg hover:bg-space-800"
                  aria-label="Back to login"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="font-display text-xl font-semibold text-space-100">
                  {t('forgot.resetTitle', language)}
                </h2>
              </div>
              <p className="text-space-500 text-sm mb-6">
                {t('forgot.resetSubtitle', language)}
              </p>

              {error && (
                <div className="mb-6 p-3 bg-accent-rose/10 border border-accent-rose/20 rounded-lg flex items-center gap-2 text-accent-rose text-sm animate-in">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-space-300 mb-1.5">
                    {t('forgot.newPassword', language)}
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
                      autoComplete="new-password"
                      required
                      aria-required="true"
                      disabled={loading}
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-space-500 hover:text-space-100"
                      aria-label={showPassword ? t('forgot.hidePassword', language) : t('forgot.showPassword', language)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-space-300 mb-1.5">
                    {t('forgot.confirmPassword', language)}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-space-500" aria-hidden="true" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input pl-10 pr-12 py-2.5"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                      aria-required="true"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-space-500 hover:text-space-100"
                      aria-label={showConfirmPassword ? t('forgot.hidePassword', language) : t('forgot.showPassword', language)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-accent-rose mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" aria-hidden="true" />
                      {t('forgot.passwordMismatch', language)}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary justify-center gap-2 py-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      {t('forgot.resetting', language)}
                    </>
                  ) : (
                    t('forgot.resetPassword', language)
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8 animate-in">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-accent-emerald/20 mb-4">
                <CheckCircle className="h-8 w-8 text-accent-emerald" aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl font-semibold text-space-100 mb-2">
                {step === 'request' ? t('forgot.emailSent', language) : t('forgot.passwordReset', language)}
              </h2>
              <p className="text-space-500 text-sm mb-6">
                {step === 'request'
                  ? t('forgot.checkEmail', language)
                  : t('forgot.redirectingLogin', language)}
              </p>
              {step === 'request' && (
                <button
                  onClick={() => navigate('/login')}
                  className="btn-secondary justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('forgot.backToLogin', language)}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}