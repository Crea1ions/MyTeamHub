# Mistral API Proxy - Security Implementation

## Overview

A secure proxy endpoint has been implemented at `/orchestrator/llm/chat/completions` to handle all Mistral AI API communications. This ensures:

- 🔐 **API Key Security**: Mistral API key remains on the backend, never exposed to the frontend
- 📊 **Centralized Logging**: All LLM calls are logged and can be monitored
- ⏱️ **Rate Limiting**: Backend can implement rate limiting per-user/per-session
- 💾 **Caching**: Future optimization for response caching
- 🛡️ **Input Validation**: Requests are validated before forwarding to Mistral

## Architecture

```
Frontend (Browser)
     ↓ HTTP POST
     └─→ Orchestrator Proxy (localhost:8001)
            ├─ Validates request
            ├─ Adds MISTRAL_API_KEY from environment
            ├─ Forwards to Mistral API
            └─ Returns response to frontend
```

## Endpoint

**POST** `/orchestrator/llm/chat/completions`

### Request Body

```json
{
  "model": "mistral-small",  // optional, defaults to "mistral-small"
  "messages": [
    {
      "role": "user",
      "content": "Your question here"
    }
  ],
  "temperature": 0.7,        // optional
  "max_tokens": 1024         // optional
}
```

### Response

```json
{
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Response from Mistral model"
      }
    }
  ],
  "model": "mistral-small",
  "usage": {
    "prompt_tokens": 16,
    "completion_tokens": 13
  }
}
```

### Error Responses

- `400 Bad Request` - Missing or invalid messages array
- `401 Unauthorized` - Invalid Mistral API key
- `429 Too Many Requests` - Mistral API rate limit exceeded
- `500 Internal Server Error` - Other errors

## Frontend Usage

### Using the OrchestratorClient

```typescript
import { orchestratorClient } from '@/lib/api';

// Simple chat call
const response = await orchestratorClient.chatWithMistral([
  { role: 'user', content: 'What is 2+2?' }
]);

// With custom model
const response = await orchestratorClient.chatWithMistral(
  [{ role: 'user', content: 'Analyze this code...' }],
  'mistral-large-latest'
);
```

## Backend Implementation

### Handler Code (`src/api/handlers.rs`)

- Validates request body
- Reads `MISTRAL_API_KEY` from environment
- Forwards to `https://api.mistral.ai/v1/chat/completions`
- Handles errors gracefully
- Returns Mistral's response directly

### Route Registration (`src/api/mod.rs`)

```rust
.route("/orchestrator/llm/chat/completions", post(handlers::proxy_mistral_chat))
```

## Security Considerations

1. **API Key Management**
   - Never commit `.env` file to version control
   - Use environment variables for production
   - Rotate keys regularly

2. **Input Validation**
   - Messages array must not be empty
   - Content length limits can be enforced
   - Rate limiting per IP/session (future)

3. **Error Handling**
   - Generic error messages to prevent information leakage
   - Detailed logging on backend only
   - Proper HTTP status codes

## Testing

### Via cURL

```bash
curl -X POST http://localhost:8001/orchestrator/llm/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### Via Frontend

```typescript
// In a React component
const response = await orchestratorClient.chatWithMistral([
  { role: 'user', content: 'Test message' }
]);
console.log(response);
```

## Integration Points

### Phase 5.2A - Vault UI
When implementing AI-assisted file analysis or suggestions, use the proxy instead of direct API calls.

### Agents
Internal agents can also use this proxy for LLM calls instead of making direct HTTP calls.

### Future Features
- Document summarization via LLM
- Code review/analysis
- Automated tagging
- Query optimization suggestions

## Environment Setup

```bash
# In orchestrator/.env
MISTRAL_API_KEY=your_api_key_here

# Before running orchestrator
export MISTRAL_API_KEY=$(cat orchestrator/.env | grep MISTRAL_API_KEY | cut -d '=' -f 2)
```

## Performance

- Timeout: 30 seconds per request
- Recommended max_tokens: 2048
- Recommended temperature: 0.5-0.8 for analysis tasks

## Future Enhancements

- [ ] Add request/response caching
- [ ] Implement per-user rate limiting
- [ ] Add request logging to audit trail
- [ ] Support streaming responses
- [ ] Add cost tracking per model
- [ ] Implement request batching

## References

- [Mistral API Documentation](https://docs.mistral.ai/api/chat-completions/)
- [Current Architecture](./BACKEND_INTEGRATION.md)
- [Phase 5.2A Implementation](../PLAN.md#phase-52a)
