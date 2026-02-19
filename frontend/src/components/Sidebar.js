import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Calendar,
  GraduationCap,
  LogOut,
  Menu,
  X,
  CheckSquare,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileCircle from './ProfileCircle';

const Sidebar = ({ classes = [], userRole = 'STUDENT' }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const backgroundColors = [
    '#4285F4', '#DB4437', '#F4B400', '#0F9D58',
    '#673AB7', '#FF5722', '#795548', '#607D8B',
  ];

  const mainNavItems = userRole === 'TEACHER'
    ? [
      { icon: Home, label: 'Home', path: '/dashboard' },
      { icon: Calendar, label: 'Calendar', path: '/dashboard/calendar' },
      { icon: GraduationCap, label: 'Teaching', path: '/dashboard/teaching' },
    ]
    : [
      { icon: Home, label: 'Home', path: '/dashboard' },
      { icon: Calendar, label: 'Calendar', path: '/dashboard/calendar' },
      { icon: Users, label: 'Enrolled', path: '/dashboard/enrolled' },
    ];

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-40 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-gray-900">LearnSphere</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1 mb-6">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <motion.button
                  key={item.path}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(item.path)}
                  className={`w-full sidebar-link ${active ? 'sidebar-link-active' : ''}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </motion.button>
              );
            })}
          </div>

          {/* Classes Section */}
          {classes.length > 0 && (
            <>
              {!isCollapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Classes
                </div>
              )}
              <div className="space-y-1">
                {classes.map((cls, index) => (
                  <motion.button
                    key={cls.id}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (userRole === 'TEACHER') {
                        navigate(`/teacher/class/${cls.id}`);
                      } else {
                        navigate(`/class/${cls.id}`);
                      }
                    }}
                    className="w-full sidebar-link"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                      style={{
                        backgroundColor: backgroundColors[index % backgroundColors.length]
                      }}
                    >
                      {cls.name?.charAt(0) || 'C'}
                    </div>
                    {!isCollapsed && (
                      <span className="truncate text-sm">{cls.name}</span>
                    )}
                  </motion.button>
                ))}
              </div>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          {/* Profile Circle */}
          {!isCollapsed && user && (
            <ProfileCircle />
          )}
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full sidebar-link text-error-600 hover:bg-error-50 mt-2"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;

