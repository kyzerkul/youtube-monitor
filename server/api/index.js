// Fichier de point d'entrée pour Vercel Serverless Functions
// Il importe simplement notre application Express et l'exporte en tant que gestionnaire serverless

const app = require('../src/index');

module.exports = app;
