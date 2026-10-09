import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, Clock, PackageCheck, Star, MessageSquare, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import ErrorState from '../components/ErrorState';
import { useAuth } from '../context/AuthContext';

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Feedback Modal
  const [feedbackDonationId, setFeedbackDonationId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPickups();
      setPickups(data || []);
    } catch (err) {
      console.error('Failed to load volunteer pickups', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (pickupId, newStatus) => {
    try {
      await api.updatePickupStatus(pickupId, newStatus);
      loadData();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackDonationId) return;

    try {
      await api.createFeedback({
        donationId: feedbackDonationId,
        fromUserId: user?.id,
        rating,
        comment: comment || 'Food rescue completed successfully.'
      });
      alert('Feedback recorded for aggregation calculation!');
      setFeedbackDonationId(null);
      setComment('');
      loadData();
    } catch (err) {
      alert('Error submitting feedback: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 py-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-400" />
            <span>Volunteer Pickup & Delivery Workflow</span>
          </h1>
          <p className="text-sm text-slate-400">
            Assigned pickups for <strong className="text-amber-300 font-semibold">{user?.name}</strong>. Manage lifecycle status transitions from pickup to delivery.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-300">
            Volunteer ID: {user?.volunteerId || user?.id}
          </div>

          <button
            onClick={loadData}
            className="p-2 rounded-xl glass-card text-slate-300 hover:text-white hover:bg-slate-800 transition-all border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading assigned pickups...</div>
      ) : error ? (
        <ErrorState
          error={error}
          onRetry={loadData}
          loading={loading}
        />
      ) : pickups.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-slate-800 space-y-3">
          <Truck className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Pickups Assigned</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You do not currently have any active pickups assigned to your volunteer account. When an NGO dispatches a food rescue to you, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pickups.map((pickup) => (
            <div key={pickup.id} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 hover:border-amber-500/30 transition-all">
              
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Pickup Record</span>
                  <h3 className="text-base font-bold text-white font-mono">#{pickup.id}</h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  pickup.status === 'DELIVERED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : pickup.status === 'PICKED_UP'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                }`}>
                  {pickup.status}
                </span>
              </div>

              {/* References Schema Inspection Box */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 text-xs space-y-1 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Donation Ref:</span>
                  <span className="text-amber-400 font-semibold">{pickup.donationId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>NGO Ref:</span>
                  <span className="text-teal-400">{pickup.ngoId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Assigned At:</span>
                  <span className="text-slate-300 text-[10px]">
                    {pickup.assignedAt ? new Date(pickup.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Action Workflow Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                {pickup.status === 'ASSIGNED' && (
                  <button
                    onClick={() => handleUpdateStatus(pickup.id, 'PICKED_UP')}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold hover:from-amber-400 hover:to-yellow-400 transition-all text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Confirm Food Collected</span>
                  </button>
                )}

                {pickup.status === 'PICKED_UP' && (
                  <button
                    onClick={() => handleUpdateStatus(pickup.id, 'DELIVERED')}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:from-emerald-400 hover:to-teal-400 transition-all text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Delivery to NGO</span>
                  </button>
                )}

                {pickup.status === 'DELIVERED' && (
                  <button
                    onClick={() => setFeedbackDonationId(pickup.donationId)}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-semibold text-xs border border-amber-500/30 flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>Add Rescue Rating / Feedback</span>
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Volunteer Feedback Modal */}
      {feedbackDonationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 border border-amber-500/30 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span>Leave Rescue Feedback</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Feeds into the MongoDB aggregation pipeline for average rating calculations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackDonationId(null)}
                className="text-slate-400 hover:text-white text-lg font-mono p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Quality & Experience Rating</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star className={`w-7 h-7 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-amber-400 ml-2">{rating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Feedback Comments</label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. Excellent packaging, fast collection, food was completely warm and fresh."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                  required
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setFeedbackDonationId(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-all text-sm shadow-lg shadow-amber-500/20"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
