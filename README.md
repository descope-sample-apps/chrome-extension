# Descope Chrome Extension Sample

This project is a sample Chrome extension demonstrating how to use [Descope](https://www.descope.com/) for device authentication in a browser extension context.


https://github.com/user-attachments/assets/78763d9b-1533-4e4b-8650-7c3e0f6efc55


## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [npm](https://www.npmjs.com/)
- [Google Chrome](https://www.google.com/chrome/)

### Installation
1. **Clone the repository:**
   ```sh
   git clone https://github.com/descope-dev/chrome-extension.git
   cd chrome-extension
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```

### Development Workflow

#### 1. Build and Watch
To develop and see live changes, run the build in watch mode:
```sh
npm run watch
```
This will use Rollup to bundle your JavaScript and CSS, and output to the `dist/` directory.

#### 2. Load the Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked** and select the `dist/` directory inside this project.
4. The Descope extension will now appear in your Chrome extensions bar.

#### 3. Using the Extension
- Click the extension icon to open the popup.
- Enter your **Issuer Domain** and **Client ID**.
- Click **Login** to start the device authentication flow.
- Follow the instructions to complete login on the Descope verification page.
- Once authenticated, your user info will be displayed in the popup.

## Scripts
- `npm run build` — Build the extension for production
- `npm run watch` — Build and watch for changes during development

## Notes
- Make sure to update the **Issuer Domain** and **Client ID** for your Descope project.
- The extension uses Manifest V3 and modern Chrome extension best practices.

## License
MIT
