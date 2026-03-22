## MYTEAMHUB-PLAN.md

🧠 1. CONCEPT FONDATEUR
🎯 MyTeam Hub = "espace de réflexion assistée multi-agents"
Ce n'est pas un chat IA.
Ce n'est pas un gestionnaire de projet classique.
👉 C'est un système de pensée structuré.
🔑 Principe central
Un utilisateur travaille sur un projet →
Il mobilise plusieurs "points de vue IA" →
Chaque agent apporte une perspective différente →
Le tout est ancré dans un contexte partagé (canevas)
🧩 Les 4 agents
AgentRôleDanger évitéRêveurExploration, idéesmanque d'innovationIngénieurStructure, faisabilitéirréalismeDiablotinCritique, attaquesnaïvetéArtisanConcrétisationthéorie stérile
👉 Ce n'est pas du roleplay → c'est une architecture cognitive
🏗️ 2. PHILOSOPHIE D'ARCHITECTURE
⚖️ Principes non négociables
1. Simplicité radicale
fichiers > base de données 
REST > WebSocket 
vanilla JS > framework 
2. Local-first mental model
tout est lisible sur disque 
tout est modifiable à la main 
zéro lock-in 
3. Sécurité par périmètre
Wireguard = frontière 
backend = sandbox strict 
pas de surface publique 
🧱 Modèle mental global
Projet
├── context.md (cerveau partagé)
├── decisions.log (historique)
├── sessions/
│   └── session.json (conversation)
└── metadata
👉 Le système = éditeur + mémoire + IA
📦 3. DOMAIN MODEL (à graver dans le marbre)
📁 Project
{
"id": "vaultkeeper",
"name": "VaultKeeper",
"createdAt": "...",
"updatedAt": "..."
}
🧠 Context
→ fichier libre (texte brut)
👉 rôle :
source de vérité 
mémoire persistante 
💬 Session
{
"id": "session-001",
"projectId": "vaultkeeper",
"messages": [
{
"agent": "reveur",
"role": "assistant",
"content": "...",
"timestamp": "..."
}
]
}
👉 une session = une séquence de réflexion
🧾 Prompt
# Rêveur optimiste

Tu es un agent créatif...
👉 fichier modifiable → clé du système
🔌 4. CONTRAT API (CRITIQUE POUR LE DEV)
🎯 Règle d'or

Le frontend ne doit JAMAIS dépendre d'un modèle IA.
📡 Endpoint central
POST /api/chat
Input
{
"projectId": "vaultkeeper",
"agent": "reveur",
"promptFile": "reveur.optimiste.md",
"context": "...",
"message": "...",
"model": "minimax"
}
Output (IMMUTABLE)
{
"success": true,
"data": {
"message": "...",
"model": "minimax",
"usage": {
"tokens": 245
}
},
"error": null
}
👉 ce contrat ne doit jamais changer
🧠 5. LOGIQUE MÉTIER (le vrai cœur)
🔄 Pipeline d'un message
utilisateur écrit 
backend charge : 
prompt 
contexte 
construit un prompt final 
appelle modèle 
retourne réponse 
(optionnel) sauvegarde session 
🧩 Composition du prompt
[SYSTEM PROMPT]
(prompt file)

[CONTEXT]
(context.md)

[USER]
(message)
👉 simple, lisible, modifiable
⚙️ 6. STRATÉGIE MULTI-MODÈLES
🎯 Objectif
Ne jamais dépendre d'un seul provider
🧠 Approche
if (model === 'minimax') {
return minimaxService.chat(...)
}

if (model === 'openclaw') {
return openclawService.chat(...)
}
🔁 fallback intelligent
try {
return minimax()
} catch {
return openclaw()
}
👉 priorité :
fiabilité > performance 
🧩 7. FRONTEND — PHILOSOPHIE
🎯 UI = cockpit, pas chat
Layout :
[ Projets ]
[ Canevas central ]

[ Rêveur ] [ Ingénieur ] [ Diablotin ]
🧠 Logique UX
le canevas = centre 
les agents = satellites 
l'utilisateur = chef d'orchestre 
❗ règle importante
👉 pas d'automatisation IA cachée
👉 tout est déclenché par l'utilisateur
🔐 8. SÉCURITÉ (adaptée au contexte)
Niveau attendu
👉 "privé robuste", pas "SaaS enterprise"
Mesures clés
Wireguard obligatoire 
path sandbox 
validation stricte 
logs IP 
Risques acceptés
pas d'auth applicative 
pas de chiffrement interne 
🧪 9. STRATÉGIE DE TEST
Tests critiques
1. filesystem
création/suppression projets 
isolation 
2. sécurité
path traversal 
payload invalide 
3. chat
mock → réel 
Test minimal
curl /api/projects
curl /api/chat
📈 10. ROADMAP TECHNIQUE
V1 (actuelle)
CRUD projets 
prompts 
chat mock 
V2
intégration modèles 
sessions persistantes

🎯 PHASE 2 — OBJECTIF RÉEL

👉 Passer de :
système stateless (chaque requête isolée)
à :
système avec mémoire persistante exploitable

🧠 CE QUE TU AJOUTES CONCRÈTEMENT
Avant Phase 2
User → Chat → Réponse (oubliée)
Après Phase 2
User → Chat → Sauvegarde → Historique → Réponse enrichie

