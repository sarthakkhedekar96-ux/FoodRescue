import React, { useState, useEffect } from 'react';
import { MapPin, Search, Heart, Clock, Truck, RefreshCw } from 'lucide-react';
import { api } from '../api';
import ErrorState from '../components/ErrorState';
import { useAuth } from '../context/AuthContext';

export default function NgoDashboard() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Geospatial Search Filters
  const [useGeoSearch, setUseGeoSearch] = useState(true);
  const [lat, setLat] = useState(18.5204); // Default Pune center
  const [lng, setLng] = useState(73.8567);
  const [distanceKm, setDistanceKm] = useState(10); // 10 km radius

  // Pickup Modal
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (useGeoSearch) {
        const distanceMeters = distanceKm * 1000;
        data = await api.getNearbyDonations(lat, lng, distanceMeters);
      } else {
        data = await api.getAvailableDonations();
      }
      setDonations(data || []);
    } catch (err) {
      console.error('Failed to load NGO donations', err);
      setError(err);
    } finally {
      setLoading(false);
    }

    // Load volunteers separately: 403 on unassigned volunteer list must never turn the page offline
    try {
      const volData = await api.getVolunteers();
      setVolunteers(volData || []);
      if (volData && volData.length > 0) {
        setSelectedVolunteerId(prev => (prev && volData.some(v => v.id === prev)) ? prev : volData[0].id);
      }
    } catch (volErr) {
      console.warn('Volunteers list not accessible or empty:', volErr.message);
      setVolunteers([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [useGeoSearch, distanceKm]);

  const handleGeoSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleRequestPickup = async (e) => {
    e.preventDefault();
    if (!selectedDonation) return;

    try {
      await api.createPickup({
        donationId: selectedDonation.id,
        ngoId: user?.ngoId,
        volunteerId: selectedVolunteerId || null,
        status: 'ASSIGNED'
      });
      alert(`Pickup assigned successfully for donation ${selectedDonation.id}!`);
      setSelectedDonation(null);
      loadData();
    } catch (err) {
      alert('Failed to request pickup: ' + err.message);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'NORMAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E5EEDD] text-[#3D572C] border border-[#C6D8B8]">Normal</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F9EED9] text-[#8A5816] border border-[#E8D1A7]">High</span>;
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F8E7E3] text-[#963826] border border-[#E8C1B7]">Urgent</span>;
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F4E5E4] text-[#842E28] border border-[#DCBDBB]">Critical</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F5EEDB] text-[#6B5E52] border border-[#E3D9C8]">{priority || 'Available'}</span>;
    }
  };

  return (
    <div className="space-y-6 py-4" data-testid="ngo-dashboard">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-[#E3D9C8]">
        <div>
          <h1 className="text-2xl font-normal font-heading text-[#2B2118] tracking-wide flex items-center gap-2" data-testid="ngo-portal-heading">
            <Heart className="w-6 h-6 text-[#B23A25]" />
            <span>NGO Portal</span>
          </h1>
          <p className="text-xs text-[#6B5E52] mt-1">
            Discover available food donations from local donors and coordinate volunteer pickups.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1 bg-white p-1 rounded-md border border-[#E3D9C8]">
            <button
              onClick={() => setUseGeoSearch(true)}
              data-testid="toggle-nearby-btn"
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                useGeoSearch
                  ? 'bg-[#F5EEDB] text-[#B23A25] border border-[#E3D9C8]'
                  : 'text-[#6B5E52] hover:text-[#2B2118]'
              }`}
            >
              Nearby Proximity
            </button>
            <button
              onClick={() => setUseGeoSearch(false)}
              data-testid="toggle-all-available-btn"
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                !useGeoSearch
                  ? 'bg-[#F5EEDB] text-[#B23A25] border border-[#E3D9C8]'
                  : 'text-[#6B5E52] hover:text-[#2B2118]'
              }`}
            >
              All Available
            </button>
          </div>

          <button
            onClick={loadData}
            data-testid="refresh-ngo-btn"
            className="p-2 rounded-md border border-[#E3D9C8] text-[#6B5E52] hover:text-[#2B2118] hover:bg-white transition-colors bg-white"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Geospatial Query Panel */}
      {useGeoSearch && (
        <form onSubmit={handleGeoSearch} className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#2B2118]">
              <MapPin className="w-4 h-4 text-[#B23A25]" />
              <span>Search Location & Distance</span>
            </div>
            <span className="text-xs text-[#4B6B36] font-mono bg-[#F5EEDB] border border-[#E3D9C8] px-2 py-0.5 rounded">
              Radius: {distanceKm} km
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#6B5E52] mb-1">Center Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value) || 18.5204)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#E3D9C8] rounded-md text-xs text-[#2B2118] focus:border-[#B23A25] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#6B5E52] mb-1">Center Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value) || 73.8567)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#E3D9C8] rounded-md text-xs text-[#2B2118] focus:border-[#B23A25] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#6B5E52] mb-1">Distance (km): {distanceKm}</label>
              <input
                type="range"
                min="1"
                max="50"
                value={distanceKm}
                onChange={(e) => setDistanceKm(parseInt(e.target.value) || 10)}
                className="w-full mt-2 accent-[#B23A25]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full btn-primary text-xs py-2 flex items-center justify-center space-x-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Update Results</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Error State when Backend is Down */}
      {error ? (
        <ErrorState
          error={error}
          onRetry={loadData}
          loading={loading}
        />
      ) : (
        /* Donations Grid */
        <div className="space-y-4">
          <h2 className="text-base font-normal font-heading text-[#2B2118] tracking-wide flex items-center justify-between">
            <span>Available Food Surplus ({donations.length})</span>
            {useGeoSearch && <span className="text-xs font-normal text-[#6B5E52]">Within {distanceKm} km radius</span>}
          </h2>

          {loading ? (
            <div className="text-center py-12 text-xs text-[#6B5E52]">Searching available donations...</div>
          ) : donations.length === 0 ? (
            <div className="glass-card p-12 text-center text-xs text-[#6B5E52] space-y-3">
              <p className="text-sm text-[#2B2118] font-medium">No food available nearby right now.</p>
              <p className="text-xs text-[#6B5E52]">Check back soon or widen your search distance to see more community donations.</p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => setUseGeoSearch(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Show All Available
                </button>
                <button
                  onClick={loadData}
                  className="btn-primary text-xs px-4 py-2 inline-flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {donations.map((d) => (
                <div key={d.id} className="glass-card p-5 flex flex-col justify-between space-y-4">
                  
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-mono text-[#6B5E52]" data-testid={`ngo-donation-id-${d.id}`}>{d.id}</span>
                        <h3 className="text-base font-normal font-heading text-[#2B2118] mt-0.5 tracking-wide">
                          {d.category?.replace('_', ' ')}
                        </h3>
                      </div>
                      {getPriorityBadge(d.priority)}
                    </div>

                    {/* Food Items List */}
                    <div className="bg-[#FBF6EC] p-3 rounded-md border border-[#E3D9C8] space-y-1.5">
                      <span className="text-[11px] text-[#6B5E52] uppercase font-semibold block">Surplus Items:</span>
                      {d.foodItems?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-[#2B2118]">
                          <span>• {item.name}</span>
                          <span className="font-semibold text-[#4B6B36]">{item.quantity} {item.unit}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-xs text-[#6B5E52] space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#B23A25] shrink-0" />
                        <span className="truncate">{d.address}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#8A5816] shrink-0" />
                        <span>Expires: {new Date(d.expiryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Request Button */}
                  <button
                    onClick={() => setSelectedDonation(d)}
                    data-testid={`request-pickup-${d.id}`}
                    className="w-full btn-primary text-xs py-2 flex items-center justify-center space-x-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Request Pickup</span>
                  </button>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pickup Request Modal */}
      {selectedDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="glass-panel w-full max-w-lg p-6 rounded-lg bg-white border border-[#E3D9C8] space-y-5">
            
            <div className="flex items-center justify-between border-b border-[#E3D9C8] pb-3">
              <h2 className="text-lg font-normal font-heading text-[#2B2118] tracking-wide flex items-center space-x-2">
                <Truck className="w-5 h-5 text-[#B23A25]" />
                <span>Request Pickup for #{selectedDonation.id}</span>
              </h2>
              <button 
                onClick={() => setSelectedDonation(null)} 
                className="text-[#8C7E72] hover:text-[#2B2118] font-bold text-base px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestPickup} className="space-y-4">
              
              <div className="bg-[#FBF6EC] p-3.5 rounded-md border border-[#E3D9C8] text-xs text-[#6B5E52] space-y-1">
                <div><strong className="text-[#2B2118]">Category:</strong> {selectedDonation.category}</div>
                <div><strong className="text-[#2B2118]">Pickup Address:</strong> {selectedDonation.address}</div>
                <div>
                  <strong className="text-[#2B2118]">Items:</strong>{' '}
                  {selectedDonation.foodItems?.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
                </div>
              </div>

              <div className="p-3 bg-[#FBF6EC] border border-[#E3D9C8] rounded-md flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#6B5E52] block text-[11px]">Requesting as:</span>
                  <span className="font-semibold text-[#2B2118]">{user?.name || 'Logged-in NGO'} ({user?.email})</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#F5EEDB] text-[#4B6B36] border border-[#E3D9C8] font-bold uppercase">
                  {user?.role || 'NGO'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2118] mb-1">Assign Volunteer (Optional)</label>
                {volunteers.length > 0 ? (
                  <select
                    value={selectedVolunteerId}
                    onChange={(e) => setSelectedVolunteerId(e.target.value)}
                    className="w-full bg-white border border-[#E3D9C8] rounded-md px-3 py-2 text-xs text-[#2B2118] focus:border-[#B23A25] focus:outline-none"
                  >
                    <option value="">-- No volunteer assigned yet (open for pickup) --</option>
                    {volunteers.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.vehicleType} • Status: {v.availability})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="Enter Volunteer ID (optional)"
                      value={selectedVolunteerId}
                      onChange={(e) => setSelectedVolunteerId(e.target.value)}
                      className="w-full bg-white border border-[#E3D9C8] rounded-md px-3 py-2 text-xs text-[#2B2118] focus:border-[#B23A25] focus:outline-none"
                    />
                    <p className="text-[11px] text-[#6B5E52]">
                      You can assign a volunteer later, or leave blank to allow registered volunteers to accept.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E3D9C8]">
                <button
                  type="button"
                  onClick={() => setSelectedDonation(null)}
                  className="px-4 py-2 rounded-md text-[#6B5E52] hover:text-[#2B2118] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="confirm-pickup-submit"
                  className="btn-primary text-xs px-5 py-2"
                >
                  Confirm Pickup Request
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
