const { YoutubeTranscript } = require('youtube-transcript');
const { logger } = require('../utils/logger');

/**
 * Get the transcript for a YouTube video
 * @param {string} videoId - The YouTube video ID
 * @returns {Promise<string>} - The video transcript text
 */
/**
 * Get the transcript for a YouTube video
 * @param {string} videoId - The YouTube video ID
 * @param {string} lang - Language code for the transcript ('en' or 'fr'), default 'en'
 * @returns {Promise<string>} - The video transcript text
 */
const getVideoTranscript = async (videoId, lang = 'en') => {
  try {
    logger.info(`Fetching transcript for video: ${videoId} (lang: ${lang})`);
    
    // Set a longer timeout for transcript fetching
    const timeout = parseInt(process.env.YOUTUBE_TRANSCRIPT_TIMEOUT || 60000);
    
    // Get transcript segments from YouTube
    const transcriptResponse = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: lang,
      timeout
    });
    
    if (!transcriptResponse || transcriptResponse.length === 0) {
      logger.warn(`No transcript available for video: ${videoId}`);
      return '';
    }
    
    // Concatenate transcript segments into a single text
    const fullTranscript = transcriptResponse
      .map(segment => segment.text)
      .join(' ');
    
    logger.info(`Successfully fetched transcript for video: ${videoId} (${fullTranscript.length} characters)`);
    
    return fullTranscript;
  } catch (error) {
    logger.error(`Error fetching transcript for video ${videoId}:`, error);
    // Don't throw error, just return empty string to continue processing
    return '';
  }
};

module.exports = {
  getVideoTranscript
};
