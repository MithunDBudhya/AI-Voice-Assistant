import React, { useState, useEffect } from 'react';
import { getTickets } from '../api/client';
import { demoTickets } from '../data/demoData';
import { Ticket, AlertTriangle, Clock } from 'lucide-react';

const Tickets = () => {
  const [tickets, setTickets] = useState(demoTickets);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await getTickets();
        if (data && data.length > 0) {
          setTickets(data);
        }
      } catch (e) {
        console.log("Using demo tickets data");
      }
    };
    fetchTickets();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Escalation Tickets</h1>
        <p className="text-slate-400 text-sm mt-1">High-priority issues requiring human intervention</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {tickets.map((ticket, i) => (
          <div key={i} className="bg-slate-900/50 border border-rose-500/20 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <Ticket className="w-5 h-5 text-rose-400 mr-2" />
                <span className="font-mono text-sm text-slate-300">{ticket.ticket_id}</span>
              </div>
              <span className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-xs font-medium uppercase tracking-wider">
                {ticket.priority}
              </span>
            </div>
            
            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-1">Customer Phone</p>
              <p className="text-sm font-medium text-slate-200">{ticket.caller_phone}</p>
            </div>

            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-1">Reason</p>
              <p className="text-sm text-slate-300">{ticket.reason}</p>
            </div>

            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 mb-4">
              <p className="text-xs text-slate-500 mb-1">Transcript Snippet</p>
              <p className="text-sm text-slate-400 italic">"{ticket.transcript}"</p>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500">
              <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(ticket.timestamp).toLocaleString()}</span>
              <span className="text-indigo-400">{ticket.status}</span>
            </div>
          </div>
        ))}
        {tickets.length === 0 && (
          <div className="col-span-full text-center text-slate-500 py-12">No open tickets.</div>
        )}
      </div>
    </div>
  );
};

export default Tickets;
