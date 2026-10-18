import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Award, Star, BarChart3, RefreshCw } from 'lucide-react';
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
    <div className="space-y-8 py-4" data-testid="admin-dashboard">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#E3D9C8]">
        <div>
          <h1 className="text-2xl font-normal font-heading text-[#2B2118] tracking-wide flex items-center gap-2" data-testid="admin-heading">
            <LayoutDashboard className="w-6 h-6 text-[#B23A25]" />
            <span>Network Analytics & Oversight</span>
          </h1>
          <p className="text-xs text-[#6B5E52] mt-1">
            Real-time overview of surplus food rescued, partner participation, and quality metrics across the platform.
          </p>
        </div>

        <button
          onClick={loadStats}
          data-testid="refresh-admin-stats-btn"
          className="btn-secondary text-xs px-3.5 py-2 flex items-center space-x-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs text-[#6B5E52]">Compiling network analytics...</div>
      ) : error ? (
        <ErrorState
          error={error}
          onRetry={loadStats}
          loading={loading}
        />
      ) : !stats ? (
        <div className="text-center py-16 text-xs text-[#6B5E52]">Unable to load analytics.</div>
      ) : (
        <div className="space-y-8">
          
          {/* Top Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="glass-card p-5 space-y-1">
              <span className="text-xs font-semibold text-[#6B5E52]">Total Donations</span>
              <p className="text-3xl font-normal font-heading text-[#2B2118]">{stats.totalDonations}</p>
              <p className="text-[11px] text-[#8C7E72]">All-time registered contributions</p>
            </div>

            <div className="glass-card p-5 space-y-1">
              <span className="text-xs font-semibold text-[#B23A25]">Portions Rescued</span>
              <p className="text-3xl font-normal font-heading text-[#B23A25]">
                {stats.totalFoodQuantity} <span className="text-sm font-normal text-[#6B5E52]">Units</span>
              </p>
              <p className="text-[11px] text-[#8C7E72]">Diverted from landfill waste</p>
            </div>

            <div className="glass-card p-5 space-y-1">
              <span className="text-xs font-semibold text-[#8A5816]">Average Shelter Rating</span>
              <p className="text-3xl font-normal font-heading text-[#8A5816] flex items-center space-x-1.5">
                <span>{stats.averageRating ? stats.averageRating : 'N/A'}</span>
                {stats.averageRating > 0 && <Star className="w-5 h-5 fill-[#8A5816] text-[#8A5816] inline" />}
              </p>
              <p className="text-[11px] text-[#8C7E72]">Based on volunteer delivery feedback</p>
            </div>

            <div className="glass-card p-5 space-y-1">
              <span className="text-xs font-semibold text-[#6B5E52]">Available vs Completed</span>
              <p className="text-2xl font-normal font-heading text-[#2B2118]">
                <span className="text-[#4B6B36]">{stats.statusDistribution?.AVAILABLE || 0} Avail</span>
                <span className="text-[#8C7E72] mx-1.5 font-normal">/</span>
                <span className="text-[#375225]">{stats.statusDistribution?.COMPLETED || 0} Done</span>
              </p>
              <p className="text-[11px] text-[#8C7E72]">Active pipeline distribution</p>
            </div>

          </div>

          {/* Category Distribution Breakdown */}
          <div className="glass-card p-6 space-y-5">
            <div>
              <h3 className="text-base font-normal font-heading text-[#2B2118] tracking-wide flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-[#B23A25]" />
                <span>Food Donations by Category</span>
              </h3>
              <p className="text-xs text-[#6B5E52] mt-0.5">
                Breakdown of food types registered by participating kitchens and suppliers.
              </p>
            </div>

            {(!stats.categoryDistribution || stats.categoryDistribution.length === 0) ? (
              <div className="py-6 text-center text-xs text-[#6B5E52]">
                No categories recorded yet. Breakdown will display once donations are added.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.categoryDistribution?.map((cat, idx) => {
                  const maxCount = Math.max(...stats.categoryDistribution.map(c => c.count), 1);
                  const percent = Math.round((cat.count / maxCount) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-[#2B2118]">
                        <span>{cat.category?.replace('_', ' ')}</span>
                        <span className="text-[#4B6B36] font-mono">{cat.count} Donations ({percent}%)</span>
                      </div>
                      <div className="w-full bg-[#F5EEDB] rounded-full h-2 overflow-hidden border border-[#E3D9C8]">
                        <div
                          className="bg-[#B23A25] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Donors Leaderboard */}
          <div className="glass-card p-6 space-y-5">
            <div>
              <h3 className="text-base font-normal font-heading text-[#2B2118] tracking-wide flex items-center space-x-2">
                <Award className="w-4 h-4 text-[#8A5816]" />
                <span>Top Contributing Food Donors</span>
              </h3>
              <p className="text-xs text-[#6B5E52] mt-0.5">
                Organizations with the highest volume of rescued meals.
              </p>
            </div>

            {(!stats.topDonors || stats.topDonors.length === 0) ? (
              <div className="py-6 text-center text-xs text-[#6B5E52]">
                No donor contributions recorded yet. New partner contributions will appear here.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {stats.topDonors?.map((donor, idx) => (
                  <div key={idx} className="bg-[#FBF6EC] p-4 rounded-md border border-[#E3D9C8] flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-[#F5EEDB] text-[#8A5816] flex items-center justify-center font-bold text-xs border border-[#E8D1A7] shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-semibold text-[#2B2118] text-xs truncate">{donor.donorName}</h4>
                      <span className="text-[11px] font-mono text-[#4B6B36] font-medium">{donor.donationCount} Donations</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
