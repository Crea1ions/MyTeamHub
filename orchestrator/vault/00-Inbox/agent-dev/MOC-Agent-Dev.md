---
id: moc-agent-dev
type: moc
title: "Agent Dev Workspace MOC"
status: active
created: "2026-04-19T00:00:00Z"
updated: "2026-04-19T00:00:21Z"
confidence: high
tags: [moc, agent-dev, dev, workspace, sessions, projects]
lien: [[MOC], [projects-dev/README]]
---

# 🧠 MOC — Agent Dev (Workspace)

> Espace de pensée court terme  
> 🧪 Sessions • 🧠 Mémoire • ⚙️ Missions
├── agent-dev
│   │   ├── agent-conversations
│   │   ├── memory
│   │   │   ├── recent-context.md
│   │   │   └── vault-architecture-graph.md
│   │   ├── missions
│   │   │   └── mission-report-phase-5-5.md
│   │   ├── MOC-Agent-Dev.backup
│   │   ├── MOC-Agent-Dev.md
│   │   ├── projects-dev
│   │   │   ├── README.md
│   │   │   └── _template-project
│   │   │       ├── 00-overview
│   │   │       │   ├── alignment.md
│   │   │       │   ├── concept.md
│   │   │       │   └── executive-summary.md
│   │   │       ├── 01-planning
│   │   │       │   ├── plan-complet.md
│   │   │       │   ├── plan-resume.md
│   │   │       │   └── roadmap.md
│   │   │       ├── 02-architecture
│   │   │       │   ├── architecture.md
│   │   │       │   └── system-design.md
│   │   │       ├── 03-features
│   │   │       │   └── FEATURE_TEMPLATE.md
│   │   │       ├── 04-phases
│   │   │       │   └── PHASE_TEMPLATE.md
│   │   │       ├── 05-sessions
│   │   │       │   └── session-template.md
│   │   │       ├── 06-decisions
│   │   │       │   └── DECISION_TEMPLATE.md
│   │   │       ├── 07-tracking
│   │   │       │   ├── blockers.md
│   │   │       │   └── tracking.md
│   │   │       ├── 08-logs
│   │   │       │   └── log-template.md
│   │   │       └── MOC-Project.md
│   │   └── sessions-dev
│   │       ├── missions
│   │       └── session-template.md
---

## 🧠 1. COMMENT LE SYSTÈME FONCTIONNE

**Agent-Dev** est :

> 🧪 l'espace d'action et de réflexion immédiate (après brainstorming en Studio)

---

### 🧱 3 dimensions

```text
🧪 sessions-dev   → capture des flux de travail
🧠 memory         → notes et contexte personnel
⚙️  missions       → tâches en cours et objectifs
📊 projects-dev   → projets structurés (provenant de Studio)
```

### 📍 Relation avec Studio

**Studio** (myteam-studio/) génère les idées claires → **Agent-Dev** les exécute

```
Studio (idée → clarifiée)
    ↓
Transférer vers Agent-Dev
    ↓
Agent-Dev (exécute)
    ↓
Résultat → Projects ou Knowledge
```

### ❗ Principe clé

> **IDE → Agent-Dev uniquement**
> 
> Tout ce qui se passe ici est temporaire  
> Rien n'est persistant automatiquement

---

## 🧭 2. NAVIGATION PRINCIPALE

### 🧪 SESSIONS DEV

→ [[00-Inbox/agent-dev/sessions-dev/]]

📌 Utiliser pour :

* suivre un flux de travail
* capturer des décisions
* tracer les itérations
* documenter les résultats

**Structure** :
```
sessions-dev/
├── YYYYMMDD-nom-session.md
├── tracking.md
└── [sessions...]
```

---

### 🧠 MEMORY

→ [[00-Inbox/agent-dev/memory/]]

📌 Utiliser pour :

* notes personnelles
* insights rapides
* contexte local
* références rapides

**Structure** :
```
memory/
├── recent-context.md
├── notes.md
└── [captures...]
```

---

### ⚙️ MISSIONS

→ [[00-Inbox/agent-dev/missions/]]

📌 Utiliser pour :

* définir une tâche
* suivre progression
* organiser des sprints
* tracker des objectifs

**Structure** :
```
missions/
├── active/
├── completed/
└── backlog/
```

---

### 🧩 PROJECTS DEV

→ [[00-Inbox/agent-dev/projects-dev/README]]

📌 Utiliser pour :

