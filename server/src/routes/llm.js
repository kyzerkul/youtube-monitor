const express = require('express');
const router = express.Router();
const { getSupabase } = require('../utils/supabase');
const { logger } = require('../utils/logger');
const { verifyAPIKey } = require('../services/llmService');

// Import the centralized authentication middleware
const { authenticateToken } = require('../middleware/auth');



// Get LLM settings for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('llm_settings')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // Not found error
      throw error;
    }
    
    // If no settings found, return default settings
    if (!data) {
      return res.json({
        project_id: projectId,
        provider: 'mistral',
        model_name: 'mistral-large-latest',
        api_key: null
      });
    }
    
    // Don't return API key in the response
    const sanitizedData = {
      ...data,
      api_key: data.api_key ? '********' : null // Mask the API key
    };
    
    res.json(sanitizedData);
  } catch (error) {
    logger.error(`Error fetching LLM settings for project ${req.params.projectId}:`, error);
    res.status(500).json({ message: 'Error fetching LLM settings' });
  }
});

// Update or create LLM settings for a project
router.put('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { provider, model_name, api_key } = req.body;
    
    if (!provider || !model_name) {
      return res.status(400).json({ message: 'Provider and model name are required' });
    }
    
    const supabase = getSupabase();
    
    // Check if settings already exist
    const { data: existingSettings } = await supabase
      .from('llm_settings')
      .select('id, api_key')
      .eq('project_id', projectId)
      .single();
    
    let result;
    
    if (existingSettings) {
      // Prepare update data
      const updateData = {
        provider,
        model_name,
        updated_at: new Date()
      };
      
      // Only update API key if provided
      if (api_key) {
        updateData.api_key = api_key;
      }
      
      // Update existing settings
      const { data, error } = await supabase
        .from('llm_settings')
        .update(updateData)
        .eq('id', existingSettings.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('llm_settings')
        .insert({
          project_id: projectId,
          provider,
          model_name,
          api_key: api_key || null
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    // Don't return API key in the response
    const sanitizedData = {
      ...result,
      api_key: result.api_key ? '********' : null // Mask the API key
    };
    
    res.json(sanitizedData);
  } catch (error) {
    logger.error(`Error updating LLM settings for project ${req.params.projectId}:`, error);
    res.status(500).json({ message: 'Error updating LLM settings' });
  }
});

// Verify LLM API key
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { provider, api_key } = req.body;
    
    if (!provider || !api_key) {
      return res.status(400).json({ message: 'Provider and API key are required' });
    }
    
    let isValid = false;
    let message = '';
    
    // Verify the API key based on provider
    switch (provider.toLowerCase()) {
      case 'mistral':
        try {
          const axios = require('axios');
          const response = await axios.get('https://api.mistral.ai/v1/models', {
            headers: {
              'Authorization': `Bearer ${api_key}`
            }
          });
          isValid = response.status === 200;
          message = isValid ? 'Mistral API key is valid' : 'Invalid Mistral API key';
        } catch (error) {
          isValid = false;
          message = 'Invalid Mistral API key';
        }
        break;
        
      case 'openai':
        try {
          const axios = require('axios');
          const response = await axios.get('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${api_key}`
            }
          });
          isValid = response.status === 200;
          message = isValid ? 'OpenAI API key is valid' : 'Invalid OpenAI API key';
        } catch (error) {
          isValid = false;
          message = 'Invalid OpenAI API key';
        }
        break;
        
      case 'anthropic':
        try {
          const axios = require('axios');
          const response = await axios.get('https://api.anthropic.com/v1/models', {
            headers: {
              'x-api-key': api_key
            }
          });
          isValid = response.status === 200;
          message = isValid ? 'Anthropic API key is valid' : 'Invalid Anthropic API key';
        } catch (error) {
          isValid = false;
          message = 'Invalid Anthropic API key';
        }
        break;
        
      default:
        isValid = false;
        message = `Unsupported provider: ${provider}`;
    }
    
    res.json({
      valid: isValid,
      message
    });
  } catch (error) {
    logger.error('Error verifying LLM API key:', error);
    res.status(500).json({ message: 'Error verifying LLM API key' });
  }
});

module.exports = router;
