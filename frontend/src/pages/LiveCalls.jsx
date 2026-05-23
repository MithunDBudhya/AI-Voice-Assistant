import React, { useState, useEffect } from 'react';
import { getCalls } from '../api/client';
import { demoCalls } from '../data/demoData';
import { PhoneCall, AlertCircle, Database, CheckCircle2, RotateCw, Filter, ShieldAlert, Zap, Clock } from 'lucide-react';

const LiveCalls = () => {
  const [calls, setCalls] = useState(demoCalls);
  const [isLive, setIsLive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [intentFilter, setIntentFilter] = useState('ALL');
  const [sentimentFilter, setSentimentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchCalls = async (silent = false, isMounted = { current: true }) => {
    if (!silent) setRefreshing(true);
    try {
      const data = await getCalls();
      if (!isMounted.current) return;
      if (data && data.length > 0) {
        setCalls(data);
        setIsLive(true);
      } else {
        setIsLive(true);
      }
    } catch (e) {
      console.warn('[SupportGenie] Using fallback demo calls:', e.message);
      if (isMounted.current) {
        setIsLive(false);
      }
    } finally {
      if (isMounted.current) {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    const isMounted = { current: true };
    fetchCalls(false, isMounted);
    const interval = setInterval(() => {
      fetchCalls(true, isMounted);
    }, 5000);
    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, []);

  // Filtering Logic
  const filteredCalls = calls.filter(call => {
    const matchIntent = intentFilter === 'ALL' || call.intent === intentFilter;
    const matchSentiment = sentimentFilter === 'ALL' || call.sentiment === sentimentFilter.toLowerCase();
    
    let matchStatus = true;
    if (statusFilter === 'ESCALATED') matchStatus = call.escalated === true;
    if (statusFilter === 'RESOLVED') matchStatus = call.escalated === false;

    return matchIntent && matchSentiment && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Live Call Logs</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time transcripts, sentiment scores, and autonomous tool routing</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-xs text-slate-400 font-medium">
              {isLive ? 'Live Call Stream' : 'Demo Offline Sandbox'}
            </span>
          </div>
          <button
            onClick={() => fetchCalls(false)}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-slate-50 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            disabled={refreshing}
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <Filter className="w-4 h-4 text-orange-400" />
          Filter Logs
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Intent Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-medium uppercase">Intent</label>
            <select
              value={intentFilter}
              onChange={(e) => setIntentFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500 transition-colors"
            >
              <option value="ALL">All Intents</option>
              <option value="ORDER_STATUS">Order Status</option>
              <option value="FAQ_POLICY">Policy FAQ</option>
              <option value="COMPLAINT_REGISTRATION">Complaint Registration</option>
              <option value="BOOK_CALLBACK">Book Callback</option>
              <option value="HUMAN_ESCALATION">Human Escalation</option>
              <option value="GENERAL">General</option>
            </select>
          </div>

          {/* Sentiment Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-medium uppercase">Sentiment</label>
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500 transition-colors"
            >
              <option value="ALL">All Sentiments</option>
              <option value="POSITIVE">Positive</option>
              <option value="NEUTRAL">Neutral</option>
              <option value="FRUSTRATED">Frustrated</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-medium uppercase">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500 transition-colors"
            >
              <option value="ALL">All Statuses</option>
              <option value="RESOLVED">Resolved Only</option>
              <option value="ESCALATED">Escalated Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Call logs stream */}
      <div className="grid grid-cols-1 gap-6">
        {filteredCalls.map((call, i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
            {/* Soft decorative glow if frustrated or positive */}
            {call.sentiment === 'frustrated' && (
              <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
            )}
            {call.sentiment === 'positive' && (
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 border-b border-slate-800/50 pb-4">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${call.sentiment === 'frustrated' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-orange-400'}`}>
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-200">{call.caller_phone}</h3>
                  <p className="text-xs text-slate-500">{new Date(call.timestamp).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-1 bg-orange-500/10 text-orange-450 border border-orange-500/20 rounded text-xs font-semibold">
                  {call.intent}
                </span>
                
                {/* Sentiment Badge with optional score */}
                <span className={`px-2 py-1 rounded text-xs border flex items-center gap-1 ${
                  call.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                  call.sentiment === 'frustrated' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                  'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}>
                  {call.sentiment}
                  {call.sentiment_score !== undefined && (
                    <span className="opacity-70 font-mono text-[10px]">
                      ({typeof call.sentiment_score === 'number' ? call.sentiment_score.toFixed(1) : call.sentiment_score})
                    </span>
                  )}
                </span>

                {call.escalated ? (
                  <span className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-xs flex items-center font-medium">
                    <AlertCircle className="w-3 h-3 mr-1 animate-pulse" /> Escalated
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs flex items-center font-medium">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Resolved
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Customer Input Transcript</p>
                <p className="text-slate-200 font-medium">"{call.message}"</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400 px-1.5">
                <span className="flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-cyan-400" /> 
                  <strong className="text-slate-300">Tool:</strong> {call.tool_used || 'none'}
                </span>
                
                {call.source && (
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-orange-400" />
                    <strong className="text-slate-300">RAG Context:</strong> {call.source}
                  </span>
                )}

                {call.response_time_ms !== undefined && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <strong className="text-slate-300">Latency:</strong> {call.response_time_ms}ms
                  </span>
                )}
              </div>

              <div className="bg-orange-500/5 border border-orange-500/10 rounded-lg p-4">
                <p className="text-[10px] text-orange-400/80 font-semibold uppercase mb-1">AI Voice Response</p>
                <p className="text-amber-100 leading-relaxed">{call.answer}</p>
              </div>
            </div>
          </div>
        ))}
        
        {filteredCalls.length === 0 && (
          <div className="text-center text-slate-500 py-16 bg-slate-900/10 border border-dashed border-slate-800 rounded-2xl">
            No call logs match the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveCalls;
