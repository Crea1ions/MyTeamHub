---
id: moc-projects
type: moc
title: "Projects Master of Ceremonies"
status: active
created: "2026-04-19T00:00:00Z"
updated: "2026-04-19T00:00:00Z"
confidence: high
tags: [moc, projects, structure, cockpit, index]
lien: [[MOC]]
---

# 📦 MOC — Projects (Index & Cockpit)

> Espace d'indexation et supervision moyen terme  
> 🎯 Vision • 📊 Status • 🔗 Links to Execution

---

## 🎯 CRITICAL RULE

**20-Projects/ is a COCKPIT, NOT an execution space**

```
✅ WHAT GOES HERE:
   • Project status overview
   • Links to active work
   • Archived project references
   • Macro-level tracking

❌ WHAT DOES NOT:
   • Actual project files
   • Planning documents
   • Active execution
   • Detailed structures
```

**The ONLY place for active project execution:**
→ `00-Inbox/agent-dev/projects-dev/`

---

## 🧱 STRUCTURE

```
20-Projects/
├── MOC-Projects.md (you are here)
├── _template-project/ (reference only)
├── active/
│   └── [project index references]
└── archived/
    └── [historical project references]
```

---

## 📊 WHAT THIS IS

**Projects Manager** is:

> 📦 l'espace de supervision et coordination
> 
> Pas l'espace de travail — juste l'index

### Différence clé

```text
EXECUTION              →  00-Inbox/agent-dev/projects-dev/
└─ Tous les détails
└─ Vraie structure
└─ Travail actif

COCKPIT               →  20-Projects/
└─ Résumé de statut
└─ Liens vers exec
└─ Vue macro
```

### Navigation

→ [[20-Projects/active/]] — Projets en cours  
→ [[20-Projects/archived/]] — Projets terminés

---

## 🔗 LINKING TO EXECUTION

Format for active project entries:

```yaml
# Project Name
Status: [active|paused|planning]
Owner: agent-dev
Location: [[00-Inbox/agent-dev/projects-dev/PROJECT-NAME]]
Start: YYYY-MM-DD
Next Review: YYYY-MM-DD
```

---

## 📋 ACTIVE PROJECTS

*Add project references here as they start*

---

## 📁 ARCHIVED PROJECTS

*Completed or paused projects archived here*

---

## 🧭 RELATED

→ [[MOC]] — System root  
→ [[00-Inbox/agent-dev]] — Actual execution  
→ [[30-Knowledge]] — Stable knowledge base

📌 Utiliser pour :

* naviguer tous les projets
* voir les templates
* organiser par domaine
* voir l'index central

---

### 🎯 PROJECT TEMPLATE

→ [[20-Projects/_template-project/]]

📌 Contient 5 fichiers structurants :

* **concept.md** → Définition et vision
* **plan-resume.md** → Vue synthétique
* **plan-complet.md** → Détails et étapes
* **tracking.md** → Progression en temps réel
* **realignement_permanent.md** → Notes d'alignement

---

### 📂 ACTIVE PROJECTS

→ [[20-Projects/]]

📌 Utiliser pour :

* voir les projets en cours
* naviguer vers un projet spécifique
* vérifier l'avancement global
* identifier les blockers

---

### 🧩 DEV PROJECTS (WORKSPACE)

→ [[00-Inbox/agent-dev/projects-dev/README]]

**Contient:**
- 🧪 Espace de travail pour projets structurés (IDE-compatible)
- 📦 [[00-Inbox/agent-dev/projects-dev/_template-project/MOC-Project]] (8-section template réutilisable)

📌 Utiliser pour :

* développer des projets avant promotion à 20-Projects/
* projets IDE-intégrés (Dev Connector write access)
* travail structuré court/moyen terme
* suivi depuis l'IDE

---

## ⚙️ 3. COMMENT UTILISER

### 🟢 CRÉER UN PROJET

**Étape 1** : Copier le template

```
cp -r _template-project/ [nom-projet]/
```

**Étape 2** : Remplir les 5 fichiers

