const { runMonitoringNow } = require('../services/cronService');
const { logger } = require('../utils/logger');
const { getSupabase } = require('../utils/supabase');

/**
 * Contrôleur pour les fonctionnalités de monitoring
 */

/**
 * Déclencher un monitoring immédiat
 * @param {Object} req - Requête HTTP
 * @param {Object} res - Réponse HTTP
 */
const triggerMonitoring = async (req, res) => {
  try {
    logger.info('Déclenchement manuel du monitoring');
    
    // Démarrer le monitoring en arrière-plan
    // Utiliser un setTimeout de 0 pour ne pas bloquer la réponse HTTP
    setTimeout(async () => {
      try {
        await runMonitoringNow();
      } catch (error) {
        logger.error('Erreur lors du monitoring en arrière-plan:', error);
      }
    }, 0);
    
    // Répondre immédiatement que le monitoring a été lancé
    res.status(200).json({
      success: true,
      message: 'Monitoring lancé en arrière-plan'
    });
  } catch (error) {
    logger.error('Erreur lors du déclenchement du monitoring:', error);
    res.status(500).json({
      success: false,
      message: `Erreur: ${error.message}`
    });
  }
};

/**
 * Obtenir les logs de monitoring récents
 * @param {Object} req - Requête HTTP
 * @param {Object} res - Réponse HTTP
 */
const getMonitoringLogs = async (req, res) => {
  try {
    // NOTE: Temporairement désactivé jusqu'à la création de la table monitoring_logs
    // const { db } = req;
    
    // // Récupérer les 20 derniers logs de monitoring
    // const { data, error } = await db
    //   .from('monitoring_logs')
    //   .select('*')
    //   .order('timestamp', { ascending: false })
    //   .limit(20);
    
    // if (error) {
    //   throw error;
    // }
    
    res.status(200).json({
      success: true,
      message: "La fonctionnalité de logs sera disponible après création de la table 'monitoring_logs'",
      data: []
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des logs de monitoring:', error);
    res.status(500).json({
      success: false,
      message: `Erreur: ${error.message}`
    });
  }
};

module.exports = {
  triggerMonitoring,
  getMonitoringLogs
};
