import api from './api'

export const authService = {
  async register(name, email, password, confirmPassword) {
    const { data } = await api.post('/api/auth/register', {
      name,
      email,
      password,
      confirm_password: confirmPassword,
    })

    return data
  },

  async login(email, password) {
    const { data } = await api.post('/api/auth/login', {
      email,
      password,
    })

    return data
  },

  async getMe() {
    const { data } = await api.get('/api/auth/me')

    return data
  },

  async logout() {
    await api.post('/api/auth/logout')
  },

  async updateProfile(profile) {
    const { data } = await api.put('/api/auth/profile', profile)
    return data
  },

  async changePassword(passwords) {
    const { data } = await api.put('/api/auth/password', passwords)
    return data
  },

  async updateNotifications(preferences) {
    localStorage.setItem('notification_preferences', JSON.stringify(preferences))
    return preferences
  },

  async updateAppearance(preferences) {
    localStorage.setItem('appearance_preferences', JSON.stringify(preferences))
    return preferences
  },
}

export default authService