import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { youtubeService, projectService } from '../services/api';

const YouTubeChannels = () => {
  const { projectId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [channelId, setChannelId] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [autoMonitoring, setAutoMonitoring] = useState(false);
  const [isGlobalMonitoring, setIsGlobalMonitoring] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Fetch project details
  const { data: projectData } = useQuery(
    ['project', projectId],
    () => projectService.getProject(projectId)
  );
  
  // Fetch YouTube channels
  const { data, isLoading, error } = useQuery(
    ['youtubeChannels', projectId],
    () => youtubeService.getYouTubeChannels(projectId)
  );
  
  // Validate YouTube channel ID mutation
  const validateChannelMutation = useMutation(
    (channelData) => youtubeService.validateYouTubeChannel(channelData),
    {
      onSuccess: (data) => {
        setValidationResult({
          valid: data.data.valid,
          message: data.data.message,
          channelName: data.data.channelName,
          videoCount: data.data.videoCount
        });
        setIsValidating(false);
      },
      onError: (error) => {
        setValidationResult({
          valid: false,
          message: 'Error validating channel: ' + (error.message || 'Unknown error')
        });
        setIsValidating(false);
      }
    }
  );
  
  // Add YouTube channel mutation
  const addChannelMutation = useMutation(
    (channelData) => youtubeService.addYouTubeChannel(projectId, channelData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['youtubeChannels', projectId]);
        resetForm();
      }
    }
  );
  
  // Delete YouTube channel mutation
  const deleteChannelMutation = useMutation(
    (channelId) => youtubeService.deleteYouTubeChannel(channelId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['youtubeChannels', projectId]);
      }
    }
  );
  
  // Check for new videos mutation
  const checkForNewVideosMutation = useMutation(
    (channelId) => youtubeService.checkForNewVideos(channelId),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['youtubeChannels', projectId]);
        alert(`Found ${data.data.videoIds.length} new videos`);
      }
    }
  );
  
  // Trigger global monitoring mutation
  const triggerMonitoringMutation = useMutation(
    () => fetch('/api/monitoring/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    }).then(res => res.json()),
    {
      onSuccess: (data) => {
        setIsGlobalMonitoring(false);
        alert('Monitoring déclenché ! La vérification des nouvelles vidéos est en cours en arrière-plan.');
      },
      onError: (error) => {
        setIsGlobalMonitoring(false);
        alert(`Erreur lors du déclenchement du monitoring: ${error.message}`);
      }
    }
  );
  
  // Toggle auto-monitoring for a channel
  const toggleAutoMonitoringMutation = useMutation(
    ({ channelId, autoMonitoring }) => youtubeService.updateYouTubeChannel(channelId, { auto_monitoring: autoMonitoring }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['youtubeChannels', projectId]);
      }
    }
  );
  
  // Open modal for creating a new channel
  const openCreateModal = () => {
    setChannelId('');
    setValidationResult(null);
    setIsModalOpen(true);
  };
  
  // Reset form and close modal
  const resetForm = () => {
    setChannelId('');
    setValidationResult(null);
    setAutoMonitoring(false);
    setIsModalOpen(false);
  };
  
  // Validate YouTube channel ID
  const validateChannel = () => {
    if (!channelId) {
      setValidationResult({
        valid: false,
        message: 'Please enter a channel ID'
      });
      return;
    }
    
    setIsValidating(true);
    setValidationResult(null);
    
    validateChannelMutation.mutate({
      channelId
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!channelId) {
      setValidationResult({
        valid: false,
        message: 'Please enter a channel ID'
      });
      return;
    }
    
    if (!validationResult || !validationResult.valid) {
      setValidationResult({
        valid: false,
        message: 'Please validate the channel ID before adding'
      });
      return;
    }
    
    addChannelMutation.mutate({
      channelId,
      channelName: validationResult.channelName,
      auto_monitoring: autoMonitoring
    });
  };
  
  // Handle channel deletion
  const handleDelete = (channelId) => {
    if (window.confirm('Are you sure you want to delete this YouTube channel?')) {
      deleteChannelMutation.mutate(channelId);
    }
  };
  
  // Handle check for new videos
  const handleCheckForNewVideos = (channelId) => {
    checkForNewVideosMutation.mutate(channelId);
  };
  
  // Handle toggle auto-monitoring
  const handleToggleAutoMonitoring = (channelId, currentValue) => {
    toggleAutoMonitoringMutation.mutate({ 
      channelId, 
      autoMonitoring: !currentValue 
    });
  };
  
  // Handle global monitoring trigger
  const handleTriggerGlobalMonitoring = () => {
    if (window.confirm('Voulez-vous déclencher une vérification de toutes les chaînes maintenant ?')) {
      setIsGlobalMonitoring(true);
      triggerMonitoringMutation.mutate();
    }
  };
  
  const project = projectData?.data;
  
  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleTriggerGlobalMonitoring}
            disabled={isGlobalMonitoring}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {isGlobalMonitoring ? 'Vérification en cours...' : 'Vérifier nouvelles vidéos'}
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Add YouTube Channel
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
      
      {/* YouTube channels list */}
      <div className="mt-6">
        {isLoading ? (
          <div className="text-center">Loading YouTube channels...</div>
        ) : error ? (
          <div className="text-center text-red-600">Error loading YouTube channels: {error.message}</div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-10 bg-white shadow overflow-hidden sm:rounded-md">
            <p className="text-gray-500">No YouTube channels found for this project.</p>
            <p className="mt-2 text-sm text-gray-500">
              Add a YouTube channel to start monitoring for new videos.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {data?.data?.map((channel) => (
                <li key={channel.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {channel.channel_name}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <button
                          onClick={() => handleCheckForNewVideos(channel.id)}
                          className="ml-2 text-indigo-600 hover:text-indigo-900"
                          disabled={checkForNewVideosMutation.isLoading}
                        >
                          {checkForNewVideosMutation.isLoading ? 'Checking...' : 'Check for New Videos'}
                        </button>
                        <button
                          onClick={() => handleDelete(channel.id)}
                          className="ml-4 text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Channel ID: {channel.channel_id}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <span className="text-xs bg-gray-100 rounded px-2 py-1">
                          Added on {new Date(channel.created_at).toLocaleDateString()}
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
      
      {/* Add YouTube Channel Modal */}
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
                        Add YouTube Channel
                      </h3>
                      <div className="mt-6 space-y-6">
                        <div>
                          <label htmlFor="channelId" className="block text-sm font-medium text-gray-700">
                            YouTube Channel ID *
                          </label>
                          <input
                            type="text"
                            name="channelId"
                            id="channelId"
                            required
                            placeholder="e.g. UCTQfUl0OLrqRmW6oVVqm2ow"
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            value={channelId}
                            onChange={(e) => setChannelId(e.target.value)}
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            The channel ID can be found in the channel URL: youtube.com/channel/[CHANNEL_ID]
                          </p>
                        </div>
                        
                        {validationResult && (
                          <div className={`mt-2 text-sm ${validationResult.valid ? 'text-green-600' : 'text-red-600'}`}>
                            {validationResult.message}
                            {validationResult.valid && (
                              <div className="mt-2 text-gray-700">
                                <p>Channel Name: {validationResult.channelName}</p>
                                <p>Videos Found: {validationResult.videoCount || 0}</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {validationResult?.valid && (
                          <div className="mt-4">
                            <div className="relative flex items-start">
                              <div className="flex items-center h-5">
                                <input
                                  id="auto_monitoring"
                                  name="auto_monitoring"
                                  type="checkbox"
                                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                  checked={autoMonitoring}
                                  onChange={(e) => setAutoMonitoring(e.target.checked)}
                                />
                              </div>
                              <div className="ml-3 text-sm">
                                <label htmlFor="auto_monitoring" className="font-medium text-gray-700">
                                  Monitoring automatique
                                </label>
                                <p className="text-gray-500">Vérifier automatiquement les nouvelles vidéos toutes les 6 heures</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <button
                            type="button"
                            onClick={validateChannel}
                            disabled={isValidating}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            {isValidating ? 'Validating...' : 'Validate Channel ID'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={!validationResult?.valid || addChannelMutation.isLoading}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm ${
                      (!validationResult?.valid || addChannelMutation.isLoading) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {addChannelMutation.isLoading ? 'Adding...' : 'Add Channel'}
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

export default YouTubeChannels;
