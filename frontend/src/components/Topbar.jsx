import React from 'react';
import { Bell, Search, UserCircle, SignalHigh } from 'lucide-react';

const Topbar = () => {
  const isBackendConnected = import.meta.env.VITE_API_BASE_URL ? true : false;

  return (
    <div className="h-16 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-6 z-20 shadow-sm">
      <div className="flex items-center text-sm font-medium text-slate-400">
        <div className="relative mr-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search tickets, calls..." 
            className="pl-10 pr-4 py-2 bg-slate-950/50 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm w-64"
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {isBackendConnected ? (
          <div className="flex items-center px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium tracking-wide">
            <SignalHigh className="w-3 h-3 mr-2 animate-pulse" /> Live Mode
          </div>
        ) : (
          <div className="flex items-center px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-medium tracking-wide">
            Demo Mode
          </div>
        )}
        <button className="text-slate-400 hover:text-slate-200 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-indigo-500 rounded-full"></span>
        </button>
        <div className="w-px h-6 bg-slate-800 mx-2"></div>
        <button className="flex items-center text-slate-300 hover:text-white transition-colors">
          <UserCircle className="w-7 h-7 text-slate-400 mr-2" />
          <span className="text-sm font-medium">Agent 01</span>
        </button>
      </div>
    </div>
  );
};

export default Topbar;
