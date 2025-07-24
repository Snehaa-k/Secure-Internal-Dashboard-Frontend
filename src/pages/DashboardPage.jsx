import { useState, useRef } from 'react'
import Navbar from '../components/Navbar'
import ContactList from '../components/ContactList'
import WebDialer from '../components/WebDialer'
import CallHistory from '../components/CallHistory'

const DashboardPage = () => {
  const [selectedContact, setSelectedContact] = useState(null)
  const callHistoryRef = useRef(null)
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Contact List */}
          <div className="lg:col-span-2">
            <ContactList 
              onSelectContact={setSelectedContact} 
              onCallEnd={() => callHistoryRef.current?.refreshHistory()}
            />
          </div>
          
          {/* Right column - Web Dialer and Call History */}
          <div className="space-y-6">
            <WebDialer selectedContact={selectedContact} />
            <CallHistory ref={callHistoryRef} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage