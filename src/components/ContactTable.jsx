import { useState, useEffect } from 'react'
import { contactsApi } from '../services/api'

const ContactTable = ({ onSelectContact }) => {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true)
        const response = await contactsApi.getContacts()
        setContacts(response.data)
        setError(null)
      } catch (err) {
        setError('Failed to load contacts')
        console.error('Error fetching contacts:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchContacts()
  }, [])
  
  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchTerm.toLowerCase()
    return (
      contact.name.toLowerCase().includes(searchLower) ||
      contact.phone.includes(searchTerm) ||
      (contact.notes && contact.notes.toLowerCase().includes(searchLower))
    )
  })
  
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="Search contacts..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {loading ? (
        <div className="p-4 text-center">Loading contacts...</div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No contacts found
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {contact.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.email || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">
                      {contact.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onSelectContact(contact)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Call
                      </button>
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
}

export default ContactTable