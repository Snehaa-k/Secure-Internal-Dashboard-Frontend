import axios from 'axios'

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: true,  // Include cookies in requests
})

// Add request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Contact API
export const contactsApi = {
  getContacts: (params) => api.get('/contacts/', { params }),
  getContact: (id) => api.get(`/contacts/${id}/`),
  createContact: (data) => api.post('/contacts/', data),
  updateContact: (id, data) => api.put(`/contacts/${id}/`, data),
  deleteContact: (id) => api.delete(`/contacts/${id}/`),
}

// Call API
export const callsApi = {
  initiateCall: (phoneNumber, options = {}) => api.post('/voice/calls/dial/', { phone_number: phoneNumber, ...options }),
  endCall: (callId) => api.post(`/voice/calls/${callId}/hangup/`),
  getCallStatus: (callId) => api.get(`/voice/calls/${callId}/`),
  getCallHistory: (params) => api.get('/voice/calls/history/', { params }),
  getAccessToken: () => api.get('/voice/token/'),
}

export default api