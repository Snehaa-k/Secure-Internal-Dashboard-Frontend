import { useState, useEffect } from 'react'

const ContactModal = ({ isOpen, onClose, onSave, contact = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    email: '',
    tags: ''
  })
  
  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        phone_number: contact.phone_number || '',
        email: contact.email || '',
        tags: contact.tags || ''
      })
    } else {
      setFormData({
        name: '',
        phone_number: '',
        email: '',
        tags: ''
      })
    }
  }, [contact, isOpen])
  
  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {contact ? 'Edit Contact' : 'Add Contact'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="work, client, friend"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          

          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {contact ? 'Update' : 'Add'} Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ContactModal