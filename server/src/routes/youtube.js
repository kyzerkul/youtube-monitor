const express = require('express');
const router = express.Router();

const { getSupabase } = require('../utils/supabase');
const { logger } = require('../utils/logger');
const { fetchYouTubeRssFeed, checkForNewVideos } = require('../services/youtubeService');

// Import the centralized authentication middleware
const { authenticateToken } = require('../middleware/auth');

// Get all YouTube channels for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('youtube_channels')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data || []);
  } catch (error) {
    logger.error(`Error fetching YouTube channels for project ${req.params.projectId}:`, error);
    res.status(500).json({ message: 'Error fetching YouTube channels' });
  }
});

// Validate a YouTube channel ID
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.body;
    
    if (!channelId) {
      return res.status(400).json({ message: 'Channel ID is required' });
    }
    
    try {
      // Try to fetch RSS feed for this channel
      const feedItems = await fetchYouTubeRssFeed(channelId);
      
      if (feedItems && feedItems.length > 0) {
        // Extract channel name from feed
        const channelName = feedItems[0].author || 'Unknown Channel';
        
        res.json({
          valid: true,
          channelId,
          channelName,
          videoCount: feedItems.length
        });
      } else {
        res.json({
          valid: false,
          message: 'No videos found for this channel'
        });
      }
    } catch (error) {
      res.json({
        valid: false,
        message: 'Invalid channel ID'
      });
    }
  } catch (error) {
    logger.error('Error validating YouTube channel:', error);
    res.status(500).json({ message: 'Error validating YouTube channel' });
  }
});

// Add a YouTube channel to a project
router.post('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { channelId, channelName } = req.body;
    
    if (!channelId || !channelName) {
      return res.status(400).json({ message: 'Channel ID and name are required' });
    }
    
    const supabase = getSupabase();
    
    // Check if channel already exists for this project
    const { data: existingChannel } = await supabase
      .from('youtube_channels')
      .select('*')
      .eq('project_id', projectId)
      .eq('channel_id', channelId)
      .single();
    
    if (existingChannel) {
      return res.status(400).json({ message: 'This channel is already added to the project' });
    }
    
    // Create RSS URL
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    
    // Add channel to database
    const { data, error } = await supabase
      .from('youtube_channels')
      .insert({
        project_id: projectId,
        channel_id: channelId,
        channel_name: channelName,
        rss_url: rssUrl
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json(data);
  } catch (error) {
    logger.error(`Error adding YouTube channel to project ${req.params.projectId}:`, error);
    res.status(500).json({ message: 'Error adding YouTube channel' });
  }
});

// Delete a YouTube channel from a project
router.delete('/:channelId', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const supabase = getSupabase();
    
    const { error } = await supabase
      .from('youtube_channels')
      .delete()
      .eq('id', channelId);
    
    if (error) throw error;
    
    res.json({ message: 'YouTube channel deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting YouTube channel ${req.params.channelId}:`, error);
    res.status(500).json({ message: 'Error deleting YouTube channel' });
  }
});

// Manually check for new videos for a specific channel
router.post('/:channelId/check', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const supabase = getSupabase();
    
    // Get channel info
    const { data: channel, error } = await supabase
      .from('youtube_channels')
      .select('*')
      .eq('id', channelId)
      .single();
    
    if (error || !channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    
    // Process videos for this channel
    const newVideos = await processChannelVideos(channel);
    
    res.json({
      message: `Found ${newVideos.length} new videos`,
      videoIds: newVideos
    });
  } catch (error) {
    logger.error(`Error checking for new videos for channel ${req.params.channelId}:`, error);
    res.status(500).json({ message: 'Error checking for new videos' });
  }
});

// Route to manually trigger video monitoring for all channels
router.post('/check-all-channels', authenticateToken, async (req, res) => {
  try {
    logger.info('Manually triggered check for new videos on all channels');
    
    // Run the check for new videos process
    const newVideoIds = await checkForNewVideos();
    
    res.json({
      message: 'Check for new videos completed successfully',
      newVideosCount: newVideoIds.length,
      newVideoIds
    });
  } catch (error) {
    logger.error('Error checking for new videos:', error);
    res.status(500).json({ message: 'Error checking for new videos', error: error.message });
  }
});

module.exports = router;
