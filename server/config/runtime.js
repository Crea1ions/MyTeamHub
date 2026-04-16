/**
 * Runtime Configuration
 *
 * Centralized access to runtime paths and environment configuration.
 * Allows multi-environment support (development, production) and
 * multi-mode execution (local filesystem, future: remote server).
 *
 * Usage:
 *   const runtimeConfig = require('./config/runtime');
 *   const sessionsPath = runtimeConfig.PATHS.sessions;
 *   const logsPath = runtimeConfig.PATHS.logs;
 */

const path = require('path');

// ============================================================================
// Environment Configuration
// ============================================================================

/**
 * NODE_ENV — Node.js execution environment
 * Defaults: 'development'
 */
const ENVIRONMENT = process.env.NODE_ENV || 'development';

/**
 * RUNTIME_MODE — How runtime data is accessed
 * Values:
 *   'local' (default) — Local filesystem (development, single-user)
 *   'server' (future) — Remote backend via API (production, multi-user, Tauri, Rust backend)
 */
const RUNTIME_MODE = process.env.RUNTIME_MODE || 'local';

/**
 * RUNTIME_PATH — Base directory for all runtime data
 * Default: <repo-root>/runtime
 * Can be overridden for custom deployments, Docker volumes, etc.
 */
const RUNTIME_PATH = process.env.RUNTIME_PATH || path.join(__dirname, '../../runtime');

// ============================================================================
// Path Definitions (Hierarchical)
// ============================================================================

const PATHS = {
  // Root directories
  runtime: RUNTIME_PATH,

  // System infrastructure (volatile, cache, PIDs)
  system: path.join(RUNTIME_PATH, 'system'),
  state: path.join(RUNTIME_PATH, 'system/state'),
  cache: path.join(RUNTIME_PATH, 'system/cache'),
  pids: path.join(RUNTIME_PATH, 'system/pids'),

  // Data (business data: sessions, agents, projects)
  data: path.join(RUNTIME_PATH, 'data'),
  sessions: path.join(RUNTIME_PATH, 'data/sessions'),
  agents: path.join(RUNTIME_PATH, 'data/agents'),
  projects: path.join(RUNTIME_PATH, 'data/projects'),

  // Logs (audit trail, immutable)
  logs: path.join(RUNTIME_PATH, 'logs'),

  // Archive (historical reports, snapshots)
  archive: path.join(RUNTIME_PATH, 'archive'),

  // Media (artefacts: screenshots, test-results)
  media: path.join(RUNTIME_PATH, 'media'),
  screenshots: path.join(RUNTIME_PATH, 'media/screenshots'),
};

// ============================================================================
// Export Configuration
// ============================================================================

module.exports = {
  // Environment info
  ENVIRONMENT,
  RUNTIME_MODE,
  RUNTIME_PATH,

  // Path access
  PATHS,

  // Helper to check if we're in development
  isDevelopment: () => ENVIRONMENT === 'development',
  isProduction: () => ENVIRONMENT === 'production',

  // Helper to check runtime mode
  isLocalMode: () => RUNTIME_MODE === 'local',
  isServerMode: () => RUNTIME_MODE === 'server',

  // Metadata
  version: '1.0.0',
  description: 'Runtime configuration for MyTeamHub — centralizes path access and environment setup',
};
