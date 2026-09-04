import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Mic, MicOff, Loader2, Image, Trash2, RotateCcw, Copy, Download, Flag, Zap, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { chatService } from '../services/chatService'
import { imageService } from '../services/imageService'
import { projectService } from '../services/projectService'
import { t } from '../utils/translations'
import ImagePreview from '../components/ImagePreview'
import LanguageSelector from '../components/LanguageSelector'
import TypingIndicator from '../components/TypingIndicator'

export default function Analysis() {
  const { projectId } = useParams()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { language } = useLanguage()
  const navigate = useNavigate()

  const initialImageId = searchParams.get('image')
  const initialProjectId = searchParams.get('project') || projectId

  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [images, setImages] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedImages, setSelectedImages] = useState(initialImageId ? [initialImageId] : [])
  const [selectedProject, setSelectedProject] = useState(initialProjectId || '')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const [aiStatus, setAiStatus] = useState(null)

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

  const fetchData = async () => {
    try {
      const projectsRes = await projectService.list()
      setProjects(projectsRes)

      if (initialProjectId) {
        setSelectedProject(initialProjectId)
      } else if (projectsRes.length > 0) {
        setSelectedProject(String(projectsRes[0].id))
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectImages = async (projectId) => {
    try {
      const projectImages = await imageService.list(projectId)
      setImages(projectImages || [])
    } catch (error) {
      console.error('Failed to fetch project images:', error)
      setImages([])
    }
  }

  const createSession = async () => {
    if (!selectedProject) return
    try {
      const res = await chatService.createSession(selectedProject, language)
      setSession(res)
      setMessages([])
    } catch (error) {
      console.error('Failed to create session:', error)
      setError(t('analysis.sessionError', language))
    }
  }

  const loadSession = async (sessionId) => {
    if (sessionId === 'new') return
    try {
      const res = await chatService.getSession(sessionId)
      setSession(res)
      setMessages((res.messages || []).map(message => ({ ...message, content: message.message })))
      if (res.project_id) setSelectedProject(res.project_id)
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  }

  useEffect(() => {
    fetchData()
    if (initialProjectId) {
      fetchProjectImages(initialProjectId)
    }
  }, [])

  useEffect(() => {
    if (selectedProject && !session) {
      createSession()
    }
    if (selectedProject) {
      fetchProjectImages(selectedProject)
    }
  }, [selectedProject])

  useEffect(() => {
    if (projectId && projectId !== 'new') {
      loadSession(projectId)
    }
  }, [projectId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || sending || !session) return
    if (selectedImages.length === 0) {
      setError('Please select at least one satellite image before starting analysis.')
      return
    }

    const userMessage = { role: 'user', content: input, language }
    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setSending(true)
    setError('')

    try {
      const res = await chatService.query(selectedProject, selectedImages.map(Number), currentInput, language)
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer, evidence: res.evidence, analysis_type: res.analysis_type, confidence: res.confidence }])
    } catch (error) {
      console.error('Failed to send query:', error)
      setError(error.message || t('analysis.queryError', language))
      setMessages(prev => [...prev.slice(0, -1)])
    } finally {
      setSending(false)
    }
  }

  const handleNewSession = () => {
    setSession(null)
    setMessages([])
    setSelectedImages([])
    navigate('/analysis/new')
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 lg:ml-64 pt-20">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 bg-space-800/50 rounded-lg animate-pulse mb-6" />
          <div className="h-[500px] bg-space-800/50 rounded-xl animate-pulse border border-space-700" />
        </div>
      </div>
    )
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
              <h1 className="font-display text-2xl font-bold text-space-100">{t('analysis.title', language)}</h1>
              <p className="text-space-500 text-sm">{t('analysis.subtitle', language)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector variant="compact" />
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
            <button onClick={handleNewSession} className="btn-secondary gap-2">
              <RotateCcw className="h-4 w-4" /> {t('analysis.newChat', language)}
            </button>
          </div>
        </div>

        {/* Context Selection */}
        <div className="bg-space-900/50 backdrop-blur-xl border border-space-700 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-space-300 mb-2">{t('analysis.selectProject', language)}</label>
              <select
                value={selectedProject}
                onChange={(e) => { setSelectedProject(e.target.value); createSession(); }}
                className="input"
                disabled={sending}
              >
                <option value="">{t('analysis.selectProjectPlaceholder', language)}</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-space-300 mb-2">{t('analysis.selectImages', language)} (Max 2)</label>
              <select
                value={selectedImages.map(String)}
                onChange={(e) => {
                  const vals = Array.from(e.target.selectedOptions, option => option.value)
                  if (vals.length <= 2) setSelectedImages(vals)
                }}
                className="input"
                multiple
                disabled={sending}
              >
                {selectedProject && images.length === 0 && (
                  <option disabled value="">No satellite images available. Upload an image to this project first.</option>
                )}
                {images.map(img => <option key={img.id} value={img.id}>{img.filename} ({img.modality})</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <p className="text-sm text-space-500">{selectedImages.length}/2 {t('analysis.imagesSelected', language)}</p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="bg-space-900/50 backdrop-blur-xl border border-space-700 rounded-xl overflow-hidden flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite" aria-label="Chat messages">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-space-500">
                <Image className="h-16 w-16 mb-4 opacity-50" aria-hidden="true" />
                <h2 className="font-display text-lg font-semibold text-space-100 mb-2">{t('analysis.noMessages', language)}</h2>
                <p className="text-center max-w-md">{t('analysis.startConversation', language)}</p>
                {/* Demo Mode Indicator in empty state */}
                {aiStatus && aiStatus.provider === 'demo' && (
                  <div className="mt-6 p-4 rounded-xl bg-amber-900/20 border border-amber-700/30 text-center max-w-md">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-amber-400" aria-hidden="true" />
                      <span className="font-medium text-amber-300">{t('analysis.demoMode', language)}</span>
                    </div>
                    <p className="text-sm text-amber-400">{t('analysis.demoModeDesc', language)}</p>
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-accent-cyan/20' : 'bg-accent-emerald/20'}`}>
                    {msg.role === 'user' ? (
                      <svg className="h-4 w-4 text-accent-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-accent-emerald" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        <path d="M2 12h20" />
                      </svg>
                    )}
                  </div>
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-accent-cyan/20 text-space-100 rounded-tr-sm' : 'bg-space-800 text-space-100 rounded-tl-sm'}`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.evidence && (
                        <div className="mt-2 p-2 bg-space-700/50 rounded-lg text-xs text-space-400">
                          {t('analysis.evidence', language)}: {msg.analysis_type || 'ANALYSIS'}
                          {msg.confidence && <span className="ml-2">{t('analysis.confidence', language)}: {(msg.confidence * 100).toFixed(0)}%</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {sending && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-space-700 p-4">
            {error && (
              <div className="mb-3 p-2 bg-accent-rose/10 border border-accent-rose/20 rounded-lg text-accent-rose text-sm flex items-center gap-2">
                <Flag className="h-4 w-4" aria-hidden="true" />
                <span>{error}</span>
                <button onClick={() => setError('')} className="ml-auto text-space-500 hover:text-space-100">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
            <form onSubmit={handleSend} className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('analysis.placeholder', language)}
                  className="input pr-12 min-h-[48px] max-h-[120px] resize-none"
                  rows={1}
                  disabled={sending || !session || !selectedProject || (selectedProject && images.length === 0)}
                  aria-label={t('analysis.messageInput', language)}
                />
                <div className="absolute right-2 bottom-2 flex gap-1">
                  <button type="button" className="p-2 text-space-500 hover:text-accent-cyan" aria-label={t('analysis.attachImage', language)}>
                    <Image className="h-5 w-5" />
                  </button>
                  <button type="button" className="p-2 text-space-500 hover:text-accent-amber" aria-label={t('analysis.voiceInput', language)}>
                    <Mic className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={sending || !input.trim() || !session || selectedImages.length === 0}
                className="btn-primary p-3 h-12 flex-shrink-0"
                aria-label={t('analysis.send', language)}
              >
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </form>
            <p className="text-xs text-space-600 mt-2 text-center">{t('analysis.footer', language)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}