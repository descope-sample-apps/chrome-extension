// storageService.js
// Handles all storage operations for credentials and temporary data

export class StorageService {
  constructor() {
    this.CREDENTIALS_KEY = 'project_details';
    this.TEMP_STATE_KEY = 'oidc_state';
    this.TEMP_CODE_VERIFIER_KEY = 'code_verifier';
  }

  /**
   * Save user credentials
   * @param {string} projectId - Project ID
   * @param {string} appId - App ID
   * @returns {Promise<void>}
   */
  async saveCredentials(projectId, appId) {
    try {
      const credentials = {
        projectId,
        // Only save appId if it's not the default value
        ...(appId !== 'descope-default-oidc' && { appId }),
        savedAt: Date.now()
      };
      
      await chrome.storage.local.set({
        [this.CREDENTIALS_KEY]: credentials
      });
      
    } catch (error) {
      console.error('Failed to save credentials:', error);
      throw error;
    }
  }

  /**
   * Load saved credentials
   * @returns {Promise<{projectId: string, appId?: string} | null>}
   */
  async loadCredentials() {
    try {
      const result = await chrome.storage.local.get([this.CREDENTIALS_KEY]);
      const credentials = result[this.CREDENTIALS_KEY];
      
      if (credentials && credentials.projectId) {
        return {
          projectId: credentials.projectId,
          // appId might not be saved if it was the default value
          ...(credentials.appId && { appId: credentials.appId })
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load credentials:', error);
      return null;
    }
  }

  /**
   * Clear saved credentials
   * @returns {Promise<void>}
   */
  async clearCredentials() {
    try {
      await chrome.storage.local.remove([this.CREDENTIALS_KEY]);
    } catch (error) {
      console.error('Failed to clear credentials:', error);
      throw error;
    }
  }

  /**
   * Save temporary OAuth state
   * @param {string} state - OAuth state
   * @param {string} codeVerifier - Code verifier
   * @returns {Promise<void>}
   */
  async saveTempOAuthData(state, codeVerifier) {
    try {
      await chrome.storage.local.set({
        [this.TEMP_STATE_KEY]: state,
        [this.TEMP_CODE_VERIFIER_KEY]: codeVerifier
      });
      
    } catch (error) {
      console.error('Failed to save temporary OAuth data:', error);
      throw error;
    }
  }

  /**
   * Load temporary OAuth state
   * @returns {Promise<{state: string, codeVerifier: string} | null>}
   */
  async loadTempOAuthData() {
    try {
      const result = await chrome.storage.local.get([
        this.TEMP_STATE_KEY, 
        this.TEMP_CODE_VERIFIER_KEY
      ]);
      
      if (result[this.TEMP_STATE_KEY] && result[this.TEMP_CODE_VERIFIER_KEY]) {
        return {
          state: result[this.TEMP_STATE_KEY],
          codeVerifier: result[this.TEMP_CODE_VERIFIER_KEY]
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load temporary OAuth data:', error);
      return null;
    }
  }

  /**
   * Clear temporary OAuth data
   * @returns {Promise<void>}
   */
  async clearTempOAuthData() {
    try {
      await chrome.storage.local.remove([
        this.TEMP_STATE_KEY,
        this.TEMP_CODE_VERIFIER_KEY
      ]);
      
    } catch (error) {
      console.error('Failed to clear temporary OAuth data:', error);
      throw error;
    }
  }


  /**
   * Clear all extension data
   * @returns {Promise<void>}
   */
  async clearAllData() {
    try {
      await chrome.storage.local.clear();
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }
}
