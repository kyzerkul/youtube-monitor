const express = require('express');
const router = express.Router();
const { triggerMonitoring, getMonitoringLogs } = require('../controllers/monitoringController');
const { authenticateToken } = require('../middleware/auth');

/**
 * Routes pour le monitoring automatique
 */

// Route pour déclencher un monitoring immédiat
router.post('/trigger', authenticateToken, triggerMonitoring);

// Route pour récupérer les logs de monitoring récents
router.get('/logs', authenticateToken, getMonitoringLogs);

module.exports = router;
