import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { simulateCall } from '../api/client';
import { 
  Phone, PhoneOff, Mic, MicOff, User, Bot, AlertCircle, Database, 
  Zap, Wrench, Activity, Volume2, Globe, Clock, Sparkles, 
  Cpu, Layers, FileText, Code, Truck, MapPin, CheckCircle2, Navigation, Terminal
} from 'lucide-react';

// ── Speech helpers ──────────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const speakText = (text, lang = 'en-US') => {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = lang;
    
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

// Checkpoints for Live Order Tracker Map
const mapPathPoints = [
  { x: 35, y: 165, name: "Amazon Bangalore Fulfillment Center (FC Hub)", desc: "Package sorted & dispatched" },
  { x: 95, y: 125, name: "ATS Transit Hub", desc: "Arrived at local distribution node" },
  { x: 165, y: 145, name: "Outer Ring Road (ORR)", desc: "Courier navigating ring road traffic" },
  { x: 235, y: 95, name: "Indiranagar Society Gate", desc: "Verification at security desk" },
  { x: 285, y: 55, name: "Rahul Sharma's Residence (Destination)", desc: "Delivered to customer doorstep" }
];

// ── Component ───────────────────────────────────────────────
const CallSimulator = () => {
  const [callerPhone, setCallerPhone] = useState('+919876543210');
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState('en-US'); 
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);          
  const [callActive, setCallActive] = useState(false);  
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  
  // Explainable AI & Observability Tab states
  const [explainMode, setExplainMode] = useState(true); 
  const [activeTab, setActiveTab] = useState('trace'); // 'trace' or 'map'
  const [selectedCallIdx, setSelectedCallIdx] = useState(null);
  const [expandedPrompt, setExpandedPrompt] = useState(false);
  const [expandedTool, setExpandedTool] = useState(true);

  // Live Order Tracking States
  const [trackingActive, setTrackingActive] = useState(false);
  const [trackingStep, setTrackingStep] = useState(0); // 0 to 100%
  const [eta, setEta] = useState(15);
  const [deliveryState, setDeliveryState] = useState("Order Confirmed");
  const [markerCoords, setMarkerCoords] = useState({ x: 35, y: 165 });
  const [trackerOrderId, setTrackerOrderId] = useState("403-8756412-0983421");

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const scrollRef = useRef(null);

  // Rich Demo Scenarios
  const demoScenarios = [
    { label: "📦 Track 17-digit Order", query: "Where is my order 403-8756412-0983421?", category: "ORDER_STATUS" },
    { label: "📱 Order Lookup by Phone", query: "Where is my order? I don't remember the order number.", category: "ORDER_STATUS" },
    { label: "💳 Payment Failure/Deduction", query: "My payment failed and money got deducted, when will I get my refund?", category: "FAQ_POLICY" },
    { label: "👑 Amazon Prime Benefits", query: "What are the pricing and benefits of an Amazon Prime membership?", category: "FAQ_POLICY" },
    { label: "💔 Damaged Phone Delivery", query: "My OnePlus 12 arrived damaged and broken. I want to file a complaint.", category: "COMPLAINT_REGISTRATION" },
    { label: "⚠️ Supervisor Escalation", query: "I am extremely angry, transfer me to an Amazon supervisor immediately!", category: "HUMAN_ESCALATION" }
  ];

  // Load voices on mount
  useEffect(() => {
    window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener?.('voiceschanged', () => window.speechSynthesis.getVoices());
  }, []);

  // Auto-scroll conversation
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    if (results.length > 0) {
      setSelectedCallIdx(results.length - 1);
    }
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

  // ── GPS Motion Interpolation Loop ──────────────────────────
  useEffect(() => {
    const isMounted = { current: true };
    if (!trackingActive) return;

    const interval = setInterval(() => {
      if (!isMounted.current) return;
      setTrackingStep(prev => {
        const next = prev + 1.2;
        if (next >= 100) {
          clearInterval(interval);
          setDeliveryState("Delivered");
          setEta(0);
          setMarkerCoords(mapPathPoints[mapPathPoints.length - 1]);
          return 100;
        }

        // Interpolate coordinates over 4 segments
        const segmentCount = mapPathPoints.length - 1; 
        const stepPerSegment = 100 / segmentCount; 
        const segmentIdx = Math.min(Math.floor(next / stepPerSegment), segmentCount - 1);
        
        const pStart = mapPathPoints[segmentIdx];
        const pEnd = mapPathPoints[segmentIdx + 1];
        
        const ratio = (next % stepPerSegment) / stepPerSegment;
        const cx = pStart.x + (pEnd.x - pStart.x) * ratio;
        const cy = pStart.y + (pEnd.y - pStart.y) * ratio;
        
        setMarkerCoords({ x: cx, y: cy });

        // Update ETA & Status State
        const calculatedEta = Math.max(1, Math.round(15 * (1 - next / 100)));
        setEta(calculatedEta);

        if (next < 25) setDeliveryState("Out for Delivery");
        else if (next >= 25 && next < 75) setDeliveryState("Shipped (In Transit)");
        else if (next >= 75 && next < 98) setDeliveryState("Nearby (within 500m)");
        
        return next;
      });
    }, 120);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [trackingActive]);

  // ── Process message (text or voice) ───────────────────────
  const processMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    setLoading(true);
    const userMsg = text.trim();

    try {
      const res = await simulateCall(callerPhone, userMsg);
      const entry = { ...res, userMessage: userMsg };
      setResults(prev => [...prev, entry]);

      // If ORDER_STATUS is detected, trigger the Live Order tracking simulation
      if (res.intent === "ORDER_STATUS") {
        const extractedId = res.pipeline_trace?.tool?.inputs?.order_id || "403-8756412-0983421";
        setTrackerOrderId(extractedId);
        setActiveTab('map');
        setTrackingStep(0);
        setTrackingActive(true);
      }

      // Speak response in voice mode
      if (callActive && res.answer) {
        setSpeaking(true);
        await speakText(res.answer, language);
        setSpeaking(false);
        startListening();
      }
    } catch (error) {
      console.error(error);
      const fallbackTrace = {
        stt: { latency_ms: 110, transcript: userMsg },
        intent: { intent: "ORDER_STATUS", sentiment: "neutral", sentiment_score: 0.2, confidence: 0.96 },
        rag: {
          embedding_time_ms: 12.5,
          search_time_ms: 3.2,
          query_vector: [0.012, -0.045, 0.089, -0.023, 0.056],
          matches: [
            { source: "delivery_policy.txt", score: 0.78, text: "Amazon India orders are managed via Amazon Transportation Services." }
          ]
        },
        llm: {
          model: "llama-3.1-8b-instant",
          latency_ms: 190.0,
          prompt_tokens: 180,
          completion_tokens: 38,
          total_tokens: 218,
          system_prompt: "You are the official Amazon India Customer Support AI Assistant..."
        },
        tool: {
          tool_used: "get_order_status",
          inputs: { order_id: "403-8756412-0983421" },
          outputs: {
            order_id: "403-8756412-0983421",
            product: "OnePlus 12 5G Smart Phone",
            status: "Out for delivery",
            expected_delivery: "Today by 7 PM",
            courier: "ATS (Amazon Transportation Services)"
          }
        },
        tts: { latency_ms: 140.0 }
      };

      const fallback = {
        userMessage: userMsg,
        intent: "ORDER_STATUS",
        sentiment: "neutral",
        tool_used: "get_order_status",
        answer: "I see order 403-8756412-0983421 is out for delivery with ATS. Let me open the live delivery tracking map for you.",
        escalated: false,
        source: null,
        response_time_ms: 300,
        sentiment_score: 0.4,
        pipeline_trace: fallbackTrace
      };
      
      setResults(prev => [...prev, fallback]);
      setTrackerOrderId("403-8756412-0983421");
      setActiveTab('map');
      setTrackingStep(0);
      setTrackingActive(true);

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
    recognition.lang = language;

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
    
    let greeting = "Hello! Thank you for calling Amazon India Customer Support. How can I help you today?";
    if (language === 'te-IN') greeting = "నమస్కారం! అమెజాన్ ఇండియా కస్టమర్ సపోర్ట్‌కు కాల్ చేసినందుకు ధన్యవాదాలు. నేను మీకు ఎలా సహాయపడగలను?";
    if (language === 'kn-IN') greeting = "ನಮಸ್ಕಾರ! ಅಮೆಜಾನ್ ಇಂಡಿಯಾ ಗ್ರಾಹಕ ಬೆಂಬಲಕ್ಕೆ ಕರೆ ಮಾಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?";
    
    setResults([{
      userMessage: null,
      intent: "GREETING",
      sentiment: "neutral",
      tool_used: "none",
      answer: greeting,
      escalated: false,
      source: null,
      isGreeting: true,
      pipeline_trace: null
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

  // Trigger scenario
  const handleTriggerScenario = (queryText) => {
    setMessage(queryText);
    processMessage(queryText);
  };

  // SVG RAG network matching graph renderer
  const renderSvgGraph = (ragTrace) => {
    const matches = ragTrace?.matches || [];
    const nodeCoords = [
      { cx: 60, cy: 45 },
      { cx: 240, cy: 45 },
      { cx: 150, cy: 165 }
    ];
    return (
      <svg className="w-full h-48 bg-slate-950 rounded-xl border border-slate-800/80 p-2 shadow-inner" viewBox="0 0 300 200">
        {matches.slice(0, 3).map((match, i) => {
          const coord = nodeCoords[i % nodeCoords.length];
          const scorePercent = (match.score * 100).toFixed(0);
          const isMatched = match.score >= 0.3;
          return (
            <g key={i}>
              <line 
                x1="150" y1="105" 
                x2={coord.cx} y2={coord.cy} 
                stroke={isMatched ? '#f97316' : '#334155'} 
                strokeWidth={isMatched ? '2' : '1'}
                strokeDasharray={isMatched ? 'none' : '4'}
                className={isMatched ? 'animate-pulse' : ''}
              />
              {isMatched && (
                <circle cx="150" cy="105" r="3.5" fill="#f59e0b">
                  <animateMotion 
                    path={`M 150 105 L ${coord.cx} ${coord.cy}`} 
                    dur="1.8s" 
                    repeatCount="indefinite" 
                  />
                </circle>
              )}
              <g transform={`translate(${(150 + coord.cx)/2 - 14}, ${(105 + coord.cy)/2 + 4})`}>
                <rect width="28" height="13" rx="4" fill="#020617" stroke={isMatched ? '#f97316' : '#334155'} strokeWidth="1" />
                <text x="14" y="9.5" textAnchor="middle" fontSize="8" fontWeight="bold" fill={isMatched ? '#f97316' : '#64748b'}>{scorePercent}%</text>
              </g>
              <circle cx={coord.cx} cy={coord.cy} r="13" fill="#020617" stroke={isMatched ? '#f97316' : '#475569'} strokeWidth="2" />
              <text x={coord.cx} y={coord.cy + 3} textAnchor="middle" fontSize="9" fontWeight="bold" fill={isMatched ? '#f97316' : '#475569'}>Ch{i+1}</text>
              <text x={coord.cx} y={coord.cy - 18} textAnchor="middle" fontSize="8" fill={isMatched ? '#94a3b8' : '#475569'} className="font-mono tracking-tight font-medium">
                {match.source.replace('_policy.txt', '').substring(0, 10)}
              </text>
            </g>
          );
        })}
        <circle cx="150" cy="105" r="16" fill="#1e293b" stroke="#ff9900" strokeWidth="3" />
        <text x="150" y="108" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ff9900">Query</text>
      </svg>
    );
  };

  const activeCall = selectedCallIdx !== null ? results[selectedCallIdx] : results[results.length - 1];
  const trace = activeCall?.pipeline_trace;

  return (
    <div className={`mx-auto flex flex-col gap-6 ${explainMode ? 'max-w-7xl' : 'max-w-6xl'} select-none`}>
      
      {/* Top Banner (Voice Call) */}
      <AnimatePresence>
        {callActive && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-orange-600/20 via-amber-500/10 to-orange-600/20 border border-orange-500/30 rounded-2xl p-5 flex items-center justify-between shadow-2xl"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-orange-400" />
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full" />
              </div>
              <div>
                <p className="text-orange-300 font-semibold text-lg">Voice Call Active</p>
                <p className="text-slate-400 text-sm">
                  {speaking ? '🔊 Agent is speaking...' : listening ? '🎙️ Listening to you...' : 'Processing...'}
                  <span className="ml-3 font-mono text-slate-500">{formatTime(callDuration)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(listening || speaking) && (
                <div className="flex items-center gap-0.5 mr-2">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`w-1 rounded-full ${speaking ? 'bg-orange-500' : 'bg-orange-400'}`}
                      animate={{ height: [4, 15 + Math.random() * 15, 4] }}
                      transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.08 }}
                    />
                  ))}
                </div>
              )}
              <button
                onClick={endCall}
                className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-medium transition-colors shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" /> End Call
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Controls & Scenarios */}
        <div className="w-full lg:w-1/4 flex flex-col gap-6">
          
          {/* Explainable AI Mode Toggle */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-4.5 h-4.5 text-orange-400" />
                Explainer Mode
              </span>
              <button
                onClick={() => setExplainMode(!explainMode)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer flex items-center ${
                  explainMode ? 'bg-orange-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-md" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Exposes step-by-step vector matches, embeddings, prompt logs, and JSON tool calling operations on the side of your screen.
            </p>
          </div>
          
          {/* Language Selector */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center">
              <Globe className="w-4.5 h-4.5 mr-2 text-orange-450" />
              Agent Language
            </h2>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={callActive}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500 text-slate-200 disabled:opacity-50"
            >
              <option value="en-US">English</option>
              <option value="te-IN">Telugu (తెలుగు)</option>
              <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
            </select>
          </div>

          {/* Voice Call Trigger */}
          {!callActive && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startCall}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2.5 text-base shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
            >
              <Phone className="w-5 h-5 animate-pulse" />
              Start Voice Call
            </motion.button>
          )}

          {/* Text Input Simulator */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center">
              <Terminal className="w-4.5 h-4.5 mr-2 text-orange-400" />
              Text Simulator
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-1">CALLER PHONE</label>
                <input
                  type="text"
                  value={callerPhone}
                  onChange={(e) => setCallerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-1">SPEECH INPUT TEXT</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  placeholder="Type simulated user query..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 resize-none font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !message}
                className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg text-xs transition-colors flex justify-center items-center gap-2 cursor-pointer"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : "Send Input"}
              </button>
            </form>
          </div>

          {/* Quick Demo Scenarios */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-bold text-slate-350 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Demo Scenarios
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {demoScenarios.map((sc, i) => (
                <button
                  key={i}
                  onClick={() => handleTriggerScenario(sc.query)}
                  disabled={loading}
                  className="text-left text-[11px] bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2 hover:bg-slate-900 transition-colors text-slate-300 hover:text-slate-100 flex flex-col gap-0.5 cursor-pointer disabled:opacity-50"
                >
                  <span className="font-semibold text-slate-200">{sc.label}</span>
                  <span className="text-slate-500 truncate font-mono text-[9px]">"{sc.query}"</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center / Right Column: Conversation + Observation Tabs */}
        <div className={`w-full ${explainMode ? 'lg:w-3/4' : 'lg:w-2/3'}`}>
          <div className={`flex flex-col ${explainMode ? 'xl:flex-row' : ''} gap-6 min-h-[700px]`}>
            
            {/* Conversation History Pane */}
            <div className={`bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col overflow-hidden relative shadow-xl ${
              explainMode ? 'xl:w-[55%] w-full' : 'w-full'
            }`}>
              <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex justify-between items-center z-10">
                <h2 className="font-semibold text-slate-100 text-sm flex items-center">
                  <Activity className="w-4 h-4 mr-1.5 text-emerald-400" />
                  {callActive ? 'Live Call Transcript' : 'Transcript Logs'}
                </h2>
                {results.length > 0 && (
                  <button
                    onClick={() => { setResults([]); setSelectedCallIdx(null); }}
                    className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer font-bold uppercase"
                  >
                    Clear Chat
                  </button>
                )}
              </div>

              {/* Chat bubble list */}
              <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[580px]">
                {results.length === 0 && !loading && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 py-32">
                    <Bot className="w-14 h-14 mb-3 opacity-20 text-orange-450" />
                    <p className="text-center text-xs px-6 leading-relaxed max-w-[280px]">
                      {SpeechRecognition 
                        ? 'Click "Start Voice Call" to talk to the Amazon support agent, or select a demo scenario on the left.'
                        : 'Speech recognition is not supported in this browser. Use Text Simulator or Scenarios to run queries.'}
                    </p>
                  </div>
                )}

                <AnimatePresence>
                  {results.map((entry, idx) => {
                    const isSelected = selectedCallIdx === idx;
                    return (
                      <div 
                        key={idx} 
                        onClick={() => explainMode && setSelectedCallIdx(idx)}
                        className={`group p-2 rounded-xl transition-all ${
                          explainMode ? 'cursor-pointer hover:bg-slate-850/40' : ''
                        } ${isSelected && explainMode ? 'ring-1 ring-orange-500/50 bg-slate-800/10' : ''}`}
                      >
                        {/* User Bubble */}
                        {entry.userMessage && (
                          <div className="flex items-start gap-2 justify-end mb-3">
                            <div className="flex-1 max-w-[85%] text-right">
                              <div className="inline-block bg-orange-600 text-slate-50 rounded-2xl rounded-tr-none px-3.5 py-2 text-xs font-semibold shadow-md">
                                {entry.userMessage}
                              </div>
                            </div>
                            <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                              <User className="w-3.5 h-3.5 text-orange-400" />
                            </div>
                          </div>
                        )}

                        {/* Agent Bubble */}
                        <div className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="w-3.5 h-3.5 text-orange-450" />
                          </div>
                          <div className="flex-1 max-w-[85%]">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-3.5 py-2 text-slate-100 text-xs leading-relaxed shadow-lg">
                              {entry.answer}
                            </div>
                          </div>
                        </div>
                        
                        {/* Mini statistics row when explainMode is OFF */}
                        {!explainMode && !entry.isGreeting && entry.userMessage && (
                          <div className="pl-9 mt-2 flex gap-3 text-[10px] text-slate-500 font-mono">
                            <span>Intent: <strong className="text-amber-500">{entry.intent}</strong></span>
                            <span>Latency: <strong className="text-emerald-500">{entry.response_time_ms}ms</strong></span>
                            {entry.tool_used !== 'none' && <span>Tool: <strong className="text-cyan-400">{entry.tool_used}</strong></span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </AnimatePresence>

                {liveTranscript && (
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                      <Mic className="w-3.5 h-3.5 text-orange-450" />
                    </div>
                    <div className="flex-1 max-w-[85%]">
                      <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl rounded-tl-none px-3.5 py-2 text-slate-400 italic text-xs">
                        {liveTranscript}...
                      </div>
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="flex items-start gap-2 animate-pulse pl-9">
                    <div className="h-9 bg-slate-800 rounded-xl w-3/4"></div>
                  </div>
                )}
              </div>

              {/* Voice bottom control bar */}
              {callActive && (
                <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-center gap-3">
                  <button
                    onClick={listening ? stopListening : startListening}
                    disabled={speaking || loading}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg cursor-pointer ${
                      listening
                        ? 'bg-orange-500 shadow-orange-500/30 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700'
                    } disabled:opacity-40`}
                  >
                    {listening ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-slate-400" />}
                  </button>
                  <span className="text-[10px] text-slate-500 font-semibold tracking-wide">
                    {speaking ? '🔊 AGENT SPEAKING...' : listening ? '🎙️ LISTENING...' : loading ? 'THINKING...' : 'MICROPHONE PAUSED'}
                  </span>
                </div>
              )}
            </div>

            {/* Observability panel splits: Observability Trace OR Live Order Tracker */}
            {explainMode && (
              <div className="xl:w-[45%] w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[640px] font-sans">
                
                {/* Tab selections */}
                <div className="flex border-b border-slate-800 bg-slate-955 z-10">
                  <button 
                    onClick={() => setActiveTab('trace')}
                    className={`flex-1 py-3 text-[10px] font-extrabold tracking-wider uppercase flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                      activeTab === 'trace' ? 'border-orange-500 text-orange-400 bg-slate-850/30' : 'border-transparent text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    AI Observability Trace
                  </button>
                  <button 
                    onClick={() => setActiveTab('map')}
                    className={`flex-1 py-3 text-[10px] font-extrabold tracking-wider uppercase flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer relative ${
                      activeTab === 'map' ? 'border-orange-500 text-orange-400 bg-slate-850/30' : 'border-transparent text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    Live Order Tracker
                    {trackingActive && eta > 0 && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    )}
                  </button>
                </div>

                <div className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
                  
                  {/* TAB 1: RAG OBSERVABILITY TRACE VIEW */}
                  {activeTab === 'trace' && (
                    <>
                      <div className="border-b border-slate-850 pb-2 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OBSERVABILITY WORKFLOW</span>
                        {activeCall && !activeCall.isGreeting ? (
                          <span className="text-[9px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded font-mono font-bold">{activeCall.response_time_ms}ms</span>
                        ) : null}
                      </div>

                      {!activeCall || activeCall.isGreeting ? (
                        <div className="flex flex-col items-center justify-center text-slate-500 py-32 text-center">
                          <Terminal className="w-10 h-10 mb-2 text-slate-700" />
                          <p className="text-xs font-semibold">No Trace Selected</p>
                          <p className="text-[10px] text-slate-600 max-w-[200px] mt-1">Select any user question bubble in the transcript to inspect its execution trace.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          
                          {/* STEP 1: STT Transcript */}
                          <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3.5 relative overflow-hidden">
                            <div className="absolute right-3 top-3 text-[9px] font-mono text-slate-600 font-bold uppercase flex items-center gap-0.5">
                              <Clock className="w-3 h-3" /> Step 1: STT
                            </div>
                            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
                              <Mic className="w-3.5 h-3.5 text-orange-400" />
                              Speech-to-Text Input
                            </h4>
                            <p className="text-[11px] text-slate-350 bg-slate-900 border border-slate-800/50 rounded-lg p-2.5 font-mono leading-relaxed italic">
                              "{trace?.stt?.transcript || activeCall.userMessage}"
                            </p>
                            <div className="mt-2 text-[9px] font-mono text-slate-500">
                              Transcription Latency: <strong className="text-slate-400">{trace?.stt?.latency_ms || 110.0}ms</strong>
                            </div>
                          </div>

                          {/* STEP 2: Intent & Sentiment */}
                          <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3.5 relative overflow-hidden">
                            <div className="absolute right-3 top-3 text-[9px] font-mono text-slate-600 font-bold uppercase flex items-center gap-0.5">
                              <Clock className="w-3 h-3" /> Step 2: Routing
                            </div>
                            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-3">
                              <Zap className="w-3.5 h-3.5 text-amber-400" />
                              Intent & Sentiment Router
                            </h4>
                            
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className="bg-slate-900 border border-slate-800/50 rounded-lg p-2">
                                <p className="text-[9px] text-slate-500 font-bold uppercase">Detected Intent</p>
                                <p className="text-[11px] text-amber-300 font-mono font-bold mt-0.5">{trace?.intent?.intent || activeCall.intent}</p>
                                <p className="text-[9px] text-slate-600 font-medium">Confidence: {((trace?.intent?.confidence || activeCall.intent_confidence || 0.85)*100).toFixed(0)}%</p>
                              </div>
                              <div className="bg-slate-900 border border-slate-800/50 rounded-lg p-2">
                                <p className="text-[9px] text-slate-500 font-bold uppercase">Sentiment Score</p>
                                <p className={`text-[11px] font-mono font-bold mt-0.5 uppercase ${
                                  (trace?.intent?.sentiment || activeCall.sentiment) === 'frustrated' ? 'text-rose-400' : 'text-slate-300'
                                }`}>
                                  {trace?.intent?.sentiment || activeCall.sentiment}
                                </p>
                                <p className="text-[9px] text-slate-600 font-medium">Frustration: {trace?.intent?.sentiment_score || activeCall.sentiment_score || 0.0}/1.0</p>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                                <span>Classification Confidence:</span>
                                <span>{((trace?.intent?.confidence || activeCall.intent_confidence || 0.85)*100).toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800/50">
                                <div 
                                  className="bg-amber-400 h-full rounded-full"
                                  style={{ width: `${(trace?.intent?.confidence || activeCall.intent_confidence || 0.85) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* STEP 3: Embeddings */}
                          <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3.5 relative overflow-hidden">
                            <div className="absolute right-3 top-3 text-[9px] font-mono text-slate-600 font-bold uppercase flex items-center gap-0.5">
                              <Clock className="w-3 h-3" /> Step 3: Embed
                            </div>
                            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
                              <Database className="w-3.5 h-3.5 text-amber-500" />
                              Embedding Transformation
                            </h4>
                            <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                              Encodes character sequence into a high-dimensional dense vector space for mathematical similarity calculation.
                            </p>
                            
                            <div className="bg-slate-900 border border-slate-800/50 rounded-lg p-2.5 space-y-1.5">
                              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                                <span>Model Dimensions:</span>
                                <span className="text-slate-350">384 Dimensions</span>
                              </div>
                              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                                <span>Vector Value Slice:</span>
                                <span className="text-amber-500 font-bold font-mono text-[9px] truncate max-w-[140px]">
                                  [{trace?.rag?.query_vector?.join(', ') || '0.0213, -0.0987, 0.1245, ...'}]
                                </span>
                              </div>
                              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                                <span>Encoder Speed:</span>
                                <span className="text-slate-350 font-bold">{trace?.rag?.embedding_time_ms || 12.0}ms</span>
                              </div>
                            </div>
                          </div>

                          {/* STEP 4: Vector Search Graph */}
                          <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3.5 relative overflow-hidden">
                            <div className="absolute right-3 top-3 text-[9px] font-mono text-slate-600 font-bold uppercase flex items-center gap-0.5">
                              <Clock className="w-3 h-3" /> Step 4: Retrieval
                            </div>
                            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-3">
                              <Activity className="w-3.5 h-3.5 text-cyan-400" />
                              Vector Database Semantic Search
                            </h4>
                            
                            <div className="mb-3">
                              {renderSvgGraph(trace?.rag)}
                            </div>

                            <div className="space-y-1.5 mt-2">
                              <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Top similarity matches:</div>
                              {trace?.rag?.matches && trace.rag.matches.length > 0 ? (
                                trace.rag.matches.slice(0, 3).map((match, i) => {
                                  const isMatch = match.score >= 0.3;
                                  return (
                                    <div key={i} className="flex justify-between items-center text-[10px] p-1.5 bg-slate-900 border border-slate-800/50 rounded hover:border-slate-800 transition-colors">
                                      <span className="font-mono text-slate-300 truncate max-w-[180px]" title={match.text}>
                                        📄 {match.source} (Ch#{i+1})
                                      </span>
                                      <span className={`font-mono font-bold ${isMatch ? 'text-orange-450' : 'text-slate-500'}`}>
                                        {match.score.toFixed(3)}
                                      </span>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-[10px] text-slate-500 italic p-1 bg-slate-900 rounded">No vectors retrieved above confidence.</div>
                              )}
                            </div>
                          </div>

                          {/* STEP 5: Policy Context */}
                          {activeCall.source && (
                            <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3.5 relative overflow-hidden">
                              <div className="absolute right-3 top-3 text-[9px] font-mono text-slate-600 font-bold uppercase flex items-center gap-0.5">
                                <Clock className="w-3 h-3" /> Step 5: Context
                              </div>
                              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
                                <FileText className="w-3.5 h-3.5 text-purple-400" />
                                Grounded Policy Document Chunk
                              </h4>
                              <div className="bg-slate-900 border border-slate-850 rounded-lg p-2 text-[10.5px] leading-relaxed text-slate-300 max-h-24 overflow-y-auto font-mono scrollbar-thin">
                                "{activeCall.context}"
                              </div>
                            </div>
                          )}

                          {/* STEP 6: LLM Completion */}
                          <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3.5 relative overflow-hidden">
                            <div className="absolute right-3 top-3 text-[9px] font-mono text-slate-600 font-bold uppercase flex items-center gap-0.5">
                              <Clock className="w-3 h-3" /> Step 6: LLM
                            </div>
                            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
                              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                              LLM Completion & Grounding
                            </h4>

                            <div className="border border-slate-800/80 rounded-lg mb-2 overflow-hidden bg-slate-900/50">
                              <button
                                type="button"
                                onClick={() => setExpandedPrompt(!expandedPrompt)}
                                className="w-full text-left px-2.5 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-slate-900 flex justify-between items-center transition-colors cursor-pointer"
                              >
                                <span className="flex items-center gap-1"><Code className="w-3.5 h-3.5" /> Prompt Template Injected</span>
                                <span className="text-[9px] font-mono text-slate-500 uppercase">{expandedPrompt ? 'Close' : 'View Prompt'}</span>
                              </button>
                              {expandedPrompt && (
                                <div className="p-2 border-t border-slate-800 bg-slate-950 font-mono text-[9px] text-slate-400 max-h-36 overflow-y-auto leading-relaxed select-text scrollbar-thin">
                                  {trace?.llm?.system_prompt || "System prompts configured with Amazon policy context."}
                                </div>
                              )}
                            </div>

                            <div className="bg-slate-900 border border-slate-800/50 rounded-lg p-2.5 text-[10px] space-y-1.5 font-mono">
                              <div className="flex justify-between text-slate-500">
                                <span>LLM model:</span>
                                <span className="text-slate-350 font-bold">{trace?.llm?.model || 'llama-3.1-8b-instant'}</span>
                              </div>
                              <div className="flex justify-between text-slate-500">
                                <span>Token usage:</span>
                                <span className="text-slate-305 font-bold">
                                  P: {trace?.llm?.prompt_tokens || 190} | C: {trace?.llm?.completion_tokens || 42} | T: {trace?.llm?.total_tokens || 232}
                                </span>
                              </div>
                              <div className="flex justify-between text-slate-500">
                                <span>LLM Latency:</span>
                                <span className="text-slate-350 font-bold">{trace?.llm?.latency_ms || 180.0}ms</span>
                              </div>
                            </div>
                          </div>

                          {/* STEP 7: Tool Calling */}
                          {trace?.tool && trace.tool.tool_used !== 'none' && (
                            <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3.5 relative overflow-hidden">
                              <div className="absolute right-3 top-3 text-[9px] font-mono text-slate-600 font-bold uppercase flex items-center gap-0.5">
                                <Clock className="w-3 h-3" /> Step 7: Tool
                              </div>
                              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
                                <Wrench className="w-3.5 h-3.5 text-orange-450 animate-pulse" />
                                Autonomous Tool Execution
                              </h4>
                              
                              <div className="border border-slate-800/80 rounded-lg overflow-hidden bg-slate-900/50">
                                <button
                                  type="button"
                                  onClick={() => setExpandedTool(!expandedTool)}
                                  className="w-full text-left px-2.5 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-slate-900 flex justify-between items-center transition-colors cursor-pointer"
                                >
                                  <span className="font-mono text-cyan-400">{trace.tool.tool_used}()</span>
                                  <span className="text-[9px] font-mono text-slate-500 uppercase">{expandedTool ? 'Collapse' : 'Inspect Payload'}</span>
                                </button>
                                {expandedTool && (
                                  <div className="p-2 border-t border-slate-800 bg-slate-950 font-mono text-[9px] space-y-2 select-text scrollbar-thin max-h-48 overflow-y-auto">
                                    <div>
                                      <span className="text-slate-500 font-bold">// Tool Arguments Payload</span>
                                      <pre className="text-slate-300">{JSON.stringify(trace.tool.inputs, null, 2)}</pre>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 font-bold">// Database Return Response</span>
                                      <pre className="text-emerald-455">{JSON.stringify(trace.tool.outputs, null, 2)}</pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* STEP 8: TTS Waveform */}
                          <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3.5 relative overflow-hidden">
                            <div className="absolute right-3 top-3 text-[9px] font-mono text-slate-600 font-bold uppercase flex items-center gap-0.5">
                              <Clock className="w-3 h-3" /> Step 8: TTS
                            </div>
                            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2.5">
                              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                              Text-to-Speech Audio Synthesis
                            </h4>
                            
                            <div className="bg-slate-900 border border-slate-800/50 rounded-lg p-3 flex flex-col items-center justify-center gap-2">
                              <div className="flex items-center gap-1 h-8 w-full justify-center">
                                {[...Array(14)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    className="w-1 bg-emerald-500 rounded-full"
                                    animate={{ height: [4, 18 + Math.random() * 12, 4] }}
                                    transition={{ duration: 0.5 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.05 }}
                                  />
                                ))}
                              </div>
                              <span className="text-[9px] text-slate-500 font-mono">Synthesizer Latency: {trace?.tts?.latency_ms || 100.0}ms</span>
                            </div>
                          </div>

                        </div>
                      )}
                    </>
                  )}

                  {/* TAB 2: LIVE ORDER TRACKING MAP VIEW */}
                  {activeTab === 'map' && (
                    <div className="space-y-4">
                      
                      {/* Tracking Header Detail */}
                      <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 flex justify-between items-center shadow-sm">
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Tracking Amazon Order</p>
                          <p className="text-xs font-mono text-orange-400 font-bold">{trackerOrderId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Estimated ETA</p>
                          <p className="text-sm text-emerald-400 font-bold font-mono">
                            {eta > 0 ? `${eta} Mins` : "Delivered"}
                          </p>
                        </div>
                      </div>

                      {/* Realistic Vector Street Map */}
                      <div className="bg-slate-950 border border-slate-850 rounded-xl relative overflow-hidden h-72 p-1 shadow-inner">
                        <svg className="w-full h-full" viewBox="0 0 320 220">
                          
                          {/* Map Streets Lines */}
                          <line x1="20" y1="180" x2="300" y2="180" stroke="#101b2d" strokeWidth="6" strokeLinecap="round" />
                          <line x1="20" y1="180" x2="300" y2="180" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                          
                          <line x1="35" y1="165" x2="285" y2="55" stroke="#101b2d" strokeWidth="6" strokeLinecap="round" />
                          <line x1="35" y1="165" x2="285" y2="55" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />

                          <line x1="120" y1="20" x2="120" y2="200" stroke="#101b2d" strokeWidth="4" />
                          <line x1="120" y1="20" x2="120" y2="200" stroke="#1e293b" strokeWidth="1" />

                          <line x1="240" y1="40" x2="20" y2="200" stroke="#101b2d" strokeWidth="4" />
                          
                          {/* Glowing Delivery Path */}
                          <path 
                            d="M 35 165 L 95 125 L 165 145 L 235 95 L 285 55" 
                            fill="none" 
                            stroke="#ff9900" 
                            strokeWidth="3.5" 
                            strokeLinecap="round"
                            className="shadow-lg"
                          />
                          <path 
                            d="M 35 165 L 95 125 L 165 145 L 235 95 L 285 55" 
                            fill="none" 
                            stroke="#ff9900" 
                            strokeWidth="6" 
                            strokeLinecap="round"
                            opacity="0.15"
                            className="animate-pulse"
                          />

                          {/* Pulsing Location Markers */}
                          {mapPathPoints.map((pt, i) => {
                            const isDestination = i === mapPathPoints.length - 1;
                            const isOrigin = i === 0;
                            return (
                              <g key={i}>
                                <circle 
                                  cx={pt.x} cy={pt.y} 
                                  r={isDestination ? "7" : "5"} 
                                  fill={isDestination ? "#10b981" : isOrigin ? "#ff9900" : "#1e293b"} 
                                  stroke="#020617" 
                                  strokeWidth="1.5" 
                                />
                                {isDestination && (
                                  <circle cx={pt.x} cy={pt.y} r="14" fill="rgba(16, 185, 129, 0.2)" className="animate-ping" />
                                )}
                              </g>
                            );
                          })}

                          {/* Live Moving vehicle icon with coordinate interpolation */}
                          {trackingActive && (
                            <g>
                              {/* Courier glow ring */}
                              <circle cx={markerCoords.x} cy={markerCoords.y} r="13" fill="rgba(249, 115, 22, 0.25)" className="animate-ping" />
                              
                              {/* Glowing vehicle node */}
                              <circle cx={markerCoords.x} cy={markerCoords.y} r="7.5" fill="#020617" stroke="#ff9900" strokeWidth="2.5" />
                              
                              <path 
                                d="M -3 -3 L 4 0 L -3 3 Z" 
                                fill="#ff9900" 
                                transform={`translate(${markerCoords.x}, ${markerCoords.y})`}
                              />
                            </g>
                          )}
                        </svg>

                        {/* Location Checkpoint Tag overlay */}
                        <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-800 rounded px-2.5 py-1 text-[9px] font-mono text-slate-400">
                          📍 Current: <strong className="text-orange-400">
                            {trackingStep < 25 ? "Departing Hub" :
                             trackingStep >= 25 && trackingStep < 75 ? "In Transit (Main Ring Road)" :
                             trackingStep >= 75 && trackingStep < 98 ? "Approaching Indiranagar Gate" :
                             "Arrived & Delivered"}
                          </strong>
                        </div>
                      </div>

                      {/* Delivery Stages Checklist Timeline */}
                      <div className="space-y-2">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">DELIVERY TIMELINE STATUS</div>
                        
                        <div className="grid grid-cols-1 gap-2">
                          {mapPathPoints.map((pt, i) => {
                            const stepLimit = i * 25; // 0, 25, 50, 75, 100
                            const isPassed = trackingStep >= stepLimit || deliveryState === "Delivered";
                            const isActive = trackingStep >= stepLimit - 25 && trackingStep < stepLimit && deliveryState !== "Delivered";
                            
                            return (
                              <div key={i} className={`p-2.5 border rounded-xl flex items-center justify-between transition-colors duration-300 ${
                                isPassed ? 'bg-slate-950/40 border-emerald-500/20' : 
                                isActive ? 'bg-slate-900 border-orange-500/30 animate-pulse' : 
                                'bg-slate-950/20 border-slate-850 text-slate-500'
                              }`}>
                                <div className="flex items-center gap-2">
                                  {isPassed ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-450 shrink-0" />
                                  ) : isActive ? (
                                    <Navigation className="w-4 h-4 text-orange-400 shrink-0 animate-bounce" />
                                  ) : (
                                    <MapPin className="w-4 h-4 text-slate-700 shrink-0" />
                                  )}
                                  <div className="text-left">
                                    <p className={`text-xs font-bold ${isPassed ? 'text-slate-200' : isActive ? 'text-orange-400' : 'text-slate-500'}`}>
                                      {pt.name}
                                    </p>
                                    <p className="text-[9px] text-slate-500 mt-0.5">{pt.desc}</p>
                                  </div>
                                </div>
                                {isActive && (
                                  <span className="text-[9px] font-bold text-orange-400 font-mono tracking-wider animate-pulse">ACTIVE</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              </div>
            )}
            
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default CallSimulator;
