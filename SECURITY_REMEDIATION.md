# Security Remediation Guide

This document summarizes the immediate remediation steps after sensitive files were committed.

1. Remove files from git tracking (see `scripts/remove_committed_secrets.sh`).
2. Rotate all exposed secrets (OpenClaw token, Telegram bot token, device keys, TLS certs).
3. Purge git history using `scripts/purge_history.sh` (requires `git-filter-repo`).
4. Replace secrets in CI with encrypted secrets / secret manager entries.
5. Verify logs do not contain secrets; update logging sanitizers in `server/utils/sanitize.js`.
6. Conduct a repo-wide secret scan using `trufflehog` or `git-secrets`.

