import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Award, Star, Utensils, PieChart, BarChart3, RefreshCw } from 'lucide-react';
import { api } from '../api';
import ErrorState from '../components/ErrorState';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-8 py-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-cyan-400" />
            <span>Admin Analytics & Aggregation Pipelines</span>
          </h1>
          <p className="text-sm text-slate-400">
            Real-time analytics powered by MongoDB Aggregation Pipelines (<code className="text-cyan-300">$group, $unwind, $avg, $sum, $sort</code>).
          </p>
        </div>

        <button
          onClick={loadStats}
          className="p-2.5 rounded-xl glass-card text-slate-300 hover:text-white hover:bg-slate-800 transition-all border border-slate-700 flex items-center space-x-2 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Execute Aggregations</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Running MongoDB Aggregation Pipelines...</div>
      ) : error ? (
        <ErrorState
          error={error}
          onRetry={loadStats}
          loading={loading}
        />
      ) : !stats ? (
        <div className="text-center py-16 text-slate-400">Unable to load aggregation analytics.</div>
      ) : (
        <div className="space-y-8">
          
          {/* Top Aggregation Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aggregation 1</span>
              <p className="text-sm font-semibold text-slate-300">Total Donations</p>
              <p className="text-3xl font-extrabold text-white">{stats.totalDonations}</p>
              <span className="text-[11px] text-slate-500 font-mono block">mongoTemplate.count()</span>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Aggregation 6</span>
              <p className="text-sm font-semibold text-emerald-300">Total Surplus Donated</p>
              <p className="text-3xl font-extrabold text-emerald-400">{stats.totalFoodQuantity} <span className="text-base font-normal">Units</span></p>
              <span className="text-[11px] text-emerald-400/70 font-mono block">$unwind + $group $sum</span>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Aggregation 5</span>
              <p className="text-sm font-semibold text-amber-300">Average Feedback Rating</p>
              <p className="text-3xl font-extrabold text-amber-400 flex items-center space-x-1.5">
                <span>{stats.averageRating}</span>
                <Star className="w-6 h-6 fill-amber-400 text-amber-400 inline" />
              </p>
              <span className="text-[11px] text-amber-400/70 font-mono block">$group $avg("$rating")</span>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Aggregation 4</span>
              <p className="text-sm font-semibold text-cyan-300">Available vs Completed</p>
              <p className="text-2xl font-extrabold text-white">
                <span className="text-emerald-400">{stats.statusDistribution?.AVAILABLE || 0} Avail</span>
                <span className="text-slate-500 mx-1.5">/</span>
                <span className="text-teal-300">{stats.statusDistribution?.COMPLETED || 0} Done</span>
              </p>
              <span className="text-[11px] text-cyan-400/70 font-mono block">$group by "$status"</span>
            </div>

          </div>

          {/* Aggregation 2: Category Distribution Breakdown */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  <span>Aggregation 2: Donations by Food Category</span>
                </h3>
                <p className="text-xs text-slate-400">
                  MongoDB Pipeline: <code className="text-emerald-300">$group _id: "$category", count: &#123;$sum: 1&#125;</code> + <code className="text-emerald-300">$sort</code>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {stats.categoryDistribution?.map((cat, idx) => {
                const maxCount = Math.max(...stats.categoryDistribution.map(c => c.count), 1);
                const percent = Math.round((cat.count / maxCount) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                      <span>{cat.category.replace('_', ' ')}</span>
                      <span className="text-emerald-400 font-mono">{cat.count} Donations ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Aggregation 3: Top Donors Leaderboard */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Aggregation 3: Top Donors Leaderboard</span>
              </h3>
              <p className="text-xs text-slate-400">
                MongoDB Pipeline: <code className="text-amber-300">$group _id: "$donorId", $sort: -1, $limit: 5</code>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {stats.topDonors?.map((donor, idx) => (
                <div key={idx} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-extrabold text-sm border border-amber-500/20 shrink-0">
                    #{idx + 1}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-white text-sm truncate">{donor.donorName}</h4>
                    <span className="text-xs font-mono text-amber-400 font-semibold">{donor.donationCount} Donations</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
