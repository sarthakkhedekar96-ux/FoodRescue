import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import DonorDashboard from './pages/DonorDashboard';
import NgoDashboard from './pages/NgoDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DatabaseInsights from './pages/DatabaseInsights';
import Login from './pages/Login';
import Register from './pages/Register';
import { api } from './api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertCircle, RefreshCw, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';

function MainApp() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const getTabFromPath = () => {
    const path = window.location.pathname.replace(/^\/+/, '').toLowerCase();
    if (['donor', 'ngo', 'volunteer', 'admin', 'login', 'register', 'insights', 'home'].includes(path)) {
      return path;
    }
    return 'home';
  };

  const [activeTab, setActiveTabState] = useState(getTabFromPath);
  const [dbHealth, setDbHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [backendDown, setBackendDown] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    const newPath = tab === 'home' ? '/' : `/${tab}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTabState(getTabFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Frontend Route Guard & Redirection:
  // Non-admins (such as Donors) accessing /insights, /admin, or other roles' dashboards are redirected away
  useEffect(() => {
    const path = window.location.pathname.replace(/^\/+/, '').toLowerCase();
    if (!user) {
      if (['insights', 'donor', 'ngo', 'volunteer', 'admin'].includes(path) || ['insights', 'donor', 'ngo', 'volunteer', 'admin'].includes(activeTab)) {
        setActiveTabState('login');
        window.history.replaceState(null, '', '/login');
      }
      return;
    }

    const role = user.role?.toUpperCase();
    if (role === 'DONOR') {
      if (['ngo', 'volunteer', 'admin', 'insights'].includes(path) || ['ngo', 'volunteer', 'admin', 'insights'].includes(activeTab)) {
        setActiveTabState('donor');
        window.history.replaceState(null, '', '/donor');
      }
    } else if (role === 'NGO') {
      if (['donor', 'volunteer', 'admin', 'insights'].includes(path) || ['donor', 'volunteer', 'admin', 'insights'].includes(activeTab)) {
        setActiveTabState('ngo');
        window.history.replaceState(null, '', '/ngo');
      }
    } else if (role === 'VOLUNTEER') {
      if (['donor', 'ngo', 'admin', 'insights'].includes(path) || ['donor', 'ngo', 'admin', 'insights'].includes(activeTab)) {
        setActiveTabState('volunteer');
        window.history.replaceState(null, '', '/volunteer');
      }
    }
  }, [user, activeTab]);

  const checkHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await api.getDbHealth();
      setDbHealth(res);
      setBackendDown(false);
    } catch (err) {
      console.warn('Backend health check failed:', err.message);
      setDbHealth(null);
      setBackendDown(true);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // When a 401 happens, redirect to login
  useEffect(() => {
    const handleUnauthorized = () => {
      setActiveTab('login');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // Role Protection Helper
  const renderDashboard = () => {
    if (activeTab === 'home') return <Home setActiveTab={setActiveTab} />;
    if (activeTab === 'login') return <Login setActiveTab={setActiveTab} />;
    if (activeTab === 'register') return <Register setActiveTab={setActiveTab} />;

    // Protected Route Check 1: Authentication
    if (!isAuthenticated) {
      return (
        <div className="max-w-md mx-auto my-12 text-center space-y-4">
          <div className="glass-panel p-8 rounded-lg border border-[#E3D9C8] bg-white space-y-4">
            <ShieldAlert className="w-12 h-12 text-[#B23A25] mx-auto" />
            <h2 className="text-xl font-heading text-[#2B2118]">Authentication Required</h2>
            <p className="text-xs text-[#6B5E52]">
              You must sign in with a registered FoodRescue account to access this portal.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('login')}
                className="btn-primary text-xs"
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className="btn-secondary text-xs"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Protected Route Check 2: Role Authorization
    const userRole = user?.role?.toUpperCase();

    if (activeTab === 'donor') {
      if (userRole === 'DONOR' || userRole === 'ADMIN') {
        return <DonorDashboard />;
      }
      return <PermissionDenied requiredRole="DONOR" userRole={userRole} setActiveTab={setActiveTab} />;
    }

    if (activeTab === 'ngo') {
      if (userRole === 'NGO' || userRole === 'ADMIN') {
        return <NgoDashboard />;
      }
      return <PermissionDenied requiredRole="NGO" userRole={userRole} setActiveTab={setActiveTab} />;
    }

    if (activeTab === 'volunteer') {
      if (userRole === 'VOLUNTEER' || userRole === 'ADMIN') {
        return <VolunteerDashboard />;
      }
      return <PermissionDenied requiredRole="VOLUNTEER" userRole={userRole} setActiveTab={setActiveTab} />;
    }

    if (activeTab === 'admin') {
      if (userRole === 'ADMIN') {
        return <AdminDashboard />;
      }
      return <PermissionDenied requiredRole="ADMIN" userRole={userRole} setActiveTab={setActiveTab} />;
    }

    if (activeTab === 'insights') {
      if (userRole === 'ADMIN') {
        return <DatabaseInsights />;
      }
      return <PermissionDenied requiredRole="ADMIN" userRole={userRole} setActiveTab={setActiveTab} />;
    }

    return <Home setActiveTab={setActiveTab} />;
  };

  return (
    <div className="min-h-screen bg-[#FBF6EC] text-[#2B2118] flex flex-col font-body">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Global Backend Offline Banner */}
      {backendDown && (
        <div className="bg-[#F8E7E3] border-b border-[#E8C1B7] px-4 py-2.5 text-xs text-[#963826] flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-[#B23A25] shrink-0" />
              <span>
                <strong className="font-semibold">Backend Offline:</strong> Unable to connect to the server at http://localhost:8080.
              </span>
            </div>
            <button
              onClick={checkHealth}
              disabled={healthLoading}
              className="ml-4 px-3 py-1 rounded-md bg-white border border-[#E8C1B7] hover:bg-[#FAF3E5] text-[#B23A25] font-semibold text-[11px] flex items-center space-x-1 shrink-0 transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${healthLoading ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderDashboard()}
      </main>

      <footer className="border-t border-[#E3D9C8] bg-[#FBF6EC] py-6 text-center text-xs text-[#6B5E52] space-y-1">
        <p className="font-semibold text-[#2B2118]">FoodRescue — Community Food Sharing Network</p>
        <p className="text-[11px] text-[#8C7E72]">
          Connecting local food donors, shelters, and volunteers to reduce hunger and waste.
        </p>
      </footer>
    </div>
  );
}

function PermissionDenied({ requiredRole, userRole, setActiveTab }) {
  const redirectRoleTab = () => {
    if (userRole === 'DONOR') setActiveTab('donor');
    else if (userRole === 'NGO') setActiveTab('ngo');
    else if (userRole === 'VOLUNTEER') setActiveTab('volunteer');
    else if (userRole === 'ADMIN') setActiveTab('admin');
    else setActiveTab('home');
  };

  return (
    <div className="max-w-md mx-auto my-12 text-center">
      <div className="glass-panel p-8 rounded-lg border border-[#E3D9C8] bg-white space-y-4">
        <div className="w-12 h-12 rounded-lg bg-[#F9EED9] text-[#8A5816] flex items-center justify-center mx-auto border border-[#E8D1A7]">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-heading text-[#2B2118]">You don't have permission to view this page</h2>
        <p className="text-xs text-[#6B5E52] leading-relaxed">
          This portal requires the <strong className="text-[#2B2118] font-semibold">{requiredRole}</strong> role.
          Your current account is registered as <strong className="text-[#4B6B36] font-semibold">{userRole}</strong>.
        </p>
        <div className="pt-2">
          <button
            onClick={redirectRoleTab}
            className="btn-primary text-xs"
          >
            Go to your allowed dashboard ({userRole})
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
