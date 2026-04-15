// Sidebar component
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Heart,
  BookOpen,
  Music,
  Target,
  Activity,
  MessageCircle,
  Sparkles,
  Mail,
  Volume2,
  MessageSquare,
  Mic,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard', description: 'Your wellness overview' },
    { path: '/mood-checkin', icon: Heart, label: 'Mood Check-in', description: 'Track your daily emotions' },
    { path: '/journal', icon: BookOpen, label: 'Journal', description: 'Write and reflect' },
    { path: '/recommendations', icon: Music, label: 'Recommendations', description: 'Personalized wellness suggestions' },
    { path: '/challenges', icon: Target, label: 'Challenges', description: 'Join wellness challenges' },
    { path: '/activities', icon: Activity, label: 'Activities', description: 'Mindfulness and wellness activities' },
    { path: '/reflection-wall', icon: MessageCircle, label: 'Reflection Wall', description: 'Share and connect with others' },
    { path: '/positivity', icon: Sparkles, label: 'Positivity Drops', description: 'Daily inspiration and motivation' },
    { path: '/future-letters', icon: Mail, label: 'Future Letters', description: 'Write letters to your future self' },
    { path: '/nature-sounds', icon: Volume2, label: 'Nature Sounds', description: 'Relaxing ambient sounds' },
    { path: '/chat', icon: MessageSquare, label: 'Healing Chat', description: 'AI-powered mental health support' },
    { path: '/voice-emotion', icon: Mic, label: 'Voice Emotion', description: 'AI-powered voice emotion detection' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64 lg:flex lg:flex-col">
        <div className="flex-1 flex flex-col pt-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-r border-gray-200 dark:border-gray-700">
          <div className="flex-1 overflow-y-auto py-6">
            <nav className="px-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      }`
                    }
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="truncate">{item.label}</span>
                    </div>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        
        <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white dark:bg-gray-900 shadow-xl">
          {/* Mobile Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MP</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">MindPeace</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <div className="flex-1 overflow-y-auto py-6">
            <nav className="px-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      }`
                    }
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{item.label}</div>
                      <div className="text-xs opacity-75 truncate">{item.description}</div>
                    </div>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Sidebar;