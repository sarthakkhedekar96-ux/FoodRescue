import React, { useState } from 'react';
import { Mail, Lock, Phone, User, Building, Truck, AlertCircle, ArrowRight } from 'lucide-react';
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
    <div className="max-w-xl mx-auto my-8" data-testid="register-page">
      <div className="glass-panel p-8 rounded-lg border border-[#E3D9C8] bg-white space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-full bg-[#F5EEDB] border border-[#E3D9C8] text-[#B23A25] mx-auto flex items-center justify-center font-bold font-heading text-lg">
            FR
          </div>
          <h2 className="text-2xl font-normal font-heading text-[#2B2118] tracking-wide">
            Create your FoodRescue Account
          </h2>
          <p className="text-xs text-[#6B5E52]">
            Select your role to connect with your local community surplus network.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-[#F8E7E3] border border-[#E8C1B7] p-3 rounded-md flex items-start space-x-2.5 text-xs text-[#963826]">
            <AlertCircle className="w-4 h-4 text-[#B23A25] shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div>
          <label className="block text-xs font-semibold text-[#2B2118] mb-2">
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
                data-testid={`role-select-${r.id.toLowerCase()}`}
                className={`p-3 rounded-md border text-center transition-all ${
                  role === r.id
                    ? 'bg-[#F5EEDB] border-[#B23A25] text-[#B23A25] font-semibold'
                    : 'bg-white border-[#E3D9C8] text-[#6B5E52] hover:text-[#2B2118] hover:border-[#D5C8B4]'
                }`}
              >
                <div className="text-sm font-semibold">{r.label}</div>
                <div className="text-[11px] text-[#6B5E52] mt-0.5">{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Basic Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2B2118] mb-1.5">
                Full Name / Contact Person *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8C7E72] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  data-testid="register-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[#E3D9C8] rounded-md text-sm text-[#2B2118] placeholder-[#8C7E72] focus:outline-none focus:border-[#B23A25]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2118] mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#8C7E72] absolute left-3.5 top-3" />
                <input
                  type="tel"
                  data-testid="register-phone-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9823000000"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[#E3D9C8] rounded-md text-sm text-[#2B2118] placeholder-[#8C7E72] focus:outline-none focus:border-[#B23A25]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2B2118] mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8C7E72] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  data-testid="register-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[#E3D9C8] rounded-md text-sm text-[#2B2118] placeholder-[#8C7E72] focus:outline-none focus:border-[#B23A25]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2118] mb-1.5">
                Password (min 8 chars) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C7E72] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={8}
                  data-testid="register-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[#E3D9C8] rounded-md text-sm text-[#2B2118] placeholder-[#8C7E72] focus:outline-none focus:border-[#B23A25]"
                />
              </div>
            </div>
          </div>

          {/* NGO EXTRA FIELDS */}
          {role === 'NGO' && (
            <div className="p-4 rounded-md bg-[#FBF6EC] border border-[#E3D9C8] space-y-4">
              <div className="text-xs font-bold text-[#4B6B36] uppercase tracking-wider flex items-center space-x-1.5">
                <Building className="w-4 h-4" />
                <span>Shelter / Organization Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#2B2118] mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Feeding India Pune Chapter"
                    className="w-full px-3 py-2 bg-white border border-[#E3D9C8] rounded-md text-xs text-[#2B2118]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#2B2118] mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="REG-NGO-2026-XX"
                    className="w-full px-3 py-2 bg-white border border-[#E3D9C8] rounded-md text-xs text-[#2B2118]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2B2118] mb-1">
                  Address / Facility Location
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. FC Road, Shivajinagar, Pune"
                  className="w-full px-3 py-2 bg-white border border-[#E3D9C8] rounded-md text-xs text-[#2B2118]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#2B2118] mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={ngoLat}
                    onChange={(e) => setNgoLat(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E3D9C8] rounded-md text-xs text-[#2B2118]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#2B2118] mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={ngoLng}
                    onChange={(e) => setNgoLng(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E3D9C8] rounded-md text-xs text-[#2B2118]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2B2118] mb-1.5">
                  Accepted Food Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {['COOKED_FOOD', 'PACKAGED_FOOD', 'BAKERY', 'RAW_INGREDIENTS'].map(ft => (
                    <button
                      type="button"
                      key={ft}
                      onClick={() => toggleFoodType(ft)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                        acceptedFoodTypes.includes(ft)
                          ? 'bg-[#4B6B36] text-white border border-[#4B6B36]'
                          : 'bg-white text-[#6B5E52] border border-[#E3D9C8]'
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
            <div className="p-4 rounded-md bg-[#FBF6EC] border border-[#E3D9C8] space-y-4">
              <div className="text-xs font-bold text-[#4B6B36] uppercase tracking-wider flex items-center space-x-1.5">
                <Truck className="w-4 h-4" />
                <span>Volunteer Transport & Availability</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#2B2118] mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E3D9C8] rounded-md text-xs text-[#2B2118]"
                  >
                    <option value="BIKE">Two Wheeler (Bike / Scooter)</option>
                    <option value="CAR">Car</option>
                    <option value="VAN">Delivery Van / Auto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#2B2118] mb-1">
                    Initial Availability
                  </label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E3D9C8] rounded-md text-xs text-[#2B2118]"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="BUSY">Busy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#2B2118] mb-1">
                    Base Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={volLat}
                    onChange={(e) => setVolLat(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E3D9C8] rounded-md text-xs text-[#2B2118]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#2B2118] mb-1">
                    Base Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={volLng}
                    onChange={(e) => setVolLng(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E3D9C8] rounded-md text-xs text-[#2B2118]"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            data-testid="register-submit-btn"
            className="w-full py-2.5 rounded-md bg-[#B23A25] text-white font-semibold text-sm hover:bg-[#962F1D] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
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

        <div className="pt-4 border-t border-[#E3D9C8] text-center">
          <p className="text-xs text-[#6B5E52]">
            Already registered?{' '}
            <button
              onClick={() => setActiveTab('login')}
              className="text-[#B23A25] hover:underline font-semibold ml-1"
            >
              Sign in
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