👉 différence énorme :
➡️ ton système commence à penser dans le temps

🗺️ PLAN D'EXÉCUTION (ordre strict)
🔹 ÉTAPE 1 — Validation minimale (5 min)
Dans /chat.js, AU TOUT DÉBUT :
if (!projectId !promptFile !message) {
 return res.status(400).json({
 success: false,
 data: null,
 error: 'Missing parameters'
 });
}
👉 objectif : éviter les états corrompus

🔹 ÉTAPE 2 — Sécuriser promptLoader (5 min)
Dans promptLoader.js :
if (filename.includes('..')) {
 throw new Error('Invalid prompt filename');
}
👉 objectif : éviter sortie du dossier /prompts

🔹 ÉTAPE 3 — Ajouter stockage session (15 min)
👉 C'est le vrai cœur de la phase

📁 Convention SIMPLE
une seule session
nom fixe : default.json

Dans /chat.js
1. définir le chemin
const sessionId = 'default';
const sessionPath = path.join(BASE, projectId, 'sessions', '${sessionId}.json');

2. charger session (si existe)
let session = { messages: [] };
try {
 const raw = await fs.readFile(sessionPath, 'utf-8');
 session = JSON.parse(raw);
} catch {
 // fichier absent → OK
}

3. ajouter message user
session.messages.push({
 role: 'user',
 content: message,
 timestamp: new Date().toISOString()
});

4. ajouter réponse mock
⚠️ IMPORTANT : utilise la vraie réponse mock
const mockResponse = [mock] réponse;
session.messages.push({
 role: 'assistant',
 content: mockResponse,
 timestamp: new Date().toISOString()
});

5. sauvegarder
await fs.mkdir(path.dirname(sessionPath), { recursive: true });
await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));

🔹 ÉTAPE 4 — Injecter historique dans prompt (15 min)
👉 maintenant tu exploites la mémoire

Modifier chatBuilder.js
function buildPrompt({ prompt, context, message, history = [] }) {
 const historyText = history.map(m => [${m.role.toUpperCase()}]\n${m.content}).join('\n\n');
 return `
(SYSTEM)
${prompt}

[CONTEXT]
${context}

[HISTORY]
${historyText}

[USER]
${message}
`;
}

🔹 ÉTAPE 5 — brancher history dans chat.js (5 min)
Avant buildPrompt :
const history = session.messages.slice(-10); // limite simple

Puis :
const fullPrompt = buildPrompt({ prompt, context, message, history });

🧪 TEST FINAL (OBLIGATOIRE)
Test 1
message: "idée 1"
Test 2
message: "développe"
Test 3
message: "critique"
✅ Résultat attendu
Dans le mock : tu vois [HISTORY] avec les messages précédents

🧩 Phase 3 — Pipeline IA + Orchestrateur OpenClaw

🎯 Objectif
Remplacer le mock par de vrais appels aux modèles (Minimax, OpenClaw).
Intégrer l'orchestrateur OpenClaw pour gérer le multi-agent + multi-projet.
Conserver la continuité des sessions et du contexte.
Limiter les boucles et éviter la saturation des ressources.

1️⃣ Pré-requis
Phase 2 complète et testée : context, prompts, chat, sessions persistantes.
.env configuré avec clés API :
OPENCLAW_API_KEY=your_key_here
MINIMAX_API_KEY=your_key_here
OPENCLAW_URL=https://api.openclaw.com/v1
MINIMAX_TIMEOUT=30000
Axios installé pour appels API.
Structure projet stable (/data/projects/{projectId}/sessions/{sessionId}.json).

2️⃣ Design du pipeline IA
🔹 Appels IA
Chaque agent (reveur, ingenieur, diablotin, artisan) a son prompt.
OpenClaw peut orchestrer les appels successifs, avec limite max 3-5 appels par requête.
Timeout par requête : 30s.

🔹 Fonction callModel(agent, prompt, context, history)
async function callModel({ agent, promptFile, context, history, model }) {
 const promptContent = await fs.readFile(data/prompts/${promptFile}, 'utf-8');
 const fullPrompt = buildPrompt({ prompt: promptContent, context, history });

 const apiUrl = model === 'minimax' 
 ? 'https://api.minimax.com/chat' 
 : process.env.OPENCLAW_URL;

 try {
 const res = await axios.post(apiUrl, {
 apiKey: model === 'minimax' ? process.env.MINIMAX_API_KEY : process.env.OPENCLAW_API_KEY,
 prompt: fullPrompt,
 maxTokens: 500
 }, { timeout: Number(process.env.MINIMAX_TIMEOUT) });

 return res.data.response;
 } catch (e) {
 console.warn([callModel] ${agent} failed:, e.message);
 return [fallback] réponse simulée pour ${agent};
 }
}

3️⃣ Intégration Orchestrateur OpenClaw

