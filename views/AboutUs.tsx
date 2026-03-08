
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Globe2, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  BookOpen, 
  Target, 
  Award,
  ChevronRight,
  History,
  Building2
} from 'lucide-react';
import { User } from '../types';

const AboutUs: React.FC<{ user: User | null }> = ({ user }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-inter">
      {/* Shared Navbar */}
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
              <Link to="/" className="text-sm font-bold text-gray-500 hover:text-blue-500">Home</Link>
              <Link to="/about" className="text-sm font-bold text-blue-500">About</Link>
              <Link to="/contact" className="text-sm font-bold text-gray-500 hover:text-blue-500">Contact</Link>
            </div>

            <div className="flex gap-4 items-center">
              {user ? (
                <Link to="/dashboard" className="bg-white text-blue-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all border border-blue-100">Dashboard</Link>
              ) : (
                <Link to="/auth" className="bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-xl shadow-blue-200 flex items-center gap-2">
                  Log In <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-[#0a192f] py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-12 h-full w-full gap-4 p-8">
             {Array.from({length: 24}).map((_, i) => (
               <div key={i} className="border-[0.5px] border-blue-400/20 rounded-lg"></div>
             ))}
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            Preserving Zanzibar’s <br/><span className="text-blue-500">Intellectual Heritage.</span>
          </h1>
          <p className="text-xl text-blue-100/60 max-w-2xl mx-auto font-medium leading-relaxed">
            We are a digital sanctuary for academic inquiry, ensuring that every validated thesis finds a permanent home and a global audience.
          </p>
        </div>
      </header>

      {/* Mission & Vision */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
              <Target size={14} /> Our Mission
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-6 tracking-tight">Closing the gap between research and policy.</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Historically, thousands of academic works in Zanzibar remained trapped in physical archives or personal computers. Wasomi Scholars was founded to digitize, validate, and disseminate this knowledge to decision-makers and future researchers.
            </p>
            <div className="space-y-4">
              {[
                { title: 'Digital Sanctuary', desc: 'Secure, redundant storage for all university outputs.' },
                { title: 'URN Authority', desc: 'Providing permanent identifiers for scholarly citation.' },
                { title: 'Open Access', desc: 'Democratizing knowledge through institutional transparency.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl border border-gray-100 hover:border-blue-100 transition-all">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-sm">{item.title}</h4>
                    <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-gray-50 rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl relative">
               <div className="absolute inset-0 flex items-center justify-center p-12">
                  <Building2 size={200} className="text-blue-100" />
               </div>
               <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur p-8 rounded-3xl border border-white shadow-xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                      <Award size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Institutional Standard</p>
                      <p className="text-lg font-black text-gray-900 leading-none mt-1">Validated & Verified</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Every document in our repository has undergone rigorous institutional verification by university-appointed supervisors.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 text-center mb-16">
          <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4">Core Principles</h2>
          <h3 className="text-4xl font-black text-gray-900 tracking-tight">The Soul of Wasomi Scholars</h3>
        </div>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              icon: <History className="text-purple-600" />, 
              title: "Permanent Preservation", 
              desc: "We treat research as a lasting legacy. Once published, documents are assigned immutable URNs and preserved indefinitely." 
            },
            { 
              icon: <Globe2 className="text-blue-600" />, 
              title: "Global Visibility", 
              desc: "By standardizing metadata, we make Zanzibar scholarship discoverable by researchers and policy makers worldwide." 
            },
            { 
              icon: <Users className="text-green-600" />, 
              title: "Author Empowerment", 
              desc: "Students retain the copyright to their work while gaining the prestige of institutional validation." 
            }
          ].map((val, i) => (
            <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-white border border-gray-50 shadow-sm rounded-2xl flex items-center justify-center mb-8 mx-auto">
                {React.cloneElement(val.icon, { size: 32 })}
              </div>
              <h4 className="text-xl font-black text-gray-900 mb-4">{val.title}</h4>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">{val.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-black text-gray-900 mb-8 tracking-tight">Join the Academic Preservation Movement.</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/auth" className="bg-blue-500 text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2">
            Register as Researcher <ChevronRight size={18} />
          </Link>
          <Link to="/contact" className="bg-white text-gray-700 px-10 py-4 rounded-2xl font-black text-sm border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
            Institutional Partnership
          </Link>
        </div>
      </section>

      {/* Shared Footer */}
      <footer className="bg-white border-t border-gray-100 py-20 mt-auto">
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
                Empowering scholars by preserving and disseminating academic work across the Zanzibar region. A permanent, institutional-grade home for local knowledge.
              </p>
            </div>
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-[0.3em] mb-8 text-gray-400">Information</h4>
              <ul className="space-y-4 text-sm text-gray-600 font-bold">
                <li><Link to="/about" className="hover:text-blue-500">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-blue-500">Contact Us</Link></li>
                <li><a href="#" className="hover:text-blue-500">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-[0.3em] mb-8 text-gray-400">Institutional</h4>
              <ul className="space-y-4 text-sm text-gray-600 font-bold">
                <li><Link to="/auth" className="hover:text-blue-500">Staff Portal</Link></li>
                <li><a href="#" className="hover:text-blue-500">Partner Universities</a></li>
                <li><a href="#" className="hover:text-blue-500">Help Center</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-20 pt-10 border-t border-gray-100 text-center text-gray-400 text-[9px] font-black uppercase tracking-[0.4em]">
            © {new Date().getFullYear()} Wasomi Scholars Network • Academic Preservation Project • Zanzibar, Tanzania
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;
