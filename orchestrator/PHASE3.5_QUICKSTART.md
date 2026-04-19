# Phase 3.5: Quick Start - LLM Validation Setup

## 🚀 Getting Started with Real LLM Integration

This guide shows how to activate Phase 3.5 Reality Integration testing with a real Mistral API key.

## Step 1: Get Mistral API Key

1. Visit https://console.mistral.ai
2. Sign up or log in
3. Create API key in your account settings
4. Copy the key

## Step 2: Configure Environment

```bash
# Navigate to orchestrator directory
cd orchestrator

# Create .env file from template
cp .env.example .env

# Edit .env and add your key
nano .env  # or your editor

# Verify .env is in .gitignore (it is - you're safe!)
grep ".env" .gitignore
```

**Content of .env**:
```env
MISTRAL_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
```

## Step 3: Verify Setup

```bash
# Check compilation with LLM support
cargo build --release

# Run all tests (including Phase 3.5)
cargo test --release

# Expected: 181/181 tests passing ✅
```

## Step 4: Test LLM Analyzer (Manual Test)

Create `test_llm.rs` in project root:

```rust
use orchestrator::prelude::*;
use orchestrator::LLMAnalyzerAgent;
use serde_json::json;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load API key
    dotenv::dotenv().ok();
    let api_key = env::var("MISTRAL_API_KEY")
        .expect("MISTRAL_API_KEY not set in .env");

    // Create analyzer
    let analyzer = LLMAnalyzerAgent::new(api_key);

    // Create test context
    let context = AgentContext {
        workflow_id: "wf_test".to_string(),
        task: "Analyze this project".to_string(),
        event_data: json!({
            "content": "MyTeamHub is a multi-agent orchestration system for structured thinking"
        }),
        vault_root: "./vault".to_string(),
        execution_id: "exec_001".to_string(),
        timeout_secs: 30,
    };

    // Execute analysis
    println!("Calling Mistral LLM...");
    let output = analyzer.execute(context).await?;

    // Display results
    println!("\n✅ Analysis Complete!");
    println!("Status: {}", output.metadata.status);
    println!("Duration: {}ms", output.metadata.duration_ms);
    println!("\nResult:");
    println!("{}", serde_json::to_string_pretty(&output.result)?);

    if let Some(logs) = output.logs {
        println!("\nLogs:");
        for log in logs {
            println!("  - {}", log);
        }
    }

    Ok(())
}
```

Run it:
```bash
cargo run --release --example test_llm 2>/dev/null
```

## What to Expect

✅ **Success (1-3 seconds)**:
```
✅ Analysis Complete!
Status: success
Duration: 2451ms

Result:
{
  "analysis": "MyTeamHub appears to be a sophisticated orchestration...",
  "model": "mistral-small",
  "duration_ms": 2451
}
```

❌ **Invalid Key**:
```
Status: error
Error: Mistral API call failed: 401 Unauthorized
```

❌ **Oversized Input**:
```
Status: error
Error: Input too large for analysis (input_size_bytes: 60000, limit: 50000)
```

## 📊 Cost Expectations

Using Mistral-small:
- **Input**: ~$0.14 per million tokens
- **Output**: ~$0.42 per million tokens
- **Typical analysis**: 200-500 tokens → ~$0.0001-0.0003 per call

## 🔒 Security Notes

1. **Never commit .env** - It's in .gitignore for a reason
2. **Rotate keys regularly** - Especially if exposed
3. **Monitor API usage** - Check Mistral console for suspicious activity
4. **Use environment variables in production** - Not .env files

## Troubleshooting

### "MISTRAL_API_KEY must be set"
```bash
# Check .env exists and has the key
cat .env | grep MISTRAL_API_KEY

# Re-run with explicit export
export MISTRAL_API_KEY=$(cat .env | grep MISTRAL_API_KEY | cut -d= -f2)
cargo test --release
```

### "401 Unauthorized"
- API key is wrong or expired
- Generate a new key from Mistral console

### "Connection timeout"
- Network issue (check internet connection)
- Mistral API is down (check status page)
- Firewall blocking (check proxy settings)

### "Invalid response format"
- API changed format (unlikely)
- Try with fresh cargo clean: `cargo clean && cargo build --release`

## 📈 Next Steps After Validation

### If analysis is useful:
1. Integrate into OrchestratorEngine agent registry
2. Create workflow rule for LLM analysis
3. Save results to vault
4. Iterate on prompt quality

### If analysis needs improvement:
1. Adjust prompt in `llm_analyzer.rs`
2. Try mistral-medium (better quality, slower)
3. Add examples to prompt
4. Use structured output format

### If latency is issue:
1. Measure actual response times
2. Consider async queuing
3. Try request batching
4. Explore streaming API

## 🎯 Reality Integration Success Criteria

✅ LLMAnalyzer successfully calls Mistral API
✅ Responses are parseable and useful
✅ System handles API errors gracefully
✅ Latency is acceptable for workflow
✅ Cost is within budget
✅ All 181 tests still passing

---

**Ready to validate?** Run Phase 3.5 tests now! 🚀
