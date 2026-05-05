# AGENTS.md - Guide pour Agents IA

## 🚀 Commandes Essentielles

```bash
# Démarrer l'application
npm start          # ng serve

# Lancer avec открытие automatique du navigateur
npm run serve       # ng serve --open

# Vérifier les types TypeScript
npx tsc --noEmit --project tsconfig.json

# Construire pour production
npm run build
```

---

## 🏗️ Architecture du Projet

### Stack Technique
- **Angular 21** avec Standalone Components
- **TypeScript** strict
- **jsPDF** pour génération PDF (import dynamique)
- **SCSS** pour les styles

### Structure des Pages
```
src/app/pages/
├── notes/           # Module Notes (principal)
│   ├── notes.component.ts      # Logique principale
│   ├── notes.component.html # Template
│   └── notes.component.scss # Styles
```

### Composants Importants
- `BulletinPdfComponent` - Génération PDF des bulletins
- `NotesComponent` - Gestion des notes, évaluations, trimestres

---

## ⚠️ Points Critiques pour les Agents

### 1. Import Dynamique de jsPDF
Ne pas importer `jspdf` directement au niveau du fichier. Utiliser :
```typescript
const jsPDF = await import('jspdf');
```

### 2. Propriétés Privées vs Templates
Toute méthode utilisée dans le template HTML_DOIT être **publique** (sans `private`) :
```typescript
// ✅ OK - utilisable dans le template
genererBulletinPdf(eleve: Eleve) { }

private genererBulletinPdf(eleve: Eleve) { }  // ❌ ERREUR - private = inaccessible
```

### 3. DomSanitizer pour Iframe PDF
Pour afficher un PDF base64 dans un iframe :
```typescript
private sanitizer = inject(DomSanitizer);
pdfSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfDataUri);
```

### 4. Calcul de Position dans PDF jsPDF
Les positions sont en **millimètres** depuis le bord gauche de la page :
- marge = 10mm
- _positions = marge + somme(largeurs précédentes) + décalage_

### 5. Commit Git
Toujours vérifier le status avec `git status` avant de commiter. Les warnings LF/CRLF sont normaux sur Windows.

---

## 📋 Patterns Courants

### Popup avec Panneau Latéral (2 colonnes)
```scss
.modal-body {
    display: grid;
    grid-template-columns: 320px 1fr;  // Sidebar | Main
}
```

### Bouton Conditionnel dans Template
```html
@if (condition) {
    <button>Clique</button>
}
```

### Gestion des Notes dans localStorage
- Clé : `notes_trimestre_{trimestreId}_{eleveId}`
- Format : JSON array de NoteTrimestre

---

## 📝 Conventions de Code

1. **Commentaires en français** - Le code doit être documenté en français
2. **Méthodes privées** - Mettre `private` devant les méthodes helper
3. **Interfaces** - Définir les interfaces TypeScript en haut du fichier
4. **Styles** - Utiliser les variables CSS existantes (ex: `--color-primary`)

---

## 🔗 Références Existantes

- README.md - Vue d'ensemble du projet
- ARCHITECTURE.md - Détails de l'architecture
- QUICKSTART.md - Guide de démarrage rapide