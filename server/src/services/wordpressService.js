const axios = require('axios');
const FormData = require('form-data');
const { getSupabase } = require('../utils/supabase');
const { logger } = require('../utils/logger');
const { formatForGutenberg, getYouTubeThumbnailUrl } = require('./llmService');

/**
 * Verify WordPress credentials by trying to fetch the site info
 * @param {Object} credentials - WordPress site credentials
 * @returns {Promise<boolean>} - True if credentials are valid
 */
const verifyWordPressCredentials = async (credentials) => {
  try {
    const { url, username, application_password } = credentials;
    
    // Create Base64 encoded authentication header
    const auth = Buffer.from(`${username}:${application_password}`).toString('base64');
    
    // Try to fetch site information
    const response = await axios.get(`${url}/wp-json/wp/v2/users/me`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    return response.status === 200;
  } catch (error) {
    logger.error('Error verifying WordPress credentials:', error);
    return false;
  }
};

/**
 * Format article content for WordPress Gutenberg blocks
 * @param {string} content - Raw markdown or HTML content
 * @param {string} thumbnailUrl - URL of the video thumbnail (optional)
 * @returns {Object} - Formatted Gutenberg content
 */
const prepareGutenbergContent = (content, thumbnailUrl = null) => {
  // Convert content to Gutenberg blocks with thumbnail if available
  const formattedContent = formatForGutenberg(content, thumbnailUrl);
  
  // Return the raw content or blocks depending on what's available
  return formattedContent;
};

/**
 * Publish an article to WordPress
 * @param {string} articleId - Database ID of the article to publish
 * @returns {Promise<Object>} - Published article info
 */
const publishArticleToWordPress = async (articleId) => {
  const supabase = getSupabase();
  
  try {
    // Get article with video and project info
    const { data: article, error } = await supabase
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
    
    if (error) {
      throw error;
    }
    
    // Get WordPress site for this project
    const { data: wordpressSite, error: wpError } = await supabase
      .from('wordpress_sites')
      .select('*')
      .eq('project_id', article.videos.youtube_channels.project_id)
      .single();
    
    if (wpError || !wordpressSite) {
      throw new Error('No WordPress site found for this project');
    }
    
    // Prepare authentication
    const auth = Buffer.from(`${wordpressSite.username}:${wordpressSite.application_password}`).toString('base64');
    
    // Get the YouTube video thumbnail URL
    const videoId = article.videos.video_id;
    const thumbnailUrl = getYouTubeThumbnailUrl(videoId);
    
    // Format content for WordPress Gutenberg
    // This will NOT add the thumbnail to the content - thumbnail will be set as featured image only
    const formattedContent = prepareGutenbergContent(article.content, thumbnailUrl);
    
    // Create post on WordPress
    const response = await axios.post(
      `${wordpressSite.url}/wp-json/wp/v2/posts`,
      {
        title: article.title,
        content: formattedContent,
        status: 'draft', // Always publish as draft first
        categories: [], // Can be configured later
        tags: [], // Can be configured later
        featured_media: 0, // Will be set after upload
        comment_status: 'open'
      },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Upload featured image if we have a thumbnail URL
    if (thumbnailUrl) {
      try {
        // First, download the image
        const imageResponse = await axios.get(thumbnailUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data, 'binary');
        
        // Then upload to WordPress
        const formData = new FormData();
        formData.append('file', imageBuffer, `thumbnail-${videoId}.jpg`);
        
        const uploadResponse = await axios.post(
          `${wordpressSite.url}/wp-json/wp/v2/media`,
          formData,
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'multipart/form-data',
              'Content-Disposition': `attachment; filename=thumbnail-${videoId}.jpg`
            }
          }
        );
        
        // Then set as featured image
        if (uploadResponse.data && uploadResponse.data.id) {
          await axios.post(
            `${wordpressSite.url}/wp-json/wp/v2/posts/${response.data.id}`,
            { featured_media: uploadResponse.data.id },
            {
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
              }
            }
          );
        }
      } catch (mediaError) {
        logger.error(`Error uploading featured image for article ${articleId}:`, mediaError);
        // Continue without failing the whole process
      }
    }
    
    // Update article in database with WordPress post ID
    await supabase
      .from('articles')
      .update({
        wordpress_post_id: response.data.id,
        published: true
      })
      .eq('id', articleId);
    
    logger.info(`Successfully published article "${article.title}" to WordPress as post ID ${response.data.id}`);
    
    return {
      articleId,
      wordpressPostId: response.data.id,
      postUrl: response.data.link
    };
  } catch (error) {
    logger.error(`Error publishing article ${articleId} to WordPress:`, error);
    throw error;
  }
};

module.exports = {
  verifyWordPressCredentials,
  publishArticleToWordPress
};
