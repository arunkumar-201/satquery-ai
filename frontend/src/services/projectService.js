import api from './api'

export const projectService = {
  async list() {
    const { data } = await api.get('/api/projects')
    return data
  },

  async create(nameOrProject, description) {
    const payload = typeof nameOrProject === 'object'
      ? { name: nameOrProject.name, description: nameOrProject.description }
      : { name: nameOrProject, description }
    const { data } = await api.post('/api/projects', payload)
    return data
  },

  async get(projectId) {
    const { data } = await api.get(`/api/projects/${projectId}`)
    return data
  },

  async delete(projectId) {
    const { data } = await api.delete(`/api/projects/${projectId}`)
    return data
  },
}