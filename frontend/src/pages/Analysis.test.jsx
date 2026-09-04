import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Analysis from '../pages/Analysis'

// Mock services
vi.mock('../services/chatService', () => ({
  chatService: {
    createSession: vi.fn().mockResolvedValue({ id: 1 }),
    getSession: vi.fn().mockResolvedValue({ id: 1, messages: [], project_id: 1 }),
    query: vi.fn().mockResolvedValue({
      answer: 'Test analysis response',
      evidence: { type: 'bounding_boxes', data: [] },
      analysis_type: 'OBJECT_DETECTION',
      confidence: 0.95,
    }),
    getAIStatus: vi.fn().mockResolvedValue({ provider: 'demo', configured: false }),
  },
}))

vi.mock('../services/projectService', () => ({
  projectService: {
    list: vi.fn().mockResolvedValue([
      { id: 1, name: 'Test Project 1' },
      { id: 2, name: 'Test Project 2' },
    ]),
  },
}))

vi.mock('../services/imageService', () => ({
  imageService: {
    list: vi.fn().mockResolvedValue([
      { id: 1, filename: 'image1.tif', modality: 'OPTICAL' },
      { id: 2, filename: 'image2.tif', modality: 'SAR' },
    ]),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User', email: 'test@example.com' },
    isAuthenticated: true,
    logout: vi.fn(),
    login: vi.fn(),
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
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
      'analysis.title': 'AI Analysis',
      'analysis.subtitle': 'Chat with SATQUERY AI about your satellite imagery',
      'analysis.newChat': 'New Chat',
      'analysis.selectProject': 'Select Project',
      'analysis.selectProjectPlaceholder': 'Choose a project...',
      'analysis.selectImages': 'Select Images',
      'analysis.imagesSelected': 'images selected',
      'analysis.noMessages': 'No messages yet',
      'analysis.startConversation': 'Select a project and start asking questions',
      'analysis.placeholder': 'Ask about land use, changes, objects...',
      'analysis.send': 'Send',
      'analysis.messageInput': 'Type your question',
      'analysis.attachImage': 'Attach images',
      'analysis.voiceInput': 'Voice input',
      'analysis.evidence': 'Evidence',
      'analysis.confidence': 'Confidence',
      'analysis.sessionError': 'Failed to create analysis session',
      'analysis.queryError': 'Failed to send query. Please try again.',
      'analysis.footer': 'Powered by SATQUERY AI',
      'analysis.demoMode': 'Demo Mode Active',
      'analysis.demoModeDesc': 'No external AI provider configured. Using deterministic fallback analysis.',
      'common.cancel': 'Cancel',
    }
    return translations[key] || key
  },
}))

vi.mock('../components/ImagePreview', () => ({ default: () => <div data-testid="image-preview" /> }))
vi.mock('../components/LanguageSelector', () => ({ default: () => <div data-testid="language-selector" /> }))
vi.mock('../components/TypingIndicator', () => ({ default: () => <div data-testid="typing-indicator" /> }))

function renderAnalysis(initialPath = '/analysis/new') {
  return render(
    <BrowserRouter initialEntries={[initialPath]}>
      <Analysis />
    </BrowserRouter>
  )
}

