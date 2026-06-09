# TestPilot AI 🚀

**TestPilot AI** is a state-of-the-art, multi-agent autonomous testing platform built with React, Node.js, and cutting-edge LLMs. It transforms raw requirements or Jira stories into production-ready BDD scenarios, Playwright scripts, and comprehensive test coverage — all with zero manual effort.

### 🛑 The Problem
Modern QA cycles are often the bottleneck in Rapid Application Development. Manually translating business requirements into BDD scenarios, writing stable automation scripts, and ensuring comprehensive coverage is time-consuming, expensive, and prone to human error.

### ✅ The Solution
TestPilot AI streamlines the entire Quality Assurance lifecycle. It transforms raw requirements (or Jira stories) into:
- **High-quality BDD/Gherkin scenarios**
- **Production-ready Playwright scripts**
- **QMetry test case sync & execution tracking**
- **Deep-dive coverage analysis & self-healing rework loops**
- **API, Performance & Security Testing workflows**
- **Manual test execution with real-time status updates**

---

## 👥 Team Alpha & Contributions
- **Sherine T. (Test Lead)**: Primarily handled architecture design and code structuring.
- **Aryamol M M. (Senior Software Engineer – Testing)**: Primarily handled the coding and main agent creation.

---

## 📸 Prototype Gallery

| Super Agent Execution | BDD Scenario Generation |
| :---: | :---: |
| ![Super Agent Run](screenshots/super_agent_run.png) | ![BDD Scenarios](screenshots/bdd_scenarios.png) |

| Playwright Script Creation | Custom Architecture |
| :---: | :---: |
| ![Playwright Scripts](screenshots/playwright_scripts.png) | ![Architecture](docs/architecture.png) |

---

## 🚀 How to Run

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/thinkpalm-agentai/testpilotai.git
cd testpilotai

# Install dependencies
npm install
```

### 2. Configuration
Create a `.env` file in the root directory:
```env
# AI API Keys
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
GROQ_MODEL=llama-3.1-8b-instant

# Jira Integration
JIRA_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your_jira_token

# QMetry Integration (Optional)
QMETRY_API_KEY=your_qmetry_api_key
QMETRY_PROJECT_KEY=your_project_key
```

### 3. Execution Modes

#### **A. Web Dashboard (Recommended)**
Start both the AI Backend and the Vite Frontend:
```bash
# Terminal 1: Start Backend (Port 3001)
npm run server

# Terminal 2: Start Frontend (Port 5174)
npm run dev
```

#### **B. CLI Pipeline**
Run the orchestrator directly from the terminal:
```bash
# Process a manual description
npm start "User should be able to reset password via email OTP"

# Process a Jira Story
npm start KAN-101

