
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Research, User, ResearchStatus, AuditLog, UserRole, DegreeLevel, University } from '../types';
import { getStore, saveStore, createAuditEntry, sendEmailNotification, createNotification, notifyRole, uploadFileToSupabase, saveResearchToSupabase } from '../store';
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  User as UserIcon, 
  GraduationCap, 
  Send, 
  CheckCircle, 
  RotateCcw, 
  XCircle, 
  Globe, 
  ShieldCheck,
  Download,
  History,
  Archive,
  AlertTriangle,
  Building,
  Mail,
  Edit,
  X,
  Upload,
  File,
  Loader2,
  Bookmark
} from 'lucide-react';
import { LICENSES, DEGREE_LEVELS, DEPARTMENTS } from '../constants';

const ResearchDetail: React.FC<{ user: User }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const [research, setResearch] = useState<Research | null>(null);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [supervisor, setSupervisor] = useState<User | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [comment, setComment] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editAbstract, setEditAbstract] = useState('');
  const [editDiscipline, setEditDiscipline] = useState(DEPARTMENTS[0].id);
  const [editCourse, setEditCourse] = useState('');
  const [editDegree, setEditDegree] = useState<DegreeLevel>(DegreeLevel.BSC);
  const [editYear, setEditYear] = useState(new Date().getFullYear());
  const [editSupervisorId, setEditSupervisorId] = useState('');
  const [editCoAuthors, setEditCoAuthors] = useState('');
  const [editLicense, setEditLicense] = useState(LICENSES[0].id);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [allSupervisors, setAllSupervisors] = useState<User[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const { research: allResearch, audit: allAudit, users, universities: allUnis } = getStore();
    setUniversities(allUnis);
    const r = allResearch.find((res: Research) => res.id === id);
    if (r) {
      setResearch(r);
      setAudit(allAudit.filter((a: AuditLog) => a.researchId === r.id));
      setSupervisor(users.find((u: User) => u.id === r.supervisorId));
      setAuthor(users.find((u: User) => u.id === r.primaryAuthorId));
      setAllSupervisors(users.filter(u => u.role === UserRole.SUPERVISOR && u.universityId === r.universityId));
    }
  }, [id]);

  if (!research) return <div className="p-10 text-center">Research not found</div>;

  const updateStatus = async (newStatus: ResearchStatus, action: string) => {
    const { research: allResearch } = getStore();
    const generatedUrn = newStatus === ResearchStatus.PUBLISHED ? `urn:wasomi:research:${research.id}` : research.urn;
    
    const updated = allResearch.map((r: Research) => 
      r.id === research.id ? { 
        ...r, 
        status: newStatus, 
        updatedAt: new Date().toISOString(),
        urn: generatedUrn
      } : r
    );
    
    let emailDetails = undefined;
    const researchLink = `/dashboard/research/${research.id}`;
    
    if (author) {
      let subject = `Research Status Update: ${newStatus}`;
      let body = `Hello ${author.name},\n\nThe status of your submission "${research.title}" has been updated to: ${newStatus}.\n\n`;
      
      if (newStatus === ResearchStatus.PUBLISHED) {
        body += `Congratulations! Your research is now live in the public archive.\nURN: ${generatedUrn}\n\n`;
      } else if (newStatus === ResearchStatus.REVISIONS_REQUESTED) {
        body += `Revisions are required before your work can proceed. Reviewer comments: ${comment || 'Please see the dashboard for details.'}\n\n`;
      }
      
      body += `Login to your dashboard to view more details.\n\nBest regards,\nWasomi Scholars Team`;
      emailDetails = { to: author.email, subject, body, recipientId: author.id, link: researchLink };
    }

    if (newStatus === ResearchStatus.SUBMITTED && supervisor) {
      createNotification(
        supervisor.id,
        "Research Submission Update",
        `Student ${author?.name || 'Unknown'} has submitted research titled "${research.title}" for review.`,
        'info',
        researchLink
      );
    }

    if (newStatus === ResearchStatus.APPROVED) {
      notifyRole(
        UserRole.PUBLISHER,
        "Ready for Publication",
        `Research titled "${research.title}" by ${author?.name || 'Unknown'} has been approved by the supervisor and is ready for final publication.`,
        'success',
        researchLink
      );
    }

    saveStore({ research: updated });
    // CRITICAL: Must await the audit entry to ensure it's written to store before we re-read it
    await createAuditEntry(research.id, user.id, user.name, action, research.status, newStatus, comment, emailDetails);
    
    const newR = updated.find((r: Research) => r.id === research.id);
    setResearch(newR!);
    setComment('');
    
    // Refresh audit trail from the newly updated store
    const { audit: allAudit } = getStore();
    setAudit(allAudit.filter((a: AuditLog) => a.researchId === research.id));
  };

  const openEdit = () => {
    setEditTitle(research.title);
    setEditAbstract(research.abstract);
    setEditDiscipline(research.discipline || DEPARTMENTS[0].id);
    setEditCourse(research.course || '');
    // Fix: Cast research.degreeLevel as DegreeLevel to match state type
    setEditDegree(research.degreeLevel as DegreeLevel);
    setEditYear(research.year);
    setEditSupervisorId(research.supervisorId);
    setEditCoAuthors(research.coAuthors.join(', '));
    setEditLicense(research.license || LICENSES[0].id);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    let finalPdfUrl = research.pdfUrl || '';
    if (editFile) {
      const isSupabase = !!(process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('placeholder'));
      if (isSupabase) {
        const path = `${user.id}/${research.id}-${editFile.name}`;
        const uploadedUrl = await uploadFileToSupabase(editFile, path);
        finalPdfUrl = uploadedUrl || URL.createObjectURL(editFile);
      } else {
        finalPdfUrl = URL.createObjectURL(editFile);
      }
    }

    const { research: allResearch } = getStore();
    const updatedResearch: Research = {
      ...research,
      title: editTitle,
      abstract: editAbstract,
      discipline: editDiscipline,
      course: editCourse,
      degreeLevel: editDegree,
      year: editYear,
      supervisorId: editSupervisorId,
      coAuthors: editCoAuthors ? editCoAuthors.split(',').map(s => s.trim()) : [],
      license: editLicense,
      pdfUrl: finalPdfUrl,
      updatedAt: new Date().toISOString()
    };

    const newAllResearch = allResearch.map(r => r.id === research.id ? updatedResearch : r);
    saveStore({ research: newAllResearch });
    
    const isSupabase = !!(process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('placeholder'));
    if (isSupabase) await saveResearchToSupabase(updatedResearch);

    // CRITICAL: Await the audit entry creation
    await createAuditEntry(research.id, user.id, user.name, 'Metadata updated via detailed edit', research.status, research.status);
    
    setResearch(updatedResearch);
    
    // Refresh audit trail
    const { audit: allAudit } = getStore();
    setAudit(allAudit.filter((a: AuditLog) => a.researchId === research.id));

    setIsEditModalOpen(false);
    setIsUploading(false);
    setEditFile(null);
  };

  const isStudent = user.role === UserRole.STUDENT;
  const isSupervisor = user.role === UserRole.SUPERVISOR;
  const isPublisher = user.role === UserRole.PUBLISHER;
  const isAdmin = user.role === UserRole.ADMIN;
  const isAuthor = author?.id === user.id;

  const getStatusBadge = (status: ResearchStatus) => {
    const styles: Record<ResearchStatus, string> = {
      [ResearchStatus.DRAFT]: 'bg-gray-100 text-gray-700 border-gray-200',
      [ResearchStatus.SUBMITTED]: 'bg-blue-50 text-blue-700 border-blue-200',
      [ResearchStatus.UNDER_REVIEW]: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      [ResearchStatus.REVISIONS_REQUESTED]: 'bg-orange-50 text-orange-700 border-orange-200',
      [ResearchStatus.APPROVED]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      [ResearchStatus.PUBLISHED]: 'bg-green-50 text-green-700 border-green-200',
      [ResearchStatus.WITHDRAWN]: 'bg-gray-200 text-gray-600 border-gray-300',
      [ResearchStatus.REJECTED_FINAL]: 'bg-red-50 text-red-700 border-red-200',
      /* Added missing DELETED status to match ResearchStatus enum requirements */
      [ResearchStatus.DELETED]: 'bg-black text-white border-black',
    };
    return <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${styles[status]}`}>{status}</span>;
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-white bg-gray-100 rounded-xl text-gray-500 shadow-sm border border-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black text-gray-900 leading-tight tracking-tight">{research.title}</h1>
            {getStatusBadge(research.status)}
          </div>
          <p className="text-xs text-gray-500 font-medium flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Clock size={14} className="text-gray-400" /> Submitted {new Date(research.createdAt).toLocaleDateString()}</span>
            {research.urn && <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">URN: {research.urn}</span>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Abstract</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">{research.abstract}</p>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
             <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Metadata Details</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Building size={14}/> Institution</h3>
                  <p className="font-bold text-gray-900">{universities.find(u => u.id === research.universityId)?.name}</p>
                </div>
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><GraduationCap size={14}/> Academic Level</h3>
                  <p className="font-bold text-gray-900">{research.degreeLevel} • {research.year}</p>
                </div>
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Bookmark size={14}/> Discipline & Course</h3>
                  <p className="font-bold text-gray-900">{DEPARTMENTS.find(d => d.id === research.discipline)?.name || 'General'}</p>
                  <p className="text-xs text-blue-600 font-bold mt-1 uppercase tracking-tight">{research.course || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><UserIcon size={14}/> Author(s)</h3>
                  <p className="font-bold text-gray-900">{author?.name} (Primary)</p>
                  {research.coAuthors.length > 0 && <p className="text-xs text-gray-500 font-medium mt-1">{research.coAuthors.join(', ')}</p>}
                </div>
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><CheckCircle size={14}/> Supervisor</h3>
                  <p className="font-bold text-gray-900">{supervisor?.name}</p>
                </div>
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Globe size={14}/> License</h3>
                  <p className="font-bold text-blue-600">{LICENSES.find(l => l.id === research.license)?.name}</p>
                </div>
             </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8"><History size={20} className="text-blue-600" /><h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Audit Trail & Logs</h2></div>
            <div className="space-y-8">
              {audit.map((log) => (
                <div key={log.id} className="relative pl-10 before:absolute before:left-[11px] before:top-2 before:bottom-[-30px] before:w-[2px] before:bg-gray-100 last:before:hidden">
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-lg bg-white border-2 flex items-center justify-center z-10 transition-all ${log.emailSent ? 'border-green-200 bg-green-50 shadow-sm shadow-green-100' : 'border-gray-200'}`}><div className={`w-2 h-2 rounded-full ${log.emailSent ? 'bg-green-500' : 'bg-gray-300'}`}></div></div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-black text-gray-900 text-[10px] uppercase tracking-tight">{log.action}</p>
                      <span className="text-[10px] text-gray-400 font-mono font-bold">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">by <span className="font-bold text-blue-600">{log.userName}</span></p>
                    {log.comments && <div className="mt-3 bg-gray-50 p-4 rounded-2xl text-xs text-gray-600 italic border border-gray-100 leading-relaxed shadow-inner">"{log.comments}"</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-blue-50/50 sticky top-24">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Workflow Control</h2>
            <div className="space-y-4">
              {isAuthor && (research.status === ResearchStatus.DRAFT || research.status === ResearchStatus.REVISIONS_REQUESTED) && (
                <>
                  <button 
                    onClick={openEdit}
                    className="w-full bg-white text-blue-600 border-2 border-blue-600 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-50 transition-all"
                  >
                    <Edit size={18} /> Edit Submission
                  </button>
                  <button 
                    onClick={() => updateStatus(ResearchStatus.SUBMITTED, research.status === ResearchStatus.REVISIONS_REQUESTED ? 'Author resubmitted research' : 'Author submitted research')} 
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    <Send size={18} /> {research.status === ResearchStatus.REVISIONS_REQUESTED ? 'Resubmit for Review' : 'Submit for Review'}
                  </button>
                </>
              )}

              {isSupervisor && research.status === ResearchStatus.SUBMITTED && (
                <button onClick={() => updateStatus(ResearchStatus.UNDER_REVIEW, 'Supervisor initiated review')} className="w-full bg-yellow-500 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-100">
                  <FileText size={18} /> Initiate Review
                </button>
              )}

              {isSupervisor && research.status === ResearchStatus.UNDER_REVIEW && (
                <>
                  <textarea className="w-full p-4 border border-gray-200 rounded-2xl text-sm bg-gray-50 focus:bg-white outline-none transition-all resize-none shadow-inner" placeholder="Provide feedback for author..." value={comment} onChange={(e) => setComment(e.target.value)} rows={4} />
                  <div className="flex flex-col gap-3">
                    <button onClick={() => updateStatus(ResearchStatus.APPROVED, 'Supervisor approved submission')} className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-100"><CheckCircle size={18} /> Approve Validation</button>
                    <button onClick={() => updateStatus(ResearchStatus.REVISIONS_REQUESTED, 'Supervisor requested revisions')} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"><RotateCcw size={18} /> Request Revisions</button>
                  </div>
                </>
              )}

              {isPublisher && research.status === ResearchStatus.APPROVED && (
                <button onClick={() => updateStatus(ResearchStatus.PUBLISHED, 'Publisher published research')} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                  <Globe size={18} /> Publish to Archive
                </button>
              )}

              {research.pdfUrl && (
                <div className="mt-10 pt-10 border-t border-gray-100">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Official Submission File</h3>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center gap-4 group hover:bg-blue-50 transition-all">
                    <div className="bg-white p-3 rounded-xl shadow-sm"><FileText className="text-red-500" size={28} /></div>
                    <div className="flex-grow overflow-hidden">
                      <p className="text-xs font-black text-gray-900 truncate">
                        Document.pdf
                      </p>
                    </div>
                    <a 
                      href={research.pdfUrl} 
                      download={`${research.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 text-blue-600 bg-white hover:bg-blue-600 hover:text-white rounded-xl shadow-sm transition-all"
                    >
                      <Download size={20} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-hidden">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-white">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Edit Submission</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white">
              <form id="edit-form" onSubmit={handleEditSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Title</label>
                  <input type="text" required value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium shadow-sm hover:border-gray-300" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Abstract</label>
                  <textarea required rows={5} value={editAbstract} onChange={e => setEditAbstract(e.target.value)} className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium shadow-sm hover:border-gray-300" />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Discipline</label>
                    <select value={editDiscipline} onChange={e => setEditDiscipline(e.target.value)} className="w-full px-5 py-4 border border-gray-200 rounded-2xl bg-white font-bold text-sm shadow-sm hover:border-gray-300 cursor-pointer">
                      {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Course</label>
                    <input type="text" required value={editCourse} onChange={e => setEditCourse(e.target.value)} className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none bg-white font-medium shadow-sm hover:border-gray-300" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Degree</label>
                    <select value={editDegree} onChange={e => setEditDegree(e.target.value as DegreeLevel)} className="w-full px-5 py-4 border border-gray-200 rounded-2xl bg-white font-bold text-sm shadow-sm hover:border-gray-300 cursor-pointer">
                      {DEGREE_LEVELS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Year</label>
                    <input type="number" value={editYear} onChange={e => setEditYear(parseInt(e.target.value))} className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none bg-white font-medium shadow-sm hover:border-gray-300" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Project Supervisor</label>
                  <select 
                    value={editSupervisorId} 
                    onChange={e => setEditSupervisorId(e.target.value)} 
                    className="w-full px-5 py-4 border border-gray-200 rounded-2xl bg-white font-bold text-sm shadow-sm hover:border-gray-300 cursor-pointer"
                  >
                    {allSupervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    {allSupervisors.length === 0 && <option value="">No supervisors found for your university</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">License</label>
                  <select value={editLicense} onChange={e => setEditLicense(e.target.value)} className="w-full px-5 py-4 border border-gray-200 rounded-2xl bg-white font-bold text-sm shadow-sm hover:border-gray-300 cursor-pointer">
                    {LICENSES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Replace PDF (Optional)</label>
                  <div onClick={() => !isUploading && fileInputRef.current?.click()} className="border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all bg-white">
                    <input type="file" ref={fileInputRef} onChange={e => setEditFile(e.target.files?.[0] || null)} className="hidden" accept=".pdf" disabled={isUploading} />
                    {editFile ? (
                      <div className="text-center">
                        <File className="mx-auto text-green-500 mb-3" size={36} />
                        <p className="text-sm font-black">{editFile.name}</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto text-gray-300 mb-3" size={36} />
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Click to upload new PDF</p>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
            <div className="px-10 py-8 border-t border-gray-100 bg-white flex gap-4">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-black text-sm text-gray-500 shadow-sm">Cancel</button>
              <button form="edit-form" type="submit" disabled={isUploading} className="flex-1 py-4 bg-[#00A3DD] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20">
                {isUploading ? <Loader2 className="animate-spin" size={20} /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchDetail;
