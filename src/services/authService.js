// authService.js
// Secure auth service that minimizes token storage and uses Chrome's secure APIs

export class AuthService {
  constructor() {
    this.defaultAppId = 'descope-default-oidc';
    this.currentUser = null;
    this.onUserChange = null;
    
    // Refresh token mutex to prevent concurrent refresh attempts
    this.refreshPromise = null;
    this.refreshAttempts = 0;
    this.maxRefreshAttempts = 3;
  }

  /**
   * Initialize the auth service
   * @param {string} projectId - Descope project ID
   * @param {string} appId - Descope app ID (optional)
   * @returns {Promise<void>}
   */
  async initialize(projectId, appId = this.defaultAppId) {
    this.projectId = projectId;
    this.appId = appId;
    this.authority = this.getAuthority(appId);
    
    // Check if user is already authenticated
    await this.checkExistingAuth();
  }

  /**
   * Get authority URL based on app ID
   * @param {string} appId - App ID
   * @returns {string}
   */
  getAuthority(appId) {
    return appId === this.defaultAppId 
      ? 'https://api.descope.com'
      : `https://api.descope.com/${appId}`;
  }

  /**
   * Set callback for user state changes
   * @param {function} callback - Callback function
   */
  setUserChangeCallback(callback) {
    this.onUserChange = callback;
  }

  /**
   * Set callback for user updates (alias for compatibility)
   * @param {function} callback - Callback function
   */
  setUserUpdateCallback(callback) {
    this.onUserChange = callback;
  }

  /**
   * Set callback for user logout (alias for compatibility)
   * @param {function} callback - Callback function
   */
  setUserLogoutCallback(callback) {
    this.onUserLogout = callback;
  }

  /**
   * Check if user is already authenticated
   * @returns {Promise<void>}
   */
  async checkExistingAuth() {
    try {
      // Get stored tokens and profile from Chrome storage
      const result = await chrome.storage.local.get(['DS', 'DSR', 'DS_profile']);
      if (result.DS && result.DSR && result.DS_profile) {
        // Decode expiration from JWT token
        const expiresAt = this.decodeTokenExpiration(result.DS);
        
        const user = {
          profile: result.DS_profile,
          access_token: result.DS,
          refresh_token: result.DSR,
          expires_at: expiresAt
        };
        // Check if token is still valid
        if (expiresAt && Date.now() < expiresAt) {
          this.currentUser = user;
          this.notifyUserChange(user);
        } else {
          // Token expired, clear it
          await this.clearSession();
        }
      }
    } catch (error) {
      console.error('Failed to check existing auth:', error);
    }
  }


  /**
   * Clear session data
   * @returns {Promise<void>}
   */
  async clearSession() {
    this.currentUser = null;
    
    // Clear all Descope-related storage keys
    await chrome.storage.local.remove([
      'DS',                    // Access token
      'DSR',                   // Refresh token
      'DS_profile',            // User profile
      'oidc_code_verifier',    // Temporary OAuth code verifier
      'oidc_state'             // Temporary OAuth state
    ]);
    
    this.notifyUserChange(null);
  }

  /**
   * Notify app of user state changes
   * @param {object|null} user - User object or null
   */
  notifyUserChange(user) {
    if (this.onUserChange) {
      this.onUserChange(user);
    }
    
    // If user is null (logged out), also call logout callback
    if (!user && this.onUserLogout) {
      this.onUserLogout();
    }
  }

