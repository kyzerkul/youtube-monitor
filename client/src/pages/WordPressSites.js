import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { wordpressService, projectService } from '../services/api';

const WordPressSites = () => {
  const { projectId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [applicationPassword, setApplicationPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  
  const queryClient = useQueryClient();
  
  // Fetch project details
  const { data: projectData } = useQuery(
    ['project', projectId],
    () => projectService.getProject(projectId)
  );
  
  // Fetch WordPress sites
  const { data, isLoading, error } = useQuery(
    ['wordpressSites', projectId],
    () => wordpressService.getWordPressSites(projectId)
  );
  
  // Add WordPress site mutation
  const addWordPressSiteMutation = useMutation(
    (siteData) => wordpressService.addWordPressSite(projectId, siteData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['wordpressSites', projectId]);
        resetForm();
      }
    }
  );
  
  // Update WordPress site mutation
  const updateWordPressSiteMutation = useMutation(
    (data) => wordpressService.updateWordPressSite(data.id, {
      url: data.url,
      username: data.username,
      application_password: data.application_password
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['wordpressSites', projectId]);
        resetForm();
      }
    }
  );
  
  // Delete WordPress site mutation
  const deleteWordPressSiteMutation = useMutation(
    (siteId) => wordpressService.deleteWordPressSite(siteId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['wordpressSites', projectId]);
      }
    }
  );
  
  // Verify WordPress credentials mutation
  const verifyCredentialsMutation = useMutation(
    (credentials) => wordpressService.verifyWordPressCredentials(credentials),
    {
      onSuccess: (data) => {
        setVerificationResult({
          valid: data.data.valid,
          message: data.data.message
        });
        setIsVerifying(false);
      },
      onError: (error) => {
        setVerificationResult({
          valid: false,
          message: 'Error verifying credentials: ' + (error.message || 'Unknown error')
        });
        setIsVerifying(false);
      }
    }
  );
  
  // Open modal for creating a new site
  const openCreateModal = () => {
    setEditingSite(null);
    setUrl('');
    setUsername('');
    setApplicationPassword('');
    setVerificationResult(null);
    setIsModalOpen(true);
  };
  
  // Open modal for editing a site
  const openEditModal = (site) => {
    setEditingSite(site);
    setUrl(site.url);
    setUsername(site.username);
    setApplicationPassword('');
    setVerificationResult(null);
    setIsModalOpen(true);
  };
  
  // Reset form and close modal
  const resetForm = () => {
    setEditingSite(null);
    setUrl('');
    setUsername('');
    setApplicationPassword('');
    setVerificationResult(null);
    setIsModalOpen(false);
  };
  
  // Verify credentials
  const verifyCredentials = () => {
    if (!url || !username || !applicationPassword) {
      setVerificationResult({
        valid: false,
        message: 'Please fill in all fields'
      });
      return;
    }
    
    setIsVerifying(true);
    setVerificationResult(null);
    
    verifyCredentialsMutation.mutate({
      url,
      username,
      application_password: applicationPassword
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!url || !username || !applicationPassword) {
      setVerificationResult({
        valid: false,
        message: 'Please fill in all fields'
      });
      return;
    }
    
    if (!verificationResult || !verificationResult.valid) {
      setVerificationResult({
        valid: false,
        message: 'Please verify credentials before saving'
      });
      return;
    }
    
    if (editingSite) {
      updateWordPressSiteMutation.mutate({
        id: editingSite.id,
        url,
        username,
        application_password: applicationPassword
      });
    } else {
      addWordPressSiteMutation.mutate({
        url,
        username,
        application_password: applicationPassword
      });
    }
  };
  
  // Handle site deletion
  const handleDelete = (siteId) => {
    if (window.confirm('Are you sure you want to delete this WordPress site?')) {
      deleteWordPressSiteMutation.mutate(siteId);
    }
  };
  
  const project = projectData?.data;
  
  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            WordPress Sites
          </h2>
          {project && (
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                Project: {project.name}
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={openCreateModal}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add WordPress Site
          </button>
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
      
      {/* WordPress sites list */}
      <div className="mt-6">
        {isLoading ? (
          <div className="text-center">Loading WordPress sites...</div>
        ) : error ? (
          <div className="text-center text-red-600">Error loading WordPress sites: {error.message}</div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-10 bg-white shadow overflow-hidden sm:rounded-md">
            <p className="text-gray-500">No WordPress sites found for this project.</p>
            <p className="mt-2 text-sm text-gray-500">
              Add a WordPress site to start publishing articles.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {data?.data?.map((site) => (
                <li key={site.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {site.url}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <button
                          onClick={() => openEditModal(site)}
                          className="ml-2 text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(site.id)}
                          className="ml-4 text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Username: {site.username}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <span className="text-xs bg-gray-100 rounded px-2 py-1">
                          Added on {new Date(site.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Create/Edit WordPress Site Modal */}
      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={resetForm}
            ></div>
            
            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {editingSite ? 'Edit WordPress Site' : 'Add WordPress Site'}
                      </h3>
                      <div className="mt-6 space-y-6">
                        <div>
                          <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                            WordPress Site URL *
                          </label>
                          <input
                            type="url"
                            name="url"
                            id="url"
                            required
                            placeholder="https://example.com"
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                          />
                        </div>
                        <div>
                          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Username *
                          </label>
                          <input
                            type="text"
                            name="username"
                            id="username"
                            required
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                          />
                        </div>
                        <div>
                          <label htmlFor="applicationPassword" className="block text-sm font-medium text-gray-700">
                            Application Password *
                          </label>
                          <input
                            type="password"
                            name="applicationPassword"
                            id="applicationPassword"
                            required
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            value={applicationPassword}
                            onChange={(e) => setApplicationPassword(e.target.value)}
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            You must use an Application Password from WordPress (Settings &gt; Application Passwords).
                          </p>
                        </div>
                        
                        {verificationResult && (
                          <div className={`mt-2 text-sm ${verificationResult.valid ? 'text-green-600' : 'text-red-600'}`}>
                            {verificationResult.message}
                          </div>
                        )}
                        
                        <div>
                          <button
                            type="button"
                            onClick={verifyCredentials}
                            disabled={isVerifying}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            {isVerifying ? 'Verifying...' : 'Verify Credentials'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={!verificationResult?.valid || addWordPressSiteMutation.isLoading || updateWordPressSiteMutation.isLoading}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm ${
                      (!verificationResult?.valid || addWordPressSiteMutation.isLoading || updateWordPressSiteMutation.isLoading) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {addWordPressSiteMutation.isLoading || updateWordPressSiteMutation.isLoading
                      ? 'Saving...'
                      : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordPressSites;
