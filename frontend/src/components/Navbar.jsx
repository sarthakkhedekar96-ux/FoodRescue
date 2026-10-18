import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setActiveTab('home');
  };

  // Build nav items dynamically based on role
  const navItems = [
    { id: 'home', label: 'Home', show: true },
    { id: 'donor', label: 'Donor Dashboard', show: isAuthenticated && (user?.role === 'DONOR' || user?.role === 'ADMIN') },
    { id: 'ngo', label: 'NGO Dashboard', show: isAuthenticated && (user?.role === 'NGO' || user?.role === 'ADMIN') },
    { id: 'volunteer', label: 'Volunteer', show: isAuthenticated && (user?.role === 'VOLUNTEER' || user?.role === 'ADMIN') },
    { id: 'admin', label: 'Admin Analytics', show: isAuthenticated && user?.role === 'ADMIN' },
    { id: 'insights', label: 'Database Insights', show: isAuthenticated && user?.role === 'ADMIN' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FBF6EC] border-b border-[#E3D9C8] m-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Simple Wordmark */}
          <div 
            className="flex items-center space-x-2 cursor-pointer select-none" 
            onClick={() => setActiveTab('home')}
            data-testid="navbar-brand"
          >
            <span className="text-2xl font-normal font-heading text-[#2B2118] tracking-wide">
              Food<span className="text-[#B23A25]">Rescue</span>
            </span>
          </div>

          {/* Plain Text Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-4">
            {navItems.filter(item => item.show).map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  data-testid={`nav-link-${item.id}`}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors border-b-2 ${
                    isActive
                      ? 'border-[#B23A25] text-[#B23A25] font-semibold'
                      : 'border-transparent text-[#6B5E52] hover:text-[#2B2118]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Auth Controls */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2 text-xs">
                  <span className="text-[#2B2118] font-medium">{user?.name}</span>
                  <span 
                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F5EEDB] text-[#4B6B36] border border-[#E3D9C8] uppercase tracking-wide"
                    data-testid="navbar-user-role"
                  >
                    {user?.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  data-testid="navbar-logout-btn"
                  className="px-3 py-1.5 rounded-md border border-[#E3D9C8] text-[#6B5E52] hover:text-[#B23A25] hover:border-[#DCBDBB] text-xs font-medium transition-colors flex items-center space-x-1 bg-white"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('login')}
                  data-testid="navbar-login-btn"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeTab === 'login'
                      ? 'text-[#B23A25] font-bold'
                      : 'text-[#6B5E52] hover:text-[#2B2118]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  data-testid="navbar-register-btn"
                  className="btn-primary text-xs px-3.5 py-1.5"
                >
                  Register
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
