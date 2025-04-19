import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { projectService } from '../services/api';

const ProjectDetail = () => {
  const { projectId } = useParams();
  
  // Fetch project details
  const { data, isLoading, error } = useQuery(
    ['project', projectId],
    () => projectService.getProject(projectId)
  );

  if (isLoading) {
    return <div className="text-center py-10">Loading project details...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600">
        Error loading project: {error.message}
      </div>
    );
  }

  const project = data?.data;

  if (!project) {
    return <div className="text-center py-10">Project not found</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
        <div className="flex space-x-3">
          <Link
            to={`/projects/${projectId}/wordpress`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            WordPress Sites
          </Link>
          <Link
            to={`/projects/${projectId}/youtube`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            YouTube Channels
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Project Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about your monitoring project.</p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Project Name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{project.name}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {project.description || 'No description provided'}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(project.created_at).toLocaleString()}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(project.updated_at).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">WordPress Sites</h3>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {project.wordpressSites?.length || 0}
            </div>
            <p className="mt-3 text-sm text-gray-500">
              WordPress sites configured for content publishing.
            </p>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <Link to={`/projects/${projectId}/wordpress`} className="font-medium text-indigo-600 hover:text-indigo-500">
                View WordPress Sites <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">YouTube Channels</h3>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {project.youtubeChannels?.length || 0}
            </div>
            <p className="mt-3 text-sm text-gray-500">
              YouTube channels being monitored for new videos.
            </p>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <Link to={`/projects/${projectId}/youtube`} className="font-medium text-indigo-600 hover:text-indigo-500">
                View YouTube Channels <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Generated Content</h3>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              -
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Articles generated from video transcripts.
            </p>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <Link to={`/projects/${projectId}/articles`} className="font-medium text-indigo-600 hover:text-indigo-500">
                View Articles <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Recent Videos</h2>
          <Link
            to={`/projects/${projectId}/videos`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            View All Videos
          </Link>
        </div>
        <div className="mt-2 flex flex-col">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              <li>
                <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  No videos found yet. Videos will appear here when they are detected.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
