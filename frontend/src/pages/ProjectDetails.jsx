import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, MessageSquare, MapPin, Image, Settings, MoreVertical, Trash2, Edit, Eye } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { projectService } from '../services/projectService'
import { imageService } from '../services/imageService'
import { t } from '../utils/translations'
import ImagePreview from '../components/ImagePreview'
import ImageUploader from '../components/ImageUploader'
import LanguageSelector from '../components/LanguageSelector'
import MapViewer from '../components/MapViewer'

export default function ProjectDetails() {
  const { id: projectId } = useParams()
  const { user } = useAuth()
  const { language } = useLanguage()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('images')
  const [showUpload, setShowUpload] = useState(false)

  const fetchProject = async () => {
    try {
      const [projectRes, imagesRes] = await Promise.all([
        projectService.get(projectId),
        imageService.list(projectId),
      ])
      setProject(projectRes)
      setImages(imagesRes || [])
    } catch (error) {
      console.error('Failed to fetch project:', error)
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const handleUploadComplete = (result) => {
    setShowUpload(false)
    fetchProject()
  }

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Delete this image?')) return
    try {
      await imageService.delete(imageId)
      fetchProject()
    } catch (error) {
      console.error('Failed to delete image:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 lg:ml-64 pt-20">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-space-800/50 rounded-lg animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-space-800/50 rounded-xl animate-pulse border border-space-700" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex-1 p-6 lg:ml-64 pt-20">
        <div className="max-w-7xl mx-auto text-center py-12">
          <p className="text-space-500">Project not found</p>
          <button onClick={() => navigate('/projects')} className="mt-4 btn-primary">Back to Projects</button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'images', label: t('projectDetails.images', language), icon: Image },
    { id: 'chat', label: t('projectDetails.chat', language), icon: MessageSquare },
    { id: 'map', label: t('projectDetails.map', language), icon: MapPin },
  ]

  return (
    <div className="flex-1 p-6 lg:ml-64 pt-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/projects')} className="btn-ghost p-2" aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold text-space-100">{project.name}</h1>
              <p className="text-space-500 text-sm">{project.description || t('projectDetails.noDescription', language)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector variant="compact" />
            <button className="btn-primary" onClick={() => setShowUpload(true)}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t('projectDetails.uploadImage', language)}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-space-900/50 backdrop-blur-xl border border-space-700 rounded-xl overflow-hidden">
          <div className="border-b border-space-700">
            <nav className="flex gap-1 p-1" role="tablist" aria-label="Project sections">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
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
          <div className="p-4">
            {activeTab === 'images' && (
              <div id="panel-images" role="tabpanel" aria-labelledby="tab-images">
                {showUpload ? (
                  <div className="mb-6">
                    <ImageUploader projectId={projectId} onUploadComplete={handleUploadComplete} />
                    <button onClick={() => setShowUpload(false)} className="mt-4 btn-secondary">{t('common.cancel', language)}</button>
                  </div>
                ) : (
                  <button onClick={() => setShowUpload(true)} className="mb-6 btn-secondary">
                    <Upload className="h-4 w-4" /> {t('projectDetails.uploadImage', language)}
                  </button>
                )}

                {images.length === 0 ? (
                  <div className="p-12 text-center">
                    <Image className="h-16 w-16 mx-auto text-space-600 mb-4" aria-hidden="true" />
                    <h2 className="font-display text-lg font-semibold text-space-100 mb-2">{t('projectDetails.noImages', language)}</h2>
                    <p className="text-space-500 mb-4">{t('projectDetails.uploadFirst', language)}</p>
                    <button onClick={() => setShowUpload(true)} className="btn-primary gap-2">
                      <Upload className="h-4 w-4" /> {t('projectDetails.uploadImage', language)}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {images.map((image) => (
                      <div key={image.id} className="group relative bg-space-800/50 border border-space-700 rounded-xl overflow-hidden hover:border-space-600 transition-colors">
                        <div className="relative aspect-video bg-space-800 overflow-hidden">
                          <ImagePreview image={image} showControls={false} className="h-full w-full" />
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => navigate(`/analysis/new?project=${projectId}&image=${image.id}`)} className="p-2 bg-space-900/80 rounded-lg text-space-400 hover:text-accent-cyan hover:bg-space-700" aria-label={t('projectDetails.analyze', language)}>
                              <MessageSquare className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteImage(image.id)} className="p-2 bg-space-900/80 rounded-lg text-space-400 hover:text-accent-rose hover:bg-space-700" aria-label={t('projectDetails.deleteImage', language)}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="absolute top-2 left-2">
                            <span className={`badge text-xs ${['OPTICAL', 'SAR', 'MULTISPECTRAL', 'OTHER'].includes(image.modality) ? `badge-${{OPTICAL: 'info', SAR: 'warning', MULTISPECTRAL: 'success', OTHER: 'secondary'}[image.modality]}` : 'badge-secondary'}`}>
                              {image.modality}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 space-y-2">
                          <p className="font-medium text-space-100 truncate">{image.filename}</p>
                          <div className="flex items-center gap-3 text-xs text-space-600">
                            {image.sensor && <span>{image.sensor}</span>}
                            {image.resolution && <span>{image.resolution}m</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'chat' && (
              <div id="panel-chat" role="tabpanel" aria-labelledby="tab-chat">
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 mx-auto text-space-600 mb-4" aria-hidden="true" />
                  <h2 className="font-display text-lg font-semibold text-space-100 mb-2">Project AI Assistant</h2>
                  <p className="text-space-500 mb-4">Ask questions about this project's satellite imagery and continue the conversation with context.</p>
                  <button onClick={() => navigate(`/analysis/new?project=${projectId}`)} className="btn-primary gap-2">
                    <MessageSquare className="h-4 w-4" /> {t('projectDetails.openAssistant', language)}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'map' && (
              <div id="panel-map" role="tabpanel" aria-labelledby="tab-map">
                <MapViewer images={images} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}