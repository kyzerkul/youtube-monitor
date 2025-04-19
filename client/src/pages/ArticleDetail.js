import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { articleService } from '../services/api';

const ArticleDetail = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('en');
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch article details
  const { data, isLoading, error } = useQuery(
    ['article', articleId],
    () => articleService.getArticle(articleId)
  );
  
  // Update article mutation
  const updateArticleMutation = useMutation(
    (data) => articleService.updateArticle(articleId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['article', articleId]);
        setIsEditing(false);
        alert('Article updated successfully');
      }
    }
  );
  
  // Publish article mutation
  const publishArticleMutation = useMutation(
    () => articleService.publishArticle(articleId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['article', articleId]);
        alert('Article published successfully');
      }
    }
  );
  
  // Delete article mutation
  const deleteArticleMutation = useMutation(
    () => articleService.deleteArticle(articleId),
    {
      onSuccess: () => {
        // Navigate back to the project page
        const projectId = data?.data?.videos?.youtube_channels?.project_id;
        navigate(`/projects/${projectId}/articles`);
      }
    }
  );
  
  // Update state when article data is loaded
  useEffect(() => {
    if (data?.data) {
      setTitle(data.data.title || '');
      setContent(data.data.content || '');
      setLanguage(data.data.language || 'en');
    }
  }, [data]);
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title || !content) {
      alert('Title and content are required');
      return;
    }
    
    updateArticleMutation.mutate({
      title,
      content,
      language
    });
  };
  
  // Handle publish article
  const handlePublishArticle = () => {
    if (window.confirm('Are you sure you want to publish this article to WordPress?')) {
      publishArticleMutation.mutate();
    }
  };
  
  // Handle delete article
  const handleDeleteArticle = () => {
    if (window.confirm('Are you sure you want to delete this article? This cannot be undone.')) {
      deleteArticleMutation.mutate();
    }
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    if (data?.data) {
      setTitle(data.data.title || '');
      setContent(data.data.content || '');
      setLanguage(data.data.language || 'en');
    }
    setIsEditing(false);
  };
  
  if (isLoading) {
    return <div className="text-center py-10">Loading article details...</div>;
  }
  
  if (error) {
    return (
      <div className="text-center py-10 text-red-600">
        Error loading article: {error.message}
      </div>
    );
  }
  
  const article = data?.data;
  
  if (!article) {
    return <div className="text-center py-10">Article not found</div>;
  }
  
  const projectId = article.videos?.youtube_channels?.project_id;
  
  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditing ? 'Edit Article' : 'Article Details'}
        </h1>
        <div className="flex space-x-3">
          {!isEditing && (
            <button
              onClick={toggleEditMode}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Edit Article
            </button>
          )}
          {!article.published && !isEditing && (
            <button
              onClick={handlePublishArticle}
              disabled={publishArticleMutation.isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {publishArticleMutation.isLoading ? 'Publishing...' : 'Publish to WordPress'}
            </button>
          )}
          {!isEditing && (
            <button
              onClick={handleDeleteArticle}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-4">
        {projectId && (
          <Link
            to={`/projects/${projectId}/articles`}
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            &larr; Back to Articles
          </Link>
        )}
      </div>
      
      {/* Article Metadata */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Article Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about the generated article.</p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  article.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {article.published ? 'Published' : 'Draft'}
                </span>
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Language</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {article.language === 'en' ? 'English' : 'French'}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Source Video</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {article.videos?.title || 'Unknown'}
                {article.videos?.video_id && (
                  <a
                    href={`https://www.youtube.com/watch?v=${article.videos.video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-indigo-600 hover:text-indigo-500"
                  >
                    View on YouTube
                  </a>
                )}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(article.created_at).toLocaleString()}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(article.updated_at).toLocaleString()}
              </dd>
            </div>
            {article.wordpress_post_id && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">WordPress Post</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  ID: {article.wordpress_post_id}
                  {article.videos?.youtube_channels?.wordpress_sites?.[0]?.url && (
                    <a
                      href={`${article.videos.youtube_channels.wordpress_sites[0].url}/wp-admin/post.php?post=${article.wordpress_post_id}&action=edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-indigo-600 hover:text-indigo-500"
                    >
                      Edit on WordPress
                    </a>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      
      {/* Article Content Form */}
      <div className="mt-8">
        <form onSubmit={handleSubmit}>
          <div className="shadow sm:rounded-md sm:overflow-hidden">
            <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <div className="mt-1">
                  {isEditing ? (
                    <input
                      type="text"
                      name="title"
                      id="title"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{article.title}</p>
                  )}
                </div>
              </div>
              
              {isEditing && (
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                    Language
                  </label>
                  <select
                    id="language"
                    name="language"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="fr">French</option>
                  </select>
                </div>
              )}
              
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Content
                </label>
                <div className="mt-1">
                  {isEditing ? (
                    <textarea
                      id="content"
                      name="content"
                      rows={15}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                    />
                  ) : (
                    <div className="p-4 border border-gray-300 rounded-md prose max-w-none">
                      {article.content.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {isEditing && (
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateArticleMutation.isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {updateArticleMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArticleDetail;
