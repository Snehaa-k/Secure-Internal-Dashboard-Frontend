import { createContext, useState, useContext, useEffect } from 'react'
import { startAuthentication, startRegistration } from '@simplewebauthn/browser'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (token) {
          // Validate token with backend
          const response = await axios.get('/api/auth/validate', {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          if (response.data.valid) {
            setIsAuthenticated(true)
            setUser(response.data.user)
          } else {
            localStorage.removeItem('authToken')
          }
        }
      } catch (error) {
        console.error('Auth validation error:', error)
        localStorage.removeItem('authToken')
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])
  
  // Register a new passkey
  const registerPasskey = async (username) => {
    try {
      // 1. Get registration options from server
      const optionsResponse = await axios.post('/api/auth/register/options', { username })
      
      // 2. Pass options to browser's passkey API
      const attResp = await startRegistration(optionsResponse.data)
      
      // 3. Send response to server for verification
      const verificationResponse = await axios.post('/api/auth/register/verify', {
        attestationResponse: attResp,
        username
      })
      
      // 4. If successful, set auth state
      if (verificationResponse.data.success) {
        localStorage.setItem('authToken', verificationResponse.data.token)
        setIsAuthenticated(true)
        setUser(verificationResponse.data.user)
        return { success: true }
      }
      
      return { success: false, error: 'Registration failed' }
    } catch (error) {
      console.error('Passkey registration error:', error)
      return { success: false, error: error.message || 'Registration failed' }
    }
  }
  
  // Authenticate with passkey
  const authenticateWithPasskey = async (username) => {
    try {
      // 1. Get authentication options from server
      const optionsResponse = await axios.post('/api/auth/login/options', { username })
      
      // 2. Pass options to browser's passkey API
      const authResp = await startAuthentication(optionsResponse.data)
      
      // 3. Send response to server for verification
      const verificationResponse = await axios.post('/api/auth/login/verify', {
        assertionResponse: authResp,
        username
      })
      
      // 4. If successful, set auth state
      if (verificationResponse.data.success) {
        localStorage.setItem('authToken', verificationResponse.data.token)
        setIsAuthenticated(true)
        setUser(verificationResponse.data.user)
        return { success: true }
      }
      
      return { success: false, error: 'Authentication failed' }
    } catch (error) {
      console.error('Passkey authentication error:', error)
      return { success: false, error: error.message || 'Authentication failed' }
    }
  }
  
  // Logout
  const logout = () => {
    localStorage.removeItem('authToken')
    setIsAuthenticated(false)
    setUser(null)
  }
  
  const value = {
    isAuthenticated,
    user,
    loading,
    registerPasskey,
    authenticateWithPasskey,
    logout
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}