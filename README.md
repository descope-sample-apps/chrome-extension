# Descope Chrome Extension Sample App

[![License: ISC](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-yellow.svg)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange.svg)](https://developer.chrome.com/docs/extensions/mv3/)

A Chrome extension sample app demonstrating secure OAuth 2.0 authorization code flow using [Descope Federated Apps](https://www.descope.com/). This extension showcases how to integrate Descope's authentication platform within a browser extension context using modern Chrome Extension Manifest V3 standards.

## Features

- 🔐 **OAuth 2.0 Authorization Code Flow** - Secure OIDC authentication using Descope Federated Apps
- 🚀 **Manifest V3 Compliant** - Built with the latest Chrome Extension standards
- 🎯 **PKCE Security** - Implements Proof Key for Code Exchange for enhanced security

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **[Node.js](https://nodejs.org/)** (v16.0.0 or later)
- **[npm](https://www.npmjs.com/)** (comes with Node.js)
- **[Google Chrome](https://www.google.com/chrome/)** (latest version recommended)
- **Descope Account** - [Sign up for free](https://www.descope.com/)

## Installation

### Clone from GitHub

1. **Clone the repository:**
   ```bash
   git clone https://github.com/descope-sample-apps/chrome-extension.git
   cd chrome-extension
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Configuration

### 1. Descope Setup

1. **Create a Descope Project:**
   - Go to the [Descope Console](https://app.descope.com/)
   - Create a new project or select an existing one
   - Note your **Project ID**

2. **Configure Federated App:**
   - Navigate to Federated Apps in your Descope console
   - Use the OIDC default application or create a new OIDC Federated App
   - Note your **App ID** (optional - defaults to OIDC default application)

### 2. Extension Configuration

Enter your **Project ID** and optionally your **App ID** in the extension popup after installation. If no App ID is provided, the extension will use the default Descope OIDC app.

## Development

### Build and Watch Mode

For active development with hot reload:

```bash
npm run watch  # Build and watch for changes
```

### Loading in Chrome

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist/` directory

## Usage

### Setup

1. **Click the Extension Icon:**
   - Look for the Descope icon in your Chrome toolbar
   - Click to open the authentication popup

2. **Enter Project Details:**
   - **Project ID**: Enter your Descope project ID (required)
   - **App ID**: Enter your Descope Federated App ID (optional - defaults to OIDC default application)

3. **Initiate Authentication:**
   - Click the "Login" button
   - The OAuth authorization code flow will begin

### Authentication Flow

1. **Authorization Request**: Extension generates a code verifier/challenge and redirects to Descope
2. **User Authentication**: User authenticates through the Descope flow
3. **Code Exchange**: Extension exchanges authorization code for tokens using PKCE
4. **Token Storage**: Access and ID tokens are securely stored and are able to be used by the extension

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build for production |
| `npm run watch` | Build and watch for changes |
