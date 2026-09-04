import { useState, useRef, useEffect } from 'react'
import { Maximize, Minimize, RotateCcw, RotateCw, ZoomIn, ZoomOut, Download, Info } from 'lucide-react'

export default function ImagePreview({
  image,
  className = '',
  showControls = true,
  onMetadataClick,
}) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [metadata, setMetadata] = useState(null)
  const imgRef = useRef(null)

  const handleImageLoad = () => {
    if (image?.file_url && !metadata) {
      // Could fetch metadata from backend
    }
  }

  const zoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5))
  const zoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.2))
  const resetZoom = () => setZoom(1)
  const rotateLeft = () => setRotation(prev => (prev - 90) % 360)
  const rotateRight = () => setRotation(prev => (prev + 90) % 360)

  const handleDownload = () => {
    if (image?.file_url) {
      const a = document.createElement('a')
      a.href = getImageUrl(image.file_url)
      a.download = image.filename || 'satellite-image'
      a.click()
    }
  }

  // Handle both relative paths (local storage) and absolute URLs (Supabase)
  const getImageUrl = (fileUrl) => {
    if (!fileUrl) return null
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl // Already an absolute URL (Supabase)
    }
    // Relative path - prepend API base URL
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    return `${apiBase}${fileUrl}`
  }

  const imageUrl = getImageUrl(image?.file_url)

  return (
    <div className={`relative ${className}`}>
      {/* Main Image View */}
      <div className="relative bg-space-800/50 rounded-lg overflow-hidden border border-space-700">
        {imageUrl ? (
          <div className="relative aspect-video overflow-hidden">
            <img
              ref={imgRef}
              src={imageUrl}
              alt={image.filename || 'Satellite image'}
              onLoad={handleImageLoad}
              className={`w-full h-full object-contain transition-transform duration-200 ${
                showModal ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
              onClick={() => setShowModal(true)}
            />
            {/* Zoom indicator */}
            {zoom !== 1 && (
              <div className="absolute top-2 right-2 bg-space-900/80 backdrop-blur px-2 py-1 rounded text-xs text-space-300">
                {Math.round(zoom * 100)}%
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-video flex items-center justify-center bg-space-800">
            <div className="text-center p-4">
              <div className="h-12 w-12 mx-auto mb-2 text-space-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>
              <p className="text-space-500">No image available</p>
            </div>
          </div>
        )}

        {/* Overlay Controls */}
        {showControls && imageUrl && (
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              onClick={rotateLeft}
              className="p-2 bg-space-900/80 backdrop-blur rounded-lg text-space-400 hover:text-space-100 hover:bg-space-700 transition-colors"
              aria-label="Rotate left"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={rotateRight}
              className="p-2 bg-space-900/80 backdrop-blur rounded-lg text-space-400 hover:text-space-100 hover:bg-space-700 transition-colors"
              aria-label="Rotate right"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              onClick={zoomIn}
              className="p-2 bg-space-900/80 backdrop-blur rounded-lg text-space-400 hover:text-space-100 hover:bg-space-700 transition-colors"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={zoomOut}
              className="p-2 bg-space-900/80 backdrop-blur rounded-lg text-space-400 hover:text-space-100 hover:bg-space-700 transition-colors"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={resetZoom}
              className="p-2 bg-space-900/80 backdrop-blur rounded-lg text-space-400 hover:text-space-100 hover:bg-space-700 transition-colors"
              aria-label="Reset zoom"
            >
              <Maximize className="h-4 w-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 bg-space-900/80 backdrop-blur rounded-lg text-space-400 hover:text-space-100 hover:bg-space-700 transition-colors"
              aria-label="Download image"
            >
              <Download className="h-4 w-4" />
            </button>
            {onMetadataClick && (
              <button
                onClick={onMetadataClick}
                className="p-2 bg-space-900/80 backdrop-blur rounded-lg text-space-400 hover:text-accent-cyan hover:bg-space-700 transition-colors"
                aria-label="View metadata"
              >
                <Info className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Image Info */}
      {image && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-space-100 truncate max-w-[200px]">{image.filename}</span>
            <span className="badge badge-info">{image.modality}</span>
            {image.sensor && <span className="text-space-500">{image.sensor}</span>}
            {image.resolution && <span className="text-space-500">{image.resolution}m</span>}
          </div>
          {image.latitude && image.longitude && (
            <span className="text-xs text-space-500 font-mono">
              {image.latitude.toFixed(4)}°, {image.longitude.toFixed(4)}°
            </span>
          )}
        </div>
      )}

      {/* Full Screen Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => { setShowModal(false); setZoom(1); setRotation(0); }}
          role="dialog"
          aria-modal="true"
          aria-label="Full screen image view"
        >
          <button
            onClick={() => { setShowModal(false); setZoom(1); setRotation(0); }}
            className="absolute top-4 right-4 p-2 bg-space-900/80 rounded-full text-space-400 hover:text-space-100 z-10"
            aria-label="Close fullscreen"
          >
            <Minimize className="h-6 w-6" />
          </button>
          <img
            src={imageUrl}
            alt={image.filename || 'Satellite image'}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <button onClick={zoomIn} className="p-2 bg-space-900/80 rounded-lg text-space-300 hover:text-white"><ZoomIn className="h-5 w-5" /></button>
            <button onClick={zoomOut} className="p-2 bg-space-900/80 rounded-lg text-space-300 hover:text-white"><ZoomOut className="h-5 w-5" /></button>
            <button onClick={rotateLeft} className="p-2 bg-space-900/80 rounded-lg text-space-300 hover:text-white"><RotateCcw className="h-5 w-5" /></button>
            <button onClick={rotateRight} className="p-2 bg-space-900/80 rounded-lg text-space-300 hover:text-white"><RotateCw className="h-5 w-5" /></button>
            <button onClick={resetZoom} className="p-2 bg-space-900/80 rounded-lg text-space-300 hover:text-white"><Maximize className="h-5 w-5" /></button>
          </div>
        </div>
      )}
    </div>
  )
}