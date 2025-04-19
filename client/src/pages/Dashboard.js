import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { projectService, videoService, articleService, youtubeService } from '../services/api';

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [isCheckingVideos, setIsCheckingVideos] = useState(false);
  const [monitoringResult, setMonitoringResult] = useState(null);
  
  // Mutation for checking all YouTube channels
  const { mutate: checkAllChannels } = useMutation(
    youtubeService.checkAllChannels,
    {
      onMutate: () => {
        setIsCheckingVideos(true);
      },
      onSuccess: (data) => {
        setMonitoringResult(data.data);
        // Refetch videos and articles to display new content
        if (projects?.data?.[0]?.id) {
          queryClient.invalidateQueries(['recentVideos', projects.data[0].id]);
          queryClient.invalidateQueries(['recentArticles', projects.data[0].id]);
        }
      },
      onError: (error) => {
        console.error('Error checking for new videos:', error);
        alert('Error checking for new videos. Please try again.');
      },
      onSettled: () => {
        setIsCheckingVideos(false);
      }
    }
  );
  
  // Function to trigger video check
  const triggerCheckForNewVideos = () => {
    checkAllChannels();
  };
  // Fetch projects
  const { 
    data: projects, 
    isLoading: isLoadingProjects, 
    error: projectsError 
  } = useQuery('projects', projectService.getProjects);

  // Fetch recent videos when projects are available
  const { 
    data: recentVideos, 
    isLoading: isLoadingVideos,
    error: videosError
  } = useQuery(
    ['recentVideos', projects?.data?.[0]?.id],
    () => videoService.getVideos(projects?.data?.[0]?.id),
    {
      enabled: !!projects?.data?.[0]?.id,
      select: (data) => ({ 
        ...data, 
        data: data.data.slice(0, 5) // Get only the 5 most recent videos
      })
    }
  );

  // Fetch recent articles when projects are available
  const { 
    data: recentArticles, 
    isLoading: isLoadingArticles,
    error: articlesError
  } = useQuery(
    ['recentArticles', projects?.data?.[0]?.id],
    () => articleService.getArticles(projects?.data?.[0]?.id),
    {
      enabled: !!projects?.data?.[0]?.id,
      select: (data) => ({ 
        ...data, 
        data: data.data.slice(0, 5) // Get only the 5 most recent articles
      })
    }
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Projects Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Projects
                  </dt>
                  <dd>
                    {isLoadingProjects ? (
                      <div className="text-lg font-semibold text-gray-900">Loading...</div>
                    ) : projectsError ? (
                      <div className="text-sm text-red-600">Error loading projects</div>
                    ) : (
                      <div className="text-lg font-semibold text-gray-900">
                        {projects?.data?.length || 0}
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <Link to="/projects" className="font-medium text-indigo-600 hover:text-indigo-500">
                View all projects
                <span aria-hidden="true"> &rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Videos Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Recent Videos
                  </dt>
                  <dd>
                    {isLoadingVideos || !projects?.data?.[0]?.id ? (
                      <div className="text-lg font-semibold text-gray-900">Loading...</div>
                    ) : videosError ? (
                      <div className="text-sm text-red-600">Error loading videos</div>
                    ) : (
                      <div className="text-lg font-semibold text-gray-900">
                        {recentVideos?.data?.length || 0} new videos
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            {projects?.data?.[0]?.id ? (
              <div className="text-sm">
                <Link to={`/projects/${projects.data[0].id}/videos`} className="font-medium text-indigo-600 hover:text-indigo-500">
                  View all videos
                  <span aria-hidden="true"> &rarr;</span>
                </Link>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Create a project to view videos
              </div>
            )}
          </div>
        </div>

        {/* Articles Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Generated Articles
                  </dt>
                  <dd>
                    {isLoadingArticles || !projects?.data?.[0]?.id ? (
                      <div className="text-lg font-semibold text-gray-900">Loading...</div>
                    ) : articlesError ? (
                      <div className="text-sm text-red-600">Error loading articles</div>
                    ) : (
                      <div className="text-lg font-semibold text-gray-900">
                        {recentArticles?.data?.length || 0} recent articles
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            {projects?.data?.[0]?.id ? (
              <div className="text-sm">
                <Link to={`/projects/${projects.data[0].id}/articles`} className="font-medium text-indigo-600 hover:text-indigo-500">
                  View all articles
                  <span aria-hidden="true"> &rarr;</span>
                </Link>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Create a project to view articles
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <h2 className="mt-8 text-lg font-medium text-gray-900">Recent Videos</h2>
      {isLoadingVideos || !projects?.data?.[0]?.id ? (
        <p className="mt-2 text-sm text-gray-500">Loading recent videos...</p>
      ) : videosError ? (
        <p className="mt-2 text-sm text-red-600">Error loading recent videos</p>
      ) : recentVideos?.data?.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">No recent videos found</p>
      ) : (
        <div className="mt-2 bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {recentVideos?.data?.map((video) => (
              <li key={video.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {video.title}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {video.processed ? 'Processed' : 'Pending'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {new Date(video.published_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Actions */}
      <h2 className="mt-8 text-lg font-medium text-gray-900">Quick Actions</h2>
      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <Link to="/projects" className="focus:outline-none">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-900">Create New Project</p>
              <p className="text-sm text-gray-500">Set up a new project with YouTube channels and WordPress</p>
            </Link>
          </div>
        </div>

        {projects?.data?.[0]?.id && (
          <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <button 
                onClick={triggerCheckForNewVideos} 
                className="focus:outline-none w-full text-left"
                disabled={isCheckingVideos}
              >
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">
                  {isCheckingVideos ? 'Checking Videos...' : 'Check for New Videos'}
                </p>
                <p className="text-sm text-gray-500">
                  {monitoringResult ? 
                    `Last check: ${monitoringResult.newVideosCount} new videos found` : 
                    'Manually check for new videos from your channels'}
                </p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