describe('Analysis Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set access_token so the component's fetchAIStatus actually runs
    localStorage.setItem('access_token', 'mock-access-token')
    // Mock fetch for AI status (Analysis.jsx uses fetch directly)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ provider: 'demo', configured: false }),
    })
  })

  it('renders header with title and subtitle', async () => {
    renderAnalysis()
    await waitFor(() => {
      expect(screen.getByText('AI Analysis')).toBeInTheDocument()
    })
    expect(screen.getByText('Chat with SATQUERY AI about your satellite imagery')).toBeInTheDocument()
  })

  it('shows project selector with available projects', async () => {
    renderAnalysis()
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument()
    })
    expect(screen.getByText('Test Project 2')).toBeInTheDocument()
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThanOrEqual(1)
  })

  it('shows image selector with images', async () => {
    renderAnalysis()
    await waitFor(() => {
      expect(screen.getByText('image1.tif (OPTICAL)')).toBeInTheDocument()
    })
    expect(screen.getByText('image2.tif (SAR)')).toBeInTheDocument()
  })

  it('shows demo mode indicator in header when AI provider is demo', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ provider: 'demo', configured: false }),
    })

    renderAnalysis()
    await waitFor(() => {
      expect(screen.getByText('Demo Mode')).toBeInTheDocument()
    })
    expect(screen.getByTitle('Running in Demo Mode - no external AI provider configured')).toBeInTheDocument()
  })

  it('shows AI not configured indicator when provider is not demo but not configured', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ provider: 'openai_compatible', configured: false }),
    })

    renderAnalysis()
    await waitFor(() => {
      expect(screen.getByText('AI Not Configured')).toBeInTheDocument()
    })
  })

  it('shows AI active indicator when provider is configured', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ provider: 'gemini', configured: true, model: 'gemini-1.5-pro' }),
    })

    renderAnalysis()
    await waitFor(() => {
      expect(screen.getByText('AI Active')).toBeInTheDocument()
    })
  })

  it('shows empty state with demo mode notice when no messages', async () => {
    renderAnalysis()
    await waitFor(() => {
      expect(screen.getByText('No messages yet')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Demo Mode Active')).toBeInTheDocument()
    })
    expect(screen.getByText(/no external ai provider configured/i)).toBeInTheDocument()
  })

  it('disables send button when no images selected', async () => {
    renderAnalysis()
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ask about land use, changes, objects...')).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText('Ask about land use, changes, objects...')
    fireEvent.change(textarea, { target: { value: 'Where are the buildings?' } })

    // The send button should be disabled when no images are selected
    const sendButton = screen.getByRole('button', { name: /send/i })
    expect(sendButton).toBeDisabled()
  })

  it('sends message and displays response when images selected', async () => {
    const { chatService } = await import('../services/chatService')
    chatService.query.mockResolvedValue({
      answer: 'I found 3 buildings in the image.',
      evidence: { type: 'bounding_boxes', data: [{ x: 10, y: 10, w: 50, h: 50 }] },
      analysis_type: 'OBJECT_DETECTION',
      confidence: 0.9,
    })

    renderAnalysis()
    await waitFor(() => {
      expect(screen.getByText('image1.tif (OPTICAL)')).toBeInTheDocument()
    })

    // Select first image
    const imageSelect = screen.getByRole('listbox')
    fireEvent.change(imageSelect, { target: { value: '1' } })

    const textarea = screen.getByPlaceholderText('Ask about land use, changes, objects...')
    fireEvent.change(textarea, { target: { value: 'Where are the buildings?' } })

    const sendButton = screen.getByRole('button', { name: /send/i })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Where are the buildings?')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('I found 3 buildings in the image.')).toBeInTheDocument()
    })
  })

  it('creates new session when project changes', async () => {
    const { chatService } = await import('../services/chatService')
    renderAnalysis()
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument()
    })

    const selects = screen.getAllByRole('combobox')
    const projectSelect = selects[0]
    fireEvent.change(projectSelect, { target: { value: '2' } })

    await waitFor(() => {
      expect(chatService.createSession).toHaveBeenCalled()
    })
  })

  it('disables send button while sending', async () => {
    const { chatService } = await import('../services/chatService')
    let resolveQuery
    chatService.query.mockImplementation(() => new Promise(resolve => { resolveQuery = resolve }))

    renderAnalysis()
    await waitFor(() => {
      expect(screen.getByText('image1.tif (OPTICAL)')).toBeInTheDocument()
    })

    const imageSelect = screen.getAllByRole('listbox')[0]
    fireEvent.change(imageSelect, { target: { value: '1' } })

    const textarea = screen.getByPlaceholderText('Ask about land use, changes, objects...')
    fireEvent.change(textarea, { target: { value: 'Test query' } })

    const sendButton = screen.getByRole('button', { name: /send/i })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(sendButton).toBeDisabled()
    })

    // Resolve to clean up
    resolveQuery({ answer: 'Done', evidence: null, analysis_type: 'GENERAL', confidence: 0.5 })
  })

  it('handles API errors gracefully', async () => {
    const { chatService } = await import('../services/chatService')
    chatService.query.mockRejectedValue(new Error('Network error'))

    renderAnalysis()
    await waitFor(() => {
      expect(screen.getByText('image1.tif (OPTICAL)')).toBeInTheDocument()
    })

    const imageSelect = screen.getAllByRole('listbox')[0]
    fireEvent.change(imageSelect, { target: { value: '1' } })

    const textarea = screen.getByPlaceholderText('Ask about land use, changes, objects...')
    fireEvent.change(textarea, { target: { value: 'Test query' } })

    const sendButton = screen.getByRole('button', { name: /send/i })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })
})