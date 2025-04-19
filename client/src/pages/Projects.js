import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { projectService } from '../services/api';

// Icons
import { FolderIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

const Projects = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('fr');
  const [autoMonitoring, setAutoMonitoring] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Fetch projects
  const { data, isLoading, error } = useQuery('projects', projectService.getProjects);
  
  // Create project mutation
  const createProjectMutation = useMutation(projectService.createProject, {
    onSuccess: () => {
      queryClient.invalidateQueries('projects');
      resetForm();
    }
  });
  
  // Update project mutation
  const updateProjectMutation = useMutation(
    (data) => projectService.updateProject(data.id, { name: data.name, description: data.description }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects');
        resetForm();
      }
    }
  );
  
  // Delete project mutation
  const deleteProjectMutation = useMutation(projectService.deleteProject, {
    onSuccess: () => {
      queryClient.invalidateQueries('projects');
    }
  });
  
  // Open modal for creating a new project
  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };
  
  // Open modal for editing a project
  const openEditModal = (project) => {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || '');
    setLanguage(project.language || 'fr');
    setAutoMonitoring(project.auto_monitoring || false);
    setIsModalOpen(true);
  };
  
  // Reset form and close modal
  const resetForm = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setLanguage('fr');
    setAutoMonitoring(false);
    setIsModalOpen(false);
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name) return;
    
    if (editingProject) {
      updateProjectMutation.mutate({
        id: editingProject.id,
        name,
        description,
        language,
        auto_monitoring: autoMonitoring
      });
    } else {
      createProjectMutation.mutate({
        name,
        description,
        language,
        auto_monitoring: autoMonitoring
      });
    }
  };
  
  // Handle project deletion
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this project? This will delete all associated data.')) {
      deleteProjectMutation.mutate(id);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Project
        </button>
      </div>
      
      {/* Projects list */}
      {isLoading ? (
        <div className="mt-6 text-center">Loading projects...</div>
      ) : error ? (
        <div className="mt-6 text-center text-red-600">Error loading projects: {error.message}</div>
      ) : data?.data?.length === 0 ? (
        <div className="mt-6 text-center text-gray-500">
          No projects found. Create your first project to get started.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data?.map((project) => (
            <div key={project.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                    <FolderIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <Link to={`/projects/${project.id}`} className="text-lg font-medium text-gray-900 hover:text-indigo-600">
                      {project.name}
                    </Link>
                    <p className="mt-1 text-sm text-gray-500">
                      {project.description || 'No description provided'}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Created: {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3 flex justify-between">
                <Link
                  to={`/projects/${project.id}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  View details
                </Link>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(project)}
                    className="text-gray-500 hover:text-indigo-600"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Create/Edit Project Modal */}
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
                        {editingProject ? 'Edit Project' : 'Create New Project'}
                      </h3>
                      <div className="mt-6 space-y-6">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Project Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            rows={3}
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                          />
                        </div>
                        <div>
                          <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                            Langue des articles
                          </label>
                          <select
                            id="language"
                            name="language"
                            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                          >
                            <option value="fr">Français</option>
                            <option value="en">Anglais</option>
                          </select>
                        </div>
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
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={createProjectMutation.isLoading || updateProjectMutation.isLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {createProjectMutation.isLoading || updateProjectMutation.isLoading
                      ? 'Saving...'
                      : editingProject
                      ? 'Update Project'
                      : 'Create Project'}
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

export default Projects;
