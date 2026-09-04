import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'

// Mock the auth service
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
  },
}))

// Test component that uses AuthContext
function TestComponent({ onLoginResult }) {
  const { user, isAuthenticated, login, logout } = useAuth()
  const accessToken = localStorage.getItem('access_token') || 'null'
  return (
    <div>
      <span data-testid="user">{user ? user.name : 'null'}</span>
      <span data-testid="authenticated">{isAuthenticated ? 'true' : 'false'}</span>
      <span data-testid="access-token">{accessToken}</span>
      <button onClick={() => login('test@example.com', 'password').then(onLoginResult).catch(() => {})} data-testid="login-btn">Login</button>
      <button onClick={logout} data-testid="logout-btn">Logout</button>
    </div>
  )
}

function renderWithAuth(ui, props = {}) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with no user when no tokens in localStorage', async () => {
    authService.getMe.mockRejectedValue(new Error('No token'))
    renderWithAuth(<TestComponent />)
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('access-token')).toHaveTextContent('null')
    })
  })

  it('stores tokens and user on login', async () => {
    const mockResponse = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      user: { id: 1, name: 'Test User', email: 'test@example.com' },
    }
    authService.login.mockResolvedValue(mockResponse)
    authService.getMe.mockResolvedValue(mockResponse.user)

    renderWithAuth(<TestComponent />)

    await act(async () => {
      screen.getByTestId('login-btn').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('access-token')).toHaveTextContent('mock-access-token')
      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'mock-access-token')
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.user))
    })
  })

  it('clears tokens and user on logout', async () => {
    // Set up initial authenticated state
    localStorage.setItem('access_token', 'mock-access-token')
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Test User', email: 'test@example.com' }))
    authService.getMe.mockResolvedValue({ id: 1, name: 'Test User', email: 'test@example.com' })

    renderWithAuth(<TestComponent />)

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    })

    await act(async () => {
      screen.getByTestId('logout-btn').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      expect(localStorage.removeItem).toHaveBeenCalledWith('access_token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('user')
    })
  })

  it('handles login failure gracefully', async () => {
    authService.login.mockRejectedValue(new Error('Invalid credentials'))
    authService.getMe.mockRejectedValue(new Error('No token'))

    renderWithAuth(<TestComponent />)

    await act(async () => {
      screen.getByTestId('login-btn').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    })
  })
})