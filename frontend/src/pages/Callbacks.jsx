import React, { useState, useEffect } from 'react';
import { getCallbacks } from '../api/client';
import { demoCallbacks } from '../data/demoData';
import { CalendarClock, Phone } from 'lucide-react';

const Callbacks = () => {
  const [callbacks, setCallbacks] = useState(demoCallbacks);

  useEffect(() => {
    const fetchCallbacks = async () => {
      try {
        const data = await getCallbacks();
        if (data && data.length > 0) {
          setCallbacks(data);
        }
      } catch (e) {
        console.log("Using demo callbacks data");
      }
    };
    fetchCallbacks();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Scheduled Callbacks</h1>
        <p className="text-slate-400 text-sm mt-1">Customers waiting for agent follow-up</p>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-400 bg-slate-950/50 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 font-medium">Callback ID</th>
              <th className="px-6 py-4 font-medium">Customer Phone</th>
              <th className="px-6 py-4 font-medium">Preferred Time</th>
              <th className="px-6 py-4 font-medium">Reason</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Requested At</th>
            </tr>
          </thead>
          <tbody>
            {callbacks.map((cb, i) => (
              <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 font-mono text-slate-400">{cb.callback_id}</td>
                <td className="px-6 py-4 font-medium text-slate-200 flex items-center">
                  <Phone className="w-3 h-3 mr-2 text-indigo-400" /> {cb.caller_phone}
                </td>
                <td className="px-6 py-4 text-amber-400 font-medium flex items-center">
                  <CalendarClock className="w-4 h-4 mr-2" /> {cb.preferred_time}
                </td>
                <td className="px-6 py-4 text-slate-300">{cb.reason}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-xs">
                    {cb.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {new Date(cb.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
            {callbacks.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-slate-500 py-8">No callbacks scheduled.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Callbacks;
