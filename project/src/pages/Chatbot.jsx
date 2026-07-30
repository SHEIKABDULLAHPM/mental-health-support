import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Brain,
  CheckCircle2,
  Clock3,
  Info,
  Loader2,
  MessageCircle,
  Mic,
  MicOff,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { chatbotAPI, sentimentAPI } from '../services/api';
import SentimentCard from '../components/SentimentCard';
import { formatShortTime } from '../utils/dateTime';

const ROLE_OPTIONS = [
  {
    id: 'therapeutic',
    label: 'Therapeutic',
    icon: Brain,
    description: 'CBT-informed reflection, coping steps, and gentle questions.',
  },
  {
    id: 'emotional',
    label: 'Emotional Support',
    icon: Sparkles,
    description: 'Warm validation, grounding, and steady emotional presence.',
  },
  {
    id: 'informational',
    label: 'Informational',
    icon: Info,
    description: 'Concise psychoeducation and practical mental health facts.',
  },
];

const LANGUAGES = [
  { code: 'english', name: 'English', voice: 'en-US' },
  { code: 'hindi', name: 'Hindi', voice: 'hi-IN' },
  { code: 'spanish', name: 'Spanish', voice: 'es-ES' },
  { code: 'french', name: 'French', voice: 'fr-FR' },
];

const WELCOME_MESSAGE = {
  id: 'welcome',
  sender: 'bot',
  text: "Hi, I'm Healing Chat. Choose the kind of support you want, then tell me what's been on your mind.",
  timestamp: new Date().toISOString(),
  isAIGenerated: false,
};

const normalizeMessages = (conversation) => {
  const rows = Array.isArray(conversation?.messages) ? conversation.messages : [];
  if (!rows.length) return [WELCOME_MESSAGE];

  return rows.map((message, index) => ({
    id: `${conversation._id || conversation.id}-${index}-${message.createdAt || Date.now()}`,
    sender: message.sender === 'assistant' ? 'bot' : message.sender,
    text: message.text,
    timestamp: message.createdAt || conversation.updatedAt || new Date().toISOString(),
    metadata: message.meta || {},
    isAIGenerated: message.sender === 'assistant',
  }));
};

