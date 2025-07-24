// background.js
// This script runs in the background and manages state and logic for the extension

let deviceState = {
  deviceCode: null,
  interval: null,
  clientId: null,
  polling: false,
  accessToken: null,
  userInfo: null,
  issuerDomain: null,
};


function getApiUrl(path) {
  const domain = deviceState.issuerDomain;
  return `https://${domain}${path}`;
}

function resetDeviceState(clientId, issuerDomain) {
  Object.assign(deviceState, {
    deviceCode: null,
    interval: null,
    clientId,
    polling: false,
    accessToken: null,
    userInfo: null,
    issuerDomain: issuerDomain,
  });
}

async function startDeviceFlow(clientId, issuerDomain) {
  resetDeviceState(clientId, issuerDomain);
  const startRes = await fetch(getApiUrl('/oauth2/v1/device'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, scope: 'openid profile email' }),
  });
  const { device_code, user_code, verification_uri_complete, interval } = await startRes.json();
  Object.assign(deviceState, {
    deviceCode: device_code,
    userCode: user_code,
    verificationUri: verification_uri_complete,
    interval,
    polling: true,
    accessToken: null,
    userInfo: null
  });
  chrome.runtime.sendMessage({
    type: 'polling-start',
    verificationUri: verification_uri_complete,
    userCode: user_code,
    polling: true
  });
  pollForToken();
  return { user_code, verification_uri_complete, interval };
}

function broadcastStateUpdate() {
  chrome.runtime.sendMessage({ type: 'state-update', state: { ...deviceState } });
}

async function pollForToken() {
  if (!deviceState.polling) return;
  const pollingResponse = await fetch(getApiUrl('/oauth2/v1/token'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: deviceState.deviceCode,
      client_id: deviceState.clientId,
    })
  });
  if (pollingResponse.ok) {
    const data = await pollingResponse.json();
    deviceState.accessToken = data.access_token;
    deviceState.polling = false;
    await fetchUserInfo();
    chrome.runtime.sendMessage({ type: 'login-success', userInfo: deviceState.userInfo });
  } else if (deviceState.polling) {
    setTimeout(pollForToken, deviceState.interval * 1000);
  }
}

async function fetchUserInfo() {
  if (!deviceState.accessToken) return;
  const userInfoResponse = await fetch(getApiUrl('/oauth2/v1/userinfo'), {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${deviceState.accessToken}` },
  });
  if (userInfoResponse.ok) {
    deviceState.userInfo = await userInfoResponse.json();
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'start-login') {
    startDeviceFlow(message.clientId, message.issuerDomain).then((result) => {
      sendResponse({ status: 'started', ...result });
    });
    return true; // keep the message channel open for async response
  } else if (message.type === 'get-state') {
    sendResponse({ ...deviceState });
  }
});
