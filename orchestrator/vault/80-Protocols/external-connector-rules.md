---
id: external-connector-rules
type: log
title: "External Connector Rules Log"
status: active
created: "2026-04-19T00:00:00Z"
updated: "2026-04-19T00:00:00Z"
confidence: high
tags: [log, connectors, external, security]
lien: [[MOC]]
---

# 🔌 External Connector Rules Log

> Journal des connexions externes et des opérations  
> 🧪 IDE Connector • 🟣 OpenClaw • 🔐 Sécurité

---

## Format d'entrée
```
### TIMESTAMP [CONNECTOR] - OPERATION

**Type**: connect|disconnect|read|write|error  
**Scope**: IDE|OpenClaw  
**Token**: token_id  
**Status**: success|denied|expired  
**Resource**: path (if applicable)  
```

---

## Journal des connexions

*Les opérations de connexion seront enregistrées ici...*
