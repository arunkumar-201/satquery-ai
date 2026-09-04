import { useState, useRef, useEffect } from 'react'
import { Maximize, Minimize, RotateCcw, RotateCw, ZoomIn, ZoomOut, Download, Layout, LayoutGrid, ArrowLeftRight } from 'lucide-react'

export default function ImageComparison({
  beforeImage,
  afterImage,
  changeMapUrl,
  className = '',
}) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [viewMode, setViewMode] = useState('side') // 'side', 'swipe', 'overlay'

  const zoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5))
  const zoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.2))
  const resetZoom = () => setZoom(1)
  const rotateLeft = () => setRotation(prev => (prev - 90) % 360)
  const rotateRight = () => setRotation(prev => (prev + 90) % 360)

  const handleDownload = (url, filename) => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  const getImageUrl = (image) => {
    if (!image?.file_url) return null
    return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${image.file_url}`
  }

  const beforeUrl = getImageUrl(beforeImage)
  const afterUrl = getImageUrl(afterImage)
  const changeUrl = changeMapUrl ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${changeMapUrl}` : null

  const transformStyle = { transform: `scale(${zoom}) rotate(${rotation}deg)` }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* View Mode Selector */}
      <div className="flex items-center gap-2 bg-space-800/50 rounded-lg p-1">
        {[
          { mode: 'side', icon: Layout, label: 'Side by Side' },
          { mode: 'swipe', icon: ArrowLeftRight, label: 'Swipe Compare' },
          { mode: 'overlay', icon: LayoutGrid, label: 'Overlay' },
        ].map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === mode
                ? 'bg-accent-cyan/20 text-accent-cyan'
                : 'text-space-400 hover:text-space-100 hover:bg-space-700'
            }`}
            aria-pressed={viewMode === mode}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Comparison View */}
      <div className="relative bg-space-800/50 rounded-lg border border-space-700 overflow-hidden">
        {viewMode === 'side' && beforeUrl && afterUrl && (
          <div className="grid grid-cols-2 h-[500px]">
            <div className="relative border-r border-space-700 overflow-hidden flex items-center justify-center">
              <div className="absolute top-2 left-2 bg-space-900/80 px-2 py-1 rounded text-xs font-medium text-accent-amber">
                BEFORE
              </div>
              <img
                src={beforeUrl}
                alt={`Before: ${beforeImage?.filename}`}
                className="w-full h-full object-contain"
                style={transformStyle}
              />
            </div>
            <div className="relative overflow-hidden flex items-center justify-center">
              <div className="absolute top-2 right-2 bg-space-900/80 px-2 py-1 rounded text-xs font-medium text-accent-emerald">
                AFTER
              </div>
              <img
                src={afterUrl}
                alt={`After: ${afterImage?.filename}`}
                className="w-full h-full object-contain"
                style={transformStyle}
              />
            </div>
          </div>
        )}

        {viewMode === 'swipe' && beforeUrl && afterUrl && (
          <div className="relative h-[500px] overflow-hidden" style={{ transform: `scale(${zoom})` }}>
            <img
              src={beforeUrl}
              alt={`Before: ${beforeImage?.filename}`}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 w-1/2 h-full overflow-hidden border-r-2 border-accent-cyan">
              <img
                src={afterUrl}
                alt={`After: ${afterImage?.filename}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-accent-cyan pointer-events-none" />
            <div className="absolute top-2 left-2 bg-space-900/80 px-2 py-1 rounded text-xs font-medium text-accent-amber">
              BEFORE
            </div>
            <div className="absolute top-2 right-2 bg-space-900/80 px-2 py-1 rounded text-xs font-medium text-accent-emerald">
              AFTER
            </div>
          </div>
        )}

        {viewMode === 'overlay' && beforeUrl && afterUrl && (
          <div className="relative h-[500px] flex items-center justify-center" style={{ transform: `scale(${zoom})` }}>
            <img
              src={beforeUrl}
              alt={`Before: ${beforeImage?.filename}`}
              className="absolute inset-0 w-full h-full object-contain opacity-50"
            />
            <img
              src={afterUrl}
              alt={`After: ${afterImage?.filename}`}
              className="absolute inset-0 w-full h-full object-contain mix-blend-difference"
            />
            <div className="absolute top-2 left-2 bg-space-900/80 px-2 py-1 rounded text-xs font-medium text-accent-amber">
              OVERLAY (difference blend)
            </div>
          </div>
        )}

        {/* Change Map */}
        {viewMode !== 'overlay' && changeUrl && (
          <div className="border-t border-space-700">
            <div className="relative h-[300px] flex items-center justify-center">
              <img
                src={changeUrl}
                alt="Change detection map"
                className="max-w-full max-h-full object-contain"
              />
              <div className="absolute top-2 left-2 bg-space-900/80 px-2 py-1 rounded text-xs font-medium text-accent-rose">
                CHANGE MAP
              </div>
            </div>
          </div>
        )}

        {(!beforeUrl || !afterUrl) && (
          <div className="h-[500px] flex items-center justify-center bg-space-800">
            <div className="text-center p-4">
              <div className="h-12 w-12 mx-auto mb-2 text-space-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>
              <p className="text-space-500">Upload two images to compare</p>
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        {(beforeUrl || afterUrl) && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 bg-space-900/80 backdrop-blur rounded-lg p-1">
            <button onClick={rotateLeft} className="p-2 text-space-400 hover:text-white" aria-label="Rotate left"><RotateCcw className="h-4 w-4" /></button>
            <button onClick={rotateRight} className="p-2 text-space-400 hover:text-white" aria-label="Rotate right"><RotateCw className="h-4 w-4" /></button>
            <button onClick={zoomIn} className="p-2 text-space-400 hover:text-white" aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></button>
            <button onClick={zoomOut} className="p-2 text-space-400 hover:text-white" aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></button>
            <button onClick={resetZoom} className="p-2 text-space-400 hover:text-white" aria-label="Reset view"><Maximize className="h-4 w-4" /></button>
            {beforeUrl && (
              <button onClick={() => handleDownload(beforeUrl, beforeImage?.filename)} className="p-2 text-space-400 hover:text-white" aria-label="Download before"><Download className="h-4 w-4" /></button>
            )}
            {afterUrl && (
              <button onClick={() => handleDownload(afterUrl, afterImage?.filename)} className="p-2 text-space-400 hover:text-white" aria-label="Download after"><Download className="h-4 w-4" /></button>
            )}
            {changeUrl && (
              <button onClick={() => handleDownload(changeUrl, 'change-map')} className="p-2 text-space-400 hover:text-white" aria-label="Download change map"><Download className="h-4 w-4" /></button>
            )}
          </div>
        )}
      </div>

      {/* Image Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        {beforeImage && (
          <div className="bg-space-800/50 rounded-lg p-3 border border-space-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-warning">BEFORE</span>
              <span className="font-medium text-space-100 truncate">{beforeImage.filename}</span>
            </div>
            <div className="space-y-1 text-space-500 text-xs">
              {beforeImage.modality && <p>Modality: {beforeImage.modality}</p>}
              {beforeImage.sensor && <p>Sensor: {beforeImage.sensor}</p>}
              {beforeImage.acquisition_date && <p>Date: {new Date(beforeImage.acquisition_date).toLocaleDateString()}</p>}
              {beforeImage.resolution && <p>Resolution: {beforeImage.resolution}m</p>}
              {beforeImage.latitude && beforeImage.longitude && <p>Coords: {beforeImage.latitude.toFixed(4)}°, {beforeImage.longitude.toFixed(4)}°</p>}
            </div>
          </div>
        )}
        {afterImage && (
          <div className="bg-space-800/50 rounded-lg p-3 border border-space-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-success">AFTER</span>
              <span className="font-medium text-space-100 truncate">{afterImage.filename}</span>
            </div>
            <div className="space-y-1 text-space-500 text-xs">
              {afterImage.modality && <p>Modality: {afterImage.modality}</p>}
              {afterImage.sensor && <p>Sensor: {afterImage.sensor}</p>}
              {afterImage.acquisition_date && <p>Date: {new Date(afterImage.acquisition_date).toLocaleDateString()}</p>}
              {afterImage.resolution && <p>Resolution: {afterImage.resolution}m</p>}
              {afterImage.latitude && afterImage.longitude && <p>Coords: {afterImage.latitude.toFixed(4)}°, {afterImage.longitude.toFixed(4)}°</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}