* projets structurés long terme
* travail réutilisable et scalable
* suivi détaillé multi-phase
* documentation complète

**Caractéristiques** :
- 📦 **Un seul modèle** : `_template-project/`
- 🧠 **8 sections** : overview, planning, architecture, features, phases, sessions, decisions, tracking, logs
- 🔌 **IDE-compatible** : Dev Connector écrit directement
- 🎯 **Persistant** : Contrairement aux sessions éphémères

**Flux de travail** :
1. **Besoin d'un projet structuré** → Crée dans `projects-dev/`
2. **Copie structure** → Depuis `_template-project/`
3. **Remplis sections** → En progression du projet
4. **IDE y écrit directement** → Via Dev Connector

👉 **Voir** : [[projects-dev/README]] pour guide complet

---

## 🎯 3. COMMENT UTILISER

### 🟢 FLUX TYPIQUE

1. **Démarrer une session** → `sessions-dev/`
   * Crée un fichier avec date + nom
   * Inclus le contexte initial

2. **Capturer les notes** → `memory/`
   * Sauve les insights clés
   * Référence d'autres fichiers

3. **Tracker les tâches** → `missions/`
   * Crée une mission
   * Marque progression
   * Archve quand complète

---

### 🟡 CAS 1 — JE COMMENCE À CODER (Rapide)

```
1. Créer → sessions-dev/20260419-feature-xyz.md
2. Écrire → contexte, plan, code
3. Sauver → quand milestone
4. Archiver → quand terminé
```

### 🟡 CAS 2 — JE LANCE UN PROJET (Structuré)

**Étape 1: Créer le projet**
```bash
mkdir -p projects-dev/mon-projet
cp -r projects-dev/_template-project/0{0..8}-* projects-dev/mon-projet/
cp projects-dev/_template-project/MOC-Project.md projects-dev/mon-projet/
```

**Étape 2: Configurer le MOC**
```
Éditer projects-dev/mon-projet/MOC-Project.md
- Remplacer [PROJECT] par le nom du projet
- Ajouter lien vers parent: [[../MOC-Agent-Dev]]
```

**Étape 3: Remplir les sections**
```
1. concept.md              (vision et objectif)
2. plan-resume.md          (vue synthétique)
3. architecture.md         (design initial)
```

**Étape 4: Créer les sessions DE DEV**
```
Pour chaque sprint/phase :
  → projects-dev/mon-projet/05-sessions/
     - YYYYMMDD-feature-xyz.md (session de dev)
     - YYYYMMDD-architecture-review.md
     - YYYYMMDD-sprint-01.md

⚠️  NOTE IMPORTANTE:
   - Les sessions DE DEV d'un projet vont dans 05-sessions/
   - C'est DIFFÉRENT de sessions-dev/ (qui est éphémère)
   - Les sessions de projet PERSISTENT dans le dossier projet
   - Voir template: [[projects-dev/_template-project/05-sessions/session-template.md]]
```

**Étape 5: Tracker et intégrer**
```
- Mises à jour → projects-dev/mon-projet/07-tracking/
- Décisions → projects-dev/mon-projet/06-decisions/
- Logs → projects-dev/mon-projet/08-logs/
```

**Structure finale:**
```
projects-dev/mon-projet/
├── 05-sessions/
│   ├── 20260419-kickoff.md          (session de dev)
│   ├── 20260420-architecture.md     (session de dev)
│   └── 20260421-sprint-01.md        (session de dev)
├── 07-tracking/
│   └── tracking.md                   (progress)
├── 06-decisions/
│   └── DECISION_TEMPLATE.md          (technical choices)
└── MOC-Project.md                    (navigation)
```

### 🟡 CAS 3 — JE RÉFLÉCHIS SUR UN PROBLÈME

```
1. Noter → memory/notes.md
2. Lier → vers [[MOC-Knowledge]] ou [[MOC-Projects]]
3. Capturer → insights + décisions
```

### 🟡 CAS 4 — JE DOIS TRACKER UNE TÂCHE

```
1. Créer → missions/active/[task].md
2. Suivre → progression et blockers
3. Archiver → dans missions/completed/
```

---

## 🔁 4. FLUX DE TRAVAIL RÉEL

### 🔄 SESSIONS (Éphémère)
```
Ouvre IDE
    ↓
Travaille (sessions-dev/)
    ↓
Capture rapide → memory/
    ↓
Quand terminé → archivé
```

