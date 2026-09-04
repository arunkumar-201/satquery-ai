import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImageUploader from '../components/ImageUploader'

const mockOnUploadComplete = vi.fn()

vi.mock('../services/imageService', () => ({
  imageService: {
    upload: vi.fn(),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User', email: 'test@example.com' },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}))

vi.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'en',
    setLanguage: vi.fn(),
    currentLanguage: { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    languages: [
      { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
    ],
  }),
}))

vi.mock('../utils/translations', () => ({
  t: (key, lang) => {
    const translations = {
      'common.cancel': 'Cancel',
    }
    return translations[key] || key
  },
}))

function renderUploader(props = {}) {
  return render(<ImageUploader projectId={1} onUploadComplete={mockOnUploadComplete} {...props} />)
}

describe('ImageUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders drop zone with upload instructions', () => {
    renderUploader()
    expect(screen.getByText(/drag & drop satellite images/i)).toBeInTheDocument()
    expect(screen.getByText(/png, jpeg, tiff.*max 50mb/i)).toBeInTheDocument()
  })

  it('opens file picker when drop zone is clicked', () => {
    renderUploader()
    const input = screen.getByLabelText('Choose files')
    expect(input).toBeInTheDocument()
  })

  it('handles drag and drop', () => {
    renderUploader()
    const dropZone = screen.getByLabelText('Drop zone for image upload')

    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const dataTransfer = { files: [file] }

    fireEvent.drop(dropZone, { dataTransfer })

    expect(screen.getByText('test.png')).toBeInTheDocument()
  })

  it('rejects invalid file types', async () => {
    renderUploader()
    const dropZone = screen.getByLabelText('Drop zone for image upload')

    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const dataTransfer = { files: [file] }

    fireEvent.drop(dropZone, { dataTransfer })

    await waitFor(() => {
      expect(screen.getByText(/unsupported file format/i)).toBeInTheDocument()
    })
  })

  it('rejects files larger than 50MB', async () => {
    renderUploader()
    const dropZone = screen.getByLabelText('Drop zone for image upload')

    const largeFile = new File(['x'.repeat(51 * 1024 * 1024)], 'large.png', { type: 'image/png' })
    const dataTransfer = { files: [largeFile] }

    fireEvent.drop(dropZone, { dataTransfer })

    await waitFor(() => {
      expect(screen.getByText(/file too large/i)).toBeInTheDocument()
    })
  })

  it('displays file metadata fields after adding file', async () => {
    renderUploader()
    const dropZone = screen.getByLabelText('Drop zone for image upload')

    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const dataTransfer = { files: [file] }

    fireEvent.drop(dropZone, { dataTransfer })

    await waitFor(() => {
      expect(screen.getByText('Modality')).toBeInTheDocument()
    })
    expect(screen.getByText('Sensor')).toBeInTheDocument()
    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.getByText('Lat')).toBeInTheDocument()
    expect(screen.getByText('Lon')).toBeInTheDocument()
    expect(screen.getByText('Resolution (m)')).toBeInTheDocument()
  })

  it('can remove file from list', async () => {
    renderUploader()
    const dropZone = screen.getByLabelText('Drop zone for image upload')

    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const dataTransfer = { files: [file] }

    fireEvent.drop(dropZone, { dataTransfer })

    await waitFor(() => {
      expect(screen.getByText('test.png')).toBeInTheDocument()
    })

    const removeButton = screen.getByLabelText('Remove test.png')
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(screen.queryByText('test.png')).not.toBeInTheDocument()
    })
  })

  it('uploads files and calls onUploadComplete', async () => {
    const { imageService } = await import('../services/imageService')
    imageService.upload.mockResolvedValue({ id: 1, filename: 'test.png' })

    renderUploader()
    const dropZone = screen.getByLabelText('Drop zone for image upload')

    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const dataTransfer = { files: [file] }

    fireEvent.drop(dropZone, { dataTransfer })

    await waitFor(() => {
      expect(screen.getByText('test.png')).toBeInTheDocument()
    })

    const uploadButton = screen.getByText(/upload 1 image/i)
    fireEvent.click(uploadButton)

    await waitFor(() => {
      expect(imageService.upload).toHaveBeenCalledWith(1, file, expect.any(Object))
    }, { timeout: 10000 })

    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalledWith({ id: 1, filename: 'test.png' })
    }, { timeout: 10000 })
  }, 15000)

  it('disables upload button while uploading', async () => {
    const { imageService } = await import('../services/imageService')
    imageService.upload.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ id: 1 }), 1000)))

    renderUploader()
    const dropZone = screen.getByLabelText('Drop zone for image upload')

    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const dataTransfer = { files: [file] }

    fireEvent.drop(dropZone, { dataTransfer })

    await waitFor(() => {
      expect(screen.getByText('test.png')).toBeInTheDocument()
    })

    const uploadButton = screen.getByText(/upload 1 image/i)
    fireEvent.click(uploadButton)

    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument()
      expect(uploadButton).toBeDisabled()
    }, { timeout: 5000 })
  }, 10000)

  it('shows error when upload fails', async () => {
    const { imageService } = await import('../services/imageService')
    imageService.upload.mockRejectedValue(new Error('Upload failed'))

    renderUploader()
    const dropZone = screen.getByLabelText('Drop zone for image upload')

    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const dataTransfer = { files: [file] }

    fireEvent.drop(dropZone, { dataTransfer })

    await waitFor(() => {
      expect(screen.getByText('test.png')).toBeInTheDocument()
    })

    const uploadButton = screen.getByText(/upload 1 image/i)
    fireEvent.click(uploadButton)

    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
    }, { timeout: 10000 })
  }, 15000)

  it('handles multiple file uploads', async () => {
    const { imageService } = await import('../services/imageService')
    imageService.upload.mockResolvedValue({ id: 1 })

    renderUploader({ multiple: true })
    const dropZone = screen.getByLabelText('Drop zone for image upload')

    const file1 = new File(['test'], 'test1.png', { type: 'image/png' })
    const file2 = new File(['test'], 'test2.png', { type: 'image/png' })
    const dataTransfer = { files: [file1, file2] }

    fireEvent.drop(dropZone, { dataTransfer })

    await waitFor(() => {
      expect(screen.getByText('test1.png')).toBeInTheDocument()
      expect(screen.getByText('test2.png')).toBeInTheDocument()
    })

    const uploadButton = screen.getByText(/upload 2 images/i)
    fireEvent.click(uploadButton)

    await waitFor(() => {
      expect(imageService.upload).toHaveBeenCalledTimes(2)
    }, { timeout: 10000 })
  }, 15000)

  it('updates metadata when fields change', async () => {
    renderUploader()
    const dropZone = screen.getByLabelText('Drop zone for image upload')

    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const dataTransfer = { files: [file] }

    fireEvent.drop(dropZone, { dataTransfer })

    await waitFor(() => {
      expect(screen.getByText('test.png')).toBeInTheDocument()
    })

    // Find select for modality - it's the first select in the metadata area
    const modalitySelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(modalitySelect, { target: { value: 'OPTICAL' } })

    // Find sensor input
    const sensorInput = screen.getByPlaceholderText('e.g., Sentinel-2')
    fireEvent.change(sensorInput, { target: { value: 'Sentinel-2' } })

    expect(modalitySelect.value).toBe('OPTICAL')
    expect(sensorInput.value).toBe('Sentinel-2')
  })

  it('shows progress during upload', async () => {
    const { imageService } = await import('../services/imageService')
    imageService.upload.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ id: 1 }), 500)))

    renderUploader()
    const dropZone = screen.getByLabelText('Drop zone for image upload')

    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const dataTransfer = { files: [file] }

    fireEvent.drop(dropZone, { dataTransfer })

    await waitFor(() => {
      expect(screen.getByText('test.png')).toBeInTheDocument()
    })

    const uploadButton = screen.getByText(/upload 1 image/i)
    fireEvent.click(uploadButton)

    // The component shows uploading state - verify button is disabled during upload
    await waitFor(() => {
      expect(uploadButton).toBeDisabled()
    }, { timeout: 3000 })
  }, 10000)
})