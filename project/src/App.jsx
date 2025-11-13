import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import { AudioProvider } from './contexts/AudioContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import MoodCheckin from './pages/MoodCheckin';
import Journal from './pages/Journal';
import Recommendations from './pages/Recommendations';
import Challenges from './pages/Challenges';
import Activities from './pages/Activities';
import ReflectionWall from './pages/ReflectionWall';
import PositivityDrops from './pages/PositivityDrops';
import FutureLetters from './pages/FutureLetters';
import NatureSounds from './pages/NatureSounds';
import Chatbot from './pages/Chatbot';
import Landing from './pages/Landing';
import VoiceEmotion from './pages/VoiceEmotion';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('mindpeace-auth') === 'true';
  const hasOnboarded = localStorage.getItem('mindpeace-onboarded') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }
  
  if (!hasOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return children;
};

// Auth Route Component - for welcome/landing page
const AuthRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('mindpeace-auth') === 'true';
  const hasOnboarded = localStorage.getItem('mindpeace-onboarded') === 'true';
  
  if (isAuthenticated && hasOnboarded) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// New dedicated OnboardingRoute component
const OnboardingRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('mindpeace-auth') === 'true';
  const hasOnboarded = localStorage.getItem('mindpeace-onboarded') === 'true';
  
  if (!isAuthenticated) return <Navigate to="/welcome" replace />;
  if (hasOnboarded) return <Navigate to="/" replace />;
  return children;
};

function App() {
  useEffect(() => {
    // Initialize theme
    const savedTheme = localStorage.getItem('mindpeace-theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <ThemeProvider>
      <UserProvider>
        <AudioProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
              <Routes>
                {/* Public Routes */}
                <Route 
                  path="/welcome" 
                  element={
                    <AuthRoute>
                      <Landing />
                    </AuthRoute>
                  } 
                />
                <Route 
                  path="/onboarding" 
                  element={
                    <OnboardingRoute>
                      <Onboarding />
                    </OnboardingRoute>
                  } 
                />
                
                {/* Protected Routes */}
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Home />} />
                  <Route path="mood-checkin" element={<MoodCheckin />} />
                  <Route path="journal" element={<Journal />} />
                  <Route path="recommendations" element={<Recommendations />} />
                  <Route path="challenges" element={<Challenges />} />
                  <Route path="activities" element={<Activities />} />
                  <Route path="reflection-wall" element={<ReflectionWall />} />
                  <Route path="positivity" element={<PositivityDrops />} />
                  <Route path="future-letters" element={<FutureLetters />} />
                  <Route path="nature-sounds" element={<NatureSounds />} />
                  <Route path="chat" element={<Chatbot />} />
                  <Route path="voice-emotion" element={<VoiceEmotion />} />
                </Route>
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/welcome" replace />} />
              </Routes>
            </div>
          </Router>
        </AudioProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

// Prop validations
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

AuthRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

OnboardingRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default App;