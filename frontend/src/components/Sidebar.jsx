import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PhoneCall, Mic, BookOpen, Ticket, CalendarClock, BarChart3, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const links = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/simulator", icon: Mic, label: "Call Simulator" },
    { to: "/calls", icon: PhoneCall, label: "Live Calls" },
    { to: "/knowledge", icon: BookOpen, label: "Knowledge Base" },
    { to: "/tickets", icon: Ticket, label: "Tickets" },
    { to: "/callbacks", icon: CalendarClock, label: "Callbacks" },
    { to: "/analytics", icon: BarChart3, label: "Analytics" },
  ];

  return (
    <div className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 flex flex-col z-20 shadow-2xl">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Bot className="w-8 h-8 text-indigo-400 mr-3" />
        <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">SupportGenie</span>
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-indigo-500/20" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                <span className="font-medium">{link.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute left-0 w-1 h-8 bg-indigo-500 rounded-r-full" 
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