🔹 Pattern ping-pong simple
async function orchestrateMyTeam({ projectId, userMessage }) {
 const steps = ['reveur', 'ingenieur', 'diablotin']; // agents
 let currentMessage = userMessage;

 const sessionPath = path.join(BASE, projectId, 'sessions', 'default.json');
 let session = { messages: [] };

 try { session = JSON.parse(await fs.readFile(sessionPath, 'utf-8')); } catch {}

 for (const agent of steps) {
 const response = await callModel({
 agent,
 promptFile: ${agent}.md,
 context: await fs.readFile(path.join(BASE, projectId, 'context.md'), 'utf-8'),
 history: session.messages,
 model: 'openclaw'
 });

 session.messages.push({ role: 'user', content: currentMessage, timestamp: new Date().toISOString() });
 session.messages.push({ role: 'assistant', content: response, timestamp: new Date().toISOString() });

 currentMessage = response; // message passe au prochain agent
 }

 // Optionnel : synthèse finale via artisan
 const finalResponse = await callModel({
 agent: 'artisan',
 promptFile: 'artisan.md',
 context: await fs.readFile(path.join(BASE, projectId, 'context.md'), 'utf-8'),
 history: session.messages,
 model: 'openclaw'
 });
 session.messages.push({ role: 'assistant', content: finalResponse, timestamp: new Date().toISOString() });

 await fs.mkdir(path.dirname(sessionPath), { recursive: true });
 await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));

 return { success: true, response: finalResponse, historyCount: session.messages.length };
}

4️⃣ Sécurité et robustesse
✅ Limiter les messages à 1500 caractères avant envoi.
✅ Max 10 messages historiques injectés pour éviter surcharge mémoire.
✅ Timeout global 30s.
✅ Fallback si modèle indisponible.
✅ Aucun path traversal possible (prompts et context verrouillés).

5️⃣ Multi-projets
OpenClaw parse /myteam project:{projectId} ....
Si absent : demande le projet à l'utilisateur.

Chaque projet a son context.md et sessions/default.json séparés.
function parseMyTeamCommand(input) {
 const match = input.match(/project:(\w+)/);
 return {
 projectId: match ? match[1] : null,
 message: input.replace(/\/myteam.*? /, '')
 };
}

6️⃣ Étapes test / validation
Créer projet test /api/projects.
Ajouter context minimal dans context.md.
Envoyer /myteam project:test "Idée initiale" via OpenClaw.
Vérifier historique dans /sessions/default.json.
Vérifier continuité sur plusieurs tours de ping-pong.
Observer fallback si API down.

7️⃣ Bénéfices
OpenClaw devient vrai orchestrateur : multi-agents, multi-projets, historique continu.
MyTeamHub reste le gestionnaire de contexte et sessions, donc OpenClaw reste stateless côté backend.
Limite de risques : path traversal, surcharge mémoire, appels infinis.

8️⃣ Étapes suivantes
Optionnel : ajouter score / priorité aux agents pour synthèse plus fine.
UI : OpenClaw peut générer des rapports ou synthèses via MyTeamHub API.
Monitoring : log chaque appel API pour debug et audit

V3
intégration modèles réels
orchestration multi-agents
scoring réponses 

V4 (optionnel)
versioning projets 
timeline 
export markdown 

⚠️ 11. PIÈGES À ÉVITER

❌ 1. complexifier trop tôt
→ pas de DB
→ pas de queue
→ pas de microservices

❌ 2. transformer en chat GPT clone
→ tu perds la valeur du système

❌ 3. automatiser les agents
→ l'utilisateur doit garder le contrôle

❌ 4. cacher la logique
→ tout doit être lisible dans les fichiers

🧠 12. MENTALITÉ POUR L'AGENT DE V

"Tu ne construis pas une app.
Tu construis un outil de pensée."

Règle ultime
👉 si une feature :
cache la logique ❌ 
complique la structure ❌ 
rend le système opaque ❌ 
➡️ elle est refusée

✅ SYNTHÈSE

Ce projet repose sur 3 piliers :

🧠 cognition
→ agents spécialisés

📁 simplicité
→ fichiers lisibles

🔒 contrôle
→ utilisateur maître

## 🎯 OpenClaw Orchestrator — MyTeamHub (v2+)
🧠 SYNTHÈSE

OpenClaw devient un routeur intelligent multi-skills avec isolation stricte des responsabilités.

Chaque skill est :

indépendant

testable

extensible

Skill	Rôle
normal	conversation générale
dev	assistance technique
myteam	orchestration multi-agents

👉 Objectif clé : éviter toute contamination de contexte entre modes

🧩 ÉVOLUTION MAJEURE — MODES MYTEAM
🎯 Introduction d’une couche stratégique

MyTeamHub supporte désormais 2 modes complémentaires :

Mode	Objectif	Output
🧠 incubateur	Explorer & structurer une idée	Fiche concept
🛠️ editeur	Planifier & exécuter	Plan d’implémentation
🔥 Impact produit

👉 Passage de :

outil de réflexion
→ système complet de production (idée → exécution)

🧠 ARCHITECTURE GLOBALE (V2+)
[ Client / Telegram / UI ]
            ↓
     [ OpenClaw Router ]
            ↓
 ┌───────────────┬───────────────┬───────────────┐
 |   normal      |      dev      |    myteam     |
 └───────────────┴───────────────┴───────────────┘
                                      ↓
                             [ Mode Resolver ]
                                      ↓
                 ┌───────────────────────────────┐
                 |                               |
     [ Incubateur Orchestrator ]     [ Editeur Orchestrator ]
                 |                               |
                 └───────────────┬───────────────┘
                                 ↓
                        [ MyTeamHub API ]
                                 ↓
                        [ Agents spécialisés ]
