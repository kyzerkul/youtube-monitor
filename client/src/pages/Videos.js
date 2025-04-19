import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { videoService, projectService } from '../services/api';

const Videos = () => {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  
  // Fetch project details
  const { data: projectData } = useQuery(
    ['project', projectId],
    () => projectService.getProject(projectId)
  );
  
  // Fetch videos
  const { data, isLoading, error } = useQuery(
    ['videos', projectId],
    () => videoService.getVideos(projectId)
  );
  
  // Process video mutation
  const processVideoMutation = useMutation(
    (videoId) => videoService.processVideo(videoId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['videos', projectId]);
        alert('Video processed successfully');
      }
    }
  );
  
  // Fetch transcript mutation
  const fetchTranscriptMutation = useMutation(
    (videoId) => videoService.fetchTranscript(videoId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['videos', projectId]);
        alert('Transcript fetched successfully');
      }
    }
  );
  
  // Delete video mutation
  const deleteVideoMutation = useMutation(
    (videoId) => videoService.deleteVideo(videoId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['videos', projectId]);
      }
    }
  );
  
  // Handle process video
  const handleProcessVideo = (videoId) => {
    processVideoMutation.mutate(videoId);
  };
  
  // Handle fetch transcript
  const handleFetchTranscript = (videoId) => {
    fetchTranscriptMutation.mutate(videoId);
  };
  
  // Handle delete video
  const handleDeleteVideo = (videoId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      deleteVideoMutation.mutate(videoId);
    }
  };
  
  const project = projectData?.data;
  
  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Videos
          </h2>
          {project && (
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                Project: {project.name}
              </div>
            </div>
          )}
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
      
      {/* Videos list */}
      <div className="mt-6">
        {isLoading ? (
          <div className="text-center">Loading videos...</div>
        ) : error ? (
          <div className="text-center text-red-600">Error loading videos: {error.message}</div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-10 bg-white shadow overflow-hidden sm:rounded-md">
            <p className="text-gray-500">No videos found for this project.</p>
            <p className="mt-2 text-sm text-gray-500">
              Videos will appear here when they are found from your YouTube channels.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {data?.data?.map((video) => (
                <li key={video.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {video.title}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          video.processed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {video.processed ? 'Processed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Channel: {video.youtube_channels?.channel_name || 'Unknown'}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <span>
                          Published: {new Date(video.published_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end space-x-3">
                      {!video.transcript && (
                        <button
                          onClick={() => handleFetchTranscript(video.id)}
                          disabled={fetchTranscriptMutation.isLoading}
                          className="text-xs text-indigo-600 hover:text-indigo-900"
                        >
                          {fetchTranscriptMutation.isLoading ? 'Fetching...' : 'Fetch Transcript'}
                        </button>
                      )}
                      {video.transcript && !video.processed && (
                        <button
                          onClick={() => handleProcessVideo(video.id)}
                          disabled={processVideoMutation.isLoading}
                          className="text-xs text-indigo-600 hover:text-indigo-900"
                        >
                          {processVideoMutation.isLoading ? 'Processing...' : 'Generate Article'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteVideo(video.id)}
                        className="text-xs text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                      <a
                        href={`https://www.youtube.com/watch?v=${video.video_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-600 hover:text-gray-900"
                      >
                        View on YouTube
                      </a>
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

export default Videos;
