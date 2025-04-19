const express = require('express');
const router = express.Router();

const { getSupabase } = require('../utils/supabase');
const { logger } = require('../utils/logger');
const { verifyWordPressCredentials } = require('../services/wordpressService');

// Import the centralized authentication middleware
const { authenticateToken } = require('../middleware/auth');

// Get all WordPress sites for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('wordpress_sites')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Don't return application_password in the response
    const sanitizedData = data.map(site => ({
      ...site,
      application_password: '********' // Mask the password
    }));
    
    res.json(sanitizedData || []);
  } catch (error) {
    logger.error(`Error fetching WordPress sites for project ${req.params.projectId}:`, error);
    res.status(500).json({ message: 'Error fetching WordPress sites' });
  }
});

// Verify WordPress credentials
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { url, username, application_password } = req.body;
    
    if (!url || !username || !application_password) {
      return res.status(400).json({ message: 'URL, username, and application password are required' });
    }
    
    const isValid = await verifyWordPressCredentials({
      url,
      username,
      application_password
    });
    
    res.json({
      valid: isValid,
      message: isValid ? 'WordPress credentials are valid' : 'Invalid WordPress credentials'
    });
  } catch (error) {
    logger.error('Error verifying WordPress credentials:', error);
    res.status(500).json({ message: 'Error verifying WordPress credentials' });
  }
});

// Add a WordPress site to a project
router.post('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { url, username, application_password } = req.body;
    
    if (!url || !username || !application_password) {
      return res.status(400).json({ message: 'URL, username, and application password are required' });
    }
    
    // Verify credentials before adding
    const isValid = await verifyWordPressCredentials({
      url,
      username,
      application_password
    });
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid WordPress credentials' });
    }
    
    const supabase = getSupabase();
    
    // Check if site already exists for this project
    const { data: existingSite } = await supabase
      .from('wordpress_sites')
      .select('*')
      .eq('project_id', projectId)
      .eq('url', url)
      .single();
    
    if (existingSite) {
      return res.status(400).json({ message: 'This WordPress site is already added to the project' });
    }
    
    // Add site to database
    const { data, error } = await supabase
      .from('wordpress_sites')
      .insert({
        project_id: projectId,
        url,
        username,
        application_password
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Don't return application_password in the response
    const sanitizedData = {
      ...data,
      application_password: '********' // Mask the password
    };
    
    res.status(201).json(sanitizedData);
  } catch (error) {
    logger.error(`Error adding WordPress site to project ${req.params.projectId}:`, error);
    res.status(500).json({ message: 'Error adding WordPress site' });
  }
});

// Update a WordPress site
router.put('/:siteId', authenticateToken, async (req, res) => {
  try {
    const { siteId } = req.params;
    const { url, username, application_password } = req.body;
    
    if (!url || !username) {
      return res.status(400).json({ message: 'URL and username are required' });
    }
    
    const supabase = getSupabase();
    
    // If application_password is provided, verify credentials
    if (application_password) {
      const isValid = await verifyWordPressCredentials({
        url,
        username,
        application_password
      });
      
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid WordPress credentials' });
      }
    }
    
    // Get current site to determine if password is being updated
    const { data: currentSite } = await supabase
      .from('wordpress_sites')
      .select('application_password')
      .eq('id', siteId)
      .single();
    
    if (!currentSite) {
      return res.status(404).json({ message: 'WordPress site not found' });
    }
    
    // Update site in database
    const updateData = {
      url,
      username,
      updated_at: new Date()
    };
    
    // Only update password if provided
    if (application_password) {
      updateData.application_password = application_password;
    }
    
    const { data, error } = await supabase
      .from('wordpress_sites')
      .update(updateData)
      .eq('id', siteId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Don't return application_password in the response
    const sanitizedData = {
      ...data,
      application_password: '********' // Mask the password
    };
    
    res.json(sanitizedData);
  } catch (error) {
    logger.error(`Error updating WordPress site ${req.params.siteId}:`, error);
    res.status(500).json({ message: 'Error updating WordPress site' });
  }
});

// Delete a WordPress site
router.delete('/:siteId', authenticateToken, async (req, res) => {
  try {
    const { siteId } = req.params;
    const supabase = getSupabase();
    
    const { error } = await supabase
      .from('wordpress_sites')
      .delete()
      .eq('id', siteId);
    
    if (error) throw error;
    
    res.json({ message: 'WordPress site deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting WordPress site ${req.params.siteId}:`, error);
    res.status(500).json({ message: 'Error deleting WordPress site' });
  }
});

module.exports = router;
