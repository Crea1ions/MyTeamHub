# 🎯 OpenClaw Orchestrator — MyTeamHub

---

# 🧠 SYNTHÈSE

OpenClaw devient un agent multi-skills avec séparation stricte des rôles :

| Skill | Rôle |
|---------|-------------------------------|
| normal | conversation classique |
| dev | assistance développement |
| myteam | orchestration MyTeamHub |

---

# 🧩 DESIGN DU SKILL /myteam

## 🔹 Principe

Le skill est activé uniquement via commande explicite :

`/myteam ...`

➡️ Sinon → comportement normal

---

# 🧠 ARCHITECTURE LOGIQUE

Telegram
↓
OpenClaw Router
├── normal
├── dev
└── myteam ← activé par /myteam
↓
Orchestrateur MyTeam
↓
MyTeamHub API

---

# 🛠️ ÉTAPE 1 — ROUTAGE

```js
function routeMessage(message) {
 if (message.startsWith('/myteam')) {
 return handleMyTeam(message);
 }

 return handleNormal(message);
}
```

✔ simple  
✔ robuste  
✔ extensible

---

# 🧠 ÉTAPE 2 — PROMPT DU SKILL MYTEAM

⚠️ CRITIQUE : isolation mentale totale

```
Tu es un orchestrateur spécialisé dans l'utilisation de MyTeamHub.

Tu n'agis que lorsque la commande /myteam est utilisée.

Ton rôle est de :
1. Identifier le projet concerné (ou demander si absent)
2. Décomposer la demande utilisateur
3. Orchestrer les agents :
 - reveur
 - ingenieur
 - diablotin
 - artisan
4. Faire dialoguer les réponses
5. Synthétiser

Contraintes :
- max 3 itérations
- éviter répétitions
- limiter taille messages

Sortie :
- Analyse rapide
- Étapes réalisées
- Résultat final
```

---

# 🧩 ÉTAPE 3 — GESTION MULTI-PROJETS

## 🔹 Format utilisateur

```
/myteam project:vaultkeeper Améliore le PnL
```

## 🔹 Parsing

```js
function parseMyTeamCommand(input) {
 const match = input.match(/project:(\w+)/);

 return {
 projectId: match ? match[1] : null,
 message: input.replace(/\/myteam.*? /, '')
 };
}
```

## 🔹 Fallback

Si aucun projet :

```
Quel projet veux-tu utiliser ?
```

---

# 🧩 ÉTAPE 4 — ORCHESTRATION

## 🎯 Pattern V1

Rêveur → idées  
Ingénieur → structuration  
Diablotin → critique  
Implémentation

```js
const steps = ['reveur', 'ingenieur', 'diablotin'];

let current = userMessage;

for (const agent of steps) {
 const res = await callMyTeam({
 projectId,
 agent,
 message: current
 });

 current = res.data.message;
}
```

---

# 🧩 ÉTAPE 5 — APPEL API

```js
async function callMyTeam({ projectId, agent, message }) {
 const res = await fetch('http://localhost:3001/api/chat', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json'
 },
 body: JSON.stringify({
 projectId,
 promptFile: `${agent}.md`,
 message
 })
 });

 return res.json();
}
```

---

# 🧩 ÉTAPE 6 — SYNTHÈSE

## Option A — OpenClaw

✔ rapide  
✔ flexible

## Option B — Artisan

```js
await callMyTeam({
 projectId,
 agent: 'artisan',
 message: current
});
```

---

# 🔒 SÉCURITÉ (OBLIGATOIRE)

- max 3–5 appels
- timeout global
- taille message limitée

```js
message = message.slice(0, 1500);
```

---

# 🧠 MÉMOIRE

👉 OpenClaw ne gère PAS :

- contexte projet
- historique

➡️ MyTeamHub le fait déjà (context.md + sessions)

---

# ❌ ERREUR À ÉVITER

Ne jamais faire :

```js
context: "..."
```

✔ inutile  
✔ dangereux

---

# ✅ BONNE PRATIQUE

```js
projectId: 'vaultkeeper'
```

---

# 🎯 UX FINALE

## Input

```
/myteam project:vaultkeeper
Trouve 3 idées et challenge-les
```

## Output

```
🧠 Analyse :
...

🔁 Étapes :
1. Rêveur
2. Ingénieur
3. Diablotin

✅ Résultat final :
...
```

---

# 🏁 RÉSULTAT

Tu obtiens :

✔ système multi-projets  
✔ agent contrôlable  
✔ orchestration modulaire  

🚀 ÉVOLUTIONS FUTURES

**Mode avancé**
- boucle dynamique
- ping-pong agents
- consensus multi-agents

**Features**
- scoring réponses
- historique des runs
- mode auto

---

# 🧠 CONCLUSION

MyTeamHub reste simple.  
OpenClaw devient intelligent.

👉 Tu construis un orchestrateur d'intelligence collective.
