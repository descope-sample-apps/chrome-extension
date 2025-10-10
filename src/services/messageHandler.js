// messageHandler.js
// Handles Chrome extension message passing

export class MessageHandler {
  constructor(authService, stateManager, storageService) {
    this.authService = authService;
    this.stateManager = stateManager;
    this.storageService = storageService;
  }

  /**
   * Initialize message handler
   */
  initialize() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep the message channel open for async responses
    });

    // Set auth service reference in state manager
    this.stateManager.setAuthService(this.authService);

    // Set up auth service callbacks to sync with state manager
    this.authService.setUserUpdateCallback((user) => {
      this.stateManager.updateAuthState(user);
    });

    this.authService.setUserLogoutCallback(() => {
      this.stateManager.clearAuthState();
    });
  }

  /**
   * Handle incoming messages
   * @param {object} message - Message object
   * @param {object} sender - Sender object
   * @param {function} sendResponse - Response callback
   */
  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'start-login':
          await this.handleStartLogin(message, sendResponse);
          break;
        case 'save-credentials':
          await this.handleSaveCredentials(message, sendResponse);
          break;
        case 'logout':
          await this.handleLogout(message, sendResponse);
          break;
        case 'get-state':
          this.handleGetState(message, sendResponse);
          break;
        case 'api-call':
          await this.handleApiCall(message, sendResponse);
          break;
        case 'handle-redirect':
          await this.handleRedirect(message, sendResponse);
          break;
        case 'refresh-token':
          await this.handleRefreshToken(message, sendResponse);
          break;
        default:
          console.warn('Unknown message type:', message.type);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle start login message
   * @param {object} message - Message object
   * @param {function} sendResponse - Response callback
   */
  async handleStartLogin(message, sendResponse) {
    const projectId = message.projectId || this.stateManager.authState.projectId;
    const appId = message.appId || this.stateManager.authState.appId || 'descope-default-oidc';
    
    if (!projectId) {
      sendResponse({ 
        success: false, 
        error: 'Project ID must be configured first' 
      });
      return;
    }
    
    // Save credentials for future use
    await this.stateManager.setCredentials(projectId, appId);
    
    try {
      // Initialize auth service with credentials
      await this.authService.initialize(projectId, appId);
      
      // Start authentication flow
      const result = await this.authService.startAuthFlow();
      
      if (result.success && result.user) {
        // Update state with user info
        await this.stateManager.updateAuthState(result.user);
        
        // Try to reopen popup after successful authentication
        try {
          await chrome.action.openPopup();
        } catch (error) {
          console.log('Could not reopen popup (user may have closed it):', error);
        }
      }
      
      sendResponse(result);
    } catch (error) {
      console.error('Login failed:', error);
      this.stateManager.handleOAuthError(error.message);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle save credentials message
   * @param {object} message - Message object
   * @param {function} sendResponse - Response callback
   */
  async handleSaveCredentials(message, sendResponse) {
    try {
      await this.stateManager.setCredentials(message.projectId, message.appId);
      sendResponse({ success: true });
    } catch (error) {
      console.error('Failed to save credentials:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle logout message
   * @param {object} message - Message object
   * @param {function} sendResponse - Response callback
   */
  async handleLogout(message, sendResponse) {
    try {
      // Use auth service logout to properly clear all storage
      const result = await this.authService.logout();
      
      if (result.success) {
        // Also clear state manager
        await this.stateManager.clearAuthState();
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: result.error });
      }
    } catch (error) {
      console.error('Logout failed:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle get state message
   * @param {object} message - Message object
   * @param {function} sendResponse - Response callback
   */
  handleGetState(message, sendResponse) {
    console.log('get-state requested, current authState:', this.stateManager.getAuthState());
    const response = this.stateManager.getAuthState();
    console.log('Sending auth state response:', response);
    sendResponse(response);
  }

  /**
   * Handle API call message - tests token and refresh mechanism
   * @param {object} message - Message object
   * @param {function} sendResponse - Response callback
   */
  async handleApiCall(message, sendResponse) {
    try {
      const { url, options = {} } = message;
      
      if (!url) {
        throw new Error('URL is required for API call');
      }

      // Ensure AuthService is initialized with stored credentials
      const authState = this.stateManager.getAuthState();
      if (!authState.projectId) {
        throw new Error('Project ID not configured. Please log in first.');
      }

      // Initialize AuthService with stored credentials
      await this.authService.initialize(authState.projectId, authState.appId);

      // Make authenticated request - this will automatically refresh token if needed
      const response = await this.authService.makeAuthenticatedRequest(url, options);
      const data = await response.json();
      
      sendResponse({ 
        success: true, 
        data: { 
          message: 'API call successful - token validated and refreshed if needed',
          ...data 
        },
        status: response.status
      });
    } catch (error) {
      console.error('API call failed:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle OAuth redirect
   * @param {object} message - Message object with redirectUrl
   * @param {function} sendResponse - Response callback
   */
  async handleRedirect(message, sendResponse) {
    try {
      const result = await this.authService.handleRedirect(message.redirectUrl);
      
      if (result.success && result.user) {
        // Update state with user info
        await this.stateManager.updateAuthState(result.user);
      }
      
      sendResponse(result);
    } catch (error) {
      console.error('Failed to handle redirect:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle token refresh request
   * @param {object} message - Message object
   * @param {function} sendResponse - Response callback
   */
  async handleRefreshToken(message, sendResponse) {
    try {
      const result = await this.authService.manualRefreshToken();
      
      if (result.success && result.user) {
        // Update state with refreshed user info
        await this.stateManager.updateAuthState(result.user);
      }
      
      sendResponse(result);
    } catch (error) {
      console.error('Failed to refresh token:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
}
