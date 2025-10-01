// background.js
// This script runs in the background and manages OIDC authentication for the extension

// Authentication state
let authState = {
  projectId: null,
  appId: null,
  isAuthenticated: false,
  user: null,
  accessToken: null,
  idToken: null,
  refreshToken: null,
  tokenExpiresAt: null
};

// Update authentication state
function updateAuthState(user) {
  console.log('Updating auth state with user:', user);
  authState.isAuthenticated = true;
  authState.user = user;
  
  // Store tokens in auth state
  if (user.access_token) {
    authState.accessToken = user.access_token;
  }
  if (user.id_token) {
    authState.idToken = user.id_token;
  }
  if (user.refresh_token) {
    authState.refreshToken = user.refresh_token;
  }
  if (user.expires_at) {
    authState.tokenExpiresAt = user.expires_at;
  }

  // Broadcast state update to all popups
  broadcastStateUpdate();
}

// Clear authentication state
function clearAuthState() {
  authState = {
    projectId: authState.projectId,
    appId: authState.appId,
    isAuthenticated: false,
    user: null,
    accessToken: null,
    idToken: null,
    refreshToken: null,
    tokenExpiresAt: null
  };

  // Broadcast state update to all popups
  broadcastStateUpdate();
}

// Start the OIDC authentication flow
async function startAuthFlow(projectId, appId) {
  try {
    // Set auth state
    authState.projectId = projectId;
    authState.appId = appId;

    // Check if user is already authenticated
    if (authState.isAuthenticated && authState.user) {
      return { success: true, userInfo: authState.user.profile };
    }

    // Get the redirect URI and client ID
    const redirectUri = chrome.identity.getRedirectURL();
    const actualClientId = projectId; // Client ID is the same as project ID
    
    // Generate state and code verifier for PKCE
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const codeVerifier = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const codeChallenge = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    const codeChallengeBase64 = btoa(String.fromCharCode(...new Uint8Array(codeChallenge))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    // Store state and code verifier for verification (temporary)
    await chrome.storage.local.set({
      'oidc_state': state,
      'code_verifier': codeVerifier
    });
    
    console.log('Stored OIDC state:', state);

    // Use the correct authorization endpoint based on app ID
    const authEndpoint = appId === 'descope-default-oidc' 
      ? 'https://api.descope.com/oauth2/v1/authorize'
      : `https://api.descope.com/${appId}/oauth2/v1/authorize`;
    console.log('Debug - authEndpoint:', authEndpoint);
    console.log('Redirect URI:', redirectUri);
      
    const authUrl = `${authEndpoint}?` +
      `client_id=${actualClientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=openid%20profile%20email&` +
      `state=${state}&` +
      `code_challenge=${codeChallengeBase64}&` +
      `code_challenge_method=S256`;

    console.log('Authorization URL:', authUrl);

    // Launch the OAuth flow using Chrome's identity API
    try {
      const redirectUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      });

      console.log('OAuth redirect URL received:', redirectUrl);

      // Extract authorization code from redirect URL
      const url = new URL(redirectUrl);
      const code = url.searchParams.get('code');
      const returnedState = url.searchParams.get('state');
      const error = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('error_description');
      
      console.log('OAuth response params:', { code: !!code, returnedState, error, errorDescription });
      
      if (error) {
        throw new Error(`OAuth error: ${error} - ${errorDescription || 'Unknown error'}`);
      }
      
      if (!code || returnedState !== state) {
        throw new Error('Invalid authorization response');
      }

      // Exchange code for tokens
      const tokenEndpoint = appId === 'descope-default-oidc' 
        ? 'https://api.descope.com/oauth2/v1/token'
        : `https://api.descope.com/${appId}/oauth2/v1/token`;
      const tokenResponse = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          client_id: actualClientId,
          code_verifier: codeVerifier
        })
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      console.log('Token response:', tokenData);

      // Get user info
      const userInfoEndpoint = appId === 'descope-default-oidc' 
        ? 'https://api.descope.com/oauth2/v1/userinfo'
        : `https://api.descope.com/${appId}/oauth2/v1/userinfo`;
      const userInfoResponse = await fetch(userInfoEndpoint, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });

      if (!userInfoResponse.ok) {
        throw new Error(`User info fetch failed: ${userInfoResponse.status}`);
      }

      const userInfo = await userInfoResponse.json();
      console.log('User info:', userInfo);

      // Create a user object compatible with our system
      const user = {
        profile: userInfo,
        access_token: tokenData.access_token,
        id_token: tokenData.id_token,
        refresh_token: tokenData.refresh_token,
        expires_at: Date.now() + (tokenData.expires_in * 1000)
      };

      await updateAuthState(user);
      
      // Reopen the popup after successful authentication
      try {
        await chrome.action.openPopup();
      } catch (error) {
        console.log('Could not reopen popup (user may have closed it):', error);
      }
      
      return { success: true, userInfo: user.profile };
    } catch (identityError) {
      console.error('OAuth flow error:', identityError);
      if (identityError.message.includes('The user did not approve access')) {
        throw new Error('Authentication was cancelled by user');
      }
      throw identityError;
    }
    
  } catch (error) {
    console.error('Authentication failed:', error);
    return { success: false, error: error.message };
  }
}

