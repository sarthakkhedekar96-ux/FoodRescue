import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, MapPin, Utensils, RefreshCw } from 'lucide-react';
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
    if (!window.confirm(`Delete donation #${id}?`)) return;
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
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E5EEDD] text-[#3D572C] border border-[#C6D8B8]">Normal (&gt;3h)</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F9EED9] text-[#8A5816] border border-[#E8D1A7]">High (1-3h)</span>;
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F8E7E3] text-[#963826] border border-[#E8C1B7]">Urgent (30-60m)</span>;
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F4E5E4] text-[#842E28] border border-[#DCBDBB]">Critical (&lt;30m)</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F5EEDB] text-[#6B5E52] border border-[#E3D9C8]">Expired</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#E5EEDD] text-[#3D572C] border border-[#C6D8B8]">AVAILABLE</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#F9EED9] text-[#8A5816] border border-[#E8D1A7]">ACCEPTED</span>;
      case 'PICKED_UP':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#F8E7E3] text-[#963826] border border-[#E8C1B7]">PICKED UP</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#E2EBDC] text-[#375225] border border-[#BFD4B3]">COMPLETED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#F5EEDB] text-[#6B5E52] border border-[#E3D9C8]">{status}</span>;
    }
  };

  const availableCount = donations.filter(d => d.status === 'AVAILABLE').length;
  const completedCount = donations.filter(d => d.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 py-4" data-testid="donor-dashboard">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#E3D9C8]">
        <div>
          <h1 className="text-2xl font-normal font-heading text-[#2B2118] tracking-wide flex items-center gap-2" data-testid="donor-portal-heading">
            <Utensils className="w-6 h-6 text-[#B23A25]" />
            <span>Donor Portal</span>
          </h1>
          <p className="text-xs text-[#6B5E52] mt-1">
            Register surplus food and track donations ready for shelter collection.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadDonations}
            data-testid="refresh-donations-btn"
            className="p-2 rounded-md border border-[#E3D9C8] text-[#6B5E52] hover:text-[#2B2118] hover:bg-white transition-colors bg-white"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowModal(true)}
            data-testid="register-surplus-btn"
            className="btn-primary text-xs px-4 py-2 flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
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
            <div className="glass-card p-5 space-y-1">
              <span className="text-xs font-semibold text-[#6B5E52]">Total Registered</span>
              <p className="text-2xl font-normal font-heading text-[#2B2118]">{donations.length}</p>
            </div>
            <div className="glass-card p-5 space-y-1">
              <span className="text-xs font-semibold text-[#4B6B36]">Available for Collection</span>
              <p className="text-2xl font-normal font-heading text-[#4B6B36]">{availableCount}</p>
            </div>
            <div className="glass-card p-5 space-y-1">
              <span className="text-xs font-semibold text-[#6B5E52]">Successfully Redistributed</span>
              <p className="text-2xl font-normal font-heading text-[#2B2118]">{completedCount}</p>
            </div>
          </div>

          {/* Donations List */}
          <div className="space-y-4">
            <h2 className="text-base font-normal font-heading text-[#2B2118] tracking-wide">Surplus Food Donations</h2>

            {loading ? (
              <div className="text-center py-12 text-xs text-[#6B5E52]">Loading donations...</div>
            ) : donations.length === 0 ? (
              <div className="glass-card p-12 text-center text-xs text-[#6B5E52] space-y-3">
                <p className="text-sm text-[#2B2118] font-medium">No food donations posted yet.</p>
                <p className="text-xs text-[#6B5E52]">Have surplus food to share? Post your first donation to help nearby shelters.</p>
                <div className="pt-2">
                  <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary text-xs px-4 py-2 inline-flex items-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register Surplus Food</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {donations.map((d) => (
                  <div key={d.id} className="glass-card p-5 space-y-4">
                    
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-mono font-medium text-[#6B5E52]" data-testid={`donation-id-${d.id}`}>{d.id}</span>
                        <h3 className="text-base font-normal font-heading text-[#2B2118] mt-0.5 tracking-wide">
                          {d.category?.replace('_', ' ')}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getPriorityBadge(d.priority)}
                        {getStatusBadge(d.status)}
                        {((user?.role === 'ADMIN') || (d.status === 'AVAILABLE' && d.donorId === user?.id)) && (
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="p-1 rounded text-[#B23A25] hover:bg-[#F8E7E3] transition-colors ml-1"
                            title="Delete donation"
                            data-testid={`delete-donation-${d.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Food Items List */}
                    <div className="bg-[#FBF6EC] rounded-md p-3 border border-[#E3D9C8] space-y-1.5">
                      <div className="text-[11px] font-semibold text-[#6B5E52] uppercase tracking-wider">
                        Food Items Included
                      </div>
                      <div className="space-y-1">
                        {d.foodItems?.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-[#2B2118]">
                            <span>• {item.name}</span>
                            <span className="font-semibold text-[#4B6B36] bg-[#F5EEDB] border border-[#E3D9C8] px-2 py-0.5 rounded text-[11px]">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Location & Time info */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-[#6B5E52]">
                      <div className="flex items-center space-x-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#B23A25] shrink-0" />
                        <span className="truncate">{d.address}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 justify-end">
                        <Clock className="w-3.5 h-3.5 text-[#8A5816] shrink-0" />
                        <span>Expires: {new Date(d.expiryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Status Steps */}
                    {d.statusHistory && (
                      <div className="text-[11px] text-[#8C7E72] pt-2 border-t border-[#E3D9C8] flex items-center justify-between">
                        <span>Milestones: {d.statusHistory.length}</span>
                        <span className="font-medium text-[#2B2118]">
                          Current: {d.statusHistory[d.statusHistory.length - 1]?.status}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="glass-panel w-full max-w-lg p-6 rounded-lg bg-white border border-[#E3D9C8] space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[#E3D9C8] pb-3">
              <h2 className="text-lg font-normal font-heading text-[#2B2118] tracking-wide flex items-center space-x-2">
                <Utensils className="w-5 h-5 text-[#B23A25]" />
                <span>Register Surplus Food</span>
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-[#8C7E72] hover:text-[#2B2118] font-bold text-base px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="p-3 bg-[#FBF6EC] border border-[#E3D9C8] rounded-md flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#6B5E52] block text-[11px]">Donating as:</span>
                  <span className="font-semibold text-[#2B2118]">{user?.name || 'Logged-in Donor'} ({user?.email})</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#F5EEDB] text-[#4B6B36] border border-[#E3D9C8] font-bold uppercase">
                  {user?.role || 'DONOR'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2118] mb-1">Food Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white border border-[#E3D9C8] rounded-md px-3 py-2 text-xs text-[#2B2118] focus:border-[#B23A25] focus:outline-none"
                >
                  <option value="COOKED_FOOD">Cooked Food (Rice, Meals, Curries)</option>
                  <option value="PACKAGED_FOOD">Packaged Food (Sandwiches, Biscuits)</option>
                  <option value="BAKERY">Bakery (Bread, Muffins, Pastries)</option>
                  <option value="RAW_INGREDIENTS">Raw Ingredients (Vegetables, Grains)</option>
                  <option value="FROZEN">Frozen Food</option>
                  <option value="VEGETABLES_FRUITS">Vegetables & Fruits</option>
                </select>
              </div>

              {/* Dynamic Embedded Food Items Form */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#2B2118]">
                    Food Items Included
                  </label>
                  <button
                    type="button"
                    onClick={handleAddFoodItem}
                    className="text-xs font-semibold text-[#B23A25] hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {foodItems.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2 bg-[#FBF6EC] p-2.5 rounded-md border border-[#E3D9C8]">
                    <input
                      type="text"
                      placeholder="Item Name (e.g. Veg Rice)"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      required
                      className="flex-1 bg-white border border-[#E3D9C8] rounded-md px-2.5 py-1.5 text-xs text-[#2B2118] focus:border-[#B23A25] focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      required
                      className="w-20 bg-white border border-[#E3D9C8] rounded-md px-2.5 py-1.5 text-xs text-[#2B2118] focus:border-[#B23A25] focus:outline-none"
                    />
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      className="w-20 bg-white border border-[#E3D9C8] rounded-md px-2 py-1.5 text-xs text-[#2B2118] focus:border-[#B23A25] focus:outline-none"
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
                        className="text-[#B23A25] hover:text-[#962F1D] p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Expiry Hours */}
              <div>
                <label className="block text-xs font-semibold text-[#2B2118] mb-1">
                  Safe Consumption Window (Hours from now)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.25"
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(parseFloat(e.target.value) || 1)}
                  className="w-full bg-white border border-[#E3D9C8] rounded-md px-3 py-2 text-xs text-[#2B2118] focus:border-[#B23A25] focus:outline-none"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-[#2B2118] mb-1">Pickup Address</label>
                <input
                  type="text"
                  placeholder="Enter pickup address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white border border-[#E3D9C8] rounded-md px-3 py-2 text-xs text-[#2B2118] focus:border-[#B23A25] focus:outline-none"
                />
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#2B2118] mb-1">Longitude (73.8567)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full bg-white border border-[#E3D9C8] rounded-md px-3 py-2 text-xs text-[#2B2118] focus:border-[#B23A25] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#2B2118] mb-1">Latitude (18.5204)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full bg-white border border-[#E3D9C8] rounded-md px-3 py-2 text-xs text-[#2B2118] focus:border-[#B23A25] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E3D9C8]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-md text-[#6B5E52] hover:text-[#2B2118] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="save-donation-submit"
                  className="btn-primary text-xs px-5 py-2"
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
