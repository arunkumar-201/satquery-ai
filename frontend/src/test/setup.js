import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock localStorage with actual storage behavior
const localStorageStore = {}
const localStorageMock = {
  getItem: vi.fn((key) => localStorageStore[key] ?? null),
  setItem: vi.fn((key, value) => { localStorageStore[key] = value }),
  removeItem: vi.fn((key) => { delete localStorageStore[key] }),
  clear: vi.fn(() => { Object.keys(localStorageStore).forEach(key => delete localStorageStore[key]) }),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock fetch
global.fetch = vi.fn()

// Mock all service modules to prevent real API calls
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    updateNotifications: vi.fn(),
    updateAppearance: vi.fn(),
  },
}))

vi.mock('../services/projectService', () => ({
  projectService: {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../services/imageService', () => ({
  imageService: {
    upload: vi.fn(),
    list: vi.fn().mockResolvedValue([]),
    get: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../services/chatService', () => ({
  chatService: {
    createSession: vi.fn().mockResolvedValue({ id: 1 }),
    listSessions: vi.fn().mockResolvedValue([]),
    getMessages: vi.fn().mockResolvedValue([]),
    getSession: vi.fn().mockResolvedValue({ id: 1, messages: [], project_id: 1 }),
    listHistory: vi.fn().mockResolvedValue([]),
    deleteSession: vi.fn(),
    query: vi.fn().mockResolvedValue({
      answer: 'Test analysis response',
      evidence: { type: 'bounding_boxes', data: [] },
      analysis_type: 'OBJECT_DETECTION',
      confidence: 0.95,
    }),
    message: vi.fn(),
    getAIStatus: vi.fn().mockResolvedValue({ provider: 'demo', configured: false }),
  },
}))

// jsdom does not implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// jsdom does not implement URL.createObjectURL / revokeObjectURL
if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn()
}

// Mock matchMedia (used by some UI libraries)
window.matchMedia = window.matchMedia || function (query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }
}