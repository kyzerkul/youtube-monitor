import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { llmService, projectService } from '../services/api';

const Settings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('llm');
  
  // Get all projects for LLM settings
  const { data: projectsData } = useQuery(
    ['projects'],
    () => projectService.getProjects()
  );
  
  // State for LLM settings form
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [provider, setProvider] = useState('mistral');
  const [modelName, setModelName] = useState('mistral-large-latest');
  const [apiKey, setApiKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  
  // Fetch LLM settings when a project is selected
  const { data: llmSettingsData, refetch: refetchLLMSettings } = useQuery(
    ['llmSettings', selectedProjectId],
    () => llmService.getLLMSettings(selectedProjectId),
    {
      enabled: !!selectedProjectId,
      onSuccess: (data) => {
        if (data?.data) {
          setProvider(data.data.provider || 'mistral');
          setModelName(data.data.model_name || 'mistral-large-latest');
          setApiKey('');
        }
      }
    }
  );
  
  // Update LLM settings mutation
  const updateLLMSettingsMutation = useMutation(
    (data) => llmService.updateLLMSettings(data.projectId, data.settings),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['llmSettings', selectedProjectId]);
        alert('LLM settings updated successfully');
        setVerificationResult(null);
      }
    }
  );
  
  // Verify LLM API key mutation
  const verifyLLMApiKeyMutation = useMutation(
    (data) => llmService.verifyLLMApiKey(data),
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
          message: 'Error verifying API key: ' + (error.message || 'Unknown error')
        });
        setIsVerifying(false);
      }
    }
  );
  
  // Update selectedProjectId when projects are loaded
  useEffect(() => {
    if (projectsData?.data && projectsData.data.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projectsData.data[0].id);
    }
  }, [projectsData, selectedProjectId]);
  
  // Handle model change based on provider
  useEffect(() => {
    // Set default model based on provider
    if (provider === 'mistral') {
      setModelName('mistral-large-latest');
    } else if (provider === 'openai') {
      setModelName('gpt-4o');
    } else if (provider === 'anthropic') {
      setModelName('claude-3-haiku');
    }
  }, [provider]);
  
  // Handle LLM settings form submission
  const handleLLMSettingsSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedProjectId || !provider || !modelName) {
      alert('Please fill in all required fields');
      return;
    }
    
    // If API key was provided, require verification
    if (apiKey && (!verificationResult || !verificationResult.valid)) {
      alert('Please verify the API key before saving');
      return;
    }
    
    // Prepare settings data
    const settingsData = {
      provider,
      model_name: modelName
    };
    
    // Only include API key if provided
    if (apiKey) {
      settingsData.api_key = apiKey;
    }
    
    // Update settings
    updateLLMSettingsMutation.mutate({
      projectId: selectedProjectId,
      settings: settingsData
    });
  };
  
  // Verify API key
  const verifyApiKey = () => {
    if (!apiKey) {
      setVerificationResult({
        valid: false,
        message: 'Please enter an API key'
      });
      return;
    }
    
    setIsVerifying(true);
    setVerificationResult(null);
    
    verifyLLMApiKeyMutation.mutate({
      provider,
      api_key: apiKey
    });
  };
  
  // Render settings based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'llm':
        return (
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">LLM Configuration</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Configure the AI model settings for article generation.
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <form onSubmit={handleLLMSettingsSubmit} className="space-y-6">
                <div>
                  <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
                    Project
                  </label>
                  <select
                    id="projectId"
                    name="projectId"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    required
                  >
                    <option value="">Select a project</option>
                    {projectsData?.data?.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
                    LLM Provider
                  </label>
                  <select
                    id="provider"
                    name="provider"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    required
                  >
                    <option value="mistral">Mistral AI</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="modelName" className="block text-sm font-medium text-gray-700">
                    Model Name
                  </label>
                  <select
                    id="modelName"
                    name="modelName"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    required
                  >
                    {provider === 'mistral' && (
                      <>
                        <option value="mistral-large-latest">Mistral Large (Latest)</option>
                        <option value="mistral-medium">Mistral Medium</option>
                        <option value="mistral-small">Mistral Small</option>
                      </>
                    )}
                    {provider === 'openai' && (
                      <>
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </>
                    )}
                    {provider === 'anthropic' && (
                      <>
                        <option value="claude-3-haiku">Claude 3 Haiku</option>
                        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                        <option value="claude-3-opus">Claude 3 Opus</option>
                      </>
                    )}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                    API Key {llmSettingsData?.data?.api_key ? '(Already Set)' : ''}
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="password"
                      name="apiKey"
                      id="apiKey"
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300"
                      placeholder={llmSettingsData?.data?.api_key ? '••••••••••••••••' : 'Enter your API key'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={verifyApiKey}
                      disabled={!apiKey || isVerifying}
                      className={`inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm ${
                        !apiKey || isVerifying ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                      }`}
                    >
                      {isVerifying ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Leave blank to keep using the existing API key.
                  </p>
                  
                  {verificationResult && (
                    <div className={`mt-2 text-sm ${verificationResult.valid ? 'text-green-600' : 'text-red-600'}`}>
                      {verificationResult.message}
                    </div>
                  )}
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={updateLLMSettingsMutation.isLoading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {updateLLMSettingsMutation.isLoading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Appearance Settings</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Customize the appearance of the application.
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <p className="text-sm text-gray-500">Appearance settings are not yet available.</p>
            </div>
          </div>
        );
      case 'account':
        return (
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Account Settings</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Manage your account settings and preferences.
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <p className="text-sm text-gray-500">Account settings are not yet available.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      
      <div className="mt-6">
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">Select a tab</label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            <option value="llm">LLM Settings</option>
            <option value="appearance">Appearance</option>
            <option value="account">Account</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('llm')}
                className={`${
                  activeTab === 'llm'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                LLM Settings
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`${
                  activeTab === 'appearance'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Appearance
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`${
                  activeTab === 'account'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Account
              </button>
            </nav>
          </div>
        </div>
        
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Settings;
