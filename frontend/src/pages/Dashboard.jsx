import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getDashboardSummary, getCalls } from '../api/client';
import { demoSummary, demoCalls } from '../data/demoData';
import { PhoneCall, CheckCircle2, AlertTriangle, Clock, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group"
  >
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${color}`} />
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <span className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
        <ArrowUpRight className="w-3 h-3 mr-1" /> 12%
      </span>
    </div>
    <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
    <p className="text-3xl font-bold mt-1 text-slate-50">{value}</p>
  </motion.div>
);

const Dashboard = () => {
  const [summary, setSummary] = useState(demoSummary);
  const [calls, setCalls] = useState(demoCalls);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await getDashboardSummary();
        const callData = await getCalls();
        if (data && callData.length > 0) {
            setSummary(data);
            setCalls(callData.slice(0, 5));
        }
      } catch (e) {
        console.log("Using demo data");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const chartData = [
    { name: 'Mon', calls: 40, resolved: 32 },
    { name: 'Tue', calls: 30, resolved: 25 },
    { name: 'Wed', calls: 45, resolved: 38 },
    { name: 'Thu', calls: 50, resolved: 45 },
    { name: 'Fri', calls: 35, resolved: 30 },
    { name: 'Sat', calls: 20, resolved: 18 },
    { name: 'Sun', calls: 25, resolved: 22 },
  ];

  const intentData = [
    { name: 'Order Status', value: 45 },
    { name: 'Policy FAQ', value: 30 },
    { name: 'Callback', value: 15 },
    { name: 'Escalation', value: 10 },
  ];

  if (loading) return <div className="flex items-center justify-center h-full text-slate-400">Loading Dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Dashboard Overview</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time metrics from your AI agents</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Calls" value={summary.total_calls} icon={PhoneCall} color="bg-indigo-500" delay={0.1} />
        <StatCard title="Resolved Issues" value={summary.resolved_calls} icon={CheckCircle2} color="bg-emerald-500" delay={0.2} />
        <StatCard title="Escalations" value={summary.escalated_calls} icon={AlertTriangle} color="bg-rose-500" delay={0.3} />
        <StatCard title="Avg Response" value={summary.average_response_time} icon={Clock} color="bg-cyan-500" delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold mb-6">Call Volume & Resolution</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="calls" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCalls)" />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold mb-6">Intent Distribution</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={intentData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 overflow-hidden"
      >
        <h3 className="text-lg font-semibold mb-4">Recent Call Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 bg-slate-950/50 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-medium rounded-tl-lg">Caller</th>
                <th className="px-4 py-3 font-medium">Intent</th>
                <th className="px-4 py-3 font-medium">Sentiment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium rounded-tr-lg">Time</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-300">{call.caller_phone}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-md text-xs border border-indigo-500/20">
                      {call.intent}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-md text-xs border ${
                      call.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      call.sentiment === 'frustrated' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {call.sentiment}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {call.escalated ? (
                      <span className="flex items-center text-rose-400"><AlertTriangle className="w-3 h-3 mr-1"/> Escalated</span>
                    ) : (
                      <span className="flex items-center text-emerald-400"><CheckCircle2 className="w-3 h-3 mr-1"/> Resolved</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