### 🔄 PROJECTS (Structuré)
```
Nouveau projet identifié
    ↓
Crée dans projects-dev/
    ↓
Suit 8 sections (planning → tracking)
    ↓
IDE y écrit directement
    ↓
Persiste long terme
```

### 🔄 PROMOTION
```
Éphémère (session) ou structuré (project)
    ↓
Stable → copier vers [[MOC-Projects]]
    ↓
Mature → copier vers [[MOC-Knowledge]]
```

---

## 🔌 5. INTÉGRATION IDE

### ✅ AUTORISÉ

```
00-Inbox/agent-dev/
├── sessions-dev/     (write)
├── memory/           (write)
├── missions/         (write)
└── projects-dev/     (write)
```

### ❌ INTERDIT

* Écrire dans Projects (20-Projects/)
* Écrire dans Knowledge (30-Knowledge/)
* Écrire dans Context (10-Context/)
* Écrire dans Protocols (80-Protocols/)
* Modifier _template-project/ structure

---

## ⚠️ 6. RÈGLES CRITIQUES

### 1️⃣ Temporalité

* **Ici** = court terme (jours)
* **Projects** = moyen terme (semaines)
* **Knowledge** = long terme (stable)

### 2️⃣ Migration explicite

* Rien n'auto-migre
* Tu décides de promouvoir
* Copie-colle + restructure

### 3️⃣ Nettoyage

* Archive les sessions anciennes
* Supprime les notes obsolètes
* Garde seulement l'utile

---

## 🧠 8. SI TU ES PERDU

👉 Demande-toi : **C'est quoi mon besoin?**

**Je dois coder rapidement** 
→ Crée une session : `[[sessions-dev/]]`

**Je dois tracker une tâche**
→ Crée une mission : `[[missions/]]`

**Je dois noter une idée**
→ Sauve dans memory : `[[memory/]]`

**Je dois un projet structuré**
→ Crée dans projects-dev : `[[projects-dev/]]`

**Plus d'infos sur projects-dev?**
→ Lis ceci : `[[projects-dev/README]]`

---

## 🧩 10. PROJECTS-DEV WORKFLOW

> Comment organiser des **sessions de dev** pour chaque projet avec le template  
> ➡️ **Référence Template** : [[projects-dev/_template-project/MOC-Project]]

---

### 📋 FLUX: Nouveau Projet

**Phase 1: Setup (15 min)**
```
1. Créer dossier
   mkdir -p projects-dev/mon-projet

2. Copier template (8 sections)
   cp -r _template-project/0{0..8}-* projects-dev/mon-projet/
   
3. Copier MOC
   cp _template-project/MOC-Project.md projects-dev/mon-projet/
```

**Phase 2: Initialisation (30 min)**
```
Remplir sections principales :
   ✏️ 00-overview/concept.md        → Vision
   ✏️ 01-planning/plan-resume.md    → Synthèse
   ✏️ 02-architecture/architecture  → Design
```

**Phase 3: Dev Sessions (Ongoing)**
```
Pour chaque sprint/feature/réunion :
   📝 projects-dev/mon-projet/05-sessions/
      ├── 20260419-kickoff.md           (session de démarrage)
      ├── 20260420-sprint-01-review.md  (session de review)
      ├── 20260421-architecture-deep.md (session technique)
      └── [daily work captures]

   Contenu type session:
   - Contexte initial
   - Objectifs de la session
   - Travail effectué
   - Décisions prises
   - Blockers identifiés
   - Next steps
```

**Phase 4: Tracking Continu**
```
Après chaque session :
   📊 projects-dev/mon-projet/07-tracking/tracking.md
      → Mise à jour du % complété
      → État des phases
      
   🚧 projects-dev/mon-projet/07-tracking/blockers.md
      → Ajout des blockers rencontrés
      
   🤝 projects-dev/mon-projet/06-decisions/
      → Archivage des décisions importantes
      
   📝 projects-dev/mon-projet/08-logs/
      → Journal des événements clés
```

---

### 🔄 SESSIONS DE DEV = Captures Organisées

**Chaque session :**
```
🎯 Objectif unique   → Feature / Sprint / Review
📅 Datée             → YYYYMMDD-nom.md
🏗️ Structurée        → Template session
📍 Localisée         → 05-sessions/ du projet
🔗 Liée              → MOC-Project.md
```

