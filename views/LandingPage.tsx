
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Download, 
  ExternalLink, 
  BookOpen, 
  GraduationCap, 
  Archive, 
  TrendingUp, 
  Building2, 
  Globe2, 
  ArrowRight,
  Filter,
  FileText,
  ChevronRight,
  Stethoscope,
  Cpu,
  Waves,
  BarChart,
  Gavel,
  Users,
  Database,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  X
} from 'lucide-react';
import { getStore } from '../store';
import { Research, ResearchStatus, User, University } from '../types';
import { DEPARTMENTS } from '../constants';

const iconMap: Record<string, any> = {
  Stethoscope, BookOpen, Cpu, Waves, BarChart, Gavel, Users, Database
};

const LandingPage: React.FC<{ user: User | null }> = ({ user }) => {
  const [research, setResearch] = useState<Research[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [allPublishedCount, setAllPublishedCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('ALL');
  const [selectedDegree, setSelectedDegree] = useState('ALL');
  const [selectedDiscipline, setSelectedDiscipline] = useState('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const { research: allResearch, universities: allUnis } = getStore();
    const published = allResearch.filter((r: Research) => r.status === ResearchStatus.PUBLISHED);
    setResearch(published);
    setAllPublishedCount(published.length);
    setUniversities(allUnis);
  }, []);

  const handleDisciplineClick = (disciplineId: string) => {
    setSelectedDiscipline(disciplineId);
    setSearchQuery(''); 
    const element = document.getElementById('research-results');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedUniversity('ALL');
    setSelectedDegree('ALL');
    setSelectedDiscipline('ALL');
  };

  const filtered = research.filter(r => {
    const matchesQuery = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         r.abstract.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUni = selectedUniversity === 'ALL' || r.universityId === selectedUniversity;
    const matchesDegree = selectedDegree === 'ALL' || r.degreeLevel === selectedDegree;
    const matchesDiscipline = selectedDiscipline === 'ALL' || r.discipline === selectedDiscipline;
    return matchesQuery && matchesUni && matchesDegree && matchesDiscipline;
  });

  const activeFiltersCount = [
    selectedUniversity !== 'ALL',
    selectedDegree !== 'ALL',
    selectedDiscipline !== 'ALL',
    searchQuery !== ''
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-inter">
      {/* Navbar */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-[100]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black text-blue-950 tracking-tighter">Was</span>
                <Search className="text-blue-500 mb-0.5" size={24} strokeWidth={4} />
                <span className="text-2xl font-black text-blue-950 tracking-tighter ml-[-4px]">mi</span>
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] ml-0.5 mt-[-4px]">Scholars</span>
            </Link>
            
            <div className="hidden md:flex gap-8 items-center">
              <Link to="/" className="text-sm font-bold text-blue-500">Home</Link>
              <Link to="/about" className="text-sm font-bold text-gray-500 hover:text-blue-500 transition-colors">About</Link>
              <Link to="/contact" className="text-sm font-bold text-gray-500 hover:text-blue-500 transition-colors">Contact</Link>
            </div>

            <div className="flex gap-4 items-center">
              {user ? (
                <Link to="/dashboard" className="bg-white text-blue-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all border border-blue-100">Dashboard</Link>
              ) : (
                <>
                  <Link 
                    to="/auth" 
                    className="text-sm font-bold text-gray-600 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Log In
                  </Link>
                  <Link to="/auth" className="bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-xl shadow-blue-200 flex items-center gap-2">
                    Submit Research <ArrowRight size={16} />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modern Scholarly Hero */}
      <header className="relative bg-[#0a192f] overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent"></div>
          <div className="grid grid-cols-12 h-full w-full gap-4 p-8">
             {Array.from({length: 48}).map((_, i) => (
               <div key={i} className="border-[0.5px] border-blue-400/20 rounded-lg"></div>
             ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 px-4 py-2 rounded-full text-blue-300 text-[10px] font-black uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-2">
            <Globe2 size={14} /> Impactful Research Delivered to Decision-Makers
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight tracking-tight max-w-4xl mx-auto">
            The one-stop platform for all university theses in Zanzibar, <br/> <span className="text-blue-500">made accessible to everyone, facilitating impact, and ensuring research continuation.</span>
          </h1>
          <p className="text-xl text-blue-100/60 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            Youth Meaningful Participation in Decision-making for Inclusive Sustainable Development
          </p>

          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-3 bg-white p-2 rounded-2xl shadow-2xl shadow-black/40">
              <div className="flex-grow relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-4 rounded-xl focus:outline-none text-lg text-gray-900 placeholder:text-gray-400 bg-white"
                  placeholder="Search titles, abstracts, or authors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold transition-all border relative ${isFilterOpen ? 'bg-white border-blue-200 text-blue-500 shadow-inner' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'}`}
              >
                <Filter size={20} /> Filters
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-white shadow-sm font-black">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => document.getElementById('research-results')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-blue-500 text-white px-10 py-4 rounded-xl font-black hover:bg-blue-600 transition-all shadow-lg shadow-blue-900/40"
              >
                Explore
              </button>
            </div>

            {isFilterOpen && (
              <div className="mt-4 p-6 bg-white rounded-2xl shadow-xl border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-left">Discipline</label>
                  <select 
                    className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-sm"
                    value={selectedDiscipline}
                    onChange={(e) => setSelectedDiscipline(e.target.value)}
                  >
                    <option value="ALL">All Disciplines</option>
                    {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-left">Degree Level</label>
                  <select 
                    className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-sm"
                    value={selectedDegree}
                    onChange={(e) => setSelectedDegree(e.target.value)}
                  >
                    <option value="ALL">All Levels</option>
                    <option value="BSc">Bachelor's Degree</option>
                    <option value="MSc">Master's Degree</option>
                    <option value="PhD">Doctorate</option>
                    <option value="Diploma">Diploma</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-left">Institution</label>
                  <select 
                    className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-sm"
                    value={selectedUniversity}
                    onChange={(e) => setSelectedUniversity(e.target.value)}
                  >
                    <option value="ALL">All Universities</option>
                    {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
            )}
            
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-blue-200/40 text-[10px] font-black uppercase tracking-[0.2em]">
              {universities.map(u => (
                <div key={u.id} className="flex items-center gap-2">
                  <Building2 size={12} /> {u.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Platform Statistics */}
      <section className="bg-white border-y border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <p className="text-3xl font-black text-gray-900">{allPublishedCount}+</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Published Papers</p>
          </div>
          <div className="text-center border-l border-gray-200">
            <p className="text-3xl font-black text-gray-900">{universities.length}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Universities</p>
          </div>
          <div className="text-center border-l border-gray-200">
            <p className="text-3xl font-black text-gray-900">100%</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Verified Submissions</p>
          </div>
          <div className="text-center border-l border-gray-200">
            <p className="text-3xl font-black text-gray-900">2.4k</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Monthly Visits</p>
          </div>
        </div>
      </section>

      {/* Browse by Department */}
      <section id="browse" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Browse by Discipline</h2>
          <p className="text-gray-500 font-medium max-w-lg mx-auto">Explore scholarly work organized by institutional academic departments.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {DEPARTMENTS.map(dept => {
            const Icon = iconMap[dept.icon] || FileText;
            const isActive = selectedDiscipline === dept.id;
            return (
              <button 
                key={dept.id}
                onClick={() => handleDisciplineClick(dept.id)}
                className={`group p-8 rounded-3xl border transition-all text-left relative overflow-hidden ${
                  isActive 
                  ? 'border-blue-500 bg-blue-50/30 shadow-xl shadow-blue-100 ring-2 ring-blue-500/10' 
                  : 'border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 bg-white'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all mb-6 ${
                  isActive ? 'bg-blue-500 text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-400 group-hover:bg-blue-500 group-hover:text-white group-hover:border-transparent group-hover:shadow-lg'
                }`}>
                  <Icon size={28} />
                </div>
                <h3 className={`font-bold mb-1 transition-colors ${isActive ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-500'}`}>{dept.name}</h3>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-blue-400' : 'text-gray-400'}`}>Explore Collection</p>
                {isActive && (
                  <div className="absolute top-4 right-4 text-blue-500">
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Research Content */}
      <section id="research-results" className="bg-white py-24 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                <TrendingUp size={16} /> {selectedDiscipline === 'ALL' ? 'Latest Publications' : `${DEPARTMENTS.find(d => d.id === selectedDiscipline)?.name} Research`}
              </div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">Recent Scholarly Output</h2>
              <p className="text-gray-500 mt-2 font-medium">Permanently archived academic work validated by university staff.</p>
            </div>
            <div className="flex items-center gap-3">
              {activeFiltersCount > 0 && (
                <button 
                  onClick={handleResetFilters}
                  className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-4 py-2 rounded-lg border border-red-100 hover:bg-red-100 transition-colors flex items-center gap-1.5"
                >
                  <X size={12} strokeWidth={3} /> Clear Filters
                </button>
              )}
              <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest bg-white px-4 py-2 rounded-lg border border-gray-100">
                Showing {filtered.length} Validated Works
              </div>
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map(r => (
                <article key={r.id} className="group border border-gray-100 rounded-3xl p-8 hover:shadow-2xl hover:border-blue-100 transition-all bg-white flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <span className="bg-white text-blue-700 text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-blue-100">
                      {r.degreeLevel} • {r.year}
                    </span>
                    <div className="p-2 text-gray-300 group-hover:text-blue-500 transition-colors">
                      <Archive size={20} />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-blue-500 transition-colors">
                    {r.title}
                  </h3>
                  
                  <p className="text-gray-500 text-sm mb-8 line-clamp-3 flex-grow leading-relaxed font-medium">
                    {r.abstract}
                  </p>
                  
                  <div className="mt-auto pt-6 border-t border-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 font-black text-xs">
                          {r.primaryAuthorId.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">Verified Researcher</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                            {universities.find(u => u.id === r.universityId)?.shortName}
                          </p>
                        </div>
                      </div>
                      <Link 
                        to={`/research/${r.id}`} 
                        className="bg-blue-500 text-white p-2.5 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-600 transition-all"
                      >
                        <ChevronRight size={20} />
                      </Link>
                    </div>
                    
                    <Link 
                      to={`/research/${r.id}`}
                      className="flex items-center gap-2 text-[9px] font-mono text-blue-600 font-black underline decoration-blue-200 underline-offset-4 hover:text-blue-800 transition-all"
                    >
                      <ShieldCheck size={12} className="text-green-500 no-underline" />
                      <span className="truncate">URN: {r.urn}</span>
                      <ExternalLink size={10} className="no-underline" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
              <Archive size={64} className="mx-auto text-gray-300 mb-6" />
              <h3 className="text-2xl font-black text-gray-800">No matching research found</h3>
              <p className="text-gray-500 font-medium mt-2 max-w-sm mx-auto">Try adjusting your search filters or browse by institution to find specific academic works.</p>
              <button 
                onClick={handleResetFilters}
                className="mt-8 text-blue-500 font-black text-sm uppercase tracking-widest hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Institutional Network */}
      <section id="institutions" className="bg-white py-24 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4">Our Institutional Network</h2>
          <h3 className="text-3xl font-black text-gray-900 mb-12">Partnering for Academic Transparency</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {universities.map(u => (
              <div key={u.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center hover:shadow-xl hover:border-blue-100 transition-all">
                <div className="w-16 h-16 bg-white border border-gray-50 shadow-sm rounded-2xl flex items-center justify-center text-gray-300 mb-6">
                  <Building2 size={32} />
                </div>
                <h4 className="font-black text-sm text-gray-900 mb-1 text-center">{u.name}</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 text-center">{u.location}</p>
                <div className="mt-auto flex items-center gap-1.5 text-[9px] font-black text-green-600 bg-white border border-green-100 px-3 py-1.5 rounded-full uppercase tracking-tighter">
                  <CheckCircle2 size={12} /> Verified Member
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Verification Section */}
      <section className="bg-blue-900 py-24 text-white overflow-hidden relative">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4">
          <ShieldCheck size={600} />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-black mb-8 leading-tight">Securing the Future of Zanzibar's Intellectual Heritage.</h2>
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <Database size={24} className="text-blue-300" />
                </div>
                <div>
                  <h4 className="font-black text-lg mb-1">Permanent URN Assignment</h4>
                  <p className="text-blue-100/60 font-medium">Every validated work receives a unique, immutable Uniform Resource Name ensuring long-term findability.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <UserCheck size={24} className="text-blue-300" />
                </div>
                <div>
                  <h4 className="font-black text-lg mb-1">Peer & Institutional Validation</h4>
                  <p className="text-blue-100/60 font-medium">Only works validated by university supervisors and staff are eligible for publication in the repository.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex flex-col mb-8">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black text-blue-950 tracking-tighter">Was</span>
                  <Search className="text-blue-500 mb-1" size={24} strokeWidth={4} />
                  <span className="text-2xl font-black text-blue-950 tracking-tighter ml-[-4px]">mi</span>
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] ml-0.5 mt-[-4px]">Scholars</span>
              </Link>
              <p className="text-gray-500 text-sm max-w-sm leading-relaxed font-medium">
                The one-stop platform for all university theses in Zanzibar, made accessible to everyone, facilitating impact, and ensuring research continuation.
              </p>
            </div>
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-[0.3em] mb-8 text-gray-400">Information</h4>
              <ul className="space-y-4 text-sm text-gray-600 font-bold">
                <li><Link to="/about" className="hover:text-blue-500 transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-blue-500 transition-colors">Contact Us</Link></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Advanced Search</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-[0.3em] mb-8 text-gray-400">Institutional</h4>
              <ul className="space-y-4 text-sm text-gray-600 font-bold">
                <li><Link to="/auth" className="hover:text-blue-500 transition-colors">Supervisor Portal</Link></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Copyright Policy</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Help & Documentation</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-20 pt-10 border-t border-gray-100 text-center text-gray-400 text-[9px] font-black uppercase tracking-[0.4em]">
            © {new Date().getFullYear()} Wasomischolars Network • An Academic Preservation Project • Zanzibar, Tanzania
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
