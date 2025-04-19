const express = require('express');
const router = express.Router();
const { getSupabase } = require('../utils/supabase');
const { logger } = require('../utils/logger');
const { generateArticle } = require('../services/llmService');
const { publishArticleToWordPress } = require('../services/wordpressService');

// Import the centralized authentication middleware
const { authenticateToken } = require('../middleware/auth');

// Get all articles for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('articles')
      .select(`
        *,
        videos(
          *,
          youtube_channels(
            *,
            projects(*)
          )
        )
      `)
      .eq('videos.youtube_channels.project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data || []);
  } catch (error) {
    logger.error(`Error fetching articles for project ${req.params.projectId}:`, error);
    res.status(500).json({ message: 'Error fetching articles' });
  }
});

// Get a single article
router.get('/:articleId', authenticateToken, async (req, res) => {
  try {
    const { articleId } = req.params;
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('articles')
      .select(`
        *,
        videos(
          *,
          youtube_channels(
            *,
            projects(*)
          )
        )
      `)
      .eq('id', articleId)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    res.json(data);
  } catch (error) {
    logger.error(`Error fetching article ${req.params.articleId}:`, error);
    res.status(500).json({ message: 'Error fetching article' });
  }
});

// Update an article
router.put('/:articleId', authenticateToken, async (req, res) => {
  try {
    const { articleId } = req.params;
    const { title, content, language } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('articles')
      .update({
        title,
        content,
        language: language || 'en',
        updated_at: new Date()
      })
      .eq('id', articleId)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    logger.error(`Error updating article ${req.params.articleId}:`, error);
    res.status(500).json({ message: 'Error updating article' });
  }
});

// Regenerate an article
router.post('/:videoId/regenerate', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    const { language } = req.body;
    const supabase = getSupabase();
    
    // Get video with transcript
    const { data: video, error } = await supabase
      .from('videos')
      .select(`
        *,
        youtube_channels(
          *,
          projects(*)
        )
      `)
      .eq('id', videoId)
      .single();
    
    if (error || !video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    if (!video.transcript) {
      return res.status(400).json({ message: 'Video has no transcript' });
    }
    
    // Get LLM settings for this project
    const { data: llmSettings } = await supabase
      .from('llm_settings')
      .select('*')
      .eq('project_id', video.youtube_channels.project_id)
      .single();
    
    // Generate new article
    const article = await generateArticle({
      video,
      transcript: video.transcript,
      settings: llmSettings,
      language: language || 'en'
    });
    
    // Check if article already exists for this video
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('*')
      .eq('video_id', videoId)
      .eq('language', language || 'en')
      .single();
    
    let savedArticle;
    
    if (existingArticle) {
      // Update existing article
      const { data, error: updateError } = await supabase
        .from('articles')
        .update({
          title: article.title,
          content: article.content,
          updated_at: new Date()
        })
        .eq('id', existingArticle.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      savedArticle = data;
    } else {
      // Create new article
      const { data, error: insertError } = await supabase
        .from('articles')
        .insert({
          video_id: videoId,
          title: article.title,
          content: article.content,
          language: language || 'en',
          published: false
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      savedArticle = data;
    }
    
    res.json(savedArticle);
  } catch (error) {
    logger.error(`Error regenerating article for video ${req.params.videoId}:`, error);
    res.status(500).json({ message: 'Error regenerating article' });
  }
});

// Publish an article to WordPress
router.post('/:articleId/publish', authenticateToken, async (req, res) => {
  try {
    const { articleId } = req.params;
    
    // Publish article to WordPress
    const result = await publishArticleToWordPress(articleId);
    
    res.json(result);
  } catch (error) {
    logger.error(`Error publishing article ${req.params.articleId}:`, error);
    res.status(500).json({ message: 'Error publishing article to WordPress' });
  }
});

// Delete an article
router.delete('/:articleId', authenticateToken, async (req, res) => {
  try {
    const { articleId } = req.params;
    const supabase = getSupabase();
    
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', articleId);
    
    if (error) throw error;
    
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting article ${req.params.articleId}:`, error);
    res.status(500).json({ message: 'Error deleting article' });
  }
});

module.exports = router;
