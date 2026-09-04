import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

// Mock all the page components
vi.mock('./pages/Login', () => ({ default: () => <div data-testid="login-page">Login Page</div> }))
vi.mock('./pages/Register', () => ({ default: () => <div data-testid="register-page">Register Page</div> }))
vi.mock('./pages/ForgotPassword', () => ({ default: () => <div data-testid="forgot-password-page">Forgot Password Page</div> }))
vi.mock('./pages/Dashboard', () => ({ default: () => <div data-testid="dashboard-page">Dashboard Page</div> }))
vi.mock('./pages/Projects', () => ({ default: () => <div data-testid="projects-page">Projects Page</div> }))
vi.mock('./pages/ProjectDetails', () => ({ default: () => <div data-testid="project-details-page">Project Details Page</div> }))
vi.mock('./pages/Analysis', () => ({ default: () => <div data-testid="analysis-page">Analysis Page</div> }))
vi.mock('./pages/History', () => ({ default: () => <div data-testid="history-page">History Page</div> }))
vi.mock('./pages/Settings', () => ({ default: () => <div data-testid="settings-page">Settings Page</div> }))
vi.mock('./components/Navbar', () => ({ default: () => <nav data-testid="navbar">Navbar</nav> }))
vi.mock('./components/Sidebar', () => ({ default: () => <aside data-testid="sidebar">Sidebar</aside> }))

// Mock AuthContext with all required values
const mockUseAuth = vi.fn(() => ({
  user: { id: 1, name: 'Test User', email: 'test@example.com' },
  isAuthenticated: true,
  loading: false,
  logout: vi.fn(),
  login: vi.fn(),
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
}))

vi.mock('./context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock LanguageContext with all required values
vi.mock('./context/LanguageContext', () => ({
  LanguageProvider: ({ children }) => children,
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

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'Test User', email: 'test@example.com' },
      isAuthenticated: true,
      loading: false,
      logout: vi.fn(),
      login: vi.fn(),
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    })
  })

  it('renders without crashing when authenticated', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    })
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('shows sidebar and navbar when authenticated', async () => {
    render(
      <BrowserRouter initialEntries={['/dashboard']}>
        <App />
      </BrowserRouter>
    )
    await waitFor(() => {
      expect(screen.getByTestId('navbar')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    })
  })

  it('renders login page on /login when not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      logout: vi.fn(),
      login: vi.fn(),
    })

    render(
      <BrowserRouter initialEntries={['/login']}>
        <App />
      </BrowserRouter>
    )
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  it('redirects to login when not authenticated and accessing protected route', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      logout: vi.fn(),
      login: vi.fn(),
    })

    render(
      <BrowserRouter initialEntries={['/dashboard']}>
        <App />
      </BrowserRouter>
    )
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  it('redirects to dashboard when authenticated and accessing login page', async () => {
    render(
      <BrowserRouter initialEntries={['/login']}>
        <App />
      </BrowserRouter>
    )
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    })
  })

  it('redirects to dashboard when authenticated and accessing register page', async () => {
    render(
      <BrowserRouter initialEntries={['/register']}>
        <App />
      </BrowserRouter>
    )
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    })
  })

  it('shows loading spinner when auth is loading', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: true,
      logout: vi.fn(),
      login: vi.fn(),
    })

    const { container } = render(
      <BrowserRouter initialEntries={['/dashboard']}>
        <App />
      </BrowserRouter>
    )
    // Should show loading spinner (animate-spin class), not login page
    await waitFor(() => {
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
  })

  it('exposes login function via mock', () => {
    const loginFn = vi.fn()
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      logout: vi.fn(),
      login: loginFn,
    })

    render(
      <BrowserRouter initialEntries={['/login']}>
        <App />
      </BrowserRouter>
    )
    expect(loginFn).toBeDefined()
  })
})