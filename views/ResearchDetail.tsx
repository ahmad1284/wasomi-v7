
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Research, User, ResearchStatus, AuditLog, UserRole, DegreeLevel, University, AISuggestion } from '../types';
import { getStore, saveStore, createAuditEntry, uploadFileToSupabase, createNotification, notifyRole, deleteResearch, sendEmailNotification } from '../store';
import { GoogleGenAI, Type } from "@google/genai";
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
  Bookmark,
  Users,
  Sparkles,
  Zap,
  CheckCircle2,
  Trash2,
  EyeOff,
  ShieldAlert,
  Wand2,
  Languages,
  CheckSquare,
  ChevronRight,
  ShieldX,
  Lock,
  ExternalLink
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [refiningSuggestion, setRefiningSuggestion] = useState<AISuggestion | null>(null);
  const [refinedMessage, setRefinedMessage] = useState('');
  const [isRefiningAI, setIsRefiningAI] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editAbstract, setEditAbstract] = useState('');
  const [editDiscipline, setEditDiscipline] = useState(DEPARTMENTS[0].id);
  const [editCourse, setEditCourse] = useState('');
  const [editDegree, setEditDegree] = useState<string>('');
  const [editYear, setEditYear] = useState(new Date().getFullYear());
  const [editSupervisorId, setEditSupervisorId] = useState('');
  const [editCoAuthors, setEditCoAuthors] = useState('');
  const [editLicense, setEditLicense] = useState(LICENSES[0].id);
  const [editFile, setEditFile] = useState<File | null>(null);
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

  if (!research) return <div className="p-10 text-center font-bold text-gray-500">Research not found.</div>;

  const isAuthor = research.primaryAuthorId === user.id;
  const isSupervisor = user.id === research.supervisorId;
  const isPublisher = user.role === UserRole.PUBLISHER;
  const isAdmin = user.role === UserRole.ADMIN;
  
  // Guard: Students can only view their own research unless it's published
  if (user.role === UserRole.STUDENT && !isAuthor && research.status !== ResearchStatus.PUBLISHED) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-gray-100 p-20 text-center shadow-sm max-w-2xl mx-auto mt-10">
        <Lock size={64} className="mx-auto text-red-100 mb-6" />
        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Access Restricted</h3>
        <p className="text-gray-500 mt-2 font-medium mb-8">You do not have institutional authorization to view this internal research record.</p>
        <Link to="/dashboard" className="bg-[#00A3DD] text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all">Back to Dashboard</Link>
      </div>
    );
  }

  const runImpactAnalysis = async () => {
    if (!research) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analyze this research: "${research.title}". Abstract: "${research.abstract}". Suggest 3 stakeholders in Zanzibar/Tanzania.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                orgName: { type: Type.STRING },
                sector: { type: Type.STRING, enum: ['Public', 'Private', 'NGO'] },
                reasoning: { type: Type.STRING },
                emailTemplate: { type: Type.STRING }
              },
              required: ['orgName', 'sector', 'reasoning', 'emailTemplate']
            }
          }
        }
      });

      const suggestions: AISuggestion[] = JSON.parse(response.text);
      const { research: allResearch } = getStore();
      const updated = allResearch.map(r => r.id === research.id ? { ...r, aiSuggestions: suggestions } : r);
      saveStore({ research: updated });
      setResearch({ ...research, aiSuggestions: suggestions });
      await createAuditEntry(research.id, user.id, user.name, 'Generated AI Impact Roadmap', research.status, research.status);
    } catch (e) { console.error(e); } finally { setIsAnalyzing(false); }
  };

  const handleRefineAI = async (mode: 'formal' | 'short' | 'kiswahili') => {
    if (!refiningSuggestion || !research) return;
    setIsRefiningAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const instructions = {
        formal: "Make this email much more formal for a high-ranking government official.",
        short: "Condense this email into a short 3-sentence brief.",
        kiswahili: "Translate this entire email into professional Swahili (Kiswahili)."
      };
      const prompt = `Research: ${research.title}. \n\nExisting Message: ${refinedMessage}\n\nTask: ${instructions[mode]}`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setRefinedMessage(response.text || refinedMessage);
    } catch (e) { console.error(e); } finally { setIsRefiningAI(false); }
  };

  const recordOutreach = async () => {
    if (!research || !refiningSuggestion) return;
    await createAuditEntry(research.id, user.id, user.name, `Sent impact outreach to ${refiningSuggestion.orgName}`, research.status, research.status, `Message used: "${refinedMessage.slice(0, 100)}..."`);
    const mailto = `mailto:?subject=Strategic Briefing: ${research.title}&body=${encodeURIComponent(refinedMessage)}`;
    window.location.href = mailto;
    setRefiningSuggestion(null);
  };

  const updateStatus = async (newStatus: ResearchStatus, action: string) => {
    if (!research) return;
    const { research: allResearch } = getStore();
    
    const generatedUrn = (newStatus === ResearchStatus.PUBLISHED && !research.urn) 
      ? `urn:wasomi:research:${research.id}` 
      : research.urn;
    
    const updated = allResearch.map((r: Research) => 
      r.id === research.id ? { 
        ...r, 
        status: newStatus, 
        updatedAt: new Date().toISOString(),
        urn: generatedUrn
      } : r
    );
    
    saveStore({ research: updated });
    await createAuditEntry(research.id, user.id, user.name, action, research.status, newStatus, comment);

    const researchLink = `/dashboard/research/${research.id}`;
    
    // Notifications for platform UI
    if (author && author.id !== user.id) {
        createNotification(author.id, `Submission Updated: ${newStatus}`, `The status of your research "${research.title}" has been changed to ${newStatus}.`, newStatus === ResearchStatus.APPROVED ? 'success' : 'info', researchLink);
    }

    if (newStatus === ResearchStatus.SUBMITTED && supervisor) {
        createNotification(supervisor.id, "New Review Required", `A student has submitted research for your validation: "${research.title}"`, 'info', researchLink);
    }

    if (newStatus === ResearchStatus.APPROVED) {
        notifyRole(UserRole.PUBLISHER, "Ready for Publication", `Research "${research.title}" is validated and ready for the global archive.`, 'success', researchLink);
    }

    // MULTI-PARTY SCHOLARLY EMAIL DISSEMINATION
    if (newStatus === ResearchStatus.PUBLISHED) {
      const baseUrl = window.location.origin + window.location.pathname;
      const publicLink = `${baseUrl}#/research/${research.id}`;
      const uniName = universities.find(u => u.id === research.universityId)?.name || 'Wasomi Institutional Network';

      // 1. Researcher Confirmation
      if (author) {
        sendEmailNotification(
          author.email,
          "🎉 Academic Publication Confirmed",
          `Hello ${author.name},\n\nYour work "${research.title}" has been officially published and assigned a permanent identifier in the Wasomi Scholars Archive.\n\nPermanent URN: ${generatedUrn}\nPersistent Link: ${publicLink}\n\nYour contribution is now part of Zanzibar's permanent intellectual heritage.\n\nWasomi Scholars Project`
        );
      }

      // 2. Supervisor Confirmation
      if (supervisor) {
        sendEmailNotification(
          supervisor.email,
          "Verified Research Published",
          `Dr. ${supervisor.name},\n\nThe research submission you validated for ${author?.name || 'Researcher'} ("${research.title}") is now publicly archived.\n\nInstitutional Record: ${uniName}\nURN: ${generatedUrn}\nAccess: ${publicLink}\n\nThank you for ensuring academic transparency.`
        );
      }

      // 3. Impact Stakeholder Outreach (Policy Linkage)
      if (research.impactTarget?.email) {
        sendEmailNotification(
          research.impactTarget.email,
          "Strategic Scholarly Briefing for Your Department",
          `Dear ${research.impactTarget.personName || 'Stakeholder'},\n\nWe are pleased to inform you that a verified academic study relevant to ${research.impactTarget.department || 'your sector'} has been published in the Wasomi Scholars Archive.\n\nTitle: ${research.title}\nResearcher: ${author?.name || 'Scholar'} (${uniName})\nURN: ${generatedUrn}\nFull Manuscript: ${publicLink}\n\nThis research was identified as having potential policy or operational value for your department.`
        );
      }
    }
    
    const newR = updated.find((r: Research) => r.id === research.id);
    if (newR) {
      setResearch(newR);
      setComment('');
      const { audit: allAudit } = getStore();
      setAudit(allAudit.filter((a: AuditLog) => a.researchId === research.id));
    }
  };

  const confirmDelete = () => {
    if (!research) return;
    const success = deleteResearch(research.id, user);
    if (success) {
      navigate('/dashboard');
    } else {
      alert("Unauthorized deletion attempt.");
      setIsDeleteModalOpen(false);
    }
  };

  const openEdit = () => {
    if (!research) return;
    setEditTitle(research.title);
    setEditAbstract(research.abstract);
    setEditDiscipline(research.discipline || DEPARTMENTS[0].id);
    setEditCourse(research.course || '');
    setEditDegree(research.degreeLevel);
    setEditYear(research.year);
    setEditSupervisorId(research.supervisorId);
    setEditCoAuthors(research.coAuthors.join(', '));
    setEditLicense(research.license || LICENSES[0].id);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!research) return;
    setIsUploading(true);
    try {
      let finalPdfUrl = research.pdfUrl || '';
      if (editFile && research.status !== ResearchStatus.PUBLISHED) {
        finalPdfUrl = await uploadFileToSupabase(editFile, `${user.id}/${research.id}-${editFile.name}`) || URL.createObjectURL(editFile);
      }
      const { research: allResearch } = getStore();
      const updatedResearch: Research = {
        ...research,
        title: editTitle, abstract: editAbstract, discipline: editDiscipline, course: editCourse, degreeLevel: editDegree, year: editYear, supervisorId: editSupervisorId, coAuthors: editCoAuthors ? editCoAuthors.split(',').map(s => s.trim()) : [], license: editLicense, pdfUrl: finalPdfUrl, updatedAt: new Date().toISOString()
      };
      const newAllResearch = allResearch.map(r => r.id === research.id ? updatedResearch : r);
      saveStore({ research: newAllResearch });
      await createAuditEntry(research.id, user.id, user.name, 'Metadata updated', research.status, research.status);
      setResearch(updatedResearch);
      setIsEditModalOpen(false);
    } catch (err) { console.error(err); } finally { setIsUploading(false); setEditFile(null); }
  };

  const hasReviewAuthority = isSupervisor || isAdmin || isPublisher;
  const isFinalized = research.status === ResearchStatus.PUBLISHED || research.status === ResearchStatus.APPROVED;
  const canStudentEdit = isAuthor && (research.status === ResearchStatus.DRAFT || research.status === ResearchStatus.REVISIONS_REQUESTED);
  const canPublisherEdit = (isPublisher || isAdmin) && !isFinalized;
  
  // High-reliability permission check for delete button
  const canDelete = (isAuthor && (research.status === ResearchStatus.DRAFT || research.status === ResearchStatus.SUBMITTED)) || (isAdmin && research.status !== ResearchStatus.PUBLISHED && research.status !== ResearchStatus.DELETED);

  const getStatusBadge = (status: ResearchStatus) => {
    const styles: Record<ResearchStatus, string> = {
      [ResearchStatus.DRAFT]: 'bg-white text-gray-700 border-gray-200',
      [ResearchStatus.SUBMITTED]: 'bg-blue-50 text-blue-700 border-blue-200',
      [ResearchStatus.UNDER_REVIEW]: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      [ResearchStatus.REVISIONS_REQUESTED]: 'bg-orange-50 text-orange-700 border-orange-200',
      [ResearchStatus.APPROVED]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      [ResearchStatus.PUBLISHED]: 'bg-green-50 text-green-700 border-green-200',
      [ResearchStatus.WITHDRAWN]: 'bg-gray-100 text-gray-600 border-gray-200',
      [ResearchStatus.REJECTED_FINAL]: 'bg-red-50 text-red-700 border-red-200',
      [ResearchStatus.DELETED]: 'bg-black text-white border-black',
    };
    return <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${styles[status]}`}>{status}</span>;
  };

  const dynamicPublicUrl = `${window.location.origin}${window.location.pathname}#/research/${research.id}`;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-white bg-gray-100 rounded-xl text-gray-500 shadow-sm border border-gray-100"><ArrowLeft size={20} /></button>
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-1"><h1 className="text-2xl font-black text-gray-900 leading-tight tracking-tight">{research.title}</h1>{getStatusBadge(research.status)}</div>
          <div className="flex items-center gap-4">
            <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5"><Clock size={14} className="text-gray-400" /> Submitted {new Date(research.createdAt).toLocaleDateString()}</p>
            {research.urn && (
              <Link 
                to={`/research/${research.id}`} 
                className="text-[9px] font-mono text-blue-600 font-black underline decoration-blue-200 underline-offset-4 hover:text-blue-800 transition-all flex items-center gap-1"
              >
                URN: {research.urn} <ExternalLink size={10} />
              </Link>
            )}
          </div>
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
                <div><h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Building size={14}/> Institution</h3><p className="font-bold text-gray-900">{universities.find(u => u.id === research.universityId)?.name || 'Central Archive'}</p></div>
                <div><h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><GraduationCap size={14}/> Academic Level</h3><p className="font-bold text-gray-900">{research.degreeLevel} • {research.year}</p></div>
                <div><h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Bookmark size={14}/> Discipline & Course</h3><p className="font-bold text-gray-900">{DEPARTMENTS.find(d => d.id === research.discipline)?.name || 'General'}</p><p className="text-xs text-blue-600 font-bold mt-1 uppercase tracking-tight">{research.course || 'N/A'}</p></div>
                <div><h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><UserIcon size={14}/> Author(s)</h3><p className="font-bold text-gray-900">{author?.name || 'Researcher'} (Primary Author)</p>{research.coAuthors?.length > 0 && <p className="text-xs text-gray-500 font-medium mt-1">{research.coAuthors.join(', ')}</p>}</div>
                <div><h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><CheckCircle2 size={14}/> Supervisor</h3><p className="font-bold text-gray-900">{supervisor?.name || 'Unassigned'}</p></div>
                <div><h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Globe size={14}/> License</h3><p className="font-bold text-blue-600">{LICENSES.find(l => l.id === research.license)?.name || 'Standard License'}</p></div>
             </div>
          </section>

          {(isAdmin || isPublisher) && (
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4"><div className="flex items-center gap-2"><Sparkles className="text-indigo-500" size={20} /><h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Regional Impact discovery</h2></div>{!research.aiSuggestions && (<button onClick={runImpactAnalysis} disabled={isAnalyzing} className="bg-[#0a192f] text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-blue-950">{isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />} Analyze Stakeholders</button>)}</div>
              {isAnalyzing ? (<div className="py-10 text-center space-y-3"><Loader2 className="animate-spin mx-auto text-indigo-500" size={32} /><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Scanning Zanzibari frameworks...</p></div>) : research.aiSuggestions ? (<div className="grid grid-cols-1 gap-4">{research.aiSuggestions.map((s, idx) => (<div key={idx} className="p-6 bg-white rounded-2xl border border-gray-100 group transition-all hover:border-indigo-200 hover:shadow-md"><div className="flex justify-between items-start mb-3"><div><span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase">{s.sector}</span><h4 className="font-black text-gray-900 mt-1">{s.orgName}</h4></div><button onClick={() => { setRefiningSuggestion(s); setRefinedMessage(s.emailTemplate); }} className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 border border-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm">Refine & Outreach <ChevronRight size={14} /></button></div><p className="text-xs text-gray-500 font-medium leading-relaxed">{s.reasoning}</p></div>))}</div>) : (<p className="text-sm text-gray-400 italic">No discovery data generated.</p>)}
            </section>
          )}

          <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-10"><History size={20} className="text-blue-600" /><h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Archival Ledger & Audit Trail</h2></div>
            <div className="space-y-4">
              {audit.length > 0 ? audit.map((log, idx) => (
                <div key={log.id} className="flex gap-6">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-8 h-8 rounded-xl bg-white border-2 flex items-center justify-center z-10 ${log.emailSent ? 'border-green-200' : 'border-blue-100'}`}><div className={`w-2 h-2 rounded-full ${log.emailSent ? 'bg-green-500 animate-pulse' : 'bg-blue-300'}`}></div></div>
                    {idx !== audit.length - 1 && (<div className="w-0.5 grow bg-blue-50 my-2"></div>)}
                  </div>
                  <div className="pb-8 flex-grow">
                    <div className="flex justify-between items-center mb-1.5"><p className="font-black text-gray-900 text-[11px] uppercase tracking-tight">{log.action}</p><span className="text-[10px] text-gray-400 font-mono font-bold">{new Date(log.timestamp).toLocaleString()}</span></div>
                    <p className="text-xs text-gray-500 font-medium">Verified by <span className="font-black text-blue-600 uppercase tracking-tighter text-[10px]">{log.userName}</span></p>
                    {log.comments && <div className="mt-4 bg-gray-50/50 p-5 rounded-2xl text-xs text-gray-600 font-medium italic border border-gray-100 shadow-sm">"{log.comments}"</div>}
                  </div>
                </div>
              )) : (<p className="text-sm text-gray-400 italic text-center py-4">No archival logs recorded.</p>)}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl sticky top-24">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Workflow Control Panel</h2>
            <div className="space-y-4">
              {research.status !== ResearchStatus.DRAFT && (isAdmin || isPublisher) && !isSupervisor && (<div className="p-3 bg-orange-50 border border-orange-100 rounded-xl flex gap-2 items-start mb-2"><ShieldAlert size={16} className="text-orange-600 shrink-0 mt-0.5" /><p className="text-[10px] font-bold text-orange-800 leading-tight">Administrative Intervention: You have override authority.</p></div>)}
              
              {canDelete && (
                <button 
                  onClick={() => setIsDeleteModalOpen(true)} 
                  className="w-full bg-white text-red-500 border-2 border-red-500 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-all mb-2 shadow-sm"
                >
                  <Trash2 size={18} />
                  Delete Submission
                </button>
              )}

              {(canStudentEdit || canPublisherEdit) && (
                <button onClick={openEdit} className="w-full bg-white text-blue-600 border-2 border-blue-600 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-50 transition-all">
                  <Edit size={18} /> Edit Metadata
                </button>
              )}

              {canStudentEdit && (
                <button onClick={() => updateStatus(ResearchStatus.SUBMITTED, 'Author submitted research for review')} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100">
                  <Send size={18} /> Submit for Review
                </button>
              )}

              {hasReviewAuthority && research.status === ResearchStatus.SUBMITTED && (
                <button onClick={() => updateStatus(ResearchStatus.UNDER_REVIEW, 'Review initiated')} className="w-full bg-yellow-500 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-yellow-600 shadow-lg shadow-yellow-100">
                  <FileText size={18} /> Initiate Verification
                </button>
              )}

              {hasReviewAuthority && research.status === ResearchStatus.UNDER_REVIEW && (
                <>
                  <textarea className="w-full p-4 border border-gray-200 rounded-2xl text-sm outline-none shadow-sm focus:ring-2 focus:ring-blue-500" placeholder="Reviewer comments..." value={comment} onChange={(e) => setComment(e.target.value)} rows={4} />
                  <div className="flex flex-col gap-3">
                    <button onClick={() => updateStatus(ResearchStatus.APPROVED, 'Approved')} className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-green-700"><CheckCircle size={18} /> Approve Validation</button>
                    <button onClick={() => updateStatus(ResearchStatus.REVISIONS_REQUESTED, 'Revisions requested')} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-orange-600"><RotateCcw size={18} /> Request Revisions</button>
                    <button onClick={() => updateStatus(ResearchStatus.REJECTED_FINAL, 'Rejected finally')} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-red-700"><XCircle size={18} /> Reject Finally</button>
                  </div>
                </>
              )}

              {(isPublisher || isAdmin) && (research.status === ResearchStatus.APPROVED || research.status === ResearchStatus.WITHDRAWN) && (
                <button onClick={() => updateStatus(ResearchStatus.PUBLISHED, research.status === ResearchStatus.WITHDRAWN ? 'Re-published' : 'Published')} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                  <Globe size={18} /> {research.status === ResearchStatus.WITHDRAWN ? 'Re-publish' : 'Publish to Archive'}
                </button>
              )}

              {(isPublisher || isAdmin) && research.status === ResearchStatus.PUBLISHED && (
                <button onClick={() => updateStatus(ResearchStatus.WITHDRAWN, 'Unpublished')} className="w-full bg-white text-red-600 border-2 border-red-600 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-all">
                  <EyeOff size={18} /> Unpublish (Withdraw)
                </button>
              )}

              <div className="mt-10 pt-10 border-t border-gray-100">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Official Submission File</h3>
                <div className="p-4 bg-white rounded-2xl border border-gray-200 flex items-center gap-4 group hover:border-blue-200 transition-all">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                    <FileText className="text-red-500" size={28} />
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <p className="text-xs font-black text-gray-900 truncate">Manuscript.pdf</p>
                  </div>
                  {research.pdfUrl ? (
                    <a href={research.pdfUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 text-blue-600 bg-white hover:bg-blue-600 hover:text-white rounded-xl shadow-sm border border-gray-100">
                      <Download size={20} />
                    </a>
                  ) : (
                    <span className="text-[9px] font-black text-gray-300 uppercase">No File</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-10 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-100">
                 <AlertTriangle size={40} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Confirm Deletion</h2>
              <p className="text-gray-500 font-medium leading-relaxed mb-8">
                Are you sure you want to delete this research submission? This action is irreversible.
              </p>
              <div className="flex flex-col gap-3">
                 <button onClick={confirmDelete} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm hover:bg-red-700 shadow-xl shadow-red-500/20">Permanently Delete</button>
                 <button onClick={() => setIsDeleteModalOpen(false)} className="w-full py-4 bg-white text-gray-500 border border-gray-200 rounded-2xl font-black text-sm hover:bg-gray-50">Cancel</button>
              </div>
           </div>
        </div>
      )}

      {refiningSuggestion && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[3rem] w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0"><div className="flex items-center gap-3"><div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100"><Mail size={20}/></div><div><h2 className="text-xl font-black text-gray-900 tracking-tight">Refine Outreach Strategy</h2><p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Target: {refiningSuggestion.orgName}</p></div></div><button onClick={() => setRefiningSuggestion(null)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all"><X size={24} /></button></div>
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white"><div className="grid grid-cols-1 md:grid-cols-4 gap-8"><div className="md:col-span-3 space-y-6"><div className="space-y-2"><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Stakeholder Message</label><textarea className="w-full p-6 bg-white border border-gray-200 rounded-3xl text-sm font-medium text-gray-700 min-h-[350px] outline-none" value={refinedMessage} onChange={(e) => setRefinedMessage(e.target.value)} /></div></div><div className="space-y-4"><h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">AI Quality Tools</h3>{[{ id: 'formal', label: 'More Formal', icon: <Building size={14}/> }, { id: 'short', label: 'Summarize', icon: <Wand2 size={14}/> }, { id: 'kiswahili', label: 'Translate (SW)', icon: <Languages size={14}/> }].map(tool => (<button key={tool.id} disabled={isRefiningAI} onClick={() => handleRefineAI(tool.id as any)} className="w-full flex items-center gap-2 px-4 py-3 bg-white border border-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50">{isRefiningAI ? <Loader2 size={14} className="animate-spin" /> : tool.icon}{tool.label}</button>))}<div className="mt-8 p-4 bg-orange-50 border border-orange-100 rounded-2xl"><p className="text-[10px] font-bold text-orange-800 leading-tight">Verification required. Ensure tone matches guidelines.</p></div></div></div></div>
              <div className="px-10 py-8 border-t border-gray-100 bg-white flex gap-4 shrink-0"><button onClick={() => setRefiningSuggestion(null)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-black text-sm text-gray-500">Cancel</button><button onClick={recordOutreach} className="flex-2 px-10 py-4 bg-[#0a192f] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-900 shadow-xl shadow-indigo-500/20"><CheckSquare size={18} /> Confirm Outreach & Launch</button></div>
           </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Edit Metadata</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-full transition-all"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 bg-white custom-scrollbar"><form id="edit-form" onSubmit={handleEditSubmit} className="space-y-6"><div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Title</label><input type="text" required value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none" /></div><div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Abstract</label><textarea required rows={5} value={editAbstract} onChange={e => setEditAbstract(e.target.value)} className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none" /></div><div className="grid grid-cols-2 gap-5"><div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Discipline</label><select value={editDiscipline} onChange={e => setEditDiscipline(e.target.value)} className="w-full px-5 py-4 border border-gray-200 rounded-2xl font-bold text-sm">{DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div><div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Course</label><input type="text" required value={editCourse} onChange={e => setEditCourse(e.target.value)} className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none" /></div></div><div className="grid grid-cols-2 gap-5"><div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Degree Level</label><select value={editDegree} onChange={e => setEditDegree(e.target.value)} className="w-full px-5 py-4 border border-gray-200 rounded-2xl font-bold text-sm">{DEGREE_LEVELS.map(d => <option key={d} value={d}>{d}</option>)}</select></div><div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Year</label><input type="number" value={editYear} onChange={e => setEditYear(parseInt(e.target.value))} className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none" /></div></div>{!isFinalized && (<div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Replace PDF (Optional)</label><div onClick={() => !isUploading && fileInputRef.current?.click()} className="border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center cursor-pointer bg-white border-gray-200"><input type="file" ref={fileInputRef} onChange={e => setEditFile(e.target.files?.[0] || null)} className="hidden" accept=".pdf" /><Upload className="mx-auto text-gray-300 mb-3" size={36} /><p className="text-sm font-black text-gray-700">{editFile ? editFile.name : 'Upload PDF'}</p></div></div>)}</form></div>
            <div className="px-10 py-8 border-t border-gray-100 bg-white flex gap-4 shrink-0"><button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-black text-sm text-gray-500">Cancel</button><button form="edit-form" type="submit" disabled={isUploading} className="flex-1 py-4 bg-[#00A3DD] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20">{isUploading ? <Loader2 className="animate-spin" size={20} /> : 'Save Changes'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchDetail;
