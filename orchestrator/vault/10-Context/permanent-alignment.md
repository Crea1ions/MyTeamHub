---
id: permanent-alignment
type: context
title: "Permanent System Alignment"
status: active
created: "2026-04-18T00:00:00Z"
updated: "2026-04-19T00:00:00Z"
confidence: high
tags: [architecture, philosophy, alignment, system-design]
lien: [[MOC]]
---

# 🧠 MYTEAM — PERMANENT ALIGNMENT FILE

*Last Updated: 2026-04-19 (Phase 5.5)*
**Current Phase**: 5.5 Vault Standardization
**Reference**: System architecture and design principles

---

# 🎯 1. NATURE DU PRODUIT

MyTeam est :

> 🧠 **un IDE cognitif basé sur fichiers + agents + contexte partagé**

---

MyTeam n'est PAS :

* ❌ un dashboard SaaS
* ❌ un orchestrateur visible
* ❌ un pipeline LLM
* ❌ un clone d'Obsidian

---

🧩 1. ARCHITECTURE COGNITIVE (PRINCIPE CENTRAL)

Orchestrator n'est pas une app UI, mais un IDE cognitif à mémoire structurée

Structure stable :
🟦 Studio = interaction + contexte local + chat LLM
🧭 Vault = mémoire persistante + knowledge graph
⚙️ Orchestrator = système événementiel + sécurité + règles
🔌 Dev Connector = pont IDE ↔ mémoire dev
🟣 OpenClaw = intelligence externe en lecture seule
🔥 2. RÈGLE DE SÉPARATION STRICTE

❗ Aucun composant ne doit devenir un "centre de contrôle global"

Studio ❌ n'orchestré rien
Vault ❌ ne calcule rien
LLM ❌ n'est pas un système
Orchestrator ❌ ne fait pas de runtime UI

👉 chaque module = responsabilité unique

🧠 3. SOURCE DE VÉRITÉ
🧭 Vault = mémoire globale persistante
🟦 Studio = contexte temporaire de session
⚙️ Orchestrator = validation + synchronisation

👉 aucune autre source de vérité n'existe

🔌 4. RÈGLE DES CONNECTEURS EXTERNES
IDE Connector
lecture + écriture contrôlée
accès limité à agent-dev/
jamais accès aux projets ou knowledge
OpenClaw
lecture seule globale Vault
aucune écriture
analyse externe uniquement

👉 tous les accès passent par l'Orchestrator

⚡ 5. LLM FLOW (CRITIQUE)

Le LLM est un service, pas un système

accès direct depuis Studio via proxy
jamais via Orchestrator
pas de mémoire propre
rate limit géré côté proxy
🔒 6. RÈGLE DE PROTECTION DU VAULT

❌ interdit :

montage filesystem libre
accès IDE direct Vault
écriture hors sandbox

✔ autorisé :

API contrôlée
paths whitelistés
validation Orchestrator
🧠 7. MODÈLE DE MÉMOIRE
🧪 Session = temporaire (Studio)
🧠 Dev Memory = IDE (agent-dev)
📦 Knowledge = stable (Vault global)

👉 aucune confusion entre ces couches

🔄 8. FLUX SYSTÈME CANONIQUE
User
 → Studio (session)
 → LLM Proxy (chat)
 → Orchestrator (events)
 → Vault (persistant)
 → OpenClaw (read analysis)
 → IDE Connector (dev memory bridge)
⚙️ 9. RÈGLE D'ORCHESTRATION

❗ L'Orchestrator ne doit JAMAIS être dans le chemin critique du chat

il est événementiel
pas runtime
pas UI-driven
🔐 10. SÉCURITÉ & LIMITATION
tokens par connecteur (IDE / OpenClaw)
scope strict par répertoire Vault
rate limiting sur LLM proxy
audit logs obligatoires
🧩 11. OPENCLAW (RÔLE FIXE)
lecture seule
analyse globale
enrichissement externe
jamais de mutation directe
🧠 12. CONCEPT DE "CONTEXT UNIQUE"

un seul contexte actif à la fois

Studio = fichier actif
Chat = contexte Editor + 2 messages
Vault = multi-context passif
🚫 13. ANTI-PATTERNS INTERDITS
pipeline agent rigide
orchestration LLM centralisée
Vault utilisé comme runtime
IDE connecté en filesystem brut
mémoire distribuée non contrôlée
🧠 14. PHILOSOPHIE PRODUIT

Orchestrator n'est pas un outil d'orchestration LLM

c'est :

🧠 un système de continuité cognitive entre code, mémoire et réflexion

🔥 15. PRINCIPLE FINAL (IMMUTABLE)

❗ Le système doit toujours rester lisible sans connaissance interne

chaque composant doit être remplaçable
aucune dépendance circulaire
aucune intelligence cachée
aucune logique globale opaque

## 🟦 Screen 1 — MYTEAM (STUDIO)

Layout: 3 colonnes

* Left → Files (projets)
* Center → Editor (**source du contexte**)
* Right → Chat + Agents

### Règles critiques :

* 1 fichier ouvert = 1 contexte
* Chat utilise :

  * contenu éditeur
  * 2 derniers messages uniquement
* Aucun état global caché

---

## 🧭 Screen 2 — VAULT

Layout: 3 colonnes

* Left → Explorer (fichiers Vault)
* Center → Graph (liens markdown)
* Right → Viewer (contenu)

### Règles :

* Vault = mémoire persistante
* Graph = basé sur `[[links]]` uniquement
* Pas de logique LLM ici

---

## ⚙️ Screen 3 — CONFIG

Layout: 3 colonnes

* Left → API / clés
* Center → Agents (prompts)
* Right → Status système
