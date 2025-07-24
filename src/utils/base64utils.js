// Helper function to convert base64url to ArrayBuffer
export function base64URLToArrayBuffer(base64url) {
  if (!base64url) {
    throw new Error('base64url string is undefined or empty');
  }
  
  try {
    // Convert base64url to base64
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - base64url.length % 4) % 4);
    
    // Convert base64 to binary string
    const binaryString = window.atob(base64);
    
    // Convert binary string to ArrayBuffer
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
  } catch (error) {
    console.error('Error converting base64url to ArrayBuffer:', error, base64url);
    throw new Error(`Failed to convert base64url to ArrayBuffer: ${error.message}`);
  }
}

// Helper function to convert ArrayBuffer to base64url
export function arrayBufferToBase64URL(buffer) {
  // Convert ArrayBuffer to binary string
  const bytes = new Uint8Array(buffer);
  let binaryString = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  
  // Convert binary string to base64
  const base64 = window.btoa(binaryString);
  
  // Convert base64 to base64url
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}