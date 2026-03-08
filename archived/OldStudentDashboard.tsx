
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Research, ResearchStatus, DegreeLevel, UserRole } from '../types';
import { getStore, saveStore, createAuditEntry, uploadFileToSupabase, saveResearchToSupabase } from '../store';
import { Plus, FileText, Clock, AlertCircle, Edit, Search, FileUp, X, Upload, File, Loader2, ShieldCheck, Download, ScrollText, UserCheck } from 'lucide-react';
import { DEGREE_LEVELS, UNIVERSITIES, LICENSES, DEPARTMENTS } from '../constants';

const StudentDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [research, setResearch] = useState<Research[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [editingResearchId, setEditingResearchId] = useState<string | null>(null);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [discipline, setDiscipline] = useState(DEPARTMENTS[0].id);
  const [course, setCourse] = useState('');
  const [degree, setDegree] = useState<DegreeLevel>(DegreeLevel.BSC);
  const [year, setYear] = useState(new Date().getFullYear());
  const [supervisorId, setSupervisorId] = useState('');
  const [coAuthors, setCoAuthors] = useState('');
  const [license, setLicense] = useState(LICENSES[0].id);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // File State
  const [file, setFile] = useState<File | null>(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | undefined>(undefined);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const { research: allResearch, users } = getStore();
    setResearch(allResearch.filter((r: Research) => r.primaryAuthorId === user.id && !r.isArchived));
    setSupervisors(users.filter((u: User) => u.role === UserRole.SUPERVISOR && u.universityId === user.universityId));
  }, [user.id, user.universityId]);

  useEffect(() => {
    if (supervisors.length > 0 && !supervisorId) setSupervisorId(supervisors[0].id);
  }, [supervisors, supervisorId]);

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
    if (!file && !existingPdfUrl) {
      setFileError('Please upload your research PDF document.');
      return;
    }
    if (!acceptedTerms) {
      setFileError('You must accept the Terms and Conditions.');
      return;
    }

    setIsUploading(true);
    const researchId = editingResearchId || Math.random().toString(36).substr(2, 9);
    let finalPdfUrl = existingPdfUrl || '';

    const isSupabase = !!(process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('placeholder'));
    
    if (file) {
      if (isSupabase) {
        const path = `${user.id}/${researchId}-${file.name}`;
        const uploadedUrl = await uploadFileToSupabase(file, path);
        finalPdfUrl = uploadedUrl || URL.createObjectURL(file);
      } else {
        finalPdfUrl = URL.createObjectURL(file);
      }
    }

    const { research: allResearch } = getStore();
    const existingResearch = editingResearchId ? allResearch.find(r => r.id === editingResearchId) : null;
    
    const updatedResearch: Research = {
      id: researchId,
      title,
      abstract,
      discipline,
      course,
      primaryAuthorId: user.id,
      coAuthors: coAuthors ? coAuthors.split(',').map(s => s.trim()) : [],
      supervisorId,
      universityId: user.universityId,
      degreeLevel: degree,
      year,
      status: existingResearch ? existingResearch.status : ResearchStatus.DRAFT,
      license,
      pdfUrl: finalPdfUrl,
      createdAt: existingResearch ? (existingResearch.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isArchived: false
    };

    let newAllResearch;
    if (editingResearchId) {
      newAllResearch = allResearch.map(r => r.id === editingResearchId ? updatedResearch : r);
      await createAuditEntry(researchId, user.id, user.name, 'Updated research', updatedResearch.status, updatedResearch.status);
    } else {
      newAllResearch = [...allResearch, updatedResearch];
      await createAuditEntry(researchId, user.id, user.name, 'Created research draft', null, ResearchStatus.DRAFT);
    }

    saveStore({ research: newAllResearch });
    if (isSupabase) await saveResearchToSupabase(updatedResearch);

    setResearch(newAllResearch.filter((r: Research) => r.primaryAuthorId === user.id && !r.isArchived));
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingResearchId(null);
    setTitle('');
    setAbstract('');
    setDiscipline(DEPARTMENTS[0].id);
    setCourse('');
    setFile(null);
    setExistingPdfUrl(undefined);
    setFileError('');
    setAcceptedTerms(false);
    setCoAuthors('');
    setIsUploading(false);
  };

  const getStatusColor = (status: ResearchStatus) => {
    switch(status) {
      case ResearchStatus.DRAFT: return 'bg-white text-gray-700 border-gray-200';
      case ResearchStatus.SUBMITTED: return 'bg-white text-blue-700 border-blue-200';
      case ResearchStatus.UNDER_REVIEW: return 'bg-white text-yellow-700 border-yellow-200';
      case ResearchStatus.REVISIONS_REQUESTED: return 'bg-white text-orange-700 border-orange-200';
      case ResearchStatus.APPROVED: return 'bg-white text-indigo-700 border-indigo-200';
      case ResearchStatus.PUBLISHED: return 'bg-white text-green-700 border-green-200';
      case ResearchStatus.REJECTED_FINAL: return 'bg-white text-red-700 border-red-200';
      default: return 'bg-white text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Submissions</h1>
          <p className="text-sm font-medium text-gray-500">Manage and track your academic research submissions</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#00A3DD] text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20"
        >
          <Plus size={20} strokeWidth={3} />
          New Submission
        </button>
      </div>

      {research.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-gray-100 p-20 text-center shadow-sm">
          <FileUp size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-xl font-black text-gray-700">Ready to publish?</h3>
          <p className="text-gray-500 mt-2 font-medium">Create your first research submission to begin the validation process.</p>
          <button onClick={() => setIsModalOpen(true)} className="mt-6 text-blue-500 font-black hover:underline">Start a new draft</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {research.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col group">
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
                <div className="flex gap-2">
                  <Link to={`/dashboard/research/${r.id}`} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-blue-500 hover:text-white transition-all">View Details</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-hidden">
          <div 
            className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="modal-title"
          >
            <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <h2 id="modal-title" className="text-2xl font-black text-gray-900 tracking-tight">
                {editingResearchId ? 'Edit Research Submission' : 'New Research Submission'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar scroll-smooth bg-white">
              <form id="submission-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Research Title</label>
                    <input
                      type="text"
                      required
                      disabled={isUploading}
                      className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white font-medium shadow-sm hover:border-gray-300"
                      placeholder="Enter the full title of your research"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Abstract</label>
                    <textarea
                      required
                      disabled={isUploading}
                      rows={5}
                      className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white font-medium shadow-sm hover:border-gray-300"
                      placeholder="Summarize objectives, methodology, and findings..."
                      value={abstract}
                      onChange={(e) => setAbstract(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Research Discipline</label>
                      <select
                        disabled={isUploading}
                        className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none bg-white font-bold text-sm shadow-sm hover:border-gray-300 cursor-pointer"
                        value={discipline}
                        onChange={(e) => setDiscipline(e.target.value)}
                      >
                        {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Current Course</label>
                      <input
                        type="text"
                        required
                        disabled={isUploading}
                        className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white font-medium shadow-sm hover:border-gray-300"
                        placeholder="e.g. BSc in Computer Science"
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Degree Level</label>
                      <select
                        disabled={isUploading}
                        className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none bg-white font-bold text-sm shadow-sm hover:border-gray-300 cursor-pointer"
                        value={degree}
                        onChange={(e) => setDegree(e.target.value as DegreeLevel)}
                      >
                        {DEGREE_LEVELS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Year</label>
                      <input
                        type="number"
                        disabled={isUploading}
                        className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none bg-white font-medium shadow-sm hover:border-gray-300"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Project Supervisor</label>
                    <select
                      disabled={isUploading}
                      className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none bg-white font-bold text-sm shadow-sm hover:border-gray-300 cursor-pointer"
                      value={supervisorId}
                      onChange={(e) => setSupervisorId(e.target.value)}
                    >
                      {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      {supervisors.length === 0 && <option value="">No supervisors found for your university</option>}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Open Access License</label>
                    <select
                      disabled={isUploading}
                      className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none bg-white font-bold text-sm shadow-sm hover:border-gray-300 cursor-pointer"
                      value={license}
                      onChange={(e) => setLicense(e.target.value)}
                    >
                      {LICENSES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Research Document (PDF Only)</label>
                    <div 
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center cursor-pointer transition-all bg-white ${
                        file || existingPdfUrl ? 'border-green-300 bg-green-50/10' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/30'
                      }`}
                    >
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" disabled={isUploading} />
                      {file ? (
                        <div className="flex flex-col items-center text-center">
                          <div className="bg-white border border-green-100 p-4 rounded-2xl text-green-600 mb-3 shadow-sm"><File size={36} /></div>
                          <p className="text-sm font-black text-gray-900 truncate max-w-xs">{file.name}</p>
                          <p className="text-[10px] text-gray-400 font-black uppercase mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      ) : existingPdfUrl ? (
                         <div className="flex flex-col items-center text-center">
                          <div className="bg-white border border-blue-100 p-4 rounded-2xl text-blue-600 mb-3 shadow-sm"><File size={36} /></div>
                          <p className="text-sm font-black text-gray-900 truncate max-w-xs">Existing Research File</p>
                          <p className="text-[10px] text-blue-500 font-black uppercase mt-1">Click to replace</p>
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
                      <input 
                        id="terms"
                        type="checkbox" 
                        required
                        className="mt-1 h-5 w-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        disabled={isUploading}
                      />
                      <label htmlFor="terms" className="text-[11px] text-blue-800 leading-relaxed cursor-pointer font-bold uppercase tracking-tight">
                        I certify that this research is my original work. I understand that upon publication, it becomes a permanent part of the archive. I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="underline font-black hover:text-blue-900 transition-colors">Terms of Service</button>.
                      </label>
                    </div>
                  </div>
                  {fileError && <p className="text-xs text-red-600 font-black flex items-center gap-1.5 bg-red-50 p-3 rounded-xl border border-red-100"><AlertCircle size={14}/> {fileError}</p>}
                </div>
              </form>
            </div>

            <div className="px-10 py-8 border-t border-gray-100 bg-white flex gap-4 shrink-0">
              <button
                type="button"
                disabled={isUploading}
                onClick={closeModal}
                className="flex-1 px-4 py-4 rounded-2xl border border-gray-200 font-black text-sm text-gray-500 hover:bg-gray-50 transition-all bg-white shadow-sm"
              >
                Cancel
              </button>
              <button
                form="submission-form"
                type="submit"
                className="flex-1 px-4 py-4 rounded-2xl bg-[#00A3DD] font-black text-sm text-white hover:bg-blue-600 shadow-xl shadow-blue-500/20 disabled:bg-gray-300 disabled:shadow-none flex items-center justify-center gap-2 transition-all"
                disabled={!!fileError || isUploading || !acceptedTerms}
              >
                {isUploading ? <><Loader2 className="animate-spin" size={20} /> Processing...</> : (editingResearchId ? 'Save Changes' : 'Save as Draft')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl relative p-10">
            <button 
              onClick={() => setShowTermsModal(false)}
              className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl shadow-sm border border-blue-100">
                <ScrollText size={28} />
              </div>
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

            <button 
              onClick={() => { setAcceptedTerms(true); setShowTermsModal(false); }}
              className="mt-10 w-full bg-[#00A3DD] text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20"
            >
              I Accept the Terms
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
