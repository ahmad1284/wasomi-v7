
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole, University, Research } from '../types';
import { getStore, saveStore, sendEmailNotification } from '../store';
import { Users, Building, ShieldAlert, BarChart3, Database, UserPlus, X, Save, ShieldCheck } from 'lucide-react';

const AdminDashboard: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, research: 0, institutions: 0 });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [fullUniversityList, setFullUniversityList] = useState<University[]>([]);
  const [isAddSupOpen, setIsAddSupOpen] = useState(false);
  
  // New Supervisor State
  const [supName, setSupName] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supUni, setSupUni] = useState('');

  useEffect(() => {
    const { users, research, universities: allUnis } = getStore();
    setStats({ users: users.length, research: research.length, institutions: allUnis.length });
    setFullUniversityList(allUnis);
    
    // Exactly 5 most recent users
    setRecentUsers(users.slice(-5).reverse());
    
    // Exactly 5 most recent supervisors
    const allSups = users.filter((u: User) => u.role === UserRole.SUPERVISOR);
    setSupervisors(allSups.slice(-5).reverse());
    
    // Exactly 5 most recent universities
    setUniversities(allUnis.slice(-5).reverse());
    
    if (allUnis.length > 0) setSupUni(allUnis[allUnis.length - 1].id);
  }, []);

  const handleAddSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: supEmail,
      name: supName,
      role: UserRole.SUPERVISOR,
      universityId: supUni,
      verified: true
    };
    
    const { users: allUsers } = getStore();
    const updated = [...allUsers, newUser];
    saveStore({ users: updated });
    
    const newSups = updated.filter((u: User) => u.role === UserRole.SUPERVISOR);
    setSupervisors(newSups.slice(-5).reverse());
    setRecentUsers(updated.slice(-5).reverse());
    setStats(prev => ({ ...prev, users: updated.length }));
    
    sendEmailNotification(
      supEmail,
      "Supervisor Account Created",
      `Welcome ${supName}. You have been added as a supervisor on Wasomi Scholars.`
    );

    setIsAddSupOpen(false);
    setSupName('');
    setSupEmail('');
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: stats.users, icon: <Users className="text-blue-600" />, path: '/dashboard/users' },
          { label: 'Submissions', value: stats.research, icon: <Database className="text-purple-600" />, path: '/dashboard/repository' },
          { label: 'Universities', value: stats.institutions, icon: <Building className="text-green-600" />, path: '/dashboard/institutions' },
          { label: 'System Health', value: 'Optimal', icon: <ShieldAlert className="text-orange-600" />, path: '/dashboard' },
        ].map((card, i) => (
          <button 
            key={i} 
            onClick={() => navigate(card.path)}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-left hover:border-blue-300 hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <div className={`w-12 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
              {card.icon}
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">{card.label}</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{card.value}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Supervisors List */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
             <h2 className="font-bold text-gray-900 flex items-center gap-2">
               <ShieldCheck size={18} className="text-purple-600" />
               Recent Supervisors
             </h2>
             <button 
              onClick={() => setIsAddSupOpen(true)}
              className="text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition-all"
              title="Add Supervisor"
             >
               <UserPlus size={18} />
             </button>
          </div>
          <div className="divide-y divide-gray-50 flex-grow">
            {supervisors.length > 0 ? (
              supervisors.map(u => (
                <div key={u.id} className="p-4 flex items-center gap-3 hover:bg-gray-50/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-xs font-bold text-purple-600 shadow-sm">
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{u.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{fullUniversityList.find(un => un.id === u.universityId)?.name || 'Central'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">No supervisors yet</div>
            )}
          </div>
        </section>

        {/* Recently Registered */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
             <h2 className="font-bold text-gray-900">Recently Registered</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers.length > 0 ? (
              recentUsers.map(u => (
                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 uppercase shadow-sm">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{u.name}</p>
                      <p className="text-[10px] text-gray-400">{u.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-white border border-gray-100 text-gray-600 rounded-full font-bold uppercase tracking-tight">{u.role}</span>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">No recent users</div>
            )}
          </div>
        </section>

        {/* Recent Universities List */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
           <div className="p-6 border-b border-gray-100 bg-white">
             <h2 className="font-bold text-gray-900">Recent Universities</h2>
           </div>
           <div className="divide-y divide-gray-50 bg-white">
             {universities.length > 0 ? (
               universities.map(univ => (
                 <div key={univ.id} className="p-4 flex items-center justify-between hover:bg-gray-50/30 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{univ.name}</p>
                      <p className="text-[10px] text-gray-400">{univ.location}, Zanzibar • Verified</p>
                    </div>
                 </div>
               ))
             ) : (
               <div className="p-10 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">No partner universities</div>
             )}
           </div>
        </section>
      </div>

      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-8 rounded-2xl text-white flex items-center justify-between shadow-xl shadow-blue-100">
         <div>
            <h2 className="text-2xl font-bold mb-2">Platform Administration</h2>
            <p className="text-blue-200 text-sm max-w-lg">
              Manage Zanzibar's intellectual heritage by validating institutions and onboarding supervisors.
            </p>
         </div>
         <BarChart3 size={100} className="text-white/10" />
      </div>

      {isAddSupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold text-gray-900">Add Supervisor</h2>
              <button onClick={() => setIsAddSupOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSupervisor} className="p-8 space-y-5 bg-white">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Dr. Omar Hamad"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white shadow-sm"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Email</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@university.ac.tz"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white shadow-sm"
                  value={supEmail}
                  onChange={(e) => setSupEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Affiliation</label>
                <select 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-bold"
                  value={supUni}
                  onChange={(e) => setSupUni(e.target.value)}
                >
                  {fullUniversityList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddSupOpen(false)}
                  className="flex-1 py-3.5 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all bg-white shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3.5 bg-[#00A3DD] text-white rounded-xl font-bold hover:bg-blue-600 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
