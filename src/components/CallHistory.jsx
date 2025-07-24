import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { callsApi } from '../services/api'

const CallHistory = forwardRef((props, ref) => {
  const [callHistory, setCallHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  
  const fetchCallHistory = async () => {
    try {
      setLoading(true)
      const response = await callsApi.getCallHistory()
      setCallHistory(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to load call history')
      console.error('Error fetching call history:', err)
    } finally {
      setLoading(false)
    }
  }

  useImperativeHandle(ref, () => ({
    refreshHistory: fetchCallHistory
  }))

  useEffect(() => {
    fetchCallHistory()
    
    // Refresh call history every 30 seconds
    const interval = setInterval(fetchCallHistory, 30000)
    
    return () => clearInterval(interval)
  }, [])
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    
    const date = new Date(dateString)
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date'
    }
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Recent Calls
        </h3>
      </div>
      
      {loading ? (
        <div className="p-4 text-center">Loading call history...</div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {callHistory.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    No call history found
                  </td>
                </tr>
              ) : (
                callHistory.map((call) => (
                  <tr key={call.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {call.contact_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {call.phone_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(call.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        call.direction === 'outgoing' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {call.direction === 'outgoing' ? 'Outgoing' : 'Incoming'} - {call.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
})

export default CallHistory