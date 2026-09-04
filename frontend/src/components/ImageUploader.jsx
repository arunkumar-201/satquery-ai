import { useState, useCallback, useRef } from 'react'
import { Upload, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { imageService } from '../services/imageService'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/tif']
const MAX_SIZE = 50 * 1024 * 1024 // 50MB

export default function ImageUploader({
  projectId,
  onUploadComplete,
  uploadFn = imageService.upload,
  multiple = true,
  className = '',
}) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState({})
  const [progress, setProgress] = useState({})
  const inputRef = useRef(null)
  const dropZoneRef = useRef(null)
  const dragActiveRef = useRef(false)

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Unsupported file format. Allowed: PNG, JPEG, TIFF'
    }
    if (file.size > MAX_SIZE) {
      return `File too large. Maximum size: 50MB`
    }
    return null
  }

  const handleFiles = useCallback((newFiles) => {
    const validFiles = []
    const newErrors = {}

    Array.from(newFiles).forEach((file) => {
      const error = validateFile(file)
      if (error) {
        newErrors[file.name] = error
      } else {
        validFiles.push({
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          preview: URL.createObjectURL(file),
          metadata: {
            modality: 'OTHER',
            sensor: '',
            acquisition_date: '',
            latitude: '',
            longitude: '',
            resolution: '',
            bounding_box: '',
          },
        })
      }
    })

    setErrors(newErrors)
    if (validFiles.length > 0) {
      setFiles(prev => multiple ? [...prev, ...validFiles] : validFiles)
    }
  }, [multiple])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    dragActiveRef.current = false
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    dragActiveRef.current = true
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    dragActiveRef.current = false
  }, [])

  const removeFile = (id) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file?.preview) URL.revokeObjectURL(file.preview)
      return prev.filter(f => f.id !== id)
    })
    setErrors(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const updateMetadata = (id, field, value) => {
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, metadata: { ...f.metadata, [field]: value } } : f
    ))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    setErrors(prev => {
      const next = { ...prev }
      delete next.upload
      return next
    })
    try {
      for (const fileData of files) {
        setProgress(prev => ({ ...prev, [fileData.id]: 0 }))
        const result = await uploadFn(projectId, fileData.file, fileData.metadata)
        setProgress(prev => ({ ...prev, [fileData.id]: 100 }))
        if (onUploadComplete) onUploadComplete(result)
      }
      setFiles([])
    } catch (error) {
      console.error('Upload failed:', error)
      setErrors(prev => ({ ...prev, upload: error.message || 'Upload failed' }))
    } finally {
      setUploading(false)
      setProgress({})
    }
  }

  const triggerFileSelect = () => inputRef.current?.click()

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          dragActiveRef.current
            ? 'border-accent-cyan bg-accent-cyan/5'
            : 'border-space-600 hover:border-space-500'
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileSelect() }}
        aria-label="Drop zone for image upload"
      >
        <input
          type="file"
          ref={inputRef}
          multiple={multiple}
          accept={ALLOWED_TYPES.join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Choose files"
        />
        <div className="flex flex-col items-center gap-3">
          <div className={`p-3 rounded-full transition-colors ${
            dragActiveRef.current ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-space-800 text-space-400'
          }`}>
            <Upload className="h-8 w-8" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium text-space-100">
              {dragActiveRef.current ? 'Drop images here' : 'Drag & drop satellite images'}
            </p>
            <p className="text-sm text-space-500 mt-1">
              or <button type="button" onClick={triggerFileSelect} className="text-accent-cyan hover:underline">browse files</button>
            </p>
            <p className="text-xs text-space-600 mt-2">
              PNG, JPEG, TIFF • Max 50MB each
            </p>
          </div>
        </div>
      </div>

      {/* Validation errors for rejected files */}
      {Object.keys(errors).filter(key => key !== 'upload').length > 0 && (
        <div className="space-y-2" data-testid="file-errors">
          {Object.entries(errors).filter(([key, msg]) => key !== 'upload' && !files.some(f => f.file.name === key)).map(([name, msg]) => (
            <p key={name} className="text-xs text-accent-rose flex items-center gap-1">
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              <strong className="font-medium">{name}:</strong> {msg}
            </p>
          ))}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3" role="list" aria-label="Selected files">
          {files.map((fileData) => (
            <div
              key={fileData.id}
              className="flex items-center gap-4 p-3 bg-space-800/50 border border-space-700 rounded-lg animate-in"
            >
              <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-space-700">
                <img
                  src={fileData.preview}
                  alt={`Preview of ${fileData.file.name}`}
                  className="w-full h-full object-cover"
                />
                {progress[fileData.id] !== undefined && progress[fileData.id] < 100 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-accent-cyan animate-spin" aria-hidden="true" />
                    <span className="ml-2 text-xs text-white">{Math.round(progress[fileData.id])}%</span>
                  </div>
                )}
                {progress[fileData.id] === 100 && (
                  <div className="absolute inset-0 bg-emerald-500/50 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-accent-emerald" aria-hidden="true" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-space-100 truncate">{fileData.file.name}</p>
                  <span className="text-xs text-space-500">
                    {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>

                {/* Metadata fields */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {[
                    { key: 'modality', label: 'Modality', type: 'select', options: ['OPTICAL', 'SAR', 'MULTISPECTRAL', 'OTHER'] },
                    { key: 'sensor', label: 'Sensor', type: 'text', placeholder: 'e.g., Sentinel-2' },
                    { key: 'acquisition_date', label: 'Date', type: 'date' },
                    { key: 'latitude', label: 'Lat', type: 'number', step: 'any', placeholder: '0.0000' },
                    { key: 'longitude', label: 'Lon', type: 'number', step: 'any', placeholder: '0.0000' },
                    { key: 'resolution', label: 'Resolution (m)', type: 'number', step: 'any', placeholder: '10' },
                  ].map((field) => (
                    <div key={field.key} className="md:col-span-1">
                      <label className="block text-xs text-space-500 mb-1">{field.label}</label>
                      {field.type === 'select' ? (
                        <select
                          value={fileData.metadata[field.key] || ''}
                          onChange={(e) => updateMetadata(fileData.id, field.key, e.target.value)}
                          className="input py-1.5 text-xs"
                        >
                          <option value="">Auto</option>
                          {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={fileData.metadata[field.key] || ''}
                          onChange={(e) => updateMetadata(fileData.id, field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="input py-1.5 text-xs"
                          step={field.step}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {errors[fileData.file.name] && (
                  <p className="text-xs text-accent-rose flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {errors[fileData.file.name]}
                  </p>
                )}
              </div>

              <button
                onClick={() => removeFile(fileData.id)}
                disabled={uploading}
                className="p-2 text-space-500 hover:text-accent-rose hover:bg-accent-rose/10 rounded-lg transition-colors disabled:opacity-50"
                aria-label={`Remove ${fileData.file.name}`}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <button
          onClick={uploadFiles}
          disabled={uploading || files.length === 0}
          className="w-full btn-primary justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload {files.length} Image{files.length > 1 ? 's' : ''}
            </>
          )}
        </button>
      )}

      {errors.upload && (
        <p className="text-sm text-accent-rose flex items-center gap-2">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {errors.upload}
        </p>
      )}
    </div>
  )
}
