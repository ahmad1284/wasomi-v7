
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, UserRole, Research, ResearchStatus, University } from '../types';
import { getStore } from '../store';
import { 
  Sparkles, 
  Zap, 
  Building2, 
  Search, 
  ArrowRight, 
  FileText, 
  ChevronRight, 
  MessageSquare, 
  CheckCircle2, 
  Clock,
  Building,
  Target,
  ChevronLeft
} from 'lucide-react';

const ITEMS_PER_PAGE = 8;

const AIAssistant: React.FC<{ user: User }> = ({ user }) => {
  const [impactReady, setImpactReady] = useState<Research[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ANALYZED' | 'PENDING'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const { research: allResearch, universities: allUnis } = getStore();
    setUniversities(allUnis);
    const ready = allResearch.filter((r: Research) => 
      r.status === ResearchStatus.PUBLISHED || r.status === ResearchStatus.APPROVED
    );
    setImpactReady(ready);
  }, []);

  if (user.role !== UserRole.ADMIN && user.role !== UserRole.PUBLISHER) {
    return <div className="p-10 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">Access Denied.</div>;
  }

  const filtered = impactReady.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase());
    const isAnalyzed = !!r.aiSuggestions;
    if (filterStatus === 'ANALYZED') return matchesSearch && isAnalyzed;
    if (filterStatus === 'PENDING') return matchesSearch && !isAnalyzed;
    return matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getPotentialScore = (r: Research) => {
    let score = Math.min(Math.floor(r.abstract.length / 100), 10);
    if (r.impactTarget?.email) score += 2;
    return Math.min(score, 10);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             <Sparkles className="text-indigo-500" />
             Impact Discovery Hub
          </h1>
          <p className="text-sm font-medium text-gray-500">Connecting Zanzibar's top research to regional policy makers</p>
        </div>
        
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
          {(['ALL', 'ANALYZED', 'PENDING'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filterStatus === s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-indigo-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Filter by title, author or keyword..." 
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm"
          value={searchTerm} 
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
        />
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Research Identity</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Institution</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Impact Score</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Analysis Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {paginatedData.map(r => (
              <tr key={r.id} className="hover:bg-indigo-50/20 transition-all group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-indigo-500 shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-gray-900 leading-none mb-1.5 line-clamp-1 group-hover:text-indigo-600 transition-colors">{r.title}</p>
                      <div className="flex items-center gap-2">
                         <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">REF: {r.id.slice(0, 6).toUpperCase()}</span>
                         <span className="text-gray-200">|</span>
                         <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded uppercase">{r.degreeLevel}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                    <Building size={12} className="text-gray-400" />
                    <span className="text-[10px] font-black text-gray-600 uppercase">
                      {universities.find(u => u.id === r.universityId)?.shortName || 'Zanzibar'}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-5 text-center">
                  <div className="flex flex-col items-center">
                    <div className="flex gap-0.5 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-1.5 h-3 rounded-full ${i < (getPotentialScore(r)/2) ? 'bg-indigo-500' : 'bg-gray-100'}`}></div>
                      ))}
                    </div>
                    <span className="text-[9px] font-black text-gray-400 uppercase">Score: {getPotentialScore(r)}/10</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-center">
                   {r.aiSuggestions ? (
                     <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-green-600 bg-green-50 border border-green-100 px-3 py-1 rounded-full uppercase tracking-widest">
                       <CheckCircle2 size={12} /> Analyzed
                     </span>
                   ) : (
                     <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-orange-500 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full uppercase tracking-widest">
                       <Clock size={12} /> Pending
                     </span>
                   )}
                </td>
                <td className="px-8 py-5 text-right">
                   <Link 
                    to={`/dashboard/research/${r.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 border border-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                   >
                     Inspect <Target size={14} />
                   </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {totalPages > 1 && (
          <div className="px-8 py-5 bg-white border-t border-gray-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 disabled:opacity-50 transition-all shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1 px-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                <span className="text-[10px] font-black text-indigo-600">{currentPage}</span>
                <span className="text-[10px] font-black text-gray-300">/</span>
                <span className="text-[10px] font-black text-gray-400">{totalPages}</span>
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 disabled:opacity-50 transition-all shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="py-32 text-center bg-white">
            <Zap size={48} className="mx-auto text-gray-100 mb-4" />
            <h3 className="text-xl font-black text-gray-800">No candidates match</h3>
            <p className="text-gray-500 mt-2 font-medium">Try adjusting your filters or search keywords.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
