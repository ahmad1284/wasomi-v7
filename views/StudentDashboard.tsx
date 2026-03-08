
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, Research, ResearchStatus, UserRole, University, SystemSettings, ImpactTarget, DegreeLevel } from '../types';
import { getStore, saveStore, uploadFileToSupabase, createAuditEntry } from '../store';
import { Plus, X, Upload, File, Loader2, Lightbulb, User as UserIcon, Building, Mail, BookOpen, Clock, AlertCircle, ScrollText, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { DEPARTMENTS, LICENSES, DEGREE_LEVELS } from '../constants';

const ITEMS_PER_PAGE = 6;

const StudentDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [research, setResearch] = useState<Research[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [userUniversity, setUserUniversity] = useState<University | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Form State
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [discipline, setDiscipline] = useState(DEPARTMENTS[0].id);
  const [course, setCourse] = useState('');
  const [coAuthorsRaw, setCoAuthorsRaw] = useState('');
  const [degree, setDegree] = useState<string>(DEGREE_LEVELS[0]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [supervisorId, setSupervisorId] = useState('');
  const [license, setLicense] = useState(LICENSES[0].id);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [impactTarget, setImpactTarget] = useState<ImpactTarget>({ personName: '', department: '', email: '' });
  
  // File State
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const { research: allResearch, settings: sysSettings, users, universities: allUnis } = getStore();
    const myResearch = allResearch.filter((r: Research) => r.primaryAuthorId === user.id && r.status !== ResearchStatus.DELETED);
    setResearch(myResearch);
    setSettings(sysSettings);
    
    const institutionalSupervisors = users.filter((u: User) => u.role === UserRole.SUPERVISOR && u.universityId === user.universityId);
    setSupervisors(institutionalSupervisors);

    const uni = allUnis.find((u: University) => u.id === user.universityId);
    setUserUniversity(uni || null);
    
    if (sysSettings?.degreeLevels?.length > 0) setDegree(sysSettings.degreeLevels[0]);
    if (institutionalSupervisors.length > 0) setSupervisorId(institutionalSupervisors[0].id);

    if (uni?.programmes && uni.programmes.length > 0) {
      setCourse(uni.programmes[0]);
    }
  }, [user.id, user.universityId]);

  const totalPages = Math.ceil(research.length / ITEMS_PER_PAGE);
  const paginatedData = research.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFileError('');
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setFileError('Invalid file type. Please upload a PDF document.');
        setFile(null);
        return;
      }
      if (selectedFile.size > 100 * 1024 * 1024) { 
        setFileError('File size exceeds the 100MB limit.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setFileError('Please upload your research PDF document.');
      return;
    }
    if (!acceptedTerms) {
      setFileError('You must accept the Terms of Service.');
      return;
    }
    
    setIsUploading(true);
    const researchId = Math.random().toString(36).substr(2, 9);
    let pdfUrl = '';
    
    try {
      pdfUrl = await uploadFileToSupabase(file, `${user.id}/${researchId}.pdf`) || URL.createObjectURL(file);

      const { research: allResearch } = getStore();
      const newResearch: Research = {
        id: researchId, 
        title, 
        abstract, 
        discipline, 
        course,
        primaryAuthorId: user.id, 
        coAuthors: coAuthorsRaw.split(',').map(s => s.trim()).filter(s => s), 
        supervisorId, 
        universityId: user.universityId,
        degreeLevel: degree, 
        year, 
        status: ResearchStatus.DRAFT,
        pdfUrl, 
        license,
        impactTarget,
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString()
      };

      saveStore({ research: [newResearch, ...allResearch] });
      await createAuditEntry(researchId, user.id, user.name, 'Created research draft', null, ResearchStatus.DRAFT);
      
      setResearch([newResearch, ...research]);
      closeModal();
    } catch (err) {
      setFileError('Submission failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTitle(''); 
    setAbstract(''); 
    setCourse(userUniversity?.programmes?.[0] || ''); 
    setCoAuthorsRaw(''); 
    setFile(null); 
    setFileError(''); 
    setAcceptedTerms(false);
    setImpactTarget({ personName: '', department: '', email: '' });
  };

  const getStatusColor = (status: ResearchStatus) => {
    switch(status) {
      case ResearchStatus.DRAFT: return 'bg-white text-gray-700 border-gray-200';
      case ResearchStatus.SUBMITTED: return 'bg-blue-50 text-blue-700 border-blue-200';
      case ResearchStatus.UNDER_REVIEW: return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case ResearchStatus.REVISIONS_REQUESTED: return 'bg-orange-50 text-orange-700 border-orange-200';
      case ResearchStatus.APPROVED: return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case ResearchStatus.PUBLISHED: return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-white text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Submissions</h1>
          <p className="text-sm font-medium text-gray-500">Manage and track your academic research submissions</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#00A3DD] text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20"
        >
          <Plus size={20} strokeWidth={3} /> New Submission
        </button>
      </div>

      {research.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-gray-100 p-20 text-center shadow-sm">
          <Upload size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-xl font-black text-gray-700">Ready to publish?</h3>
          <p className="text-gray-500 mt-2 font-medium">Create your first research submission to begin the validation process.</p>
          <button onClick={() => setIsModalOpen(true)} className="mt-6 text-blue-500 font-black hover:underline">Start a new draft</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedData.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col group h-full">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[9px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full border ${getStatusColor(r.status)}`}>{r.status}</span>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">REF: {r.id.slice(0,6).toUpperCase()}</span>
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-blue-500 transition-colors">{r.title}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1.5 mb-6"><Clock size={12} /> Modified {new Date(r.updatedAt).toLocaleDateString()}</p>
                <div className="flex-grow"></div>
                <div className="flex items-center justify-between pt-5 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Level</span>
                    <span className="text-xs font-black text-gray-700">{r.degreeLevel}</span>
                  </div>
                  <Link to={`/dashboard/research/${r.id}`} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-blue-500 hover:text-white transition-all">View Details</Link>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-8 py-5 rounded-2xl border border-gray-100">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, research.length)} of {research.length}
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
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-hidden">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">New Research Submission</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-full transition-all"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-8 bg-white custom-scrollbar">
              <div className="space-y-5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Core Metadata</label>
                <input required type="text" placeholder="Research Title" className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white font-medium shadow-sm" value={title} onChange={e => setTitle(e.target.value)} />
                <textarea required rows={4} placeholder="Abstract & Methodology" className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white font-medium shadow-sm" value={abstract} onChange={e => setAbstract(e.target.value)} />
                
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Discipline</label>
                    <select value={discipline} onChange={e => setDiscipline(e.target.value)} className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none bg-white font-bold text-sm shadow-sm">
                      {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Current Course</label>
                    {userUniversity?.programmes && userUniversity.programmes.length > 0 ? (
                      <select 
                        required 
                        value={course} 
                        onChange={e => setCourse(e.target.value)} 
                        className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none bg-white font-bold text-sm shadow-sm"
                      >
                        {userUniversity.programmes.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    ) : (
                      <input required type="text" placeholder="e.g. BSc in CS" className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white font-medium shadow-sm" value={course} onChange={e => setCourse(e.target.value)} />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Degree Level</label>
                    <select value={degree} onChange={e => setDegree(e.target.value)} className="w-full px-5 py-4 border border-gray-200 rounded-2xl bg-white font-bold text-sm shadow-sm">
                      {settings?.degreeLevels.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Year</label>
                    {/* Fixed typo in parseInt and wrapped in arrow function */}
                    <input type="number" className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none bg-white font-medium shadow-sm" value={year} onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Project Supervisor</label>
                    <select required value={supervisorId} onChange={e => setSupervisorId(e.target.value)} className="w-full px-5 py-4 border border-gray-200 rounded-2xl bg-white font-bold text-sm shadow-sm">
                      <option value="">Select Supervisor</option>
                      {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Open Access License</label>
                    <select value={license} onChange={e => setLicense(e.target.value)} className="w-full px-5 py-4 border border-gray-200 rounded-2xl bg-white font-bold text-sm shadow-sm">
                      {LICENSES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Co-authors</label>
                   <input type="text" placeholder="Comma separated names" className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white font-medium shadow-sm" value={coAuthorsRaw} onChange={e => setCoAuthorsRaw(e.target.value)} />
                </div>
              </div>

              <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 space-y-4">
                <div className="flex items-center gap-2">
                  <Lightbulb size={18} className="text-blue-500" />
                  <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Impact Brief (Optional)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Contact Person" className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl text-xs font-bold shadow-sm" value={impactTarget.personName} onChange={e => setImpactTarget({...impactTarget, personName: e.target.value})} />
                  <input type="text" placeholder="Ministry / Department" className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl text-xs font-bold shadow-sm" value={impactTarget.department} onChange={e => setImpactTarget({...impactTarget, department: e.target.value})} />
                  <input type="email" placeholder="Contact Email" className="w-full md:col-span-2 px-4 py-3 bg-white border border-blue-100 rounded-xl text-xs font-bold shadow-sm" value={impactTarget.email} onChange={e => setImpactTarget({...impactTarget, email: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Research Manuscript (PDF Only)</label>
                <div 
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center cursor-pointer transition-all bg-white ${
                    file ? 'border-green-300 bg-green-50/10' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/30'
                  }`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" disabled={isUploading} />
                  {file ? (
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-white border border-green-100 p-4 rounded-2xl text-green-600 mb-3 shadow-sm"><File size={36} /></div>
                      <p className="text-sm font-black text-gray-900 truncate max-w-xs">{file.name}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-white border border-gray-100 p-4 rounded-2xl text-gray-300 mb-3 shadow-sm"><Upload size={36} /></div>
                      <p className="text-sm font-black text-gray-700">Click to upload PDF</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase mt-1">Maximum size: 100MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                <div className="flex items-start gap-4">
                  <div className="pt-0.5">
                    <input 
                      id="terms"
                      type="checkbox" 
                      required
                      className="border-gray-300 bg-white"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      disabled={isUploading}
                    />
                  </div>
                  <label htmlFor="terms" className="text-[11px] text-blue-800 leading-relaxed cursor-pointer font-bold uppercase tracking-tight">
                    I certify that this research is my original work. I understand that upon publication, it becomes a permanent part of the archive. I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="underline font-black hover:text-blue-900 transition-colors">Terms of Service</button>.
                  </label>
                </div>
              </div>

              {fileError && <p className="text-xs text-red-600 font-black flex items-center gap-1.5 bg-red-50 p-3 rounded-xl border border-red-100"><AlertCircle size={14}/> {fileError}</p>}

              <button disabled={isUploading || !acceptedTerms} className="w-full bg-[#00A3DD] text-white py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 disabled:bg-gray-300 disabled:shadow-none">
                {isUploading ? <><Loader2 className="animate-spin" size={20} /> Processing...</> : 'Save as Draft'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showTermsModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl relative p-10 animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowTermsModal(false)} className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all">
              <X size={20} />
            </button>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl shadow-sm border border-blue-100"><ScrollText size={28} /></div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Terms of Service</h3>
            </div>
            <div className="space-y-8 text-sm text-gray-600 font-medium leading-relaxed">
              <section>
                <h4 className="font-black text-gray-900 uppercase text-[10px] tracking-[0.3em] mb-2.5">1. Research Originality</h4>
                <p>By submitting work to Wasomi Scholars, you certify that the research is your own original academic contribution. Plagiarism will result in immediate rejection and potential disciplinary action.</p>
              </section>
              <section>
                <h4 className="font-black text-gray-900 uppercase text-[10px] tracking-[0.3em] mb-2.5">2. Permanent Archiving</h4>
                <p>You acknowledge that Wasomi Scholars is a preservation repository. Once your research is published, it is assigned a permanent URN and cannot be deleted without formal institutional approval.</p>
              </section>
            </div>
            <button onClick={() => { setAcceptedTerms(true); setShowTermsModal(false); }} className="mt-10 w-full bg-[#00A3DD] text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20">
              I Accept the Terms
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
