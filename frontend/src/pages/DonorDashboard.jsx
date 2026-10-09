import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, MapPin, Tag, Utensils, AlertTriangle, CheckCircle2, RefreshCw, UserPlus } from 'lucide-react';
import { api } from '../api';
import ErrorState from '../components/ErrorState';
import { useAuth } from '../context/AuthContext';

export default function DonorDashboard() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Donation Form state
  const [category, setCategory] = useState('COOKED_FOOD');
  const [foodItems, setFoodItems] = useState([
    { name: '', quantity: 1, unit: 'KG' }
  ]);
  const [expiryHours, setExpiryHours] = useState(4);
  const [address, setAddress] = useState('');
  const [longitude, setLongitude] = useState(73.8567);
  const [latitude, setLatitude] = useState(18.5204);

  const loadDonations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDonations();
      setDonations(data || []);
    } catch (err) {
      console.error('Failed to load donations', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadDonations();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete donation #${id} from MongoDB Atlas?`)) return;
    try {
      await api.deleteDonation(id);
      loadDonations();
    } catch (err) {
      if (err.status === 403 || err.message?.includes('403') || err.message?.includes('Access denied')) {
        alert('Permission Denied (403): You can only delete your own donations while their status is AVAILABLE and no pickup is active.');
      } else {
        alert('Failed to delete donation: ' + err.message);
      }
    }
  };

  const handleAddFoodItem = () => {
    setFoodItems([...foodItems, { name: '', quantity: 1, unit: 'KG' }]);
  };

  const handleRemoveFoodItem = (index) => {
    setFoodItems(foodItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...foodItems];
    updated[index][field] = value;
    setFoodItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const now = new Date();
    const expiryAt = new Date(now.getTime() + expiryHours * 60 * 60 * 1000).toISOString();
    const preparedAt = now.toISOString();

    const payload = {
      donorId: user?.id,
      foodItems,
      category,
      preparedAt,
      expiryAt,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude) || 73.8567, parseFloat(latitude) || 18.5204]
      },
      address: address || 'Pickup Location',
      status: 'AVAILABLE'
    };

    try {
      await api.createDonation(payload);
      setShowModal(false);
      setFoodItems([{ name: '', quantity: 1, unit: 'KG' }]);
      setAddress('');
      loadDonations();
    } catch (err) {
      alert('Error creating donation: ' + err.message);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'NORMAL':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">NORMAL (&gt;3h)</span>;
      case 'HIGH':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">HIGH (1-3h)</span>;
      case 'URGENT':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">URGENT (30-60m)</span>;
      case 'CRITICAL':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">CRITICAL (&lt;30m)</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">EXPIRED</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-slate-950">AVAILABLE</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500 text-slate-950">ACCEPTED</span>;
      case 'PICKED_UP':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950">PICKED UP</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-400 text-slate-950">COMPLETED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-700 text-slate-300">{status}</span>;
    }
  };

  const availableCount = donations.filter(d => d.status === 'AVAILABLE').length;
  const completedCount = donations.filter(d => d.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 py-4">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Utensils className="w-6 h-6 text-emerald-400" />
            <span>Donor Portal</span>
          </h1>
          <p className="text-sm text-slate-400">
            Register surplus food. Demonstrates <code className="text-emerald-300">foodItems[]</code> embedded documents and MongoDB insertion.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadDonations}
            className="p-2.5 rounded-xl glass-card text-slate-300 hover:text-white hover:bg-slate-800 transition-all border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Register Surplus Food</span>
          </button>
        </div>
      </div>

      {/* Error State when Backend is Down */}
      {error ? (
        <ErrorState
          error={error}
          onRetry={loadDonations}
          loading={loading}
        />
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-400">Total Registered</span>
              <p className="text-3xl font-extrabold text-white mt-1">{donations.length}</p>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <span className="text-xs font-semibold text-emerald-400">Available for NGO Pickup</span>
              <p className="text-3xl font-extrabold text-emerald-400 mt-1">{availableCount}</p>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <span className="text-xs font-semibold text-teal-400">Successfully Redistributed</span>
              <p className="text-3xl font-extrabold text-teal-300 mt-1">{completedCount}</p>
            </div>
          </div>

          {/* Donations List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Surplus Food Donations</h2>

            {loading ? (
              <div className="text-center py-12 text-slate-400">Loading MongoDB donations...</div>
            ) : donations.length === 0 ? (
              <div className="glass-card p-12 text-center rounded-2xl border border-slate-800 text-slate-400 space-y-3">
                <p>No donations registered yet. Click "Register Surplus Food" to create one.</p>
              </div>
            ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {donations.map((d) => (
              <div key={d.id} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-emerald-500/30 transition-all">
                
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">{d.id}</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">{d.category.replace('_', ' ')}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getPriorityBadge(d.priority)}
                    {getStatusBadge(d.status)}
                    {((user?.role === 'ADMIN') || (d.status === 'AVAILABLE' && d.donorId === user?.id)) && (
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all ml-1"
                        title="Delete from MongoDB"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Embedded FoodItems Array Demonstration */}
                <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Embedded foodItems[]</span>
                    <span className="text-[10px] text-emerald-400 font-normal">MongoDB Embedded Array</span>
                  </div>
                  <div className="space-y-1">
                    {d.foodItems?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm font-medium text-slate-200">
                        <span>• {item.name}</span>
                        <span className="text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded text-xs">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location & Time info */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <div className="flex items-center space-x-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{d.address}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 justify-end">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Expires: {new Date(d.expiryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Status Audit History Array */}
                {d.statusHistory && (
                  <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span>Status History Steps: {d.statusHistory.length}</span>
                    <span className="font-mono text-slate-400">
                      Latest: {d.statusHistory[d.statusHistory.length - 1]?.status}
                    </span>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
      </>
      )}

      {/* Modal for Creating Surplus Donation */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel w-full max-w-xl p-6 rounded-3xl border border-slate-700 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Utensils className="w-5 h-5 text-emerald-400" />
                <span>Register Food Surplus (Embedded Mongo Document)</span>
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Donating as:</span>
                  <span className="font-semibold text-emerald-300">{user?.name || 'Logged-in Donor'} ({user?.email})</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-mono font-bold uppercase">
                  {user?.role || 'DONOR'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Food Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="COOKED_FOOD">COOKED FOOD (Biryani, Curry, Chapati)</option>
                  <option value="PACKAGED_FOOD">PACKAGED FOOD (Sandwiches, Biscuits)</option>
                  <option value="BAKERY">BAKERY (Bread, Muffins, Cakes)</option>
                  <option value="RAW_INGREDIENTS">RAW INGREDIENTS (Vegetables, Rice)</option>
                  <option value="FROZEN">FROZEN FOOD</option>
                  <option value="VEGETABLES_FRUITS">VEGETABLES & FRUITS</option>
                </select>
              </div>

              {/* Dynamic Embedded Food Items Form */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Food Items (Embedded Document Array in MongoDB)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddFoodItem}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {foodItems.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <input
                      type="text"
                      placeholder="Item Name (e.g. Veg Rice)"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      required
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      required
                      className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="KG">KG</option>
                      <option value="PCS">PCS</option>
                      <option value="PACKETS">PACKETS</option>
                      <option value="LITER">LITER</option>
                    </select>
                    {foodItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFoodItem(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Expiry Hours */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Expiry Time (Hours from now) — Triggers Business Priority Rule
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.25"
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pickup Address</label>
                <input
                  type="text"
                  placeholder="Enter pickup address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* GeoJSON Coordinates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Longitude (73.8567)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Latitude (18.5204)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-all text-sm shadow-lg shadow-emerald-500/20"
                >
                  Save to MongoDB
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
