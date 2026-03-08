
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Mail, 
  MapPin, 
  Phone, 
  Send, 
  MessageSquare, 
  Building2, 
  ArrowRight,
  CheckCircle2,
  Globe2,
  ChevronRight
} from 'lucide-react';
import { User } from '../types';

const ContactUs: React.FC<{ user: User | null }> = ({ user }) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

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
              <Link to="/about" className="text-sm font-bold text-gray-500 hover:text-blue-500">About</Link>
              <Link to="/contact" className="text-sm font-bold text-blue-500">Contact</Link>
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

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
            
            {/* Info Column */}
            <div className="space-y-12">
              <div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-6">Let’s connect <br/><span className="text-blue-500">for scholarship.</span></h1>
                <p className="text-gray-500 text-lg leading-relaxed max-w-md">
                  Whether you are an institution looking to join the network or a researcher seeking support, our team is here to help.
                </p>
              </div>

              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 uppercase text-[10px] tracking-widest mb-1">Wasomi HQ</h4>
                    <p className="text-gray-500 text-sm font-medium">Stone Town, Zanzibar, Tanzania</p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shrink-0 border border-purple-100">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 uppercase text-[10px] tracking-widest mb-1">Electronic Mail</h4>
                    <p className="text-gray-500 text-sm font-medium underline">contact@wasomischolars.org</p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shrink-0 border border-green-100">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 uppercase text-[10px] tracking-widest mb-1">Partnerships</h4>
                    <p className="text-gray-500 text-sm font-medium">Join 5+ leading universities across the region.</p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 relative overflow-hidden group">
                 <Globe2 className="absolute -right-4 -bottom-4 text-gray-200 group-hover:text-blue-100 transition-colors" size={150} />
                 <h4 className="font-black text-gray-900 mb-2 relative z-10">Regional Support</h4>
                 <p className="text-xs text-gray-500 leading-relaxed font-medium relative z-10 max-w-xs">
                   Our technical teams are available for on-site institutional integration and librarian training across Tanzania.
                 </p>
              </div>
            </div>

            {/* Form Column */}
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl shadow-blue-900/5">
              {submitted ? (
                <div className="text-center py-20 animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center text-green-600 mx-auto mb-6 border border-green-100">
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Message Delivered</h2>
                  <p className="text-gray-500 font-medium mb-8">Thank you for reaching out. A platform representative will respond to your inquiry within 24 hours.</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-blue-500 font-black text-sm uppercase tracking-widest hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input required type="text" placeholder="Ali Bakari" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                      <input required type="email" placeholder="ali@university.ac.tz" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Institutional Affiliation</label>
                    <input type="text" placeholder="State University of Zanzibar (Optional)" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm" />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject</label>
                    <select required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-black text-sm cursor-pointer">
                      <option>General Inquiry</option>
                      <option>Institutional Partnership</option>
                      <option>Technical Support</option>
                      <option>Researcher Verification</option>
                      <option>Metadata Correction</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message Detail</label>
                    <textarea required rows={5} placeholder="How can we assist you today?" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"></textarea>
                  </div>

                  <button 
                    disabled={loading}
                    type="submit" 
                    className="w-full bg-[#00A3DD] text-white py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 disabled:bg-gray-300"
                  >
                    {loading ? "Transmitting..." : <><Send size={18} /> Transmit Message</>}
                  </button>

                  <p className="text-[9px] text-gray-400 text-center font-bold uppercase tracking-widest mt-6">
                    By submitting, you agree to our digital data processing policy.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Shared Footer */}
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
                Empowering scholars by preserving and disseminating academic work across the Zanzibar region. A permanent, institutional-grade home for local knowledge.
              </p>
            </div>
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-[0.3em] mb-8 text-gray-400">Archive</h4>
              <ul className="space-y-4 text-sm text-gray-600 font-bold">
                <li><Link to="/about" className="hover:text-blue-500">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-blue-500">Contact Us</Link></li>
                <li><a href="#" className="hover:text-blue-500">Advanced Search</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-[0.3em] mb-8 text-gray-400">Institutional</h4>
              <ul className="space-y-4 text-sm text-gray-600 font-bold">
                <li><Link to="/auth" className="hover:text-blue-500">Supervisor Portal</Link></li>
                <li><a href="#" className="hover:text-blue-500">Copyright Policy</a></li>
                <li><a href="#" className="hover:text-blue-500">Help & Documentation</a></li>
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

export default ContactUs;
