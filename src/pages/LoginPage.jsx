import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { authenticateWithPasskey, registerPasskey, isAuthenticated } = useAuth()

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let result
      
      if (isRegistering) {
        // Register new passkey
        result = await registerPasskey(username)
      } else {
        // Authenticate with existing passkey
        result = await authenticateWithPasskey(username)
      }

      if (!result.success) {
        setError(result.error || 'Authentication failed')
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isRegistering ? 'Register New Passkey' : 'Login with Passkey'}
        </h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              {loading ? 'Processing...' : isRegistering ? 'Register' : 'Login'}
            </button>
            
            <button
              type="button"
              className="text-blue-500 hover:text-blue-800"
              onClick={() => setIsRegistering(!isRegistering)}
              disabled={loading}
            >
              {isRegistering ? 'Back to Login' : 'Register New User'}
            </button>
          </div>
        </form>
        
        <div className="text-center text-sm">
          <p className="text-gray-600">
            This application uses passkeys for secure authentication.
          </p>
          <p className="text-gray-600 mt-2">
            Your device will prompt you to use a biometric sensor or PIN.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage