import { useState, useEffect } from 'react'
import { callsApi } from '../services/api'
import twilioVoice from '../services/twilioVoice'

const CallModal = ({ isOpen, onClose, phoneNumber, contactName, onCallEnd }) => {
  const [callStatus, setCallStatus] = useState('dialing')
  const [currentCallId, setCurrentCallId] = useState(null)
  const [callDuration, setCallDuration] = useState(0)
  const [timerInterval, setTimerInterval] = useState(null)
  const [micPermission, setMicPermission] = useState('pending')
  const [isMuted, setIsMuted] = useState(false)
  const [isVoiceReady, setIsVoiceReady] = useState(false)

  useEffect(() => {
    if (isOpen && phoneNumber) {
      requestMicrophonePermission()
    }
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [isOpen, phoneNumber])

  const requestMicrophonePermission = async () => {
    try {
      setMicPermission('requesting')
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Stop the stream immediately (we just needed permission)
      stream.getTracks().forEach(track => track.stop())
      
      setMicPermission('granted')
      
      // Initialize Twilio Voice SDK
      await initializeTwilioVoice()
      
    } catch (error) {
      console.error('Microphone permission denied:', error)
      setMicPermission('denied')
      setCallStatus('failed')
    }
  }

  const initializeTwilioVoice = async () => {
    try {
      // Get access token from backend
      const response = await callsApi.getAccessToken()
      console.log('Access token response:', response.data)
      
      const { token } = response.data
      
      if (!token) {
        throw new Error('No access token received from backend')
      }
      
      console.log('Initializing Twilio with token:', token.substring(0, 50) + '...')
      
      // Initialize Twilio Voice SDK
      const initialized = await twilioVoice.initialize(token)
      
      if (initialized) {
        setIsVoiceReady(true)
        initiateVoiceCall()
      } else {
        setCallStatus('failed')
      }
    } catch (error) {
      console.error('Failed to initialize Twilio Voice:', error)
      setCallStatus('failed')
    }
  }

  const initiateVoiceCall = async () => {
    try {
      setCallStatus('dialing')
      
      // Create call record in backend first (mark as Voice SDK call)
      const callRecord = await callsApi.initiateCall(phoneNumber, { voice_sdk: true })
      setCurrentCallId(callRecord.data.call_id)
      
      // Make call using Twilio Voice SDK
      const call = await twilioVoice.makeCall(phoneNumber)
      
      // Set up call event listeners
      call.on('accept', () => {
        setCallStatus('in-progress')
        startTimer()
      })
      
      call.on('disconnect', () => {
        setCallStatus('completed')
        stopTimer()
        // End call in backend
        if (currentCallId) {
          callsApi.endCall(currentCallId).catch(console.error)
        }
        setTimeout(() => {
          onClose()
          resetCall()
          if (onCallEnd) onCallEnd()
        }, 2000)
      })
      
      call.on('cancel', () => {
        setCallStatus('canceled')
        stopTimer()
        if (currentCallId) {
          callsApi.endCall(currentCallId).catch(console.error)
        }
        setTimeout(() => {
          onClose()
          resetCall()
          if (onCallEnd) onCallEnd()
        }, 2000)
      })
      
      call.on('reject', () => {
        setCallStatus('busy')
        stopTimer()
        if (currentCallId) {
          callsApi.endCall(currentCallId).catch(console.error)
        }
        setTimeout(() => {
          onClose()
          resetCall()
          if (onCallEnd) onCallEnd()
        }, 2000)
      })
      
      setCallStatus('ringing')
      
    } catch (error) {
      console.error('Failed to make call:', error)
      setCallStatus('failed')
      setTimeout(() => {
        onClose()
        resetCall()
      }, 2000)
    }
  }

  const startTimer = () => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)
    setTimerInterval(timer)
  }

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
  }

  useEffect(() => {
    let statusInterval
    
    if (currentCallId && ['queued', 'ringing', 'in-progress'].includes(callStatus)) {
      statusInterval = setInterval(async () => {
        try {
          const response = await callsApi.getCallStatus(currentCallId)
          const newStatus = response.data.call?.status || response.data.status
          
          setCallStatus(newStatus)
          
          if (newStatus === 'in-progress' && callStatus !== 'in-progress') {
            const timer = setInterval(() => {
              setCallDuration(prev => prev + 1)
            }, 1000)
            setTimerInterval(timer)
          }
          
          if (['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(newStatus)) {
            if (timerInterval) {
              clearInterval(timerInterval)
              setTimerInterval(null)
            }
            setTimeout(() => {
              onClose()
              resetCall()
            }, 2000)
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

  const initiateCall = async () => {
    try {
      setCallStatus('dialing')
      const response = await callsApi.initiateCall(phoneNumber)
      setCurrentCallId(response.data.call_id)
      setCallStatus(response.data.status || 'queued')
    } catch (error) {
      console.error('Error initiating call:', error)
      setCallStatus('failed')
      setTimeout(() => {
        onClose()
        resetCall()
      }, 2000)
    }
  }

  const endCall = async () => {
    twilioVoice.hangup()
    setCallStatus('completed')
    stopTimer()
    
    // End call in backend
    if (currentCallId) {
      try {
        await callsApi.endCall(currentCallId)
      } catch (error) {
        console.error('Error ending call in backend:', error)
      }
    }
    
    setTimeout(() => {
      onClose()
      resetCall()
      if (onCallEnd) onCallEnd()
    }, 1000)
  }

  const toggleMute = () => {
    if (isMuted) {
      twilioVoice.unmute()
      setIsMuted(false)
    } else {
      twilioVoice.mute()
      setIsMuted(true)
    }
  }

  const resetCall = () => {
    setCallStatus('dialing')
    setCurrentCallId(null)
    setCallDuration(0)
    setMicPermission('pending')
    setIsMuted(false)
    setIsVoiceReady(false)
    stopTimer()
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusText = () => {
    if (micPermission === 'requesting') {
      return 'Requesting microphone access...'
    }
    if (micPermission === 'denied') {
      return 'Microphone access denied'
    }
    if (micPermission === 'granted' && !isVoiceReady) {
      return 'Initializing voice connection...'
    }
    
    switch (callStatus) {
      case 'dialing':
      case 'queued':
        return 'Dialing...'
      case 'ringing':
        return 'Ringing...'
      case 'in-progress':
        return `Connected - ${formatDuration(callDuration)}`
      case 'completed':
        return 'Call Ended'
      case 'failed':
        return 'Call Failed'
      case 'busy':
        return 'Line Busy'
      case 'no-answer':
        return 'No Answer'
      case 'canceled':
        return 'Call Canceled'
      default:
        return callStatus
    }
  }

  const getStatusColor = () => {
    switch (callStatus) {
      case 'in-progress':
        return 'text-green-500'
      case 'failed':
      case 'busy':
      case 'no-answer':
        return 'text-red-500'
      case 'completed':
      case 'canceled':
        return 'text-gray-500'
      default:
        return 'text-blue-500'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-80 text-center">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">{contactName || 'Unknown'}</h2>
          <p className="text-gray-600">{phoneNumber}</p>
        </div>
        
        <div className="mb-8">
          <p className={`text-lg font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </p>
        </div>
        
        <div className="flex justify-center space-x-4">
          {callStatus === 'in-progress' && (
            <button
              onClick={toggleMute}
              className={`${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500 hover:bg-gray-600'} text-white rounded-full h-12 w-12 flex items-center justify-center`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMuted ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                )}
              </svg>
            </button>
          )}
          
          <button
            onClick={endCall}
            disabled={micPermission === 'requesting' || !isVoiceReady}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full h-16 w-16 flex items-center justify-center disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CallModal