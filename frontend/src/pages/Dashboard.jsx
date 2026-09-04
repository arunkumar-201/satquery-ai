import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, FileImage, MessageSquare, TrendingUp, Clock, ArrowRight, Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { projectService } from '../services/projectService'
import { imageService } from '../services/imageService'
import { chatService } from '../services/chatService'
import { t } from '../utils/translations'
import ImagePreview from '../components/ImagePreview'
import LanguageSelector from '../components/LanguageSelector'

const statCards = [
  { key: 'projects', label: 'dashboard.projects', icon: FolderOpen, color: 'accent-cyan', trend: '+12%' },
  { key: 'images', label: 'dashboard.images', icon: FileImage, color: 'accent-emerald', trend: '+8%' },
  { key: 'analyses', label: 'dashboard.analyses', icon: MessageSquare, color: 'accent-amber', trend: '+23%' },
  { key: 'detections', label: 'dashboard.detections', icon: TrendingUp, color: 'accent-rose', trend: '+5%' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const navigate = useNavigate()

  const [stats, setStats] = useState({ projects: 0, images: 0, analyses: 0, detections: 0 })
  const [recentProjects, setRecentProjects] = useState([])
  const [recentImages, setRecentImages] = useState([])
  const [recentAnalyses, setRecentAnalyses] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      const projectsRes = await projectService.list()
      const projectData = await Promise.all(projectsRes.map(async project => ({
        project,
        images: await imageService.list(project.id),
        sessions: await chatService.listSessions(project.id),
      })))
      const allImages = projectData.flatMap(item => item.images)
      const allSessions = projectData.flatMap(item => item.sessions)
      setRecentProjects(projectsRes.slice(0, 5))
      setRecentImages(allImages.slice(0, 6))
      setRecentAnalyses(allSessions.slice(0, 5))

      setStats({
        projects: projectsRes.length,
        images: allImages.length,
        analyses: allSessions.length,
        detections: 0, // Would need separate API
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString(language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getModalityBadge = (modality) => {
    const badges = {
      OPTICAL: 'badge-info',
      SAR: 'badge-warning',
      MULTISPECTRAL: 'badge-success',
      OTHER: 'badge-secondary',
    }
    return badges[modality] || 'badge-secondary'
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 lg:ml-64 pt-20">
        <div className="max-w-7xl mx-auto space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-space-800/50 rounded-xl animate-pulse border border-space-700" />
          ))}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-space-800/50 rounded-xl animate-pulse border border-space-700" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 lg:ml-64 pt-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-space-100">
              {t('dashboard.welcome', language, { name: user?.name || 'User' })}
            </h1>
            <p className="text-space-500 text-sm mt-1">
              {t('dashboard.subtitle', language)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector variant="compact" />
            <button className="btn-primary" onClick={() => navigate('/projects')}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t('dashboard.newProject', language)}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div key={stat.key} className="bg-space-900/50 backdrop-blur-xl border border-space-700 rounded-xl p-5 hover:border-space-600 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-space-500 text-sm font-medium">{t(stat.label, language)}</p>
                  <p className="font-display text-3xl font-bold text-space-100 mt-1">
                    {stats[stat.key] || 0}
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-${stat.color}/10`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}`} aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs">
                <span className="text-accent-emerald font-medium">{stat.trend}</span>
                <span className="text-space-500">{t('dashboard.vsLastMonth', language)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <div className="lg:col-span-2 bg-space-900/50 backdrop-blur-xl border border-space-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-space-700 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-space-100">
                {t('dashboard.recentProjects', language)}
              </h2>
              <button
                onClick={() => navigate('/projects')}
                className="text-sm text-accent-cyan hover:underline flex items-center gap-1"
              >
                {t('dashboard.viewAll', language)}
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="divide-y divide-space-700">
              {recentProjects.length === 0 ? (
                <div className="p-8 text-center">
                  <FolderOpen className="h-12 w-12 mx-auto text-space-600 mb-3" aria-hidden="true" />
                  <p className="text-space-500">{t('dashboard.noProjects', language)}</p>
                  <button
                    onClick={() => navigate('/projects')}
                    className="mt-3 btn-secondary justify-center mx-auto gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {t('dashboard.createFirst', language)}
                  </button>
                </div>
              ) : (
                recentProjects.map((project) => (
                  <div key={project.id} className="p-4 hover:bg-space-800/50 transition-colors group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-space-100 truncate">{project.name}</h3>
                          {project.is_public && (
                            <span className="badge badge-info text-xs">{t('dashboard.public', language)}</span>
                          )}
                        </div>
                        <p className="text-sm text-space-500 truncate">{project.description || t('dashboard.noDescription', language)}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-space-600">
                          <span>{t('dashboard.images', language)}: {project.image_count || 0}</span>
                          <span>{t('dashboard.updated', language)} {formatDate(project.updated_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="p-1.5 text-space-500 hover:text-accent-cyan rounded hover:bg-space-800"
                          aria-label={t('dashboard.viewProject', language)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/projects/${project.id}/edit`)}
                          className="p-1.5 text-space-500 hover:text-accent-amber rounded hover:bg-space-800"
                          aria-label={t('dashboard.editProject', language)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Images */}
          <div className="bg-space-900/50 backdrop-blur-xl border border-space-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-space-700 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-space-100">
                {t('dashboard.recentImages', language)}
              </h2>
              <button
                onClick={() => navigate('/projects')}
                className="text-sm text-accent-cyan hover:underline flex items-center gap-1"
              >
                {t('dashboard.viewAll', language)}
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="p-2">
              {recentImages.length === 0 ? (
                <div className="p-6 text-center">
                  <FileImage className="h-10 w-10 mx-auto text-space-600 mb-2" aria-hidden="true" />
                  <p className="text-space-500 text-sm">{t('dashboard.noImages', language)}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {recentImages.slice(0, 6).map((image) => (
                    <div key={image.id} className="group relative aspect-square rounded-lg overflow-hidden bg-space-800">
                      <ImagePreview image={image} showControls={false} className="h-full" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => navigate(`/projects/${image.project_id}?image=${image.id}`)}
                          className="btn-primary px-3 py-1.5 text-xs"
                        >
                          {t('dashboard.view', language)}
                        </button>
                      </div>
                      <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between p-1 pointer-events-none">
                        <span className={`badge text-xs ${getModalityBadge(image.modality)}`}>
                          {image.modality}
                        </span>
                        <span className="text-xs text-space-100 bg-space-900/80 px-1.5 py-0.5 rounded">
                          {formatDate(image.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Analyses */}
        <div className="bg-space-900/50 backdrop-blur-xl border border-space-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-space-700 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-space-100">
              {t('dashboard.recentAnalyses', language)}
            </h2>
            <button
              onClick={() => navigate('/history')}
              className="text-sm text-accent-cyan hover:underline flex items-center gap-1"
            >
              {t('dashboard.viewAll', language)}
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-space-700">
            {recentAnalyses.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-space-600 mb-3" aria-hidden="true" />
                <p className="text-space-500">{t('dashboard.noAnalyses', language)}</p>
                <button
                  onClick={() => navigate('/analysis/new')}
                  className="mt-3 btn-secondary justify-center mx-auto gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  {t('dashboard.startAnalysis', language)}
                </button>
              </div>
            ) : (
              recentAnalyses.map((session) => (
                <div key={session.id} className="p-4 hover:bg-space-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-space-100 truncate mb-1">
                        {session.title || t('dashboard.untitledAnalysis', language)}
                      </h3>
                      <p className="text-sm text-space-500 truncate">
                        {session.last_message_preview || t('dashboard.noMessages', language)}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-space-600">
                        <span>{t('dashboard.messages', language)}: {session.message_count || 0}</span>
                        <span>{formatDate(session.updated_at)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/analysis/${session.id}`)}
                      className="p-1.5 text-space-500 hover:text-accent-cyan rounded hover:bg-space-800 flex-shrink-0"
                      aria-label={t('dashboard.openAnalysis', language)}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}