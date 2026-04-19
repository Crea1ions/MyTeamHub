/**
 * Orchestrator Events Middleware
 * 
 * Intercepts and forwards events from Team-Studio services to Rust Orchestrator
 * 
 * Flow:
 * - Team-Studio service generates event (e.g., output generated, session created)
 * - Event passed to this middleware via emit_event()
 * - Middleware forwards to http://127.0.0.1:8001/api/events
 * - Orchestrator validates, routes, and persists to Vault
 * - Response returned to caller
 */

const http = require('http');

const ORCHESTRATOR_HOST = process.env.ORCHESTRATOR_HOST || '127.0.0.1';
const ORCHESTRATOR_PORT = process.env.ORCHESTRATOR_PORT || 8001;
const ORCHESTRATOR_URL = `http://${ORCHESTRATOR_HOST}:${ORCHESTRATOR_PORT}/api/events`;

/**
 * Emit event to Orchestrator
 * 
 * @param {Object} event - Event object with structure:
 *   {
 *     event_type: "output_generated|session_created|project_updated|custom_agent_created",
 *     timestamp: "ISO8601",
 *     data: { ... event-specific fields ... }
 *   }
 * @param {Function} callback - (error, response) => {}
 */
function emit_event(event, callback) {
  // Validate event structure
  if (!event || !event.event_type || !event.data) {
    const err = new Error('Invalid event structure: missing event_type or data');
    if (callback) callback(err, null);
    return;
  }

  // Default timestamp if not provided
  if (!event.timestamp) {
    event.timestamp = new Date().toISOString();
  }

  const payload = JSON.stringify(event);

  const options = {
    hostname: ORCHESTRATOR_HOST,
    port: ORCHESTRATOR_PORT,
    path: '/api/events',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      try {
        const parsed = JSON.parse(responseData);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (callback) callback(null, parsed);
        } else {
          const err = new Error(`Orchestrator error: ${res.statusCode}`);
          err.statusCode = res.statusCode;
          err.response = parsed;
          if (callback) callback(err, null);
        }
      } catch (parseErr) {
        if (callback) callback(parseErr, null);
      }
    });
  });

  req.on('error', (err) => {
    console.error(`[orchestrator-events] Connection error to ${ORCHESTRATOR_URL}:`, err.message);
    if (callback) callback(err, null);
  });

  req.write(payload);
  req.end();
}

/**
 * Emit event asynchronously (Promise-based)
 * 
 * @param {Object} event - Event object
 * @returns {Promise} Resolves with orchestrator response
 */
function emit_event_async(event) {
  return new Promise((resolve, reject) => {
    emit_event(event, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

module.exports = {
  emit_event,
  emit_event_async,
  ORCHESTRATOR_URL
};
