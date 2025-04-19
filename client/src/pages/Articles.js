import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { articleService, projectService } from '../services/api';

const Articles = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [languageFilter, setLanguageFilter] = useState('all');
  
  // Fetch project details
  const { data: projectData } = useQuery(
    ['project', projectId],
    () => projectService.getProject(projectId)
  );
  
  // Fetch articles
  const { data, isLoading, error } = useQuery(
    ['articles', projectId],
    () => articleService.getArticles(projectId)
  );
  
  // Publish article mutation
  const publishArticleMutation = useMutation(
    (articleId) => articleService.publishArticle(articleId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['articles', projectId]);
        alert('Article published successfully');
      }
    }
  );
  
  // Delete article mutation
  const deleteArticleMutation = useMutation(
    (articleId) => articleService.deleteArticle(articleId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['articles', projectId]);
      }
    }
  );
  
  // Handle publish article
  const handlePublishArticle = (articleId) => {
    publishArticleMutation.mutate(articleId);
  };
  
  // Handle delete article
  const handleDeleteArticle = (articleId) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      deleteArticleMutation.mutate(articleId);
    }
  };
  
  // Handle view article
  const handleViewArticle = (articleId) => {
    navigate(`/articles/${articleId}`);
  };
  
  const project = projectData?.data;
  
  // Filter articles by language if needed
  const filteredArticles = data?.data?.filter((article) => {
    if (languageFilter === 'all') return true;
    return article.language === languageFilter;
  });
  
  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Articles
          </h2>
          {project && (
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                Project: {project.name}
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center md:mt-0 md:ml-4">
          <span className="mr-2 text-sm text-gray-700">Filter by language:</span>
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="block w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="all">All Languages</option>
            <option value="en">English</option>
            <option value="fr">French</option>
          </select>
        </div>
      </div>
      
      <div className="mt-4">
        <Link
          to={`/projects/${projectId}`}
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          &larr; Back to Project
        </Link>
      </div>
      
      {/* Articles list */}
      <div className="mt-6">
        {isLoading ? (
          <div className="text-center">Loading articles...</div>
        ) : error ? (
          <div className="text-center text-red-600">Error loading articles: {error.message}</div>
        ) : !filteredArticles || filteredArticles.length === 0 ? (
          <div className="text-center py-10 bg-white shadow overflow-hidden sm:rounded-md">
            <p className="text-gray-500">No articles found for this project.</p>
            <p className="mt-2 text-sm text-gray-500">
              Articles will appear here when they are generated from video transcripts.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredArticles.map((article) => (
                <li key={article.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {article.title}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex space-x-2">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          article.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {article.published ? 'Published' : 'Draft'}
                        </span>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {article.language === 'en' ? 'English' : 'French'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Video: {article.videos?.title || 'Unknown'}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <span>
                          Created: {new Date(article.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end space-x-3">
                      <button
                        onClick={() => handleViewArticle(article.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-900"
                      >
                        View & Edit
                      </button>
                      {!article.published && (
                        <button
                          onClick={() => handlePublishArticle(article.id)}
                          disabled={publishArticleMutation.isLoading}
                          className="text-xs text-green-600 hover:text-green-900"
                        >
                          {publishArticleMutation.isLoading ? 'Publishing...' : 'Publish to WordPress'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteArticle(article.id)}
                        className="text-xs text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                      {article.wordpress_post_id && (
                        <a
                          href={`${article.videos?.youtube_channels?.wordpress_sites?.[0]?.url}/wp-admin/post.php?post=${article.wordpress_post_id}&action=edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-600 hover:text-gray-900"
                        >
                          View on WordPress
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Articles;
