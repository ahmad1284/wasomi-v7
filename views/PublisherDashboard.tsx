
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Research, ResearchStatus, University } from '../types';
import { getStore, saveStore, createAuditEntry } from '../store';
import { Globe, BookOpen, Search, Archive, CheckCircle2, RefreshCw, FileText, Building, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const PublisherDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [researchList, setResearchList] = useState<Research[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [filter, setFilter] = useState<'PENDING' | 'PUBLISHED'>('PENDING');
  const [batchSelection, setBatchSelection] = useState<Set<string>>(new Set());
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const { research: allResearch, universities: allUnis } = getStore();
    setUniversities(allUnis);
    
    if (filter === 'PENDING') {
      setResearchList(allResearch.filter((r: Research) => 
        r.status === ResearchStatus.APPROVED || r.status === ResearchStatus.WITHDRAWN
      ));
    } else {
      setResearchList(allResearch.filter((r: Research) => r.status === ResearchStatus.PUBLISHED));
    }
    setCurrentPage(1);
  }, [filter]);

  const toggleSelection = (id: string) => {
    const next = new Set(batchSelection);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setBatchSelection(next);
  };

  const handleBatchPublish = () => {
    if (batchSelection.size === 0) return;
    setIsPublishing(true);
    
    setTimeout(() => {
      const { research: allResearch } = getStore();
      const updated = allResearch.map((r: Research) => {
        if (batchSelection.has(r.id)) {
          const actionText = r.status === ResearchStatus.WITHDRAWN ? 'Batch re-published withdrawn work' : 'Batch published';
          createAuditEntry(r.id, user.id, user.name, actionText, r.status, ResearchStatus.PUBLISHED);
          return {
            ...r,
            status: ResearchStatus.PUBLISHED,
            urn: r.urn || `urn:wasomi:research:${r.id}`,
            updatedAt: new Date().toISOString()
          };
        }
        return r;
      });
      
      saveStore({ research: updated });
      const nextList = updated.filter((r: Research) => 
        filter === 'PENDING' ? (r.status === ResearchStatus.APPROVED || r.status === ResearchStatus.WITHDRAWN) : r.status === ResearchStatus.PUBLISHED
      );
      setResearchList(nextList);
      setBatchSelection(new Set());
      setIsPublishing(false);
    }, 1500);
  };

  const totalPages = Math.ceil(researchList.length / ITEMS_PER_PAGE);
  const paginatedData = researchList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getUniDisplay = (uniId: string) => {
    const uni = universities.find(u => u.id === uniId);
    return uni?.shortName || uni?.name.split(' ')[0] || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Publication Pool</h1>
          <p className="text-sm font-medium text-gray-500">Review and disseminate validated research</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
           <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
            <button
              onClick={() => { setFilter('PENDING'); setBatchSelection(new Set()); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === 'PENDING' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-blue-600'
              }`}
            >
              Approved & Withdrawn
            </button>
            <button
              onClick={() => { setFilter('PUBLISHED'); setBatchSelection(new Set()); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === 'PUBLISHED' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-blue-600'
              }`}
            >
              Published Archive
            </button>
          </div>

          {filter === 'PENDING' && (
             <button 
               onClick={handleBatchPublish}
               disabled={batchSelection.size === 0 || isPublishing}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all ${
                 batchSelection.size > 0 
                  ? 'bg-[#00A3DD] text-white shadow-xl shadow-blue-500/20 hover:bg-blue-600' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
               }`}
             >
               {isPublishing ? <RefreshCw className="animate-spin" size={20} /> : <Globe size={20} />}
               Batch Publish ({batchSelection.size})
             </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {filter === 'PENDING' && (
                <th className="px-6 py-5 w-10">
                   <div className="flex items-center">
                     <input 
                      type="checkbox" 
                      onChange={(e) => {
                        if (e.target.checked) setBatchSelection(new Set(researchList.map(a => a.id)));
                        else setBatchSelection(new Set());
                      }}
                      checked={batchSelection.size === researchList.length && researchList.length > 0}
                      className="flex-shrink-0"
                     />
                   </div>
                </th>
              )}
              <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Research Identity</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Institution</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {paginatedData.map(item => (
              <tr key={item.id} className={`hover:bg-blue-50/20 transition-colors group ${batchSelection.has(item.id) ? 'bg-blue-50/50' : ''}`}>
                {filter === 'PENDING' && (
                  <td className="px-6 py-5">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={batchSelection.has(item.id)}
                        onChange={() => toggleSelection(item.id)}
                        className="flex-shrink-0"
                      />
                    </div>
                  </td>
                )}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-blue-500 shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-gray-900 leading-none mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">{item.title}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ID: {item.id.toUpperCase()} • Author: {item.primaryAuthorId} • {item.year}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                    <Building size={12} className="text-gray-400" />
                    <span className="text-[10px] font-black text-gray-600 uppercase">
                      {getUniDisplay(item.universityId)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest ${
                    item.status === ResearchStatus.PUBLISHED ? 'bg-green-50 text-green-700 border-green-200' : 
                    item.status === ResearchStatus.WITHDRAWN ? 'bg-gray-50 text-gray-600 border-gray-200' :
                    'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <Link 
                    to={`/dashboard/research/${item.id}`} 
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                  >
                    {filter === 'PENDING' ? 'Inspect/Publish' : 'View'} <FileText size={14} className="ml-0.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-6 py-5 bg-white border-t border-gray-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, researchList.length)} of {researchList.length}
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-blue-600 disabled:opacity-50 transition-all shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1 px-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                <span className="text-[10px] font-black text-blue-600">{currentPage}</span>
                <span className="text-[10px] font-black text-gray-300">/</span>
                <span className="text-[10px] font-black text-gray-400">{totalPages}</span>
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-blue-600 disabled:opacity-50 transition-all shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {researchList.length === 0 && (
          <div className="bg-white p-20 text-center">
             <Archive size={48} className="mx-auto text-gray-200 mb-4" />
             <h3 className="text-xl font-black text-gray-800">Archive is empty</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublisherDashboard;
