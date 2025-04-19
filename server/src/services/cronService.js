const cron = require('node-cron');
const { getSupabase } = require('../utils/supabase');
const { logger } = require('../utils/logger');
const { checkForNewVideos } = require('./youtubeService');

/**
 * Service de gestion des tâches planifiées pour le monitoring automatique
 */

// Tâche planifiée toutes les 6 heures
let scheduledTask = null;

/**
 * Initialiser les tâches planifiées au démarrage du serveur
 */
const initScheduledTasks = () => {
  // Toutes les 6 heures (0 */6 * * *)
  scheduledTask = cron.schedule('0 */6 * * *', async () => {
    logger.info('Exécution du monitoring automatique planifié');
    try {
      // Version simplifiée pour démarrage : utilise la fonction existante
      await checkForNewVideos();
      logger.info('Monitoring automatique exécuté avec succès');
    } catch (error) {
      logger.error('Erreur lors du monitoring automatique planifié:', error);
    }
  });
  
  logger.info('Tâches planifiées initialisées. Prochain monitoring dans 6 heures.');
};

/**
 * Arrêter les tâches planifiées lors de l'arrêt du serveur
 */
const stopScheduledTasks = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    logger.info('Tâches planifiées arrêtées');
  }
};

/**
 * Exécution immédiate du monitoring (pour tests ou déclenchement manuel)
 * Version simplifiée pour démarrer le serveur sans erreur
 */
const runMonitoringNow = async () => {
  logger.info('Exécution immédiate du monitoring automatique (manuel)');
  try {
    await checkForNewVideos();
    return { success: true, message: 'Monitoring exécuté avec succès' };
  } catch (error) {
    logger.error('Erreur lors du monitoring manuel:', error);
    return { success: false, message: error.message };
  }
};

// Version simplifiée pour permettre au serveur de démarrer
const runAutoMonitoring = async () => {
  return await checkForNewVideos();
};

module.exports = {
  initScheduledTasks,
  stopScheduledTasks,
  runMonitoringNow,
  runAutoMonitoring
};
