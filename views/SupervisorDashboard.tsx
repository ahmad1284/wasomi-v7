
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Research, ResearchStatus, UserRole } from '../types';
import { getStore } from '../store';
import { CheckCircle2, AlertCircle, Clock, Search, BookOpen, FileText, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';

const ITEMS_PER_PAGE = 8;

const SupervisorDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [tasks, setTasks] = useState<Research[]>([]);
  const [filter, setFilter] = useState<ResearchStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const { research: allResearch } = getStore();
    setTasks(allResearch.filter((r: Research) => 
      r.supervisorId === user.id && 
      r.status !== ResearchStatus.DRAFT &&
      r.status !== ResearchStatus.PUBLISHED &&
      r.status !== ResearchStatus.APPROVED
    ));
    setCurrentPage(1);
  }, [user.id]);

  // View Guard: Only supervisors, publishers, or admins should see this.
  if (user.role === UserRole.STUDENT) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-gray-100 p-20 text-center shadow-sm">
        <ShieldAlert size={64} className="mx-auto text-red-100 mb-6" />
        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Access Denied</h3>
        <p className="text-gray-500 mt-2 font-medium mb-8">Verification tools are restricted to institutional staff.</p>
        <Link to="/dashboard" className="bg-[#00A3DD] text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all">Return to My Dashboard</Link>
      </div>
    );
  }

  const filtered = filter === 'ALL' ? tasks : tasks.filter(t => t.status === filter);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Review Queue</h1>
          <p className="text-sm font-medium text-gray-500">Active submissions awaiting your validation</p>
        </div>
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
          {(['ALL', ResearchStatus.SUBMITTED, ResearchStatus.UNDER_REVIEW, ResearchStatus.REVISIONS_REQUESTED] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-blue-600'
              }`}
            >
              {f === 'ALL' ? 'Everything' : f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-20 text-center shadow-sm">
          <CheckCircle2 size={48} className="mx-auto text-green-300 mb-4" />
          <h3 className="text-xl font-black text-gray-800">Queue is empty</h3>
          <p className="text-gray-500 mt-2 font-medium">No active submissions are currently awaiting your action.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Research Metadata</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Current Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Last Activity</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {paginatedData.map(task => (
                    <tr key={task.id} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-gray-900 line-clamp-1 leading-none mb-1 group-hover:text-blue-600 transition-colors">{task.title}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{task.degreeLevel} • {task.year}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest ${
                          task.status === ResearchStatus.SUBMITTED ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          task.status === ResearchStatus.UNDER_REVIEW ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                          task.status === ResearchStatus.REVISIONS_REQUESTED ? 'bg-orange-50 text-orange-700 border-orange-100' :
                          'bg-gray-50 text-gray-500 border-gray-100'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                          {new Date(task.updatedAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Link 
                          to={`/dashboard/research/${task.id}`}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-gray-100 hover:border-blue-600 shadow-sm"
                        >
                          <FileText size={14} /> Process
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
                Showing {paginatedData.length} of {filtered.length} submissions
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
        </div>
      )}
    </div>
  );
};

export default SupervisorDashboard;
