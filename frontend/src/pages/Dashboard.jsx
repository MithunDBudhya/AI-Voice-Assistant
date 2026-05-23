import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getDashboardSummary, getCalls, getDeepAnalytics } from '../api/client';
import { demoSummary, demoCalls } from '../data/demoData';
import { PhoneCall, CheckCircle2, AlertTriangle, Clock, ArrowUpRight, RotateCw, Sparkles, Navigation, ShieldCheck, Activity, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const INTENT_COLORS = ['#ff9900', '#ffa726', '#ffb74d', '#ffcc80', '#ffe0b2'];

const defaultChartData = [
  { name: 'Mon', calls: 40, resolved: 32 },
  { name: 'Tue', calls: 30, resolved: 25 },
  { name: 'Wed', calls: 45, resolved: 38 },
  { name: 'Thu', calls: 50, resolved: 45 },
  { name: 'Fri', calls: 35, resolved: 30 },
  { name: 'Sat', calls: 20, resolved: 18 },
  { name: 'Sun', calls: 25, resolved: 22 },
];

const defaultIntentData = [
  { name: 'Order Status', value: 45 },
  { name: 'Policy FAQ', value: 30 },
  { name: 'Callback', value: 15 },
  { name: 'Escalation', value: 10 },
];

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group shadow-lg"
  >
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${color}`} />
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <span className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
        <ArrowUpRight className="w-3 h-3 mr-1" /> 100% Live
      </span>
    </div>
    <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
    <p className="text-3xl font-bold mt-1 text-slate-50">{value}</p>
  </motion.div>
);

const Dashboard = () => {
  const [summary, setSummary] = useState(demoSummary);
  const [calls, setCalls] = useState(demoCalls);
  const [chartData, setChartData] = useState(defaultChartData);
  const [intentData, setIntentData] = useState(defaultIntentData);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [telemetry, setTelemetry] = useState({ search_speed: '3.2ms', tokens: '1.2k' });

  // Live fleet movement simulation
  const [fleetCheckpoints, setFleetCheckpoints] = useState([
    { id: 'ATS-4038', rider: 'Vikram Singh', lat: 100, lon: 60, status: 'In Transit', progress: 35 },
    { id: 'ATS-1234', rider: 'Ramesh Gowda', lat: 160, lon: 130, status: 'Near Destination', progress: 85 },
    { id: 'ATS-3301', rider: 'Anil Kumar', lat: 210, lon: 90, status: 'Picked Up', progress: 12 }
  ]);

  const fetchDashboardData = async (silent = false, isMounted = { current: true }) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const summaryData = await getDashboardSummary();
      const callsData = await getCalls();
      const analyticsData = await getDeepAnalytics();

      if (!isMounted.current) return;

      if (summaryData && summaryData.total_calls >= 0) {
        setSummary(summaryData);
        setIsLive(true);
      }
      if (callsData && Array.isArray(callsData) && callsData.length > 0) {
        setCalls(callsData.slice(0, 5));
      }
      if (analyticsData) {
        if (analyticsData.daily_chart_data && Array.isArray(analyticsData.daily_chart_data) && analyticsData.daily_chart_data.length > 0) {
          setChartData(analyticsData.daily_chart_data);
        }
        if (analyticsData.intent_data && Array.isArray(analyticsData.intent_data) && analyticsData.intent_data.length > 0) {
          setIntentData(analyticsData.intent_data);
        }
        setTelemetry({
          search_speed: `${analyticsData.avg_vector_search_time_ms || 3.2}ms`,
          tokens: analyticsData.total_tokens_processed > 1000 
            ? `${(analyticsData.total_tokens_processed / 1000).toFixed(1)}k` 
            : `${analyticsData.total_tokens_processed || 1250}`
        });
      }
    } catch (e) {
      console.warn('[SupportGenie] Using fallback dashboard data:', e.message);
      if (isMounted.current) {
        setIsLive(false);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    const isMounted = { current: true };
    fetchDashboardData(false, isMounted);

    const interval = setInterval(() => {
      fetchDashboardData(true, isMounted);
    }, 5000);

    // Fleet coordinate movement simulator loop
    const fleetInterval = setInterval(() => {
      if (!isMounted.current) return;
      setFleetCheckpoints(prev => prev.map(rider => {
        let nextProg = rider.progress + Math.floor(Math.random() * 4) + 1;
        if (nextProg > 100) nextProg = 0;
        
        let newStatus = 'Picked Up';
        if (nextProg > 25 && nextProg <= 75) newStatus = 'In Transit';
        else if (nextProg > 75 && nextProg < 98) newStatus = 'Near Destination';
        else if (nextProg >= 98) newStatus = 'Delivered';

        return {
          ...rider,
          progress: nextProg,
          status: newStatus
        };
      }));
    }, 3000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
      clearInterval(fleetInterval);
    };
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-slate-400">Loading Dashboard...</div>;

  return (
    <div className="space-y-6 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Amazon Support Operations</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time metrics from your Amazon India Customer Support AI agents</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-xs text-slate-400 font-medium">
              {isLive ? 'Live System Feed' : 'Demo Offline Sandbox'}
            </span>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-slate-50 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            disabled={refreshing}
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard title="Total Calls" value={summary.total_calls} icon={PhoneCall} color="bg-orange-500" delay={0.1} />
        <StatCard title="Resolved Issues" value={summary.resolved_calls} icon={CheckCircle2} color="bg-emerald-500" delay={0.15} />
        <StatCard title="Escalations" value={summary.escalated_calls} icon={AlertTriangle} color="bg-rose-500" delay={0.2} />
        <StatCard title="Avg Response" value={summary.average_response_time} icon={Clock} color="bg-amber-500" delay={0.25} />
        <StatCard title="V-DB Search Speed" value={telemetry.search_speed} icon={Activity} color="bg-cyan-500" delay={0.3} />
        <StatCard title="Tokens Volume" value={telemetry.tokens} icon={Zap} color="bg-orange-500" delay={0.35} />
      </div>

      {/* Real-time Order Fleet Tracking Map Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Visual Fleet tracking route map */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-xl"
        >
          <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="w-4.5 h-4.5 text-orange-400 animate-pulse" />
              ATS Delivery Fleet Monitor (Bangalore Hub)
            </h3>
            <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded font-bold uppercase">
              3 ACTIVE COURIERS
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            
            {/* SVG Fleet Route Graph */}
            <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl relative overflow-hidden h-64 p-1 shadow-inner">
              <svg className="w-full h-full" viewBox="0 0 300 240">
                {/* Route lines */}
                <path d="M 40 40 L 140 100 L 260 140" fill="none" stroke="#1e293b" strokeWidth="4" />
                <path d="M 40 40 L 140 100 L 260 140" fill="none" stroke="rgba(249, 115, 22, 0.15)" strokeWidth="6" strokeDasharray="5" />
                <path d="M 120 200 L 140 100 L 220 50" fill="none" stroke="#1e293b" strokeWidth="3" />
                
                {/* Map Center Hub Node */}
                <circle cx="140" cy="100" r="10" fill="#020617" stroke="#ff9900" strokeWidth="2.5" />
                <text x="140" y="103" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#ff9900">Hub</text>

                {/* Draw couriers along simulated path */}
                {fleetCheckpoints.map((rider, i) => {
                  let cx = 140;
                  let cy = 100;
                  // Interpolate coordinate positions based on progress
                  if (i === 0) {
                    cx = 40 + (140 - 40) * (rider.progress / 100);
                    cy = 40 + (100 - 40) * (rider.progress / 100);
                  } else if (i === 1) {
                    cx = 140 + (260 - 140) * (rider.progress / 100);
                    cy = 100 + (140 - 100) * (rider.progress / 100);
                  } else {
                    cx = 120 + (140 - 120) * (rider.progress / 100);
                    cy = 200 + (100 - 200) * (rider.progress / 100);
                  }
                  
                  return (
                    <g key={rider.id}>
                      {/* Courier marker glow */}
                      <circle cx={cx} cy={cy} r="12" fill="rgba(249, 115, 22, 0.15)" className="animate-ping" />
                      <circle cx={cx} cy={cy} r="6" fill="#020617" stroke="#f97316" strokeWidth="2" />
                      
                      {/* ID tag above rider */}
                      <g transform={`translate(${cx - 15}, ${cy - 12})`}>
                        <rect width="30" height="9" rx="2" fill="#020617" stroke="#f97316" strokeWidth="0.5" />
                        <text x="15" y="7" textAnchor="middle" fontSize="6" fill="#f97316" fontWeight="bold">{rider.id}</text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Fleet Status List */}
            <div className="w-full md:w-56 space-y-3.5 pr-1">
              {fleetCheckpoints.map((rider) => (
                <div key={rider.id} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex flex-col gap-1.5 shadow-sm">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-orange-400 font-bold">{rider.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      rider.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      rider.status === 'Near Destination' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {rider.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>Driver: {rider.rider}</span>
                    <span>{rider.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full ${rider.status === 'Delivered' ? 'bg-emerald-500' : 'bg-orange-500'}`}
                      style={{ width: `${rider.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </motion.div>

        {/* Intent Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl"
        >
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-6">Intent Distribution</h3>
          <div className="h-72 w-full">
            {intentData && intentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={intentData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: '#1e293b/30'}} contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px', color: '#f8fafc' }} />
                  <Bar dataKey="value" fill="#ff9900" radius={[0, 4, 4, 0]} barSize={16}>
                    {intentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={INTENT_COLORS[index % INTENT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">No intent data available.</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Call Volume and resolutions Area Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl"
        >
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-6">Call Volume & Resolution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff9900" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ff9900" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px', color: '#f8fafc' }} />
                <Area type="monotone" dataKey="calls" stroke="#ff9900" strokeWidth={2} fillOpacity={1} fill="url(#colorCalls)" />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 overflow-hidden shadow-xl"
      >
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">Recent Call Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left font-sans">
            <thead className="text-xs text-slate-400 bg-slate-950/60 border-b border-slate-800">
              <tr>
                <th className="px-5 py-4 font-semibold uppercase tracking-wider rounded-tl-lg">Caller</th>
                <th className="px-5 py-4 font-semibold uppercase tracking-wider">Intent</th>
                <th className="px-5 py-4 font-semibold uppercase tracking-wider">Sentiment</th>
                <th className="px-5 py-4 font-semibold uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 font-semibold uppercase tracking-wider rounded-tr-lg">Time</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                  <td className="px-5 py-3 font-semibold text-slate-350">{call.caller_phone}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded-md text-[11px] border border-orange-500/20 font-bold uppercase tracking-wider">
                      {call.intent}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] border font-bold uppercase tracking-wider ${
                      call.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      call.sentiment === 'frustrated' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse' : 
                      'bg-slate-800 text-slate-400 border-slate-700/50'
                    }`}>
                      {call.sentiment}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {call.escalated ? (
                      <span className="flex items-center text-rose-400 font-bold text-xs"><AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-500 animate-pulse"/> ESCALATED</span>
                    ) : (
                      <span className="flex items-center text-emerald-400 font-bold text-xs"><ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500"/> RESOLVED</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">
                    {new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
