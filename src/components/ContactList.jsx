import { useState, useEffect } from 'react'
import { contactsApi, callsApi } from '../services/api'
import ContactModal from './ContactModal'
import CallModal from './CallModal'

const ContactList = ({ onCallEnd }) => {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [isCallModalOpen, setIsCallModalOpen] = useState(false)
  const [callingContact, setCallingContact] = useState(null)
  
  useEffect(() => {
    fetchContacts()
  }, [searchTerm])
  
  const fetchContacts = async () => {
    try {
      setLoading(true)
      const response = await contactsApi.getContacts({ search: searchTerm })
      const contactsData = response.data.results || response.data || []
      setContacts(Array.isArray(contactsData) ? contactsData : [])
      setError(null)
    } catch (err) {
      setError('Failed to load contacts')
      console.error('Error fetching contacts:', err)
      setContacts([])
    } finally {
      setLoading(false)
    }
  }
  
  const handleAddContact = () => {
    setEditingContact(null)
    setIsModalOpen(true)
  }
  
  const handleEditContact = (contact) => {
    setEditingContact(contact)
    setIsModalOpen(true)
  }
  
  const handleSaveContact = async (contactData) => {
    try {
      if (editingContact) {
        await contactsApi.updateContact(editingContact.id, contactData)
      } else {
        await contactsApi.createContact(contactData)
      }
      setIsModalOpen(false)
      setEditingContact(null)
      fetchContacts()
    } catch (err) {
      console.error('Error saving contact:', err)
    }
  }
  
  const handleDeleteContact = async (contactId) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await contactsApi.deleteContact(contactId)
        fetchContacts()
      } catch (err) {
        console.error('Error deleting contact:', err)
      }
    }
  }
  
  const handleCall = (contact) => {
    setCallingContact(contact)
    setIsCallModalOpen(true)
  }
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Never'
    return date.toLocaleDateString()
  }
  
  return (
    <>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Contacts ({contacts.length})
            </h3>
            <button 
              onClick={handleAddContact}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Add Contact
            </button>
          </div>
          
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Contacted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No contacts found
                    </td>
                  </tr>
                ) : (
                  Array.isArray(contacts) && contacts.map((contact) => (
                    <tr key={contact.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {contact.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {contact.phone_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {contact.email || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {contact.tag_list && contact.tag_list.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {contact.tag_list.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(contact.last_contacted)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleCall(contact)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Call
                        </button>
                        <button 
                          onClick={() => handleEditContact(contact)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteContact(contact.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )) || []
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveContact}
        contact={editingContact}
      />
      
      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => {
          setIsCallModalOpen(false)
          setCallingContact(null)
        }}
        phoneNumber={callingContact?.phone_number}
        contactName={callingContact?.name}
        onCallEnd={() => {
          if (onCallEnd) onCallEnd()
          fetchContacts() // Refresh contacts to update last_contacted
        }}
      />
    </>
  )
}

export default ContactList