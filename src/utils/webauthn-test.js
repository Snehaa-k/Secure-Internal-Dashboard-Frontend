import api from '../services/api';
import { base64URLToArrayBuffer, arrayBufferToBase64URL } from './base64utils';

export async function testWebAuthnRegistration(username) {
  try {
    console.log('Starting WebAuthn registration test for:', username);
    
    // 1. Get registration options from server
    console.log('Requesting registration options...');
    const optionsResponse = await api.post('/auth/register/options', { username });
    console.log('Registration options received:', optionsResponse.data);
    
    // 2. Prepare options for WebAuthn API
    const publicKeyOptions = optionsResponse.data.publicKey || optionsResponse.data;
    
    console.log('Public key options before conversion:', JSON.stringify(publicKeyOptions));
    
    // Check if challenge exists
    if (!publicKeyOptions.challenge) {
      throw new Error('Challenge is missing in the registration options');
    }
    
    // Convert challenge from base64url to ArrayBuffer
    if (typeof publicKeyOptions.challenge === 'string') {
      publicKeyOptions.challenge = base64URLToArrayBuffer(publicKeyOptions.challenge);
    }
    
    // Convert user.id from base64url to ArrayBuffer
    if (publicKeyOptions.user && typeof publicKeyOptions.user.id === 'string') {
      publicKeyOptions.user.id = base64URLToArrayBuffer(publicKeyOptions.user.id);
    }
    
    // 3. Create credential using native WebAuthn API
    console.log('Creating credential with options:', publicKeyOptions);
    const credential = await navigator.credentials.create({
      publicKey: publicKeyOptions
    });
    
    // 4. Format the credential for the server
    const attestationResponse = {
      id: credential.id,
      rawId: arrayBufferToBase64URL(credential.rawId),
      type: credential.type,
      response: {
        attestationObject: arrayBufferToBase64URL(credential.response.attestationObject),
        clientDataJSON: arrayBufferToBase64URL(credential.response.clientDataJSON)
      }
    };
    
    console.log('Credential created:', attestationResponse);
    
    // 5. Verify registration with server
    console.log('Verifying registration...');
    const verifyResponse = await api.post('/auth/register/verify', {
      attestationResponse,
      username
    });
    console.log('Verification response:', verifyResponse.data);
    
    return {
      success: true,
      data: verifyResponse.data
    };
  } catch (error) {
    console.error('WebAuthn registration test failed:', error);
    return {
      success: false,
      error: error.message || 'Registration failed'
    };
  }
}

export async function testWebAuthnAuthentication(username) {
  try {
    console.log('Starting WebAuthn authentication test for:', username);
    
    // 1. Get authentication options from server
    console.log('Requesting authentication options...');
    const optionsResponse = await api.post('/auth/login/options', { username });
    console.log('Authentication options received:', optionsResponse.data);
    
    // 2. Prepare options for WebAuthn API
    const publicKeyOptions = optionsResponse.data.publicKey || optionsResponse.data;
    
    console.log('Public key options before conversion:', JSON.stringify(publicKeyOptions));
    
    // Check if challenge exists
    if (!publicKeyOptions.challenge) {
      throw new Error('Challenge is missing in the authentication options');
    }
    
    // Convert challenge from base64url to ArrayBuffer
    if (typeof publicKeyOptions.challenge === 'string') {
      publicKeyOptions.challenge = base64URLToArrayBuffer(publicKeyOptions.challenge);
    }
    
    // Convert allowCredentials ids from base64url to ArrayBuffer
    if (publicKeyOptions.allowCredentials && Array.isArray(publicKeyOptions.allowCredentials)) {
      publicKeyOptions.allowCredentials = publicKeyOptions.allowCredentials.map(credential => {
        if (typeof credential.id === 'string') {
          return { 
            ...credential, 
            id: base64URLToArrayBuffer(credential.id),
            transports: credential.transports || ['internal']
          };
        }
        return credential;
      });
    }
    
    // 3. Get credential using native WebAuthn API
    console.log('Getting credential with options:', publicKeyOptions);
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyOptions
    });
    
    // 4. Format the assertion for the server
    const assertionResponse = {
      id: assertion.id,
      rawId: arrayBufferToBase64URL(assertion.rawId),
      type: assertion.type,
      response: {
        authenticatorData: arrayBufferToBase64URL(assertion.response.authenticatorData),
        clientDataJSON: arrayBufferToBase64URL(assertion.response.clientDataJSON),
        signature: arrayBufferToBase64URL(assertion.response.signature),
        userHandle: assertion.response.userHandle ? arrayBufferToBase64URL(assertion.response.userHandle) : null
      }
    };
    
    console.log('Assertion created:', assertionResponse);
    
    // 5. Verify authentication with server
    console.log('Verifying authentication...');
    const verifyResponse = await api.post('/auth/login/verify', {
      assertionResponse,
      username
    });
    console.log('Verification response:', verifyResponse.data);
    
    return {
      success: true,
      data: verifyResponse.data
    };
  } catch (error) {
    console.error('WebAuthn authentication test failed:', error);
    return {
      success: false,
      error: error.message || 'Authentication failed'
    };
  }
}