import React, { useState, useEffect } from 'react';
import { MapPin, Search, Heart, Clock, Truck, ShieldCheck, CheckCircle, Navigation, Building, Plus, RefreshCw, AlertTriangle } from 'lucide-react';
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
  const [lat, setLat] = useState(18.5204); // Default Pune center (Swargate/Shivajinagar)
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
        // Query 6: GEOSPATIAL QUERY ($nearSphere with 2dsphere index)
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

  return (
    <div className="space-y-6 py-4">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-teal-400" />
            <span>NGO Portal & Geospatial Food Search</span>
          </h1>
          <p className="text-sm text-slate-400">
            Find nearby food donations using MongoDB <code className="text-teal-300">2dsphere</code> geospatial indexing and GeoJSON coordinates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setUseGeoSearch(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                useGeoSearch ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Geospatial $near Mode
            </button>
            <button
              onClick={() => setUseGeoSearch(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !useGeoSearch ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Available
            </button>
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

      {/* Geospatial 2dsphere Query Tool */}
      {useGeoSearch && (
        <form onSubmit={handleGeoSearch} className="glass-panel p-5 rounded-2xl border border-teal-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-teal-400 font-bold text-sm">
              <Navigation className="w-4 h-4" />
              <span>MongoDB 2dsphere Geospatial Search Tool</span>
            </div>
            <span className="text-xs font-mono text-teal-300/80 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
              Query: GET /api/donations/nearby?distance={distanceKm * 1000}m
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Latitude (Pune)</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value) || 18.5204)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Longitude (Pune)</label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value) || 73.8567)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Max Distance: <span className="text-teal-400 font-bold">{distanceKm} km</span> ({distanceKm * 1000}m)
              </label>
              <input
                type="range"
                min="1"
                max="25"
                value={distanceKm}
                onChange={(e) => setDistanceKm(parseInt(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition-all text-sm shadow-lg shadow-teal-500/20"
              >
                <Search className="w-4 h-4" />
                <span>Run $near Query</span>
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
          <h2 className="text-lg font-semibold text-white flex items-center justify-between">
            <span>Available Food Surplus ({donations.length})</span>
            {useGeoSearch && <span className="text-xs font-normal text-teal-400">Showing results within {distanceKm} km radius</span>}
          </h2>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Searching MongoDB 2dsphere index...</div>
          ) : donations.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-2xl border border-slate-800 text-slate-400">
              No donations found within {distanceKm} km. Try increasing the search distance slider.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {donations.map((d) => (
                <div key={d.id} className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-teal-500/40 transition-all">
                  
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-mono text-teal-400 font-semibold">{d.id}</span>
                        <h3 className="text-base font-bold text-white mt-0.5">{d.category.replace('_', ' ')}</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {d.priority}
                      </span>
                    </div>

                    {/* Food Items List */}
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Surplus Items:</span>
                      {d.foodItems?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-200 font-medium">
                          <span>• {item.name}</span>
                          <span className="text-teal-300">{item.quantity} {item.unit}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-xs text-slate-400 space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className="truncate">{d.address}</span>
                      </div>
                      {d.location?.coordinates && (
                        <div className="text-[11px] font-mono text-slate-500">
                          GeoJSON: [{d.location.coordinates[0]}, {d.location.coordinates[1]}]
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Request Button */}
                  <button
                    onClick={() => setSelectedDonation(d)}
                    className="w-full py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition-all text-xs shadow-md shadow-teal-500/10 flex items-center justify-center space-x-1.5"
                  >
                    <Truck className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-slate-700 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Truck className="w-5 h-5 text-teal-400" />
                <span>Assign Pickup for Donation #{selectedDonation.id}</span>
              </h2>
              <button onClick={() => setSelectedDonation(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleRequestPickup} className="space-y-4">
              
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <div><strong className="text-white">Category:</strong> {selectedDonation.category}</div>
                <div><strong className="text-white">Address:</strong> {selectedDonation.address}</div>
                <div>
                  <strong className="text-white">Items:</strong>{' '}
                  {selectedDonation.foodItems?.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
                </div>
              </div>

              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Requesting Pickup as:</span>
                  <span className="font-semibold text-teal-300">{user?.name || 'Logged-in NGO'} ({user?.email})</span>
                  {user?.ngoId && <span className="text-[10px] text-teal-400 font-mono ml-2">NGO ID: {user?.ngoId}</span>}
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-teal-500/20 text-teal-400 font-mono font-bold uppercase">
                  {user?.role || 'NGO'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Volunteer (Optional)</label>
                {volunteers.length > 0 ? (
                  <select
                    value={selectedVolunteerId}
                    onChange={(e) => setSelectedVolunteerId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"
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
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400">
                      You can assign a volunteer later, or leave blank to allow registered volunteers to accept.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs text-teal-300 space-y-1">
                <strong className="text-teal-400 block font-semibold">MongoDB Document Reference Notice:</strong>
                <span>This action creates a <code className="text-white">Pickup</code> document storing references:</span>
                <div className="font-mono text-[11px] text-teal-200 mt-1">
                  donationId: "{selectedDonation.id}" | ngoId: "{user?.ngoId || 'N/A'}" | volunteerId: "{selectedVolunteerId}"
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedDonation(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition-all text-sm shadow-lg shadow-teal-500/20"
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
