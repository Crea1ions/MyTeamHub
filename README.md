<!-- README en français — MyTeamHub -->

# MyTeamHub

MyTeamHub est un orchestrateur local d'agents IA (Rêveur, Ingénieur, Diablotin, Artisan, **Analyste**) conçu pour aider la réflexion collaborative autour d'un projet. Le backend est en Node.js (Express) et la UI est une application statique vanilla JS servie depuis `ui/`.

L'**Analyste** (🆕 Phase 1 - Production) offre une analyse sécurisée et en profondeur de fichiers.

**MyTeamHub Studio** (🆕 Avril 2026) permet de créer et éditer des agents personnalisés directement depuis l'interface web.

## Principes
- Local-first : données et prompts stockés dans le système de fichiers sous `data/projects/`.
- Sécurité par périmètre : usage prévu derrière un tunnel (Wireguard).
- Mistral uniquement : utilise `proxy-myteam` (port 3006) pour tous les appels IA via `callModel`.

## Structure principale

- `server/` : code backend (Express) et services.
- `ui/` : frontend statique (HTML/CSS/JS).
- `data/` : prompts, projets, sessions et contexts.
  - `data/prompts/` : prompts système des agents par défaut
  - `data/agents/` : agents personnalisés créés via Studio (fichiers `.agent.md`)
- `PLAN.md` : documentation et design.

## Agents personnalisés (MyTeamHub Studio)

MyTeamHub Studio permet de créer des agents IA personnalisés :

1. **Créer un agent** : Cliquez sur "+" dans le sélecteur d'agent
2. **Éditer un agent** : Cliquez sur "✏️" pour modifier un agent existant
3. **Format** : Les agents sont stockés en `.agent.md` dans `data/agents/`

### Format d'un fichier agent
```markdown
---
name: Mon Agent
description: Description de l'agent
model: mistral-large-2411
tools: []
---

Tu es [nom], un assistant spécialisé en [domaine].
[Instructions du prompt...]
```

### API Agents
- `GET /api/agents` : Liste tous les agents (système + personnalisés)
- `GET /api/agents/:id` : Détails d'un agent
- `POST /api/agents/:id` : Crée/met à jour un agent
- `DELETE /api/agents/:id` : Supprime un agent personnalisé

## Architecture réseau

```
[UI Studio] → [myteam:3001] → [proxy-myteam:3006] → [Mistral API]
```

- **myteam** (port 3001) : Backend Express, sert l'UI et l'API
- **proxy-myteam** (port 3006) : Proxy de rate-limiting pour Mistral API

## Variables d'environnement
Placez les variables d'environnement dans `server/.env` (NE PAS committer les vraies clés).

- `MISTRAL_PROXY_URL` : URL du proxy Mistral (défaut: `http://localhost:3006`)
- `MISTRAL_MODEL` : modèle Mistral à utiliser (défaut: `mistral-large-2411`)
- `CB_TIMEOUT` : timeout du circuit breaker en ms (défaut: 45000)
- `CB_ERROR_THRESHOLD` : seuil d'erreurs pour ouvrir le circuit (défaut: 50%)
- `CB_RESET_TIMEOUT` : délai avant réessai après ouverture du circuit (défaut: 120000)
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
- `POST /api/chat/studio` : endpoint principal pour MyTeamHub Studio (UI chat)
	- Payload : `{ "projectId", "agent", "message", "model", "history" }`
- `GET /api/agents` | `POST /api/agents/:id` | `DELETE /api/agents/:id` : gestion des agents personnalisés
- `GET /api/projects` | `POST /api/projects` | `GET /api/projects/:id` : gestion simple des projets
- `GET /api/context/:projectId` : récupère le contenu du `context.md` du projet
- `POST /api/analyser` : **[NEW - Phase 1 LIVE]** analyse sécurisée de fichiers
	- Payload minimal : `{ "filepath": "/root/README.md" }`
	- Retour : `{ "success", "analysis", "analysisId", "processingTimeMs", "timestamp" }`
	- Rate limit : 5 analyses/jour, 30s min entre requêtes, 1 concurrent max

Consultez le code dans `server/routes/*.js` pour le contrat précis.

## Agent Analyste (Phase 1 - Production) 🆕

### Description
L'**Analyste** est un nouvel agent IA dédié à l'analyse sécurisée et en profondeur de fichiers (code, documentation, config). Il réduit la charge contexuelle d'OpenClaw en offrant une analyse dédiée :
- Analyse architecture et design
- Identifie risques de sécurité et performance
- Propose recommandations d'amélioration
- Génère résumé et points clés

### Utilisation (Telegram)
```
/myteam analyste /filepath
```

**Exemples**:
```
/myteam analyste /root/README.md
/myteam analyste /root/myteam/server/index.js
/myteam analyste /root/openclaw.json
/myteam analyste /root/DEPLOYMENT_LIVE.md
```

### Capacités & Limites

**✅ Fichiers autorisés (Whitelist)**:
- `/root/myteam/**` - Tous les fichiers MyTeamHub
- `/root/.openclaw/workspace/**` - Fichiers OpenClaw
- `/root/vaultkeeper/**` - Fichiers VaultKeeper
- `/root/README.md` - README principal
- `/root/DUAL_PROXY_*.md` - Docs déploiement
- `/root/DEPLOYMENT_*.md` - Docs déploiement

**🚫 Fichiers bloqués (Patterns)**:
- `.env`, `secrets`, `private`, `credentials`, `token` (dans le chemin)
- `.git/**`, `node_modules/`, `package-lock.json`
- `dockerfile`, `docker-compose`, `terraform.tf`

