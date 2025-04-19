import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from './contexts/AuthContext';

// Pages
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import DevLogin from './pages/DevLogin';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import WordPressSites from './pages/WordPressSites';
import YouTubeChannels from './pages/YouTubeChannels';
import Videos from './pages/Videos';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import Settings from './pages/Settings';

// Components
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';

function App() {
  const { isInitialized } = useAuthContext();

  // Don't render routes until auth is initialized
  if (!isInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/dev-login" element={<DevLogin />} />
      
      {/* Protected routes */}
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<ProjectDetail />} />
        <Route path="/projects/:projectId/wordpress" element={<WordPressSites />} />
        <Route path="/projects/:projectId/youtube" element={<YouTubeChannels />} />
        <Route path="/projects/:projectId/videos" element={<Videos />} />
        <Route path="/projects/:projectId/articles" element={<Articles />} />
        <Route path="/articles/:articleId" element={<ArticleDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