🧩 DESIGN DU SKILL /myteam
🔹 Activation
/myteam ...

Sinon :
→ fallback automatique vers normal

🔹 Contrat
Côté	Responsabilité
OpenClaw	stateless
MyTeamHub	stateful

👉 séparation critique confirmée dans ton système actuel

🧠 ÉTAPE 1 — ROUTAGE ROBUSTE
function routeMessage(message) {
 if (!message) return handleNormal('');

 const trimmed = message.trim();

 if (trimmed.startsWith('/myteam')) {
 return handleMyTeam(trimmed);
 }

 return handleNormal(trimmed);
}
✅ Garanties

isolation stricte

extensibilité

fallback safe

🧠 ÉTAPE 2 — PARSING & MODE RESOLUTION
🎯 Format enrichi
/myteam project:vaultkeeper mode:incubateur
/myteam project:vaultkeeper mode:editeur
✅ Parser
function parseMyTeamCommand(input) {
 const params = {};
 const regex = /(\w+):([^\s]+)/g;

 let match;
 while ((match = regex.exec(input)) !== null) {
 params[match[1]] = match[2];
 }

 const message = input.replace(/\/myteam[^\n]*\s?/, '');

 return {
 projectId: params.project || null,
 mode: params.mode || 'incubateur',
 message: message.trim()
 };
}
🧠 Mode Resolver
function resolveMode(mode) {
 if (mode === 'editeur') return 'editeur';
 return 'incubateur';
}
🧠 ÉTAPE 3 — ORCHESTRATION PAR MODE
🧠 MODE 1 — INCUBATEUR
🎯 Objectif

Explorer → challenger → structurer

🔁 Pipeline
['reveur', 'ingenieur', 'diablotin']
📤 Output
# 💡 Fiche Concept

## 🌟 Vision
...

## ✨ Fonctionnalités
...

## 👤 Valeur utilisateur
...

## ⚠️ Risques
...

## 🚀 Opportunités
...
🛠️ MODE 2 — ÉDITEUR
🎯 Objectif

Transformer en plan exécutable validable

🔁 Pipeline
['ingenieur', 'diablotin', 'artisan']
📤 Output (critique)
# 🛠️ Plan d’implémentation

## 🎯 Objectif
...

## 📦 Scope (MVP)
...

## 🧩 Étapes techniques
1. ...
2. ...

## 🔗 Dépendances
...

## ⏱️ Estimation
...

## ⚠️ Risques
...

## ✅ Validation requise
🔁 FLOW CRITIQUE — MODE ÉDITEUR
User → /myteam mode:editeur
↓
Orchestration agents
↓
Plan généré
↓
📩 Envoi Telegram
↓
⏸️ Attente validation utilisateur
↓
Execution OpenClaw
↓
Résultat final
🔒 Règle absolue
if (mode === 'editeur' && !userConfirmed) {
 return sendPlanForValidation();
}

👉 pas d’exécution sans validation

🧠 ÉTAPE 4 — ORCHESTRATION INTELLIGENTE
❌ V1

Flow fixe

✅ V2 (context-aware)
function selectAgentsByMode(mode, message) {
 if (mode === 'incubateur') {
 return ['reveur', 'ingenieur', 'diablotin'];
 }

 if (mode === 'editeur') {
 return ['ingenieur', 'diablotin', 'artisan'];
 }

 return ['ingenieur'];
}
🧠 ÉTAPE 5 — API LAYER
async function callMyTeam({ projectId, agent, message }) {
 const controller = new AbortController();
 const timeout = setTimeout(() => controller.abort(), 8000);

 try {
 const res = await fetch('http://localhost:3001/api/chat', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 projectId,
 promptFile: `${agent}.md`,
 message
 }),
 signal: controller.signal
 });

 return await res.json();
 } finally {
 clearTimeout(timeout);
 }
}
🧠 ÉTAPE 6 — SYNTHÈSE
Format unifié
🧠 Analyse :
...

🔁 Agents utilisés :
...

⚙️ Étapes :
...

✅ Résultat :
...
🔒 SÉCURITÉ & LIMITES

max 3 agents

max 8s / appel

max 1500 chars input

max 4000 chars output

🛡️ Fail-safe

timeout → skip

erreur → réponse partielle

aucun agent → fallback direct

🧠 MÉMOIRE
Élément	Responsable
contexte	MyTeamHub
sessions	MyTeamHub
orchestration	OpenClaw

👉 OpenClaw = stateless brain

⚡ POINTS FORTS
✅ Architecture modulaire
✅ Séparation exploration / exécution
✅ Contrôle humain intégré
✅ Multi-agents spécialisés
✅ Local-first (confirmé README)
⚠️ RISQUES
🔴 Orchestrateur = SPOF logique
🔴 Latence multi-agents
🔴 File system scaling
🔴 Manque d’observabilité
🚀 ROADMAP
Phase 1 (actuelle)

orchestration dynamique

modes incubateur / éditeur

Phase 2

scoring réponses

parallélisation agents

cache

Phase 3

débat agents (ping-pong)

convergence automatique

UI monitoring

Phase 4 (scale)

microservices agents

queue system

stockage distribué

🎯 UX FINALE
🧠 Incubateur
/myteam project:vaultkeeper mode:incubateur

👉 fiche concept

