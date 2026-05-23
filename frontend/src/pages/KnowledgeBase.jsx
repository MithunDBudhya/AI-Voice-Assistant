import React, { useState, useEffect } from 'react';
import { ragQuery, ragIngest, getDocuments } from '../api/client';
import { BookOpen, Database, RefreshCw, Search, FileText, CheckCircle2, ChevronRight } from 'lucide-react';

const fallbackDocs = ['refund_policy.txt', 'delivery_policy.txt', 'warranty_policy.txt', 'faq.txt', 'complaint_policy.txt', 'payment_policy.txt'];

const KnowledgeBase = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestStatus, setIngestStatus] = useState('');
  const [documents, setDocuments] = useState(fallbackDocs);
  const [isLive, setIsLive] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res = await getDocuments();
      const docsList = res.documents || res;
      if (docsList && Array.isArray(docsList) && docsList.length > 0) {
        const filenames = docsList.map(doc => typeof doc === 'object' ? doc.filename : doc);
        setDocuments(filenames);
        setIsLive(true);
      } else {
        setIsLive(true);
      }
    } catch (err) {
      console.warn('[SupportGenie] Using fallback static document index:', err.message);
      setDocuments(fallbackDocs);
      setIsLive(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const res = await ragQuery(query);
      setResult(res);
    } catch (err) {
      setResult({
        answer_context: "Offline Demo Mode: ChromaDB is not connected. Under standard refund policy guidelines, processed refunds are disbursed within 3 to 5 banking business days directly to the original payment instrument.",
        source: "refund_policy.txt (mock)",
        confidence: 0.85
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async () => {
    setIngestLoading(true);
    setIngestStatus('Processing and vectorizing documents into local ChromaDB storage...');
    try {
      await ragIngest();
      setIngestStatus('Knowledge base successfully synchronized and vectorized.');
      fetchDocuments();
    } catch (err) {
      setIngestStatus('Error: Failed to synchronize documents with vector database.');
    } finally {
      setIngestLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Knowledge Base</h1>
          <p className="text-slate-400 text-sm mt-1">Manage, sync, and query policy files used by the AI RAG retriever</p>
        </div>
        <button 
          onClick={handleIngest}
          disabled={ingestLoading}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-55 rounded-lg flex items-center text-sm font-semibold transition-all shadow-lg text-slate-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${ingestLoading ? 'animate-spin' : ''}`} />
          {ingestLoading ? 'Synchronizing...' : 'Sync & Vectorize'}
        </button>
      </div>

      {ingestStatus && (
        <div className={`p-4 rounded-xl text-sm border flex items-center gap-2 ${ingestStatus.includes('Error') ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
          <div className={`h-2 w-2 rounded-full ${ingestStatus.includes('Error') ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
          {ingestStatus}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document index list */}
        <div className="lg:col-span-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4 border-b border-slate-800/80 pb-3">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-orange-400" />
              RAG Documents
            </h3>
            <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded font-bold uppercase">
              {documents.length} Files
            </span>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {documents.map((doc, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-slate-300 p-3 bg-slate-950/40 border border-slate-800 hover:border-slate-700 rounded-xl hover:bg-slate-800/20 transition-all">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-400/80" />
                  <span className="font-medium text-slate-300">{doc}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              </div>
            ))}
          </div>
        </div>

        {/* Query tester */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-400" />
            Query Simulator
          </h3>
          
          <form onSubmit={handleQuery} className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. What is the delivery timeframe and late policy?"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
            />
            <button 
              type="submit"
              disabled={loading || !query}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              {loading ? 'Searching...' : 'Search Context'}
            </button>
          </form>

          {result && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
              <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 font-semibold">
                  Source: {result.source || 'none'}
                </span>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Confidence Score:</span>
                  <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full" 
                      style={{ width: `${(result.confidence || 0) * 100}%` }} 
                    />
                  </div>
                  <span className="text-xs text-slate-300 font-mono font-bold">
                    {((result.confidence || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Retrieved RAG Answer Context</p>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {result.answer_context}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
