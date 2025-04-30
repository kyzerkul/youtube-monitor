const { createClient } = require('@supabase/supabase-js');
const { logger } = require('./logger');

let supabase = null;

// Check if DEV_MODE is enabled via environment variable
const DEV_MODE_ENABLED = process.env.DEV_MODE === 'true' || process.env.NODE_ENV === 'development';

/**
 * Set up and initialize the Supabase client
 * @returns {Object} The Supabase client instance
 */
const setupSupabase = () => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or key is missing from environment variables');
    }
    
    // En mode développement, on utilise la clé de service qui bypasse les politiques RLS
    if (DEV_MODE_ENABLED) {
      logger.info('DEV MODE: Using Supabase service role key (bypassing RLS)');
      // La clé actuelle est déjà celle du service role, mais on le mentionne explicitement
      supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false
        }
      });
    } else {
      supabase = createClient(supabaseUrl, supabaseKey);
    }
    logger.info('Supabase client initialized successfully');
    
    return supabase;
  } catch (error) {
    logger.error('Error initializing Supabase client:', error);
    throw error;
  }
};

/**
 * Get the Supabase client instance
 * @returns {Object} The Supabase client instance
 */
const getSupabase = () => {
  if (!supabase) {
    return setupSupabase();
  }
  return supabase;
};

/**
 * SQL commands to set up the database schema
 */
const setupDatabaseSchema = async () => {
  const client = getSupabase();
  
  try {
    logger.info('Setting up database schema...');
    
    // Clear existing tables if needed
    await client.rpc('clear_existing_tables', {});
    
    // Create new tables
    await client.rpc('create_schema_tables', {});
    
    logger.info('Database schema setup completed successfully');
    
    return true;
  } catch (error) {
    logger.error('Error setting up database schema:', error);
    throw error;
  }
};

module.exports = {
  setupSupabase,
  getSupabase,
  setupDatabaseSchema
};
