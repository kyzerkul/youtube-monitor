const express = require('express');
const router = express.Router();

const { getSupabase } = require('../utils/supabase');
const { logger } = require('../utils/logger');
const { processVideo } = require('../services/youtubeService');
const { getVideoTranscript } = require('../services/transcriptService');

// Import the centralized authentication middleware
const { authenticateToken } = require('../middleware/auth');

// Get all videos for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        youtube_channels(
          *,
          projects(*)
        )
      `)
      .eq('youtube_channels.project_id', projectId)
      .order('published_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data || []);
  } catch (error) {
    logger.error(`Error fetching videos for project ${req.params.projectId}:`, error);
    res.status(500).json({ message: 'Error fetching videos' });
  }
});

// Get all videos for a specific channel
router.get('/channel/:channelId', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('channel_id', channelId)
      .order('published_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data || []);
  } catch (error) {
    logger.error(`Error fetching videos for channel ${req.params.channelId}:`, error);
    res.status(500).json({ message: 'Error fetching videos' });
  }
});

// Get a single video with details
router.get('/:videoId', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        youtube_channels(
          *,
          projects(*)
        ),
        articles(*)
      `)
      .eq('id', videoId)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    res.json(data);
  } catch (error) {
    logger.error(`Error fetching video ${req.params.videoId}:`, error);
    res.status(500).json({ message: 'Error fetching video' });
  }
});

// Manually add a YouTube video
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { channelId, videoId, title, description } = req.body;
    
    if (!channelId || !videoId) {
      return res.status(400).json({ message: 'Channel ID and video ID are required' });
    }
    
    const supabase = getSupabase();
    
    // Check if video already exists
    const { data: existingVideo } = await supabase
      .from('videos')
      .select('*')
      .eq('video_id', videoId)
      .single();
    
    if (existingVideo) {
      return res.status(400).json({ message: 'This video is already in the database' });
    }
    
    // Add video to database
    const { data, error } = await supabase
      .from('videos')
      .insert({
        channel_id: channelId,
        video_id: videoId,
        title: title || 'Untitled Video',
        description: description || '',
        published_at: new Date(),
        processed: false
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error adding video:', error);
    res.status(500).json({ message: 'Error adding video' });
  }
});

// Process a video (fetch transcript, generate article)
router.post('/:videoId/process', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // Process video (fetch transcript, generate article)
    const result = await processVideo(videoId);
    
    res.json(result);
  } catch (error) {
    logger.error(`Error processing video ${req.params.videoId}:`, error);
    res.status(500).json({ message: 'Error processing video' });
  }
});

// Fetch transcript for a video
router.post('/:videoId/transcript', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    const supabase = getSupabase();
    
    // Get video
    const { data: video, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();
    
    if (error || !video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Fetch transcript
    const transcript = await getVideoTranscript(video.video_id);
    
    if (!transcript) {
      return res.status(404).json({ message: 'No transcript available for this video' });
    }
    
    // Update video with transcript
    await supabase
      .from('videos')
      .update({ transcript })
      .eq('id', videoId);
    
    res.json({
      videoId,
      transcript
    });
  } catch (error) {
    logger.error(`Error fetching transcript for video ${req.params.videoId}:`, error);
    res.status(500).json({ message: 'Error fetching transcript' });
  }
});

// Delete a video
router.delete('/:videoId', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    const supabase = getSupabase();
    
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId);
    
    if (error) throw error;
    
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting video ${req.params.videoId}:`, error);
    res.status(500).json({ message: 'Error deleting video' });
  }
});

module.exports = router;
