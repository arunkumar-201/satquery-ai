import api from './api'

export const chatService = {
  async createSession(projectId, language = 'en') {
    const { data } = await api.post('/api/chat/sessions', { project_id: projectId, language })
    return data
  },

  async listSessions(projectId) {
    const { data } = await api.get(`/api/chat/sessions/${projectId}`)
    return data
  },

  async getMessages(sessionId) {
    const { data } = await api.get(`/api/chat/sessions/${sessionId}/messages`)
    return data
  },

  async getSession(sessionId) {
    const { data } = await api.get(`/api/chat/session/${sessionId}`)
    const messages = await this.getMessages(sessionId)
    return { ...data, messages }
  },

  async listHistory() {
    const { data } = await api.get('/api/chat/history')
    return data
  },

  async deleteSession(sessionId) {
    const { data } = await api.delete(`/api/chat/sessions/${sessionId}`)
    return data
  },

  async query(projectId, imageIds, message, language = 'en') {
    const { data } = await api.post('/api/chat/query', {
      project_id: projectId,
      image_ids: imageIds,
      message,
      language,
    })
    return data
  },

  async message(projectId, message, language = 'en') {
    const { data } = await api.post('/api/chat/message', {
      project_id: projectId,
      message,
      language,
    })
    return data
  },

  async getAIStatus() {
    const { data } = await api.get('/api/chat/ai/status')
    return data
  },
}