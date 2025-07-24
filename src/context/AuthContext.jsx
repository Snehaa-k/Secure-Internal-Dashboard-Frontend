import { createContext, useState, useContext, useEffect } from 'react'
import api from '../services/api'

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
          const response = await api.get('/auth/validate')
          
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
  
  // Helper function to convert base64url to ArrayBuffer
  function base64UrlToArrayBuffer(base64url) {
    if (!base64url) {
      throw new Error('base64url string is undefined or empty')
    }
    
    // Add padding if needed
    const padding = '='.repeat((4 - (base64url.length % 4)) % 4)
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding
    
    // Convert to binary string
    const binaryString = atob(base64)
    
    // Convert to ArrayBuffer
    const buffer = new ArrayBuffer(binaryString.length)
    const view = new Uint8Array(buffer)
    for (let i = 0; i < binaryString.length; i++) {
      view[i] = binaryString.charCodeAt(i)
    }
    
    return buffer
  }
  
  // Helper function to convert ArrayBuffer to base64url
  function arrayBufferToBase64Url(buffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }
  
  // Register a new passkey
  const registerPasskey = async (username) => {
    try {
      console.log('Requesting registration options for:', username)
      const optionsResponse = await api.post('/auth/register/options', { username })
      console.log('Received registration options:', optionsResponse.data)
      
      // Extract the publicKey options
      const publicKeyOptions = optionsResponse.data
      if (!publicKeyOptions) {
        throw new Error('No publicKey in server response')
      }
      
      // Convert challenge and user ID to ArrayBuffer
      const challengeBuffer = base64UrlToArrayBuffer(publicKeyOptions.challenge)
      const userIdBuffer = base64UrlToArrayBuffer(publicKeyOptions.user.id)
      
      // Create WebAuthn options
      const webAuthnOptions = {
        ...publicKeyOptions,
        challenge: challengeBuffer,
        user: {
          ...publicKeyOptions.user,
          id: userIdBuffer
        }
      }
      
      console.log('Creating credential with options:', webAuthnOptions)
      
      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: webAuthnOptions
      })
      
      console.log('Credential created:', credential)
      
      // Format credential for server
      const attestationResponse = {
        id: credential.id,
        rawId: arrayBufferToBase64Url(credential.rawId),
        response: {
          clientDataJSON: arrayBufferToBase64Url(credential.response.clientDataJSON),
          attestationObject: arrayBufferToBase64Url(credential.response.attestationObject)
        },
        type: credential.type
      }
      
      console.log('Formatted credential for server:', attestationResponse)
      
      // Verify with server
      const verifyResponse = await api.post('/auth/register/verify', {
        attestationResponse,
        username
      })
      
      console.log('Verification response:', verifyResponse.data)
      
      // If successful, set auth state
      if (verifyResponse.data.success) {
        localStorage.setItem('authToken', verifyResponse.data.token)
        setIsAuthenticated(true)
        setUser(verifyResponse.data.user)
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
      console.log('Requesting authentication options for:', username)
      const optionsResponse = await api.post('/auth/login/options', { username })
      console.log('Received authentication options:', optionsResponse.data)
      
      // Extract the publicKey options
      const publicKeyOptions = optionsResponse.data
      
      // Convert challenge to ArrayBuffer
      const challengeBuffer = base64UrlToArrayBuffer(publicKeyOptions.challenge)
      
      // Convert allowCredentials ids to ArrayBuffer if present
      let allowCredentials = []
      if (publicKeyOptions.allowCredentials) {
        allowCredentials = publicKeyOptions.allowCredentials.map(cred => {
          console.log('Converting credential ID:', cred.id)
          return {
            ...cred,
            id: base64UrlToArrayBuffer(cred.id)
          }
        })
      }
      
      console.log('Converted allowCredentials:', allowCredentials)
      
      // Create WebAuthn options
      const webAuthnOptions = {
        ...publicKeyOptions,
        challenge: challengeBuffer,
        allowCredentials: allowCredentials
      }
      
      console.log('Getting credential with options:', webAuthnOptions)
      
      // Get credential
      const assertion = await navigator.credentials.get({
        publicKey: webAuthnOptions
      })
      
      console.log('Assertion created:', assertion)
      
      // Format assertion for server
      const assertionResponse = {
        id: assertion.id,
        rawId: arrayBufferToBase64Url(assertion.rawId),
        response: {
          clientDataJSON: arrayBufferToBase64Url(assertion.response.clientDataJSON),
          authenticatorData: arrayBufferToBase64Url(assertion.response.authenticatorData),
          signature: arrayBufferToBase64Url(assertion.response.signature),
          userHandle: assertion.response.userHandle ? arrayBufferToBase64Url(assertion.response.userHandle) : null
        },
        type: assertion.type
      }
      
      console.log('Formatted assertion for server:', assertionResponse)
      
      // Verify with server
      const verifyResponse = await api.post('/auth/login/verify', {
        assertionResponse,
        username
      })
      
      console.log('Verification response:', verifyResponse.data)
      
      // If successful, set auth state
      if (verifyResponse.data.success) {
        localStorage.setItem('authToken', verifyResponse.data.token)
        setIsAuthenticated(true)
        setUser(verifyResponse.data.user)
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