# Generate test cases from a story ID
npm run generate KAN-101
```

#### **C. Run Playwright Tests**
```bash
npm test
```

---

## 🎥 Video Demonstration
[View the 5-Minute Project Walkthrough (Loom)](https://www.loom.com/share/82f393eae3674a0cb835b921ea2b2919)

---

## 🛠️ Tech Stack & Versions

### Frontend
- **React 18.2.0** – UI library powering the agentic studio.
- **Vite 5.0.0** – Ultra-fast build tool for development.
- **Framer Motion 11.x** – High-performance animations & micro-interactions.
- **Lucide React 0.370.x** – Premium, consistent iconography.

### Backend & AI
- **Node.js 20.x** – Core runtime environment.
- **Express 4.19.x** – Web framework for AI proxying & REST API.
- **Google Gemini 1.5 Pro** – Primary semantic reasoning engine.
- **Groq (Llama 3.1 – 8B Instant)** – High-speed agentic processing.
- **Axios 1.7.x** – Robust HTTP client for all API integrations.
- **UUID 9.x** – Unique ID generation for executions and test cases.

### Testing & Automation
- **Playwright 1.44.x** – Target automation framework for E2E tests.
- **TypeScript 5.3.3** – Type safety across the entire AI pipeline.

### Integrations
- **Jira Cloud REST API** – Story ingestion, requirement linking.
- **QMetry Test Management API** – Test case sync, folder management, and execution status updates.

---

## 🧠 Multi-Agent Architecture

TestPilot AI uses a **specialist multi-agent pipeline**. Each agent handles a focused role, dramatically reducing LLM hallucination:

| Agent | Role |
|---|---|
| `orchestratorAgent` | Routes input to the correct downstream agent flow |
| `toolSelectionAgent` | Determines which tools/integrations are needed |
| `gherkinAgent` | Converts requirements/stories into BDD Gherkin scenarios |
| `testAgent` | Generates production-ready Playwright `.spec.ts` scripts |
| `coverageAgent` | Analyzes test coverage gaps against BDD scenarios |
| `improvementAgent` | Self-heals gaps identified by the Coverage Agent |
| `memoryAgent` | Caches executions to prevent redundant API calls |
| `superAgent` | Orchestrates the full end-to-end pipeline with live streaming logs |

---

## 🧠 Developer Observations

As the lead AI architect for this project, here are the key observations from the development and optimization phase:

1. **Agentic Specialization vs. Monolithic LLMs**:  
   The multi-agent approach (breaking tasks into Architect, Automation, and Coverage roles) significantly reduces "hallucination." By forcing each agent to focus on a narrow JSON schema, output quality and reliability improved by ~40% compared to a single-prompt approach.

2. **Memory as a Quality Gate**:  
   The `Memory Agent` acts as a crucial cost-saving and consistency mechanism. By matching current tasks against past executions, the system avoids redundant API calls and preserves "lessons learned" from previous rework loops.

3. **The "Rework" Feedback Loop**:  
   The most powerful feature observed is the interplay between the `Coverage Agent` and `Improvement Agent`. Automating the bridge between "what is missing" and "how to fix it" creates a self-healing pipeline that mirrors a real human QA workflow.

4. **UI/UX for Transparency**:  
   In autonomous systems, "black-box" processing is the enemy of user trust. The introduction of the **Super Agent Terminal** with real-time process logs transformed the platform from a simple converter into a transparent, collaborative AI partner.

5. **QMetry Sync for Real-World Integration**:  
   Integrating QMetry's folder/test-case API closes the loop — generated test cases don't just live on disk, they are automatically organized and synced into the team's existing test management workflow.

---

## 📂 Project Anatomy

```text
testpilotai/
├── api/
│   └── index.js                  # Express Backend, all AI & QMetry proxy endpoints
├── src/
│   ├── ai/                       # Multi-Agent Logic
│   │   ├── orchestratorAgent.ts  # Top-level routing agent
│   │   ├── toolSelectionAgent.ts # Tool/integration selector
│   │   ├── superAgent.ts         # Full pipeline orchestrator w/ streaming
│   │   ├── gherkinAgent.ts       # BDD/Gherkin scenario generator
│   │   ├── testAgent.ts          # Playwright script generator
│   │   ├── coverageAgent.ts      # Coverage gap analyzer
│   │   ├── improvementAgent.ts   # Self-healing rework agent
│   │   ├── memoryAgent.ts        # Execution memory & deduplication
│   │   └── groqClient.ts         # Groq LLM client configuration
│   ├── components/               # Premium React Components
│   │   ├── Dashboard.jsx         # Main landing dashboard
│   │   ├── SuperAgent.jsx        # Super Agent terminal UI
│   │   ├── TestGenPage.jsx       # AI test generation page
│   │   ├── TestCasePage.jsx      # Test case management & QMetry sync
│   │   ├── ExecutionPage.jsx     # Automated test execution runner
│   │   ├── ManualExecutionPage.jsx # Manual test execution with status updates
│   │   ├── ExecutionReport.jsx   # Detailed execution reports
│   │   ├── ReportsPage.jsx       # Aggregated reports & analytics
│   │   ├── StoriesPage.jsx       # Jira stories browser
│   │   ├── ProjectsPage.jsx      # QMetry project management
│   │   ├── PlaywrightPage.jsx    # Playwright script viewer & runner
│   │   ├── ApiTestingPage.jsx    # API testing workflow
│   │   ├── PerformanceTestingPage.jsx # Performance testing workflow
│   │   ├── SecurityTestingPage.jsx   # Security testing workflow
│   │   ├── MemoryPage.jsx        # Memory Agent viewer
│   │   ├── SettingsPage.jsx      # App & integration settings
│   │   ├── History.jsx           # Execution history log
│   │   └── Login.jsx             # Authentication page
│   ├── jira/
│   │   └── jiraReader.ts         # Jira REST API client
│   ├── services/
│   │   ├── api.js                # Frontend → Backend API service
│   │   ├── generator.js          # Test generation utilities
│   │   ├── jira.js               # Jira service layer
│   │   ├── qmetryService.js      # QMetry integration service
│   │   ├── csvParser.js          # CSV test import parser
│   │   └── settingsService.js    # Settings persistence service
│   ├── memory/
│   │   └── memory.json           # Persisted agent memory store
│   ├── App.jsx                   # Main application router & layout
│   ├── index.ts                  # CLI entry point
│   ├── memory.ts                 # Memory type definitions
│   └── tools.ts                  # Shared tool definitions
├── tests/                        # Generated Playwright Test Suites
│   ├── generated.spec.ts         # Default generated test suite
│   ├── tp_TC_001.spec.ts         # TestPilot generated spec (TC-001)
│   ├── KAN-4_test.spec.ts        # Jira KAN-4 generated spec
│   ├── KAN-5_test.spec.ts        # Jira KAN-5 generated spec
│   └── ...                       # Additional generated specs
├── docs/
│   ├── architecture.png          # Visual flow of the Multi-Agent system
│   ├── architecture-overview.md  # Technical write-up of agent logic
│   └── overview.md               # Project high-level overview
├── .env                          # Environment variables (not committed)
├── playwright.config.ts          # Playwright automation configuration
├── vite.config.js                # Vite frontend build configuration
├── vercel.json                   # Vercel deployment configuration
└── package.json                  # Project dependencies & scripts
```

---

## 📄 License
TestPilot AI is research-grade software developed by **ThinkPalm Technologies**. All rights reserved © 2025.
