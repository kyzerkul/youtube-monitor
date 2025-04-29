# Déploiement direct sur Render

Ce dossier contient les fichiers pour un déploiement statique simple sur Render comme solution de contournement aux problèmes de Content Security Policy (CSP).

## Instructions de déploiement manuel sur Render

### 1. Backend (API)

1. Dans le dashboard Render, sélectionnez "New Web Service"
2. Connectez votre dépôt GitHub
3. Configurez comme suit:
   - **Name**: `youtube-monitor-api`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node src/index.js`
   - **Plan**: Free

4. Dans "Environment Variables", ajoutez:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `JWT_SECRET`: [Votre secret JWT]
   - `SUPABASE_URL`: [Votre URL Supabase]
   - `SUPABASE_KEY`: [Votre clé Supabase]
   - `MISTRAL_API_KEY`: [Votre clé API Mistral]

5. Cliquez sur "Create Web Service"

### 2. Frontend (React)

Pour éviter totalement les problèmes CSP sur Render, voici deux options:

#### Option 1: Déployer le frontend React séparément (Vercel, Netlify, etc.)

1. Accédez à Vercel ou Netlify
2. Importez le code depuis GitHub
3. Configurez le répertoire racine sur `client`
4. Ajoutez la variable d'environnement `REACT_APP_API_URL` avec l'URL de votre API Render

#### Option 2: Déployer le site statique simple de redirection

1. Dans le dashboard Render, sélectionnez "Static Site"
2. Connectez votre dépôt GitHub 
3. Configurez comme suit:
   - **Name**: `youtube-monitor`
   - **Build Command**: `echo "Skipping build"`
   - **Publish Directory**: `render-static`

4. Cliquez sur "Create Static Site"

Cette page statique fonctionnera comme une solution temporaire pendant que vous travaillez sur une solution définitive pour le frontend.