🛠️ Éditeur
/myteam project:vaultkeeper mode:editeur

👉 plan → validation → exécution

🧠 POSITIONNEMENT STRATÉGIQUE

Tu ne construis pas un chatbot.

👉 Tu construis :

un système d’intelligence collective orchestrée

Capable de :

générer des idées

les challenger

les transformer

les exécuter

🏁 CONCLUSION

MyTeamHub = mémoire + agents
OpenClaw = orchestration + contrôle

👉 Ensemble :

une plateforme complète de production d’idées et de software

🧠 TL;DR CTO

👉 L’ajout des modes est le pivot clé :

clarifie les usages

structure le pipeline

sécurise l’exécution

prépare l’automatisation

## ## Plan: OpenClaw MyTeamHub Modes (Incubateur / Éditeur) — Hardened & Operationally Safe

TL;DR: Keep the stateless OpenClaw router and stateful MyTeamHub separation, but modify the plan to explicitly address the security, persistence and operational failure modes you highlighted: do an initial audit, require application-level authentication, apply strict sanitization, split persistence responsibilities (Postgres for snapshots, Redis for locks/queue), use signed tokens (JWT) instead of opaque Redis-only tokens, add worker heartbeats/health checks, and provide migration/runbooks. Only proceed to implement once those blocking conditions are satisfied.

**High-level changes from previous plan (why)**
- Add an explicit repository audit phase before any refactor to confirm file layout and debt. This prevents wrong assumptions about `server/routes/chat.js` etc.
- Require application authentication and avoid relying solely on Wireguard.
- Replace opaque validation tokens in Redis with signed JWTs (short TTL) to avoid token-exposure risks in logs/URLs.
- Use Postgres for durable snapshots and Redis only for locks + task queue (reduce Redis footprint).
- Add project-level locks, worker heartbeats, rate limiting, and migration scripts for existing `data/projects/` files.

**Steps (implementation order, blocking items marked)**
1. Audit (BLOCKER): run a quick codebase audit to confirm current entrypoints, data paths, and any in-memory state usages. Produce a short audit report listing: where routing occurs, where prompts are loaded, how projects are persisted. *Must complete before coding.*
2. Auth (BLOCKER): add application-level auth middleware for `/api/*` (API key / bearer token or OAuth). Enforce on Telegram webhooks and any UI endpoints. Document token rotation and storage in secrets manager.
3. Sanitization & least-privilege (BLOCKER): implement `sanitizeProjectId()` enforcing regex ^[a-zA-Z0-9_-]+$, never allow path separators. Run a prompt-templating audit to ensure placeholders are escaped.
4. Persistence design (BLOCKER to execution features):
   - Postgres: persist snapshots, final plan records, audit trail (immutable). Use WAL-backed durability for recovery.
   - Redis: used only for short-lived locks, queues (Redis Streams), and rate-limiting counters. Ensure Redis HA or documented fallback (Postgres-based fallback for queue/locks if Redis unavailable).
   - Migrate: include a `scripts/migrate_projects_to_db.js` that reads `data/projects/*` and imports canonical records into Postgres before enabling the new orchestration.
5. Token model: issue signed JWT `validationToken` containing snapshot id + plan hash + exp. Tokens are single-use: workers will verify signature and use Postgres to mark token consumed atomically (idempotence). Do NOT send raw Redis IDs in URLs/logs.
6. Snapshot & locking: when generating a plan, create an immutable snapshot in Postgres and acquire a short-lived Redis project lock (optional: keep lock until expiration). For simplicity: acquire a lock at plan generation that prevents context mutation until the plan expires or is executed/aborted. This avoids complex snapshot-then-verify UX loops.
7. Validation UX: send plan with a summary and explicit confirm action. Avoid putting tokens in query params of links; prefer POST confirmation endpoints where possible. If a link is unavoidable, use one-time short-lived signed tokens and instruct proxies to not log query strings.
8. Execution queue & workers: push validated tasks to Redis Streams; workers pop tasks, acquire lock, mark execution RUNNING in Postgres, process, then mark DONE/FAILED. Workers must heartbeat to a key; stale RUNNING tasks can be reclaimed after configurable timeout.
9. Idempotence: use Postgres atomic state transitions (e.g., `UPDATE plans SET state = 'RUNNING' WHERE id = ? AND state = 'PENDING'`) to prevent double-execution; check the affected row count to detect races.
10. Agent calling policy: configurable timeouts (30s default), retries with exponential backoff (3 attempts), and a simple gating rule: require all critical agents to succeed for `editeur` OR set a conservative quorum (configurable). Always surface partial results to user and block execution until resolved.
11. Rate limiting & DOS protection: throttle plan generation per user/project, enforce global caps, and add operator alerts for unusual activity.
12. Observability & runbooks: emit metrics (pending plans, lock contention, agent latencies), logs without secrets, health endpoints for workers and Redis/Postgres, and simple runbooks for common failures (Redis down, stuck locks, reclaiming RUNNING tasks).
13. Testing & chaos engineering: add unit tests for sanitization and tokens; add integration tests for concurrent `/myteam` flows, double-validation, worker failover; add a small chaos test simulating Redis unavailability and worker restarts.

