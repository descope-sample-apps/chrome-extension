import './popup.css';

const template = document.createElement('template');
template.innerHTML = `
<div id="outer">
  <div id="card">
    <img id="logo" src="/descope.png" alt="Logo" />
    <div id="title">Descope Login</div>
    <input id="project-id" type="text" placeholder="Enter Project ID" class="mb-10" />
    <input id="app-id" type="text" placeholder="Enter App ID" class="mb-10" />
    <button id="login">Login</button>
  </div>
</div>`;
document.body.appendChild(template.content.cloneNode(true));

const cardEle = document.getElementById('card');
const projectIdInput = cardEle.querySelector('#project-id');
const appIdInput = cardEle.querySelector('#app-id');
const loginBtn = cardEle.querySelector('#login');
const textEle = document.createElement('pre');
const logoutBtn = document.createElement('button');
logoutBtn.id = 'logout';
logoutBtn.textContent = 'Logout';
logoutBtn.style.display = 'none';

function showInputsAndButton(show) {
  projectIdInput.style.display = show ? '' : 'none';
  appIdInput.style.display = show ? '' : 'none';
  loginBtn.style.display = show ? '' : 'none';
  // Don't hide logout button here - let showLogoutButton handle it
}

function showLogoutButton(show) {
  if (show) {
    if (!logoutBtn.parentNode) {
      cardEle.appendChild(logoutBtn);
      addLogoutEventListener();
    }
    logoutBtn.style.display = '';
  } else {
    logoutBtn.style.display = 'none';
    if (logoutBtn.parentNode) {
      cardEle.removeChild(logoutBtn);
    }
  }
}

function showTextBox(show) {
  if (show && !textEle.isConnected) {
    cardEle.appendChild(textEle);
  } else if (!show && textEle.isConnected) {
    cardEle.removeChild(textEle);
  }
}

function updateUI(state) {
  if (state.userInfo && state.isAuthenticated) {
    showInputsAndButton(false);
    showTextBox(true);
    textEle.innerHTML = `
      <div class="welcome-container">
        <span class="success-msg">Welcome</span> 
        <br><span class="user-name">${state.userInfo.name || state.userInfo.email}</span> 
        <br><span class="sub-msg">You are logged in!</span>
      </div>
    `;
    showLogoutButton(true);
  } else {
    // Initial screen: show input and button, hide text box and logout
    showInputsAndButton(true);
    showTextBox(false);
    showLogoutButton(false);
  }
}

loginBtn.addEventListener('click', async (e) => {
  const projectId = projectIdInput.value.trim();
  const appId = appIdInput.value.trim();
  
  if (projectId && appId) {
    // Show loading state while OAuth flow is happening
    showInputsAndButton(false);
    showTextBox(true);
    textEle.innerHTML = `
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

    chrome.runtime.sendMessage({ 
      type: 'start-login', 
      projectId, 
      appId 
    }, (response) => {
      if (response && response.success) {
        updateUI({ 
          userInfo: response.userInfo, 
          isAuthenticated: true,
          projectId: response.projectId,
          appId: response.appId
        });
      } else if (response && !response.success) {
        showInputsAndButton(true);
        showTextBox(true);
        textEle.innerHTML = `
          <span class="error-msg">Login Error</span><br><br>
          <span class="error-details">${response.error}</span>
        `;
      }
    });
  } else {
    alert('Please enter both Project ID and App ID.');
  }
});

// Add event listener for logout button (will be added when button is created)
function addLogoutEventListener() {
  logoutBtn.addEventListener('click', async (e) => {
    chrome.runtime.sendMessage({ type: 'logout' }, (response) => {
      if (response && response.success) {
        updateUI({});
      }
    });
  });
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'state-update') {
    // Handle state updates from background
    updateUI(message.state);
  } else if (message.type === 'oauth-error') {
    showInputsAndButton(true);
    showTextBox(true);
    textEle.innerHTML = `
      <span class="error-msg">OAuth Error</span><br><br>
      <span class="error-details">${message.error}</span>
    `;
  }
});

// Load saved credentials into input fields
function loadSavedCredentials() {
  chrome.runtime.sendMessage({ type: 'get-state' }, (state) => {
    if (state && state.projectId && state.appId) {
      projectIdInput.value = state.projectId;
      appIdInput.value = state.appId;
    }
    updateUI(state || {});
  });
}

// Save credentials when user types (with debouncing)
let saveTimeout;
function saveCredentials() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const projectId = projectIdInput.value.trim();
    const appId = appIdInput.value.trim();
    
    if (projectId && appId) {
      chrome.runtime.sendMessage({ 
        type: 'save-credentials', 
        projectId, 
        appId 
      });
    }
  }, 1000); // Save after 1 second of no typing
}

// Add event listeners for input changes
projectIdInput.addEventListener('input', saveCredentials);
appIdInput.addEventListener('input', saveCredentials);

// On popup open, load saved credentials and current state
loadSavedCredentials();


