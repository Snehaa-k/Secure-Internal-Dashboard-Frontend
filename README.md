# Internal Dashboard Frontend

A secure internal dashboard with passkey authentication, contact management, and web dialer functionality.

## Features

- **Passkey Authentication**: Secure login using WebAuthn standard (no passwords)
- **Contact Management**: Searchable contact table with name, phone, and notes
- **Web Dialer**: Make and receive calls directly from the browser
- **Call History**: Track outgoing and incoming calls

## Tech Stack

- **React**: Frontend framework with Vite
- **Tailwind CSS**: Styling
- **SimpleWebAuthn**: WebAuthn implementation for passkey authentication
- **Axios**: API requests
- **React Router**: Navigation

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API server (Django) running

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd internal-dashboard-frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   VITE_API_URL=http://localhost:8000/api
   ```
   Replace the URL with your backend API server URL.

4. Start the development server:
   ```
   npm run dev
   ```

5. Build for production:
   ```
   npm run build
   ```

## Backend Requirements

This frontend application requires a Django backend with the following endpoints:

### Authentication Endpoints
- `POST /api/auth/register/options`: Get registration options for passkey
- `POST /api/auth/register/verify`: Verify registration response
- `POST /api/auth/login/options`: Get authentication options for passkey
- `POST /api/auth/login/verify`: Verify authentication response
- `GET /api/auth/validate`: Validate authentication token

### Contact Endpoints
- `GET /api/contacts`: Get all contacts
- `GET /api/contacts/:id`: Get a specific contact
- `POST /api/contacts`: Create a new contact
- `PUT /api/contacts/:id`: Update a contact
- `DELETE /api/contacts/:id`: Delete a contact

### Call Endpoints
- `POST /api/calls/dial`: Initiate a call
- `POST /api/calls/:id/hangup`: End a call
- `GET /api/calls/:id`: Get call status
- `GET /api/calls/history`: Get call history

## Browser Compatibility

WebAuthn is supported in all modern browsers:
- Chrome 67+
- Firefox 60+
- Safari 13+
- Edge 18+

## Security Considerations

- This application uses WebAuthn for passwordless authentication
- All API requests include JWT authentication
- HTTPS is required for WebAuthn to work in production
- Ensure your backend properly validates all requests