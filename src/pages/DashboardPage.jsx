import { useState } from 'react'
import Navbar from '../components/Navbar'
import ContactTable from '../components/ContactTable'
import WebDialer from '../components/WebDialer'
import CallHistory from '../components/CallHistory'

const DashboardPage = () => {
  const [selectedContact, setSelectedContact] = useState(null)
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Contact Table */}
          <div className="lg:col-span-2">
            <ContactTable onSelectContact={setSelectedContact} />
          </div>
          
          {/* Right column - Web Dialer and Call History */}
          <div className="space-y-6">
            <WebDialer selectedContact={selectedContact} />
            <CallHistory />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage