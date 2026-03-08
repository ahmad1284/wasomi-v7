
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, University } from '../types';
import { getStore, saveStore } from '../store';
import { Building, MapPin, CheckCircle2, Plus, X, Globe, Save, Edit, Hash, Search, FileUp, Download, Loader2, AlertTriangle, Trash2, ChevronLeft, ChevronRight, FileText, CheckCircle } from 'lucide-react';

const ITEMS_PER_PAGE = 8;

const InstitutionsDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [editingUniId, setEditingUniId] = useState<string | null>(null);
  const [uniName, setUniName] = useState('');
  const [uniShortName, setUniShortName] = useState('');
  const [uniLocation, setUniLocation] = useState('Zanzibar');
  const [programmes, setProgrammes] = useState<string[]>([]);
  const [newProg, setNewProg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const { universities: allUnis } = getStore();
    setUniversities(allUnis);
  }, []);

  if (user.role !== UserRole.ADMIN) {
    return <div className="p-10 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">Unauthorized access. Institutional management is restricted to global administrators.</div>;
  }

  const openAddModal = () => {
    setEditingUniId(null);
    setUniName('');
    setUniShortName('');
    setUniLocation('Zanzibar');
    setProgrammes([]);
    setIsModalOpen(true);
  };

  const openEditModal = (univ: University) => {
    setEditingUniId(univ.id);
    setUniName(univ.name);
    setUniShortName(univ.shortName || '');
    setUniLocation(univ.location);
    setProgrammes(univ.programmes || []);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUniId(null);
    setUniName('');
    setUniShortName('');
    setUniLocation('Zanzibar');
    setProgrammes([]);
    setNewProg('');
  };

  const addProgramme = () => {
    if (newProg.trim() && !programmes.includes(newProg.trim())) {
      setProgrammes([...programmes, newProg.trim()]);
      setNewProg('');
    }
  };

  const removeProgramme = (prog: string) => {
    setProgrammes(programmes.filter(p => p !== prog));
  };

  const handleDeleteUni = (univ: University) => {
    const { research } = getStore();
    const hasActiveResearch = research.some((r: any) => r.universityId === univ.id);
    
    if (hasActiveResearch) {
      alert("CRITICAL: Cannot delete institution. This university has active research records associated with it. Move or delete the research first.");
      return;
    }

    if (window.confirm(`DANGER: Permanently delete ${univ.name}? This will revoke institutional access for all associated students and supervisors.`)) {
      const { universities: allUnis } = getStore();
      const nextUnis = allUnis.filter((u: University) => u.id !== univ.id);
      saveStore({ universities: nextUnis });
      setUniversities(nextUnis);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { universities: allUnis } = getStore();
    let updated: University[];
    if (editingUniId) {
      updated = allUnis.map((u: University) => 
        u.id === editingUniId ? { ...u, name: uniName, shortName: uniShortName, location: uniLocation, programmes } : u
      );
    } else {
      updated = [...allUnis, { id: Math.random().toString(36).substr(2, 9), name: uniName, shortName: uniShortName, location: uniLocation, verified: true, programmes }];
    }
    setUniversities(updated);
    saveStore({ universities: updated });
    closeModal();
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
      const { universities: allUnis } = getStore();
      const newUnis: University[] = [];
      const errors: string[] = [];
      let successCount = 0;

      // Skip header
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const [name, shortName, location, programmesStr] = lines[i].split(',').map(s => s?.trim());
        
        if (!name || !location) {
          errors.push(`Row ${i + 1}: Name and Location are required.`);
          continue;
        }

        if (allUnis.some((u: University) => u.name.toLowerCase() === name.toLowerCase())) {
          errors.push(`Row ${i + 1}: Institution "${name}" already exists.`);
          continue;
        }

        newUnis.push({
          id: Math.random().toString(36).substr(2, 9),
          name,
          shortName: shortName || '',
          location,
          verified: true,
          programmes: programmesStr ? programmesStr.split(';').map(p => p.trim()) : []
        });
        successCount++;
      }

      if (newUnis.length > 0) {
        const finalUnis = [...allUnis, ...newUnis];
        saveStore({ universities: finalUnis });
        setUniversities(finalUnis);
      }

      setImportResult({ success: successCount, failed: errors.length, errors });
      setIsProcessing(false);
      if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csvContent = "Name,Short Name,Location,Programmes (Semicolon separated)\nState University of Zanzibar,SUZA,Tunguu,BSc in CS;MSc in Education\nZanzibar University,ZU,Tunguu,LLB Law;BBA Accounting";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wasomi_institutions_template.csv';
    a.click();
  };

  const filtered = universities.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.shortName && u.shortName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Partner Institutions</h1>
          <p className="text-sm font-medium text-gray-500">Manage validated universities and institutional programmes</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsBulkImportOpen(true)} className="flex items-center gap-2 bg-white text-gray-700 px-5 py-2.5 rounded-xl font-bold border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"><FileUp size={20} />Bulk Import</button>
          <button onClick={openAddModal} className="flex items-center gap-2 bg-[#00A3DD] text-white px-6 py-2.5 rounded-xl font-black text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"><Plus size={20} strokeWidth={3} />Register</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
           <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Filter institutions..." className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Institutional Identity</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Short Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Programmes</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {paginatedData.map(univ => (
                <tr key={univ.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-blue-500 shadow-sm shrink-0 group-hover:scale-110 transition-transform"><Building size={20} /></div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 leading-none mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">{univ.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{univ.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center"><span className="inline-flex items-center px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg text-[10px] font-black text-gray-700 uppercase">{univ.shortName || '—'}</span></td>
                  <td className="px-6 py-4 text-center"><p className="text-xs font-black text-gray-700 leading-none mb-1">{univ.programmes?.length || 0} registered</p></td>
                  <td className="px-6 py-4 text-center"><span className="inline-flex items-center gap-1.5 text-[9px] font-black text-green-600 bg-green-50/50 border border-green-100 px-3 py-1 rounded-full uppercase tracking-widest shadow-sm"><CheckCircle2 size={12} />Verified</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => handleDeleteUni(univ)} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all"><Trash2 size={16} /></button>
                       <button onClick={() => openEditModal(univ)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"><Edit size={14} /> Manage</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
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
      </div>

      {/* Bulk Import Modal */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-3">
                <FileUp className="text-blue-500" size={24} />
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Bulk Institution Import</h2>
              </div>
              <button onClick={() => { setIsBulkImportOpen(false); setImportResult(null); }} className="text-gray-400 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-full transition-all"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 bg-white custom-scrollbar">
              {!importResult ? (
                <div className="space-y-6">
                  <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                    <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-2 flex items-center gap-2"><Download size={14} /> Import Guidelines</h3>
                    <p className="text-xs text-blue-700 leading-relaxed font-medium">
                      Upload a CSV file containing institutions. Columns should be: <b>Name, Short Name, Location, Programmes</b>.
                      <br/><br/>
                      Use semicolons (;) to separate multiple programmes.
                    </p>
                    <button onClick={downloadTemplate} className="mt-4 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1.5">
                      Download CSV Template
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
                        <p className="text-sm font-black text-gray-700 uppercase tracking-widest">Processing records...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <div className="bg-gray-50 p-4 rounded-2xl text-gray-400 mb-4 group-hover:scale-110 transition-transform">
                          <FileText size={36} />
                        </div>
                        <p className="text-sm font-black text-gray-700">Click to select CSV File</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Max 500 records per upload</p>
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
                      <h3 className="text-lg font-black text-gray-900 leading-tight">Import Process Finalized</h3>
                      <p className="text-sm font-medium text-gray-600 mt-1">
                        <span className="text-green-600 font-bold">{importResult.success} successfully added</span>
                        {importResult.failed > 0 && <span className="text-red-500 font-bold"> • {importResult.failed} skipped</span>}
                      </p>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Error Summary</h4>
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
                    className="w-full py-4 bg-[#00A3DD] text-white rounded-2xl font-black text-sm hover:bg-blue-600 shadow-xl shadow-blue-500/20"
                  >
                    Return to Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">{editingUniId ? 'Institutional Configuration' : 'Register Institution'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-full transition-all"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-white">
              <form id="uni-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">University Name</label><input type="text" required placeholder="State University of Zanzibar" className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white font-medium" value={uniName} onChange={(e) => setUniName(e.target.value)} /></div>
                  <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Acronym</label><input type="text" required placeholder="SUZA" className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white font-medium" value={uniShortName} onChange={(e) => setUniShortName(e.target.value)} /></div>
                </div>
                <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Location</label><input type="text" required placeholder="Tunguu, Zanzibar" className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white font-medium" value={uniLocation} onChange={(e) => setUniLocation(e.target.value)} /></div>
                <div className="border-t border-gray-100 pt-8">
                  <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">Programmes</h3>
                  <div className="flex gap-3 mb-4"><input type="text" placeholder="Add course (e.g. BSc in IT)" className="flex-grow px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white font-medium text-sm" value={newProg} onChange={(e) => setNewProg(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProgramme())} /><button type="button" onClick={addProgramme} className="bg-blue-50 text-blue-600 px-6 py-4 rounded-2xl font-black text-sm hover:bg-blue-600 hover:text-white transition-all border border-blue-100">Add</button></div>
                  <div className="flex flex-wrap gap-2">{programmes.length > 0 ? programmes.map((p, idx) => (<div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl group hover:bg-red-50 hover:border-red-100 transition-colors"><span className="text-xs font-bold text-gray-700 group-hover:text-red-600">{p}</span><button type="button" onClick={() => removeProgramme(p)} className="text-gray-400 hover:text-red-500"><Trash2 size={12} /></button></div>)) : (<p className="text-xs text-gray-400 italic">No programmes registered yet.</p>)}</div>
                </div>
              </form>
            </div>
            <div className="px-10 py-8 border-t border-gray-100 bg-white flex gap-4 shrink-0"><button type="button" onClick={closeModal} className="flex-1 py-4 border border-gray-200 rounded-2xl font-black text-sm text-gray-500 hover:bg-gray-50 transition-all bg-white shadow-sm">Cancel</button><button form="uni-form" type="submit" className="flex-1 py-4 bg-[#00A3DD] text-white rounded-2xl font-black text-sm hover:bg-blue-600 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"><Save size={18} />Save University Data</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionsDashboard;