// Logout function
function logout() {
  try {
    clearAuthState();
    return { success: true };
  } catch (error) {
    console.error('Logout failed:', error);
    return { success: false, error: error.message };
  }
}

// Save Project ID and App ID
async function saveCredentials(projectId, appId) {
  try {
    await chrome.storage.local.set({
      'saved_project_id': projectId,
      'saved_app_id': appId
    });
    console.log('Saved credentials:', { projectId, appId });
  } catch (error) {
    console.error('Failed to save credentials:', error);
  }
}

// Load saved credentials on startup
async function loadSavedCredentials() {
  try {
    const result = await chrome.storage.local.get(['saved_project_id', 'saved_app_id']);
    if (result.saved_project_id && result.saved_app_id) {
      authState.projectId = result.saved_project_id;
      authState.appId = result.saved_app_id;
      console.log('Restored saved credentials:', { projectId: authState.projectId, appId: authState.appId });
    }
  } catch (error) {
    console.error('Failed to load saved credentials:', error);
  }
}

// Initialize on startup
loadSavedCredentials();

// Check if access token is expired
function isTokenExpired() {
  if (!authState.tokenExpiresAt) {
    return true; // No expiration time means expired
  }
  return Date.now() >= authState.tokenExpiresAt;
}

// Make authenticated API call
async function makeAuthenticatedRequest(url, options = {}) {
  if (!authState.accessToken) {
    throw new Error('No access token available');
  }
  
  if (isTokenExpired()) {
    throw new Error('Access token has expired');
  }
  
  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${authState.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (response.status === 401) {
    // Token might be invalid, clear auth state
    clearAuthState();
    throw new Error('Authentication failed - token invalid');
  }
  
  return response;
}

// Broadcast state updates to popup
function broadcastStateUpdate() {
  // Use a small delay to ensure popup is ready
  setTimeout(() => {
    chrome.runtime.sendMessage({ 
      type: 'state-update', 
      state: { 
        ...authState,
        userInfo: authState.user?.profile || null
      } 
    }).catch((error) => {
      console.log('Could not send state update to popup (popup may be closed):', error);
    });
  }, 100);
}

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'start-login') {
    // Get project ID and app ID from message or use stored values
    const projectId = message.projectId || authState.projectId;
    const appId = message.appId || authState.appId;
    
    if (!projectId || !appId) {
      sendResponse({ 
        success: false, 
        error: 'Project ID and App ID must be configured first' 
      });
      return true;
    }
    
    // Save credentials for future use
    saveCredentials(projectId, appId);
    
    startAuthFlow(projectId, appId).then((result) => {
      sendResponse(result);
    });
    return true; // Keep the message channel open for async response
  } else if (message.type === 'save-credentials') {
    // Save credentials without starting auth flow
    saveCredentials(message.projectId, message.appId);
    authState.projectId = message.projectId;
    authState.appId = message.appId;
    sendResponse({ success: true });
    return true;
  } else if (message.type === 'logout') {
    const result = logout();
    sendResponse(result);
    return true;
  } else if (message.type === 'get-state') {
    console.log('get-state requested, current authState:', authState);
    const response = {
      isAuthenticated: authState.isAuthenticated,
      userInfo: authState.user?.profile || null,
      projectId: authState.projectId,
      appId: authState.appId,
      accessToken: authState.accessToken,
      idToken: authState.idToken,
      refreshToken: authState.refreshToken,
      tokenExpiresAt: authState.tokenExpiresAt
    };
    console.log('Sending auth state response:', response);
    sendResponse(response);
  } else if (message.type === 'api-call') {
    // Handle authenticated API calls
    makeAuthenticatedRequest(message.url, message.options || {})
      .then(async (response) => {
        const data = await response.json();
        sendResponse({ success: true, data, status: response.status });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
});
