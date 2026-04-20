---
{
  "created": "2026-04-20T01:02:52.762916540+00:00",
  "id": "d011fccd-84d3-44b7-a625-865d1caa101c",
  "project_id": null,
  "tags": [],
  "title": "",
  "type": "note",
  "updated": "2026-04-20T01:02:52.762957322+00:00"
}
---

# 🎨 MOC — MyTeam Studio (Brainstorming)

> Espace léger de brainstorming et préparation de projets  
> 💡 Idées • 🎯 Concepts • 📋 Implémentation

---

## 🎯 1. MISSION

MyTeam Studio est :

> 🧠 **un espace de capture rapide et structuration légère d'idées**

---

### 🧱 Les 3 phases

```text
💡 brainstorm  → capture et réflexion libre
🎯 concept     → clarification de l'idée
📋 demande     → préparation du transfert vers agent-dev
```

### ❗ Principe clé

> Pas de cycle complexe  
> Juste : idée → clarifiée → prête à implémenter

---

## 🧭 2. NAVIGATION PRINCIPALE

### 💭 BRAINSTORM GÉNÉRAL

→ [[00-Inbox/myteam-studio/brainstorm/general/]]

📌 Utiliser pour :

* noter des idées brutes
* capturer des réflexions rapides
* explorer des directions
* historique des réflexions passées

**Structure** :
```
general/
├── active/          (idées en cours)
└── archived/        (idées traitées)
```

**Lifespan**: Minutes à heures  
**Format**: Non structuré, libre

---

### 📁 BRAINSTORM PROJETS

→ [[00-Inbox/myteam-studio/brainstorm/]]

📌 Utiliser pour :

* préparer un projet spécifique
* clarifier une vision
* définir les fonctionnalités
* formaliser la demande d'implémentation

**Structure par projet** :
```
project-X/
├── concept.md              (vision)
└── demande-implementation.md (spec produit)
```

**Lifespan**: Jours à semaines  
**Format**: Semi-structuré, clair

---

### 💡 IDEAS (INBOX GLOBALE)

→ [[00-Inbox/myteam-studio/ideas]]

📌 Utiliser pour :

* lister rapidement toutes les idées
* créer un backlog mental
* tracker ce qui n'a pas encore de projet
* point de départ pour nouveau projet

**Format**: Liste simple + tags

---

## ⚙️ 3. WORKFLOW

### 🟢 CAS 1 — J'AI UNE IDÉE RAPIDE

```
1. Noter → dans brainstorm/general/active/
   Format: [date]-[titre-court].md
   
2. Libre → réfléchir, explorer, écrire sans structure
   
3. Quand utilisée → archiver dans general/archived/
```

**Temps**: ~5-30 minutes  
**Structure**: Libre (pas de frontmatter requis)

---

### 🟡 CAS 2 — JE PRÉPARE UN PROJET

```
1. Créer → nouveau dossier brainstorm/[nom-projet]/

2. Écrire concept.md
   - Vision du projet
   - Problème à résoudre
   - Direction générale
   - Contexte

3. Écrire demande-implementation.md
   - Ce qu'on veut construire concrètement
   - Fonctionnalités attendues
   - Contraintes principales
   - Intention produit

4. Relire → s'assurer que c'est clair

5. Transférer → vers agent-dev/projects-dev/
   (Ou créer une mission dans agent-dev/missions/)
```

**Temps**: ~1-3 heures  
**Structure**: Semi-structurée

---

### 🟣 CAS 3 — JE GÈRE MON BACKLOG D'IDÉES

```
1. Ouvrir → ideas.md

2. Lister rapidement → idées non assignées

3. Quand prête → créer un projet et déplacer vers brainstorm/project-X/

4. Quand implémentée → archiver ou supprimer

5. Quand obsolète → supprimer
```

**Temps**: Révision hebdomadaire (~10 minutes)  
**Format**: Markdown simple

---

## 🔄 4. FLUX DE TRAVAIL RÉEL

