import api from './api'

export const imageService = {
  async upload(projectId, file, metadata = {}) {
    const formData = new FormData()
    formData.append('project_id', projectId)
    formData.append('file', file)

    if (metadata.modality) formData.append('modality', metadata.modality)
    if (metadata.sensor) formData.append('sensor', metadata.sensor)
    if (metadata.acquisition_date) formData.append('acquisition_date', metadata.acquisition_date)
    if (metadata.latitude) formData.append('latitude', metadata.latitude)
    if (metadata.longitude) formData.append('longitude', metadata.longitude)
    if (metadata.resolution) formData.append('resolution', metadata.resolution)
    if (metadata.bounding_box) formData.append('bounding_box', metadata.bounding_box)

    const { data } = await api.post('/api/images/upload', formData)
    return data
  },

  async list(projectId) {
    const { data } = await api.get(`/api/images/project/${projectId}`)
    return data
  },

  async get(imageId) {
    const { data } = await api.get(`/api/images/${imageId}`)
    return data
  },

  async delete(imageId) {
    const { data } = await api.delete(`/api/images/${imageId}`)
    return data
  },
}