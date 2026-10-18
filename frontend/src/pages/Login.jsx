import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login({ setActiveTab }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      // Redirect based on user role
      if (user.role === 'DONOR') setActiveTab('donor');
      else if (user.role === 'NGO') setActiveTab('ngo');
      else if (user.role === 'VOLUNTEER') setActiveTab('volunteer');
      else if (user.role === 'ADMIN') setActiveTab('admin');
      else setActiveTab('home');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12" data-testid="login-page">
      <div className="glass-panel p-8 rounded-lg border border-[#E3D9C8] bg-white space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-full bg-[#F5EEDB] border border-[#E3D9C8] text-[#B23A25] mx-auto flex items-center justify-center font-bold font-heading text-lg">
            FR
          </div>
          <h2 className="text-2xl font-normal font-heading text-[#2B2118] tracking-wide">
            Welcome back
          </h2>
          <p className="text-xs text-[#6B5E52]">
            Sign in to continue to your FoodRescue account.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-[#F8E7E3] border border-[#E8C1B7] p-3 rounded-md flex items-start space-x-2.5 text-xs text-[#963826]">
            <AlertCircle className="w-4 h-4 text-[#B23A25] shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#2B2118] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8C7E72] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                data-testid="login-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E3D9C8] rounded-md text-sm text-[#2B2118] placeholder-[#8C7E72] focus:outline-none focus:border-[#B23A25] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B2118] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8C7E72] absolute left-3.5 top-3" />
              <input
                type="password"
                required
                data-testid="login-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E3D9C8] rounded-md text-sm text-[#2B2118] placeholder-[#8C7E72] focus:outline-none focus:border-[#B23A25] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="login-submit-btn"
            className="w-full py-2.5 rounded-md bg-[#B23A25] text-white font-semibold text-sm hover:bg-[#962F1D] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="text-xs font-semibold">Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="pt-4 border-t border-[#E3D9C8] text-center space-y-3">
          <p className="text-xs text-[#6B5E52]">
            Don't have an account?{' '}
            <button
              onClick={() => setActiveTab('register')}
              className="text-[#B23A25] hover:underline font-semibold ml-1"
            >
              Register here
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
