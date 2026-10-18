import React, { useEffect } from 'react';
import { RefreshCw, ServerOff, ShieldAlert, AlertCircle, AlertTriangle } from 'lucide-react';

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
      <div className="glass-panel p-8 rounded-lg border border-[#E3D9C8] bg-white max-w-lg mx-auto my-8 text-center space-y-4" data-testid="error-state-401">
        <ShieldAlert className="w-12 h-12 text-[#B23A25] mx-auto" />
        <h3 className="text-xl font-normal font-heading text-[#2B2118] tracking-wide">Session Expired</h3>
        <p className="text-xs text-[#6B5E52]">Redirecting to sign in...</p>
      </div>
    );
  }

  // HTTP 403 -> "You don't have permission to view this page"
  if (is403) {
    return (
      <div className="glass-panel p-8 sm:p-10 rounded-lg border border-[#E3D9C8] bg-white max-w-xl mx-auto my-8 text-center space-y-4" data-testid="error-state-403">
        <div className="w-12 h-12 rounded-lg bg-[#F9EED9] text-[#8A5816] flex items-center justify-center mx-auto border border-[#E8D1A7]">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#F9EED9] text-[#8A5816] text-[11px] font-semibold border border-[#E8D1A7]">
            <span>Access Restricted</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-normal font-heading text-[#2B2118] tracking-wide">
            {title || "Access Denied"}
          </h3>
          <p className="text-xs sm:text-sm text-[#6B5E52] max-w-md mx-auto leading-relaxed">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  // Other 5xx -> "Something went wrong on the server" with a retry button
  if (is5xx) {
    return (
      <div className="glass-panel p-8 sm:p-10 rounded-lg border border-[#E8C1B7] bg-white max-w-xl mx-auto my-8 text-center space-y-4" data-testid="error-state-5xx">
        <div className="w-12 h-12 rounded-lg bg-[#F8E7E3] text-[#B23A25] flex items-center justify-center mx-auto border border-[#E8C1B7]">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#F8E7E3] text-[#963826] text-[11px] font-semibold border border-[#E8C1B7]">
            <span>Server Error</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-normal font-heading text-[#2B2118] tracking-wide">
            {title || "Server Error"}
          </h3>
          <p className="text-xs sm:text-sm text-[#6B5E52] max-w-md mx-auto leading-relaxed">
            Something went wrong on the server.
          </p>
        </div>
        {onRetry && (
          <div className="pt-2">
            <button
              onClick={onRetry}
              disabled={loading}
              className="btn-primary text-xs px-5 py-2 inline-flex items-center space-x-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Retrying...' : 'Retry'}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Network failure / no response -> "Backend offline"
  return (
    <div className="glass-panel p-8 sm:p-10 rounded-lg border border-[#E3D9C8] bg-white max-w-xl mx-auto my-8 text-center space-y-5" data-testid="error-state-offline">
      <div className="w-12 h-12 rounded-lg bg-[#F8E7E3] text-[#B23A25] flex items-center justify-center mx-auto border border-[#E8C1B7]">
        <ServerOff className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#F8E7E3] text-[#963826] text-[11px] font-semibold border border-[#E8C1B7]">
          <AlertTriangle className="w-3 h-3" />
          <span>Server Unreachable</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-normal font-heading text-[#2B2118] tracking-wide">
          {title || "Backend Offline"}
        </h3>
        <p className="text-xs sm:text-sm text-[#6B5E52] max-w-md mx-auto leading-relaxed">
          {message || 'Unable to connect to the FoodRescue backend on http://localhost:8080.'}
        </p>
      </div>

      {/* Troubleshooting hints */}
      <div className="bg-[#FBF6EC] rounded-md p-4 border border-[#E3D9C8] text-left text-xs space-y-2 text-[#6B5E52]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#2B2118] block">Troubleshooting Hints:</span>
        <ul className="list-disc pl-4 space-y-1">
          <li>Verify the backend application is running on port 8080.</li>
          <li>Check that network connectivity to the API server is available.</li>
        </ul>
      </div>

      {onRetry && (
        <div className="pt-2">
          <button
            onClick={onRetry}
            disabled={loading}
            className="btn-primary text-xs px-5 py-2 inline-flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Reconnecting...' : 'Retry Backend Connection'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
