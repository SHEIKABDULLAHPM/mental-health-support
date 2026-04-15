import { lazy, Suspense, useEffect } from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import { AudioProvider } from './contexts/AudioContext';
import AppErrorBoundary from './components/AppErrorBoundary';
import Layout from './components/Layout';

const Home = lazy(() => import('./pages/Home'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const MoodCheckin = lazy(() => import('./pages/MoodCheckin'));
const Journal = lazy(() => import('./pages/Journal'));
const Recommendations = lazy(() => import('./pages/Recommendations'));
const Challenges = lazy(() => import('./pages/Challenges'));
const Activities = lazy(() => import('./pages/Activities'));
const ReflectionWall = lazy(() => import('./pages/ReflectionWall'));
const PositivityDrops = lazy(() => import('./pages/PositivityDrops'));
const FutureLetters = lazy(() => import('./pages/FutureLetters'));
const NatureSounds = lazy(() => import('./pages/NatureSounds'));
const Chatbot = lazy(() => import('./pages/Chatbot'));
const Landing = lazy(() => import('./pages/Landing'));
const VoiceEmotion = lazy(() => import('./pages/VoiceEmotion'));

const RouteLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
      Loading page...
    </div>
  </div>
);

const hasSessionToken = () => {
  const directToken = localStorage.getItem('mindpeace-token');
  if (directToken) return true;
  try {
    const savedUser = localStorage.getItem('mindpeace-user');
    if (!savedUser) return false;
    const user = JSON.parse(savedUser);
    return Boolean(user?.token || user?.access_token || user?.accessToken);
  } catch {
    return false;
  }
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('mindpeace-auth') === 'true';
  const hasToken = hasSessionToken();
  const hasOnboarded = localStorage.getItem('mindpeace-onboarded') === 'true';
  
  if (!isAuthenticated || !hasToken) {
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
  const hasToken = hasSessionToken();
  const hasOnboarded = localStorage.getItem('mindpeace-onboarded') === 'true';
  
  if (isAuthenticated && hasToken && hasOnboarded) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// New dedicated OnboardingRoute component
const OnboardingRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('mindpeace-auth') === 'true';
  const hasToken = hasSessionToken();
  const hasOnboarded = localStorage.getItem('mindpeace-onboarded') === 'true';
  
  if (!isAuthenticated || !hasToken) return <Navigate to="/welcome" replace />;
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
          <AppErrorBoundary>
            <Router basename={import.meta.env.BASE_URL}>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                <Suspense fallback={<RouteLoader />}>
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
                </Suspense>
              </div>
            </Router>
          </AppErrorBoundary>
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