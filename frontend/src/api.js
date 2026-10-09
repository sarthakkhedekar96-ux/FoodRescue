const API_BASE = '/api';

export async function fetchJson(endpoint, options = {}) {
  const token = localStorage.getItem('foodrescue_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      localStorage.removeItem('foodrescue_token');
      localStorage.removeItem('foodrescue_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
      let errData = {};
      try { errData = await res.json(); } catch {}
      const err = new Error(errData.message || 'Session expired or unauthorized. Please log in.');
      err.status = 401;
      throw err;
    }

    if (res.status === 403) {
      let errData = {};
      try { errData = await res.json(); } catch {}
      const err = new Error(errData.message || 'You do not have permission to access or modify this resource.');
      err.status = 403;
      throw err;
    }

    if (!res.ok) {
      let errData = {};
      try { errData = await res.json(); } catch {}
      const errMsg = errData.message || `API Error: ${res.status} ${res.statusText}`;
      const err = new Error(errMsg);
      err.status = res.status;
      err.data = errData;
      throw err;
    }

    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`Fetch error on ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth API
  login: (credentials) => fetchJson('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload) => fetchJson('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getCurrentUser: () => fetchJson('/auth/me'),

  // Database Health (Public)
  getDbHealth: () => fetchJson('/health/db'),

  // Donations (Full CRUD)
  getDonations: () => fetchJson('/donations'),
  getAvailableDonations: () => fetchJson('/donations/available'),
  getNearbyDonations: (lat, lng, dist) => 
    fetchJson(`/donations/nearby?latitude=${lat}&longitude=${lng}&distance=${dist}`),
  getDonationsByCategory: (category) => fetchJson(`/donations/category/${category}`),
  getDonationsByDonor: (donorId) => fetchJson(`/donations/donor/${donorId}`),
  getExpiringSoonDonations: () => fetchJson('/donations/expiring-soon'),
  createDonation: (data) => fetchJson('/donations', { method: 'POST', body: JSON.stringify(data) }),
  updateDonation: (id, data) => fetchJson(`/donations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDonation: (id) => fetchJson(`/donations/${id}`, { method: 'DELETE' }),

  // Users (Full CRUD)
  getUsers: () => fetchJson('/users'),
  getUserById: (id) => fetchJson(`/users/${id}`),
  getUserByEmail: (email) => fetchJson(`/users/email/${email}`),
  createUser: (data) => fetchJson('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => fetchJson(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => fetchJson(`/users/${id}`, { method: 'DELETE' }),

  // NGOs (Full CRUD)
  getNgos: () => fetchJson('/ngos'),
  getNgoById: (id) => fetchJson(`/ngos/${id}`),
  createNgo: (data) => fetchJson('/ngos', { method: 'POST', body: JSON.stringify(data) }),
  updateNgo: (id, data) => fetchJson(`/ngos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNgo: (id) => fetchJson(`/ngos/${id}`, { method: 'DELETE' }),

  // Volunteers (Full CRUD)
  getVolunteers: () => fetchJson('/volunteers'),
  getVolunteerById: (id) => fetchJson(`/volunteers/${id}`),
  createVolunteer: (data) => fetchJson('/volunteers', { method: 'POST', body: JSON.stringify(data) }),
  updateVolunteer: (id, data) => fetchJson(`/volunteers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVolunteer: (id) => fetchJson(`/volunteers/${id}`, { method: 'DELETE' }),

  // Pickups (Full CRUD)
  getPickups: () => fetchJson('/pickups'),
  getPickupById: (id) => fetchJson(`/pickups/${id}`),
  getPickupsByNgo: (ngoId) => fetchJson(`/pickups/ngo/${ngoId}`),
  getPickupsByVolunteer: (volunteerId) => fetchJson(`/pickups/volunteer/${volunteerId}`),
  createPickup: (data) => fetchJson('/pickups', { method: 'POST', body: JSON.stringify(data) }),
  updatePickup: (id, data) => fetchJson(`/pickups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updatePickupStatus: (id, status) => fetchJson(`/pickups/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deletePickup: (id) => fetchJson(`/pickups/${id}`, { method: 'DELETE' }),

  // Feedback (Full CRUD)
  getFeedback: () => fetchJson('/feedback'),
  getFeedbackById: (id) => fetchJson(`/feedback/${id}`),
  getFeedbackByDonation: (donationId) => fetchJson(`/feedback/donation/${donationId}`),
  createFeedback: (data) => fetchJson('/feedback', { method: 'POST', body: JSON.stringify(data) }),
  updateFeedback: (id, data) => fetchJson(`/feedback/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFeedback: (id) => fetchJson(`/feedback/${id}`, { method: 'DELETE' }),

  // Stats / Aggregation (Public)
  getStats: () => fetchJson('/stats'),
};
