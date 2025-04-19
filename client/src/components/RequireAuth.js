import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

// Global bypass mode - when set to true, authentication is completely bypassed
// ONLY USE THIS FOR DEVELOPMENT - DO NOT USE IN PRODUCTION
const BYPASS_AUTH = true;

/**
 * Component that requires authentication to access children
 * Redirects to login page if user is not authenticated
 */
const RequireAuth = ({ children }) => {
  const { isAuthenticated, isInitialized, isDev } = useAuthContext();
  const location = useLocation();

  // Dev bypass mode - completely skip auth check
  if (BYPASS_AUTH && isDev) {
    console.log('*** DEV MODE: Auth check bypassed ***');
    return children;
  }

  // If auth is not initialized yet, don't render anything
  if (!isInitialized) {
    return null;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render children
  return children;
};

export default RequireAuth;
