import React, { useState } from 'react';
import { UserPlus, Mail, Lock, Phone, User, Building, Truck, MapPin, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register({ setActiveTab }) {
  const { register } = useAuth();
  const [role, setRole] = useState('DONOR'); // DONOR, NGO, VOLUNTEER

  // Common Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // NGO Extra Fields
  const [orgName, setOrgName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [address, setAddress] = useState('');
  const [ngoLat, setNgoLat] = useState(18.5204);
  const [ngoLng, setNgoLng] = useState(73.8567);
  const [acceptedFoodTypes, setAcceptedFoodTypes] = useState(['COOKED_FOOD', 'PACKAGED_FOOD']);

  // Volunteer Extra Fields
  const [vehicleType, setVehicleType] = useState('BIKE');
  const [availability, setAvailability] = useState('AVAILABLE');
  const [volLat, setVolLat] = useState(18.5204);
  const [volLng, setVolLng] = useState(73.8567);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleFoodType = (type) => {
    setAcceptedFoodTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    const payload = {
      name,
      email,
      password,
      phone: phone || '+91 9823000000',
      role,
    };

    if (role === 'NGO') {
      payload.organizationName = orgName || name;
      payload.registrationNumber = regNumber || `REG-${Date.now().toString().slice(-4)}`;
      payload.contactPerson = contactPerson || name;
      payload.address = address || 'Pune Central';
      payload.latitude = parseFloat(ngoLat) || 18.5204;
      payload.longitude = parseFloat(ngoLng) || 73.8567;
      payload.acceptedFoodTypes = acceptedFoodTypes;
    } else if (role === 'VOLUNTEER') {
      payload.vehicleType = vehicleType;
      payload.availability = availability;
      payload.latitude = parseFloat(volLat) || 18.5204;
      payload.longitude = parseFloat(volLng) || 73.8567;
    }

    try {
      const user = await register(payload);
      if (user.role === 'DONOR') setActiveTab('donor');
      else if (user.role === 'NGO') setActiveTab('ngo');
      else if (user.role === 'VOLUNTEER') setActiveTab('volunteer');
      else setActiveTab('home');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-8">
      <div className="glass-panel p-8 rounded-3xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <UserPlus className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create your FoodRescue Account</h2>
          <p className="text-xs text-slate-400">
            Select your role and complete your profile to start redistributing surplus food.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-xl flex items-start space-x-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Select Account Role
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'DONOR', label: 'Food Donor', desc: 'Hotel / Cafe' },
              { id: 'NGO', label: 'NGO / Shelter', desc: 'Claim food' },
              { id: 'VOLUNTEER', label: 'Volunteer', desc: 'Deliveries' },
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  role === r.id
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10 font-bold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="text-sm font-semibold">{r.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Basic Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name / Contact Person *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9823000000"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password (min 8 chars) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* NGO EXTRA FIELDS */}
          {role === 'NGO' && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/20 space-y-4">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Building className="w-4 h-4" />
                <span>NGO Profile & Dispatch Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Feeding India Pune Chapter"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="REG-NGO-2026-XX"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Address / Facility Location
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. FC Road, Shivajinagar, Pune"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={ngoLat}
                    onChange={(e) => setNgoLat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={ngoLng}
                    onChange={(e) => setNgoLng(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Accepted Food Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {['COOKED_FOOD', 'PACKAGED_FOOD', 'BAKERY', 'RAW_INGREDIENTS'].map(ft => (
                    <button
                      type="button"
                      key={ft}
                      onClick={() => toggleFoodType(ft)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        acceptedFoodTypes.includes(ft)
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {ft.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VOLUNTEER EXTRA FIELDS */}
          {role === 'VOLUNTEER' && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-500/20 space-y-4">
              <div className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Truck className="w-4 h-4" />
                <span>Volunteer Transport & Availability</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    <option value="BIKE">Two Wheeler (Bike / Scooter)</option>
                    <option value="CAR">Car</option>
                    <option value="VAN">Delivery Van / Auto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Initial Availability
                  </label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="BUSY">Busy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Base Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={volLat}
                    onChange={(e) => setVolLat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Base Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={volLng}
                    onChange={(e) => setVolLng(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="text-xs font-semibold">Creating Account...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Already registered?{' '}
            <button
              onClick={() => setActiveTab('login')}
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 ml-1"
            >
              Sign in
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
