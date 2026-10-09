import React, { useState, useEffect } from 'react';
import { Utensils, Heart, Truck, Database, ArrowRight, Layers, MapPin, Cpu, Star, Package, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import ErrorState from '../components/ErrorState';

export default function Home({ setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(null);

  const loadLiveStats = async () => {
    setLoading(true);
    setBackendError(null);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Backend connection error in Home:', err);
      setBackendError(err.message || 'Unable to connect to Spring Boot backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveStats();
  }, []);

  return (
    <div className="space-y-12 py-6">
      
      {/* Backend Error Banner on Landing Page */}
      {backendError && (
        <ErrorState
          title="Backend Server Offline"
          message="The Spring Boot API server (http://localhost:8080) is currently offline or unreachable. Live database metrics and CRUD portals require a running backend with MongoDB Atlas connection."
          onRetry={loadLiveStats}
          loading={loading}
        />
      )}

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-8 sm:p-12 border border-emerald-500/20 shadow-2xl shadow-emerald-500/5">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Database className="w-4 h-4" />
            <span>College Microproject: Advanced Database Systems</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            FoodRescue — Smart Surplus Food Redistribution System
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed">
            Connecting surplus edible food from hotels & cafeterias with NGOs and volunteers. Built specifically to demonstrate <strong className="text-emerald-400 font-semibold">MongoDB document design, embedded arrays, 2dsphere geospatial indexing, references, and aggregation pipelines</strong>.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => setActiveTab('insights')}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/25"
            >
              <Database className="w-5 h-5" />
              <span>Database Insights (Viva Evaluation)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('donor')}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl glass-card text-white font-semibold hover:bg-slate-800 transition-all border border-slate-700"
            >
              <Utensils className="w-5 h-5 text-emerald-400" />
              <span>Try Donor Portal</span>
            </button>
          </div>
        </div>

        {/* Live MongoDB Metrics in Hero Section */}
        <div className="mt-10 pt-8 border-t border-slate-800/80 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${backendError ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`}></span>
              Live MongoDB Aggregation Impact Metrics
            </span>
            <button 
              onClick={loadLiveStats} 
              className="text-xs text-slate-400 hover:text-emerald-300 flex items-center gap-1"
              title="Refresh live metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Stats</span>
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 h-20"></div>
              ))}
            </div>
          ) : backendError ? (
            <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-4 text-xs text-rose-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                Backend offline. Live hero metrics are unavailable until the backend starts.
              </span>
              <button onClick={loadLiveStats} className="underline hover:text-white font-semibold">Retry</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Total Donations</span>
                <p className="text-2xl font-black text-white mt-1">{stats?.totalDonations ?? 0}</p>
                <span className="text-[10px] text-slate-500 font-mono">mongoTemplate.count</span>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide">Surplus Rescued</span>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  {stats?.totalFoodQuantity ?? 0} <span className="text-xs font-normal text-slate-400">units</span>
                </p>
                <span className="text-[10px] text-emerald-500/70 font-mono">$unwind + $sum</span>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide">Average Rating</span>
                <p className="text-2xl font-black text-amber-400 mt-1 flex items-center gap-1">
                  <span>{stats?.averageRating ? stats.averageRating : 'N/A'}</span>
                  {stats?.averageRating > 0 && <Star className="w-4 h-4 fill-amber-400 text-amber-400 inline" />}
                </p>
                <span className="text-[10px] text-amber-500/70 font-mono">$group $avg</span>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wide">Available Surplus</span>
                <p className="text-2xl font-black text-cyan-300 mt-1">
                  {stats?.statusDistribution?.AVAILABLE ?? 0} <span className="text-xs font-normal text-slate-400">active</span>
                </p>
                <span className="text-[10px] text-cyan-500/70 font-mono">$group status</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Core Database Concepts Demonstrated */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-white">Core MongoDB Concepts Demonstrated</h2>
          <p className="text-sm text-slate-400">
            Every feature in this application directly maps to a fundamental document database concept for college evaluation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-emerald-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Embedded Documents & Arrays</h3>
            <p className="text-sm text-slate-400">
              Each donation document embeds an array of <code className="text-emerald-300">foodItems[]</code> and <code className="text-emerald-300">statusHistory[]</code> to avoid multi-table joins and keep related data atomic.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-emerald-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">2dsphere Geospatial Indexing</h3>
            <p className="text-sm text-slate-400">
              Stores GeoJSON <code className="text-teal-300">Point</code> coordinates <code className="text-teal-300">[longitude, latitude]</code> to execute fast spherical proximity searches (<code className="text-teal-300">$nearSphere</code>) for nearby food pickups.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-emerald-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Aggregation Pipelines</h3>
            <p className="text-sm text-slate-400">
              Demonstrates 6 MongoDB aggregation pipelines utilizing <code className="text-cyan-300">$match</code>, <code className="text-cyan-300">$unwind</code>, <code className="text-cyan-300">$group</code>, <code className="text-cyan-300">$sort</code>, and <code className="text-cyan-300">$avg</code> stages for analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Role Navigation Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">System Portals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div onClick={() => setActiveTab('donor')} className="glass-card p-5 rounded-xl border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                <Utensils className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold text-slate-400">Donor</span>
            </div>
            <h4 className="font-bold text-white mb-1">Donor Dashboard</h4>
            <p className="text-xs text-slate-400">Register food surplus with embedded food items & expiry time.</p>
          </div>

          <div onClick={() => setActiveTab('ngo')} className="glass-card p-5 rounded-xl border border-slate-800 hover:border-teal-500/40 cursor-pointer transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-lg bg-teal-500/10 text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all">
                <Heart className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold text-slate-400">NGO</span>
            </div>
            <h4 className="font-bold text-white mb-1">NGO Dashboard</h4>
            <p className="text-xs text-slate-400">Search nearby donations using 2dsphere location queries & request pickup.</p>
          </div>

          <div onClick={() => setActiveTab('volunteer')} className="glass-card p-5 rounded-xl border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
                <Truck className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold text-slate-400">Volunteer</span>
            </div>
            <h4 className="font-bold text-white mb-1">Volunteer Portal</h4>
            <p className="text-xs text-slate-400">Update pickup status & track completed deliveries.</p>
          </div>

          <div onClick={() => setActiveTab('insights')} className="glass-card p-5 rounded-xl border border-slate-800 hover:border-emerald-400 cursor-pointer transition-all group ring-1 ring-emerald-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-lg bg-emerald-500 text-slate-950 font-bold">
                <Database className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-emerald-400 uppercase">Viva Highlight</span>
            </div>
            <h4 className="font-bold text-white mb-1">Database Insights</h4>
            <p className="text-xs text-slate-400">Inspect raw MongoDB collections, indexes, and aggregation cards.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
