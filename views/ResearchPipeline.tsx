
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Research, ResearchStatus, University, UserRole } from '../types';
import { getStore } from '../store';
import { 
  GitPullRequest, 
  Search, 
  Filter, 
  Building, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User as UserIcon, 
  FileText, 
  ChevronRight, 
  Archive, 
  RotateCcw, 
  ChevronLeft 
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const ResearchPipeline: React.FC<{ user: User }> = ({ user }) => {
  const [pipeline, setPipeline] = useState<Research[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ResearchStatus | 'ALL'>('ALL');
  const [uniFilter, setUniFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const { research: allResearch, universities: allUnis, users } = getStore();
    setUniversities(allUnis);
    setAllUsers(users);
    
    const inPipeline = allResearch.filter((r: Research) => 
      r.status !== ResearchStatus.PUBLISHED && 
      r.status !== ResearchStatus.DRAFT
    );
    setPipeline(inPipeline);
  }, []);

  if (user.role !== UserRole.ADMIN && user.role !== UserRole.PUBLISHER) {
    return <div className="p-10 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">Access Denied. Oversight views are restricted to platform staff.</div>;
  }

  const filtered = pipeline.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesUni = uniFilter === 'ALL' || r.universityId === uniFilter;
    return matchesSearch && matchesStatus && matchesUni;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getStatusStyle = (status: ResearchStatus) => {
    switch(status) {
      case ResearchStatus.SUBMITTED: return 'bg-blue-50 text-blue-700 border-blue-200';
      case ResearchStatus.UNDER_REVIEW: return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case ResearchStatus.REVISIONS_REQUESTED: return 'bg-orange-50 text-orange-700 border-orange-100';
      case ResearchStatus.APPROVED: return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case ResearchStatus.REJECTED_FINAL: return 'bg-red-50 text-red-700 border-red-200';
      case ResearchStatus.WITHDRAWN: return 'bg-gray-100 text-gray-600 border-gray-300';
      default: return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const getSupervisorName = (id: string) => {
    return allUsers.find(u => u.id === id)?.name || 'Unassigned';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <GitPullRequest className="text-blue-600" />
            Research Pipeline
          </h1>
          <p className="text-sm font-medium text-gray-500">Global oversight of research currently in validation stages</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search titles or identifiers..." 
            className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white font-medium text-sm shadow-sm"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div>
          <select 
            className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl outline-none bg-white font-bold text-sm shadow-sm cursor-pointer"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
          >
            <option value="ALL">Status: All</option>
            <option value={ResearchStatus.SUBMITTED}>Submitted</option>
            <option value={ResearchStatus.UNDER_REVIEW}>Under Review</option>
            <option value={ResearchStatus.REVISIONS_REQUESTED}>Revisions Requested</option>
            <option value={ResearchStatus.APPROVED}>Approved</option>
            <option value={ResearchStatus.REJECTED_FINAL}>Rejected Final</option>
            <option value={ResearchStatus.WITHDRAWN}>Withdrawn</option>
          </select>
        </div>
        <div>
          <select 
            className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl outline-none bg-white font-bold text-sm shadow-sm cursor-pointer"
            value={uniFilter}
            onChange={e => { setUniFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="ALL">Institution: All</option>
            {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Research / Identifier</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Assigned Reviewer</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Last Activity</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {paginatedData.map(r => (
                <tr key={r.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-6 py-5 max-w-md">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-blue-500 shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 leading-none mb-1.5 line-clamp-1 group-hover:text-blue-600 transition-colors">{r.title}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1.5">
                          <Building size={10} /> 
                          {universities.find(u => u.id === r.universityId)?.shortName || 'University'} 
                          <span className="text-gray-200">|</span> 
                          REF: {r.id.slice(0, 6).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusStyle(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <p className="text-xs font-black text-gray-700 leading-none mb-1">{getSupervisorName(r.supervisorId)}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Institutional Supervisor</p>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                       <p className="text-xs font-black text-gray-600">{new Date(r.updatedAt).toLocaleDateString()}</p>
                       <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{new Date(r.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                  <td className="px-6 py-5 text-right">
                    <Link 
                      to={`/dashboard/research/${r.id}`} 
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                    >
                      Inspect <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-5 bg-white border-t border-gray-100 flex items-center justify-between">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
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

        {filtered.length === 0 && (
          <div className="py-20 text-center bg-white">
            <GitPullRequest size={48} className="mx-auto text-gray-100 mb-4" />
            <h3 className="text-xl font-black text-gray-800">Pipeline is clear</h3>
            <p className="text-gray-500 mt-2 font-medium">No records match your current filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchPipeline;
