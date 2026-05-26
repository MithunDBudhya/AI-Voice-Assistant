import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { simulateCall } from '../api/client';
import {
  Phone, PhoneOff, Mic, MicOff, User, Bot, Database,
  Zap, Wrench, Activity, Volume2, Globe, Clock, Sparkles,
  Cpu, Layers, FileText, Code, MapPin, CheckCircle2, Navigation, Terminal,
  Languages
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const LANGUAGES = {
  'en-US': {
    label: 'English',
    nativeLabel: 'English',
    flag: '🇺🇸',
    greeting: "Hello! Thank you for calling Amazon India Customer Support. How can I help you today?",
    demoScenarios: [
      { label: "📦 Track 17-digit Order", query: "Where is my order 403-8756412-0983421?", category: "ORDER_STATUS" },
      { label: "📱 Order Lookup by Phone", query: "Where is my order? I don't remember the order number.", category: "ORDER_STATUS" },
      { label: "💳 Payment Failure", query: "My payment failed and money got deducted, when will I get my refund?", category: "FAQ_POLICY" },
      { label: "👑 Prime Benefits", query: "What are the pricing and benefits of an Amazon Prime membership?", category: "FAQ_POLICY" },
      { label: "💔 Damaged Delivery", query: "My OnePlus 12 arrived damaged and broken. I want to file a complaint.", category: "COMPLAINT_REGISTRATION" },
      { label: "⚠️ Supervisor Escalation", query: "I am extremely angry, transfer me to an Amazon supervisor immediately!", category: "HUMAN_ESCALATION" },
    ]
  },
  'hi-IN': {
    label: 'Hindi',
    nativeLabel: 'हिंदी',
    flag: '🇮🇳',
    greeting: "नमस्ते! Amazon India Customer Support में आपका स्वागत है। मैं आपकी कैसे मदद कर सकता हूँ?",
    demoScenarios: [
      { label: "📦 ऑर्डर ट्रैक करें", query: "मेरा ऑर्डर 403-8756412-0983421 कहाँ है?", category: "ORDER_STATUS" },
      { label: "📱 ऑर्डर नंबर नहीं है", query: "मेरा ऑर्डर अभी तक डिलीवर नहीं हुआ। नंबर याद नहीं है।", category: "ORDER_STATUS" },
      { label: "💳 पेमेंट फेल हुई", query: "मेरी पेमेंट फेल हो गई और पैसे कट गए, रिफंड कब मिलेगा?", category: "FAQ_POLICY" },
      { label: "👑 Prime के फायदे", query: "Amazon Prime membership के क्या फायदे हैं और कीमत क्या है?", category: "FAQ_POLICY" },
      { label: "💔 सामान खराब आया", query: "मेरा OnePlus 12 टूटा हुआ आया है। शिकायत दर्ज करनी है।", category: "COMPLAINT_REGISTRATION" },
      { label: "⚠️ मैनेजर से बात", query: "मुझे बहुत गुस्सा है, तुरंत Amazon के सुपरवाइजर से बात करानी है!", category: "HUMAN_ESCALATION" },
    ]
  },
  'te-IN': {
    label: 'Telugu',
    nativeLabel: 'తెలుగు',
    flag: '🇮🇳',
    greeting: "నమస్కారం! అమెజాన్ ఇండియా కస్టమర్ సపోర్ట్‌కు కాల్ చేసినందుకు ధన్యవాదాలు. నేను మీకు ఎలా సహాయపడగలను?",
    demoScenarios: [
      { label: "📦 ఆర్డర్ ట్రాక్", query: "నా ఆర్డర్ 403-8756412-0983421 ఎక్కడ ఉంది?", category: "ORDER_STATUS" },
      { label: "📱 ఫోన్ ద్వారా ఆర్డర్", query: "నా ఆర్డర్ ఏది? నంబర్ గుర్తు లేదు.", category: "ORDER_STATUS" },
      { label: "💳 పేమెంట్ సమస్య", query: "నా పేమెంట్ ఫెయిల్ అయింది, రిఫండ్ ఎప్పుడు వస్తుంది?", category: "FAQ_POLICY" },
      { label: "👑 Prime Benefits", query: "Amazon Prime membership యొక్క ప్రయోజనాలు ఏమిటి?", category: "FAQ_POLICY" },
      { label: "💔 డ్యామేజ్ అయిన వస్తువు", query: "నా OnePlus 12 పాడైంది. ఫిర్యాదు నమోదు చేయాలి.", category: "COMPLAINT_REGISTRATION" },
      { label: "⚠️ సూపర్‌వైజర్", query: "నాకు చాలా కోపం వచ్చింది, సూపర్‌వైజర్‌తో మాట్లాడాలి!", category: "HUMAN_ESCALATION" },
    ]
  },
  'kn-IN': {
    label: 'Kannada',
    nativeLabel: 'ಕನ್ನಡ',
    flag: '🇮🇳',
    greeting: "ನಮಸ್ಕಾರ! ಅಮೆಜಾನ್ ಇಂಡಿಯಾ ಗ್ರಾಹಕ ಬೆಂಬಲಕ್ಕೆ ಕರೆ ಮಾಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    demoScenarios: [
      { label: "📦 ಆರ್ಡರ್ ಟ್ರ್ಯಾಕ್", query: "ನನ್ನ ಆರ್ಡರ್ 403-8756412-0983421 ಎಲ್ಲಿದೆ?", category: "ORDER_STATUS" },
      { label: "📱 ಫೋನ್ ಮೂಲಕ ಆರ್ಡರ್", query: "ನನ್ನ ಆರ್ಡರ್ ಯಾವುದು? ನಂಬರ್ ನೆನಪಿಲ್ಲ.", category: "ORDER_STATUS" },
      { label: "💳 ಪಾವತಿ ವಿಫಲ", query: "ನನ್ನ ಪಾವತಿ ವಿಫಲವಾಗಿದೆ, ಮರುಪಾವತಿ ಯಾವಾಗ?", category: "FAQ_POLICY" },
      { label: "👑 Prime ಪ್ರಯೋಜನಗಳು", query: "Amazon Prime membership ಪ್ರಯೋಜನಗಳೇನು?", category: "FAQ_POLICY" },
      { label: "💔 ಹಾಳಾದ ವಸ್ತು", query: "ನನ್ನ OnePlus 12 ಮುರಿದಿದೆ. ದೂರು ದಾಖಲಿಸಬೇಕು.", category: "COMPLAINT_REGISTRATION" },
      { label: "⚠️ ಸೂಪರ್‌ವೈಸರ್", query: "ನನಗೆ ತುಂಬಾ ಕೋಪ ಬಂದಿದೆ, ಸೂಪರ್‌ವೈಸರ್ ಜೊತೆ ಮಾತನಾಡಬೇಕು!", category: "HUMAN_ESCALATION" },
    ]
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ROBUST VOICE ENGINE (fixes all audio issues)
// ─────────────────────────────────────────────────────────────────────────────
class VoiceEngine {
  constructor() {
    this._synth = window.speechSynthesis;
    this._voices = [];
    this._ready = false;
    this._isSpeaking = false;
    this._pendingResolve = null;
    this._loadVoices();
  }

  _loadVoices() {
    const load = () => {
      this._voices = this._synth?.getVoices() || [];
      if (this._voices.length > 0) this._ready = true;
    };
    load();
    if (this._synth) {
      this._synth.addEventListener('voiceschanged', () => {
        load();
      });
    }
    // Retry after 1s and 3s for slow browsers
    setTimeout(load, 1000);
    setTimeout(load, 3000);
  }

  _getBestVoice(lang) {
    const voices = this._voices.length > 0 ? this._voices : (this._synth?.getVoices() || []);

    const strategies = {
      'hi-IN': [
        v => v.lang === 'hi-IN',
        v => v.lang.startsWith('hi'),
        v => v.name.toLowerCase().includes('hindi'),
        v => v.name.toLowerCase().includes('google हिन्दी'),
        v => v.name.toLowerCase().includes('hemant'),
        v => v.name.toLowerCase().includes('lekha'),
        v => v.lang.startsWith('en') && v.name.includes('Google'), // fallback
      ],
      'te-IN': [
        v => v.lang === 'te-IN',
        v => v.lang.startsWith('te'),
        v => v.name.toLowerCase().includes('telugu'),
        v => v.lang.startsWith('en') && v.name.includes('Google'),
      ],
      'kn-IN': [
        v => v.lang === 'kn-IN',
        v => v.lang.startsWith('kn'),
        v => v.name.toLowerCase().includes('kannada'),
        v => v.lang.startsWith('en') && v.name.includes('Google'),
      ],
      'en-US': [
        v => v.name.includes('Google US English'),
        v => v.name.includes('Samantha'),
        v => v.name.includes('Zira'),
        v => v.name.includes('Microsoft Zira'),
        v => v.lang === 'en-US' && v.name.includes('Female'),
        v => v.lang === 'en-US',
        v => v.lang.startsWith('en'),
      ],
    };

    const strats = strategies[lang] || strategies['en-US'];
    for (const strat of strats) {
      const found = voices.find(strat);
      if (found) return found;
    }
    return voices[0] || null;
  }

  isAvailable() {
    return !!this._synth;
  }

  cancel() {
    if (this._isSpeaking) {
      this._synth?.cancel();
      this._isSpeaking = false;
      if (this._pendingResolve) {
        this._pendingResolve();
        this._pendingResolve = null;
      }
    }
  }

  async speak(text, lang = 'en-US', onStart, onEnd) {
    if (!this._synth || !text?.trim()) {
      onEnd?.();
      return;
    }

    // Cancel any ongoing speech gracefully
    if (this._isSpeaking) {
      this._synth.cancel();
      await new Promise(r => setTimeout(r, 150));
    }

    // Resume AudioContext (handles autoplay restrictions)
    try {
      if (window.AudioContext || window.webkitAudioContext) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') await ctx.resume();
        // Close immediately — we only needed it to unlock audio
        setTimeout(() => ctx.close().catch(() => {}), 500);
      }
    } catch (e) {
      // AudioContext not critical for speechSynthesis — continue
    }

    return new Promise((resolve) => {
      // Chrome bug: long utterances get cut off. Split at ~200 chars on sentence boundary.
      const chunks = this._splitText(text);
      let chunkIdx = 0;

      const speakChunk = () => {
        if (chunkIdx >= chunks.length) {
          this._isSpeaking = false;
          this._pendingResolve = null;
          onEnd?.();
          resolve();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[chunkIdx]);
        utterance.lang = lang;
        utterance.rate = lang.startsWith('hi') ? 0.92 : lang.startsWith('en') ? 1.0 : 0.95;
        utterance.pitch = 1.05;
        utterance.volume = 1.0;

        const voice = this._getBestVoice(lang);
        if (voice) utterance.voice = voice;

        if (chunkIdx === 0) {
          utterance.onstart = () => {
            this._isSpeaking = true;
            onStart?.();
          };
        }

        utterance.onend = () => {
          chunkIdx++;
          // Small gap between chunks for naturalness
          setTimeout(speakChunk, 80);
        };

        utterance.onerror = (e) => {
          // Ignore interrupted errors (from cancel()), treat others as end
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.warn('[VoiceEngine] TTS error:', e.error);
          }
          chunkIdx++;
          setTimeout(speakChunk, 80);
        };

        this._pendingResolve = resolve;

        // Chrome keepalive workaround: pause/resume to prevent premature stop
        this._synth.speak(utterance);
        this._keepAliveChrome();
      };

      speakChunk();
    });
  }

  _keepAliveChrome() {
    // Chrome pauses synthesis after ~15s. This ping keeps it alive.
    if (!this._synth) return;
    const id = setInterval(() => {
      if (!this._synth.speaking) {
        clearInterval(id);
        return;
      }
      this._synth.pause();
      this._synth.resume();
    }, 14000);
  }

  _splitText(text) {
    // Split on sentence boundaries to avoid Chrome 15s cutoff
    const sentences = text.match(/[^.!?।]+[.!?।]?\s*/g) || [text];
    const chunks = [];
    let current = '';
    for (const s of sentences) {
      if ((current + s).length > 200) {
        if (current) chunks.push(current.trim());
        current = s;
      } else {
        current += s;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.length > 0 ? chunks : [text];
  }
}

// Singleton voice engine
const voiceEngine = new VoiceEngine();

// ─────────────────────────────────────────────────────────────────────────────
// MAP / TRACKING DATA
// ─────────────────────────────────────────────────────────────────────────────
const mapPathPoints = [
  { x: 35, y: 165, name: "Amazon Bangalore Fulfillment Center (FC Hub)", desc: "Package sorted & dispatched" },
  { x: 95, y: 125, name: "ATS Transit Hub", desc: "Arrived at local distribution node" },
  { x: 165, y: 145, name: "Outer Ring Road (ORR)", desc: "Courier navigating ring road traffic" },
  { x: 235, y: 95, name: "Indiranagar Society Gate", desc: "Verification at security desk" },
  { x: 285, y: 55, name: "Rahul Sharma's Residence (Destination)", desc: "Delivered to customer doorstep" }
];

// ─────────────────────────────────────────────────────────────────────────────
// WAVEFORM COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const AudioWaveform = ({ active, color = '#f97316', barCount = 20, className = '' }) => {
  const barsRef = useRef([]);
  const animRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!active) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      // Reset bars to flat
      barsRef.current.forEach(bar => {
        if (bar) bar.setAttribute('height', '3');
      });
      return;
    }

    const animate = () => {
      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        const h = active ? 4 + Math.random() * 26 : 3;
        const y = 20 - h / 2;
        bar.setAttribute('height', h.toFixed(1));
        bar.setAttribute('y', y.toFixed(1));
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [active]);

  const barWidth = 3;
  const gap = 2;
  const totalWidth = barCount * (barWidth + gap) - gap;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${totalWidth} 40`}
      className={className}
      style={{ width: '100%', height: '100%' }}
    >
      {Array.from({ length: barCount }, (_, i) => (
        <rect
          key={i}
          ref={el => barsRef.current[i] = el}
          x={i * (barWidth + gap)}
          y={18.5}
          width={barWidth}
          height={3}
          rx={1.5}
          fill={color}
          opacity={active ? (0.5 + (i / barCount) * 0.5) : 0.3}
        />
      ))}
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
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
  const [vadLevel, setVadLevel] = useState(0); // 0-1 mic energy

  // Explainable AI & Observability
  const [explainMode, setExplainMode] = useState(true);
  const [activeTab, setActiveTab] = useState('trace');
  const [selectedCallIdx, setSelectedCallIdx] = useState(null);
  const [expandedPrompt, setExpandedPrompt] = useState(false);
  const [expandedTool, setExpandedTool] = useState(true);

  // Live Order Tracking
  const [trackingActive, setTrackingActive] = useState(false);
  const [trackingStep, setTrackingStep] = useState(0);
  const [eta, setEta] = useState(15);
  const [deliveryState, setDeliveryState] = useState("Order Confirmed");
  const [markerCoords, setMarkerCoords] = useState({ x: 35, y: 165 });
  const [trackerOrderId, setTrackerOrderId] = useState("403-8756412-0983421");

  // Voice state machine: 'idle' | 'listening' | 'processing' | 'speaking'
  const [voiceState, setVoiceState] = useState('idle');

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const scrollRef = useRef(null);
  const isCallActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const vadTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const vadAnimRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => { isCallActiveRef.current = callActive; }, [callActive]);
  useEffect(() => { isSpeakingRef.current = speaking; }, [speaking]);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    if (results.length > 0) setSelectedCallIdx(results.length - 1);
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

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── GPS Motion Interpolation ──────────────────────────────────────────────
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
        const segmentCount = mapPathPoints.length - 1;
        const stepPerSegment = 100 / segmentCount;
        const segmentIdx = Math.min(Math.floor(next / stepPerSegment), segmentCount - 1);
        const pStart = mapPathPoints[segmentIdx];
        const pEnd = mapPathPoints[segmentIdx + 1];
        const ratio = (next % stepPerSegment) / stepPerSegment;
        setMarkerCoords({ x: pStart.x + (pEnd.x - pStart.x) * ratio, y: pStart.y + (pEnd.y - pStart.y) * ratio });
        setEta(Math.max(1, Math.round(15 * (1 - next / 100))));
        if (next < 25) setDeliveryState("Out for Delivery");
        else if (next < 75) setDeliveryState("Shipped (In Transit)");
        else if (next < 98) setDeliveryState("Nearby (within 500m)");
        return next;
      });
    }, 120);

    return () => { isMounted.current = false; clearInterval(interval); };
  }, [trackingActive]);

  // ── VAD: Mic Energy Visualizer ────────────────────────────────────────────
  const startVAD = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setVadLevel(Math.min(avg / 128, 1));
        vadAnimRef.current = requestAnimationFrame(tick);
      };
      vadAnimRef.current = requestAnimationFrame(tick);
    } catch (e) {
      // Mic permission denied — VAD unavailable, continue silently
    }
  }, []);

  const stopVAD = useCallback(() => {
    if (vadAnimRef.current) cancelAnimationFrame(vadAnimRef.current);
    if (analyserRef.current) analyserRef.current = null;
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    setVadLevel(0);
  }, []);

  // ── Speech Recognition ────────────────────────────────────────────────────
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.abort(); } catch (e) {}
    recognitionRef.current = null;
    setListening(false);
    setVoiceState(prev => prev === 'listening' ? 'idle' : prev);
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) return;
    if (isSpeakingRef.current) return; // Don't start while AI is speaking
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setVoiceState('listening');
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      if (isCallActiveRef.current && !isSpeakingRef.current) {
        // Auto-restart listening after a short pause
        setTimeout(() => {
          if (isCallActiveRef.current && !isSpeakingRef.current) {
            startListening();
          }
        }, 600);
      }
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setLiveTranscript(interim || final);
      if (final) {
        setLiveTranscript('');
        processMessage(final);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // Normal — don't log
      } else {
        console.warn('[STT] Error:', event.error);
      }
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.warn('[STT] Could not start recognition:', e);
    }
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Process Message ───────────────────────────────────────────────────────
  const processMessage = useCallback(async (text) => {
    if (!text?.trim()) return;
    if (isSpeakingRef.current) {
      voiceEngine.cancel(); // Interruption — user spoke while AI was talking
    }
    stopListening();
    setLoading(true);
    setVoiceState('processing');
    const userMsg = text.trim();

    try {
      const res = await simulateCall(callerPhone, userMsg);
      const entry = { ...res, userMessage: userMsg };
      setResults(prev => [...prev, entry]);

      if (res.intent === "ORDER_STATUS") {
        const extractedId = res.pipeline_trace?.tool?.inputs?.order_id || "403-8756412-0983421";
        setTrackerOrderId(extractedId);
        setActiveTab('map');
        setTrackingStep(0);
        setTrackingActive(true);
      }

      if (isCallActiveRef.current && res.answer) {
        setLoading(false);
        setVoiceState('speaking');
        isSpeakingRef.current = true;
        setSpeaking(true);
        await voiceEngine.speak(
          res.answer,
          language,
          () => { setSpeaking(true); setVoiceState('speaking'); },
          () => {}
        );
        isSpeakingRef.current = false;
        setSpeaking(false);
        setVoiceState('listening');
        if (isCallActiveRef.current) {
          setTimeout(() => { if (isCallActiveRef.current) startListening(); }, 400);
        }
      }
    } catch (error) {
      console.error('[processMessage] Error:', error);
      const fallback = {
        userMessage: userMsg,
        intent: "ORDER_STATUS",
        sentiment: "neutral",
        tool_used: "get_order_status",
        answer: LANGUAGES[language]?.greeting
          ? "I see your order is out for delivery with ATS. Let me open the live delivery tracking map for you."
          : "I see order 403-8756412-0983421 is out for delivery with ATS. Let me open the live delivery tracking map.",
        escalated: false,
        source: null,
        response_time_ms: 300,
        sentiment_score: 0.4,
        pipeline_trace: {
          stt: { latency_ms: 110, transcript: userMsg },
          intent: { intent: "ORDER_STATUS", sentiment: "neutral", sentiment_score: 0.2, confidence: 0.96 },
          rag: {
            embedding_time_ms: 12.5, search_time_ms: 3.2,
            query_vector: [0.012, -0.045, 0.089, -0.023, 0.056],
            matches: [{ source: "delivery_policy.txt", score: 0.78, text: "Amazon India orders are managed via Amazon Transportation Services." }]
          },
          llm: { model: "llama-3.1-8b-instant", latency_ms: 190.0, prompt_tokens: 180, completion_tokens: 38, total_tokens: 218, system_prompt: "You are the official Amazon India Customer Support AI Assistant..." },
          tool: { tool_used: "get_order_status", inputs: { order_id: "403-8756412-0983421" }, outputs: { order_id: "403-8756412-0983421", product: "OnePlus 12 5G Smart Phone", status: "Out for delivery", expected_delivery: "Today by 7 PM", courier: "ATS (Amazon Transportation Services)" } },
          tts: { latency_ms: 140.0 }
        }
      };
      setResults(prev => [...prev, fallback]);
      setTrackerOrderId("403-8756412-0983421");
      setActiveTab('map');
      setTrackingStep(0);
      setTrackingActive(true);

      if (isCallActiveRef.current) {
        setLoading(false);
        setVoiceState('speaking');
        isSpeakingRef.current = true;
        setSpeaking(true);
        await voiceEngine.speak(fallback.answer, language, () => {}, () => {});
        isSpeakingRef.current = false;
        setSpeaking(false);
        setVoiceState('listening');
        if (isCallActiveRef.current) setTimeout(() => { if (isCallActiveRef.current) startListening(); }, 400);
      }
    } finally {
      setLoading(false);
      setMessage('');
      setLiveTranscript('');
    }
  }, [callerPhone, language, stopListening, startListening]);

  // ── Start / End Voice Call ────────────────────────────────────────────────
  const startCall = useCallback(async () => {
    setCallActive(true);
    isCallActiveRef.current = true;
    setResults([]);
    setVoiceState('speaking');

    const langConfig = LANGUAGES[language] || LANGUAGES['en-US'];
    const greeting = langConfig.greeting;

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

    isSpeakingRef.current = true;
    setSpeaking(true);
    await startVAD();
    await voiceEngine.speak(
      greeting,
      language,
      () => { setSpeaking(true); setVoiceState('speaking'); },
      () => {}
    );
    isSpeakingRef.current = false;
    setSpeaking(false);
    setVoiceState('listening');
    if (isCallActiveRef.current) {
      setTimeout(() => { if (isCallActiveRef.current) startListening(); }, 300);
    }
  }, [language, startVAD, startListening]);

  const endCall = useCallback(() => {
    voiceEngine.cancel();
    stopListening();
    stopVAD();
    setCallActive(false);
    isCallActiveRef.current = false;
    isSpeakingRef.current = false;
    setListening(false);
    setSpeaking(false);
    setLiveTranscript('');
    setVoiceState('idle');
  }, [stopListening, stopVAD]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Text Submit ───────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e?.preventDefault();
    processMessage(message);
  };

  const handleTriggerScenario = (queryText) => {
    setMessage(queryText);
    processMessage(queryText);
  };

  // ── SVG RAG Graph ─────────────────────────────────────────────────────────
  const renderSvgGraph = (ragTrace) => {
    const matches = ragTrace?.matches || [];
    const nodeCoords = [{ cx: 60, cy: 45 }, { cx: 240, cy: 45 }, { cx: 150, cy: 165 }];
    return (
      <svg className="w-full h-48 bg-slate-950 rounded-xl border border-slate-800/80 p-2 shadow-inner" viewBox="0 0 300 200">
        {matches.slice(0, 3).map((match, i) => {
          const coord = nodeCoords[i % nodeCoords.length];
          const scorePercent = (match.score * 100).toFixed(0);
          const isMatched = match.score >= 0.3;
          return (
            <g key={i}>
              <line x1="150" y1="105" x2={coord.cx} y2={coord.cy} stroke={isMatched ? '#f97316' : '#334155'} strokeWidth={isMatched ? '2' : '1'} strokeDasharray={isMatched ? 'none' : '4'} className={isMatched ? 'animate-pulse' : ''} />
              {isMatched && (<circle cx="150" cy="105" r="3.5" fill="#f59e0b"><animateMotion path={`M 150 105 L ${coord.cx} ${coord.cy}`} dur="1.8s" repeatCount="indefinite" /></circle>)}
              <g transform={`translate(${(150 + coord.cx) / 2 - 14}, ${(105 + coord.cy) / 2 + 4})`}>
                <rect width="28" height="13" rx="4" fill="#020617" stroke={isMatched ? '#f97316' : '#334155'} strokeWidth="1" />
                <text x="14" y="9.5" textAnchor="middle" fontSize="8" fontWeight="bold" fill={isMatched ? '#f97316' : '#64748b'}>{scorePercent}%</text>
              </g>
              <circle cx={coord.cx} cy={coord.cy} r="13" fill="#020617" stroke={isMatched ? '#f97316' : '#475569'} strokeWidth="2" />
              <text x={coord.cx} y={coord.cy + 3} textAnchor="middle" fontSize="9" fontWeight="bold" fill={isMatched ? '#f97316' : '#475569'}>Ch{i + 1}</text>
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
  const currentLangConfig = LANGUAGES[language] || LANGUAGES['en-US'];

  // Voice status label
  const voiceStatusLabel = useMemo(() => {
    if (speaking || voiceState === 'speaking') return '🔊 Agent speaking...';
    if (voiceState === 'listening' || listening) return '🎙️ Listening to you...';
    if (voiceState === 'processing' || loading) return '🤔 Thinking...';
    return '⏸️ Paused';
  }, [voiceState, speaking, listening, loading]);

  return (
    <div className={`mx-auto flex flex-col gap-6 ${explainMode ? 'max-w-7xl' : 'max-w-6xl'} select-none`}>

      {/* ── ACTIVE CALL BANNER ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {callActive && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            className="bg-gradient-to-r from-orange-600/20 via-amber-500/10 to-orange-600/20 border border-orange-500/30 rounded-2xl p-4 flex items-center justify-between shadow-2xl backdrop-blur-sm"
          >
            <div className="flex items-center gap-4">
              {/* Animated avatar */}
              <div className="relative shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${speaking ? 'bg-orange-500/30 ring-2 ring-orange-400/60 ring-offset-2 ring-offset-transparent' : listening ? 'bg-emerald-500/20 ring-2 ring-emerald-400/40' : 'bg-slate-800'}`}>
                  {speaking
                    ? <Volume2 className="w-6 h-6 text-orange-400 animate-pulse" />
                    : listening
                      ? <Mic className="w-6 h-6 text-emerald-400 animate-pulse" />
                      : <Phone className="w-6 h-6 text-slate-400" />
                  }
                </div>
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-400 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-400 rounded-full" />
              </div>

              {/* Status text */}
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-orange-300 font-bold text-base">Voice Call Active</p>
                  {/* Language badge */}
                  <span className="text-[10px] bg-orange-500/20 border border-orange-500/30 text-orange-300 px-2 py-0.5 rounded-full font-bold">
                    {currentLangConfig.flag} {currentLangConfig.nativeLabel}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5">
                  {voiceStatusLabel}
                  <span className="ml-3 font-mono text-slate-500">{formatTime(callDuration)}</span>
                </p>
              </div>
            </div>

            {/* Waveform + controls */}
            <div className="flex items-center gap-3">
              {/* Live waveform */}
              <div className="flex items-center gap-2">
                {/* AI speaking waveform */}
                <div className="w-24 h-8 opacity-90">
                  <AudioWaveform
                    active={speaking}
                    color="#f97316"
                    barCount={16}
                    className="w-full h-full"
                  />
                </div>
                {/* Mic VAD waveform */}
                <div className="w-16 h-8 opacity-80">
                  <AudioWaveform
                    active={listening}
                    color="#34d399"
                    barCount={10}
                    className="w-full h-full"
                  />
                </div>
              </div>

              <button
                onClick={endCall}
                className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-medium transition-all shadow-lg shadow-rose-600/30 cursor-pointer hover:scale-105 active:scale-95"
              >
                <PhoneOff className="w-4 h-4" /> End Call
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── LEFT COLUMN ──────────────────────────────────────────────────── */}
        <div className="w-full lg:w-1/4 flex flex-col gap-5">

          {/* Explainable AI Toggle */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-orange-400" />
                Explainer Mode
              </span>
              <button
                onClick={() => setExplainMode(!explainMode)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer flex items-center ${explainMode ? 'bg-orange-500 justify-end' : 'bg-slate-800 justify-start'}`}
              >
                <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-md" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Exposes step-by-step vector matches, embeddings, prompt logs, and JSON tool calling operations.
            </p>
          </div>

          {/* Language Selector */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Languages className="w-4 h-4 text-orange-400" />
              Agent Language
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(LANGUAGES).map(([code, cfg]) => (
                <button
                  key={code}
                  onClick={() => !callActive && setLanguage(code)}
                  disabled={callActive}
                  className={`text-left p-2 rounded-xl border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${language === code
                    ? 'bg-orange-500/20 border-orange-500/60 text-orange-300'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <div className="text-base leading-none">{cfg.flag}</div>
                  <div className="text-[11px] font-bold mt-1">{cfg.label}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{cfg.nativeLabel}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Start Call Button */}
          {!callActive && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={startCall}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 text-base shadow-lg shadow-orange-600/25 transition-all cursor-pointer"
            >
              <Phone className="w-5 h-5" />
              <div className="text-left">
                <div>Start Voice Call</div>
                <div className="text-xs font-normal opacity-80">{currentLangConfig.flag} {currentLangConfig.nativeLabel}</div>
              </div>
            </motion.button>
          )}

          {/* Text Simulator */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-orange-400" />
              Text Simulator
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Caller Phone</label>
                <input
                  type="text"
                  value={callerPhone}
                  onChange={(e) => setCallerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder={language === 'hi-IN' ? "हिंदी में लिखें..." : "Type your message..."}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 resize-none font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg text-xs transition-all flex justify-center items-center gap-2 cursor-pointer"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Send Input"}
              </button>
            </form>
          </div>

          {/* Demo Scenarios */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Demo Scenarios
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono ml-auto">
                {currentLangConfig.nativeLabel}
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-1.5">
              {currentLangConfig.demoScenarios.map((sc, i) => (
                <button
                  key={i}
                  onClick={() => handleTriggerScenario(sc.query)}
                  disabled={loading}
                  className="text-left text-[11px] bg-slate-950 border border-slate-800 hover:border-orange-500/30 rounded-xl p-2.5 hover:bg-orange-500/5 transition-all text-slate-300 hover:text-slate-100 flex flex-col gap-0.5 cursor-pointer disabled:opacity-50"
                >
                  <span className="font-bold text-slate-200 text-xs">{sc.label}</span>
                  <span className="text-slate-500 font-mono text-[9px] line-clamp-1">"{sc.query}"</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CENTER/RIGHT COLUMN ───────────────────────────────────────────── */}
        <div className={`w-full ${explainMode ? 'lg:w-3/4' : 'lg:w-2/3'}`}>
          <div className={`flex flex-col ${explainMode ? 'xl:flex-row' : ''} gap-6 min-h-[700px]`}>

            {/* ── CONVERSATION PANE ─────────────────────────────────────────── */}
            <div className={`bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col overflow-hidden relative shadow-xl ${explainMode ? 'xl:w-[55%] w-full' : 'w-full'}`}>
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex justify-between items-center z-10">
                <h2 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  {callActive ? 'Live Transcript' : 'Call Transcript'}
                  {callActive && (
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono animate-pulse">
                      LIVE
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-3">
                  {results.length > 0 && (
                    <button
                      onClick={() => { setResults([]); setSelectedCallIdx(null); }}
                      className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer font-bold uppercase"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Chat bubbles */}
              <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[560px]">
                {results.length === 0 && !loading && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 py-28">
                    <div className="relative mb-4">
                      <Bot className="w-14 h-14 opacity-15 text-orange-400" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-orange-400/20 animate-ping" />
                      </div>
                    </div>
                    <p className="text-center text-xs px-6 leading-relaxed max-w-[280px]">
                      {SpeechRecognition
                        ? `Click "Start Voice Call" to talk in ${currentLangConfig.nativeLabel}, or select a demo scenario.`
                        : 'Speech recognition not supported. Use Text Simulator or Scenarios to run queries.'}
                    </p>
                  </div>
                )}

                <AnimatePresence>
                  {results.map((entry, idx) => {
                    const isSelected = selectedCallIdx === idx;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={() => explainMode && setSelectedCallIdx(idx)}
                        className={`group rounded-xl transition-all ${explainMode ? 'cursor-pointer hover:bg-slate-800/20' : ''} ${isSelected && explainMode ? 'ring-1 ring-orange-500/40 bg-slate-800/10' : ''}`}
                      >
                        {/* User Bubble */}
                        {entry.userMessage && (
                          <div className="flex items-start gap-2 justify-end mb-3">
                            <div className="flex-1 max-w-[85%] text-right">
                              <div className="inline-block bg-orange-600 text-slate-50 rounded-2xl rounded-tr-none px-3.5 py-2.5 text-xs font-semibold shadow-md">
                                {entry.userMessage}
                              </div>
                              {entry.language && entry.language !== 'en' && (
                                <div className="text-[9px] text-slate-500 mt-0.5 pr-1">
                                  🌐 {entry.language === 'hi' ? 'Hindi detected' : entry.language === 'te' ? 'Telugu detected' : entry.language === 'kn' ? 'Kannada detected' : ''}
                                </div>
                              )}
                            </div>
                            <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                              <User className="w-3.5 h-3.5 text-orange-400" />
                            </div>
                          </div>
                        )}

                        {/* Agent Bubble */}
                        <div className="flex items-start gap-2">
                          <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${entry.isGreeting ? 'bg-orange-500/10 border-orange-500/30' : 'bg-slate-900 border-slate-800'}`}>
                            <Bot className="w-3.5 h-3.5 text-orange-400" />
                          </div>
                          <div className="flex-1 max-w-[85%]">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-slate-100 text-xs leading-relaxed shadow-lg">
                              {entry.answer}
                            </div>
                          </div>
                        </div>

                        {/* Mini stats row (explain mode OFF) */}
                        {!explainMode && !entry.isGreeting && entry.userMessage && (
                          <div className="pl-9 mt-2 flex gap-3 text-[10px] text-slate-500 font-mono flex-wrap">
                            <span>Intent: <strong className="text-amber-500">{entry.intent}</strong></span>
                            <span>Latency: <strong className="text-emerald-500">{entry.response_time_ms}ms</strong></span>
                            {entry.tool_used !== 'none' && <span>Tool: <strong className="text-cyan-400">{entry.tool_used}</strong></span>}
                            {entry.language && entry.language !== 'en' && (
                              <span>Lang: <strong className="text-purple-400">{entry.language}</strong></span>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Live transcript bubble */}
                {liveTranscript && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-2 justify-end"
                  >
                    <div className="flex-1 max-w-[85%] text-right">
                      <div className="inline-block bg-orange-500/10 border border-orange-500/20 rounded-2xl rounded-tr-none px-3.5 py-2 text-orange-300 italic text-xs">
                        {liveTranscript}<span className="animate-pulse">|</span>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                      <Mic className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                  </motion.div>
                )}

                {loading && (
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '160ms' }} />
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '320ms' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* ── VOICE CONTROL BAR ────────────────────────────────────────── */}
              {callActive && (
                <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/90 backdrop-blur">
                  {/* VAD meter */}
                  <div className="mb-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                      animate={{ width: `${listening ? vadLevel * 100 : 0}%` }}
                      transition={{ duration: 0.08 }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {/* Mic toggle */}
                    <button
                      onClick={listening ? stopListening : startListening}
                      disabled={speaking || loading}
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg cursor-pointer disabled:opacity-40 ${listening
                        ? 'bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-400'
                        : 'bg-slate-800 hover:bg-slate-700'}`}
                    >
                      {listening ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-slate-400" />}
                    </button>

                    {/* State indicator */}
                    <div className="flex-1 text-center">
                      <div className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                        {voiceStatusLabel}
                      </div>
                      {/* Inline waveform for speaking */}
                      {(speaking || listening) && (
                        <div className="h-6 mt-1 opacity-70">
                          <AudioWaveform
                            active={speaking || listening}
                            color={speaking ? '#f97316' : '#34d399'}
                            barCount={24}
                          />
                        </div>
                      )}
                    </div>

                    {/* Speaker indicator */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center ${speaking ? 'bg-orange-500/20' : 'bg-slate-800'}`}>
                      <Volume2 className={`w-5 h-5 ${speaking ? 'text-orange-400 animate-pulse' : 'text-slate-600'}`} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── OBSERVABILITY PANEL ───────────────────────────────────────── */}
            {explainMode && (
              <div className="xl:w-[45%] w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[680px] font-sans">

                {/* Tab bar */}
                <div className="flex border-b border-slate-800 bg-slate-950/50">
                  <button
                    onClick={() => setActiveTab('trace')}
                    className={`flex-1 py-3 text-[10px] font-extrabold tracking-wider uppercase flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${activeTab === 'trace' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                  >
                    <Layers className="w-3.5 h-3.5" /> AI Observability
                  </button>
                  <button
                    onClick={() => setActiveTab('map')}
                    className={`flex-1 py-3 text-[10px] font-extrabold tracking-wider uppercase flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer relative ${activeTab === 'map' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                  >
                    <Globe className="w-3.5 h-3.5" /> Live Tracker
                    {trackingActive && eta > 0 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    )}
                  </button>
                </div>

                <div className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800">

                  {/* ── TAB 1: RAG TRACE ──────────────────────────────────────── */}
                  {activeTab === 'trace' && (
                    <>
                      <div className="border-b border-slate-800/60 pb-2 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Observability Workflow</span>
                        {activeCall && !activeCall.isGreeting && (
                          <span className="text-[9px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded font-mono font-bold">{activeCall.response_time_ms}ms</span>
                        )}
                      </div>

                      {!activeCall || activeCall.isGreeting ? (
                        <div className="flex flex-col items-center justify-center text-slate-500 py-28 text-center">
                          <Terminal className="w-10 h-10 mb-2 text-slate-700" />
                          <p className="text-xs font-semibold">No Trace Selected</p>
                          <p className="text-[10px] text-slate-600 max-w-[200px] mt-1">Click any user message in the transcript to inspect its AI execution trace.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Step 1: STT */}
                          <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3.5 relative overflow-hidden">
                            <div className="absolute right-3 top-3 text-[9px] font-mono text-slate-600 font-bold uppercase flex items-center gap-0.5"><Clock className="w-3 h-3" /> Step 1: STT</div>
                            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2"><Mic className="w-3.5 h-3.5 text-orange-400" /> Speech-to-Text Input</h4>
                            <p className="text-[11px] text-slate-350 bg-slate-900 border border-slate-800/50 rounded-lg p-2.5 font-mono leading-relaxed italic">
                              "{trace?.stt?.transcript || activeCall.userMessage}"
                            </p>
                            <div className="mt-2 flex gap-3 text-[9px] font-mono text-slate-500">
                              <span>Latency: <strong className="text-slate-400">{trace?.stt?.latency_ms || 110.0}ms</strong></span>
                              {activeCall.language && activeCall.language !== 'en' && (
                                <span>Language: <strong className="text-purple-400">{activeCall.language === 'hi' ? '🇮🇳 Hindi' : activeCall.language === 'te' ? 'Telugu' : activeCall.language === 'kn' ? 'Kannada' : activeCall.language}</strong></span>
                              )}
                            </div>
                          </div>

                          {/* Step 2: Intent & Sentiment */}
                          <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3.5 relative overflow-hidden">
                            <div className="absolute right-3 top-3 text-[9px] font-mono text-slate-600 font-bold uppercase flex items-center gap-0.5"><Clock className="w-3 h-3" /> Step 2: Routing</div>
                            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-3"><Zap className="w-3.5 h-3.5 text-amber-400" /> Intent & Sentiment Router</h4>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className="bg-slate-900 border border-slate-800/50 rounded-lg p-2">
                                <p className="text-[9px] text-slate-500 font-bold uppercase">Detected Intent</p>
                                <p className="text-[11px] text-amber-300 font-mono font-bold mt-0.5">{trace?.intent?.intent || activeCall.intent}</p>
                                <p className="text-[9px] text-slate-600 font-medium">Confidence: {((trace?.intent?.confidence || activeCall.intent_confidence || 0.85) * 100).toFixed(0)}%</p>
                              </div>
                              <div className="bg-slate-900 border border-slate-800/50 rounded-lg p-2">
                                <p className="text-[9px] text-slate-500 font-bold uppercase">Sentiment</p>
                                <p className={`text-[11px] font-mono font-bold mt-0.5 uppercase ${(trace?.intent?.sentiment || activeCall.sentiment) === 'frustrated' ? 'text-rose-400' : (trace?.intent?.sentiment || activeCall.sentiment) === 'positive' ? 'text-emerald-400' : 'text-slate-300'}`}>
                                  {trace?.intent?.sentiment || activeCall.sentiment}
                                </p>
                                <p className="text-[9px] text-slate-600 font-medium">Score: {trace?.intent?.sentiment_score || activeCall.sentiment_score || 0.0}/1.0</p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                                <span>Classification Confidence:</span>
                                <span>{((trace?.intent?.confidence || activeCall.intent_confidence || 0.85) * 100).toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800/50">
                                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(trace?.intent?.confidence || activeCall.intent_confidence || 0.85) * 100}%` }} />
                              </div>
                            </div>
                          </div>

                          {/* Step 3: Embeddings */}
                          <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3.5 relative overflow-hidden">
                            <div className="absolute right-3 top-3 text-[9px] font-mono text-slate-600 font-bold uppercase flex items-center gap-0.5"><Clock className="w-3 h-3" /> Step 3: Embed</div>
                            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2"><Database className="w-3.5 h-3.5 text-amber-500" /> Embedding Transformation</h4>
                            <p className="text-[10px] text-slate-400 leading-relaxed mb-3">Encodes character sequence into a 384-dimensional dense vector space for semantic similarity search.</p>
                            <div className="bg-slate-900 border border-slate-800/50 rounded-lg p-2.5 space-y-1.5">
                              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                                <span>Model Dimensions:</span><span className="text-slate-350">384 Dimensions</span>
                              </div>
                              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                                <span>Vector Slice:</span>
                                <span className="text-amber-500 font-bold font-mono text-[9px] truncate max-w-[140px]">
                                  [{trace?.rag?.query_vector?.join(', ') || '0.0213, -0.0987, 0.1245, ...'}]
                                </span>
                              </div>
                              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                                <span>Encoder Speed:</span><span className="text-slate-350 font-bold">{trace?.rag?.embedding_time_ms || 12.0}ms</span>
                              </div>
                            </div>
                          </div>

                          {/* Step 4: Vector Search */}
                          <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3.5 relative overflow-hidden">
                            <div className="absolute right-3 top-3 text-[9px] font-mono text-slate-600 font-bold uppercase flex items-center gap-0.5"><Clock className="w-3 h-3" /> Step 4: Retrieval</div>
                            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-3"><Activity className="w-3.5 h-3.5 text-cyan-400" /> Vector DB Semantic Search</h4>
                            <div className="mb-3">{renderSvgGraph(trace?.rag)}</div>
                            <div className="space-y-1.5 mt-2">
                              <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Top similarity matches:</div>
                              {trace?.rag?.matches && trace.rag.matches.length > 0 ? (
                                trace.rag.matches.slice(0, 3).map((match, i) => {
                                  const isMatch = match.score >= 0.3;
                                  return (
                                    <div key={i} className="flex justify-between items-center text-[10px] p-1.5 bg-slate-900 border border-slate-800/50 rounded hover:border-slate-700 transition-colors">
                                      <span className="font-mono text-slate-300 truncate max-w-[180px]" title={match.text}>📄 {match.source} (Ch#{i + 1})</span>
                                      <span className={`font-mono font-bold ${isMatch ? 'text-orange-400' : 'text-slate-500'}`}>{match.score.toFixed(3)}</span>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-[10px] text-slate-500 italic p-1 bg-slate-900 rounded">No vectors retrieved above confidence threshold.</div>
                              )}
                            </div>
                          </div>

                          {/* Step 5: Policy Context */}
                          {activeCall.source && (
                            <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3.5 relative overflow-hidden">
                              <div className="absolute right-3 top-3 text-[9px] font-mono text-slate-600 font-bold uppercase flex items-center gap-0.5"><Clock className="w-3 h-3" /> Step 5: Context</div>
                              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2"><FileText className="w-3.5 h-3.5 text-purple-400" /> Grounded Policy Chunk</h4>
                              <div className="bg-slate-900 border border-slate-850 rounded-lg p-2 text-[10.5px] leading-relaxed text-slate-300 max-h-24 overflow-y-auto font-mono scrollbar-thin">
                                "{activeCall.context}"
                              </div>
                            </div>
                          )}

                          {/* Step 6: LLM */}
                          <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3.5 relative overflow-hidden">
                            <div className="absolute right-3 top-3 text-[9px] font-mono text-slate-600 font-bold uppercase flex items-center gap-0.5"><Clock className="w-3 h-3" /> Step 6: LLM</div>
                            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2"><Sparkles className="w-3.5 h-3.5 text-cyan-400" /> LLM Completion & Grounding</h4>
                            <div className="border border-slate-800/80 rounded-lg mb-2 overflow-hidden bg-slate-900/50">
                              <button type="button" onClick={() => setExpandedPrompt(!expandedPrompt)} className="w-full text-left px-2.5 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-slate-900 flex justify-between items-center transition-colors cursor-pointer">
                                <span className="flex items-center gap-1"><Code className="w-3.5 h-3.5" /> Prompt Template</span>
                                <span className="text-[9px] font-mono text-slate-500 uppercase">{expandedPrompt ? 'Close' : 'View'}</span>
                              </button>
                              {expandedPrompt && (
                                <div className="p-2 border-t border-slate-800 bg-slate-950 font-mono text-[9px] text-slate-400 max-h-36 overflow-y-auto leading-relaxed select-text scrollbar-thin">
                                  {trace?.llm?.system_prompt || "System prompts configured with Amazon policy context."}
                                </div>
                              )}
                            </div>
                            <div className="bg-slate-900 border border-slate-800/50 rounded-lg p-2.5 text-[10px] space-y-1.5 font-mono">
                              <div className="flex justify-between text-slate-500"><span>Model:</span><span className="text-slate-350 font-bold">{trace?.llm?.model || 'llama-3.1-8b-instant'}</span></div>
                              <div className="flex justify-between text-slate-500"><span>Tokens:</span><span className="text-slate-350 font-bold">P:{trace?.llm?.prompt_tokens || 190} C:{trace?.llm?.completion_tokens || 42} T:{trace?.llm?.total_tokens || 232}</span></div>
                              <div className="flex justify-between text-slate-500"><span>LLM Latency:</span><span className="text-slate-350 font-bold">{trace?.llm?.latency_ms || 180.0}ms</span></div>
                            </div>
                          </div>

                          {/* Step 7: Tool Calling */}
                          {trace?.tool && trace.tool.tool_used !== 'none' && (
                            <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3.5 relative overflow-hidden">
                              <div className="absolute right-3 top-3 text-[9px] font-mono text-slate-600 font-bold uppercase flex items-center gap-0.5"><Clock className="w-3 h-3" /> Step 7: Tool</div>
                              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2"><Wrench className="w-3.5 h-3.5 text-orange-400 animate-pulse" /> Autonomous Tool Execution</h4>
                              <div className="border border-slate-800/80 rounded-lg overflow-hidden bg-slate-900/50">
                                <button type="button" onClick={() => setExpandedTool(!expandedTool)} className="w-full text-left px-2.5 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-slate-900 flex justify-between items-center transition-colors cursor-pointer">
                                  <span className="font-mono text-cyan-400">{trace.tool.tool_used}()</span>
                                  <span className="text-[9px] font-mono text-slate-500 uppercase">{expandedTool ? 'Collapse' : 'Inspect'}</span>
                                </button>
                                {expandedTool && (
                                  <div className="p-2 border-t border-slate-800 bg-slate-950 font-mono text-[9px] space-y-2 select-text scrollbar-thin max-h-48 overflow-y-auto">
                                    <div><span className="text-slate-500 font-bold">// Inputs</span><pre className="text-slate-300">{JSON.stringify(trace.tool.inputs, null, 2)}</pre></div>
                                    <div><span className="text-slate-500 font-bold">// Outputs</span><pre className="text-emerald-400">{JSON.stringify(trace.tool.outputs, null, 2)}</pre></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Step 8: TTS */}
                          <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3.5 relative overflow-hidden">
                            <div className="absolute right-3 top-3 text-[9px] font-mono text-slate-600 font-bold uppercase flex items-center gap-0.5"><Clock className="w-3 h-3" /> Step 8: TTS</div>
                            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2.5"><Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Text-to-Speech Synthesis</h4>
                            <div className="bg-slate-900 border border-slate-800/50 rounded-lg p-3 flex flex-col items-center justify-center gap-2">
                              <div className="w-full h-10">
                                <AudioWaveform active={speaking} color="#10b981" barCount={18} className="w-full h-full" />
                              </div>
                              <div className="flex gap-4 text-[9px] text-slate-500 font-mono">
                                <span>Synthesizer Latency: <strong className="text-slate-400">{trace?.tts?.latency_ms || 100.0}ms</strong></span>
                                <span>Language: <strong className="text-purple-400">{language}</strong></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* ── TAB 2: LIVE ORDER TRACKING ────────────────────────────── */}
                  {activeTab === 'map' && (
                    <div className="space-y-4">
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex justify-between items-center shadow-sm">
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Tracking Amazon Order</p>
                          <p className="text-xs font-mono text-orange-400 font-bold">{trackerOrderId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Estimated ETA</p>
                          <p className="text-sm text-emerald-400 font-bold font-mono">{eta > 0 ? `${eta} Mins` : "Delivered ✓"}</p>
                        </div>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden h-72 p-1 shadow-inner">
                        <svg className="w-full h-full" viewBox="0 0 320 220">
                          <line x1="20" y1="180" x2="300" y2="180" stroke="#101b2d" strokeWidth="6" strokeLinecap="round" />
                          <line x1="20" y1="180" x2="300" y2="180" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                          <line x1="35" y1="165" x2="285" y2="55" stroke="#101b2d" strokeWidth="6" strokeLinecap="round" />
                          <line x1="35" y1="165" x2="285" y2="55" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                          <line x1="120" y1="20" x2="120" y2="200" stroke="#101b2d" strokeWidth="4" />
                          <line x1="120" y1="20" x2="120" y2="200" stroke="#1e293b" strokeWidth="1" />
                          <line x1="240" y1="40" x2="20" y2="200" stroke="#101b2d" strokeWidth="4" />
                          <path d="M 35 165 L 95 125 L 165 145 L 235 95 L 285 55" fill="none" stroke="#ff9900" strokeWidth="3.5" strokeLinecap="round" />
                          <path d="M 35 165 L 95 125 L 165 145 L 235 95 L 285 55" fill="none" stroke="#ff9900" strokeWidth="6" strokeLinecap="round" opacity="0.15" className="animate-pulse" />
                          {mapPathPoints.map((pt, i) => {
                            const isDestination = i === mapPathPoints.length - 1;
                            const isOrigin = i === 0;
                            return (
                              <g key={i}>
                                <circle cx={pt.x} cy={pt.y} r={isDestination ? "7" : "5"} fill={isDestination ? "#10b981" : isOrigin ? "#ff9900" : "#1e293b"} stroke="#020617" strokeWidth="1.5" />
                                {isDestination && <circle cx={pt.x} cy={pt.y} r="14" fill="rgba(16, 185, 129, 0.2)" className="animate-ping" />}
                              </g>
                            );
                          })}
                          {trackingActive && (
                            <g>
                              <circle cx={markerCoords.x} cy={markerCoords.y} r="13" fill="rgba(249, 115, 22, 0.25)" className="animate-ping" />
                              <circle cx={markerCoords.x} cy={markerCoords.y} r="7.5" fill="#020617" stroke="#ff9900" strokeWidth="2.5" />
                              <path d="M -3 -3 L 4 0 L -3 3 Z" fill="#ff9900" transform={`translate(${markerCoords.x}, ${markerCoords.y})`} />
                            </g>
                          )}
                        </svg>
                        <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-800 rounded px-2.5 py-1 text-[9px] font-mono text-slate-400">
                          📍 <strong className="text-orange-400">
                            {trackingStep < 25 ? "Departing Hub" : trackingStep < 75 ? "In Transit (ORR)" : trackingStep < 98 ? "Approaching Indiranagar" : "Arrived & Delivered"}
                          </strong>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Delivery Timeline</div>
                        <div className="grid grid-cols-1 gap-2">
                          {mapPathPoints.map((pt, i) => {
                            const stepLimit = i * 25;
                            const isPassed = trackingStep >= stepLimit || deliveryState === "Delivered";
                            const isActive = trackingStep >= stepLimit - 25 && trackingStep < stepLimit && deliveryState !== "Delivered";
                            return (
                              <div key={i} className={`p-2.5 border rounded-xl flex items-center justify-between transition-colors duration-300 ${isPassed ? 'bg-slate-950/40 border-emerald-500/20' : isActive ? 'bg-slate-900 border-orange-500/30 animate-pulse' : 'bg-slate-950/20 border-slate-800 text-slate-500'}`}>
                                <div className="flex items-center gap-2">
                                  {isPassed ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : isActive ? <Navigation className="w-4 h-4 text-orange-400 shrink-0 animate-bounce" /> : <MapPin className="w-4 h-4 text-slate-700 shrink-0" />}
                                  <div>
                                    <p className={`text-xs font-bold ${isPassed ? 'text-slate-200' : isActive ? 'text-orange-400' : 'text-slate-500'}`}>{pt.name}</p>
                                    <p className="text-[9px] text-slate-500 mt-0.5">{pt.desc}</p>
                                  </div>
                                </div>
                                {isActive && <span className="text-[9px] font-bold text-orange-400 font-mono tracking-wider animate-pulse">ACTIVE</span>}
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
