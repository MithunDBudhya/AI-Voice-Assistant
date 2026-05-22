import React, { useState } from 'react';
import { ragQuery, ragIngest } from '../api/client';
import { BookOpen, Database, RefreshCw, Search } from 'lucide-react';

const KnowledgeBase = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestStatus, setIngestStatus] = useState('');

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const res = await ragQuery(query);
      setResult(res);
    } catch (err) {
      setResult({ answer_context: "Demo mode: Backend is not reachable. (Policy: refunds usually 3-5 days)", source: "fallback.txt", confidence: 0.0 });
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async () => {
    setIngestLoading(true);
    setIngestStatus('Ingesting documents into ChromaDB...');
    try {
      await ragIngest();
      setIngestStatus('Success: Knowledge base updated.');
    } catch (err) {
      setIngestStatus('Error: Could not reach backend.');
    } finally {
      setIngestLoading(false);
    }
  };

  const docs = ['refund_policy.txt', 'delivery_policy.txt', 'warranty_policy.txt', 'faq.txt'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Knowledge Base</h1>
          <p className="text-slate-400 text-sm mt-1">Manage documents used by the AI for policy answers</p>
        </div>
        <button 
          onClick={handleIngest}
          disabled={ingestLoading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${ingestLoading ? 'animate-spin' : ''}`} />
          {ingestLoading ? 'Syncing...' : 'Sync Documents'}
        </button>
      </div>

      {ingestStatus && (
        <div className={`p-4 rounded-lg text-sm border ${ingestStatus.includes('Error') ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
          {ingestStatus}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Database className="w-4 h-4 mr-2 text-indigo-400" /> Indexed Documents
          </h3>
          <ul className="space-y-2">
            {docs.map((doc, i) => (
              <li key={i} className="flex items-center text-sm text-slate-300 p-2 bg-slate-800/50 rounded-lg">
                <BookOpen className="w-4 h-4 mr-3 text-slate-500" />
                {doc}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Search className="w-4 h-4 mr-2 text-cyan-400" /> Test RAG Query
          </h3>
          <form onSubmit={handleQuery} className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. What is the refund policy?"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
            <button 
              type="submit"
              disabled={loading || !query}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {result && (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-5">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                  Source: {result.source}
                </span>
                <span className="text-xs text-slate-500">Confidence: {(result.confidence * 100).toFixed(1)}%</span>
              </div>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                {result.answer_context}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
