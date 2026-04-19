/**
 * Orchestrator Events Route
 * 
 * POST /api/orchestrator/events
 * 
 * Receives events from Team-Studio services and forwards to Rust Orchestrator
 */

const router = require('express').Router();
const { emit_event_async } = require('../middleware/orchestrator-events');

/**
 * POST /api/orchestrator/events
 * 
 * Forward event to Rust Orchestrator
 * 
 * Request body (JSON):
 * {
 *   "event_type": "output_generated|session_created|project_updated|custom_agent_created",
 *   "data": {
 *     "project_id": "...",
 *     "session_id": "...",
 *     "content": "...",
 *     ... event-specific fields ...
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "file_id": "uuid",
 *   "message": "..."
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { event_type, data } = req.body;

    // Basic validation
    if (!event_type || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing event_type or data'
      });
    }

    // Prepare event with timestamp
    const event = {
      event_type,
      timestamp: new Date().toISOString(),
      data
    };

    // Forward to Orchestrator
    const orchestratorResponse = await emit_event_async(event);

    // Return orchestrator response
    return res.json(orchestratorResponse);
  } catch (err) {
    console.error('[orchestrator-events-route] Error:', err.message);

    // Check if error came from orchestrator
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.response?.error || err.message
      });
    }

    // Connection or other error
    return res.status(503).json({
      success: false,
      error: `Failed to reach Orchestrator: ${err.message}`
    });
  }
});

module.exports = router;
