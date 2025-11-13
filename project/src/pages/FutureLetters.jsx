import React, { useState } from 'react';
import { Mail, Calendar, Send, CreditCard as Edit, Clock, Heart } from 'lucide-react';

const FutureLetters = () => {
  const [activeTab, setActiveTab] = useState('write');
  const [letterContent, setLetterContent] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [letterTitle, setLetterTitle] = useState('');

  const scheduledLetters = [
    {
      id: 1,
      title: "New Year Reflections",
      scheduledFor: "2025-01-01",
      createdOn: "2024-01-15",
      preview: "Dear Future Me, As I write this, I'm filled with hope for what this year will bring...",
      status: "scheduled"
    },
    {
      id: 2,
      title: "6-Month Check-in",
      scheduledFor: "2024-07-15",
      createdOn: "2024-01-15",
      preview: "I hope by the time you read this, you've made progress on your wellness goals...",
      status: "scheduled"
    },
    {
      id: 3,
      title: "Birthday Letter",
      scheduledFor: "2024-12-25",
      createdOn: "2024-01-10",
      preview: "Happy birthday! I wonder what amazing things you've accomplished this year...",
      status: "scheduled"
    }
  ];

  const deliveredLetters = [
    {
      id: 4,
      title: "One Month Later",
      scheduledFor: "2023-12-15",
      createdOn: "2023-11-15",
      preview: "I wrote this a month ago when I was feeling uncertain about starting my wellness journey...",
      status: "delivered",
      readOn: "2023-12-15"
    }
  ];

  const letterPrompts = [
    "What do you hope to have accomplished by then?",
    "What challenges are you facing right now that you hope will be resolved?",
    "What advice would you give your future self?",
    "What are you most grateful for in this moment?",
    "What dreams are you working toward?",
    "How do you hope to have grown as a person?"
  ];

  const timeOptions = [
    { value: '1week', label: '1 Week', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { value: '1month', label: '1 Month', date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    { value: '3months', label: '3 Months', date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
    { value: '6months', label: '6 Months', date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) },
    { value: '1year', label: '1 Year', date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    { value: 'custom', label: 'Custom Date', date: null }
  ];

  const handleSendLetter = () => {
    if (letterContent.trim() && deliveryDate && letterTitle.trim()) {
      // API call would go here
      console.log('Scheduling letter:', {
        title: letterTitle,
        content: letterContent,
        deliveryDate: deliveryDate
      });
      
      // Reset form
      setLetterContent('');
      setLetterTitle('');
      setDeliveryDate('');
      alert('Your letter has been scheduled for delivery!');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const addPromptToLetter = (prompt) => {
    setLetterContent(prev => prev + (prev ? '\n\n' : '') + prompt + '\n\n');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Letters to Future Self 💌
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Write to your future self and receive your letters when you need them most
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-2 flex space-x-2">
          <button
            onClick={() => setActiveTab('write')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'write'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Edit className="w-4 h-4" />
            <span>Write Letter</span>
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'scheduled'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Scheduled ({scheduledLetters.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('delivered')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'delivered'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Received ({deliveredLetters.length})</span>
          </button>
        </div>
      </div>

      {/* Write Letter Tab */}
      {activeTab === 'write' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  value={letterTitle}
                  onChange={(e) => setLetterTitle(e.target.value)}
                  placeholder="Give your letter a title..."
                  className="w-full text-xl font-semibold bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                />
              </div>
              <div className="p-6">
                <textarea
                  value={letterContent}
                  onChange={(e) => setLetterContent(e.target.value)}
                  placeholder="Dear Future Me,

Write about your current thoughts, feelings, hopes, and dreams. What do you want to remember about this moment? What advice do you want to give yourself? What do you hope will have changed by the time you read this?

This is your space to connect with your future self..."
                  className="w-full h-96 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {letterContent.length} characters • {letterContent.split(' ').filter(word => word).length} words
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(new Date().toISOString())}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Delivery Timing */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white">When to deliver?</h3>
              </div>
              <div className="space-y-3">
                {timeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      if (option.value === 'custom') {
                        // Let user pick custom date
                        const customDate = prompt('Enter delivery date (YYYY-MM-DD):');
                        if (customDate) setDeliveryDate(customDate);
                      } else {
                        setDeliveryDate(option.date.toISOString().split('T')[0]);
                      }
                    }}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all duration-300 ${
                      deliveryDate === option.date?.toISOString().split('T')[0]
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                    {option.date && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(option.date.toISOString())}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {deliveryDate && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                  <div className="text-sm text-green-600 dark:text-green-400">
                    <strong>Delivery scheduled for:</strong><br />
                    {formatDate(deliveryDate)}
                  </div>
                </div>
              )}

              <button
                onClick={handleSendLetter}
                disabled={!letterContent.trim() || !deliveryDate || !letterTitle.trim()}
                className={`w-full mt-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  letterContent.trim() && deliveryDate && letterTitle.trim()
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:scale-105'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Schedule Letter</span>
                </div>
              </button>
            </div>

            {/* Writing Prompts */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
              <div className="flex items-center mb-4">
                <Heart className="w-5 h-5 mr-2" />
                <h3 className="font-semibold">Writing Prompts</h3>
              </div>
              <div className="space-y-3">
                {letterPrompts.slice(0, 3).map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => addPromptToLetter(prompt)}
                    className="w-full text-left p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Letters Tab */}
      {activeTab === 'scheduled' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Letters Waiting for Delivery
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              These letters are scheduled to be delivered to future you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scheduledLetters.map((letter) => (
              <div key={letter.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{letter.title}</h3>
                  <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
                    Scheduled
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
                  {letter.preview}
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Written:</span>
                    <span className="text-gray-900 dark:text-white">{formatDate(letter.createdOn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Delivery:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">{formatDate(letter.scheduledFor)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delivered Letters Tab */}
      {activeTab === 'delivered' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Letters from Past You
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Read the wisdom and hopes your past self shared with you
            </p>
          </div>

          <div className="space-y-6">
            {deliveredLetters.map((letter) => (
              <div key={letter.id} className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{letter.title}</h3>
                  <div className="flex items-center space-x-2">
                    <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-medium">
                      Delivered
                    </div>
                    <Mail className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  {letter.preview}
                </p>
                
                <div className="flex justify-between items-center text-sm">
                  <div className="space-y-1">
                    <div><span className="text-gray-500 dark:text-gray-400">Written:</span> <span className="text-gray-900 dark:text-white">{formatDate(letter.createdOn)}</span></div>
                    <div><span className="text-gray-500 dark:text-gray-400">Delivered:</span> <span className="text-gray-900 dark:text-white">{formatDate(letter.readOn)}</span></div>
                  </div>
                  <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Read Full Letter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white text-center">
        <h3 className="text-2xl font-bold mb-4">✨ Why Write to Your Future Self?</h3>
        <p className="text-indigo-100 leading-relaxed max-w-3xl mx-auto">
          Writing letters to your future self is a powerful practice for self-reflection, goal setting, and emotional growth. 
          It helps you document your journey, maintain perspective during challenges, and celebrate your progress. 
          These letters become precious time capsules of your thoughts, dreams, and wisdom.
        </p>
      </div>
    </div>
  );
};

export default FutureLetters;