**Concrete file targets**
- `server/routes/chat.js` — implement centralized `routeMessage` once audit confirms location
- `server/services/orchestrator.js` — orchestrator will be adapted after audit; ensure it uses `myteamStore` APIs rather than direct FS
- `server/services/callModel.js` — wrap agent calls (timeout/retry)
- `server/services/myteamStore.js` (new) — DB-backed store: Postgres for snapshots/plans; Redis for locks/queue
- `scripts/migrate_projects_to_db.js` — migration script to import `data/projects/*` to Postgres (must be run before enabling new features)
- `server/middleware/auth.js` — simple API key/Bearer token middleware
- `server/middleware/rateLimit.js` — basic per-user/project throttling
- `server/services/executionWorker.js` — worker with heartbeat and reclaim logic
- `server/__tests__/*` — add concurrency and security tests

**Key design choices & rationale**
- Audit-first: prevents wasted work and incorrect assumptions about repo structure.
- Postgres for durability: snapshots must survive Redis or process crashes; Postgres provides stronger guarantees.
- Redis limited role: locks + queue + rate counters minimizes Redis attack surface and memory usage.
- JWT signed tokens: avoid storing every token in Redis and reduce exposure risk in logs/URLs.
- Lock-at-plan-generation: simpler UX and avoids snapshot-drift loops; acceptable given typical user flows where plan generation is followed by quick validation.
- Worker heartbeats + reclaim: handles worker crashes and avoids permanent RUNNING locks.

**Critical blocking requirements (NO-GO until implemented)**
1. Application-level authentication for `/api/*` must be in place.
2. `sanitizeProjectId()` must be enforced for any operation touching the filesystem or DB keys.
3. Migration script must exist and be validated on staging before switching persistence modes.
4. Tokens must be JWT-signed and single-use, with server-side state recorded in Postgres for idempotence verification.
5. A Redis HA requirement or documented fallback plan if Redis is required in your environment.

**Operational mitigations for failure scenarios**
- Redis OOM / Unavailable: degrade gracefully by rejecting new plan generation with clear error and operator alert; if Redis is not available, disallow execution but allow read-only plan inspection from Postgres snapshots.
- Worker crash: heartbeat TTL causes automatic reclaim of RUNNING tasks; operator can trigger manual reclaim via admin endpoint.
- Token exposure: avoid tokens in logs; use short-lived JWTs and require signature validation. Postgres keeps an audit trail for every token use.
- DOS plan generation: rate limiting + CAPTCHA for UI, API quotas for Telegram/webhook sources.

**Verification matrix (minimum tests to pass before merge)**
- Audit report created and approved.
- Auth middleware tested (valid/invalid tokens).
- Sanitization tests (path traversal attempts rejected).
- Migration script tested on staging (no data loss, canonical IDs match filesystem names).
- Concurrency test: 2 simultaneous `/myteam editeur` requests on same `projectId` → one is accepted, other receives conflict or queued.
- Double-validation test: clicking validate twice → second attempt returns idempotent "Already executed".
- Worker failure test: worker dies mid-execution → another worker reclaims and resumes or marks as FAILED within expected SLA.
- Redis failure test: simulate Redis down → system rejects execution and keeps snapshots accessible.

**Next steps (concrete)**
1. Approve audit run: I will perform a quick repo scan to confirm current structure and list exact files to edit. (I can run this scan now.)
2. After audit, I will scaffold `server/services/myteamStore.js`, `server/middleware/auth.js`, and `scripts/migrate_projects_to_db.js` as a proposal (no runtime changes until you approve).

Approve the audit step and I'll scan the repository and return a short audit report plus file-level TODOs.

**Deployment Transition Plan (concise)**
1. Prechecks (dry-run): run `scripts/migrate_projects_to_db.js --dry-run` on a staging copy; verify encoding, duplicate detection, and IDs. Fail fast on any anomaly.
2. Migration (idempotent, batched): run the migration in batches (e.g., 50 projects per transaction). Each batch: BEGIN; import; validate checksums; COMMIT. On failure, ROLLBACK and log the failed batch for manual review. The script must be resumable and idempotent (skip already-imported snapshots by canonical ID or checksum).
3. Read-only switch: deploy new code with Postgres available but keep filesystem as authoritative source; start in `read-only-db` mode where new plans are recorded in Postgres but filesystem reads remain allowed. Monitor for errors for 24–72 hours.
4. Cutover: once migration verified, switch to `db-first` mode: new reads/writes use Postgres; filesystem is retained as fallback but marked deprecated. Announce deprecation window (e.g., 2 weeks).
5. Cleanup: after deprecation window, run a final migration pass and archive filesystem `data/projects/` to object storage (gzipped backups). Validate integrity and then remove write permissions.
6. Rollback plan: if migration catastrophically fails, rollback steps include restoring Postgres snapshot from pre-migration backup and re-enabling filesystem-first mode. Always take DB backup before each migration batch.

