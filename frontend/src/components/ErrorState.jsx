import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ServerOff, ShieldAlert, AlertCircle } from 'lucide-react';

export default function ErrorState({ 
  error,
  title, 
  message, 
  onRetry, 
  loading = false 
}) {
  // Determine error category from status or message
  const status = error?.status || (typeof error === 'number' ? error : null);
  const rawMsg = (typeof error === 'string' ? error : error?.message) || message || '';

  const is401 = status === 401 || rawMsg.includes('401') || rawMsg.toLowerCase().includes('unauthorized');
  const is403 = status === 403 || rawMsg.includes('403') || rawMsg.toLowerCase().includes('permission') || rawMsg.toLowerCase().includes('forbidden') || rawMsg.toLowerCase().includes('access denied');
  const is5xx = (status >= 500 && status < 600) || rawMsg.includes('500') || rawMsg.includes('502') || rawMsg.includes('503') || rawMsg.includes('504');

  // HTTP 401 -> redirect to Login
  useEffect(() => {
    if (is401) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  }, [is401]);

  if (is401) {
    return (
      <div className="glass-panel p-8 rounded-3xl border border-amber-500/30 max-w-lg mx-auto my-8 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">Session Expired</h3>
        <p className="text-xs text-slate-300">Redirecting to login...</p>
      </div>
    );
  }

  // HTTP 403 -> "You don't have permission to view this page", no "server offline" hints, no mention of environment variables
  if (is403) {
    return (
      <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-amber-500/30 bg-amber-950/10 shadow-2xl shadow-amber-950/20 max-w-2xl mx-auto my-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <span>HTTP 403 Forbidden</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">
            {title || "Access Denied"}
          </h3>
          <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  // Other 5xx -> "Something went wrong on the server" with a retry button
  if (is5xx) {
    return (
      <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-rose-500/30 bg-rose-950/10 shadow-2xl shadow-rose-950/20 max-w-2xl mx-auto my-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            <span>HTTP 5xx Server Error</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">
            {title || "Server Error"}
          </h3>
          <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Something went wrong on the server.
          </p>
        </div>
        {onRetry && (
          <div className="pt-2">
            <button
              onClick={onRetry}
              disabled={loading}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold hover:from-rose-400 hover:to-amber-400 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 text-xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Retrying...' : 'Retry'}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Network failure / no response -> "Backend offline" with troubleshooting hints
  return (
    <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-rose-500/30 bg-rose-950/10 shadow-2xl shadow-rose-950/20 max-w-2xl mx-auto my-8 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
        <ServerOff className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>API Connection Error</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-white">
          {title || "Backend Offline"}
        </h3>
        <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
          {message || 'Unable to connect to the FoodRescue backend on http://localhost:8080.'}
        </p>
      </div>

      {/* Troubleshooting hints (no env vars) */}
      <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-left text-xs space-y-2 text-slate-400 font-mono">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Troubleshooting Hints:</span>
        <ul className="list-disc pl-4 space-y-1 text-slate-300 font-sans">
          <li>Verify the Spring Boot backend application is running on port 8080.</li>
          <li>Check that network connectivity to the API server is available.</li>
        </ul>
      </div>

      {onRetry && (
        <div className="pt-2">
          <button
            onClick={onRetry}
            disabled={loading}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold hover:from-rose-400 hover:to-amber-400 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 text-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Reconnecting...' : 'Retry Backend Connection'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
