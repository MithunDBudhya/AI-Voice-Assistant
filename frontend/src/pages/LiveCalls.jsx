import React, { useState, useEffect } from 'react';
import { getCalls } from '../api/client';
import { demoCalls } from '../data/demoData';
import { PhoneCall, AlertCircle, Database, CheckCircle2 } from 'lucide-react';

const LiveCalls = () => {
  const [calls, setCalls] = useState(demoCalls);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const data = await getCalls();
        if (data && data.length > 0) {
          setCalls(data);
        }
      } catch (e) {
        console.log("Using demo calls data");
      }
    };
    fetchCalls();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Live Call Logs</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time transcripts and agent actions</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {calls.map((call, i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4 border-b border-slate-800/50 pb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mr-3">
                  <PhoneCall className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-200">{call.caller_phone}</h3>
                  <p className="text-xs text-slate-500">{new Date(call.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-xs font-mono">
                  {call.intent}
                </span>
                {call.escalated ? (
                  <span className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-xs flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" /> Escalated
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Resolved
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-1">Customer said:</p>
                <p className="text-slate-200 font-medium">"{call.message}"</p>
              </div>
              
              <div className="flex items-center text-sm text-slate-400 px-2 space-x-4">
                <span className="flex items-center">
                  <Database className="w-4 h-4 mr-1 text-cyan-400" /> Tool: {call.tool_used}
                </span>
                {call.source && (
                  <span className="flex items-center">
                    Source: {call.source}
                  </span>
                )}
              </div>

              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-4">
                <p className="text-sm text-indigo-400/70 mb-1">Agent responded:</p>
                <p className="text-indigo-100">{call.answer}</p>
              </div>
            </div>
          </div>
        ))}
        {calls.length === 0 && (
          <div className="text-center text-slate-500 py-12">No calls logged yet.</div>
        )}
      </div>
    </div>
  );
};

export default LiveCalls;
