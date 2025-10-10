// background.js
// Service worker entry point - orchestrates all services

import { AuthService } from './services/authService.js';
import { StorageService } from './services/storageService.js';
import { StateManager } from './services/stateManager.js';
import { MessageHandler } from './services/messageHandler.js';

// Initialize services
const storageService = new StorageService();
const authService = new AuthService();
const stateManager = new StateManager(storageService);
const messageHandler = new MessageHandler(authService, stateManager, storageService);

// Initialize the application
async function initialize() {
  try {
    await stateManager.initialize();
    messageHandler.initialize();
    
    // Set up OAuth redirect handler
    setupOAuthRedirectHandler();
    
  } catch (error) {
    console.error('Failed to initialize background service:', error);
  }
}

// Handle OAuth redirects from Chrome identity API
function setupOAuthRedirectHandler() {
  // Listen for web navigation events to catch OAuth redirects
  chrome.webNavigation?.onBeforeNavigate.addListener((details) => {
    if (details.frameId === 0 && details.url.includes('chrome-extension://')) {
      // This is likely an OAuth redirect
      handleOAuthRedirect(details.url);
    }
  });

  // Alternative: Listen for tab updates
  chrome.tabs?.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url?.includes('chrome-extension://')) {
      handleOAuthRedirect(tab.url);
    }
  });
}

// Handle OAuth redirect
async function handleOAuthRedirect(redirectUrl) {
  try {
    console.log('Handling OAuth redirect:', redirectUrl);
    
    // Send message to message handler to process the redirect
    chrome.runtime.sendMessage({
      type: 'handle-redirect',
      redirectUrl: redirectUrl
    }, (response) => {
      if (response && response.success) {
        console.log('OAuth redirect handled successfully');
      } else {
        console.error('Failed to handle OAuth redirect:', response?.error);
      }
    });
  } catch (error) {
    console.error('Error handling OAuth redirect:', error);
  }
}

// Start the application
initialize();