const Chatbot = () => {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [chatMode, setChatMode] = useState('therapeutic');
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [serviceStatus, setServiceStatus] = useState('checking');
  const [modelInfo, setModelInfo] = useState(null);
  const [ragInfo, setRagInfo] = useState(null);
  const [lastRisk, setLastRisk] = useState(null);
  const [loadError, setLoadError] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  const activeRole = useMemo(
    () => ROLE_OPTIONS.find((role) => role.id === chatMode) || ROLE_OPTIONS[0],
    [chatMode]
  );

  const selectedVoice = useMemo(
    () => LANGUAGES.find((language) => language.code === selectedLanguage)?.voice || 'en-US',
    [selectedLanguage]
  );

  const refreshHealth = useCallback(async () => {
    try {
      const health = await chatbotAPI.checkLLMHealth();
      const llmAvailable = Boolean(health?.data?.llm?.available);
      setServiceStatus(llmAvailable ? 'online' : 'degraded');
      setModelInfo(health?.data?.llm || null);
      setLoadError('');
    } catch (error) {
      setServiceStatus('offline');
      setLoadError(error.message || 'Unable to reach the chat service.');
    }
  }, []);

  const loadConversations = useCallback(async () => {
    const rows = await chatbotAPI.listConversations();
    const list = Array.isArray(rows) ? rows : [];
    setConversations(list);

    if (!conversationId && list.length > 0) {
      const latest = list[0];
      setConversationId(latest._id);
      setChatMode(latest.mode || 'therapeutic');
      setMessages(normalizeMessages(latest));
    }
  }, [conversationId]);

  useEffect(() => {
    refreshHealth();
    loadConversations().catch((error) => {
      setLoadError(error.message || 'Conversation history could not be loaded.');
    });

    const interval = setInterval(refreshHealth, 30000);
    return () => clearInterval(interval);
  }, [loadConversations, refreshHealth]);

  useEffect(() => {
    try {
      const savedPersonality = localStorage.getItem('mindpeace-personality');
      if (savedPersonality) {
        const parsed = JSON.parse(savedPersonality);
        if (parsed?.preferredLanguage) setSelectedLanguage(parsed.preferredLanguage);
      }
    } catch {
      // Local preferences are optional.
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (event) => {
        setInputMessage(event.results[0][0].transcript);
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }

    synthRef.current = window.speechSynthesis || null;

    return () => {
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const speakMessage = useCallback(
    (text) => {
      if (!voiceEnabled || !synthRef.current || !text) return;
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedVoice;
      utterance.rate = 0.92;
      utterance.volume = 0.85;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      synthRef.current.speak(utterance);
    },
    [selectedVoice, voiceEnabled]
  );

  const startNewConversation = () => {
    synthRef.current?.cancel();
    setConversationId(null);
    setMessages([WELCOME_MESSAGE]);
    setLastRisk(null);
    setRagInfo(null);
    setInputMessage('');
    inputRef.current?.focus();
  };

  const loadConversation = async (id) => {
    if (!id || id === conversationId) return;
    const conversation = await chatbotAPI.getConversation(id);
    if (!conversation) return;
    setConversationId(conversation._id);
    setChatMode(conversation.mode || 'therapeutic');
    setMessages(normalizeMessages(conversation));
    setLastRisk(null);
    setRagInfo(null);
  };

  const clearConversation = async () => {
    if (conversationId) {
      await chatbotAPI.clearConversation(conversationId);
      setConversations((prev) => prev.filter((item) => item._id !== conversationId));
    }
    startNewConversation();
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    recognitionRef.current.lang = selectedVoice;
    recognitionRef.current.start();
    setIsListening(true);
  };

  const sendMessage = async () => {
    const text = inputMessage.trim();
    if (!text || isTyping) return;

    const userMessageId = `user-${Date.now()}`;
    const botMessageId = `bot-${Date.now() + 1}`;
    const userMessage = {
      id: userMessageId,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, {
      id: botMessageId,
      sender: 'bot',
      text: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
      isAIGenerated: true,
    }]);
    setInputMessage('');
    setIsTyping(true);
    setLoadError('');

    void sentimentAPI
      .analyzeText(text, 'vader', { extractKeywords: true })
      .then((sentiment) => {
        setMessages((prev) => prev.map((message) => (
          message.id === userMessageId ? { ...message, sentiment } : message
        )));
      })
      .catch(() => null);

    const started = performance.now();
    let streamedText = '';

    try {
      const response = await chatbotAPI.sendMessageStream(
        text,
        conversationId,
        {
          maxLength: 640,
          temperature: chatMode === 'informational' ? 0.45 : 0.7,
          mode: chatMode,
          language: selectedLanguage,
        },
        {
          onMeta: (meta) => {
            if (meta?.conversation_id) setConversationId(meta.conversation_id);
            if (meta?.rag) setRagInfo(meta.rag);
          },
          onToken: (token) => {
            streamedText += token;
            setMessages((prev) => prev.map((message) => (
              message.id === botMessageId
                ? { ...message, text: streamedText, isStreaming: true }
                : message
            )));
          },
          onDone: (done) => {
            if (done?.rag) setRagInfo(done.rag);
          },
        }
      );

      const responseTime = `${((performance.now() - started) / 1000).toFixed(1)}s`;
      const finalText = response.message || streamedText || 'I am here with you. Could you share a little more?';
      setLastRisk(response.risk || null);
      if (response.conversationId) setConversationId(response.conversationId);

      setMessages((prev) => prev.map((message) => (
        message.id === botMessageId
          ? {
              ...message,
              text: finalText,
              timestamp: response.timestamp,
              metadata: response.metadata,
              sentiment: response.sentiment,
              emotion: response.emotion,
              risk: response.risk,
              responseTime,
              isStreaming: false,
            }
          : message
      )));

      speakMessage(finalText);
      await loadConversations();
    } catch (error) {
      setLoadError(error.message || 'Chat response failed.');
      setMessages((prev) => prev.map((message) => (
        message.id === botMessageId
          ? {
              ...message,
              text: "I could not reach the AI service just now. Your message is still important, and if this is urgent please contact emergency services or a crisis line.",
              isStreaming: false,
              isError: true,
            }
          : message
      )));
    } finally {
      setIsTyping(false);
    }
  };

  const statusClass = {
    online: 'bg-emerald-500',
    degraded: 'bg-amber-500',
    checking: 'bg-sky-500',
    offline: 'bg-rose-500',
  }[serviceStatus] || 'bg-gray-400';
  const ActiveRoleIcon = activeRole.icon;

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] w-full max-w-7xl flex-col gap-4 px-3 pb-4 sm:px-4 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="hidden min-h-0 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 lg:flex lg:flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <div>
            <h2 className="text-sm font-semibold text-gray-950 dark:text-white">Conversations</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Stored memory</p>
          </div>
          <button
            type="button"
            onClick={startNewConversation}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-gray-300 dark:hover:bg-gray-800"
            title="New conversation"
            aria-label="New conversation"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <p className="px-2 py-4 text-sm text-gray-500 dark:text-gray-400">No saved conversations yet.</p>
          ) : conversations.map((conversation) => (
            <button
              type="button"
              key={conversation._id}
              onClick={() => loadConversation(conversation._id)}
              className={`mb-2 w-full rounded-md border p-3 text-left transition ${
                conversationId === conversation._id
                  ? 'border-teal-400 bg-teal-50 text-teal-950 dark:border-teal-700 dark:bg-teal-950/40 dark:text-teal-50'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              <span className="block truncate text-sm font-medium">{conversation.title || 'New conversation'}</span>
              <span className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Clock3 className="h-3 w-3" />
                {formatShortTime(conversation.updatedAt)}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <header className="border-b border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-700 dark:bg-gray-950 sm:px-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="text-lg font-semibold text-gray-950 dark:text-white">Healing Chat</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    AI responses with role-specific prompting, memory, and knowledge retrieval.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                <span className={`h-2.5 w-2.5 rounded-full ${statusClass}`} />
                {serviceStatus === 'online' ? 'AI online' : serviceStatus}
              </span>
              <button
                type="button"
                onClick={refreshHealth}
                className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                title="Refresh status"
                aria-label="Refresh status"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={clearConversation}
                className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                title="Clear current conversation"
                aria-label="Clear current conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-end">
            <div className="grid gap-2 sm:grid-cols-3">
              {ROLE_OPTIONS.map((role) => {
                const RoleIcon = role.icon;
                const selected = chatMode === role.id;
                return (
                  <button
                    type="button"
                    key={role.id}
                    onClick={() => setChatMode(role.id)}
                    className={`rounded-lg border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      selected
                        ? 'border-teal-500 bg-teal-50 text-teal-950 dark:border-teal-600 dark:bg-teal-950/40 dark:text-teal-50'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200'
                    }`}
                    aria-pressed={selected}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <RoleIcon className="h-4 w-4" />
                      {role.label}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{role.description}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                aria-label="Response language"
              >
                {LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>{language.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) {
                    synthRef.current?.cancel();
                    setIsSpeaking(false);
                  }
                  setVoiceEnabled((enabled) => !enabled);
                }}
                className={`rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  voiceEnabled
                    ? 'border-teal-400 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-200'
                    : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'
                }`}
                title="Toggle voice output"
                aria-label="Toggle voice output"
              >
                {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </header>

        {(loadError || lastRisk?.level === 'high') && (
          <div className={`border-b px-4 py-3 text-sm ${
            lastRisk?.level === 'high'
              ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200'
              : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200'
          }`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                {lastRisk?.level === 'high'
                  ? 'This conversation may involve immediate safety risk. Please contact local emergency services or a crisis line if there is danger now.'
                  : loadError}
              </span>
            </div>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col bg-gray-50 dark:bg-gray-950">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((message) => {
                const isUser = message.sender === 'user';
                return (
                  <article key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white">
                        <Bot className="h-4 w-4" />
                      </span>
                    )}
                    <div className={`max-w-[86%] rounded-lg px-4 py-3 shadow-sm sm:max-w-[76%] ${
                      isUser
                        ? 'bg-teal-600 text-white'
                        : message.isError
                          ? 'border border-rose-200 bg-white text-rose-800 dark:border-rose-900 dark:bg-gray-900 dark:text-rose-200'
                          : 'border border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100'
                    }`}>
                      {message.isStreaming && !message.text ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Thinking with context
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>
                      )}
                      <div className={`mt-2 flex flex-wrap items-center gap-2 text-xs ${
                        isUser ? 'text-teal-50' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        <span>{formatShortTime(message.timestamp)}</span>
                        {!isUser && message.isAIGenerated && (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            LLM
                          </span>
                        )}
                        {message.responseTime && <span>{message.responseTime}</span>}
                        {!isUser && voiceEnabled && message.text && (
                          <button
                            type="button"
                            onClick={() => speakMessage(message.text)}
                            className="rounded p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:hover:bg-gray-800"
                            title="Read aloud"
                            aria-label="Read aloud"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {isUser && message.sentiment && (
                        <div className="mt-2">
                          <SentimentCard sentiment={message.sentiment} compact showKeywords={false} />
                        </div>
                      )}
                    </div>
                    {isUser && (
                      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-800 text-white dark:bg-gray-700">
                        <User className="h-4 w-4" />
                      </span>
                    )}
                  </article>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="mx-auto max-w-3xl">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 dark:bg-gray-800">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {conversationId ? 'Memory active' : 'New conversation'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 dark:bg-gray-800">
                  <ActiveRoleIcon className="h-3.5 w-3.5" />
                  {activeRole.label}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 dark:bg-gray-800">
                  <Brain className="h-3.5 w-3.5" />
                  RAG {ragInfo?.available ? `${ragInfo.document_count || 0} docs` : 'pending'}
                </span>
                {modelInfo?.available !== undefined && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 dark:bg-gray-800">
                    <Bot className="h-3.5 w-3.5" />
                    Ollama {modelInfo.available ? 'ready' : 'checking'}
                  </span>
                )}
              </div>

              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(event) => setInputMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  rows={1}
                  placeholder={`Message Healing Chat in ${LANGUAGES.find((language) => language.code === selectedLanguage)?.name || 'English'}...`}
                  className="max-h-36 min-h-[2.75rem] flex-1 resize-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-950 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder-gray-500"
                  disabled={isTyping}
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={!recognitionRef.current || isTyping}
                  className={`rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                    isListening
                      ? 'border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                  title="Voice input"
                  aria-label="Voice input"
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="rounded-lg bg-teal-600 p-3 text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:focus:ring-offset-gray-900"
                  title="Send message"
                  aria-label="Send message"
                >
                  {isTyping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Healing Chat can support reflection and coping, but it is not a crisis service or medical provider.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Chatbot;
