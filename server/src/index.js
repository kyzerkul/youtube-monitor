const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { logger } = require('./utils/logger');
const { setupSupabase } = require('./utils/supabase');
const { initScheduledTasks, stopScheduledTasks } = require('./services/cronService');

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const wordpressRoutes = require('./routes/wordpress');
const youtubeRoutes = require('./routes/youtube');
const videosRoutes = require('./routes/videos');
const articlesRoutes = require('./routes/articles');
const llmRoutes = require('./routes/llm');
const monitoringRoutes = require('./routes/monitoringRoutes');

// Import services
const { checkForNewVideos } = require('./services/youtubeService');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Permettre les requêtes avec un origin null (en dev local) ou toutes les requêtes Render
    const allowedOrigins = [
      'https://youtube-monitor-client.onrender.com',
      'https://youtube-monitor-ccmn.onrender.com',
      'http://localhost:3000'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      logger.warn(`Origin bloqué : ${origin}`);
      callback(new Error(`Origin ${origin} non autorisé par CORS`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 heures
}));

// Configuration des en-têtes pour prévenir les problèmes CSP
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

app.use(express.json());

// Initialize Supabase
setupSupabase();

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Setup routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/wordpress', wordpressRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    message: 'An error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Initialiser les tâches planifiées pour le monitoring automatique
initScheduledTasks();

// Maintenir la tâche horaire originale pour la rétrocompatibilité
const hourlyTask = cron.schedule(process.env.CRON_SCHEDULE || '0 * * * *', async () => {
  logger.info('Running scheduled task: Checking for new videos');
  try {
    await checkForNewVideos();
    logger.info('Completed video check');
  } catch (error) {
    logger.error('Error in scheduled video check:', error);
  }
});

// Start the server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Monitoring automatique activé (vérification toutes les 6 heures)`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  // Arrêter les tâches planifiées
  stopScheduledTasks();
  hourlyTask.stop();
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  // Arrêter les tâches planifiées
  stopScheduledTasks();
  hourlyTask.stop();
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

module.exports = app;
