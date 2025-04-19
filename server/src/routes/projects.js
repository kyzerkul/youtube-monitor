const express = require('express');
const router = express.Router();
const { getSupabase } = require('../utils/supabase');
const { logger } = require('../utils/logger');

// Import the centralized authentication middleware
const { authenticateToken } = require('../middleware/auth');

// Get all projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    logger.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects' });
  }
});

// Get a single project with related data
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();
    
    // Get project
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Get WordPress sites for this project
    const { data: wordpressSites } = await supabase
      .from('wordpress_sites')
      .select('*')
      .eq('project_id', id);
    
    // Get YouTube channels for this project
    const { data: youtubeChannels } = await supabase
      .from('youtube_channels')
      .select('*')
      .eq('project_id', id);
    
    // Get LLM settings for this project
    const { data: llmSettings } = await supabase
      .from('llm_settings')
      .select('*')
      .eq('project_id', id);
    
    res.json({
      ...project,
      wordpressSites: wordpressSites || [],
      youtubeChannels: youtubeChannels || [],
      llmSettings: llmSettings || []
    });
  } catch (error) {
    logger.error(`Error fetching project ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching project' });
  }
});

// Create a new project
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }
    
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name,
        description: description || ''
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error creating project:', error);
    res.status(500).json({ message: 'Error creating project' });
  }
});

// Update a project
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }
    
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('projects')
      .update({
        name,
        description: description || '',
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    logger.error(`Error updating project ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error updating project' });
  }
});

// Delete a project
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting project ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error deleting project' });
  }
});

module.exports = router;
