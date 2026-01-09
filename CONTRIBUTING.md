# 🤝 Guide de Contribution - QuantumCraft

Merci de votre intérêt pour contribuer à QuantumCraft ! 

## 📋 Table des Matières

- [Code de Conduite](#code-de-conduite)
- [Comment contribuer](#comment-contribuer)
- [Style de Code](#style-de-code)
- [Process de Pull Request](#process-de-pull-request)
- [Signaler des Bugs](#signaler-des-bugs)
- [Proposer des Fonctionnalités](#proposer-des-fonctionnalités)

---

## Code de Conduite

### Notre Engagement

Nous nous engageons à rendre la participation à ce projet une expérience sans harcèlement pour tous, indépendamment de l'âge, de la taille, du handicap, de l'origine ethnique, de l'identité et de l'expression de genre, du niveau d'expérience, de la nationalité, de l'apparence personnelle, de la race, de la religion ou de l'identité et de l'orientation sexuelles.

### Comportements Attendus

- ✅ Utiliser un langage accueillant et inclusif
- ✅ Respecter les différents points de vue
- ✅ Accepter les critiques constructives
- ✅ Se concentrer sur ce qui est le mieux pour la communauté

---

## Comment contribuer

### 1. Fork le Projet

```bash
# Via GitHub UI ou CLI
gh repo fork quantumcraft/launcher
```

### 2. Cloner votre Fork

```bash
git clone https://github.com/VOTRE-USERNAME/launcher.git
cd launcher
```

### 3. Créer une Branche

```bash
# Feature
git checkout -b feature/ma-nouvelle-fonctionnalite

# Bug fix
git checkout -b fix/correction-bug-xyz

# Documentation
git checkout -b docs/amelioration-readme
```

### 4. Installer les Dépendances

```bash
npm install
```

### 5. Développer

Faites vos modifications en respectant le [style de code](#style-de-code).

### 6. Tester

```bash
# Lancer le launcher
npm start

# Vérifier les erreurs
npm run lint
```

### 7. Commit

```bash
# Staging
git add .

# Commit avec message descriptif
git commit -m "feat: ajout support multi-versions"

# Ou pour un fix
git commit -m "fix: correction erreur auth Microsoft"
```

**Convention des messages de commit :**
- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage, missing semi colons, etc
- `refactor:` Refactoring du code
- `test:` Ajout de tests
- `chore:` Maintenance

### 8. Push

```bash
git push origin feature/ma-nouvelle-fonctionnalite
```

### 9. Pull Request

Créez une PR sur GitHub avec :
- Titre descriptif
- Description détaillée des changements
- Screenshots si applicable
- Référence aux issues liées

---

## Style de Code

### JavaScript

Nous utilisons ESLint avec la config fournie (`.eslintrc.js`).

**Règles principales :**
```javascript
// ✅ Bon
const userName = 'Steve';
const config = await getConfig();

function launchGame(options) {
    if (!options.version) {
        throw new Error('Version requise');
    }
    // ...
}

// ❌ Mauvais
var userName="Steve"
const config=await getConfig()

function launchGame(options){
if(!options.version){
throw new Error("Version requise")
}
}
```

### HTML

```html
<!-- ✅ Bon -->
<div class="container">
    <h1>Titre</h1>
    <p class="description">Description</p>
</div>

<!-- ❌ Mauvais -->
<div class=container><h1>Titre</h1><p class=description>Description</p></div>
```

### CSS

```css
/* ✅ Bon */
.button {
    padding: 10px 20px;
    background: linear-gradient(135deg, #00d4ff 0%, #0066ff 100%);
    border-radius: 8px;
}

/* ❌ Mauvais */
.button{padding:10px 20px;background:linear-gradient(135deg,#00d4ff 0%,#0066ff 100%);border-radius:8px;}
```

### Commentaires

```javascript
/**
 * Fonction principale de lancement
 * @param {Object} options - Options de lancement
 * @param {string} options.version - Version de Minecraft
 * @param {number} options.ram - RAM en Mo
 * @returns {Promise<Object>} Résultat du lancement
 */
async function launchGame(options) {
    // Validation des paramètres
    if (!options.version) {
        throw new Error('Version requise');
    }

    // Lancement
    return await launcher.start(options);
}
```

---

## Process de Pull Request

### Checklist avant PR

- [ ] Le code compile sans erreurs
- [ ] Le launcher se lance correctement
- [ ] Les fonctionnalités ajoutées fonctionnent
- [ ] Le code suit le style guide
- [ ] Les commentaires sont clairs
- [ ] La documentation est mise à jour si nécessaire
- [ ] Pas de console.log de debug oubliés
- [ ] Les fichiers sensibles ne sont pas commités

### Review Process

1. **Soumission** : Vous créez la PR
2. **Review automatique** : Les checks s'exécutent
3. **Review manuelle** : Un maintainer examine le code
4. **Feedback** : Discussions et demandes de modifications
5. **Approbation** : La PR est approuvée
6. **Merge** : Intégration dans main

### Après le Merge

Votre contribution sera incluse dans la prochaine release ! 🎉

---

## Signaler des Bugs

### Template de Bug Report

```markdown
**Description du bug**
Description claire du problème.

**Étapes pour reproduire**
1. Lancer le launcher
2. Cliquer sur '...'
3. Observer l'erreur

**Comportement attendu**
Ce qui devrait se passer normalement.

**Screenshots**
Si applicable, ajoutez des captures d'écran.

**Environnement**
- OS: [Windows 10/11]
- Version du launcher: [1.0.0]
- Version de Node.js: [18.x]

**Logs**
```
Collez ici les logs de %appdata%\.quantumcraft\logs\launcher.log
```

**Informations additionnelles**
Tout autre contexte utile.
```

---

## Proposer des Fonctionnalités

### Template de Feature Request

```markdown
**La fonctionnalité**
Description claire de ce que vous proposez.

**Problème résolu**
Quel problème cette fonctionnalité résout-elle ?

**Solution proposée**
Comment imaginez-vous l'implémentation ?

**Alternatives considérées**
Avez-vous pensé à d'autres approches ?

**Contexte additionnel**
Screenshots, mockups, exemples...
```

---

## Domaines d'Aide

Nous cherchons de l'aide sur :

### 🎨 Design
- Amélioration de l'UI/UX
- Création d'icônes et assets
- Animations

### 💻 Développement
- Support multi-versions Minecraft
- Gestion des mods (Forge/Fabric)
- Optimisations performance
- Tests automatisés

### 📝 Documentation
- Traductions
- Tutoriels vidéo
- Guides d'utilisation

### 🐛 Testing
- Tests sur différentes configurations
- Rapports de bugs détaillés
- Suggestions d'améliorations

---

## Questions ?

Si vous avez des questions :
- 💬 Ouvrez une Discussion sur GitHub
- 📧 Contactez l'équipe
- 📖 Consultez la [documentation](DOCUMENTATION.md)

---

**Merci de contribuer à QuantumCraft ! 🚀**
