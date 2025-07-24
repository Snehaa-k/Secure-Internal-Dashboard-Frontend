import { Device } from '@twilio/voice-sdk'

class TwilioVoiceService {
  constructor() {
    this.device = null
    this.activeCall = null
    this.isInitialized = false
  }

  async initialize(accessToken) {
    try {
      this.device = new Device(accessToken, {
        logLevel: 1,
        answerOnBridge: true
      })

      this.device.on('registered', () => {
        console.log('Twilio Device registered')
        this.isInitialized = true
      })

      this.device.on('error', (error) => {
        console.error('Twilio Device error:', error)
      })

      this.device.on('incoming', (call) => {
        console.log('Incoming call from:', call.parameters.From)
        this.activeCall = call
        this.setupCallHandlers(call)
      })

      await this.device.register()
      return true
    } catch (error) {
      console.error('Failed to initialize Twilio Device:', error)
      return false
    }
  }

  async makeCall(phoneNumber) {
    if (!this.device || !this.isInitialized) {
      throw new Error('Twilio Device not initialized')
    }

    try {
      console.log('Making call to:', phoneNumber)
      
      const call = await this.device.connect({
        params: { 
          To: phoneNumber,
          From: 'browser'
        }
      })
      
      this.activeCall = call
      this.setupCallHandlers(call)
      return call
    } catch (error) {
      console.error('Failed to make call:', error)
      throw error
    }
  }

  setupCallHandlers(call) {
    call.on('accept', () => {
      console.log('Call accepted')
    })

    call.on('disconnect', () => {
      console.log('Call disconnected')
      this.activeCall = null
    })

    call.on('cancel', () => {
      console.log('Call cancelled')
      this.activeCall = null
    })

    call.on('reject', () => {
      console.log('Call rejected')
      this.activeCall = null
    })
  }

  hangup() {
    if (this.activeCall) {
      this.activeCall.disconnect()
      this.activeCall = null
    }
  }

  mute() {
    if (this.activeCall) {
      this.activeCall.mute(true)
    }
  }

  unmute() {
    if (this.activeCall) {
      this.activeCall.mute(false)
    }
  }

  getCallStatus() {
    return this.activeCall ? this.activeCall.status() : null
  }

  destroy() {
    if (this.device) {
      this.device.destroy()
      this.device = null
      this.activeCall = null
      this.isInitialized = false
    }
  }
}

export default new TwilioVoiceService()