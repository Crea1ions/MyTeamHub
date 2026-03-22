<!-- README en français — MyTeamHub -->

# MyTeamHub

MyTeamHub est un petit orchestrateur local d'agents IA (Rêveur, Ingénieur, Diablotin, Artisan) conçu pour aider la réflexion collaborative autour d'un projet. Le backend est en Node.js (Express) et la UI est une application statique vanilla JS servie depuis `ui/`.

## Principes
- Local-first : données et prompts stockés dans le système de fichiers sous `data/projects/`.
- Sécurité par périmètre : usage prévu derrière un tunnel (Wireguard).
- Multi-modèles : support de plusieurs backends IA (Minimax, OpenClaw) via abstraction `callModel`.

## Structure principale

- `server/` : code backend (Express) et services.
- `ui/` : frontend statique (HTML/CSS/JS).
- `data/` : prompts, projets, sessions et contexts.
- `PLAN.md`, `PLAN_ORCHESTRATOR_OPENCLAW.md` : documentation et design.

## Variables d'environnement
Placez les variables d'environnement dans `server/.env` (NE PAS committer les vraies clés).

- `OPENCLAW_API_KEY` or `OPENCLAW_TOKEN` : clé pour OpenClaw (si utilisé)
- `OPENCLAW_URL` : URL locale ou distante d'OpenClaw (ex: `http://localhost:18789`)
- `MINIMAX_API_KEY` : clé pour MiniMax
- `MINIMAX_URL` : endpoint MiniMax
- `MINIMAX_TIMEOUT` : timeout API en ms
- `PORT` : port d'écoute du serveur (par défaut 3001)

Exemple : voir `server/.env.example`.

## Installation rapide (développement)

```bash
cd /root/myteam/server
npm install
npm start
```

L'API sera disponible sur `http://localhost:3001` (ou `http://10.0.0.2:3001/` en réseau Wireguard selon la config). La UI statique est servie par le backend.

## Scripts utiles

- `npm start` : lance le serveur Node
- `npm run dev` : lance en mode dev
- `npm test` : exécute les tests Jest
- `npm run lint` : lance ESLint
- `npm run format` : applique Prettier

## API principale (résumé)

- `POST /api/chat` : envoie un message à un agent
	- Payload minimal : `{ "projectId", "promptFile", "message", "model" }`
- `POST /api/chat/orchestrate` : lance l'orchestration multi-agents pour un projet
	- Payload minimal : `{ "projectId", "message" }`
- `POST /api/proxy/openclaw` : proxy interne vers OpenClaw (utilise `OPENCLAW_TOKEN`)
- `GET /api/projects` | `POST /api/projects` | `GET /api/projects/:id` : gestion simple des projets
- `GET /api/context/:projectId` : récupère le contenu du `context.md` du projet

Consultez le code dans `server/routes/*.js` pour le contrat précis.

## Tests et CI

- Tests unitaires : Jest (fichiers dans `server/__tests__/`).
- CI : GitHub Actions workflow `.github/workflows/ci.yml` exécute install, lint, tests et `npm audit`.

### Couverture & obligations

- Un job CI exécute maintenant `npm run coverage` (dans `server/`) et génère un rapport de couverture.
- Jest a des seuils de couverture globaux définis (70% pour branches/fonctions/lignes/statements). Le job de CI échouera si ces seuils ne sont pas atteints.

Exécuter la couverture localement :
```bash
cd server
npm ci
npm run coverage
```

### Protection de branche `main`

Pour protéger `main` (recommandé même en solo) :

1. Allez sur GitHub → Settings → Branches → Add rule
2. Entrez `main` comme pattern
3. Cochez : `Require status checks to pass before merging` et sélectionnez le job CI (ex: `server-tests`)
4. Cochez `Require pull request reviews before merging` (1 reviewer) si vous voulez une étape de validation, sinon laissez décoché si vous préférez fusionner directement

Remarque : en solo, vous pouvez garder la protection légère (exiger uniquement le statut CI) pour éviter de fusionner du code cassé.

## Integration test note

- The integration test that exercises the OpenClaw handshake requires an `OPENCLAW_TOKEN` secret in CI. If the secret is not present the test suite is skipped to avoid failing PRs from forks.
- To run the integration test in GitHub Actions set the repository secret `OPENCLAW_TOKEN` (Settings → Secrets → Actions) to a valid token with the required scopes. The workflow will also set `NODE_TLS_REJECT_UNAUTHORIZED=0` to allow the repo's self-signed test TLS proxy.
- Locally you can run the integration test by exporting `OPENCLAW_TOKEN` before `npm test`, or omit it to skip the integration test.


## Sécurité et bonnes pratiques

- Ne commitez jamais `server/.env` avec des vraies clés. Remplacez-les par `server/.env.example`.
- Si des clés ont été committées, procédez à leur rotation immédiate et nettoyez l'historique (`git filter-repo` / BFG).
- Limiter les appels IA : l'orchestrateur impose des limites (max 3–5 appels) et timeouts.
- Valider les entrées entrantes (`projectId`, `promptFile`, `message`) avant traitement.

## Développement et contribution

- Structure des prompts : `data/prompts/*.md` — chaque fichier est le prompt système d'un agent.
- Sessions projet : `data/projects/{projectId}/sessions/default.json`.
- Pour ajouter un agent : créer un prompt dans `data/prompts/` et appeler via `POST /api/chat`.

## Déploiement / mise en prod

- Prévoir : stockage sécurisé des secrets (Vault / GitHub Secrets), reverse proxy sécurisé, sauvegardes des `data/`.
- Option recommandée : containeriser `server/` et orchestrer via docker-compose ou k8s, exposer uniquement via réseau privé.

## Ressources & documentation
- Conception et détails : `PLAN.md` et `PLAN_ORCHESTRATOR_OPENCLAW.md`.
- Backend : `server/index.js`, routes dans `server/routes/`, services dans `server/services/`.

---
