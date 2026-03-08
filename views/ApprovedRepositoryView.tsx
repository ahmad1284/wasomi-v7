
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Research, ResearchStatus, UserRole, University } from '../types';
import { getStore } from '../store';
import { Archive, Search, FileText, ChevronRight, Bookmark, Building, ChevronLeft } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const ApprovedRepositoryView: React.FC<{ user: User }> = ({ user }) => {
  const [researchList, setResearchList] = useState<Research[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const { research: allResearch, universities: allUnis } = getStore();
    setUniversities(allUnis);
    
    let repo = allResearch.filter((r: Research) => 
      (r.status === ResearchStatus.APPROVED || r.status === ResearchStatus.PUBLISHED)
    );

    if (user.universityId) {
      repo = repo.filter((r: Research) => r.universityId === user.universityId);
    }

    if (user.role === UserRole.SUPERVISOR) {
      repo = repo.filter((r: Research) => r.supervisorId === user.id);
    }
    
    setResearchList(repo);
    setCurrentPage(1);
  }, [user.universityId, user.role, user.id]);

  const filtered = researchList.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.abstract.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.urn && r.urn.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getUniDisplay = (uniId: string) => {
    const uni = universities.find(u => u.id === uniId);
    return uni?.shortName || uni?.name.split(' ')[0] || 'Unknown';
  };

  const isSupervisor = user.role === UserRole.SUPERVISOR;
  const isGlobalStaff = !user.universityId && (user.role === UserRole.PUBLISHER || user.role === UserRole.ADMIN);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {isGlobalStaff ? 'Global Research Archive' : (isSupervisor ? 'My Approved Works' : 'Institutional Repository')}
          </h1>
          <p className="text-sm font-medium text-gray-500">
            {isGlobalStaff 
              ? 'Comprehensive ledger of all validated research across the Zanzibar network'
              : (isSupervisor 
                ? 'Archive of academic works validated and signed off by you' 
                : 'Historical archive of all validated academic works for this institution')}
          </p>
        </div>
        <div className="bg-white p-1 rounded-2xl w-full max-w-sm border border-gray-200 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by title, URN, or content..."
              className="w-full pl-11 pr-4 py-2.5 border-none rounded-xl focus:ring-0 outline-none bg-white text-gray-900 text-sm font-medium transition-all"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-20 text-center shadow-sm">
          <Archive size={64} className="mx-auto text-gray-200 mb-6" />
          <h3 className="text-xl font-black text-gray-800">
            {searchTerm ? 'No matches found' : 'Archive is empty'}
          </h3>
          <p className="text-gray-500 mt-2 font-medium max-w-sm mx-auto">
            {isSupervisor 
              ? "You haven't officially approved any research submissions yet." 
              : "No research matching the criteria has been archived yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Research Identity</th>
                    {isGlobalStaff && (
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Institution</th>
                    )}
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Level / Year</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Archival Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {paginatedData.map(r => (
                    <tr key={r.id} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-blue-500 shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                            <FileText size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-gray-900 leading-none mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">{r.title}</p>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">REF: {r.id.slice(0, 6).toUpperCase()}</span>
                               {r.urn && <span className="text-[10px] text-blue-400 font-bold"> • {r.urn}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      {isGlobalStaff && (
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg">
                            <Building size={12} className="text-gray-400" />
                            <span className="text-[10px] font-black text-gray-600 uppercase">
                              {getUniDisplay(r.universityId)}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 text-center">
                         <p className="text-xs font-black text-gray-700 leading-none mb-1">{r.degreeLevel}</p>
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{r.year}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <span className={`inline-block whitespace-nowrap text-[9px] font-black px-2.5 py-1.5 rounded-full border uppercase tracking-widest shadow-sm ${
                            r.status === ResearchStatus.PUBLISHED ? 'bg-green-600 text-white border-green-600' : 'bg-indigo-600 text-white border-indigo-600'
                          }`}>
                            {r.status === ResearchStatus.PUBLISHED ? 'PUBLICLY ARCHIVED' : 'INSTITUTIONALLY VALIDATED'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          to={`/dashboard/research/${r.id}`} 
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                        >
                          Details <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-8 py-5 rounded-2xl border border-gray-100">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Showing {paginatedData.length} of {filtered.length} results
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 hover:text-blue-600 disabled:opacity-50 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1 px-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-[10px] font-black text-blue-600">{currentPage}</span>
                  <span className="text-[10px] font-black text-gray-300">/</span>
                  <span className="text-[10px] font-black text-gray-400">{totalPages}</span>
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 hover:text-blue-600 disabled:opacity-50 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApprovedRepositoryView;
