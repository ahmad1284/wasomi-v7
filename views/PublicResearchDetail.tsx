
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Research, User, ResearchStatus, University } from '../types';
import { getStore } from '../store';
import {
  ArrowLeft,
  Download,
  FileText,
  ShieldCheck,
  Building,
  GraduationCap,
  User as UserIcon,
  Globe,
  Bookmark,
  Calendar,
  Search,
  Lock,
  Copy,
  Check,
  Quote,
  Share2,
  ExternalLink
} from 'lucide-react';
import { DEPARTMENTS, LICENSES } from '../constants';

const PublicResearchDetail: React.FC<{ user: User | null }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const [research, setResearch] = useState<Research | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [author, setAuthor] = useState<User | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [copiedUrn, setCopiedUrn] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { research: allResearch, universities: allUnis, users } = getStore();
    setUniversities(allUnis);
    const r = allResearch.find((res: Research) => res.id === id);
    if (r) {
      if (r.status !== ResearchStatus.PUBLISHED && !user) {
        setIsLocked(true);
      } else {
        setResearch(r);
        setAuthor(users.find((u: User) => u.id === r.primaryAuthorId));
      }
    }
  }, [id, user]);

  if (isLocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400 mx-auto mb-6"><Lock size={40} /></div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Restricted Access</h1>
          <p className="text-gray-500 font-medium mb-8">This research is currently in the validation pipeline and is not yet available to the general public.</p>
          <Link to="/auth" className="bg-[#00A3DD] text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-600 transition-all">Log In to Access</Link>
          <button onClick={() => navigate('/')} className="block w-full mt-4 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-blue-500 transition-colors">Return to Homepage</button>
        </div>
      </div>
    );
  }

  if (!research) return <div className="p-20 text-center font-bold text-gray-500">Research record not found.</div>;

  const citationAPA = `${author?.name || 'Scholar'}. (${research.year}). ${research.title}. Wasomi Scholars Network. ${research.urn}`;

  const copyToClipboard = (text: string, setFn: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  const dynamicPublicUrl = `${window.location.origin}${window.location.pathname}#/research/${research.id}`;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-inter">
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-[100]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex flex-col">
              <div className="flex items-center gap-1.5"><span className="text-2xl font-black text-blue-950 tracking-tighter">Was</span><Search className="text-blue-500 mb-0.5" size={24} strokeWidth={4} /><span className="text-2xl font-black text-blue-950 tracking-tighter ml-[-4px]">mi</span></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] ml-0.5 mt-[-4px]">Scholars</span>
            </Link>
            <div className="flex gap-4 items-center">
              <Link to="/" className="text-sm font-bold text-gray-600 hover:text-blue-500 transition-colors">Home</Link>
              {user ? <Link to="/dashboard" className="bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-xl shadow-blue-200">Dashboard</Link> : <Link to="/auth" className="bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-xl shadow-blue-200">Submit Research</Link>}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-blue-500 transition-colors mb-8"><ArrowLeft size={16} /> Back to Search</button>

        <div className="space-y-12">
          <header>
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="bg-blue-50 text-blue-700 text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-blue-100">{research.degreeLevel} • {research.year}</span>
              <span className="bg-green-50 text-green-700 text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-green-100 flex items-center gap-1.5"><ShieldCheck size={12} /> Verified Publication</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight mb-6">{research.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-black">{research.primaryAuthorId.charAt(0)}</div>
              <div><p className="text-gray-900 font-bold">University Researcher</p><p className="text-xs uppercase tracking-widest font-black text-gray-400">{universities.find(u => u.id === research.universityId)?.name}</p></div>
            </div>
          </header>

          <section>
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Abstract</h2>
            <div className="prose prose-blue max-w-none"><p className="text-xl text-gray-700 leading-relaxed whitespace-pre-line">{research.abstract}</p></div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 border-y border-gray-100 py-10">
            <div className="space-y-6">
              <div><h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Building size={14} /> Institution</h3><p className="font-bold text-gray-900">{universities.find(u => u.id === research.universityId)?.name}</p></div>
              <div><h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Bookmark size={14} /> Discipline & Course</h3><p className="font-bold text-gray-900">{DEPARTMENTS.find(d => d.id === research.discipline)?.name || 'General'}</p><p className="text-xs text-blue-600 font-bold mt-1 uppercase tracking-tight">{research.course}</p></div>
            </div>
            <div className="space-y-6">
              <div><h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Calendar size={14} /> Published Date</h3><p className="font-bold text-gray-900">{new Date(research.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
              <div><h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Globe size={14} /> License</h3><p className="font-bold text-blue-600 underline cursor-pointer">{LICENSES.find(l => l.id === research.license)?.name}</p></div>
            </div>
          </section>

          {/* New Citation Section */}
          <section className="bg-gray-50 rounded-3xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Quote size={20} className="text-blue-500" /><h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Cite this Work (APA)</h3></div>
              <button
                onClick={() => copyToClipboard(citationAPA, setCopiedCitation)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${copiedCitation ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-white text-blue-600 border border-blue-100 shadow-sm hover:bg-blue-50'}`}
              >
                {copiedCitation ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Citation</>}
              </button>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-inner text-sm text-gray-600 font-medium leading-relaxed italic">{citationAPA}</div>
          </section>

          <section className="bg-blue-50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 border border-blue-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-blue-100 flex items-center justify-center text-red-500"><FileText size={32} /></div>
              <div>
                <h3 className="font-black text-lg text-gray-900">Research Document</h3>
                <p className="text-sm text-gray-500 font-medium">Standard Academic PDF Format</p>
                {research.urn && (
                  <div className="flex items-center gap-3 mt-2 group">
                    <a
                      href={dynamicPublicUrl}
                      className="text-[9px] font-mono text-blue-600 font-black underline decoration-blue-200 underline-offset-4 hover:text-blue-800 transition-all flex items-center gap-1"
                    >
                      URN: {research.urn} <ExternalLink size={10} />
                    </a>
                    <button onClick={() => copyToClipboard(research.urn!, setCopiedUrn)} className="p-1 hover:bg-blue-100 rounded text-blue-400 transition-all" title="Copy Identifier">
                      <Share2 size={10} />
                    </button>
                    {copiedUrn && <span className="text-[9px] text-green-600 font-black uppercase tracking-tighter animate-in fade-in slide-in-from-left-1">Copied!</span>}
                  </div>
                )}
              </div>
            </div>
            {research.pdfUrl ? (
              <a href={research.pdfUrl} target="_blank" rel="noopener noreferrer" className="w-full md:w-auto bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-xl shadow-blue-200"><Download size={20} /> Download PDF</a>
            ) : (
              <div className="w-full md:w-auto bg-gray-100 text-gray-400 px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-gray-200 uppercase tracking-widest italic">Document Unvailable</div>
            )}
          </section>
        </div>
      </main>

      <footer className="mt-20 border-t border-gray-100 py-12 text-center">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em]">Wasomi Scholars Permanent Archive • Zanzibar, Tanzania</p>
      </footer>
    </div>
  );
};

export default PublicResearchDetail;
