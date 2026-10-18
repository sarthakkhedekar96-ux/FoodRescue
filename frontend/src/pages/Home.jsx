import React, { useState, useEffect } from 'react';
import { ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../api';
import ErrorState from '../components/ErrorState';
import { useAuth } from '../context/AuthContext';

export default function Home({ setActiveTab }) {
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(null);
  const [imageError, setImageError] = useState(false);

  const loadLiveStats = async () => {
    setLoading(true);
    setBackendError(null);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Backend connection error in Home:', err);
      setBackendError(err.message || 'Unable to connect to Spring Boot backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveStats();
  }, []);

  const handleCtaClick = () => {
    if (!isAuthenticated) {
      setActiveTab('register');
    } else if (user?.role === 'DONOR') {
      setActiveTab('donor');
    } else if (user?.role === 'NGO') {
      setActiveTab('ngo');
    } else if (user?.role === 'VOLUNTEER') {
      setActiveTab('volunteer');
    } else {
      setActiveTab('admin');
    }
  };

  const isStatsEmpty = !loading && stats && (
    Number(stats.totalDonations || 0) === 0 &&
    Number(stats.totalFoodQuantity || 0) === 0 &&
    Number(stats.statusDistribution?.AVAILABLE || 0) === 0
  );

  return (
    <div className="space-y-12 py-2" data-testid="home-page">
      
      {/* Backend Error State if server is down */}
      {backendError && (
        <ErrorState
          title="Backend Server Offline"
          message="The API server is currently unreachable. Live community metrics will appear once connection is restored."
          onRetry={loadLiveStats}
          loading={loading}
        />
      )}

      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-7 space-y-5">
          {/* Three alternative hero headlines:
              Option 1 (active): "Fresh surplus food, delivered to local shelters."
              Option 2: "Good food shouldn't go to waste when neighbors need a meal."
              Option 3: "From local kitchens and shops straight to community tables."
          */}
          <h1 className="text-4xl sm:text-5xl font-normal font-heading text-[#2B2118] leading-[1.2] tracking-wide">
            Fresh surplus food, delivered to local shelters.
          </h1>

          <p className="text-base sm:text-lg text-[#6B5E52] leading-relaxed max-w-2xl">
            Restaurants and shops post food they can't sell. Nearby shelters claim it. A volunteer drives it over.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <button
              onClick={handleCtaClick}
              data-testid="hero-cta-btn"
              className="btn-primary text-sm px-6 py-2.5 flex items-center space-x-2"
            >
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Join the Network'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab(isAuthenticated ? (user?.role === 'DONOR' ? 'donor' : 'home') : 'login')}
              data-testid="hero-secondary-btn"
              className="btn-secondary text-sm px-5 py-2.5"
            >
              {isAuthenticated ? 'View Portal' : 'Sign In to Your Account'}
            </button>
          </div>
        </div>

        {/* Hero Photo / Neutral Placeholder Slot */}
        <div className="lg:col-span-5">
          <div className="relative rounded-[8px] overflow-hidden border border-[#E3D9C8] bg-[#F5EEDB] aspect-[4/3] flex items-center justify-center">
            {!imageError ? (
              <img
                src="/images/hero.png"
                alt="A volunteer hands a box of food to a neighbor outside a community kitchen"
                className="w-full h-full object-cover rounded-[8px]"
                style={{ objectFit: 'cover', objectPosition: '50% 40%' }}
                onError={() => setImageError(true)}
              />
            ) : null}
            {/* When image is missing or errors, clean neutral warm-colored block with no icon or text */}
          </div>
        </div>
      </section>

      {/* Live Impact Stats */}
      <section className="border-y border-[#E3D9C8] py-8 bg-[#FBF6EC] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B5E52]">
              Live Community Impact
            </h2>
            <button
              onClick={loadLiveStats}
              disabled={loading}
              className="text-xs text-[#6B5E52] hover:text-[#B23A25] flex items-center space-x-1 transition-colors"
              title="Refresh live metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {isStatsEmpty ? (
            <div className="py-6 text-center space-y-3">
              <p className="text-sm text-[#6B5E52]">
                No food shared yet. Be the first to post a donation.
              </p>
              <button
                onClick={handleCtaClick}
                className="btn-primary text-xs px-5 py-2 inline-flex items-center space-x-1.5"
              >
                <span>Post a Donation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <span className="text-xs text-[#6B5E52] font-medium">Total Donations</span>
                <p className="text-3xl font-normal font-heading text-[#2B2118]">
                  {stats?.totalDonations ?? (loading ? '—' : 0)}
                </p>
                <p className="text-[11px] text-[#8C7E72]">Contributed by registered donors</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#6B5E52] font-medium">Meals Rescued</span>
                <p className="text-3xl font-normal font-heading text-[#B23A25]">
                  {stats?.totalFoodQuantity ?? (loading ? '—' : 0)}
                </p>
                <p className="text-[11px] text-[#8C7E72]">Portions diverted from waste</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#6B5E52] font-medium">Average Rating</span>
                <p className="text-3xl font-normal font-heading text-[#2B2118]">
                  {stats?.averageRating ? `${stats.averageRating} / 5` : (loading ? '—' : '5.0 / 5')}
                </p>
                <p className="text-[11px] text-[#8C7E72]">Feedback from partner shelters</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#6B5E52] font-medium">Available Now</span>
                <p className="text-3xl font-normal font-heading text-[#4B6B36]">
                  {stats?.statusDistribution?.AVAILABLE ?? (loading ? '—' : 0)}
                </p>
                <p className="text-[11px] text-[#8C7E72]">Awaiting pickup requests</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How the Process Works - Line-style 3-Step Overview */}
      <section className="space-y-8 pt-2">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-normal font-heading text-[#2B2118] tracking-wide">
            How food rescue works
          </h2>
          <p className="text-sm text-[#6B5E52]">
            Three simple steps from kitchen surplus to a hot meal.
          </p>
        </div>

        <div className="relative">
          {/* Horizontal connecting line on desktop */}
          <div className="hidden md:block absolute top-5 left-1/6 right-1/6 h-[2px] bg-[#E3D9C8] z-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {/* Step 1 */}
            <div className="text-center md:text-left space-y-3">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-[#B23A25] text-[#B23A25] font-bold text-sm flex items-center justify-center mx-auto md:mx-0 shadow-none">
                1
              </div>
              <h3 className="text-base font-normal font-heading text-[#2B2118] tracking-wide">
                Post surplus
              </h3>
              <p className="text-xs text-[#6B5E52] leading-relaxed">
                Restaurants, bakeries, and grocers list edible food they cannot sell before closing.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center md:text-left space-y-3">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-[#4B6B36] text-[#4B6B36] font-bold text-sm flex items-center justify-center mx-auto md:mx-0 shadow-none">
                2
              </div>
              <h3 className="text-base font-normal font-heading text-[#2B2118] tracking-wide">
                Claim food
              </h3>
              <p className="text-xs text-[#6B5E52] leading-relaxed">
                Nearby shelters and soup kitchens view available donations and claim what they need.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center md:text-left space-y-3">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-[#B23A25] text-[#B23A25] font-bold text-sm flex items-center justify-center mx-auto md:mx-0 shadow-none">
                3
              </div>
              <h3 className="text-base font-normal font-heading text-[#2B2118] tracking-wide">
                Deliver
              </h3>
              <p className="text-xs text-[#6B5E52] leading-relaxed">
                A local volunteer driver picks up the food and drops it off at the shelter.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
