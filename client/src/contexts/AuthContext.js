import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuthContext = () => useContext(AuthContext);

// Authentication provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  
  const navigate = useNavigate();
  
  // Flag to track if we're in development mode
  const isDev = process.env.NODE_ENV === 'development';
  const devAdminInfo = {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Admin User (Dev)',
    email: 'admin@example.com',
    isAdmin: true
  };

  // Function to manually set authentication state (for dev mode)
  const setAuthState = (newToken, newUser) => {
    console.log('Setting auth state:', { newToken: !!newToken, newUser });
    setToken(newToken);
    setUser(newUser);
    if (newToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      localStorage.setItem('token', newToken);
    }
  };

  // Initialize auth state on component mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        try {
          setIsLoading(true);
          
          // Set the token for all future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // In dev mode, we can bypass the token verification
          if (isDev && window.location.pathname.includes('/dev-login')) {
            console.log('Development mode: bypassing token verification');
            setUser(devAdminInfo);
            setToken(storedToken);
            setIsLoading(false);
            setIsInitialized(true);
            return;
          }

          // Fetch current user info
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/me`);
          
          setUser(response.data);
          setToken(storedToken);
        } catch (err) {
          console.error('Failed to initialize auth:', err);
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
        } finally {
          setIsLoading(false);
          setIsInitialized(true);
        }
      } else {
        setIsInitialized(true);
      }
    };
    
    initAuth();
  }, [isDev]);
  
  // Login function
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        email,
        password
      });
      
      const { token: newToken, user: userData } = response.data;
      
      // Store token in localStorage and state
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      // Set token for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Set user data from response
      setUser(userData);
      
      // Redirect to dashboard
      navigate('/dashboard');
      
      return true;
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Signup function
  const signup = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      setSignupSuccess(false);
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/signup`, userData);
      
      const { token: newToken, user: newUser } = response.data;
      
      // Store token in localStorage and state
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      // Set token for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Set user data
      setUser(newUser);
      
      setSignupSuccess(true);
      
      // Redirect to dashboard
      navigate('/dashboard');
      
      return true;
    } catch (err) {
      console.error('Signup failed:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again later.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  };
  
  // Provide the auth context to children
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isInitialized,
        isLoading,
        error,
        signupSuccess,
        login,
        signup,
        logout,
        // Helper method for dev mode
        setAuthState,
        // Flag for dev mode
        isDev
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
