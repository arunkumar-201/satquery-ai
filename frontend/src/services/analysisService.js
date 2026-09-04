import api from './api'

export const analysisService = {
  async list(projectId) {
    const { data } = await api.get(`/api/analysis/project/${projectId}`)
    return data
  },

  async get(analysisId) {
    const { data } = await api.get(`/api/analysis/${analysisId}`)
    return data
  },

  async history() {
    const { data } = await api.get('/api/analysis/history/user')
    return data
  },

  async exportProject(projectId) {
    const { data } = await api.get(`/api/export/project/${projectId}/json`, {
      responseType: 'blob',
    })
    return data
  },

  async exportAnalysis(analysisId) {
    const { data } = await api.get(`/api/export/analysis/${analysisId}/json`, {
      responseType: 'blob',
    })
    return data
  },
}