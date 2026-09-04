import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye, FolderOpen, FileImage, Globe, Lock, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { projectService } from '../services/projectService'
import { t } from '../utils/translations'
import ImagePreview from '../components/ImagePreview'
import LanguageSelector from '../components/LanguageSelector'

export default function Projects() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const navigate = useNavigate()

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all, public, private
  const [sort, setSort] = useState('-updated_at')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '', is_public: false })

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const res = await projectService.list({
        page,
        limit: 12,
        search: search || undefined,
        is_public: filter === 'all' ? undefined : filter === 'public',
        sort,
      })
      setProjects(res || [])
      setTotal((res || []).length)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [page, search, filter, sort])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newProject.name.trim()) return
    setCreating(true)
    try {
      await projectService.create(newProject)
      setShowCreateModal(false)
      setNewProject({ name: '', description: '', is_public: false })
      fetchProjects()
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (projectId) => {
    if (!window.confirm(t('projects.confirmDelete', language))) return
    try {
      await projectService.delete(projectId)
      fetchProjects()
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString(language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getVisibilityBadge = (isPublic) => (
    <span className={`badge text-xs ${isPublic ? 'badge-info' : 'badge-secondary'}`}>
      {isPublic ? t('projects.public', language) : t('projects.private', language)}
    </span>
  )

  return (
    <div className="flex-1 p-6 lg:ml-64 pt-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-space-100">
              {t('projects.title', language)}
            </h1>
            <p className="text-space-500 text-sm mt-1">
              {t('projects.subtitle', language)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector variant="compact" />
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t('projects.newProject', language)}</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-space-900/50 backdrop-blur-xl border border-space-700 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-space-500" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={t('projects.searchPlaceholder', language)}
                className="input pl-10 pr-4 py-2"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                className="input py-2 px-3 min-w-[140px]"
              >
                <option value="all">{t('projects.all', language)}</option>
                <option value="public">{t('projects.public', language)}</option>
                <option value="private">{t('projects.private', language)}</option>
              </select>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="input py-2 px-3 min-w-[180px]"
              >
                <option value="-updated_at">{t('projects.sortRecent', language)}</option>
                <option value="updated_at">{t('projects.sortOldest', language)}</option>
                <option value="-name">{t('projects.sortNameDesc', language)}</option>
                <option value="name">{t('projects.sortNameAsc', language)}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="bg-space-900/50 backdrop-blur-xl border border-space-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-64 bg-space-800/50 rounded-lg animate-pulse border border-space-700" />
                ))}
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center">
              <FolderOpen className="h-16 w-16 mx-auto text-space-600 mb-4" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold text-space-100 mb-2">
                {search ? t('projects.noResults', language) : t('projects.noProjects', language)}
              </h2>
              <p className="text-space-500 mb-4">
                {search
                  ? t('projects.tryDifferentSearch', language)
                  : t('projects.createFirst', language)}
              </p>
              {!search && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary justify-center mx-auto gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {t('projects.newProject', language)}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-space-700 flex items-center justify-between">
                <p className="text-sm text-space-500">
                  {t('projects.showing', language, { count: projects.length, total })}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="group relative bg-space-800/50 border border-space-700 rounded-xl overflow-hidden hover:border-space-600 transition-colors"
                  >
                    {/* Project Thumbnail */}
                    <div className="relative aspect-video bg-space-800 overflow-hidden">
                      {project.thumbnail_url ? (
                        <ImagePreview
                          image={{ ...project, file_url: project.thumbnail_url }}
                          showControls={false}
                          className="h-full w-full"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <FolderOpen className="h-12 w-12 text-space-600" aria-hidden="true" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="p-2 bg-space-900/80 rounded-lg text-space-400 hover:text-accent-cyan hover:bg-space-700"
                          aria-label={t('projects.view', language)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/projects/${project.id}/edit`)}
                          className="p-2 bg-space-900/80 rounded-lg text-space-400 hover:text-accent-amber hover:bg-space-700"
                          aria-label={t('projects.edit', language)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="p-2 bg-space-900/80 rounded-lg text-space-400 hover:text-accent-rose hover:bg-space-700"
                          aria-label={t('projects.delete', language)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="absolute top-2 left-2">
                        {getVisibilityBadge(project.is_public)}
                      </div>
                    </div>

                    {/* Project Info */}
                    <div className="p-4 space-y-3">
                      <h3 className="font-semibold text-space-100 truncate">{project.name}</h3>
                      <p className="text-sm text-space-500 line-clamp-2">{project.description || t('projects.noDescription', language)}</p>
                      <div className="flex items-center gap-3 text-xs text-space-600">
                        <span className="flex items-center gap-1">
                          <FileImage className="h-3 w-3" aria-hidden="true" />
                          {project.image_count || 0} {t('projects.images', language)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" aria-hidden="true" />
                          {formatDate(project.updated_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-space-700">
                        <button
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="text-sm text-accent-cyan hover:underline flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          {t('projects.viewDetails', language)}
                        </button>
                        <span className="text-xs text-space-600">#{String(project.id).slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {total > 12 && (
                <div className="px-4 py-3 border-t border-space-700 flex items-center justify-between">
                  <p className="text-sm text-space-500">
                    {t('projects.page', language, { current: page, total: Math.ceil(total / 12) })}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 text-space-400 hover:text-space-100 disabled:opacity-50 rounded"
                    >
                      <ChevronDown className="h-4 w-4 rotate-180" />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(Math.ceil(total / 12), p + 1))}
                      disabled={page >= Math.ceil(total / 12)}
                      className="p-2 text-space-400 hover:text-space-100 disabled:opacity-50 rounded"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setShowCreateModal(false)}>
          <div className="bg-space-900 border border-space-700 rounded-2xl p-6 w-full max-w-md animate-in" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-xl font-semibold text-space-100 mb-4">
              {t('projects.createTitle', language)}
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-space-300 mb-1.5">
                  {t('projects.name', language)}
                </label>
                <input
                  id="name"
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  className="input"
                  placeholder="My Satellite Project"
                  required
                  maxLength={100}
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-space-300 mb-1.5">
                  {t('projects.description', language)}
                </label>
                <textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  className="input min-h-[80px] resize-y"
                  placeholder="Project description..."
                  maxLength={500}
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={newProject.is_public}
                  onChange={(e) => setNewProject(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="checkbox"
                />
                <label htmlFor="is_public" className="text-sm text-space-300">
                  {t('projects.makePublic', language)}
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 btn-secondary justify-center"
                >
                  {t('common.cancel', language)}
                </button>
                <button
                  type="submit"
                  disabled={creating || !newProject.name.trim()}
                  className="flex-1 btn-primary justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <span className="h-4 w-4 animate-spin border-2 border-white/30 border-t-white rounded-full" />
                      {t('common.creating', language)}
                    </>
                  ) : (
                    t('common.create', language)
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}