**Exemple session complète:**
```markdown
---
id: session-20260419-kickoff
type: session
title: "Session: Project Kickoff"
status: active
project: mon-projet
---

# Session: Sample Project - Kickoff

## 🎯 Objectif
Démarrer le projet, définir la vision

## 📝 Contexte
[Situation initiale]

## ✅ Travail Effectué
- Défini concept.md
- Créé plan-resume.md
- Identifié architecture baseline

## 🤝 Décisions
- Approche technique X choisi
- Timeline: 3 semaines

## 🚧 Blockers
- [Aucun pour le moment]

## 🎬 Next Steps
1. Remplir plan-complet.md
2. Créer sprint-01 plan
```

---

### 🔗 Liens entre Sessions & Template

**Le _template-project contient :**
- **Structure**: 8 sections numérotées (00-overview... 08-logs)
- **MOC-Project.md**: Navigation complète du template avec explications
- **Chaque section**: Un fichier template avec structure/format

**Voir la documentation complète :**
👉 [[projects-dev/_template-project/MOC-Project]]
👉 [[projects-dev/README]]

**Architecture du projet :**
```
projects-dev/mon-projet/
│
├── 00-overview/          ← Vision initiale
│   ├── concept.md        (défini en session kickoff)
│   ├── alignment.md      (mis à jour en sessions)
│   └── executive-summary.md
│
├── 01-planning/          ← Plans
│   ├── plan-complet.md   (résultat de sessions planning)
│   ├── plan-resume.md
│   └── roadmap.md
│
├── 02-architecture/      ← Design
│   ├── architecture.md   (reviews en sessions)
│   └── system-design.md
│
├── 03-features/          ← Features tracées
│   └── [FEATURE_n.md]    (créées en sessions)
│
├── 04-phases/            ← Phases
│   └── [PHASE_n.md]      (tracées en sessions)
│
├── 05-sessions/          ← 🎯 VOTRE JOURNAL DE DEV
│   ├── 20260419-kickoff.md
│   ├── 20260420-sprint-01-plan.md
│   ├── 20260421-architecture-deep-dive.md
│   ├── 20260422-feature-xyz-dev.md
│   └── [captures de travail]
│
├── 06-decisions/         ← Décisions archivées
│   └── [DECISION_n.md]   (documentées en sessions)
│
├── 07-tracking/          ← Progression
│   ├── tracking.md       (mis à jour après sessions)
│   └── blockers.md
│
├── 08-logs/              ← Historique
│   └── [LOG_n.md]        (résumés de sessions)
│
└── MOC-Project.md        ← Navigation
```

---

### ✨ Avantage: Sessions Organisées par Projet

✅ **Tracabilité** — Chaque session = moment clé du projet  
✅ **Contexte** — Sessions liées au projet, pas dispersées  
✅ **Progression** — Sessions → tracking → complétion  
✅ **Réutilisable** — Template assure structure cohérente  
✅ **IDE-Compatible** — IDE écrit directement dans 05-sessions/  

---

### 🚀 Quick Start: Nouveau Projet

```bash
# 1. Copier le template
cp -r projects-dev/_template-project projects-dev/mon-projet

# 2. Éditer le MOC
vim projects-dev/mon-projet/MOC-Project.md

# 3. Première session
cat > projects-dev/mon-projet/05-sessions/20260419-kickoff.md << 'EOF'
---
id: session-20260419-kickoff
type: session
title: "Kickoff: Sample Project"
status: active
project: mon-projet
---

# Session: Kickoff

## Objectif
Démarrer le projet

## Contexte
[...]

## Work Done
- Structuré le projet
- Rempli concept

## Decisions
- [...]

## Blockers
- Aucun

## Next
[...]
EOF

# 4. Tracker dans tracking.md
vim projects-dev/mon-projet/07-tracking/tracking.md
```

---

## 🔥 11. RÉSUMÉ FINAL

### Agent-Dev = 4 dimensions

```
🧪 sessions-dev/  → capture rapide (éphémère)
🧠 memory/        → notes personnelles
⚙️  missions/      → tâches à tracker
🧩 projects-dev/  → projets structurés (persistant)
```

### Flux simplifié

```
📝 Travail rapide  → sessions-dev/ → archiver
🎯 Projet important → projects-dev/ → persiste
💡 Insight utile   → memory/ ou project
```

### Points-clés

✅ **Éphémère vs Persistant** = sessions vs projects  
✅ **IDE peut écrire** = agent-dev/ seulement  
✅ **Promotion explicite** = tu décides  
✅ **4 dimensions** = sessions / memory / missions / projects  
✅ **Un seul template** = _template-project/  

---

**👉 Retour** → [[MOC]]
