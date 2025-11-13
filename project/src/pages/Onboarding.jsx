import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { 
  Brain, 
  Heart, 
  Target, 
  Calendar, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  Sparkles
} from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const { updateUser } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    goals: [],
    preferredActivities: [],
    mentalHealthFocus: [],
    notifications: true,
    reminderTime: '09:00'
  });

  const steps = [
    {
      title: "Welcome to MindPeace! 🌟",
      subtitle: "Let's personalize your mental wellness journey",
      component: WelcomeStep
    },
    {
      title: "What are your wellness goals?",
      subtitle: "Select all that apply to you",
      component: GoalsStep
    },
    {
      title: "Preferred Activities",
      subtitle: "What activities interest you most?",
      component: ActivitiesStep
    },
    {
      title: "Mental Health Focus",
      subtitle: "What would you like to work on?",
      component: FocusStep
    },
    {
      title: "Notification Preferences",
      subtitle: "How would you like to stay engaged?",
      component: NotificationsStep
    },
    {
      title: "You're All Set! 🎉",
      subtitle: "Welcome to your personalized wellness journey",
      component: CompletionStep
    }
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    console.log('Starting onboarding completion...');
    
    try {
      // Update user with onboarding completion and preferences
      updateUser({ onboardingCompleted: true, preferences: formData });
      console.log('User updated with onboarding completion');
      
      // Set onboarding completion flag
      localStorage.setItem('mindpeace-onboarded', 'true');
      console.log('LocalStorage onboarded flag set');
      
      // Set session flag to show welcome message on home page
      sessionStorage.setItem('mindpeace-just-onboarded', 'true');
      console.log('SessionStorage welcome flag set');
      
      // Small delay to ensure localStorage is written
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate to home dashboard
      console.log('Navigating to home dashboard...');
      navigate('/', { replace: true });
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Fallback navigation
      navigate('/');
    }
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
            <div 
              className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {steps[currentStep].title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {steps[currentStep].subtitle}
            </p>
          </div>

          <CurrentStepComponent 
            formData={formData}
            updateFormData={updateFormData}
            onCompleteOnboarding={completeOnboarding}
          />

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105"
            >
              <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step Components
function WelcomeStep() {
  return (
    <div className="text-center py-8">
      <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <Brain className="w-12 h-12 text-white" />
      </div>
      <div className="max-w-2xl mx-auto">
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          We&apos;re excited to help you on your mental wellness journey. This quick setup will help us 
          personalize your experience and provide you with the most relevant content and activities.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="text-center">
            <Heart className="w-12 h-12 text-pink-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Track Your Mood</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monitor your emotional patterns and gain insights
            </p>
          </div>
          <div className="text-center">
            <Target className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Set Goals</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create personalized wellness objectives
            </p>
          </div>
          <div className="text-center">
            <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Get Guidance</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Receive AI-powered recommendations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalsStep({ formData, updateFormData }) {
  const goals = [
    { id: 'stress', label: 'Reduce Stress', icon: '🧘', description: 'Learn relaxation techniques' },
    { id: 'anxiety', label: 'Manage Anxiety', icon: '💭', description: 'Develop coping strategies' },
    { id: 'sleep', label: 'Better Sleep', icon: '😴', description: 'Improve sleep quality' },
    { id: 'mood', label: 'Boost Mood', icon: '😊', description: 'Enhance emotional well-being' },
    { id: 'focus', label: 'Improve Focus', icon: '🎯', description: 'Increase concentration' },
    { id: 'confidence', label: 'Build Confidence', icon: '💪', description: 'Strengthen self-esteem' },
    { id: 'relationships', label: 'Better Relationships', icon: '❤️', description: 'Improve connections' },
    { id: 'mindfulness', label: 'Practice Mindfulness', icon: '🌸', description: 'Be more present' }
  ];

  const toggleGoal = (goalId) => {
    const currentGoals = formData.goals || [];
    const newGoals = currentGoals.includes(goalId)
      ? currentGoals.filter(id => id !== goalId)
      : [...currentGoals, goalId];
    updateFormData('goals', newGoals);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {goals.map((goal) => (
        <button
          key={goal.id}
          onClick={() => toggleGoal(goal.id)}
          className={`p-4 rounded-lg border-2 text-left transition-all duration-300 hover:scale-105 ${
            formData.goals?.includes(goal.id)
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
          }`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{goal.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{goal.label}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{goal.description}</p>
            </div>
            {formData.goals?.includes(goal.id) && (
              <CheckCircle className="w-6 h-6 text-purple-500 ml-auto" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function ActivitiesStep({ formData, updateFormData }) {
  const activities = [
    { id: 'meditation', label: 'Meditation', icon: '🧘' },
    { id: 'journaling', label: 'Journaling', icon: '📝' },
    { id: 'breathing', label: 'Breathing Exercises', icon: '💨' },
    { id: 'nature', label: 'Nature Sounds', icon: '🌿' },
    { id: 'gratitude', label: 'Gratitude Practice', icon: '🙏' },
    { id: 'affirmations', label: 'Positive Affirmations', icon: '✨' },
    { id: 'music', label: 'Relaxing Music', icon: '🎵' },
    { id: 'reading', label: 'Mindful Reading', icon: '📚' }
  ];

  const toggleActivity = (activityId) => {
    const currentActivities = formData.preferredActivities || [];
    const newActivities = currentActivities.includes(activityId)
      ? currentActivities.filter(id => id !== activityId)
      : [...currentActivities, activityId];
    updateFormData('preferredActivities', newActivities);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {activities.map((activity) => (
        <button
          key={activity.id}
          onClick={() => toggleActivity(activity.id)}
          className={`p-4 rounded-lg border-2 text-center transition-all duration-300 hover:scale-105 ${
            formData.preferredActivities?.includes(activity.id)
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
          }`}
        >
          <div className="text-3xl mb-2">{activity.icon}</div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">{activity.label}</div>
          {formData.preferredActivities?.includes(activity.id) && (
            <CheckCircle className="w-5 h-5 text-purple-500 mx-auto mt-2" />
          )}
        </button>
      ))}
    </div>
  );
}

function FocusStep({ formData, updateFormData }) {
  const focusAreas = [
    { id: 'depression', label: 'Depression Support', description: 'Tools for managing low moods' },
    { id: 'anxiety', label: 'Anxiety Management', description: 'Techniques for reducing worry' },
    { id: 'stress', label: 'Stress Relief', description: 'Methods for relaxation' },
    { id: 'trauma', label: 'Trauma Recovery', description: 'Gentle healing approaches' },
    { id: 'grief', label: 'Grief Support', description: 'Coping with loss' },
    { id: 'addiction', label: 'Addiction Recovery', description: 'Building healthy habits' }
  ];

  const toggleFocus = (focusId) => {
    const currentFocus = formData.mentalHealthFocus || [];
    const newFocus = currentFocus.includes(focusId)
      ? currentFocus.filter(id => id !== focusId)
      : [...currentFocus, focusId];
    updateFormData('mentalHealthFocus', newFocus);
  };

  return (
    <div>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 This information helps us provide more relevant content. All data is kept private and secure.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {focusAreas.map((focus) => (
          <button
            key={focus.id}
            onClick={() => toggleFocus(focus.id)}
            className={`p-4 rounded-lg border-2 text-left transition-all duration-300 hover:scale-105 ${
              formData.mentalHealthFocus?.includes(focus.id)
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{focus.label}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{focus.description}</p>
              </div>
              {formData.mentalHealthFocus?.includes(focus.id) && (
                <CheckCircle className="w-6 h-6 text-purple-500" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function NotificationsStep({ formData, updateFormData }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Daily Reminders</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get gentle reminders to check in with yourself
            </p>
          </div>
          <button
            onClick={() => updateFormData('notifications', !formData.notifications)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.notifications ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.notifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        {formData.notifications && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preferred reminder time
            </label>
            <input
              type="time"
              value={formData.reminderTime}
              onChange={(e) => updateFormData('reminderTime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        )}
      </div>

      <div className="text-center">
        <Calendar className="w-16 h-16 text-purple-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Stay Consistent
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Regular check-ins help build lasting mental wellness habits
        </p>
      </div>
    </div>
  );
}

function CompletionStep({ onCompleteOnboarding }) {
  return (
    <div className="text-center py-8">
      <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-12 h-12 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Welcome to MindPeace! 🎉
      </h2>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
        Your personalized mental wellness journey is ready to begin. 
        We&apos;ve customized your experience based on your preferences.
      </p>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          🎯 Click &quot;Get Started&quot; below to go to your personalized dashboard
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Heart className="w-6 h-6 text-purple-600" />
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white">Personalized</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">Tailored to your goals</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Brain className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white">AI-Powered</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">Smart recommendations</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white">Supportive</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">Community experience</p>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;