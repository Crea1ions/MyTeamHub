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
