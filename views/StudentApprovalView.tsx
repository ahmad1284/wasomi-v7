
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { User, UserRole } from '../types';
import { getStore, saveStore, sendEmailNotification } from '../store';
import { UserCheck, Clock, CheckCircle2, XCircle, Search, Mail, Building, History, Fingerprint, ChevronRight, UserMinus, ShieldAlert } from 'lucide-react';

const StudentApprovalView: React.FC<{ user: User }> = ({ user }) => {
  const [students, setStudents] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Tab control: 'pending' or 'history'
  const activeTab = searchParams.get('tab') === 'history' ? 'history' : 'pending';

  useEffect(() => {
    const { users } = getStore();
    // Filter for students assigned to this supervisor
    const assignedStudents = users.filter((u: User) => 
      u.role === UserRole.STUDENT && 
      u.assignedSupervisorId === user.id
    );
    setStudents(assignedStudents);
  }, [user.id]);

  // View Guard: Only supervisors, publishers, or admins should see this.
  if (user.role === UserRole.STUDENT) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-gray-100 p-20 text-center shadow-sm">
        <ShieldAlert size={64} className="mx-auto text-red-100 mb-6" />
        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Access Denied</h3>
        <p className="text-gray-500 mt-2 font-medium mb-8">Student verification tools are restricted to institutional staff.</p>
        <Link to="/dashboard" className="bg-[#00A3DD] text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all">Return to My Dashboard</Link>
      </div>
    );
  }

  const handleVerify = async (student: User, status: boolean) => {
    const { users: allUsers } = getStore();
    const updated = allUsers.map((u: User) => 
      u.id === student.id ? { ...u, verified: status } : u
    );
    saveStore({ users: updated });
    
    // Refresh local state from the same filtered list
    setStudents(updated.filter((u: User) => u.role === UserRole.STUDENT && u.assignedSupervisorId === user.id));

    if (status) {
      await sendEmailNotification(
        student.email,
        "Account Verified by Supervisor",
        `Hello ${student.name},\n\nYour account has been verified by your supervisor, ${user.name}.\n\nYou can now log in and start your research submissions.\n\nBest regards,\nWasomi Scholars`
      );
    }
  };

  const filtered = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.idNumber && s.idNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeTab === 'history') return matchesSearch && s.verified;
    return matchesSearch && !s.verified;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Researcher Management</h1>
          <p className="text-sm font-medium text-gray-500">Verify student registrations linked to your institutional profile</p>
        </div>
        <div className="bg-gray-100 p-1 rounded-2xl w-full max-w-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name or Reg No..."
              className="w-full pl-11 pr-4 py-2.5 border-none rounded-xl focus:ring-0 outline-none bg-white text-sm font-medium shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-gray-100 w-fit shadow-sm">
        <button 
          onClick={() => setSearchParams({ tab: 'pending' })}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'pending' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-400 hover:text-blue-600'
          }`}
        >
          <Clock size={14} /> Pending Queue
        </button>
        <button 
          onClick={() => setSearchParams({ tab: 'history' })}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'history' ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' : 'text-gray-400 hover:text-purple-600'
          }`}
        >
          <History size={14} /> Verification History
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-20 text-center shadow-sm">
          {activeTab === 'pending' ? (
            <>
              <UserCheck size={64} className="mx-auto text-green-100 mb-6" />
              <h3 className="text-xl font-black text-gray-800">Queue is Clear</h3>
              <p className="text-gray-500 mt-2 font-medium">No students are currently awaiting your verification.</p>
            </>
          ) : (
            <>
              <History size={64} className="mx-auto text-gray-100 mb-6" />
              <h3 className="text-xl font-black text-gray-800">No History Found</h3>
              <p className="text-gray-500 mt-2 font-medium">Verified student accounts will be listed here.</p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Student / Identity</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Registration Number</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {filtered.map(student => (
                  <tr key={student.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm shrink-0 ${
                          student.verified ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}>
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 leading-none mb-1 group-hover:text-blue-600 transition-colors">{student.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 uppercase tracking-tighter"><Mail size={12}/> {student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       {student.idNumber ? (
                         <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg">
                           <Fingerprint size={12} className="text-blue-400" />
                           <span className="text-[10px] font-mono font-black text-gray-700">{student.idNumber}</span>
                         </div>
                       ) : (
                         <span className="text-[10px] text-gray-300 font-black italic">NOT PROVIDED</span>
                       )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest ${
                        student.verified ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                      }`}>
                        {student.verified ? 'VERIFIED' : 'PENDING APPROVAL'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!student.verified ? (
                        <button 
                          onClick={() => handleVerify(student, true)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                        >
                          <UserCheck size={14} /> Verify Account
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleVerify(student, false)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-red-500 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                        >
                          <UserMinus size={14} /> Revoke Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentApprovalView;
