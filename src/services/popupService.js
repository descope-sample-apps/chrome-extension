// popupService.js
// Handles popup UI logic and user interactions

export class PopupService {
  constructor() {
    this.elements = {};
    this.saveTimeout = null;
    this.initializeElements();
    this.setupEventListeners();
    this.loadSavedCredentials();
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.elements.card = document.getElementById('card');
    this.elements.projectIdInput = document.getElementById('project-id');
    this.elements.appIdInput = document.getElementById('app-id');
    this.elements.loginBtn = document.getElementById('login');
    this.elements.testApiBtn = document.getElementById('test-api');
    this.elements.textEle = document.createElement('pre');
    this.elements.logoutBtn = this.createLogoutButton();
  }

  /**
   * Create logout button element
   * @returns {HTMLElement}
   */
  createLogoutButton() {
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout';
    logoutBtn.textContent = 'Logout';
    logoutBtn.style.display = 'none';
    return logoutBtn;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Login button
    this.elements.loginBtn.addEventListener('click', (e) => this.handleLogin(e));
    
    // Test API button
    this.elements.testApiBtn.addEventListener('click', (e) => this.handleTestApi(e));
    
    // Input change listeners for auto-save
    this.elements.projectIdInput.addEventListener('input', () => this.saveCredentials());
    this.elements.appIdInput.addEventListener('input', () => this.saveCredentials());
    
    // Message listener for state updates
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    });
  }

  /**
   * Handle login button click
   * @param {Event} e - Click event
   */
  async handleLogin(e) {
    const projectId = this.elements.projectIdInput.value.trim();
    const appId = this.elements.appIdInput.value.trim() || 'descope-default-oidc';
    
    if (projectId) {
      this.showLoadingState();
      
      chrome.runtime.sendMessage({ 
        type: 'start-login', 
        projectId, 
        appId
      }, (response) => {
        if (response && response.success) {
          this.updateUI({ 
            userInfo: response.userInfo, 
            isAuthenticated: true,
            projectId: response.projectId,
            appId: response.appId
          });
        } else if (response && !response.success) {
          this.showErrorState(response.error);
        }
      });
    } else {
      alert('Please enter a Project ID.');
    }
  }

  /**
   * Handle logout button click
   */
  async handleLogout() {
    chrome.runtime.sendMessage({ type: 'logout' }, (response) => {
      if (response && response.success) {
        this.updateUI({});
      }
    });
  }

  /**
   * Handle test API button click
   * @param {Event} e - Click event
   */
  async handleTestApi(e) {
    e.preventDefault();
    
    // Show loading state
    this.showApiTestLoading();
    
    // Make a test API call to Descope's userinfo endpoint
    chrome.runtime.sendMessage({ 
      type: 'api-call',
      url: 'https://api.descope.com/oauth2/v1/userinfo',
      options: {
        method: 'GET'
      }
    }, (response) => {
      if (response && response.success) {
        this.showApiTestSuccess(response.data);
      } else {
        this.showApiTestError(response?.error || 'API call failed');
      }
    });
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    this.showInputsAndButton(false);
    this.showTextBox(true);
    this.elements.textEle.innerHTML = `
      <div class="loading-container">
        <div class="loading-icon">
          <div class="spinner"></div>
        </div>
        <h3 class="loading-title">Connecting to Descope</h3>
        <p class="loading-subtitle">Opening secure authentication window...</p>
        <div class="loading-tip">
          <span class="tip-icon">💡</span>
          <span>If the popup doesn't open, check your browser's popup blocker settings</span>
        </div>
      </div>
    `;
  }

  /**
   * Show error state
   * @param {string} error - Error message
   */
  showErrorState(error) {
    this.showInputsAndButton(true);
    this.showTextBox(true);
    this.elements.textEle.innerHTML = `
      <span class="error-msg">Login Error</span><br><br>
      <span class="error-details">${error}</span>
    `;
    // Show test API button after error (user can try again)
    this.showTestApiButton(true);
  }

  /**
   * Show OAuth error state
   * @param {string} error - Error message
   */
  showOAuthErrorState(error) {
    this.showInputsAndButton(true);
    this.showTextBox(true);
    this.elements.textEle.innerHTML = `
      <span class="error-msg">OAuth Error</span><br><br>
      <span class="error-details">${error}</span>
    `;
    // Show test API button after OAuth error (user can try again)
    this.showTestApiButton(true);
  }

  /**
   * Show API test loading state
   */
  showApiTestLoading() {
    this.showTextBox(true);
    this.elements.textEle.innerHTML = `
      <div class="loading-container">
        <div class="loading-icon">
          <div class="spinner-small"></div>
        </div>
        <h3 class="loading-title">Testing API Call</h3>
      </div>
    `;
  }

  /**
   * Show API test success
   * @param {object} data - API response data
   */
  showApiTestSuccess(data) {
    this.showTextBox(true);
    this.elements.textEle.innerHTML = `
      <div class="success-container">
        <span class="success-msg">API Call Successful!</span>
      </div>
    `;
    // Show test API button after successful test (user can test again)
    this.showTestApiButton(true);
  }

  /**
   * Show API test error
   * @param {string} error - Error message
   */
  showApiTestError(error) {
    this.showTextBox(true);
    this.elements.textEle.innerHTML = `
      <div class="error-container">
        <span class="error-msg">API Call Failed</span>
      </div>
    `;
    // Show test API button after API test error (user can try again)
    this.showTestApiButton(true);
  }

  /**
   * Show/hide input fields and login button
   * @param {boolean} show - Whether to show inputs
   */
  showInputsAndButton(show) {
    this.elements.projectIdInput.style.display = show ? '' : 'none';
    this.elements.appIdInput.style.display = show ? '' : 'none';
    this.elements.loginBtn.style.display = show ? '' : 'none';
    // Hide test API button during authentication process
    this.elements.testApiBtn.style.display = show ? '' : 'none';
  }

  /**
   * Show/hide logout button
   * @param {boolean} show - Whether to show logout button
   */
  showLogoutButton(show) {
    if (show) {
      if (!this.elements.logoutBtn.parentNode) {
        this.elements.card.appendChild(this.elements.logoutBtn);
        this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());
      }
      this.elements.logoutBtn.style.display = '';
    } else {
      this.elements.logoutBtn.style.display = 'none';
      if (this.elements.logoutBtn.parentNode) {
        this.elements.card.removeChild(this.elements.logoutBtn);
      }
    }
  }

  /**
   * Show/hide test API button
   * @param {boolean} show - Whether to show test API button
   */
  showTestApiButton(show) {
    this.elements.testApiBtn.style.display = show ? '' : 'none';
  }

  /**
   * Show/hide text box
   * @param {boolean} show - Whether to show text box
   */
  showTextBox(show) {
    if (show && !this.elements.textEle.isConnected) {
      this.elements.card.appendChild(this.elements.textEle);
    } else if (!show && this.elements.textEle.isConnected) {
      this.elements.card.removeChild(this.elements.textEle);
    }
  }

  /**
   * Update UI based on state
   * @param {object} state - Authentication state
   */
  updateUI(state) {
    if (state.userInfo && state.isAuthenticated) {
      this.showInputsAndButton(false);
      this.showTextBox(true);
      this.elements.textEle.innerHTML = `
        <div class="welcome-container">
          <span class="success-msg">Welcome</span> 
          <br><span class="user-name">${state.userInfo.name || state.userInfo.email}</span> 
          <br><span class="sub-msg">You are logged in!</span>
        </div>
      `;
      this.showLogoutButton(true);
      // Show test API button after successful authentication
      this.showTestApiButton(true);
    } else {
      // Initial screen: show input and button, hide text box and logout
      this.showInputsAndButton(true);
      // Clear any existing text box content before hiding it
      this.elements.textEle.innerHTML = '';
      this.showTextBox(false);
      this.showLogoutButton(false);
      // Show test API button on initial screen (before authentication)
      this.showTestApiButton(true);
    }
  }

  /**
   * Handle messages from background
   * @param {object} message - Message object
   * @param {object} sender - Sender object
   * @param {function} sendResponse - Response callback
   */
  handleMessage(message, sender, sendResponse) {
    if (message.type === 'state-update') {
      this.updateUI(message.state);
    } else if (message.type === 'oauth-error') {
      this.showOAuthErrorState(message.error);
    }
  }

  /**
   * Load saved credentials into input fields
   */
  loadSavedCredentials() {
    chrome.runtime.sendMessage({ type: 'get-state' }, (state) => {
      if (state && state.projectId) {
        this.elements.projectIdInput.value = state.projectId;
      }
      // Only show app ID if it's not the default value
      if (state && state.appId && state.appId !== 'descope-default-oidc') {
        this.elements.appIdInput.value = state.appId;
      }
      this.updateUI(state || {});
    });
  }

  /**
   * Save credentials when user types (with debouncing)
   */
  saveCredentials() {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      const projectId = this.elements.projectIdInput.value.trim();
      const appIdInput = this.elements.appIdInput.value.trim();
      // Only save app ID if user actually entered something
      const appId = appIdInput || 'descope-default-oidc';
      
      if (projectId) {
        chrome.runtime.sendMessage({ 
          type: 'save-credentials', 
          projectId, 
          appId 
        });
      }
    }, 1000); // Save after 1 second of no typing
  }
}
