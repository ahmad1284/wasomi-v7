
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole, ResearchStatus, Research } from '../types';
import { getStore } from '../store';
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BarChart3, 
  TrendingUp, 
  Building,
  GraduationCap,
  X,
  ShieldCheck,
  FileSearch,
  BookOpen,
  Info,
  Archive,
  UserCheck
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import StudentDashboard from './StudentDashboard';

const Overview: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    published: 0,
    drafts: 0,
    institutionalApproved: 0,
    studentsVerified: 0
  });
  const [showGuidelines, setShowGuidelines] = useState(false);

  useEffect(() => {
    const { research: allResearch, users: allUsers } = getStore();
    // Exclude soft-deleted research from all calculations
    const activeResearch = allResearch.filter((r: Research) => r.status !== ResearchStatus.DELETED);
    let relevant = activeResearch;
    
    if (user.role === UserRole.STUDENT) {
      relevant = activeResearch.filter((r: Research) => r.primaryAuthorId === user.id);
    } else if (user.role === UserRole.SUPERVISOR) {
      relevant = activeResearch.filter((r: Research) => r.supervisorId === user.id);
    }

    const institutionalApproved = activeResearch.filter((r: Research) => 
      r.universityId === user.universityId && 
      (r.status === ResearchStatus.APPROVED || r.status === ResearchStatus.PUBLISHED)
    ).length;

    const studentsVerified = allUsers.filter((u: User) => 
      u.role === UserRole.STUDENT && 
      u.assignedSupervisorId === user.id && 
      u.verified
    ).length;

    setStats({
      total: relevant.length,
      pending: relevant.filter((r: Research) => 
        r.status === ResearchStatus.SUBMITTED || 
        r.status === ResearchStatus.UNDER_REVIEW || 
        r.status === ResearchStatus.REVISIONS_REQUESTED
      ).length,
      approved: relevant.filter((r: Research) => r.status === ResearchStatus.APPROVED).length,
      published: relevant.filter((r: Research) => r.status === ResearchStatus.PUBLISHED).length,
      drafts: relevant.filter((r: Research) => r.status === ResearchStatus.DRAFT).length,
      institutionalApproved,
      studentsVerified
    });
  }, [user]);

  if (user.role === UserRole.ADMIN) {
    return <AdminDashboard user={user} />;
  }

  const StatCard = ({ label, value, icon, sublabel, onClick }: any) => (
    <div 
      onClick={onClick}
      className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm ${onClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform text-blue-500`}>
          {React.cloneElement(icon as React.ReactElement<any>, { size: 24 })}
        </div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{sublabel}</span>
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight mb-0.5 group-hover:text-blue-600 transition-colors">{label}</p>
        <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user.role === UserRole.STUDENT ? (
          <>
            <StatCard label="My Submissions" value={stats.total} icon={<FileText />} sublabel="Total" onClick={() => document.getElementById('my-submissions-list')?.scrollIntoView({ behavior: 'smooth' })} />
            <StatCard label="In Progress" value={stats.pending} icon={<Clock />} sublabel="Waiting" onClick={() => navigate('/dashboard')} />
            <StatCard label="Approved" value={stats.approved} icon={<CheckCircle2 />} sublabel="Verified" onClick={() => navigate('/dashboard')} />
            <StatCard label="Published" value={stats.published} icon={<TrendingUp />} sublabel="Archive" onClick={() => navigate('/')} />
          </>
        ) : user.role === UserRole.SUPERVISOR ? (
          <>
            <StatCard 
              label="Assigned Tasks" 
              value={stats.total - stats.published} 
              icon={<Users />} 
              sublabel="Active" 
              onClick={() => navigate('/dashboard/reviews')}
            />
            <StatCard 
              label="Pending Review" 
              value={stats.pending} 
              icon={<AlertCircle />} 
              sublabel="Urgent" 
              onClick={() => navigate('/dashboard/reviews')}
            />
            <StatCard 
              label="Validated Works" 
              value={stats.approved} 
              icon={<CheckCircle2 />} 
              sublabel="My History" 
              onClick={() => navigate('/dashboard/repository')}
            />
            <StatCard 
              label="Approved Students" 
              value={stats.studentsVerified} 
              icon={<UserCheck />} 
              sublabel="University" 
              onClick={() => navigate('/dashboard/approvals?tab=history')}
            />
          </>
        ) : (
           <>
            <StatCard label="Total Submissions" value={stats.total} icon={<GraduationCap />} sublabel="All Statuses" onClick={() => navigate('/dashboard/publications')} />
            <StatCard label="Approved (Wait)" value={stats.approved} icon={<CheckCircle2 />} sublabel="Pending Pub" onClick={() => navigate('/dashboard/publications')} />
            <StatCard label="Institutional Repository" value={stats.institutionalApproved} icon={<Archive />} sublabel="Archive" onClick={() => navigate('/dashboard/repository')} />
           </>
        )}
      </div>

      {user.role === UserRole.STUDENT && (
        <>
          <div className="bg-[#0a192f] p-8 rounded-3xl text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 border border-blue-500/10 relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 translate-x-1/4 -translate-y-1/4">
               <ShieldCheck size={200} className="text-blue-500" />
            </div>
            <div className="max-w-xl relative z-10">
              <h2 className="text-xl font-black mb-2 tracking-tight">Academic Integrity & Preservation</h2>
              <p className="text-blue-200/60 text-sm leading-relaxed font-medium">
                Every submission to Wasomi Scholars undergoes a rigorous verification process. 
                Once published, research is assigned a permanent URN and becomes part of Zanzibar's 
                long-term digital intellectual heritage.
              </p>
            </div>
            <button 
              onClick={() => setShowGuidelines(true)}
              className="relative z-10 bg-white text-blue-900 px-8 py-3.5 rounded-2xl text-sm font-black hover:bg-blue-50 transition-all whitespace-nowrap shadow-xl shadow-black/20"
            >
               View Guidelines
            </button>
          </div>

          <div id="my-submissions-list" className="pt-4">
             <StudentDashboard user={user} />
          </div>
        </>
      )}

      {/* Guidelines Modal */}
      {showGuidelines && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowGuidelines(false)}
              className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={24} />
            </button>

            <div className="p-12">
              <div className="flex items-center gap-5 mb-10">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200">
                  <BookOpen size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Submission Guidelines</h2>
                  <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Wasomi Scholars Institutional Framework</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <FileSearch className="text-blue-600" size={20} />
                      <h3 className="font-black text-gray-900 uppercase tracking-widest text-[11px]">File Requirements</h3>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-600 font-medium">
                      <li className="flex items-start gap-2.5">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></div>
                        PDF format is strictly required for all uploads.
                      </li>
                      <li className="flex items-start gap-2.5">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></div>
                        Maximum file size recommended: 100 MB.
                      </li>
                      <li className="flex items-start gap-2.5">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></div>
                        Language must be English (v0.1 standard).
                      </li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <ShieldCheck className="text-green-600" size={20} />
                      <h3 className="font-black text-gray-900 uppercase tracking-widest text-[11px]">Intellectual Property</h3>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-600 font-medium">
                      <li className="flex items-start gap-2.5">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-600 shrink-0"></div>
                        <strong>Author:</strong> Retains full copyright and IP.
                      </li>
                      <li className="flex items-start gap-2.5">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-600 shrink-0"></div>
                        <strong>University:</strong> Holds validation rights.
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="text-indigo-600" size={20} />
                    <h3 className="font-black text-gray-900 uppercase tracking-widest text-[11px]">Submission Lifecycle</h3>
                  </div>
                  <div className="space-y-5">
                    {[
                      { state: 'Draft', desc: 'Editable; not visible to staff.' },
                      { state: 'Submitted', desc: 'Locked for supervisor review.' },
                      { state: 'Under Review', desc: 'Evaluation in progress.' },
                      { state: 'Approved', desc: 'Validated & awaiting publication.' },
                      { state: 'Published', desc: 'Publicly visible with permanent URN.' }
                    ].map((step, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-7 h-7 rounded-xl bg-white border-2 border-indigo-200 flex items-center justify-center text-[11px] font-black text-indigo-600 shadow-sm">
                            {i + 1}
                          </div>
                          {i < 4 && <div className="w-0.5 h-full bg-indigo-100/50 my-1.5"></div>}
                        </div>
                        <div className="pb-2">
                          <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{step.state}</p>
                          <p className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-12 p-5 bg-blue-50 border border-blue-100 rounded-2xl flex gap-4 items-center">
                <Info className="text-blue-600 shrink-0" size={24} />
                <p className="text-xs text-blue-800 font-bold leading-relaxed">
                  Important: Published research is permanent and cannot be deleted or overwritten. Withdrawal requests require explicit administrative approval.
                </p>
              </div>

              <button 
                onClick={() => setShowGuidelines(false)}
                className="mt-10 w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
              >
                I Understand the Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
