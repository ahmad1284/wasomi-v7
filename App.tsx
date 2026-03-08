
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole } from './types';
import { getStore, saveStore } from './store';
import LandingPage from './views/LandingPage';
import AboutUs from './views/AboutUs';
import ContactUs from './views/ContactUs';
import Auth from './views/Auth';
import DashboardLayout from './components/DashboardLayout';
import Overview from './views/Overview';
import StudentDashboard from './views/StudentDashboard';
import SupervisorDashboard from './views/SupervisorDashboard';
import PublisherDashboard from './views/PublisherDashboard';
import ResearchDetail from './views/ResearchDetail';
import PublicResearchDetail from './views/PublicResearchDetail';
import InstitutionsDashboard from './views/InstitutionsDashboard';
import UserManagementDashboard from './views/UserManagementDashboard';
import ApprovedRepositoryView from './views/ApprovedRepositoryView';
import StudentApprovalView from './views/StudentApprovalView';
import Configuration from './views/Configuration';
import AIAssistant from './views/AIAssistant';
import ResearchPipeline from './views/ResearchPipeline';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { auth } = getStore();
    setUser(auth);
    setLoading(false);
  }, []);

  const handleLogout = () => {
    saveStore({ auth: null });
    setUser(null);
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage user={user} />} />
        <Route path="/about" element={<AboutUs user={user} />} />
        <Route path="/contact" element={<ContactUs user={user} />} />
        <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <Auth onLogin={setUser} />} />
        <Route path="/research/:id" element={<PublicResearchDetail user={user} />} />
        
        {/* Protected Dashboard Routes - Redirect to Landing Page (/) instead of Login (/auth) if unauthenticated */}
        <Route path="/dashboard" element={user ? <DashboardLayout user={user} onLogout={handleLogout} /> : <Navigate to="/" />}>
          <Route index element={<Overview user={user!} />} />
          
          {/* Supervisor & Staff Specific Paths */}
          <Route path="reviews" element={<SupervisorDashboard user={user!} />} />
          <Route path="approvals" element={<StudentApprovalView user={user!} />} />
          <Route path="repository" element={<ApprovedRepositoryView user={user!} />} />
          <Route path="publications" element={<PublisherDashboard user={user!} />} />
          <Route path="pipeline" element={<ResearchPipeline user={user!} />} />
          <Route path="institutions" element={<InstitutionsDashboard user={user!} />} />
          <Route path="users" element={<UserManagementDashboard user={user!} />} />
          <Route path="configuration" element={<Configuration user={user!} />} />
          <Route path="ai-assistant" element={<AIAssistant user={user!} />} />
          <Route path="research/:id" element={<ResearchDetail user={user!} />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
