import axios from 'axios'

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
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
  getContacts: (params) => api.get('/contacts', { params }),
  getContact: (id) => api.get(`/contacts/${id}`),
  createContact: (data) => api.post('/contacts', data),
  updateContact: (id, data) => api.put(`/contacts/${id}`, data),
  deleteContact: (id) => api.delete(`/contacts/${id}`),
}

// Call API
export const callsApi = {
  initiateCall: (phoneNumber) => api.post('/calls/dial', { phoneNumber }),
  endCall: (callId) => api.post(`/calls/${callId}/hangup`),
  getCallStatus: (callId) => api.get(`/calls/${callId}`),
  getCallHistory: (params) => api.get('/calls/history', { params }),
}

export default api