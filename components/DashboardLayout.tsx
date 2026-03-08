
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { User, UserRole, Notification, University } from '../types';
import { getStore, saveStore } from '../store';
import { 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  BookOpen, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck,
  Building,
  Bell,
  Clock,
  Check,
  Search,
  Archive,
  UserCheck,
  Settings,
  Sparkles,
  GitPullRequest
} from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  active: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, to, active, onClick }) => (
  <li>
    <Link
      to={to}
      onClick={onClick}
      className={`group relative flex items-center gap-2.5 rounded-lg py-2.5 px-4 font-bold text-sm duration-300 ease-in-out ${
        active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </Link>
  </li>
);

interface Props {
  user: User;
  onLogout: () => void;
}

const DashboardLayout: React.FC<Props> = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { notifications: allNotifs, universities: allUnis } = getStore();
    setUniversities(allUnis);
    setNotifications(allNotifs.filter((n: Notification) => n.userId === user.id && !n.dismissed));
    
    const interval = setInterval(() => {
      const { notifications: updatedNotifs } = getStore();
      setNotifications(updatedNotifs.filter((n: Notification) => n.userId === user.id && !n.dismissed));
    }, 5000);

    return () => clearInterval(interval);
  }, [user.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const markAsRead = (id: string) => {
    const { notifications: allNotifs } = getStore();
    const updated = allNotifs.map((n: Notification) => 
      n.id === id ? { ...n, read: true } : n
    );
    saveStore({ notifications: updated });
    setNotifications(updated.filter((n: Notification) => n.userId === user.id && !n.dismissed));
  };

  const markAllAsRead = () => {
    const { notifications: allNotifs } = getStore();
    const updated = allNotifs.map((n: Notification) => 
      n.userId === user.id ? { ...n, read: true } : n
    );
    saveStore({ notifications: updated });
    setNotifications(updated.filter((n: Notification) => n.userId === user.id && !n.dismissed));
  };

  const dismissNotification = (id: string) => {
    const { notifications: allNotifs } = getStore();
    const updated = allNotifs.map((n: Notification) => 
      n.id === id ? { ...n, dismissed: true, read: true } : n
    );
    saveStore({ notifications: updated });
    setNotifications(updated.filter((n: Notification) => n.userId === user.id && !n.dismissed));
  };

  useEffect(() => {
    const currentFullLink = location.pathname + location.search;
    const toDismiss = notifications.filter(n => n.link === currentFullLink);
    if (toDismiss.length > 0) {
      toDismiss.forEach(n => dismissNotification(n.id));
    }
  }, [location.pathname, location.search, notifications.length]);

  const handleNotificationClick = (n: Notification) => {
    dismissNotification(n.id);
    setNotifOpen(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  const clearAllNotifications = () => {
    const { notifications: allNotifs } = getStore();
    const updated = allNotifs.map((n: Notification) => 
      n.userId === user.id ? { ...n, dismissed: true, read: true } : n
    );
    saveStore({ notifications: updated });
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getRoleBadge = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      [UserRole.STUDENT]: 'bg-white text-blue-700 border border-blue-100',
      [UserRole.SUPERVISOR]: 'bg-white text-purple-700 border border-purple-100',
      [UserRole.PUBLISHER]: 'bg-white text-green-700 border border-green-100',
      [UserRole.ADMIN]: 'bg-white text-red-700 border border-red-100',
      [UserRole.PUBLIC]: 'bg-white text-gray-700 border border-gray-100',
    };
    return <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${colors[role]}`}>{role}</span>;
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const userUniversity = universities.find(u => u.id === user.universityId)?.name || 'Wasomi Headquarters';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`absolute left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-y-hidden bg-gray-900 duration-300 ease-linear lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-8 py-8">
          <Link to="/" className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-black text-white tracking-tighter">Was</span>
              <Search className="text-blue-500 mb-1" size={24} strokeWidth={4} />
              <span className="text-2xl font-black text-white tracking-tighter ml-[-4px]">mi</span>
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] ml-0.5 mt-[-4px]">Scholars</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white hover:text-blue-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col overflow-y-auto duration-300 ease-linear h-full px-6 text-white">
          <nav className="mt-5">
            <div>
              <h3 className="mb-4 ml-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Platform</h3>
              <ul className="mb-6 flex flex-col gap-2">
                <SidebarItem 
                  icon={<LayoutDashboard size={18} />} 
                  label="Dashboard" 
                  to="/dashboard" 
                  active={location.pathname === '/dashboard'} 
                  onClick={() => setSidebarOpen(false)}
                />
                
                {user.role === UserRole.SUPERVISOR && (
                  <>
                    <SidebarItem 
                      icon={<CheckSquare size={18} />} 
                      label="Review Queue" 
                      to="/dashboard/reviews" 
                      active={isActive('/dashboard/reviews')} 
                      onClick={() => setSidebarOpen(false)}
                    />
                    <SidebarItem 
                      icon={<UserCheck size={18} />} 
                      label="Student Approvals" 
                      to="/dashboard/approvals" 
                      active={isActive('/dashboard/approvals')} 
                      onClick={() => setSidebarOpen(false)}
                    />
                    <SidebarItem 
                      icon={<Archive size={18} />} 
                      label="Approved Works" 
                      to="/dashboard/repository" 
                      active={isActive('/dashboard/repository')} 
                      onClick={() => setSidebarOpen(false)}
                    />
                  </>
                )}

                {(user.role === UserRole.PUBLISHER || user.role === UserRole.ADMIN) && (
                  <>
                    <SidebarItem 
                      icon={<GitPullRequest size={18} />} 
                      label="Research Pipeline" 
                      to="/dashboard/pipeline" 
                      active={isActive('/dashboard/pipeline')} 
                      onClick={() => setSidebarOpen(false)}
                    />
                    <SidebarItem 
                      icon={<BookOpen size={18} />} 
                      label="Publication Pool" 
                      to="/dashboard/publications" 
                      active={isActive('/dashboard/publications')} 
                      onClick={() => setSidebarOpen(false)}
                    />
                    <SidebarItem 
                      icon={<Archive size={18} />} 
                      label="Institutional Repository" 
                      to="/dashboard/repository" 
                      active={isActive('/dashboard/repository')} 
                      onClick={() => setSidebarOpen(false)}
                    />
                  </>
                )}

                {user.role === UserRole.ADMIN && (
                  <>
                    <SidebarItem 
                      icon={<Building size={18} />} 
                      label="Institutions" 
                      to="/dashboard/institutions" 
                      active={isActive('/dashboard/institutions')} 
                      onClick={() => setSidebarOpen(false)}
                    />
                    <SidebarItem 
                      icon={<ShieldCheck size={18} />} 
                      label="Users" 
                      to="/dashboard/users" 
                      active={isActive('/dashboard/users')} 
                      onClick={() => setSidebarOpen(false)}
                    />
                    <SidebarItem 
                      icon={<Settings size={18} />} 
                      label="Configuration" 
                      to="/dashboard/configuration" 
                      active={isActive('/dashboard/configuration')} 
                      onClick={() => setSidebarOpen(false)}
                    />
                    <SidebarItem 
                      icon={<Sparkles size={18} />} 
                      label="AI Assistant" 
                      to="/dashboard/ai-assistant" 
                      active={isActive('/dashboard/ai-assistant')} 
                      onClick={() => setSidebarOpen(false)}
                    />
                  </>
                )}
              </ul>
            </div>
          </nav>

          <div className="mt-auto mb-10">
             <button 
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 text-sm font-bold text-gray-500 hover:text-white transition-colors group"
            >
              <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <header className="sticky top-0 z-40 flex w-full bg-white backdrop-blur-md border-b border-gray-100">
          <div className="flex flex-grow items-center justify-between py-4 px-6 md:px-10">
            <div className="flex items-center gap-4 lg:hidden">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg border border-gray-100 bg-white p-2 shadow-sm hover:bg-gray-50 transition-colors">
                <Menu size={20} />
              </button>
            </div>

            <div className="hidden sm:flex flex-col">
              <h2 className="text-sm font-bold text-gray-900 leading-none">Welcome back, {user.name}</h2>
              <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mt-1 uppercase tracking-widest">
                <Building size={10} className="text-gray-300" />
                {userUniversity}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative"
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60] animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center shrink-0">
                      <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Notifications</h3>
                      <div className="flex gap-3">
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-[10px] font-bold text-blue-600 hover:underline">Mark read</button>
                        )}
                        {notifications.length > 0 && (
                          <button onClick={clearAllNotifications} className="text-[10px] font-bold text-red-500 hover:underline">Clear all</button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar bg-white">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => handleNotificationClick(n)}
                            className={`p-4 border-b border-gray-50 last:border-0 hover:bg-blue-50/30 transition-colors relative group/item bg-white cursor-pointer ${!n.read ? 'border-l-4 border-l-blue-500' : ''}`}
                          >
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(n.id);
                              }}
                              className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover/item:opacity-100 transition-all"
                              title="Dismiss"
                            >
                              <X size={14} />
                            </button>
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 p-1.5 rounded-lg shrink-0 border border-blue-50 text-blue-600 bg-white`}>
                                <Check size={12} />
                              </div>
                              <div className="flex-grow pr-4">
                                <p className={`text-xs font-bold text-gray-900 ${!n.read ? 'pr-2' : ''}`}>{n.title}</p>
                                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed whitespace-pre-wrap line-clamp-2">{n.message}</p>
                                <p className="text-[9px] text-gray-400 mt-2 flex items-center gap-1">
                                  <Clock size={10} />
                                  {new Date(n.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center bg-white">
                          <p className="text-xs text-gray-400 font-bold">No active alerts</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-black text-gray-900 leading-none mb-1">{user.name}</p>
                  <div>{getRoleBadge(user.role)}</div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black border-2 border-white shadow-xl shadow-blue-100">
                  {user.name.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main 
          className="mx-auto w-full max-w-screen-2xl p-6 md:p-10"
          onClick={() => sidebarOpen && setSidebarOpen(false)}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
