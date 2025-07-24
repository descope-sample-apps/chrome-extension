import * as descopeUi from '@descope/web-components-ui'
import '@descope/web-component'

globalThis.DescopeUI = descopeUi;

import './popup.css';
const template = document.createElement('template');
template.innerHTML = `
<div id="outer">
  <div id="card">
    <img id="logo" src="/descope.png" alt="Logo" />
    <div id="title">Descope Login</div>
    <input id="issuer-domain" type="text" placeholder="Enter issuer domain" value="api.descope.org" class="mb-10" />
    <input id="client-id" type="text" placeholder="Enter client ID" />
    <button id="login">Login</button>
  </div>
</div>`;
document.body.appendChild(template.content.cloneNode(true));

const cardEle = document.getElementById('card');
const domainInput = cardEle.querySelector('#issuer-domain');
const clientIdInput = cardEle.querySelector('#client-id');
const loginBtn = cardEle.querySelector('#login');
const textEle = document.createElement('pre');

function showInputsAndButton(show) {
  clientIdInput.style.display = show ? '' : 'none';
  loginBtn.style.display = show ? '' : 'none';
  domainInput.style.display = show ? '' : 'none';
}

function showTextBox(show) {
  if (show && !textEle.isConnected) {
    cardEle.appendChild(textEle);
  } else if (!show && textEle.isConnected) {
    cardEle.removeChild(textEle);
  }
}

function updateUI(state) {
  if (state.userInfo) {
    showInputsAndButton(false);
    showTextBox(true);
    textEle.innerHTML = `<span class="success-msg">Welcome</span> <span class="user-name">${state.userInfo.name || state.userInfo.email}</span> <br><span class="sub-msg">You are logged in!</span>`;
  } else if (state.verificationUri && state.userCode) {
    showInputsAndButton(false);
    showTextBox(true);
    let msg = `<span class="device-login-title">Device Login</span><br><br>`;
    msg += `Please visit <a href="${state.verificationUri}" target="_blank" class="device-link">this link</a><br>and enter the code: <span class="user-code">${state.userCode}</span><br>`;
    if (state.polling) {
      msg += `<div class="polling-row"><span class="loader"></span> <span class="polling-msg">Waiting for login confirmation...</span></div>`;
    }
    textEle.innerHTML = msg;
  } else {
    // Initial screen: show input and button, hide text box
    showInputsAndButton(true);
    showTextBox(false);
  }
}

loginBtn.addEventListener('click', async (e) => {
  const clientId = clientIdInput.value;
  const issuerDomain = domainInput.value;
  if (clientId && issuerDomain) {
    chrome.runtime.sendMessage({ type: 'start-login', clientId, issuerDomain }, (response) => {
      if (response && response.status === 'started') {
        updateUI(response);
      }
    });
  } else {
    alert('Please enter a valid client ID and issuer domain.');
  }
});

// Listen for login success and polling start from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'login-success') {
    updateUI({ userInfo: message.userInfo });
  } else if (message.type === 'polling-start') {
    updateUI({
      verificationUri: message.verificationUri,
      userCode: message.userCode,
      polling: message.polling
    });
  }
});

// On popup open, get current state from background
chrome.runtime.sendMessage({ type: 'get-state' }, (state) => {
  updateUI(state || {})
});