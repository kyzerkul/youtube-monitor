import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthContext } from '../contexts/AuthContext';

const DevLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated, setAuthState, isDev } = useAuthContext();

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleDevLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Direct API call to bypass the regular auth flow
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/dev-login`);
      
      if (response.data && response.data.token) {
        // Update auth state with token and user
        setAuthState(response.data.token, response.data.user);
        
        // Navigate without page refresh to prevent auth context reset
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } else {
        setError('Dev login failed. Please check server logs.');
      }
    } catch (err) {
      console.error('Dev login error:', err);
      setError(err.response?.data?.message || 'Connection to server failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Development Mode {isDev ? '(Enabled)' : '(Disabled)'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            This is for development purposes only
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8">
          <button
            onClick={handleDevLogin}
            disabled={isLoading}
            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            {isLoading ? 'Connecting...' : 'Login as Admin (Development)'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DevLogin;
