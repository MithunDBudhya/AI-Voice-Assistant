import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { simulateCall } from '../api/client';
import { Phone, PhoneOff, Mic, MicOff, User, Bot, AlertCircle, Database, Zap, Wrench, Activity, Volume2, Globe } from 'lucide-react';

// ── Speech helpers ──────────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const speakText = (text, lang = 'en-US') => {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = lang;
    
    // Pick the best voice for the selected language
    const voices = window.speechSynthesis.getVoices();
    let preferred = null;
    
    if (lang === 'te-IN') {
      preferred = voices.find(v => v.lang === 'te-IN' || v.name.toLowerCase().includes('telugu'));
    } else if (lang === 'kn-IN') {
      preferred = voices.find(v => v.lang === 'kn-IN' || v.name.toLowerCase().includes('kannada'));
    } else {
      preferred = voices.find(v => v.name.includes('Zira') || v.name.includes('Google US English') || v.name.includes('Samantha') || (v.lang.startsWith('en') && v.name.includes('Female')));
    }

    if (preferred) utterance.voice = preferred;
    
    utterance.onend = resolve;
    utterance.onerror = resolve;
    window.speechSynthesis.speak(utterance);
  });
};

// ── Component ───────────────────────────────────────────────
const CallSimulator = () => {
  const [callerPhone, setCallerPhone] = useState('+1234567890');
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState('en-US'); // Multilingual support
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);          // conversation history
  const [callActive, setCallActive] = useState(false);  // voice call mode
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const scrollRef = useRef(null);

  const testCases = [
    "Where is my order 1023?",
    "What is your refund policy?",
    "I am frustrated, connect me to a human.",
    "Book a callback tomorrow morning."
  ];

  // Load voices on mount
  useEffect(() => {
    window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener?.('voiceschanged', () => window.speechSynthesis.getVoices());
  }, []);

  // Auto-scroll conversation
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [results, loading]);

  // Call timer
  useEffect(() => {
    if (callActive) {
      setCallDuration(0);
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [callActive]);

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  // ── Process message (text or voice) ───────────────────────
  const processMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    setLoading(true);
    const userMsg = text.trim();

    try {
      const res = await simulateCall(callerPhone, userMsg);
      const entry = { ...res, userMessage: userMsg };
      setResults(prev => [...prev, entry]);

      // Speak the response if in voice call mode
      if (callActive && res.answer) {
        setSpeaking(true);
        await speakText(res.answer, language);
        setSpeaking(false);
        // Auto-listen again after speaking
        startListening();
      }
    } catch (error) {
      console.error(error);
      const fallback = {
        userMessage: userMsg,
        intent: "UNKNOWN",
        sentiment: "neutral",
        tool_used: "none",
        answer: "I apologize, I'm having trouble connecting to our systems right now. Please try again in a moment.",
        escalated: false,
        source: null
      };
      setResults(prev => [...prev, fallback]);
      if (callActive) {
        setSpeaking(true);
        await speakText(fallback.answer, language);
        setSpeaking(false);
        startListening();
      }
    } finally {
      setLoading(false);
      setMessage('');
      setLiveTranscript('');
    }
  }, [callerPhone, callActive, language]);

  // ── Speech recognition ────────────────────────────────────
  const startListening = useCallback(() => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language; // Use selected language

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      setLiveTranscript(interimTranscript || finalTranscript);
      if (finalTranscript) {
        setLiveTranscript('');
        processMessage(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [processMessage, language]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  // ── Start / End voice call ────────────────────────────────
  const startCall = () => {
    setCallActive(true);
    setResults([]);
    
    // Greeting changes based on language
    let greeting = "Hello! Thank you for calling SupportGenie. How can I help you today?";
    if (language === 'te-IN') greeting = "నమస్కారం! సపోర్ట్‌జీనీకి కాల్ చేసినందుకు ధన్యవాదాలు. నేను మీకు ఎలా సహాయపడగలను?";
    if (language === 'kn-IN') greeting = "ನಮಸ್ಕಾರ! ಸಪೋರ್ಟ್‌ಜಿನಿಗೆ ಕರೆ ಮಾಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?";
    
    setResults([{
      userMessage: null,
      intent: "GREETING",
      sentiment: "neutral",
      tool_used: "none",
      answer: greeting,
      escalated: false,
      source: null,
      isGreeting: true
    }]);
    setSpeaking(true);
    speakText(greeting, language).then(() => {
      setSpeaking(false);
      startListening();
    });
  };

  const endCall = () => {
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
    setCallActive(false);
    setListening(false);
    setSpeaking(false);
    setLiveTranscript('');
  };

  // ── Text submit handler ───────────────────────────────────
  const handleSubmit = (e) => {
    e?.preventDefault();
    processMessage(message);
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Voice Call Banner */}
      <AnimatePresence>
        {callActive && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-emerald-600/20 via-emerald-500/10 to-cyan-600/20 border border-emerald-500/30 rounded-2xl p-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full" />
              </div>
              <div>
                <p className="text-emerald-300 font-semibold text-lg">Voice Call Active</p>
                <p className="text-slate-400 text-sm">
                  {speaking ? '🔊 Agent is speaking...' : listening ? '🎙️ Listening to you...' : 'Processing...'}
                  <span className="ml-3 font-mono text-slate-500">{formatTime(callDuration)}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Live waveform indicator */}
              {(listening || speaking) && (
                <div className="flex items-center gap-0.5 mr-2">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`w-1 rounded-full ${speaking ? 'bg-emerald-400' : 'bg-indigo-400'}`}
                      animate={{ height: [4, 12 + Math.random() * 12, 4] }}
                      transition={{ duration: 0.5 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              )}
              <button
                onClick={endCall}
                className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-medium transition-colors shadow-lg shadow-rose-600/30"
              >
                <PhoneOff className="w-4 h-4" /> End Call
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Controls */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          
          {/* Language Selector */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-indigo-400" />
              Agent Language
            </h2>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={callActive}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200 disabled:opacity-50"
            >
              <option value="en-US">English</option>
              <option value="te-IN">Telugu (తెలుగు)</option>
              <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
            </select>
            <p className="text-xs text-slate-500 mt-2">
              Select the language before starting the call. The AI will listen and speak in this language.
            </p>
          </div>

          {/* Voice Call Button */}
          {!callActive && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startCall}
              className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 text-lg shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Phone className="w-6 h-6" />
              Start Voice Call
            </motion.button>
          )}

          {/* Text input (always available) */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-indigo-400" />
              {callActive ? 'Type Instead' : 'Text Simulator'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Caller Phone</label>
                <input
                  type="text"
                  value={callerPhone}
                  onChange={(e) => setCallerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Customer Speech</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Type what the customer says..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !message}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                ) : (
                  "Send Message"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Conversation */}
        <div className="w-full lg:w-2/3">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl h-full min-h-[700px] flex flex-col overflow-hidden relative">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex justify-between items-center z-10">
              <h2 className="font-semibold flex items-center">
                <Activity className="w-4 h-4 mr-2 text-emerald-400" />
                {callActive ? 'Live Call Transcript' : 'Execution Trace'}
              </h2>
              {results.length > 0 && (
                <button
                  onClick={() => setResults([])}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-6">
              {results.length === 0 && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <Bot className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-center">
                    {SpeechRecognition 
                      ? 'Click "Start Voice Call" to talk to the AI agent, or type a message below.'
                      : 'Your browser does not support speech recognition. Use the text input to test.'}
                  </p>
                </div>
              )}

              <AnimatePresence>
                {results.map((entry, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* User Message */}
                    {entry.userMessage && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-1">
                          <User className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl rounded-tl-none px-4 py-3 text-slate-200">
                            {entry.userMessage}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Processing Pipeline (skip for greeting) */}
                    {!entry.isGreeting && entry.userMessage && (
                      <div className="pl-11 py-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs text-slate-500">Intent:</span>
                          <span className="px-2 py-0.5 bg-slate-800 rounded text-xs font-mono text-amber-300 border border-slate-700">{entry.intent}</span>
                          <span className="text-xs text-slate-500">Sentiment:</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-mono border ${entry.sentiment === 'frustrated' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>{entry.sentiment}</span>
                        </div>
                        {entry.tool_used !== 'none' && (
                          <div className="flex items-center gap-3">
                            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-xs text-slate-500">Tool:</span>
                            <span className="px-2 py-0.5 bg-cyan-500/10 rounded text-xs font-mono text-cyan-300 border border-cyan-500/20">{entry.tool_used}()</span>
                          </div>
                        )}
                        {entry.source && (
                          <div className="flex items-center gap-3">
                            <Database className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-xs text-slate-500">Source:</span>
                            <span className="px-2 py-0.5 bg-purple-500/10 rounded text-xs font-mono text-purple-300 border border-purple-500/20">{entry.source}</span>
                          </div>
                        )}
                        {entry.escalated && (
                          <div className="flex items-center gap-3">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-xs text-rose-400 font-medium">Escalation Triggered</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Agent Response */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl rounded-tl-none px-4 py-3 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                          {entry.answer}
                        </div>
                      </div>
                      {callActive && (
                        <button
                          onClick={() => speakText(entry.answer, language)}
                          className="mt-2 text-slate-500 hover:text-emerald-400 transition-colors"
                          title="Replay"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Live transcript while listening */}
              {liveTranscript && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-1">
                     <Mic className="w-4 h-4 text-indigo-400 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl rounded-tl-none px-4 py-3 text-slate-400 italic">
                      {liveTranscript}...
                    </div>
                  </div>
                </motion.div>
              )}

              {loading && (
                <div className="flex items-start gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0 mt-1"></div>
                  <div className="h-10 bg-slate-800 rounded-xl w-3/4"></div>
                </div>
              )}
            </div>

            {/* Voice control bar at bottom during call */}
            {callActive && (
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-center gap-4">
                <button
                  onClick={listening ? stopListening : startListening}
                  disabled={speaking || loading}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                    listening
                      ? 'bg-indigo-500 shadow-indigo-500/30 animate-pulse'
                      : 'bg-slate-700 hover:bg-slate-600 shadow-slate-900/50'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {listening ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-slate-300" />}
                </button>
                <span className="text-xs text-slate-500">
                  {speaking ? 'Agent speaking...' : listening ? 'Speak now...' : loading ? 'Processing...' : 'Tap mic to speak'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallSimulator;
