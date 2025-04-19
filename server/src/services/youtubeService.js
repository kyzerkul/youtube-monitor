const Parser = require('rss-parser');
const { getSupabase } = require('../utils/supabase');
const { logger } = require('../utils/logger');
const { getVideoTranscript } = require('./transcriptService');
const { generateArticle, getYouTubeThumbnailUrl } = require('./llmService');
const { publishArticleToWordPress } = require('./wordpressService');

const parser = new Parser({
  customFields: {
    item: [
      ['media:group', 'mediaGroup'],
      ['yt:videoId', 'videoId'],
      ['yt:channelId', 'channelId']
    ]
  }
});

/**
 * Fetch the RSS feed for a YouTube channel
 * @param {string} channelId - The YouTube channel ID
 * @returns {Promise<Array>} - Array of video items from the feed
 */
const fetchYouTubeRssFeed = async (channelId) => {
  try {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    logger.info(`Fetching RSS feed for channel: ${channelId}`);
    
    const feed = await parser.parseURL(feedUrl);
    logger.info(`Found ${feed.items.length} videos in feed for channel: ${channelId}`);
    
    return feed.items;
  } catch (error) {
    logger.error(`Error fetching RSS feed for channel ${channelId}:`, error);
    throw error;
  }
};

/**
 * Check if a video was published within the last 48 hours
 * @param {string} publishedDate - ISO date string of video publication
 * @returns {boolean} - True if video is within the time window
 */
const isWithinTimeWindow = (publishedDate) => {
  const videoDate = new Date(publishedDate);
  const now = new Date();
  const hoursDifference = (now - videoDate) / (1000 * 60 * 60);
  
  return hoursDifference <= 48;
};

/**
 * Process videos from a channel's RSS feed
 * @param {Object} channel - Channel information from database
 * @returns {Promise<Array>} - Array of processed video IDs
 */
const processChannelVideos = async (channel) => {
  const supabase = getSupabase();
  const processedVideos = [];
  
  try {
    // Fetch videos from RSS feed
    const videos = await fetchYouTubeRssFeed(channel.channel_id);
    
    for (const video of videos) {
      // Check if video is within the last 48 hours
      if (!isWithinTimeWindow(video.pubDate)) {
        continue;
      }
      
      // Check if video already exists in database
      const { data: existingVideo } = await supabase
        .from('videos')
        .select('*')
        .eq('video_id', video.videoId)
        .single();
      
      if (existingVideo) {
        logger.info(`Video ${video.videoId} already exists in database, skipping`);
        continue;
      }
      
      // Add new video to database
      const { data: newVideo, error } = await supabase
        .from('videos')
        .insert({
          channel_id: channel.id,
          title: video.title,
          description: video.content || '',
          video_id: video.videoId,
          published_at: video.pubDate,
          processed: false
        })
        .select()
        .single();
      
      if (error) {
        logger.error(`Error inserting video ${video.videoId}:`, error);
        continue;
      }
      
      logger.info(`Added new video to database: ${video.title} (${video.videoId})`);
      processedVideos.push(newVideo.id);
    }
    
    return processedVideos;
  } catch (error) {
    logger.error(`Error processing videos for channel ${channel.channel_id}:`, error);
    throw error;
  }
};

/**
 * Check for new videos across all tracked channels
 */
const checkForNewVideos = async () => {
  const supabase = getSupabase();
  
  try {
    // Get all channels
    const { data: channels, error } = await supabase
      .from('youtube_channels')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    logger.info(`Found ${channels.length} channels to check for new videos`);
    
    const newVideoIds = [];
    
    // Process each channel
    for (const channel of channels) {
      const channelVideos = await processChannelVideos(channel);
      newVideoIds.push(...channelVideos);
    }
    
    // Process each new video (get transcript, generate article)
    for (const videoId of newVideoIds) {
      await processVideo(videoId);
    }
    
    return newVideoIds;
  } catch (error) {
    logger.error('Error checking for new videos:', error);
    throw error;
  }
};

/**
 * Process a video: get transcript, generate article, and optionally publish
 * @param {string} videoId - The database ID of the video
 * @returns {Promise<Object>} - The processed article
 */
const processVideo = async (videoId) => {
  const supabase = getSupabase();
  
  try {
    // Get video details
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
    
    if (error) {
      throw error;
    }
    
    // Déterminer la langue du projet (fr/en)
    let language = 'en';
    if (video.youtube_channels && video.youtube_channels.projects && video.youtube_channels.projects.language) {
      language = video.youtube_channels.projects.language;
    } else if (video.language) {
      language = video.language;
    }

    // Get video transcript dans la bonne langue
    const transcript = await getVideoTranscript(video.video_id, language);

    // Update video with transcript
    await supabase
      .from('videos')
      .update({ transcript })
      .eq('id', videoId);

    // Get project LLM settings
    const { data: llmSettings } = await supabase
      .from('llm_settings')
      .select('*')
      .eq('project_id', video.youtube_channels.project_id)
      .single();

    // Get WordPress site for project
    const { data: wordpressSites } = await supabase
      .from('wordpress_sites')
      .select('*')
      .eq('project_id', video.youtube_channels.project_id);

    // Get YouTube video thumbnail URL
    const thumbnailUrl = getYouTubeThumbnailUrl(video.video_id);

    // Generate article with LLM dans la bonne langue
    const article = await generateArticle({
      video,
      transcript,
      settings: llmSettings,
      language: language,
      thumbnailUrl: thumbnailUrl
    });
    
    // Save article to database
    const { data: savedArticle, error: articleError } = await supabase
      .from('articles')
      .insert({
        video_id: video.id,
        title: article.title,
        content: article.content,
        language: language,
        published: false
      })
      .select()
      .single();
    
    if (articleError) {
      throw articleError;
    }
    
    // Mark video as processed
    await supabase
      .from('videos')
      .update({ processed: true })
      .eq('id', videoId);
    
    // Automatically publish to WordPress as draft if site exists
    if (wordpressSites && wordpressSites.length > 0) {
      try {
        logger.info(`Auto-publishing article to WordPress as draft for video ${video.title}`);
        const publishResult = await publishArticleToWordPress(savedArticle.id);
        logger.info(`Article published successfully as draft: ${publishResult.postUrl}`);
      } catch (publishError) {
        logger.error(`Error publishing article to WordPress for video ${videoId}:`, publishError);
        // Continue processing even if publishing fails
      }
    }
    
    return savedArticle;
  } catch (error) {
    logger.error(`Error processing video ${videoId}:`, error);
    throw error;
  }
};

module.exports = {
  fetchYouTubeRssFeed,
  checkForNewVideos,
  processVideo,
  processChannelVideos
};
