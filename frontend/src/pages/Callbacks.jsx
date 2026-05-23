import React, { useState, useEffect } from 'react';
import { getCallbacks, updateCallbackStatus } from '../api/client';
import { demoCallbacks } from '../data/demoData';
import { CalendarClock, Phone, RotateCw, Filter, CheckCircle2, AlertCircle, Clock, UserCheck } from 'lucide-react';

const Callbacks = () => {
  const [callbacks, setCallbacks] = useState(demoCallbacks);
  const [isLive, setIsLive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchCallbacks = async (silent = false, isMounted = { current: true }) => {
    if (!silent) setRefreshing(true);
    try {
      const data = await getCallbacks();
      if (!isMounted.current) return;
      if (data && data.length > 0) {
        setCallbacks(data);
        setIsLive(true);
      } else {
        setIsLive(true);
      }
    } catch (e) {
      console.warn('[SupportGenie] Using fallback demo callbacks:', e.message);
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
    fetchCallbacks(false, isMounted);
    const interval = setInterval(() => {
      fetchCallbacks(true, isMounted);
    }, 5000);
    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, []);

  const handleCompleteCallback = async (callbackId) => {
    try {
      await updateCallbackStatus(callbackId, 'Completed');
      fetchCallbacks(true);
    } catch (e) {
      console.error('[SupportGenie] Failed to update callback status:', e);
      // Fallback state update for demo sandbox
      setCallbacks(prev => prev.map(cb => {
        if (cb.callback_id === callbackId) {
          return {
            ...cb,
            status: 'Completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        return cb;
      }));
    }
  };

  const filteredCallbacks = callbacks.filter(cb => {
    if (statusFilter === 'ALL') return true;
    return cb.status.toUpperCase() === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Scheduled Callbacks</h1>
          <p className="text-slate-400 text-sm mt-1">Customers waiting for manager phone follow-ups, booked autonomously by the AI voice agent</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-xs text-slate-400 font-medium">
              {isLive ? 'Live Database feed' : 'Demo Offline Sandbox'}
            </span>
          </div>
          <button
            onClick={() => fetchCallbacks(false)}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-slate-50 transition-colors flex items-center gap-1.5 text-xs"
            disabled={refreshing}
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <Filter className="w-4 h-4 text-amber-400" />
          Filter Callbacks
        </div>
        
        <div className="flex gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-medium uppercase">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500 transition-colors"
            >
              <option value="ALL">All Callbacks</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* List / Table of callbacks */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 bg-slate-950/60 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Callback ID</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Customer Phone</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Preferred Time Slot</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Requested Reason</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Requested At</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right rounded-tr-2xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredCallbacks.map((cb, i) => {
                const isPending = cb.status.toLowerCase() === 'pending';
                return (
                  <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400 font-semibold">{cb.callback_id}</td>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-slate-800 text-slate-400">
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        {cb.caller_phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      <div className="flex items-center gap-1.5 text-amber-400 bg-amber-400/5 px-2.5 py-1 border border-amber-400/10 rounded-lg text-xs w-max">
                        <CalendarClock className="w-3.5 h-3.5" />
                        {cb.preferred_time}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 max-w-xs truncate">{cb.reason}</td>
                    <td className="px-6 py-4">
                      {isPending ? (
                        <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-xs font-semibold flex items-center gap-1 w-max">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-semibold flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3" />
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(cb.timestamp).toLocaleString()}
                      {cb.completed_at && (
                        <div className="text-[10px] text-emerald-500 mt-1 flex items-center gap-0.5">
                          <UserCheck className="w-3 h-3" /> Completed at: {new Date(cb.completed_at).toLocaleTimeString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isPending ? (
                        <button
                          onClick={() => handleCompleteCallback(cb.callback_id)}
                          className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-slate-50 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ml-auto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Complete Call
                        </button>
                      ) : (
                        <span className="text-slate-500 text-xs font-medium italic">Done</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredCallbacks.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-slate-500 py-16 bg-slate-900/5">
                    No scheduled callbacks match the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Callbacks;
