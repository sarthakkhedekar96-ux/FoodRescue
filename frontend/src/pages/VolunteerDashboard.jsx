import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, PackageCheck, Star, RefreshCw } from 'lucide-react';
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
      alert('Thank you! Feedback recorded successfully.');
      setFeedbackDonationId(null);
      setComment('');
      loadData();
    } catch (err) {
      alert('Error submitting feedback: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 py-4" data-testid="volunteer-dashboard">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#E3D9C8]">
        <div>
          <h1 className="text-2xl font-normal font-heading text-[#2B2118] tracking-wide flex items-center gap-2" data-testid="volunteer-portal-heading">
            <Truck className="w-6 h-6 text-[#B23A25]" />
            <span>Volunteer Deliveries</span>
          </h1>
          <p className="text-xs text-[#6B5E52] mt-1">
            Pickups assigned to <strong className="text-[#2B2118] font-semibold">{user?.name}</strong>. Update progress from collection through delivery.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3 py-1.5 rounded-md bg-white border border-[#E3D9C8] text-xs font-mono text-[#6B5E52]">
            Volunteer ID: {user?.volunteerId || user?.id}
          </div>

          <button
            onClick={loadData}
            data-testid="refresh-volunteer-btn"
            className="p-2 rounded-md border border-[#E3D9C8] text-[#6B5E52] hover:text-[#2B2118] hover:bg-white transition-colors bg-white"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs text-[#6B5E52]">Loading assigned pickups...</div>
      ) : error ? (
        <ErrorState
          error={error}
          onRetry={loadData}
          loading={loading}
        />
      ) : pickups.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-lg space-y-3">
          <Truck className="w-10 h-10 text-[#8C7E72] mx-auto" />
          <h3 className="text-base font-normal font-heading text-[#2B2118] tracking-wide">No pickups assigned right now</h3>
          <p className="text-xs text-[#6B5E52] max-w-sm mx-auto">
            You're all caught up! When a shelter assigns a fresh food pickup to you, details will appear here.
          </p>
          <div className="pt-2">
            <button
              onClick={loadData}
              className="btn-secondary text-xs px-4 py-2 inline-flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Check for New Runs</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pickups.map((pickup) => (
            <div key={pickup.id} className="glass-card p-5 flex flex-col justify-between space-y-4">
              
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-mono text-[#6B5E52] uppercase tracking-wider block">Pickup ID</span>
                    <h3 className="text-base font-normal font-heading text-[#2B2118] font-mono tracking-wide">#{pickup.id}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                    pickup.status === 'DELIVERED'
                      ? 'bg-[#E2EBDC] text-[#375225] border border-[#BFD4B3]'
                      : pickup.status === 'PICKED_UP'
                      ? 'bg-[#F8E7E3] text-[#963826] border border-[#E8C1B7]'
                      : 'bg-[#F9EED9] text-[#8A5816] border border-[#E8D1A7]'
                  }`}>
                    {pickup.status}
                  </span>
                </div>

                {/* Details Box */}
                <div className="p-3 bg-[#FBF6EC] rounded-md border border-[#E3D9C8] text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-[#6B5E52]">
                    <span>Donation ID:</span>
                    <span className="text-[#2B2118] font-semibold">{pickup.donationId}</span>
                  </div>
                  <div className="flex justify-between text-[#6B5E52]">
                    <span>Shelter ID:</span>
                    <span className="text-[#2B2118]">{pickup.ngoId}</span>
                  </div>
                  <div className="flex justify-between text-[#6B5E52]">
                    <span>Assigned:</span>
                    <span className="text-[#2B2118] text-[11px]">
                      {pickup.assignedAt ? new Date(pickup.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Workflow Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                {pickup.status === 'ASSIGNED' && (
                  <button
                    onClick={() => handleUpdateStatus(pickup.id, 'PICKED_UP')}
                    data-testid={`confirm-collected-${pickup.id}`}
                    className="w-full btn-primary text-xs py-2.5 flex items-center justify-center space-x-1.5"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Confirm Food Collected</span>
                  </button>
                )}

                {pickup.status === 'PICKED_UP' && (
                  <button
                    onClick={() => handleUpdateStatus(pickup.id, 'DELIVERED')}
                    data-testid={`confirm-delivered-${pickup.id}`}
                    className="w-full btn-leaf text-xs py-2.5 flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Delivery to NGO</span>
                  </button>
                )}

                {pickup.status === 'DELIVERED' && (
                  <button
                    onClick={() => setFeedbackDonationId(pickup.donationId)}
                    data-testid={`add-feedback-${pickup.id}`}
                    className="w-full py-2 rounded-md bg-white hover:bg-[#FAF3E5] text-[#8A5816] font-semibold text-xs border border-[#E3D9C8] flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Star className="w-3.5 h-3.5 fill-[#8A5816] text-[#8A5816]" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="glass-panel w-full max-w-md rounded-lg p-6 bg-white border border-[#E3D9C8] space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[#E3D9C8] pb-3">
              <div>
                <h2 className="text-lg font-normal font-heading text-[#2B2118] tracking-wide flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#8A5816] fill-[#8A5816]" />
                  <span>Leave Rescue Feedback</span>
                </h2>
                <p className="text-xs text-[#6B5E52] mt-0.5">
                  Rate the food handover and sharing condition.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackDonationId(null)}
                className="text-[#8C7E72] hover:text-[#2B2118] text-base font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2B2118] mb-2">Quality & Condition Rating</label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none"
                    >
                      <Star className={`w-6 h-6 ${star <= rating ? 'fill-[#8A5816] text-[#8A5816]' : 'text-[#E3D9C8]'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#2B2118] ml-2">{rating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2118] mb-1">Feedback Comments</label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. Excellent packaging, fast collection, food was completely warm and fresh."
                  className="w-full bg-white border border-[#E3D9C8] rounded-md p-2.5 text-xs text-[#2B2118] focus:border-[#B23A25] focus:outline-none"
                  required
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E3D9C8]">
                <button
                  type="button"
                  onClick={() => setFeedbackDonationId(null)}
                  className="px-4 py-2 rounded-md text-[#6B5E52] hover:text-[#2B2118] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-feedback-btn"
                  className="btn-primary text-xs px-5 py-2"
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
