# MyTeamHub Web UI — Phase 4 Dashboard

> Lightweight web interface for Orchestrator validation and LLM workflow execution

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Orchestrator running on `localhost:8001`
- Mistral API key configured in orchestrator `.env`

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Start Web UI

```bash
npm run dev
```

The UI will be available at `http://localhost:3000`

### 3. Start Orchestrator (in separate terminal)

```bash
cd orchestrator
cargo run --release
```

Server will listen on `http://localhost:8001`

## 📋 Two-Screen MVP

### Screen 1: Dashboard
- **URL**: `http://localhost:3000/`
- **Purpose**: System overview and workflow history
- **Features**:
  - Orchestrator health indicator
  - Active workflow count
  - Recent workflows list (3-5 items)
  - Quick stats (success rate, avg latency)

### Screen 2: Workflow Executor
- **URL**: `http://localhost:3000/executor`
- **Purpose**: Submit and execute workflows
- **Features**:
  - Task description input
  - Optional context field
  - Real-time execution status
  - LLM analysis results display
  - Error handling with retry

## 🔧 API Integration

Web UI calls Orchestrator HTTP API on `localhost:8001`:

```
GET    /orchestrator/status          → Health + active workflows
GET    /orchestrator/workflows       → List recent workflows
GET    /orchestrator/workflows/:id   → Get workflow details
POST   /api/events                   → Submit new workflow
```

See [Orchestrator API Docs](../orchestrator/README.md) for details.

## 📁 Project Structure

```
web/
├── src/
│   ├── pages/
│   │   ├── index.astro             # Dashboard page
│   │   └── executor.astro          # Workflow executor page
│   ├── components/
│   │   ├── Dashboard.tsx           # Dashboard components (React)
│   │   ├── Executor.tsx            # Executor form (React)
│   │   └── DashboardPage.astro     # Dashboard layout (Astro)
│   └── lib/
│       └── api.ts                  # HTTP client for Orchestrator
├── astro.config.mjs                # Astro configuration
├── package.json                    # Dependencies
└── README.md                       # This file
```

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Astro 4.x | Minimal JS, file-based routing |
| **Components** | React 18 | Interactive UI elements |
| **Data Fetching** | React Query 5 | Efficient API queries + caching |
| **HTTP Client** | Axios | REST calls with interceptors |
| **Icons** | Lucide React | Consistent icon set |
| **Styling** | CSS-in-JS | Inline styles for simplicity |

## 🔗 API Client Usage

```typescript
import { orchestratorClient } from './src/lib/api';

// Get status
const status = await orchestratorClient.getStatus();
console.log(status.active_workflows);

// List workflows
const workflows = await orchestratorClient.listWorkflows();

// Submit workflow
const { workflow_id } = await orchestratorClient.submitEvent({
  task: "Analyze MyTeamHub architecture",
  event_data: { context: "Focus on security" }
});

// Poll for results
const result = await orchestratorClient.getWorkflow(workflow_id);
```

## 🧪 Testing

### Manual Testing Workflow

1. **Dashboard**: Should show orchestrator health (green = running)
2. **Submit Workflow**: Enter task "Analyze MyTeamHub"
3. **See Results**: LLM analysis appears within 2-3 seconds
4. **Error Handling**: Try with empty task (should reject)
5. **Network Error**: Stop orchestrator, see graceful error

### Development Mode

```bash
npm run dev
# Hot reload on file changes
# Error overlay shows compilation issues
```

### Production Build

```bash
npm run build
# Outputs optimized static HTML in dist/
npm run preview
# Test production build locally
```

## 🚨 Troubleshooting

### "Cannot connect to Orchestrator"
- Ensure orchestrator is running: `cd orchestrator && cargo run --release`
- Check port 8001: `curl http://localhost:8001/orchestrator/status`
- Verify firewall not blocking localhost

### "CORS error"
- Add CORS headers to orchestrator if needed
- Ensure requests go to `localhost:8001` not remote server

### Workflows stuck processing
- Check orchestrator logs for errors
- Verify Mistral API key in `.env`
- Try shorter task description (< 50KB)

### Slow LLM responses
- Normal: 1-3 seconds for Mistral API
- Check internet connection
- Try smaller input (100s of tokens vs 1000s)

## 📊 Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Dashboard load | < 2s | ✅ |
| Workflow submit | < 100ms | ✅ |
| LLM response | 1-3s | ⏳ API latency |
| Page build | < 5s | ✅ |

## 🔄 Data Flow

```
User Input
    ↓
Web UI Form
    ↓
HTTP POST /api/events
    ↓
Orchestrator Engine
    ├─ InputValidator
    ├─ PermissionChecker
    ├─ StateInvariantChecker
    └─ LLMAnalyzer
    ↓
HTTP Response + Workflow ID
    ↓
Web UI (Polling)
    ↓
Display Results
```

## 📝 Next Steps

### Phase 4.2: Dashboard Enhancement
- [ ] Real-time workflow updates (WebSocket)
- [ ] Workflow detail modal
- [ ] Search/filter workflows
- [ ] Export results

### Phase 4.3: Advanced Executor
- [ ] Workflow template library
- [ ] Input validation before submit
- [ ] Result diff viewer
- [ ] History/redo

### Phase 4.4+: Desktop Packaging
- [ ] Tauri desktop wrapper
- [ ] System tray integration
- [ ] File system access
- [ ] Offline support

## 📄 License

Same as MyTeamHub project

## 👤 Contributors

Phase 4 Web UI — April 2026