**Frontend Requirements (must-have before validation UI goes live)**
- Validation UX: the UI must offer an explicit `Confirm Execution` action that performs a POST with the signed `validationToken` in request body (not in URL). If a web link is used from Telegram, the link must open the UI and require the user to press `Confirm` (no auto-confirm).
- Error states: UI must present clear messages for `Lock conflict`, `Agent timeout`, `Quorum not reached`, `Pending validation`, and `Migration required`. Each message should include suggested user actions.
- Token handling: do not render tokens in the DOM in plain text. Store tokens in memory or secure session storage; never include tokens in URLs shown to the user. Ensure tokens are redacted in copyable logs or downloadable traces.
- Mobile/responsive: validation screens and error flows must be responsive and usable on small screens (Telegram users frequently confirm from mobile).
- Retry & idempotence: UI must disable the `Confirm` button after click, show progress, and display a clear `Already executed` result if the token was consumed.
- Accessibility: ensure form controls have labels, ARIA roles where appropriate, and keyboard navigation works (WCAG basic compliance).
- Logging & telemetry: the frontend should emit events for `plan_shown`, `validation_attempt`, `validation_success`, `validation_failure` (without tokens) to backend analytics for observability.

Add these two sections to the plan and mark them as required preconditions for production roll-out.

**Final Preconditions (required before audit/implementation)**
1. Minimal Postgres schema (versioned): add `scripts/migrations/001_initial_schema.sql` containing tables: `snapshots(id UUID PRIMARY KEY, project_id TEXT, plan_hash TEXT, context JSONB, created_at TIMESTAMP)`, `plans(id UUID PRIMARY KEY, snapshot_id UUID REFERENCES snapshots(id), state TEXT, validation_token_hash TEXT, created_at TIMESTAMP, executed_at TIMESTAMP)`, `audit_logs(id UUID PRIMARY KEY, plan_id UUID REFERENCES plans(id), action TEXT, metadata JSONB, created_at TIMESTAMP)`.
2. Snapshot format: store full immutable JSONB context snapshot (prompts, agent outputs, metadata) to ensure replayability.
3. Token storage: store SHA256 of validation token in `plans.validation_token_hash` (do not store token in clear); verify by hashing submitted token.
4. Log redaction middleware: add Express middleware to redact `token`/`t`/`validationToken` in URLs and request bodies before logging.
5. Two-step validation flow: use short-lived presentation token in URLs (one-time, exchanged by UI for a session token via POST), then require POST confirm with session token in body to execute. Presentation token invalidated on exchange.
6. Queue choice & library: adopt `Bull`/`BullMQ` (Redis) for job queueing initially; document migration path to Redis Streams if needed.
7. Defaults: lock TTL = 15 minutes, agent timeout = 30s, retries = 3 (configurable via env). Document these values in `README.md`.

Mark these seven items as required preconditions in the plan. Once you confirm, I will run the repo audit and return a short report with exact files to change.

## Plan en 5 Phases

Contexte: découpage progressif pour limiter le risque — audit bloquant, hardening non invasif, construction parallèle (V2), migration contrôlée, puis montée en charge et observabilité.
Phase 1 — Audit & Gates (Blocant)

Objectif: valider l'état réel du codebase et franchir les préconditions de sécurité avant tout changement.
Tâches clés: lister fichiers JS (routes/services), inventaire des IDs projects dans data/projects/, vérifier prompts, détecter usages en mémoire.
Fichiers existants à inspecter: index.js:1, chat.js:1, orchestrator.js:1, callModel.js:1, promptLoader.js:1.
Critères de sortie: rapport d'audit signé, aucun projectId invalide en prod (ou plan d’ajustement), accord pour poursuivre.
Durée estimée: 1–3 jours.
Phase 2 — Hardening non‑invasif (Phase 1 opérationnelle)

Objectif: réduire les risques immédiats sans changer la logique métier.
Tâches clés: ajouter auth middleware (API_TOKEN, fallback dev), sanitizeProjectId() (ValidationError 400), log-redaction middleware (headers + query tokens), durcir callModel (timeout 30s, retries 2, backoff 1s/2s), créer route sûre /api/chat/orchestrate-v2 qui appelle l'orchestrateur existant sans modifier sa logique.
Files to change: modifier index.js:1 pour monter middlewares; modifier chat.js:1 et context.js:1 pour validation; modifier callModel.js:1.
Critères de sortie: V2 retourne les mêmes résultats que V1 (tests de non‑régression), auth activé en prod documénté, tests unitaires verts.
Durée estimée: 1–2 semaines.
Phase 3 — Infra parallèle & V2 (sécurisé, non coupant)

Objectif: déployer la stack durable parallèle (Postgres + Redis) et la V2 qui utilise myteamStore (sans écrire la production).
Tâches clés: provision Postgres+Redis (dev/staging), créer scripts/migrations/001_initial_schema.sql, implémenter myteamStore (interface Postgres snapshots + Redis locks), implémenter route /api/v2/chat/orchestrate utilisant myteamStore, shadow mode pour comparer outputs V1 vs V2.
Nouveaux fichiers (proposés): server/services/myteamStore.js, scripts/migrations/001_initial_schema.sql, scripts/migrate_projects_to_db.js.
Critères de sortie: V2 en shadow mode, divergences loguées, pas d’écriture en production DB sans validation.
Durée estimée: 2–3 semaines.
Phase 4 — Migration contrôlée & Cutover

Objectif: migrer les données de façon idempotente et basculer progressivement les utilisateurs sur V2.
Tâches clés: migration batched (dry-run → batched import avec rollback), read-only DB mode → db-first cutover → archiver filesystem; mettre en place locks TTL (15 min), token JWT (presentation→session), sauvegardes avant chaque batch.
Critères de sortie: migration testée en staging, métriques OK, bascule progressive réussie, runbook rollback validé.
Durée estimée: 1–2 semaines (selon taille des données).
Phase 5 — Workers, Queue & Observabilité (scale)

