import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Brain, 
  Heart, 
  Sparkles, 
  Moon, 
  Sun, 
  ArrowRight,
  CheckCircle,
  Users,
  Shield,
  Zap
} from 'lucide-react';
import AuthForms from '../components/AuthForms';

const Landing = () => {
  const navigate = useNavigate();
  const { login } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [showAuth, setShowAuth] = useState(false);

  const handleLogin = async (userData) => {
    try {
      login(userData);
      navigate('/onboarding');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const features = [
    {
      icon: Brain,
      title: "Personalized Mental Health Insights",
      description: "AI-powered recommendations based on your unique psychological profile and daily patterns."
    },
    {
      icon: Heart,
      title: "Mood Tracking & Analytics",
      description: "Track your emotional journey with beautiful visualizations and meaningful insights."
    },
    {
      icon: Sparkles,
      title: "Healing Activities & Challenges",
      description: "Engage with curated mindfulness exercises, gratitude practices, and wellness challenges."
    },
    {
      icon: Users,
      title: "Supportive Community",
      description: "Connect with others on similar journeys through our reflection wall and community features."
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Your mental health data is encrypted and completely private. You're in full control."
    },
    {
      icon: Zap,
      title: "Smart Recommendations",
      description: "Get personalized suggestions for activities, music, and content based on your current mood."
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      text: "MindPeace helped me understand my emotional patterns better than any app I've tried before.",
      rating: 5
    },
    {
      name: "David L.",
      text: "The personalized recommendations are spot-on. It's like having a mental health coach in my pocket.",
      rating: 5
    },
    {
      name: "Emma R.",
      text: "The community features made me feel less alone in my journey. Highly recommend!",
      rating: 5
    }
  ];

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
        <AuthForms onLogin={handleLogin} onBack={() => setShowAuth(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      {/* Header */}
      <header className="relative z-10 px-4 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">MindPeace</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowAuth(true)}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Your Journey to
              <span className="block bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Mental Wellness
              </span>
              Starts Here
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover personalized insights, track your emotional journey, and connect with a supportive community. 
              Your mental health matters, and we're here to help every step of the way.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button
              onClick={() => setShowAuth(true)}
              className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl font-semibold text-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-lg">
              Learn More
            </button>
          </div>

          {/* Stats - FIXED: Changed from {{ to {[ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {[
              { number: "10K+", label: "Happy Users" },
              { number: "95%", label: "Satisfaction Rate" },
              { number: "24/7", label: "Support Available" },
              { number: "500+", label: "Guided Activities" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Why Choose MindPeace?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We combine cutting-edge technology with proven psychological principles to create 
              a truly personalized mental wellness experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-600 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-16">
            What Our Users Say
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 shadow-lg"
              >
                <div className="flex justify-center mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                  "{testimonial.text}"
                </p>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {testimonial.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Mental Wellness?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who have already started their journey to better mental health.
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            Get Started for Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-12 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">MindPeace</span>
          </div>
          <p className="text-gray-400 mb-6">
            Your mental health companion for a brighter tomorrow.
          </p>
          <div className="text-sm text-gray-500">
            © 2024 MindPeace. Made with ❤️ for mental wellness.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;


