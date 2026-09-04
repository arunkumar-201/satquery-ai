import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { t } from '../utils/translations'

const passwordRequirements = [
  { label: 'Min 8 characters', regex: /.{8,}/ },
  { label: 'Uppercase letter', regex: /[A-Z]/ },
  { label: 'Lowercase letter', regex: /[a-z]/ },
  { label: 'Number', regex: /[0-9]/ },
  { label: 'Special character', regex: /[!@#$%^&*]/ },
]

export default function Register() {
  const { register } = useAuth()
  const { language } = useLanguage()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validatePassword = (password) => {
    return passwordRequirements.map(req => ({
      ...req,
      valid: req.regex.test(password),
    }))
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError(t('register.passwordMismatch', language))
      return
    }

    const passwordChecks = validatePassword(formData.password)
    if (!passwordChecks.every(req => req.valid)) {
      setError(t('register.weakPassword', language))
      return
    }

    setLoading(true)
    try {
      await register(
                      formData.username,
                      formData.email,
                      formData.password,
                      formData.confirmPassword
                    )
      setSuccess(true)
      setTimeout(() => navigate('/login?registered=true'), 2000)
    } catch (err) {
      setError(err.message || t('register.error', language))
    } finally {
      setLoading(false)
    }
  }

  const passwordChecks = validatePassword(formData.password)

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

        {/* Register Form */}
        <div className="bg-space-900/50 backdrop-blur-xl border border-space-700 rounded-2xl p-8">
          {success ? (
            <div className="text-center py-8 animate-in">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-accent-emerald/20 mb-4">
                <CheckCircle className="h-8 w-8 text-accent-emerald" aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl font-semibold text-space-100 mb-2">
                {t('register.success', language)}
              </h2>
              <p className="text-space-500 text-sm">
                {t('register.redirecting', language)}
              </p>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-semibold text-space-100 mb-2">
                {t('register.title', language)}
              </h2>
              <p className="text-space-500 text-sm mb-6">
                {t('register.subtitle', language)}
              </p>

              {error && (
                <div className="mb-6 p-3 bg-accent-rose/10 border border-accent-rose/20 rounded-lg flex items-center gap-2 text-accent-rose text-sm animate-in">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-space-300 mb-1.5">
                    {t('register.username', language)}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-space-500" aria-hidden="true" />
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      className="input pl-10 pr-4 py-2.5"
                      placeholder="johndoe"
                      autoComplete="username"
                      required
                      aria-required="true"
                      disabled={loading}
                      minLength={3}
                      maxLength={30}
                    />
                  </div>
                  <p className="text-xs text-space-600 mt-1">{t('register.usernameHint', language)}</p>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-space-300 mb-1.5">
                    {t('register.email', language)}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-space-500" aria-hidden="true" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
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
                    {t('register.password', language)}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-space-500" aria-hidden="true" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      className="input pl-10 pr-12 py-2.5"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                      aria-required="true"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-space-500 hover:text-space-100"
                      aria-label={showPassword ? t('register.hidePassword', language) : t('register.showPassword', language)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Password Requirements */}
                  <div className="mt-2 space-y-1" role="list" aria-label="Password requirements">
                    {passwordRequirements.map((req) => {
                      const check = passwordChecks.find(c => c.label === req.label)
                      return (
                        <div key={req.label} className="flex items-center gap-2 text-xs">
                          <span className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                            check?.valid ? 'border-accent-emerald bg-accent-emerald/20' : 'border-space-600'
                          }`}>
                            {check?.valid && <CheckCircle className="h-3 w-3 text-accent-emerald" aria-hidden="true" />}
                          </span>
                          <span className={`${check?.valid ? 'text-accent-emerald' : 'text-space-500'}`}>
                            {t(`register.${req.label.toLowerCase().replace(/\s+/g, '')}`, language) || req.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-space-300 mb-1.5">
                    {t('register.confirmPassword', language)}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-space-500" aria-hidden="true" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
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
                      aria-label={showConfirmPassword ? t('register.hidePassword', language) : t('register.showPassword', language)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-accent-rose mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" aria-hidden="true" />
                      {t('register.passwordMismatch', language)}
                    </p>
                  )}
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    className="checkbox mt-0.5"
                  />
                  <label htmlFor="terms" className="text-sm text-space-400">
                    {t('register.agreeTerms', language)}
                    <a href="/terms" className="text-accent-cyan hover:underline ml-1">{t('register.termsOfService', language)}</a>
                    {' '}{t('register.and', language)}{' '}
                    <a href="/privacy" className="text-accent-cyan hover:underline">{t('register.privacyPolicy', language)}</a>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary justify-center gap-2 py-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      {t('register.creatingAccount', language)}
                    </>
                  ) : (
                    t('register.createAccount', language)
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-space-500 text-sm">
                  {t('register.hasAccount', language)}
                  <button
                    onClick={() => navigate('/login')}
                    className="ml-1 text-accent-cyan hover:underline font-medium"
                  >
                    {t('register.signIn', language)}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}