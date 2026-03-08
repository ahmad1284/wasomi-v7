
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, UserRole, University } from '../types';
import { getStore, saveStore, sendEmailNotification } from '../store';
import { 
  UserPlus, 
  Search, 
  X, 
  Mail, 
  CheckCircle2, 
  Users as UsersIcon, 
  Clock, 
  ShieldCheck, 
  Ban, 
  MoreVertical,
  Filter,
  GraduationCap,
  UserCheck,
  ExternalLink,
  ShieldAlert,
  Fingerprint,
  FileUp,
  Download,
  Loader2,
  AlertTriangle,
  Building,
  UserMinus,
  Unlock,
  ChevronLeft,
  ChevronRight,
  Trash2,
  FileText,
  CheckCircle
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const UserManagementDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddSupervisorOpen, setIsAddSupervisorOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'SUPERVISORS'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [newSupName, setNewSupName] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [newSupUni, setNewSupUni] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const { users: allUsers, universities: allUnis } = getStore();
    setUsers(allUsers);
    setUniversities(allUnis);
    if (allUnis.length > 0) setNewSupUni(allUnis[0].id);
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'PENDING' || tab === 'ALL' || tab === 'SUPERVISORS') {
      setActiveTab(tab as any);
      setCurrentPage(1);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'ALL' | 'PENDING' | 'SUPERVISORS') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (user.role !== UserRole.ADMIN) {
    return <div className="p-10 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">Unauthorized access. Only administrators can manage users.</div>;
  }

  const filtered = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.idNumber && u.idNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    if (activeTab === 'PENDING') return matchesSearch && !u.verified;
    if (activeTab === 'SUPERVISORS') return matchesSearch && u.role === UserRole.SUPERVISOR;
    return matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const toggleVerification = async (targetUser: User) => {
    const { users: allUsers } = getStore();
    const isNowVerified = !targetUser.verified;
    const updated = allUsers.map((u: User) => u.id === targetUser.id ? { ...u, verified: isNowVerified } : u);
    saveStore({ users: updated });
    setUsers(updated);
  };

  const toggleSuspension = (targetUser: User) => {
    const { users: allUsers } = getStore();
    const updated = allUsers.map((u: User) => u.id === targetUser.id ? { ...u, isSuspended: !u.isSuspended } : u);
    saveStore({ users: updated });
    setUsers(updated);
  };

  const handleDeleteUser = (targetUser: User) => {
    if (targetUser.id === user.id) return; // Cannot delete self
    if (window.confirm(`DANGER: Permanently delete the account for ${targetUser.name}? This action is permanent and will orphan their associated research records.`)) {
      const { users: allUsers } = getStore();
      const nextUsers = allUsers.filter((u: User) => u.id !== targetUser.id);
      saveStore({ users: nextUsers });
      setUsers(nextUsers);
    }
  };

  const handleAddSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = { id: Math.random().toString(36).substr(2, 9), email: newSupEmail, name: newSupName, role: UserRole.SUPERVISOR, universityId: newSupUni, verified: true };
    const { users: allUsers } = getStore();
    const nextUsers = [...allUsers, newUser];
    saveStore({ users: nextUsers });
    setUsers(nextUsers);
    setIsAddSupervisorOpen(false);
    setNewSupName('');
    setNewSupEmail('');
  };

  const handleBulkImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/);
      const { users: allUsers } = getStore();
      const newUsers: User[] = [];
      const errors: string[] = [];
      let successCount = 0;

      // Skip header
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const [name, email, role, universityId, idNumber] = lines[i].split(',').map(s => s?.trim());
        
        if (!name || !email || !role || !universityId) {
          errors.push(`Row ${i + 1}: Required fields missing (Name, Email, Role, Institution ID).`);
          continue;
        }

        if (allUsers.some((u: User) => u.email.toLowerCase() === email.toLowerCase())) {
          errors.push(`Row ${i + 1}: User with email "${email}" already exists.`);
          continue;
        }

        const validRole = Object.values(UserRole).includes(role as UserRole);
        if (!validRole) {
          errors.push(`Row ${i + 1}: Invalid role "${role}".`);
          continue;
        }

        newUsers.push({
          id: Math.random().toString(36).substr(2, 9),
          name,
          email,
          role: role as UserRole,
          universityId,
          idNumber: idNumber || '',
          verified: true
        });
        successCount++;
      }

      if (newUsers.length > 0) {
        const finalUsers = [...allUsers, ...newUsers];
        saveStore({ users: finalUsers });
        setUsers(finalUsers);
      }

      setImportResult({ success: successCount, failed: errors.length, errors });
      setIsProcessing(false);
      if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csvContent = "Name,Email,Role,Institution ID,Reg No\nAli Bakari,ali@suza.ac.tz,Researcher,1,2024/SUZA/101\nDr. Sarah Juma,sarah@suza.ac.tz,Supervisor,1,";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wasomi_users_template.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-black text-gray-900 tracking-tight">User Management</h1><p className="text-sm font-medium text-gray-500">Manage institutional staff and approve registrations</p></div>
        <div className="flex gap-3 w-full md:w-auto"><button onClick={() => setIsBulkImportOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-gray-700 px-5 py-2.5 rounded-xl font-bold border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"><FileUp size={20} />Bulk Import</button><button onClick={() => setIsAddSupervisorOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#00A3DD] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"><UserPlus size={20} />Add Supervisor</button></div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
             {[{ id: 'ALL', label: 'All Users', icon: <UsersIcon size={14}/> }, { id: 'PENDING', label: 'Queue', icon: <Clock size={14}/> }, { id: 'SUPERVISORS', label: 'Supervisors', icon: <ShieldCheck size={14}/> }].map(tab => (
               <button key={tab.id} onClick={() => handleTabChange(tab.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-gray-400 hover:text-gray-600'}`}>{tab.icon}{tab.label}</button>
             ))}
           </div>
           <div className="relative flex-grow max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all bg-white shadow-sm" 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.1em]">Identity</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.1em]">Affiliation</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.1em] text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.1em] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {paginatedData.map(u => (
                <tr key={u.id} className={`hover:bg-blue-50/20 transition-colors group ${u.isSuspended ? 'opacity-60 bg-gray-50' : ''}`}>
                  <td className="px-6 py-4"><div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shadow-sm ${u.verified ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>{u.name.charAt(0)}</div><div><p className="text-sm font-black leading-none mb-1">{u.name}</p><p className="text-xs text-gray-400 font-bold">{u.email}</p></div></div></td>
                  <td className="px-6 py-4"><p className="text-xs font-black text-gray-600 flex items-center gap-1.5 mb-1"><Building size={14} className="text-gray-300" />{universities.find(univ => univ.id === u.universityId)?.name || 'Central'}</p><span className="text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest">{u.role}</span></td>
                  <td className="px-6 py-4 text-center"><span className={`inline-flex items-center gap-1.5 text-[9px] font-black tracking-[0.2em] px-2.5 py-1 rounded-full ${u.verified ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'}`}>{u.verified ? 'VERIFIED' : 'PENDING'}</span></td>
                  <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2">{u.role !== UserRole.ADMIN && (<><button onClick={() => handleDeleteUser(u)} className="p-2 rounded-xl border border-gray-100 bg-white text-gray-300 hover:text-red-600 hover:border-red-100 transition-all" title="Delete Account"><Trash2 size={16}/></button><button onClick={() => toggleSuspension(u)} className={`p-2 rounded-xl border transition-all ${u.isSuspended ? 'bg-green-50 text-green-600 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`} title={u.isSuspended ? 'Unlock' : 'Suspended'}>{u.isSuspended ? <Unlock size={16}/> : <UserMinus size={16}/>}</button><button onClick={() => toggleVerification(u)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border uppercase tracking-widest ${u.verified ? 'text-red-500 bg-red-50 border-red-100' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'}`}>{u.verified ? 'Revoke' : 'Approve'}</button></>)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-blue-600 disabled:opacity-50 transition-all shadow-sm"><ChevronLeft size={16} /></button>
              <div className="flex items-center gap-1 px-3 bg-white border border-gray-200 rounded-lg shadow-sm"><span className="text-[10px] font-black text-blue-600">{currentPage}</span><span className="text-[10px] font-black text-gray-300">/</span><span className="text-[10px] font-black text-gray-400">{totalPages}</span></div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-blue-600 disabled:opacity-50 transition-all shadow-sm"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Import Modal */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-3">
                <FileUp className="text-blue-500" size={24} />
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Mass User Enrollment</h2>
              </div>
              <button onClick={() => { setIsBulkImportOpen(false); setImportResult(null); }} className="text-gray-400 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-full transition-all"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 bg-white custom-scrollbar">
              {!importResult ? (
                <div className="space-y-6">
                  <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                    <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-2 flex items-center gap-2"><Download size={14} /> Import Format</h3>
                    <p className="text-xs text-blue-700 leading-relaxed font-medium">
                      CSV File columns: <b>Name, Email, Role, Institution ID, Reg No</b>.
                      <br/><br/>
                      Valid roles: <i>Researcher, Supervisor, Publisher, Admin</i>.
                    </p>
                    <button onClick={downloadTemplate} className="mt-4 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1.5">
                      Download Sample CSV
                    </button>
                  </div>

                  <div 
                    onClick={() => bulkFileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-[2rem] p-12 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all bg-white group"
                  >
                    <input 
                      type="file" 
                      ref={bulkFileInputRef} 
                      onChange={handleBulkImport} 
                      className="hidden" 
                      accept=".csv" 
                    />
                    {isProcessing ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="animate-spin text-blue-500 mb-3" size={36} />
                        <p className="text-sm font-black text-gray-700 uppercase tracking-widest">Enrolling Users...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <div className="bg-gray-50 p-4 rounded-2xl text-gray-400 mb-4 group-hover:scale-110 transition-transform">
                          <UsersIcon size={36} />
                        </div>
                        <p className="text-sm font-black text-gray-700">Drop CSV File Here</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Unlimited records per batch</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                  <div className={`p-6 rounded-[2rem] flex items-center gap-6 border ${importResult.failed === 0 ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${importResult.failed === 0 ? 'bg-green-600 text-white shadow-lg' : 'bg-orange-500 text-white shadow-lg'}`}>
                      {importResult.failed === 0 ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 leading-tight">Batch Enrollment Complete</h3>
                      <p className="text-sm font-medium text-gray-600 mt-1">
                        <span className="text-green-600 font-bold">{importResult.success} scholars added</span>
                        {importResult.failed > 0 && <span className="text-red-500 font-bold"> • {importResult.failed} failed</span>}
                      </p>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Validation Errors</h4>
                      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 max-h-48 overflow-y-auto custom-scrollbar">
                        {importResult.errors.map((err, i) => (
                          <div key={i} className="text-xs text-red-600 font-medium py-1.5 flex gap-2">
                            <span className="shrink-0">•</span> {err}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => { setImportResult(null); setIsBulkImportOpen(false); }}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                  >
                    Close & Refresh
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAddSupervisorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-white">
              <h2 className="text-xl font-black text-gray-900">Add Supervisor</h2>
              <button onClick={() => setIsAddSupervisorOpen(false)} className="text-gray-400 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-full transition-all"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddSupervisor} className="p-10 space-y-6 bg-white">
              <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label><input type="text" required placeholder="e.g. Dr. Juma Hamad" className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white font-medium" value={newSupName} onChange={e => setNewSupName(e.target.value)} /></div>
              <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email</label><input type="email" required placeholder="name@university.ac.tz" className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white font-medium" value={newSupEmail} onChange={e => setNewSupEmail(e.target.value)} /></div>
              <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Institution Affiliation</label><select className="w-full px-5 py-4 border border-gray-200 rounded-2xl bg-white font-bold text-sm shadow-sm" value={newSupUni} onChange={e => setNewSupUni(e.target.value)}>{universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
              <div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsAddSupervisorOpen(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-black text-sm text-gray-500 hover:bg-gray-50 transition-all bg-white shadow-sm">Cancel</button><button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2">Enforce Account</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementDashboard;
