import './popup.css';
import { PopupService } from './services/popupService.js';

// Create the popup template
const template = document.createElement('template');
template.innerHTML = `
<div id="outer">
  <div id="card">
    <img id="logo" src="/descope.png" alt="Logo" />
    <div id="title">Descope Login</div>
    <input id="project-id" type="text" placeholder="Enter Project ID" class="mb-10" />
    <input id="app-id" type="text" placeholder="Enter App ID (optional)" class="mb-10" />
    <button id="login">Login</button>
    <button id="test-api">Test API Call</button>
  </div>
</div>`;

// Append template to body
document.body.appendChild(template.content.cloneNode(true));

// Initialize popup service
new PopupService();