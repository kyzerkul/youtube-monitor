import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

// Icons
import { 
  HomeIcon, 
  FolderIcon, 
  VideoCameraIcon, 
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Layout = () => {
  const { user, logout } = useAuthContext();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Navigation items
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Projects', href: '/projects', icon: FolderIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  // Helper to determine if a navigation item is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar for mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 overflow-y-auto transition-transform duration-300 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:hidden`}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
          <div className="text-xl text-white font-semibold">YT Monitor</div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-300 hover:text-white"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-5 px-2 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`${
                isActive(item.href)
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <item.icon
                className={`${
                  isActive(item.href) ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'
                } mr-3 flex-shrink-0 h-6 w-6`}
              />
              {item.name}
            </Link>
          ))}
        </nav>
        
        <div className="mt-auto p-4">
          <button
            onClick={logout}
            className="flex items-center w-full px-2 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
          >
            <ArrowRightOnRectangleIcon className="mr-3 h-6 w-6 text-gray-400" />
            Logout
          </button>
        </div>
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-gray-900">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-800">
              <div className="text-xl text-white font-semibold">YT Monitor</div>
            </div>
            
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive(item.href)
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        isActive(item.href) ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="p-4">
              <button
                onClick={logout}
                className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
              >
                <ArrowRightOnRectangleIcon className="mr-3 h-6 w-6 text-gray-400" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navigation bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="px-4 border-r border-gray-200 text-gray-500 md:hidden"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              {/* Page title could go here */}
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              <div className="text-sm font-medium text-gray-700">
                {user?.username || 'User'}
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
