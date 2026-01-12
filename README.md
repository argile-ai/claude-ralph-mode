# Ralph

Ralph is an autonomous AI agent loop that runs [Claude Code](https://claude.ai/code) repeatedly until all PRD items are complete. Each iteration is a fresh Claude Code instance with clean context.

Based on [Geoffrey Huntley's Ralph pattern](https://ghuntley.com/ralph/).

## Structure du projet argile-app

**Important:** Ce projet contient deux repositories git distincts:

```
argile-app/
├── argile-lib-python/      # Backend FastAPI (REPO GIT SEPARE)
│   ├── .git/               # git@github.com:argile-ai/argile-lib-python.git
│   └── CLAUDE.md
├── remi-web-ui/            # Frontend NextJS (REPO GIT SEPARE)
│   ├── .git/               # git@github.com:ai-remi/remi-web-ui.git
│   └── CLAUDE.md
├── ralph/                  # Configuration Ralph (ce dossier)
│   ├── .claude/commands/
│   ├── prompt.md
│   ├── ralph.sh
│   ├── prd.json            # A creer pour chaque feature
│   └── progress.txt        # Learnings accumules
└── CLAUDE.md
```

## Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
- `jq` installed (`brew install jq` on macOS)

## Usage depuis argile-app

### 1. Creer un PRD pour une feature

Depuis le dossier `argile-app/`, lancez Claude Code:

```bash
cd /Users/florentdrilhon/Argile/argile-app
claude
```

Utilisez la commande `/prd`:
```
/prd Ajouter un systeme de notifications

Backend (argile-lib-python):
- Modele Notification en base
- Endpoints CRUD pour les notifications

Frontend (remi-web-ui):
- Icone cloche dans le header
- Panel de notifications
```

Le PRD sera sauvegarde dans `tasks/prd-[feature-name].md`.

### 2. Convertir le PRD en format Ralph

```
/ralph tasks/prd-notifications.md
```

Cela cree `ralph/prd.json` avec:
- Les branches pour chaque repo (`repositories`)
- Les stories avec leur repo cible (`repo` field)

### 3. Lancer Ralph

```bash
./ralph/ralph.sh [max_iterations]
```

Ralph va:
1. Afficher les stories en attente et leur repo cible
2. Prendre la story prioritaire avec `passes: false`
3. Se placer dans le bon repo (`argile-lib-python` ou `remi-web-ui`)
4. Creer/checkout la branche appropriee
5. Implementer la story
6. Lancer les checks qualite du repo
7. Commit dans le bon repo
8. Mettre a jour `prd.json`
9. Repeter jusqu'a completion

## Format du PRD (prd.json)

```json
{
  "project": "Notifications",
  "description": "Systeme de notifications temps reel",
  "repositories": {
    "argile-lib-python": {
      "branchName": "feature/notifications"
    },
    "remi-web-ui": {
      "branchName": "feature/notifications"
    }
  },
  "userStories": [
    {
      "id": "US-001",
      "title": "Add notifications table",
      "repo": "argile-lib-python",
      "description": "...",
      "acceptanceCriteria": ["...", "Tests pass (pytest)"],
      "priority": 1,
      "passes": false,
      "notes": ""
    },
    {
      "id": "US-002",
      "title": "Add notification bell component",
      "repo": "remi-web-ui",
      "description": "...",
      "acceptanceCriteria": ["...", "Build passes", "Verify in browser"],
      "priority": 2,
      "passes": false,
      "notes": ""
    }
  ]
}
```

**Champs cles:**
- `repositories`: Branches a creer dans chaque repo
- `repo` (par story): `argile-lib-python` ou `remi-web-ui`
- `fork` (par story): `true` pour creer une nouvelle branche avant implementation

## Forking de branches

Ralph supporte le "forking" de branches pour permettre des iterations paralleles ou des changements de direction.

### Quand utiliser le fork

- `"fork": false` (defaut): Continuer sur la branche existante
- `"fork": true`: Creer une nouvelle branche avant d'implementer la story

### Comment ca marche

Quand `fork: true` est defini sur une story:

1. Ralph detecte le numero de fork suivant (ex: `feature/task-1`, `feature/task-2`)
2. Cree une nouvelle branche depuis la branche courante
3. Met a jour `repositories[repo].activeBranch` dans le PRD
4. Continue l'implementation sur cette nouvelle branche

### Exemple

```json
{
  "repositories": {
    "argile-lib-python": {
      "branchName": "feature/notifications",
      "activeBranch": "feature/notifications-2"
    }
  },
  "userStories": [
    {
      "id": "US-005",
      "title": "Refactor notification logic",
      "repo": "argile-lib-python",
      "fork": true,
      "passes": false
    }
  ]
}
```

Dans cet exemple, `activeBranch` indique que Ralph travaille sur `feature/notifications-2` (fork #2).

## Ordre des stories

Les stories backend doivent etre avant les stories frontend:

1. **argile-lib-python**: Schema/migrations
2. **argile-lib-python**: Endpoints API
3. **remi-web-ui**: Composants UI
4. **remi-web-ui**: Integration/pages

## Quality Checks

### argile-lib-python
```bash
cd argile-lib-python
uvl pytest .          # Tests
uvl mypy .          # Types
ruff check .              # Lint
```

### remi-web-ui
```bash
cd remi-web-ui
npm run build             # Build + types
npm run lint              # Lint
npm run test                  # Tests
```

## Key Files

| File | Purpose |
|------|---------|
| `ralph/ralph.sh` | Script de boucle autonome |
| `ralph/prompt.md` | Instructions pour chaque iteration |
| `ralph/prd.json` | Stories avec status et repo cible |
| `ralph/progress.txt` | Learnings par repo |
| `ralph/.claude/commands/prd.md` | Commande `/prd` |
| `ralph/.claude/commands/ralph.md` | Commande `/ralph` |

## Debugging

```bash
# Voir les stories par repo
cat ralph/prd.json | jq '.userStories[] | {id, repo, title, passes}'

# Branches actuelles
cd argile-lib-python && git branch --show-current
cd remi-web-ui && git branch --show-current

# Learnings
cat ralph/progress.txt
```

## Archivage

Ralph archive automatiquement les runs precedents quand vous changez de projet. Les archives sont dans `ralph/archive/YYYY-MM-DD-project-name/`.

## References

- [Geoffrey Huntley's Ralph article](https://ghuntley.com/ralph/)
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code)
