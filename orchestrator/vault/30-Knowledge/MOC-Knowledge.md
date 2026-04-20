---
id: moc-knowledge
type: moc
title: "Knowledge Base MOC"
status: active
created: "2026-04-19T00:00:00Z"
updated: "2026-04-19T00:00:00Z"
confidence: high
tags: [moc, knowledge, learning, stable, patterns]
lien: [[MOC]]
---

# 📚 MOC — Knowledge (Stable)

> Espace de capitalisation long terme  
> 📖 Concepts • 🎯 Patterns • 🔧 Solutions

---

## 🧠 1. COMMENT LE SYSTÈME FONCTIONNE

**Knowledge** est :

> 📚 l'espace de vérité durable et réutilisable

---

### 🧱 4 domaines

```text
🏗️ architecture   → structure système
🔧 dev            → pratiques et techniques
🤖 llm            → modèles et intégration
🎯 patterns       → solutions réutilisables
```

### ❗ Principe clé

> **Source de vérité**
> 
> Rien n'y entre par accident  
> Tout y reste à long terme

---

## 🧭 2. NAVIGATION PRINCIPALE

### 🏗️ ARCHITECTURE

→ [[30-Knowledge/architecture/]]

📌 Utiliser pour :

* comprendre le système global
* étudier les composants
* explorer les graphes
* analyser les dépendances

**Fichiers** :
```
architecture/
├── agent-model.md
├── dual-graph-mode.md
├── rust-orchestrator.md
└── vault-system.md
```

---

### 🔧 DEV (PRATIQUES)

→ [[30-Knowledge/dev/]]

📌 Utiliser pour :

* connaître les best practices
* réutiliser des techniques
* debugger efficacement
* optimiser les workflows

**Fichiers** :
```
dev/
├── offline-first.md
├── performance.md
├── rate-limit-strategy.md
└── testing-strategy.md
```

---

### 🤖 LLM (MODÈLES)

→ [[30-Knowledge/llm/]]

📌 Utiliser pour :

* intégrer des LLMs
* comprendre Mistral
* optimiser les prompts
* gérer les tokens

**Fichiers** :
```
llm/
├── mistral-integration.md
└── prompt-engineering.md
```

---

### 🎯 PATTERNS (SOLUTIONS)

→ [[30-Knowledge/patterns/]]

📌 Utiliser pour :

* réutiliser des solutions
* comprendre les modèles cognition
* explorer les flows
* capitaliser des insights

**Fichiers** :
```
patterns/
├── agent-cognition-model.md
└── cognitive-session-flow.md
```

---

## ⚙️ 3. COMMENT UTILISER

### 🟢 CAS 1 — JE CHERCHE UNE SOLUTION

```
1. Identifier → le domaine (architecture / dev / llm / patterns)
2. Chercher → dans le MOC correspondant
3. Lire → le fichier pertinent
4. Réutiliser → dans mon contexte
```

---

### 🟡 CAS 2 — JE VEUX DOCUMENTER UN INSIGHT

```
1. Identifier → le domaine approprié
2. Créer → un nouveau fichier [nom].md
3. Structurer → selon le modèle du domaine
4. Lier → depuis [[MOC-Knowledge]]
5. Référencer → depuis projects/sessions si pertinent
```

---

### 🟡 CAS 3 — JE CAPITALISE D'UN PROJET

```
1. Finir → un projet dans [[MOC-Projects]]
2. Extraire → les insights réutilisables
3. Créer → un nouveau fichier dans Knowledge
4. Généraliser → de spécifique → universel
5. Lier → bidirectionnellement
```

---

## 🔁 4. FLUX DE TRAVAIL RÉEL

```
Besoin de connaissance
    ↓
Chercher dans Knowledge
    ↓
Si pas trouvé → documenter
    ↓
Valider → avant de sauver
    ↓
Réutiliser dans Projects/Sessions
```

---

## 🔌 5. INTÉGRATION IDE

### ❌ INTERDIT

* IDE n'écrit **pas** dans Knowledge
* Knowledge est **read-only** pour IDE
* Modifications manuelles seulement

### ✅ AUTORISÉ

* Lire depuis IDE
* Référencer dans agent-dev/
* Copier des patterns
* Adapter localement

---

## ⚠️ 6. RÈGLES CRITIQUES

### 1️⃣ Stabilité absolue

* Knowledge ne change que pour corrections
* Pas de conteneur éphémère
* Pas de brouillons

### 2️⃣ Réutilisabilité

* Chaque fichier = exploitable indépendamment
* Pas de dépendances implicites
* Contexte auto-contenu

### 3️⃣ Traçabilité

* Chaque insight → source traceable
* Chaque pattern → validé avant ajout
* Chaque lien → vers une source

---

## 📖 7. STRUCTURE PAR DOMAINE

### 🏗️ Architecture Fichier

```markdown
---
id: architecture-topic
type: knowledge
domain: architecture
status: stable
created: 2026-04-19
updated: 2026-04-19
related: [[autre-concept]]
---

# [Concept Name]

## Overview
[High-level explanation]

## Components
[What's involved]

## Relationships
[Links to other concepts]

## Use Cases
[When to apply]
```

---

### 🔧 Dev Fichier

```markdown
---
id: dev-technique
type: knowledge
domain: dev
status: stable
created: 2026-04-19
updated: 2026-04-19
---

# [Technique/Practice]

## Problem
[What problem does it solve?]

## Solution
[How to implement]

## Example
[Code or workflow example]

## Pitfalls
[Common mistakes]
```

---

## 🧠 8. SI TU ES PERDU

👉 Commence par explorer :

```
[[patterns/]]
```

Puis navigue selon ton besoin :
- **Je cherche architecture** → `[[architecture/]]`
- **Je cherche technique** → `[[dev/]]`
- **Je cherche LLM** → `[[llm/]]`
- **Je cherche patterns** → `[[patterns/]]`

---

## 🔥 9. RÉSUMÉ

### Knowledge =

```
📚 capitalisé
  ↓
→ validé
  ↓
→ réutilisable
  ↓
→ stable
```

---

### Points-clés

✅ **Durable** = long terme  
✅ **Réutilisable** = exploitable  
✅ **Structuré** = par domaine  
✅ **Tracé** = 100% lié  
✅ **Read-only** = pour IDE  

---

**👉 Retour** → [[MOC]]

