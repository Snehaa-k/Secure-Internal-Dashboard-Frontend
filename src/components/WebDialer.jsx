import { useState, useEffect } from 'react'
import { callsApi } from '../services/api'

const WebDialer = ({ selectedContact }) => {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [callStatus, setCallStatus] = useState('idle') // idle, dialing, ringing, connected, ended
  const [currentCallId, setCurrentCallId] = useState(null)
  const [callDuration, setCallDuration] = useState(0)
  const [timerInterval, setTimerInterval] = useState(null)
  
  // Update phone number when a contact is selected
  useEffect(() => {
    if (selectedContact && selectedContact.phone) {
      setPhoneNumber(selectedContact.phone)
    }
  }, [selectedContact])
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [timerInterval])
  
  // Poll for call status updates
  useEffect(() => {
    let statusInterval
    
    if (currentCallId && ['dialing', 'ringing', 'connected'].includes(callStatus)) {
      statusInterval = setInterval(async () => {
        try {
          const response = await callsApi.getCallStatus(currentCallId)
          const newStatus = response.data.status
          
          setCallStatus(newStatus)
          
          // Start timer when call connects
          if (newStatus === 'connected' && callStatus !== 'connected') {
            const timer = setInterval(() => {
              setCallDuration(prev => prev + 1)
            }, 1000)
            setTimerInterval(timer)
          }
          
          // Stop timer when call ends
          if (newStatus === 'ended' && callStatus !== 'ended') {
            if (timerInterval) {
              clearInterval(timerInterval)
              setTimerInterval(null)
            }
          }
        } catch (error) {
          console.error('Error fetching call status:', error)
        }
      }, 2000)
    }
    
    return () => {
      if (statusInterval) {
        clearInterval(statusInterval)
      }
    }
  }, [currentCallId, callStatus, timerInterval])
  
  const handleNumberInput = (digit) => {
    setPhoneNumber(prev => prev + digit)
  }
  
  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1))
  }
  
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  const initiateCall = async () => {
    if (!phoneNumber || phoneNumber.length < 5) {
      return
    }
    
    try {
      setCallStatus('dialing')
      const response = await callsApi.initiateCall(phoneNumber)
      setCurrentCallId(response.data.callId)
      setCallStatus(response.data.status)
    } catch (error) {
      console.error('Error initiating call:', error)
      setCallStatus('idle')
    }
  }
  
  const endCall = async () => {
    if (!currentCallId) return
    
    try {
      await callsApi.endCall(currentCallId)
      setCallStatus('ended')
      
      if (timerInterval) {
        clearInterval(timerInterval)
        setTimerInterval(null)
      }
      
      // Reset after a short delay
      setTimeout(() => {
        setCallStatus('idle')
        setCurrentCallId(null)
        setCallDuration(0)
      }, 3000)
    } catch (error) {
      console.error('Error ending call:', error)
    }
  }
  
  const renderDialpad = () => {
    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']
    
    return (
      <div className="grid grid-cols-3 gap-4 mt-4">
        {digits.map(digit => (
          <button
            key={digit}
            className="bg-gray-200 hover:bg-gray-300 rounded-full h-12 w-12 flex items-center justify-center text-xl font-medium"
            onClick={() => handleNumberInput(digit)}
            disabled={callStatus !== 'idle' && callStatus !== 'connected'}
          >
            {digit}
          </button>
        ))}
      </div>
    )
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xl"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={callStatus !== 'idle'}
          />
          {phoneNumber && callStatus === 'idle' && (
            <button
              onClick={handleBackspace}
              className="ml-2 p-2 text-gray-500 hover:text-gray-700"
            >
              ⌫
            </button>
          )}
        </div>
        
        {callStatus !== 'idle' && (
          <div className="text-center py-2">
            {callStatus === 'dialing' && <p className="text-blue-500">Dialing...</p>}
            {callStatus === 'ringing' && <p className="text-blue-500">Ringing...</p>}
            {callStatus === 'connected' && (
              <p className="text-green-500">
                Connected - {formatDuration(callDuration)}
              </p>
            )}
            {callStatus === 'ended' && <p className="text-red-500">Call Ended</p>}
          </div>
        )}
      </div>
      
      {renderDialpad()}
      
      <div className="mt-6 flex justify-center">
        {callStatus === 'idle' ? (
          <button
            onClick={initiateCall}
            disabled={!phoneNumber}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full h-16 w-16 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={endCall}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full h-16 w-16 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default WebDialer