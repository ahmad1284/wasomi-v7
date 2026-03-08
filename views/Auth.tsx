
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, UserRole, University } from '../types';
import { getStore, saveStore, notifyRole, createNotification } from '../store';
import { supabase } from '../lib/supabase';
import { Search, Eye, EyeOff, Globe, Info, UserCheck, Clock, CheckCircle2, ArrowLeft, Fingerprint, ArrowRight, ShieldAlert } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

const Auth: React.FC<Props> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [universities, setUniversities] = useState<University[]>([]);
  const [universityId, setUniversityId] = useState('');
  const [assignedSupervisorId, setAssignedSupervisorId] = useState('');
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [credentialLink, setCredentialLink] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const isSupabaseConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_URL.includes('placeholder'));

  useEffect(() => {
    const { universities: allUnis, users } = getStore();
    setUniversities(allUnis);
    
    const sups = users.filter((u: User) => u.role === UserRole.SUPERVISOR);
    setSupervisors(sups);
  }, []);

  const filteredSupervisors = supervisors.filter(s => s.universityId === universityId);

  useEffect(() => {
    setAssignedSupervisorId('');
  }, [universityId]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isRegistering) {
      if (!universityId) {
        setError('Please select your institution affiliation.');
        return;
      }
      if (role === UserRole.STUDENT && !idNumber) {
        setError('Registration Number is required for institutional verification.');
        return;
      }
      if (role === UserRole.STUDENT && universityId !== 'independent' && !assignedSupervisorId) {
        setError('Please select a supervisor for verification.');
        return;
      }
    }

    if (isSupabaseConfigured) {
      if (isRegistering) {
        const { data: authData, error: authError } = await (supabase.auth as any).signUp({
          email,
          password,
          options: { 
            data: { 
              full_name: name, 
              university_id: universityId, 
              role: role,
              id_number: idNumber,
              credential_link: credentialLink,
              assigned_supervisor_id: assignedSupervisorId,
              verified: false 
            } 
          }
        });

        if (authError) {
          setError(authError.message);
          return;
        }

        if (authData.user) {
          notifyRole(UserRole.ADMIN, "New Verification Request", `A new ${role}, ${name} (Reg No: ${idNumber}), has registered.`, 'info', '/dashboard/users?tab=PENDING');
          if (assignedSupervisorId) {
            createNotification(assignedSupervisorId, "New Student Verification", `${name} has selected you as their supervisor.`, 'info', '/dashboard/approvals');
          }
          setRegistrationSuccess(true);
        }
      } else {
        const { data: authData, error: authError = null } = await (supabase.auth as any).signInWithPassword({ email, password });
        if (authError) {
          setError(authError.message);
          return;
        }
        
        const { users } = getStore();
        let user = users.find((u: User) => u.email === email);
        
        if (!user && authData.user) {
          user = {
            id: authData.user.id,
            email: authData.user.email!,
            name: authData.user.user_metadata.full_name || 'System User',
            role: authData.user.user_metadata.role || UserRole.STUDENT,
            idNumber: authData.user.user_metadata.id_number || '',
            universityId: authData.user.user_metadata.university_id || '1',
            verified: authData.user.user_metadata.verified || false,
            isSuspended: authData.user.user_metadata.is_suspended || false,
            credentialLink: authData.user.user_metadata.credential_link || '',
            assignedSupervisorId: authData.user.user_metadata.assigned_supervisor_id || ''
          };
        }

        if (user) {
          if (user.isSuspended) {
            setError('Your account has been suspended by the platform administrator. Access is denied.');
            return;
          }
          if (!user.verified && user.role !== UserRole.ADMIN) {
            setError('Your account is awaiting institutional verification. Access is restricted until approved.');
            return;
          }
          saveStore({ auth: user });
          onLogin(user);
          navigate('/dashboard');
        }
      }
      return;
    }

    // Mock Mode Logic
    const { users } = getStore();
    if (isRegistering) {
      if (users.find((u: User) => u.email === email)) {
        setError('Email already exists');
        return;
      }
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email, name, idNumber, role, universityId, verified: false, credentialLink, assignedSupervisorId
      };
      
      // TRIGGER NOTIFICATIONS FOR MOCK MODE
      notifyRole(UserRole.ADMIN, "New Verification Request", `A new ${role}, ${name} (Reg No: ${idNumber}), has registered.`, 'info', '/dashboard/users?tab=PENDING');
      if (assignedSupervisorId) {
        createNotification(assignedSupervisorId, "New Student Verification", `${name} has selected you as their supervisor.`, 'info', '/dashboard/approvals');
      }

      saveStore({ users: [...users, newUser] });
      setRegistrationSuccess(true);
    } else {
      const user = users.find((u: User) => u.email === email);
      if (user) {
        if (user.isSuspended) {
          setError('This account has been suspended. Please contact support.');
          return;
        }
        if (!user.verified && user.role !== UserRole.ADMIN) {
          setError('Your account is awaiting institutional verification.');
          return;
        }
        saveStore({ auth: user });
        onLogin(user);
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Please check your email and password.');
      }
    }
  };

  const inputClasses = "appearance-none block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all bg-white shadow-sm hover:border-gray-300";
  const labelClasses = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-inter">
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-[100] shrink-0">
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
              <Link to="/" className="text-sm font-bold text-gray-500 hover:text-blue-500 transition-colors">Home</Link>
              <Link to="/about" className="text-sm font-bold text-gray-500 hover:text-blue-500 transition-colors">About</Link>
              <Link to="/contact" className="text-sm font-bold text-gray-500 hover:text-blue-500 transition-colors">Contact</Link>
            </div>
            <div className="flex gap-4 items-center">
              <Link to="/" className="bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-xl shadow-blue-200 flex items-center gap-2">
                Explore Repository <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {registrationSuccess ? (
            <div className="space-y-8 bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100/50 text-center animate-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-500 mb-6 shadow-sm border border-blue-100">
                  <Clock size={40} className="animate-pulse" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-4">Application Pending</h2>
                <p className="text-gray-500 font-medium leading-relaxed mb-8">
                  Thank you for applying, <span className="text-gray-900 font-black">{name}</span>. 
                  Your account is currently being reviewed for institutional affiliation.
                </p>
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 mb-8 w-full text-left">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Verification Process</h3>
                  <ul className="space-y-3">
                    <li className="flex gap-3 text-xs text-blue-800 font-bold">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] shrink-0">1</div>
                      {role === UserRole.STUDENT ? 'Your selected supervisor will verify your details.' : 'The system administrator will verify your credentials.'}
                    </li>
                    <li className="flex gap-3 text-xs text-blue-800 font-bold">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] shrink-0">2</div>
                      You will receive an email once approved.
                    </li>
                  </ul>
                </div>
                <button onClick={() => { setRegistrationSuccess(false); setIsRegistering(false); }} className="w-full flex items-center justify-center gap-2 py-4 bg-[#00A3DD] text-white rounded-xl font-black text-sm hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/30">
                  <ArrowLeft size={18} /> Return to Login
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100/50">
              <div className="text-center flex flex-col items-center">
                <div className="flex flex-col items-center mb-8">
                  <div className="flex items-center gap-1.5">
                    <span className="text-4xl font-black text-blue-950 tracking-tighter">Was</span>
                    <Search className="text-blue-500 mb-1" size={36} strokeWidth={4} />
                    <span className="text-4xl font-black text-blue-950 tracking-tighter ml-[-4px]">mi</span>
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] ml-0.5 mt-[-4px]">Scholars</span>
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                  {isRegistering ? 'Register your account' : 'Sign in to your account'}
                </h2>
                <p className="mt-3 text-sm text-gray-500 font-medium">
                  {isRegistering ? (
                    <span>Already have an account? <button onClick={() => setIsRegistering(false)} className="text-blue-500 font-bold hover:underline">Log in</button></span>
                  ) : (
                    <span>New author or staff? <button onClick={() => setIsRegistering(true)} className="text-blue-500 font-bold hover:underline">Register</button></span>
                  )}
                </p>
              </div>

              <form className="mt-8 space-y-6" onSubmit={handleAuth}>
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 flex items-start gap-3 animate-shake"><ShieldAlert size={18} className="shrink-0 mt-0.5" /> {error}</div>}
                
                <div className="space-y-5">
                  {isRegistering && (
                    <>
                      <div>
                        <label className={labelClasses}>Register as</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button type="button" onClick={() => setRole(UserRole.STUDENT)} className={`py-3 rounded-xl text-xs font-black border transition-all ${role === UserRole.STUDENT ? 'bg-blue-500 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}>Researcher</button>
                          <button type="button" onClick={() => setRole(UserRole.SUPERVISOR)} className={`py-3 rounded-xl text-xs font-black border transition-all ${role === UserRole.SUPERVISOR ? 'bg-purple-600 text-white border-purple-700' : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}>Supervisor</button>
                        </div>
                      </div>
                      <div>
                        <label className={labelClasses}>Full Name</label>
                        <input type="text" required className={inputClasses} placeholder="e.g. Ali Hamad" value={name} onChange={(e) => setName(e.target.value)} />
                      </div>
                      {role === UserRole.STUDENT && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                          <label className={labelClasses}>Registration Number <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input type="text" required className={`${inputClasses} pl-12 border-blue-100`} placeholder="e.g. 2024/SUZA/1234" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
                          </div>
                        </div>
                      )}
                      <div>
                        <label className={labelClasses}>Institution Affiliation <span className="text-red-500">*</span></label>
                        <select className={`${inputClasses} cursor-pointer font-bold`} value={universityId} onChange={(e) => setUniversityId(e.target.value)} required>
                          <option value="" disabled>Select your institution</option>
                          {universities.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
                        </select>
                      </div>
                      {isRegistering && role === UserRole.STUDENT && universityId && universityId !== 'independent' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                          <label className={labelClasses}>Primary Supervisor <span className="text-red-500">*</span></label>
                          <select required className={`${inputClasses} cursor-pointer font-bold border-blue-100`} value={assignedSupervisorId} onChange={(e) => setAssignedSupervisorId(e.target.value)}>
                            <option value="" disabled>Select your supervisor for verification</option>
                            {filteredSupervisors.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                          </select>
                        </div>
                      )}
                    </>
                  )}
                  <div>
                    <label className={labelClasses}>Email Address</label>
                    <input type="email" required className={inputClasses} placeholder="email@university.ac.tz" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClasses}>Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} required className={inputClasses} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                      <button type="button" className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-500 transition-colors" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <button type="submit" className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-xl text-white bg-[#00A3DD] hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/30">
                    {isRegistering ? 'Submit Application' : 'Sign In'}
                  </button>
                </div>
                <div className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-6">
                  <p>Institutional verification is mandatory for all roles.</p>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      <footer className="py-8 border-t border-gray-100 bg-white shrink-0">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">© {new Date().getFullYear()} Wasomi Scholars Network • Academic Preservation Project</p>
        </div>
      </footer>
    </div>
  );
};

export default Auth;