```
Idée rapide
    ↓
brainstorm/general/active/
    ↓
À explorer? → Créer projet
    ↓
brainstorm/project-X/concept.md
    ↓
À implémenter? → demande-implementation.md
    ↓
Ready → Transférer vers agent-dev/projects-dev/
    ↓
Lancé → Archiver de Studio
```

---

## ⚠️ 5. RÈGLES CRITIQUES

### 1️⃣ Légèreté d'abord

* Pas de métadata obligatoire en brainstorm/general/
* Pas de frontmatter en idées brutes
* Juste du texte libre

### 2️⃣ Légèrement structuré pour projets

* concept.md + demande-implementation.md seulement
* Pas de 8 sections comme projects-dev
* Juste ce qui clarifie l'idée

### 3️⃣ Transfert explicite

* Rien n'auto-migre vers agent-dev
* Tu décides quand c'est "prêt à implémenter"
* Copie manuelle vers projects-dev/

### 4️⃣ Nettoyage régulier

* Archiver les idées anciennes (general/archived/)
* Supprimer les idées mortes
* Réduire le bruit

---

## 📖 6. STRUCTURE PAR CAS D'USAGE

### Pour brainstorm/general/active/

```markdown
# [Titre de l'idée]

## Contexte
[Pourquoi cette idée m'intéresse]

## Réflexions
[Exploration libre]

## Questions ouvertes
[Ce qu'il faut clarifier]

## Tags
#domaine #type #priorité
```

### Pour concept.md (project-X/)

```markdown
# Concept: [Nom du Projet]

## Vision
[Qu'est-ce qu'on construit? À quoi ça sert?]

## Problème
[Quel problème on résout?]

## Direction
[Approche générale]

## Contexte
[Dépendances, prérequis, contraintes]
```

### Pour demande-implementation.md (project-X/)

```markdown
# Demande d'Implémentation: [Nom du Projet]

## Objectif Produit
[Ce qu'on veut construire concrètement]

## Fonctionnalités Attendues
1. Feature 1
2. Feature 2
...

## Contraintes Principales
- Contrainte 1
- Contrainte 2

## Intention Produit
[Pourquoi c'est important pour l'utilisateur]

## Proposition d'Implémentation
[Idée sur comment s'y prendre]
```

---

## 🔌 7. INTÉGRATION AVEC LE SYSTÈME

### IDE et Studio

* **Studio** = Brainstorm (léger, rapide)
* **Agent-Dev** = Exécution (structuré, suivi)
* **Studio → Agent-Dev** = Transfert manuel explicite

### Flux complet

```
Studio (idée)
    ↓
Clarifie concept + demande
    ↓
Prête? → Copie vers agent-dev/projects-dev/
    ↓
Ou créé mission dans agent-dev/missions/
    ↓
Agent-Dev exécute
    ↓
Résultat → Project ou Knowledge
```

---

## 🧠 8. SI TU ES PERDU

### "J'ai une idée, je fais quoi?"

**Idée très rapide et brute** 
→ Jette dans `brainstorm/general/active/`

**Idée que tu veux explorer** 
→ Crée `brainstorm/project-X/concept.md`

**Idée que tu veux qu'on implémente** 
→ Crée `brainstorm/project-X/demande-implementation.md`

**Idée que tu as oubliée** 
→ Ajoute à `ideas.md` comme backup

---

## 🔥 9. RÉSUMÉ

### Studio =

```
💡 léger
  ↓
→ rapide
  ↓
→ préparation
  ↓
→ transfert vers exécution
```

---

### Points-clés

✅ **Léger** = Pas de structure complexe  
✅ **Rapide** = Capturer en quelques minutes  
✅ **Préparation** = Clarifier avant implémentation  
✅ **Transfert** = Explicite vers agent-dev  

---

**Relation avec autres espaces** :
- Studio (brainstorm/concept) ← idées brutes
- Agent-Dev (projects-dev) ← idées prêtes
- Knowledge (30-Knowledge) ← résultats finaux
- Projects (20-Projects) ← cockpit supervision

---

**👉 Pour commencer** → Choisis [[#3-workflow|un cas d'usage]]