  /**
   * Start authentication flow
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async startAuthFlow() {
    try {
      if (!this.projectId) {
        throw new Error('AuthService not initialized');
      }

      // Check if user is already authenticated
      if (this.currentUser && this.isTokenValid(this.currentUser)) {
        return { success: true };
      }

      // Generate PKCE parameters
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);
      const state = this.generateState();

      // Store PKCE parameters temporarily
      await chrome.storage.local.set({
        'oidc_code_verifier': codeVerifier,
        'oidc_state': state
      });

      // Build authorization URL
      const redirectUri = chrome.identity.getRedirectURL();
      const authUrl = this.buildAuthUrl(redirectUri, state, codeChallenge);

      // Launch OAuth flow
      const redirectUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      });

      // Handle the redirect
      return await this.handleRedirect(redirectUrl);
    } catch (error) {
      console.error('Authentication failed:', error);
      if (error.message.includes('The user did not approve access')) {
        return { success: false, error: 'Authentication was cancelled by user' };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle OAuth redirect
   * @param {string} redirectUrl - The redirect URL
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async handleRedirect(redirectUrl) {
    try {
      const url = new URL(redirectUrl);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('error_description');

      if (error) {
        throw new Error(`OAuth error: ${error} - ${errorDescription || 'Unknown error'}`);
      }

      if (!code || !state) {
        throw new Error('Invalid authorization response');
      }

      // Verify state parameter
      const storedState = await chrome.storage.local.get(['oidc_state']);
      if (state !== storedState.oidc_state) {
        throw new Error('Invalid state parameter');
      }

      // Get stored code verifier
      const storedData = await chrome.storage.local.get(['oidc_code_verifier']);
      const codeVerifier = storedData.oidc_code_verifier;

      if (!codeVerifier) {
        throw new Error('Code verifier not found');
      }

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code, codeVerifier);
      
      // Get user info
      const userInfo = await this.getUserInfo(tokens.access_token);
      
      // Create user object (keep in memory only)
      const user = {
        profile: userInfo,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Date.now() + (tokens.expires_in * 1000)
      };

      // Store tokens separately
      await this.storeTokens(tokens.access_token, tokens.refresh_token, tokens.expires_in);
      
      // Store user profile separately
      await chrome.storage.local.set({ 'DS_profile': userInfo });

      // Keep user in memory
      this.currentUser = user;

      // Clean up temporary data
      await chrome.storage.local.remove(['oidc_code_verifier', 'oidc_state']);

      this.notifyUserChange(user);

      return { success: true, user };
    } catch (error) {
      console.error('Failed to handle redirect:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Build authorization URL
   * @param {string} redirectUri - Redirect URI
   * @param {string} state - State parameter
   * @param {string} codeChallenge - Code challenge
   * @returns {string}
   */
  buildAuthUrl(redirectUri, state, codeChallenge) {
    const authEndpoint = `${this.authority}/oauth2/v1/authorize`;
    
    const params = new URLSearchParams({
      client_id: this.projectId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'openid profile email',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    return `${authEndpoint}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code
   * @param {string} codeVerifier - Code verifier
   * @returns {Promise<object>}
   */
  async exchangeCodeForTokens(code, codeVerifier) {
    const tokenEndpoint = `${this.authority}/oauth2/v1/token`;
    const redirectUri = chrome.identity.getRedirectURL();

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: this.projectId,
        code_verifier: codeVerifier
      })
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get user info
   * @param {string} accessToken - Access token
   * @returns {Promise<object>}
   */
  async getUserInfo(accessToken) {
    const userInfoEndpoint = `${this.authority}/oauth2/v1/userinfo`;
    
    const response = await fetch(userInfoEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`User info fetch failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Store tokens separately in Chrome storage
   * @param {string} accessToken - Access token
   * @param {string} refreshToken - Refresh token
   * @param {number} expiresIn - Token expiration in seconds
   */
  async storeTokens(accessToken, refreshToken, expiresIn) {
    await chrome.storage.local.set({
      'DS': accessToken,
      'DSR': refreshToken
    });
  }

  /**
   * Decode JWT token to get expiration time
   * @param {string} token - JWT token
   * @returns {number|null} - Expiration timestamp or null
   */
  decodeTokenExpiration(token) {
    try {
      if (!token) return null;
      
      // JWT format: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      // Decode payload (base64url)
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      
      // Return expiration time (convert from seconds to milliseconds)
      return payload.exp ? payload.exp * 1000 : null;
    } catch (error) {
      console.error('Failed to decode token expiration:', error);
      return null;
    }
  }

  /**
   * Get current user
   * @returns {Promise<object|null>}
   */
  async getCurrentUser() {
    // Check in-memory user first
    if (this.currentUser && this.isTokenValid(this.currentUser)) {
      return this.currentUser;
    }

    // If no in-memory user or invalid, try to load from storage
    try {
      const result = await chrome.storage.local.get(['DS', 'DSR', 'DS_profile']);
      
      if (result.DS && result.DSR && result.DS_profile) {
        // Decode expiration from JWT token
        const expiresAt = this.decodeTokenExpiration(result.DS);
        
        const user = {
          profile: result.DS_profile,
          access_token: result.DS,
          refresh_token: result.DSR,
          expires_at: expiresAt
        };
        
        // Check if token is still valid (even if expired, we might be able to refresh)
        if (user.expires_at && user.refresh_token) {
          this.currentUser = user;
          return user;
        }
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
    }

    return null;
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>}
   */
  async isAuthenticated() {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  /**
   * Get access token (with automatic refresh if needed)
   * @returns {Promise<string|null>}
   */
  async getAccessToken() {
    const user = await this.getCurrentUser();
    
    if (!user) {
      return null;
    }

    // Check if token needs refresh (expires within 1 minute)
    if (this.needsTokenRefresh(user)) {
      const refreshResult = await this.refreshToken();
      if (refreshResult.success) {
        // Return the new token directly from refresh result
        return refreshResult.user.access_token;
      } else {
        console.error('Token refresh failed:', refreshResult.error);
        // Don't return null immediately - check if we have a valid token
        if (this.isTokenValid(user)) {
          return user.access_token;
        }
        return null;
      }
    }

    return user.access_token;
  }

  /**
   * Check if token needs refresh (expires within 1 minute)
   * @param {object} user - User object
   * @returns {boolean}
   */
  needsTokenRefresh(user) {
    if (!user || !user.expires_at || !user.refresh_token) {
      return false;
    }
    
    const oneMinute = 1 * 60 * 1000; // 1 minute in milliseconds
    const currentTime = Date.now();
    return currentTime + oneMinute >= user.expires_at;
  }

  /**
   * Refresh access token using refresh token (with mutex protection)
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async refreshToken() {
    // If a refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    // Start new refresh attempt
    this.refreshPromise = this._performRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      // Clear the promise when done
      this.refreshPromise = null;
    }
  }

  /**
   * Internal method to perform the actual token refresh
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async _performRefresh() {
    try {
      // Validate refresh token exists
      if (!this.currentUser || !this.currentUser.refresh_token) {
        throw new Error('No refresh token available');
      }

      // Check if we've exceeded max attempts
      if (this.refreshAttempts >= this.maxRefreshAttempts) {
        console.error('Max refresh attempts exceeded, clearing session');
        await this.clearSession();
        throw new Error('Max refresh attempts exceeded');
      }

      this.refreshAttempts++;

      const tokenEndpoint = `${this.authority}/oauth2/v1/token`;
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.currentUser.refresh_token,
          client_id: this.projectId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token refresh failed. Status:', response.status, 'Response:', errorText);
        
        // Handle specific error cases
        if (response.status === 400 || response.status === 401) {
          // Invalid refresh token - clear session
          console.error('Invalid refresh token, clearing session');
          await this.clearSession();
          throw new Error('Invalid refresh token');
        }
        
        // Other errors - might be temporary
        throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
      }

      const tokenData = await response.json();

      // Reset refresh attempts on success
      this.refreshAttempts = 0;

      // Update user with new tokens
      const updatedUser = {
        ...this.currentUser,
        access_token: tokenData.access_token,
        expires_at: Date.now() + (tokenData.expires_in * 1000)
      };

      // Update refresh token if provided (token rotation)
      if (tokenData.refresh_token) {
        updatedUser.refresh_token = tokenData.refresh_token;
      }

      // Store updated tokens separately - replace DS with new access token
      await chrome.storage.local.set({
        'DS': tokenData.access_token
      });

      // Update refresh token if provided (replace DSR)
      if (tokenData.refresh_token) {
        await chrome.storage.local.set({ 'DSR': tokenData.refresh_token });
      }

      // ID token not needed - removed for simplicity
      

      // Update in-memory user
      this.currentUser = updatedUser;

      // Notify of user update
      this.notifyUserChange(updatedUser);

      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // If it's a permanent error, clear the session
      if (error.message.includes('Invalid refresh token') || 
          error.message.includes('Max refresh attempts exceeded')) {
        await this.clearSession();
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Logout user
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async logout() {
    try {
      await this.clearSession();
      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Make authenticated API call (with automatic token refresh on 401)
   * @param {string} url - API URL
   * @param {object} options - Fetch options
   * @returns {Promise<Response>}
   */
  async makeAuthenticatedRequest(url, options = {}) {
    let accessToken = await this.getAccessToken();
    
    if (!accessToken) {
      throw new Error('No access token available');
    }
    
    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
    let response = await fetch(url, { ...defaultOptions, ...options });
    
    // If we get a 401, try to refresh the token and retry once
    if (response.status === 401) {
      const refreshResult = await this.refreshToken();
      if (refreshResult.success) {
        // Use the new token directly from refresh result
        accessToken = refreshResult.user.access_token;
        
        // Retry the request with the new token
        const newOptions = {
          ...defaultOptions,
          headers: {
            ...defaultOptions.headers,
            'Authorization': `Bearer ${accessToken}`
          }
        };
        
        response = await fetch(url, { ...newOptions, ...options });
        
        // If still 401 after refresh, the refresh token is also invalid
        if (response.status === 401) {
          console.error('Token refresh failed to resolve 401, clearing session');
          await this.clearSession();
          throw new Error('Authentication failed - refresh token invalid');
        }
      } else {
        // Refresh failed - check if it's a permanent failure
        if (refreshResult.error.includes('Invalid refresh token') || 
            refreshResult.error.includes('Max refresh attempts exceeded')) {
          console.error('Permanent refresh failure, clearing session');
          await this.clearSession();
          throw new Error('Authentication failed - refresh token invalid');
        } else {
          // Temporary failure - throw error but don't clear session
          throw new Error(`Authentication failed - ${refreshResult.error}`);
        }
      }
    }
    
    return response;
  }

  /**
   * Check if token is valid
   * @param {object} user - User object
   * @returns {boolean}
   */
  isTokenValid(user) {
    if (!user || !user.expires_at) {
      return false;
    }
    return Date.now() < user.expires_at;
  }

  /**
   * Manually refresh token (for external use)
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async manualRefreshToken() {
    return await this.refreshToken();
  }

  /**
   * Generate code verifier for PKCE
   * @returns {string}
   */
  generateCodeVerifier() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < 128; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate code challenge for PKCE
   * @param {string} codeVerifier - Code verifier
   * @returns {Promise<string>}
   */
  async generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate state parameter
   * @returns {string}
   */
  generateState() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
