/**
 * PM2 Ecosystem Configuration for APP-MyTeamHub
 * 
 * Manages:
 * - Rust Orchestrator (LLM agents, vault operations) on :8001
 * - Frontend (Astro/React) on :3000
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 stop ecosystem.config.js
 *   pm2 restart ecosystem.config.js
 *   pm2 logs orchestrator
 *   pm2 logs frontend
 *   pm2 delete ecosystem.config.js
 * 
 * Architecture (Phase 5.2):
 * 
 * LLM Chat Flow (FAST - <1s):
 *   Frontend → /api/chat → Orchestrator → Mistral API → Frontend
 *   (no workflow polling, direct response)
 * 
 * File Operations (Vault):
 *   Frontend → /orchestrator/* → Orchestrator → Vault → Frontend
 *   (manual save/load operations)
 */

module.exports = {
  apps: [
    {
      // Rust Orchestrator
      // Hosts: LLM agents, vault operations, event processing
      name: 'orchestrator',
      cwd: '/home/devdipper/dev/APP/001-APP-MyTeamHub/orchestrator',
      script: './target/release/orchestrator',
      instances: 1,
      exec_mode: 'fork',
      env: {
        MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || '',
        RUST_LOG: 'info',
        PORT: 8001,
      },
      // Lifecycle
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      listen_timeout: 5000,
      kill_timeout: 5000,
      // Logging
      error_file: './logs/orchestrator-error.log',
      out_file: './logs/orchestrator-out.log',
      log_file: './logs/orchestrator.log',
      time: true,
    },

    {
      // Frontend (Astro + React)
      // Serves Studio, Vault, Config screens
      name: 'frontend',
      cwd: '/home/devdipper/dev/APP/001-APP-MyTeamHub/web',
      script: 'npm',
      args: 'run dev',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      // Lifecycle
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '512M',
      listen_timeout: 30000,
      kill_timeout: 10000,
      // Logging
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend.log',
      time: true,
    },
  ],
};
