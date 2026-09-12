import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: false,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Only set Content-Type to application/json for non-FormData requests.
    // FormData must be sent without manual Content-Type so browser generates multipart boundary.
    if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json'
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') {
      error.message = detail
    } else if (Array.isArray(detail) && detail.length > 0) {
      error.message = detail
        .map((d) => d.msg || (typeof d === 'string' ? d : JSON.stringify(d)))
        .join(', ')
    } else if (detail && typeof detail === 'object') {
      error.message = detail.msg || JSON.stringify(detail)
    }
    return Promise.reject(error)
  }
)

export default api