const fs = require('fs');
const path = require('path');

// Script exécuté après le build pour ajouter les configurations spécifiques à Render
console.log('Configuration post-build pour Render...');

// Création du fichier headers.json pour configurer les en-têtes HTTP
const headersConfig = {
  "/**/*.html": {
    "Cache-Control": "public, max-age=0, must-revalidate",
    "Content-Security-Policy": "default-src * 'self' data: 'unsafe-inline' 'unsafe-eval'; script-src * 'self' 'unsafe-inline' 'unsafe-eval'; connect-src * 'self' data:; img-src * 'self' data:; style-src * 'self' 'unsafe-inline'; font-src * 'self' data:; frame-src *;",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
  },
  "/**": {
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Security-Policy": "default-src * 'self' data: 'unsafe-inline' 'unsafe-eval'; script-src * 'self' 'unsafe-inline' 'unsafe-eval'; connect-src * 'self' data:; img-src * 'self' data:; style-src * 'self' 'unsafe-inline'; font-src * 'self' data:; frame-src *;",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  }
};

// Écriture du fichier de configuration des en-têtes
fs.writeFileSync(
  path.join(__dirname, 'build', 'headers.json'),
  JSON.stringify(headersConfig, null, 2)
);

// Création du fichier _headers pour une compatibilité maximale
const headersContent = `/*
  Content-Security-Policy: default-src * 'self' data: 'unsafe-inline' 'unsafe-eval'; script-src * 'self' 'unsafe-inline' 'unsafe-eval'; connect-src * 'self' data:; img-src * 'self' data:; style-src * 'self' 'unsafe-inline'; font-src * 'self' data:; frame-src *;
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Cache-Control: public, max-age=31536000, immutable
`;

fs.writeFileSync(
  path.join(__dirname, 'build', '_headers'),
  headersContent
);

console.log('Configuration post-build terminée!');
