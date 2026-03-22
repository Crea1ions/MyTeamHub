Title: chore(secrets): remove committed secrets from repo and add to .gitignore

Summary
------
This PR removes sensitive files from the repository tracking and adds them to `.gitignore`:

- `server/.env`
- `server/.openclaw_device.json`
- `server/ssl/key.pem`
- `server/ssl/cert.pem`

It also includes a helper script at `scripts/remove_committed_secrets.sh` to back up and untrack the files.

Why
---
These files contain private keys and tokens which were inadvertently committed. They must be removed from the repo and rotated.

What was changed
----------------
- `.gitignore` updated at repository root and `server/.gitignore`
- Added `scripts/remove_committed_secrets.sh`
- Added `scripts/purge_history.sh` (instructions to run git-filter-repo)

Important notes for reviewers
----------------------------
- This PR does NOT purge history. After merge, a maintainer should run `scripts/purge_history.sh <repo-url>` from a safe environment and coordinate a forced push.
- All exposed secrets must be rotated before running the purge.
- After purge, all contributors must reclone the repository.

Post-merge steps (maintainers)
------------------------------
1. Rotate all exposed credentials (OpenClaw, Telegram, device keys, TLS certs).
2. Run `scripts/purge_history.sh <repo-url>` to remove secrets from history.
3. Inform all contributors to reclone repository.
4. Verify CI secrets and deployment pipelines use secure secret storage.

Testing
-------
- Verify `scripts/remove_committed_secrets.sh` creates a commit and backups in `~/tmp/secrets-backup-*`.
- Confirm `.gitignore` contains the new entries.