1. `concept.md` → définir la vision
2. `plan-resume.md` → synthétiser
3. `plan-complet.md` → détailler
4. `tracking.md` → tracker
5. `realignement_permanent.md` → aligner

**Étape 3** : Lier vers le MOC

Ajouter à `20-Projects/` une référence :
```markdown
→ [[nom-projet/_index]]
```

---

### 🟡 CAS 1 — JE DÉMARRE UN PROJET

```
1. Promouvoir → depuis [[00-Inbox/agent-dev/MOC-Agent-Dev]]
   (une session devient un projet)
2. Créer → nouveau dossier dans 20-Projects/
3. Remplir → concept + plans
4. Tracker → dès le démarrage
```

---

### 🟡 CAS 2 — JE SUIS UN PROJET EXISTANT

```
1. Aller → [[20-Projects/nom-projet/]]
2. Lire → concept + plan-resume
3. Vérifier → tracking.md pour l'état
4. Mettre à jour → progress et blockers
```

---

### 🟡 CAS 3 — JE TERMINE UN PROJET

```
1. Marquer → status: completed dans tracking
2. Capitaliser → résumé final dans realignement_permanent
3. Archiver → copier résultats vers [[30-Knowledge/MOC-Knowledge]]
4. Référencer → depuis projects pour traçabilité
```

---

## 🔁 4. FLUX DE TRAVAIL RÉEL

```
Session (Agent-Dev)
    ↓
Promeut en Projet
    ↓
Formalise concept + plans
    ↓
Exécute et track
    ↓
Capitalise vers Knowledge
```

---

## 🔌 5. INTÉGRATION IDE

### ❌ INTERDIT

* IDE n'écrit **pas** dans Projects
* Projects est **structure stable**
* Modifications manuelles seulement

### ✅ AUTORISÉ

* Consulter depuis IDE
* Référencer dans agent-dev/
* Lier depuis sessions

---

## ⚠️ 6. RÈGLES CRITIQUES

### 1️⃣ Structure rigide

```
Chaque projet = 5 fichiers minimum
concept → plan-resume → plan-complet → tracking → realignement
```

### 2️⃣ Pas de conteneur flottant

* Pas de fichiers isolés
* Pas de dossier sans template
* Tout suite à la structure

### 3️⃣ Lien obligatoire

* Chaque projet → lié dans MOC-Projects
* Chaque projet → lié dans 20-Projects/ index
* Pas de projets orphelins

---

## 📊 7. TEMPLATE STRUCTURE

### concept.md

```yaml
---
id: project-name
type: concept
status: active
created: 2026-04-19
updated: 2026-04-19
---

# Concept: [Title]

## Vision
[What we're building]

## Objectives
- Goal 1
- Goal 2

## Scope
[What's in / out]

## Related
[[MOC-Knowledge]]
[[MOC-Projects]]
```

---

### tracking.md

```yaml
---
id: project-tracking
type: tracking
status: active
created: 2026-04-19
updated: 2026-04-19
---

# Tracking: [Project Name]

## Current Status
[Overall progress _%]

## Timeline
| Phase | Status | Start | End |
|-------|--------|-------|-----|
| Phase 1 | 🟢 Done | 04/19 | 04/22 |

## Blockers
[If any]

## Next Steps
1. Step 1
2. Step 2
```

---

## 🧠 8. SI TU ES PERDU

👉 Commence par le template :

```
[[20-Projects/_template-project/]]
```

Puis :

1. Copie le template
2. Remplis `concept.md`
3. Ajoute aux autres 4 fichiers progressivement

---

## 🔥 9. RÉSUMÉ

### Projects =

```
📋 formalisé
  ↓
→ planifié
  ↓
→ tracké
  ↓
→ capitalisé
```

---

### Points-clés

✅ **Structure** = 5 fichiers rigides  
✅ **Stabilité** = moyen terme  
✅ **Traçabilité** = 100% liée  
✅ **Promotion** = explicit de Sessions  

---

**👉 Retour** → [[MOC]]

