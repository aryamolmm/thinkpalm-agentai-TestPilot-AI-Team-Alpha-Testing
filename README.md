# Jira Story Automation Hub 🚀

A premium, end-to-end dashboard designed to bridge the gap between Jira Story management and automated QA testing.

## 🌟 Key Features
- **Smart Jira Connection**: Connect to any Jira Cloud instance via API Token.
- **ADF Description Parser**: High-fidelity extraction of multi-paragraph Atlassian Document Format descriptions.
- **QA Suite Generator**: Automatically generates comprehensive test cases covering:
  - Happy Path
  - Negative Scenarios
  - Edge Cases & Boundary Values
  - Error Handling
  - Real-user Mistakes (Rapid clicks, network delays, etc.)
- **Playwright Automation IDE**: 
  - Generates TypeScript-based Playwright scripts directly from the story context.
  - Features a built-in code editor for refinement.
  - Includes a **Live Execution Console** to run tests and see results in the browser.
- **CORS Bypass Proxy**: Built-in Node.js server to handle secure cross-origin communication with Atlassian servers.

## 🛠️ Technical Stack
- **Frontend**: React 18, Vite, Axios
- **Backend/Proxy**: Node.js, Express, Child Process (for Playwright execution)
- **Automation**: Playwright (TypeScript/Chromium)
- **Design**: Premium Glassmorphism UI with Vanilla CSS

## 📂 Project Structure
- `src/components/`: React UI components (Login, Dashboard, QA Suite, Playwright IDE).
- `src/services/`: Business logic for Jira API, Test Case Generation, and Script Templates.
- `api/index.js`: The backend proxy and test runner engine (compatible with Vercel and Local).
- `tests/`: Directory where dynamic Playwright scripts are stored and executed.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js installed.
- Jira Cloud API Token (Get one [here](https://id.atlassian.com/manage-profile/security/api-tokens)).

### 2. Installation
```powershell
# Clone the repository (if applicable)
# Install dependencies
npm install
npx playwright install chromium
```

### 3. Launching the Hub
You need to run both the frontend and the backend proxy:

**Terminal 1 (Backend Proxy & Runner):**
```powershell
npm start
```

**Terminal 2 (Frontend):**
```powershell
npm run dev
```

### 4. Running Tests
1. Open the app at `http://localhost:5173`.
2. Connect to your Jira story.
3. Launch the **Playwright Automation IDE**.
4. Click **"▶ Launch Automation"** to execute tests and view logs in the live console.

---
Created with ❤️ by Antigravity AI
