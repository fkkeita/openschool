# Guide Git - Projet OpenSchool

## Overview

Ce guide explique comment utiliser Git pour sécuriser ton projet et travailler de manière collaborative.

---

## Commandes de Base

### Vérifier le status
```bash
git status
```

### Voir les modifications
```bash
git diff
```

### Ajouter des fichiers
```bash
# Un fichier
git add nom-du-fichier

# Tous les fichiers
git add .

# Par motif
git add src/**/*.ts
```

### Créer un commit
```bash
git commit -m "_description_claire"
```

### Voir l'historique
```bash
git log
git log --oneline
git log -10
```

---

## Flux de Travail Sécurisé

### Étape 1: Avant de travailler
```bash
# Mettre à jour la branche principale
git checkout main
git pull origin main
```

### Étape 2: Créer une branche de travail
```bash
git checkout -b nom-branche
# Exemple: feature/notes-popup-design
```

### Étape 3: Travailler et sauvegarder
```bash
# Voir ce qui a changé
git status
git diff

# Ajouter les fichiers modifiés
git add .

# Créer un commit avec message descriptif
git commit -m "feat: improve notes popup design"
```

### Étape 4: Pousser vers le远程
```bash
git push -u origin nom-branche
```

### Étape 5: Fusionner dans main
```bash
git checkout main
git merge nom-branche
git push origin main
```

---

## Revenir à une Version Précédente

### Voir les commits
```bash
git log --oneline
```

### Revenir à un commit précis (sans supprimer l'historique)
```bash
git checkout numero-du-commit -- .
git commit -m "revert: retour à la version precedente"
```

### Annuler le dernier commit (garder les modifications)
```bash
git reset --soft HEAD~1
```

### Annuler le dernier commit (sans garder's modifications)
```bash
git reset --hard HEAD~1
```

### Revenir à un commit spécifique
```bash
git checkout numero-du-commit
```

---

## Travailler à Plusieurs

### Créer une branche pour une fonctionnalité
```bash
git checkout -b feature/nom-fonctionnalite
```

### Basculer entre branches
```bash
git checkout main
git checkout autre-branche
```

### Fusionner une branche
```bash
git checkout main
git merge feature/nom-fonctionnalite
```

### Supprimer une branche
```bash
git branch -d nom-branche
```

---

## Bonnes Pratiques

### Messages de commit clairs
```
feat:     nouvelle fonctionnalité
fix:     correction de bug
refactor: refactorisation
style:   changements de style/design
docs:    documentation
test:    ajout de tests
chore:   maintenance
```

### Exemples de messages
```
feat: add notes popup design improvements
fix: resolve sidebar display issue
style: harmonize modal colors with design system
```

---

## Commandes Utiles

| Commande | Description |
|---------|-------------|
| `git status` | Voir l'état des fichiers |
| `git diff` | Voir les changements |
| `git log --oneline` | Historique court |
| `git checkout -b` | Créer branche |
| `git merge` | Fusionner branche |
| `git stash` | Sauvegarder temporairement |
| `git stash pop` | Récupérer sauvegarde |