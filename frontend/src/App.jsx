import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CallSimulator from './pages/CallSimulator';
import LiveCalls from './pages/LiveCalls';
import KnowledgeBase from './pages/KnowledgeBase';
import Tickets from './pages/Tickets';
import Callbacks from './pages/Callbacks';
import Analytics from './pages/Analytics';

function App() {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="*" element={
          <>
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Topbar />
              <main className="flex-1 overflow-y-auto p-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-950/10 to-slate-950/50 pointer-events-none" />
                <div className="relative z-10 h-full">
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/simulator" element={<CallSimulator />} />
                    <Route path="/calls" element={<LiveCalls />} />
                    <Route path="/knowledge" element={<KnowledgeBase />} />
                    <Route path="/tickets" element={<Tickets />} />
                    <Route path="/callbacks" element={<Callbacks />} />
                    <Route path="/analytics" element={<Analytics />} />
                  </Routes>
                </div>
              </main>
            </div>
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;
