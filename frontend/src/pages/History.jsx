import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Search, Filter, ChevronDown, MessageSquare, Download, Copy, Trash2, Calendar, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { chatService } from '../services/chatService'
import { t } from '../utils/translations'
import LanguageSelector from '../components/LanguageSelector'

export default function History() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const navigate = useNavigate()

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSession, setSelectedSession] = useState(null)
  const [showSessionModal, setShowSessionModal] = useState(false)

  const fetchSessions = async () => {
    try {
      const res = await chatService.listHistory()
      setSessions(res || [])
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getMessagePreview = (messages) => {
    if (!messages || messages.length === 0) return t('history.noMessages', language)
    const lastUserMsg = messages.slice().reverse().find(m => m.role === 'user')
    const message = lastUserMsg?.message || lastUserMsg?.content
    return message ? message.substring(0, 80) + (message.length > 80 ? '...' : '') : t('history.noMessages', language)
  }

  const handleOpenSession = (session) => {
    setSelectedSession(session)
    setShowSessionModal(true)
  }

  const handleNewAnalysis = () => {
    navigate('/analysis/new')
  }

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation()
    if (!window.confirm(t('history.confirmDelete', language))) return
    try {
      await chatService.deleteSession(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null)
        setShowSessionModal(false)
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
      alert(t('history.deleteError', language))
    }
  }

  const handleExportSession = (session) => {
    const data = JSON.stringify(session, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `satquery-session-${session.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredSessions = sessions.filter(session => {
    const preview = getMessagePreview(session.messages)
    const title = session.title || ''
    return (
      preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  if (loading) {
    return (
      <div className="flex-1 p-6 lg:ml-64 pt-20">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 bg-space-800/50 rounded-lg animate-pulse mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-space-800/50 rounded-xl animate-pulse border border-space-700" />
            ))}
          </div>
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
              <h1 className="font-display text-2xl font-bold text-space-100">{t('history.title', language)}</h1>
              <p className="text-space-500 text-sm">{t('history.subtitle', language)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector variant="compact" />
            <button onClick={handleNewAnalysis} className="btn-primary gap-2">
              <MessageSquare className="h-4 w-4" /> {t('history.newAnalysis', language)}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-space-900/50 backdrop-blur-xl border border-space-700 rounded-xl p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-space-500" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('history.searchPlaceholder', language)}
              className="input pl-10"
              aria-label={t('history.search', language)}
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-space-900/50 backdrop-blur-xl border border-space-700 rounded-xl overflow-hidden">
          {filteredSessions.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="h-16 w-16 mx-auto text-space-600 mb-4" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold text-space-100 mb-2">{t('history.emptyTitle', language)}</h2>
              <p className="text-space-500 mb-6">{t('history.emptyDesc', language)}</p>
              <button onClick={handleNewAnalysis} className="btn-primary gap-2">
                <MessageSquare className="h-4 w-4" /> {t('history.newAnalysis', language)}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-space-700">
              {filteredSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleOpenSession(session)}
                  className="w-full p-4 text-left hover:bg-space-800/50 transition-colors flex items-center gap-4"
                  aria-label={`${t('history.session', language)} ${session.title || String(session.id).slice(0, 8)}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-6 w-6 text-accent-cyan" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-space-100 truncate">{session.title || t('history.untitled', language)}</h3>
                      <span className="text-xs text-space-500 whitespace-nowrap">{formatDate(session.updated_at || session.created_at)}</span>
                    </div>
                    <p className="text-sm text-space-500 truncate mt-1">{getMessagePreview(session.messages)}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-space-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatDate(session.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                        {session.messages?.length || 0} {t('history.messages', language)}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="h-5 w-5 text-space-500 flex-shrink-0" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Session Detail Modal */}
      {showSessionModal && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setShowSessionModal(false); setSelectedSession(null); }}>
          <div className="bg-space-900 border border-space-700 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-space-700 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-space-100 truncate pr-4">{selectedSession.title || t('history.untitled', language)}</h2>
              <button onClick={() => { setShowSessionModal(false); setSelectedSession(null); }} className="p-2 text-space-400 hover:text-space-100" aria-label={t('common.close', language)}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '50vh' }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="p-3 bg-space-800/50 rounded-lg">
                  <p className="text-space-500 text-xs">{t('history.sessionId', language)}</p>
                  <p className="text-space-100 font-mono text-xs truncate">{selectedSession.id}</p>
                </div>
                <div className="p-3 bg-space-800/50 rounded-lg">
                  <p className="text-space-500 text-xs">{t('history.created', language)}</p>
                  <p className="text-space-100">{formatDate(selectedSession.created_at)}</p>
                </div>
                <div className="p-3 bg-space-800/50 rounded-lg">
                  <p className="text-space-500 text-xs">{t('history.updated', language)}</p>
                  <p className="text-space-100">{formatDate(selectedSession.updated_at)}</p>
                </div>
                <div className="p-3 bg-space-800/50 rounded-lg">
                  <p className="text-space-500 text-xs">{t('history.messageCount', language)}</p>
                  <p className="text-space-100">{selectedSession.messages?.length || 0}</p>
                </div>
              </div>

              {selectedSession.messages && selectedSession.messages.length > 0 ? (
                <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                  {selectedSession.messages.map((msg, idx) => (
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
                      <div className={`max-w-[85%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                        <div className={`inline-block px-3 py-2 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-accent-cyan/20 text-space-100 rounded-tr-sm' : 'bg-space-800 text-space-100 rounded-tl-sm'}`}>
                          <p className="whitespace-pre-wrap">{msg.message || msg.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-space-500">
                  <p>{t('history.noMessages', language)}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-space-700 flex items-center justify-end gap-3">
              <button onClick={() => handleExportSession(selectedSession)} className="btn-secondary gap-2">
                <Download className="h-4 w-4" /> {t('history.export', language)}
              </button>
              <button onClick={() => handleDeleteSession(selectedSession.id, { stopPropagation: () => {} })} className="btn-ghost gap-2 text-accent-rose hover:bg-accent-rose/10">
                <Trash2 className="h-4 w-4" /> {t('history.delete', language)}
              </button>
              <button onClick={() => { navigate(`/analysis/${selectedSession.id}`); setShowSessionModal(false); setSelectedSession(null); }} className="btn-primary gap-2">
                <MessageSquare className="h-4 w-4" /> {t('history.continue', language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}