import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token for every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication services
export const authService = {
  signup: (data) => api.post('/auth/signup', data),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getCurrentUser: () => api.get('/auth/me')
};

// Project services
export const projectService = {
  getProjects: () => api.get('/projects'),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`)
};

// WordPress services
export const wordpressService = {
  getWordPressSites: (projectId) => api.get(`/wordpress/project/${projectId}`),
  verifyWordPressCredentials: (data) => api.post('/wordpress/verify', data),
  addWordPressSite: (projectId, data) => api.post(`/wordpress/project/${projectId}`, data),
  updateWordPressSite: (siteId, data) => api.put(`/wordpress/${siteId}`, data),
  deleteWordPressSite: (siteId) => api.delete(`/wordpress/${siteId}`)
};

// YouTube services
export const youtubeService = {
  getYouTubeChannels: (projectId) => api.get(`/youtube/project/${projectId}`),
  validateYouTubeChannel: (data) => api.post('/youtube/validate', data),
  addYouTubeChannel: (projectId, data) => api.post(`/youtube/project/${projectId}`, data),
  updateYouTubeChannel: (channelId, data) => api.put(`/youtube/${channelId}`, data),
  deleteYouTubeChannel: (channelId) => api.delete(`/youtube/${channelId}`),
  checkForNewVideos: (channelId) => api.post(`/youtube/${channelId}/check`),
  checkAllChannels: () => api.post('/youtube/check-all-channels')
};

// Video services
export const videoService = {
  getVideos: (projectId) => api.get(`/videos/project/${projectId}`),
  getVideo: (videoId) => api.get(`/videos/${videoId}`),
  addVideo: (data) => api.post('/videos', data),
  processVideo: (videoId) => api.post(`/videos/${videoId}/process`),
  fetchTranscript: (videoId) => api.post(`/videos/${videoId}/transcript`),
  deleteVideo: (videoId) => api.delete(`/videos/${videoId}`)
};

// Article services
export const articleService = {
  getArticles: (projectId) => api.get(`/articles/project/${projectId}`),
  getArticle: (articleId) => api.get(`/articles/${articleId}`),
  updateArticle: (articleId, data) => api.put(`/articles/${articleId}`, data),
  regenerateArticle: (videoId, data) => api.post(`/articles/${videoId}/regenerate`, data),
  publishArticle: (articleId) => api.post(`/articles/${articleId}/publish`),
  deleteArticle: (articleId) => api.delete(`/articles/${articleId}`)
};

// LLM services
export const llmService = {
  getLLMSettings: (projectId) => api.get(`/llm/project/${projectId}`),
  updateLLMSettings: (projectId, data) => api.put(`/llm/project/${projectId}`, data),
  verifyLLMApiKey: (data) => api.post('/llm/verify', data)
};

// Monitoring services
export const monitoringService = {
  triggerMonitoring: () => api.post('/monitoring/trigger'),
  getMonitoringLogs: () => api.get('/monitoring/logs')
};

export default {
  authService,
  projectService,
  wordpressService,
  youtubeService,
  videoService,
  articleService,
  llmService,
  monitoringService
};
