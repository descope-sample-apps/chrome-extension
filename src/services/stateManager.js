// stateManager.js
// Manages authentication state and broadcasts updates to popup

export class StateManager {
  constructor(storageService) {
    this.storageService = storageService;
    this.authService = null; // Will be set by message handler
    this.authState = {
      projectId: null,
      appId: null,
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null
    };
  }

  /**
   * Set auth service reference
   * @param {object} authService - Auth service instance
   */
  setAuthService(authService) {
    this.authService = authService;
  }

  /**
   * Initialize state manager and load saved state
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Load saved credentials
      const credentials = await this.storageService.loadCredentials();
      if (credentials) {
        this.authState.projectId = credentials.projectId;
        this.authState.appId = credentials.appId;
      }

      // Auth state is now managed by the auth service directly
      // No need to load from storage here - auth service handles it
    } catch (error) {
      console.error('Failed to initialize state manager:', error);
    }
  }

  /**
   * Update authentication state with user data
   * @param {object} user - User object with profile and tokens
   * @returns {Promise<void>}
   */
  async updateAuthState(user) {
    console.log('Updating auth state with user:', user);
    
    this.authState.isAuthenticated = true;
    this.authState.user = user;
    
    // Store tokens in auth state
    if (user.access_token) {
      this.authState.accessToken = user.access_token;
    }
    // ID token not needed - removed for simplicity
    if (user.refresh_token) {
      this.authState.refreshToken = user.refresh_token;
    }
    if (user.expires_at) {
      this.authState.tokenExpiresAt = user.expires_at;
    }

    // Auth state is now managed by the auth service directly
    // No need to save to storage here - auth service handles it

    // Broadcast state update to all popups
    this.broadcastStateUpdate();
  }

  /**
   * Clear authentication state
   * @returns {Promise<void>}
   */
  async clearAuthState() {
    this.authState = {
      projectId: this.authState.projectId,
      appId: this.authState.appId,
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null
    };

    // Auth state is now managed by the auth service directly
    // No need to clear from storage here - auth service handles it

    // Broadcast state update to all popups
    this.broadcastStateUpdate();
  }

  /**
   * Set credentials
   * @param {string} projectId - Project ID
   * @param {string} appId - App ID
   * @returns {Promise<void>}
   */
  async setCredentials(projectId, appId) {
    this.authState.projectId = projectId;
    this.authState.appId = appId;
    
    await this.storageService.saveCredentials(projectId, appId);
  }

  /**
   * Get current authentication state
   * @returns {object}
   */
  getAuthState() {
    return {
      isAuthenticated: this.authState.isAuthenticated,
      userInfo: this.authState.user?.profile || null,
      projectId: this.authState.projectId,
      appId: this.authState.appId,
      accessToken: this.authState.accessToken,
      refreshToken: this.authState.refreshToken,
      tokenExpiresAt: this.authState.tokenExpiresAt
    };
  }

  /**
   * Check if access token is valid
   * @param {object} state - State object to check (optional, uses current state if not provided)
   * @returns {boolean}
   */
  isTokenValid(state = this.authState) {
    if (!state.tokenExpiresAt) {
      return false; // No expiration time means invalid
    }
    return Date.now() < state.tokenExpiresAt;
  }

  /**
   * Check if user is authenticated and token is valid
   * @returns {boolean}
   */
  isAuthenticated() {
    return this.authState.isAuthenticated && this.isTokenValid();
  }

  /**
   * Check if user is authenticated (async version that uses auth service)
   * @returns {Promise<boolean>}
   */
  async isAuthenticatedAsync() {
    if (!this.authState.isAuthenticated) {
      return false;
    }

    // Use auth service to check authentication (which handles refresh)
    if (this.authService) {
      return await this.authService.isAuthenticated();
    }

    // Fallback to local validation
    return this.isTokenValid();
  }

  /**
   * Get access token if valid (with refresh if needed)
   * @returns {Promise<string | null>}
   */
  async getValidAccessToken() {
    // Use auth service to get token (which handles refresh automatically)
    if (this.authService) {
      return await this.authService.getAccessToken();
    }

    // Fallback to stored token if auth service not available
    if (this.isAuthenticated() && this.isTokenValid()) {
      return this.authState.accessToken;
    }
    return null;
  }

  /**
   * Broadcast state updates to popup
   */
  broadcastStateUpdate() {
    // Use a small delay to ensure popup is ready
    setTimeout(() => {
      chrome.runtime.sendMessage({ 
        type: 'state-update', 
        state: this.getAuthState()
      }).catch((error) => {
        console.log('Could not send state update to popup (popup may be closed):', error);
      });
    }, 100);
  }

  /**
   * Handle OAuth error
   * @param {string} error - Error message
   */
  handleOAuthError(error) {
    chrome.runtime.sendMessage({ 
      type: 'oauth-error', 
      error 
    }).catch((err) => {
      console.log('Could not send OAuth error to popup (popup may be closed):', err);
    });
  }
}