**⏱️ Rate Limiting**:
- **5 analyses par jour** (24 heures)
- **30 secondes minimum** entre requêtes
- **1 analyse à la fois** (pas de concurrent)

**⚙️ Configuration**:
- Fichier de config : `server/config/analyzerWhitelist.json`
- Timeout d'analyse : 30s (Phase 1), 15s-60s tiered (Phase 2)
- Taille max fichier : 1 MB
- Contexte Mistral : 4 KB summary

### Architecture & Sécurité

L'Analyste implémente **4 couches de sécurité**:
1. **VaultKeeper Guard**: Validation via FILE_READ_REQUEST
2. **Whitelist + Patterns**: Glob matching + blocked patterns
3. **File I/O**: fs.readFile() only, no write/exec
4. **Audit Trail**: Logging complet de chaque requête

**Intégration**:
- Backend : `/root/myteam/server/routes/analyser.js`
- Service : `/root/myteam/server/services/analyzerService.js`
- Config : `/root/myteam/server/config/analyzerWhitelist.json`
- Prompt : `/root/myteam/data/prompts/analyste.md`

### Déploiement & Status

**Phase 1 (LIVE)**: Production deployment 2026-03-29
- Status: ✅ Online on 10.0.0.1:3001
- Monitoring: Daily checks (14 days intensive)
- Go/No-Go: Day 14 (2026-04-10)

**Phase 2 (Planned)**: Weeks 3-6 (after Phase 1 GO)
- Role-based rate limiting (admin/dev/guest: 50/10/2 analyses/day)
- Dynamic timeouts (15s/30s/60s by file size)
- Audit trail file persistence
- Metrics & alerting

### Documentation
- **User Guide**: `docs/ANALYZER_RUNBOOK.md`
- **Deployment**: `docs/DEPLOYMENT_PHASE1.md`
- **Phase 2 Plan**: `docs/PHASE2_PREPARATION.md`
- **Timeout Strategy**: `docs/TIMEOUT_CRITERIA.md`
- **Audit Examples**: `docs/AUDIT_TRAIL_EXAMPLES.md`

---

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

- Les tests d'intégration utilisent le proxy Mistral local (`proxy-myteam` sur le port 3006).
- Assurez-vous que `pm2 start proxy-myteam` est en cours d'exécution avant de lancer les tests.
- Le circuit breaker protège contre les erreurs répétées avec retry automatique.


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

## Architecture Système 🏗️

### Séparation Code vs Runtime

MyTeamHub applique une **séparation stricte** entre le code versionné et les données d'exécution locales :

**Dans Git (versionné)** ✅:
- `server/` — Backend Node.js et services
- `ui/` — Frontend statique
- `tests/` — Suites de tests
- `data/prompts/` — Templates de prompts système (immutables)
- `docs/` — Documentation (y compris ce guide)
- Fichiers de configuration (`package.json`, `.gitignore`, etc.)

**Hors Git (runtime local)** ❌:
- `runtime/` — Données d'exécution (voir détail ci-dessous)
- Sessions de chat (sessions utilisateur)
- Agents personnalisés créés via Studio
- Logs d'exécution
- Rapports d'audit horodatés
- Artefacts de test (screenshots, résultats)

**Rationale** : Les données runtime sont spécifiques à chaque machine/utilisateur et ne doivent jamais être synchronisées en Git.

### Structure Runtime : `runtime/`

Après clone, la structure suivante est créée localement (jamais committée) :

```
runtime/
├── system/                   # Infrastructure d'exécution
│   ├── state/               # État volatile (mémoire session)
│   ├── cache/               # Cache régénérable (jetable)
│   └── pids/                # Process IDs des services
├── data/                    # Données métier
│   ├── sessions/            # Historique de chat
│   ├── agents/              # Agents personnalisés créés via Studio
│   └── projects/            # Données par projet (sessions, logs d'exécution)
├── logs/                    # Audit trail (immuable)
├── archive/                 # Snapshots horodatés (rapports d'audit)
└── media/                   # Artefacts (screenshots, test-results)
    └── screenshots/
```

**Règles immutables** :
1. **Rien du répertoire `runtime/` n'est jamais committé** (même par erreur)
2. **Sessions et logs restent locaux** — chaque machine a sa propre copie
3. **Structure créée automatiquement** après `npm install` (via script d'initialisation)
4. **Chemins centralisés** — accéder via `require('config/runtime').PATHS.*`

Voir [`docs/RUNTIME_STRUCTURE.md`](docs/RUNTIME_STRUCTURE.md) pour détails complets.

### Architecture Fichiers

Pour une vue d'ensemble de l'architecture système, consultez [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) :
- Diagramme des 3 couches (UI, Backend, Proxy)
- Composants et services
- Flux d'exécution (chat, orchestration)
- Types d'agents (système vs personnalisés)
- Modèle de déploiement

### Workflow Développement

**Avant chaque commit** :
1. ✅ Code testé et fonctionnel
2. ⚠️ Documentation synchronisée si modification structurelle majeure
3. ⚠️ Aucun fichier `runtime/` stagé (`.gitignore` les ignore automatiquement)
4. ✅ Push + validation CI

**Chemins hardcodés** : 
- ❌ **À éviter** : `'../../logs/...'`, `'../../data/sessions/...'`
- ✅ **À utiliser** : `require('config/runtime').PATHS.logs` ou `.PATHS.sessions`

Voir `server/config/runtime.js` pour la configuration centralisée.

---
