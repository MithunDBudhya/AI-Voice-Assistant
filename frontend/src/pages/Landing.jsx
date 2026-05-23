import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Zap, Shield, Sparkles, ChevronRight, Activity, GitMerge } from 'lucide-react';
import { motion } from 'framer-motion';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-950 text-slate-50 flex flex-col relative">
      {/* Background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <Bot className="w-8 h-8 text-orange-400" />
          <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
            SupportGenie <span className="text-xs uppercase px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">Amazon IN Edition</span>
          </span>
        </div>
        <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
        </div>
        <button 
          onClick={() => navigate('/simulator')}
          className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-medium transition-all shadow-lg border border-slate-700"
        >
          Try Demo
        </button>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center max-w-5xl mx-auto mt-12 mb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm font-medium mb-8"
        >
          <Sparkles className="w-4 h-4" />
          <span>Next-Gen Amazon India Voice AI Assistant</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6"
        >
          A production-ready <br className="hidden md:block"/>
          <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
            Amazon India Customer Voice Support
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed"
        >
          Empowering Amazon India customer support operations with conversational voice AI, instant 17-digit order lookups, dynamic RAG policy matching, and automated callback scheduling.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6"
        >
          <button 
            onClick={() => navigate('/dashboard')}
            className="group flex items-center px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-full font-semibold text-lg transition-all shadow-[0_0_40px_rgba(249,115,22,0.3)] hover:shadow-[0_0_60px_rgba(249,115,22,0.5)]"
          >
            Launch Command Center
            <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => navigate('/simulator')}
            className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-full font-semibold text-lg transition-all border border-slate-700 hover:border-slate-600"
          >
            Test Call Simulator
          </button>
        </motion.div>

        {/* Feature grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left"
        >
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Intent & Action</h3>
            <p className="text-slate-400">Detects customer intent dynamically and triggers backend tools (check orders, book callbacks).</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
              <GitMerge className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">ChromaDB RAG</h3>
            <p className="text-slate-400">Understands your business policies by searching embedded company documents in real-time.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-rose-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Human Escalation</h3>
            <p className="text-slate-400">Detects frustration and seamlessly escalates to human agents while creating a priority ticket.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Landing;