Objectif: produire le système d'exécution durable et observable en production.
Tâches clés: choisir/installer Bull/BullMQ pour la queue, implémenter executionWorker (heartbeat, reclaim), ajouter metrics (agent latencies, lock contention), UI monitoring, runbooks et tests chaos (Redis/Postgres failover).
Critères de sortie: résilience aux pannes (reclaim), métriques et alerting opérationnels, tests de charge validés.
Durée estimée: 2–4 semaines (itératif).
Risques & Mitigations (transversaux)

Rollback: chaque phase doit livrer avec feature-flag et script de rollback.
Migration: migration idempotente, batch + dry-run, stockage de checkpoints.
Auth: fallback dev et endpoint /api/health non protégé.
Tokens: JWT courts + stockage de hash en DB pour idempotence.
Tests: coverage d’acceptance pour l’orchestrateur (fixtures dans data/test-projects/), nettoyage avant/après tests.
Si tu valides ce découpage en 5 phases, j’implémente immédiatement Phase 1: je commence par (A) scanner les projectId invalides, puis (B) coder les middlewares et la route /api/chat/orchestrate-v2, ajouter les tests de non‑régression, et soumettre la PR pour revue. Confirme et je lance.

Voici les listes — d’abord les fichiers existants pertinents (liens vers le workspace), puis les fichiers proposés à créer.

Fichiers existants (références)

LICENSE
README.md
PLAN.md
index.js:1
chat.js:1
server/routes/context.js
server/routes/projects.js
server/routes/proxy.js
orchestrator.js:1
callModel.js:1
promptLoader.js:1
chatBuilder.js:1
orchestrator.test.js:1
callModel.test.js:1
promptLoader.test.js:1
index.html:1
app.js:1
data/prompts/ (dossier existant contenant les agents .md)
data/projects/ (stockage filesystem existant)
Fichiers à créer / ajouter (proposés par le plan)

server/middleware/auth.js
server/middleware/logRedact.js
server/middleware/rateLimit.js
server/middleware/health.js (endpoint /api/health)
server/utils/validate.js (sanitizeProjectId / ValidationError)
server/services/myteamStore.js (Postgres snapshots + Redis locks interface)
server/services/executionWorker.js (Bull/BullMQ worker)
server/services/tokenUtils.js (hashing/verifying validation tokens)
server/services/myteamStore.test.js (unit tests for store)
server/routes/orchestrate-v2.js or augmentation de chat.js to add /api/chat/orchestrate-v2
scripts/migrate_projects_to_db.js (idempotent, batched migration)
scripts/migrations/001_initial_schema.sql
server/tests/orchestrator_nonreg.test.js (non‑regression fixtures)
server/tests/worker.test.js (worker failover tests)
data/test-projects/ (test fixtures directory; cleaned by tests)
README.md updates / docs: deployment variables (API_TOKEN, Redis/Postgres), defaults
(optional later) ui/confirm.html or UI changes to implement two‑step validation flow

📊 Où nous en sommes par rapport au plan initial
✅ Phases accomplies (partiellement ou totalement)
Phase	État	Commentaire
Phase 1 — Audit & Gates	✅ Terminé	Audit réalisé via session de debug, fichiers identifiés, risques documentés. Rapport d’audit validé.
Phase 2 — Hardening non-invasif	⚠️ Partiel	Auth middleware ajouté, sanitize partiellement implémenté, mais pas encore de route /orchestrate-v2 ni tests de non-régression.
Phase 3 — Infra parallèle & V2	❌ Non démarré	Pas de Postgres/Redis, pas de myteamStore, pas de shadow mode.
Phase 4 — Migration contrôlée	❌ Non démarré	Pas de migration, toujours en filesystem (data/projects/).
Phase 5 — Workers & Queue	❌ Non démarré	Pas de queue, pas de workers.
🎯 Ce qu’on a fait en plus (non prévu dans le plan initial)

    Proxy WebSocket OpenClaw : implémentation complète du handshake challenge/response

    Device identity & TLS terminator : pour contourner l’exigence HTTPS du gateway

    Routage UI → Minimax : contournement d’OpenClaw pour les prompts UI

    Debug approfondi : signature Ed25519, logs RAW, scripts de test isolés

🔴 Ce qui bloque pour passer à la suite du plan
Blocage	Statut
Auth middleware sécurisée	⚠️ Actuellement ouverte en dev, à durcir
Sanitize projectId généralisée	⚠️ Partielle, à étendre
Tests de non-régression	❌ Manquants
Postgres + Redis	❌ Non provisionnés
Migration script	❌ Non écrit
Token JWT + two-step validation	❌ Non implémenté
📌 Recommandation

On termine la Phase 2 proprement avant d’attaquer la Phase 3.

Prochaines actions concrètes :

    Créer la route /api/chat/orchestrate-v2 qui utilise l’orchestrateur existant (non-régressive)

    Ajouter des tests de non-régression avec fixtures dans data/test-projects/

    Généraliser sanitizeProjectId() dans toutes les routes concernées

    Durcir l’auth : désactiver les ouvertures en dev et passer en mode token requis (sauf health)