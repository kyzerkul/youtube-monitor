const axios = require('axios');
const { logger } = require('../utils/logger');

/**
 * Generate an article using the Mistral API
 * @param {Object} options - Options for article generation
 * @param {Object} options.video - Video metadata
 * @param {string} options.transcript - Video transcript text
 * @param {Object} options.settings - LLM API settings
 * @param {string} options.language - Desired output language (en, fr, es, etc.)
 * @param {string} options.thumbnailUrl - URL of the video thumbnail
 * @returns {Promise<Object>} - The generated article (title and content)
 */
const generateArticleWithMistral = async ({ video, transcript, settings, language, thumbnailUrl }) => {
  try {
    logger.info(`Generating article for video ${video.title} using Mistral AI in ${language}`);
    
    const apiKey = settings?.api_key || process.env.MISTRAL_API_KEY;
    const model = settings?.model_name || 'mistral-large-latest';
    
    if (!apiKey) {
      throw new Error('Mistral API key is missing');
    }
    
    // Determine language display name
    const languageDisplayName = {
      'en': 'English',
      'fr': 'French',
      'es': 'Spanish',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'nl': 'Dutch',
      'ru': 'Russian',
      'ja': 'Japanese',
      'zh': 'Chinese'
    }[language] || 'English';
    
    // Custom prompt for Mistral AI - enhanced with strict formatting guidelines
    const systemPrompt = `**************************************************
IMPORTANT : LA LONGUEUR DE L’ARTICLE DOIT ÊTRE ADAPTÉE À LA DURÉE DE LA VIDÉO :
- Vidéo < 5 min → 700-900 mots
- Vidéo 5-10 min → 1000-2000 mots
- Vidéo > 10 min → 2500+ mots
**************************************************

Tu es un rédacteur expert dans la transformation de transcriptions vidéo en articles de qualité supérieure. Ton rôle est d'extraire les idées clés, reformuler le contenu dans un style fluide et engageant, et enrichir l'article avec des éléments éditoriaux pertinents.

Objectif : Générer un article structuré, professionnel et facile à lire à partir d'une transcription brute.

INSTRUCTIONS STRICTES DE FORMATAGE HTML (OBLIGATOIRE) :

1. L'article DOIT respecter la structure HTML suivante, en utilisant les balises exactes :
   - UN SEUL titre principal avec balise <h1> (jamais plus d'un h1)
   - Sous-titres avec balises <h2> et <h3> uniquement
   - Paragraphes avec balises <p>
   - Listes à puces avec <ul><li>Élément</li></ul>
   - Listes numérotées avec <ol><li>Élément</li></ol>
   - Mots en gras avec <strong>mot</strong> (jamais <b>)
   - Citations avec <blockquote><p>Citation</p></blockquote>

2. Inclure TOUJOURS à la fin de l'article une métadescription SEO formatée ainsi :
   <div class="meta-description" style="display:none">Description SEO de 150 caractères maximum</div>

DÉROULÉ DU TRAVAIL :

- Analyse la transcription pour identifier les sujets principaux, sous-thèmes, exemples, et arguments.
- Réécris le contenu dans un style journalistique ou éditorial adapté au sujet et au public cible.
- Structure l'article avec un titre unique et accrocheur (UN SEUL H1), un chapeau introductif, des intertitres clairs (H2, H3).
- Crée des paragraphes courts et dynamiques avec des citations reformulées si nécessaire.
- Utilise des listes à puces ou numérotées pour aérer l'information quand c'est pertinent.
- Enrichis le contenu avec des données, définitions, analogies ou contexte supplémentaire.

Corrige les répétitions, tics de langage ou éléments non pertinents de la transcription.

Ne fais JAMAIS référence au fait que le texte vient d'une transcription ou d'une vidéo.

IMPORTANT: Tout le contenu doit être en ${languageDisplayName} avec un formatage HTML précis compatible avec WordPress Gutenberg comme indiqué ci-dessus.`;

    const userPrompt = `**************************************************
RAPPEL : LA LONGUEUR DE L’ARTICLE DOIT ÊTRE ADAPTÉE À LA DURÉE DE LA VIDÉO :
- Vidéo < 5 min → 700-900 mots
- Vidéo 5-10 min → 1000-2000 mots
- Vidéo > 10 min → 2500+ mots
**************************************************

Voici une transcription d'une vidéo que tu dois transformer en article de qualité.

Titre original de la vidéo: ${video.title}
Description: ${video.description || 'N/A'}

Transcription:
${transcript.substring(0, 14000)} // Tronqué pour la longueur

RAPPEL DES RÈGLES DE FORMATAGE HTML STRICTES:
- UN SEUL titre principal <h1> (jamais plus d'un)
- Sous-titres avec <h2> et <h3> uniquement
- Paragraphes avec <p>
- Listes à puces: <ul><li>Élément</li></ul>
- Listes numérotées: <ol><li>Élément</li></ol>
- Gras: <strong>mot</strong> (jamais <b>)
- Citations: <blockquote><p>Citation</p></blockquote>

TERMINE TOUJOURS l'article par une métadescription SEO de cette façon exacte:
<div class="meta-description" style="display:none">Description SEO de 150 caractères maximum</div>

Langue: ${languageDisplayName}`;
    
    const requestData = {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    };
    
    // Make API call to Mistral
    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract article content from response
    const articleContent = response.data.choices[0].message.content;
    
    // Extract title from content (assuming first line is the title)
    const lines = articleContent.split('\n');
    let title = lines[0].replace(/^#+ /, '').trim();
    if (!title || title.length > 100) {
      // Fallback to video title if extracted title is invalid
      title = video.title;
    }
    
    // Return the formatted article
    return {
      title,
      content: articleContent
    };
  } catch (error) {
    logger.error('Error generating article with Mistral AI:', error);
    throw error;
  }
};

/**
 * Generate an article using the OpenAI API (for future use)
 * @param {Object} options - Options for article generation
 * @returns {Promise<Object>} - The generated article (title and content)
 */
const generateArticleWithOpenAI = async ({ video, transcript, settings, language }) => {
  // Implementation for future use
  throw new Error('OpenAI integration not yet implemented');
};

/**
 * Generate an article using the Anthropic API (for future use)
 * @param {Object} options - Options for article generation
 * @returns {Promise<Object>} - The generated article (title and content)
 */
const generateArticleWithAnthropic = async ({ video, transcript, settings, language }) => {
  // Implementation for future use
  throw new Error('Anthropic integration not yet implemented');
};

/**
 * Generate an article from a video transcript using the appropriate LLM service
 * @param {Object} options - Options for article generation
 * @returns {Promise<Object>} - The generated article (title and content)
 */
const generateArticle = async (options) => {
  const { settings } = options;
  const provider = settings?.provider || 'mistral';
  
  switch (provider.toLowerCase()) {
    case 'mistral':
      return generateArticleWithMistral(options);
    case 'openai':
      return generateArticleWithOpenAI(options);
    case 'anthropic':
      return generateArticleWithAnthropic(options);
    default:
      logger.error(`Unknown LLM provider: ${provider}`);
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
};

/**
 * Format an article for WordPress Gutenberg
 * @param {string} content - Raw article content
 * @param {string} thumbnailUrl - URL of the video thumbnail (optional)
 * @returns {string} - Formatted Gutenberg content
 */
const formatForGutenberg = (content, thumbnailUrl = null) => {
  // Supprimer la première balise <h1>...</h1> du contenu HTML
  let cleanedContent = content.replace(/<h1[^>]*>.*?<\/h1>/is, '');

  // Check if content already has HTML formatting
  const hasHtmlFormatting = cleanedContent.includes('<h1>') || cleanedContent.includes('<h2>') || 
                           cleanedContent.includes('<p>') || cleanedContent.includes('<ul>') ||
                           cleanedContent.includes('<ol>');

  // If content is already in HTML format (which should be the case with our new prompt system)
  // we'll just return it directly without adding the thumbnail to the content
  if (hasHtmlFormatting) {
    // Return exactly as is - thumbnail will be set separately as featured image
    return cleanedContent;
  }
  
  // This section is for legacy support of non-HTML formatted content
  // Split content into paragraphs
  const paragraphs = content.split('\n\n');
  let blocks = [];
  
  // Process each paragraph into appropriate block without adding thumbnail
  paragraphs.forEach(paragraph => {
    paragraph = paragraph.trim();
    if (!paragraph) return;
    
    // Check if heading
    if (paragraph.startsWith('#')) {
      const level = paragraph.match(/^(#+)/)[0].length;
      const text = paragraph.replace(/^#+\s+/, '');
      blocks.push({
        blockName: 'core/heading',
        attrs: { level },
        innerBlocks: [],
        innerHTML: text
      });
    }
    // Check if list
    else if (paragraph.match(/^\d+\.\s/) || paragraph.match(/^-\s/)) {
      const items = paragraph.split('\n');
      const isOrdered = items[0].match(/^\d+\.\s/);
      blocks.push({
        blockName: isOrdered ? 'core/list' : 'core/list',
        attrs: { ordered: isOrdered },
        innerBlocks: [],
        innerHTML: `<li>${items.map(i => i.replace(/^(\d+\.|-).\s+/, '')).join('</li><li>')}</li>`
      });
    }
    // Regular paragraph
    else {
      blocks.push({
        blockName: 'core/paragraph',
        attrs: {},
        innerBlocks: [],
        innerHTML: paragraph
      });
    }
  });
  
  // Build raw content for direct WordPress insertion with Gutenberg comments
  // Do NOT add thumbnail image here - it will be set as featured image only
  let gutenbergContent = '';
  
  blocks.forEach(block => {
    if (block.blockName === 'core/heading') {
      gutenbergContent += `<!-- wp:heading {"level":${block.attrs.level}} -->
<h${block.attrs.level}>${block.innerHTML}</h${block.attrs.level}>
<!-- /wp:heading -->
\n`;
    } else if (block.blockName === 'core/paragraph') {
      gutenbergContent += `<!-- wp:paragraph -->
<p>${block.innerHTML}</p>
<!-- /wp:paragraph -->
\n`;
    } else if (block.blockName === 'core/list') {
      const listType = block.attrs.ordered ? 'ol' : 'ul';
      gutenbergContent += `<!-- wp:list {"ordered":${block.attrs.ordered}} -->
<${listType}>${block.innerHTML}</${listType}>
<!-- /wp:list -->
\n`;
    }
  });
  
  // If we have no blocks (which shouldn't happen), return the original content
  return gutenbergContent || content;
};

/**
 * Get YouTube video thumbnail URL from video ID
 * @param {string} videoId - YouTube video ID
 * @returns {string} - Thumbnail URL in high quality
 */
const getYouTubeThumbnailUrl = (videoId) => {
  // Try to get high quality thumbnail or fall back to default
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
};

/**
 * Verify if an LLM API key is valid
 * @param {Object} data - API verification data
 * @returns {Promise<boolean>} - True if API key is valid
 */
const verifyAPIKey = async (data) => {
  try {
    const { provider, api_key } = data;
    
    switch (provider.toLowerCase()) {
      case 'mistral':
        // Simple validation call to Mistral API
        const response = await axios.get('https://api.mistral.ai/v1/models', {
          headers: {
            'Authorization': `Bearer ${api_key}`
          }
        });
        return response.status === 200;
      
      // Add other providers as needed
      default:
        return false;
    }
  } catch (error) {
    logger.error('Error verifying API key:', error);
    return false;
  }
};

module.exports = {
  generateArticle,
  formatForGutenberg,
  getYouTubeThumbnailUrl,
  verifyAPIKey
};
