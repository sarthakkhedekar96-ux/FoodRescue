import React, { useState, useEffect } from 'react';
import { Database, Layers, MapPin, Cpu, CheckCircle2, Copy, FileJson, Shield, GitBranch, ArrowRight, Code } from 'lucide-react';
import { api } from '../api';
import ErrorState from '../components/ErrorState';

export default function DatabaseInsights() {
  const [activeSubTab, setActiveSubTab] = useState('collections');
  const [stats, setStats] = useState(null);
  const [donations, setDonations] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [users, setUsers] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, donsData, pickupsData, usersData, ngosData, volsData, fbData] = await Promise.all([
        api.getStats(),
        api.getDonations(),
        api.getPickups(),
        api.getUsers(),
        api.getNgos(),
        api.getVolunteers(),
        api.getFeedback()
      ]);
      setStats(statsData);
      setDonations(donsData || []);
      setPickups(pickupsData || []);
      setUsers(usersData || []);
      setNgos(ngosData || []);
      setVolunteers(volsData || []);
      setFeedback(fbData || []);
    } catch (err) {
      console.error('Failed to load database insights data', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const sampleDonation = donations.length > 0 ? donations[0] : null;
  const samplePickup = pickups.length > 0 ? pickups[0] : null;

  return (
    <div className="space-y-8 py-4">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-2">
              <Database className="w-3.5 h-3.5" />
              <span>College Viva Demonstration Screen</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">MongoDB Database Insights</h1>
            <p className="text-sm text-slate-300">
              Interactive demonstration of collections, embedded documents, 2dsphere indexes, references, and aggregation pipelines.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              DB: foodrescue
            </span>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
          {[
            { id: 'collections', label: '1. Collections & Documents', icon: FileJson },
            { id: 'embedded', label: '2. Embedded vs References', icon: Layers },
            { id: 'indexes', label: '3. Indexes & 2dsphere', icon: MapPin },
            { id: 'aggregations', label: '4. Aggregation Pipelines', icon: Cpu }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'glass-card text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <ErrorState
          error={error}
          onRetry={loadAllData}
          loading={loading}
        />
      ) : (
        <>
          {/* SUB TAB 1: COLLECTIONS & DOCUMENTS */}
      {activeSubTab === 'collections' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { name: 'users', count: users.length, desc: 'Donors, NGOs, Volunteers, Admin' },
              { name: 'donations', count: donations.length, desc: 'Main collection with embedded items' },
              { name: 'ngos', count: ngos.length, desc: 'NGO profile & GeoJSON Location' },
              { name: 'volunteers', count: volunteers.length, desc: 'Volunteers & availability' },
              { name: 'pickups', count: pickups.length, desc: 'References between documents' },
              { name: 'feedback', count: feedback.length, desc: 'Ratings for aggregations' }
            ].map(col => (
              <div key={col.name} className="glass-card p-4 rounded-2xl border border-slate-800 text-center space-y-1">
                <span className="text-xs font-mono text-emerald-400 font-bold block">{col.name}</span>
                <span className="text-2xl font-extrabold text-white block">{col.count}</span>
                <span className="text-[10px] text-slate-400 block truncate">{col.desc}</span>
              </div>
            ))}
          </div>

          {/* Document Samples */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <FileJson className="w-4 h-4 text-emerald-400" />
                  <span>Main Document: donations Collection</span>
                </h3>
                <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                  Embedded Arrays Included
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Notice how <code className="text-emerald-300">foodItems[]</code> and <code className="text-emerald-300">statusHistory[]</code> are embedded directly inside the donation document.
              </p>
              {sampleDonation ? (
                <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto max-h-96 border border-slate-800">
                  {JSON.stringify(sampleDonation, null, 2)}
                </pre>
              ) : (
                <div className="bg-slate-950/60 p-8 rounded-xl border border-slate-800 text-center text-xs text-slate-400 font-mono">
                  No donations registered in MongoDB Atlas yet. Create a donation from the Donor Dashboard to see live document JSON.
                </div>
              )}
            </div>

            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <GitBranch className="w-4 h-4 text-sky-400" />
                  <span>Referenced Document: pickups Collection</span>
                </h3>
                <span className="text-[11px] font-mono bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded">
                  Document Referencing
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Stores IDs referencing <code className="text-sky-300">donations._id</code>, <code className="text-sky-300">ngos._id</code>, and <code className="text-sky-300">volunteers._id</code>.
              </p>
              {samplePickup ? (
                <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-sky-300 overflow-x-auto max-h-96 border border-slate-800">
                  {JSON.stringify(samplePickup, null, 2)}
                </pre>
              ) : (
                <div className="bg-slate-950/60 p-8 rounded-xl border border-slate-800 text-center text-xs text-slate-400 font-mono">
                  No pickups created in MongoDB Atlas yet. Request a pickup from the NGO Dashboard to see referenced document JSON.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* SUB TAB 2: EMBEDDED VS REFERENCES */}
      {activeSubTab === 'embedded' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Embedded Documents Explanation */}
          <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Embedded Documents & Arrays</h3>
                <span className="text-xs text-emerald-400 font-mono">Used in: Donation (foodItems[], statusHistory[])</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong className="text-white">Why embed?</strong> In MongoDB, embedding related data inside a single document is ideal when data is queried together and has a 1-to-few relationship.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li><strong className="text-emerald-300">Single Read Operation:</strong> Fetching a donation retrieves all food items in 1 query without expensive SQL JOINs.</li>
                <li><strong className="text-emerald-300">Atomic Updates:</strong> Adding an item or updating status history happens atomically within the document.</li>
                <li><strong className="text-emerald-300">Viva Defense:</strong> "Food items belong exclusively to their donation. They do not exist independently, so embedding is the optimal MongoDB pattern."</li>
              </ul>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400">
              Donation <br/>
              ├── foodItems[] (embedded array)<br/>
              └── statusHistory[] (embedded array)
            </div>
          </div>

          {/* Document Referencing Explanation */}
          <div className="glass-card p-6 rounded-2xl border border-sky-500/30 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <GitBranch className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Application-Level References</h3>
                <span className="text-xs text-sky-400 font-mono">Used in: Pickup (donationId, ngoId, volunteerId)</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong className="text-white">Why reference?</strong> Document referencing is used when entities have independent lifecycles or a 1-to-many / many-to-many relationship.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li><strong className="text-sky-300">Independent Entities:</strong> NGOs, Volunteers, and Donations exist independently and are updated separately.</li>
                <li><strong className="text-sky-300">Prevents Data Duplication:</strong> Referencing IDs avoids duplicating full NGO or Volunteer details in every pickup document.</li>
                <li><strong className="text-sky-300">Viva Defense:</strong> "A volunteer completes dozens of pickups. Storing IDs allows application-level resolution without duplicating profile data."</li>
              </ul>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-sky-400">
              Pickup <br/>
              ├── donationId ──&gt; donations._id <br/>
              ├── ngoId ───────&gt; ngos._id <br/>
              └── volunteerId ─&gt; volunteers._id
            </div>
          </div>

        </div>
      )}

      {/* SUB TAB 3: INDEXES & 2DSPHERE */}
      {activeSubTab === 'indexes' && (
        <div className="space-y-6">
          
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span>MongoDB Index Definitions in FoodRescue</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="py-2.5 px-3">Collection</th>
                    <th className="py-2.5 px-3">Index Type</th>
                    <th className="py-2.5 px-3">Indexed Field(s)</th>
                    <th className="py-2.5 px-3">Spring Data Annotation</th>
                    <th className="py-2.5 px-3">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                  <tr>
                    <td className="py-3 px-3 text-emerald-400 font-bold">users</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px]">Unique</span></td>
                    <td className="py-3 px-3">email: 1</td>
                    <td className="py-3 px-3 text-slate-400">@Indexed(unique = true)</td>
                    <td className="py-3 px-3 text-slate-300 font-sans">Enforces unique user emails at DB level</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 text-emerald-400 font-bold">donations</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 text-[10px]">2dsphere</span></td>
                    <td className="py-3 px-3">location: "2dsphere"</td>
                    <td className="py-3 px-3 text-slate-400">@GeoSpatialIndexed(type = 2DSPHERE)</td>
                    <td className="py-3 px-3 text-slate-300 font-sans">Powers $nearSphere geospatial proximity queries</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 text-emerald-400 font-bold">donations</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">Compound</span></td>
                    <td className="py-3 px-3">status: 1, expiryAt: 1</td>
                    <td className="py-3 px-3 text-slate-400">@CompoundIndex(name = "status_expiry_idx")</td>
                    <td className="py-3 px-3 text-slate-300 font-sans">Optimizes finding active & expiring donations</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 text-emerald-400 font-bold">ngos</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 text-[10px]">2dsphere</span></td>
                    <td className="py-3 px-3">location: "2dsphere"</td>
                    <td className="py-3 px-3 text-slate-400">@GeoSpatialIndexed(type = 2DSPHERE)</td>
                    <td className="py-3 px-3 text-slate-300 font-sans">Locates NGOs near donor locations</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 text-emerald-400 font-bold">volunteers</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 text-[10px]">2dsphere</span></td>
                    <td className="py-3 px-3">location: "2dsphere"</td>
                    <td className="py-3 px-3 text-slate-400">@GeoSpatialIndexed(type = 2DSPHERE)</td>
                    <td className="py-3 px-3 text-slate-300 font-sans">Finds closest available volunteers for pickup</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* GeoJSON & 2dsphere viva explanation card */}
          <div className="glass-card p-6 rounded-2xl border border-teal-500/30 space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-teal-400" />
              <span>GeoJSON Format Requirement in MongoDB</span>
            </h4>
            <p className="text-xs text-slate-300">
              MongoDB GeoJSON coordinates MUST be specified as <code className="text-teal-300 font-mono">[longitude, latitude]</code>.
            </p>
            <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-teal-300 border border-slate-800">
              &#123;<br/>
              &nbsp;&nbsp;"location": &#123;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;"type": "Point",<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;"coordinates": [73.8567, 18.5204] // [longitude, latitude]<br/>
              &nbsp;&nbsp;&#125;<br/>
              &#125;
            </div>
          </div>

        </div>
      )}

      {/* SUB TAB 4: PREDEFINED AGGREGATION PIPELINES */}
      {activeSubTab === 'aggregations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Predefined Aggregation Pipeline Demonstrations</h2>
              <p className="text-xs text-slate-400">
                Click any pipeline to inspect MongoDB stages (<code className="text-cyan-300">$match, $unwind, $group, $sort</code>) and live output.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Aggregation 1 */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Aggregation 1</span>
              <h3 className="text-base font-bold text-white">Total Donation Count</h3>
              <p className="text-xs text-slate-400">Counts total document entries in donations collection.</p>
              
              <div className="bg-slate-950 p-3 rounded-xl text-xs font-mono text-slate-300 border border-slate-800">
                <span className="text-slate-500">// Spring Data Mongo Java</span><br/>
                mongoTemplate.count(new Query(), Donation.class);
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs font-mono text-emerald-300">
                Result: {stats ? `${stats.totalDonations} Total Donations` : '0 Total Donations'}
              </div>
            </div>

            {/* Aggregation 2 */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Aggregation 2</span>
              <h3 className="text-base font-bold text-white">Donations Grouped by Category</h3>
              <p className="text-xs text-slate-400">Groups donations by category and sorts in descending order.</p>

              <div className="bg-slate-950 p-3 rounded-xl text-xs font-mono text-slate-300 border border-slate-800 overflow-x-auto">
                <span className="text-slate-500">// MongoDB Shell Pipeline</span><br/>
                db.donations.aggregate([<br/>
                &nbsp;&nbsp;&#123; $group: &#123; _id: "$category", count: &#123; $sum: 1 &#125; &#125; &#125;,<br/>
                &nbsp;&nbsp;&#123; $sort: &#123; count: -1 &#125; &#125;<br/>
                ])
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs font-mono text-emerald-300">
                Result: {stats?.categoryDistribution?.length > 0 ? stats.categoryDistribution.map(c => `${c.category}: ${c.count}`).join(' | ') : 'No categorized donations in MongoDB yet'}
              </div>
            </div>

            {/* Aggregation 3 */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Aggregation 3</span>
              <h3 className="text-base font-bold text-white">Top Donors Leaderboard</h3>
              <p className="text-xs text-slate-400">Groups by donorId, sorts by count, and limits top 5.</p>

              <div className="bg-slate-950 p-3 rounded-xl text-xs font-mono text-slate-300 border border-slate-800 overflow-x-auto">
                <span className="text-slate-500">// MongoDB Shell Pipeline</span><br/>
                db.donations.aggregate([<br/>
                &nbsp;&nbsp;&#123; $group: &#123; _id: "$donorId", count: &#123; $sum: 1 &#125; &#125; &#125;,<br/>
                &nbsp;&nbsp;&#123; $sort: &#123; count: -1 &#125; &#125;,<br/>
                &nbsp;&nbsp;&#123; $limit: 5 &#125;<br/>
                ])
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs font-mono text-emerald-300">
                Result: {stats?.topDonors?.length > 0 ? stats.topDonors.map(d => `${d.donorName}: ${d.donationCount}`).join(' | ') : 'No donations recorded for leaderboard yet'}
              </div>
            </div>

            {/* Aggregation 4 */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Aggregation 4</span>
              <h3 className="text-base font-bold text-white">Donation Status Distribution</h3>
              <p className="text-xs text-slate-400">Groups donations by status (AVAILABLE, COMPLETED, EXPIRED).</p>

              <div className="bg-slate-950 p-3 rounded-xl text-xs font-mono text-slate-300 border border-slate-800 overflow-x-auto">
                <span className="text-slate-500">// MongoDB Shell Pipeline</span><br/>
                db.donations.aggregate([<br/>
                &nbsp;&nbsp;&#123; $group: &#123; _id: "$status", count: &#123; $sum: 1 &#125; &#125; &#125;<br/>
                ])
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs font-mono text-emerald-300">
                Result: AVAILABLE: {stats?.statusDistribution?.AVAILABLE || 0} | COMPLETED: {stats?.statusDistribution?.COMPLETED || 0} | EXPIRED: {stats?.statusDistribution?.EXPIRED || 0}
              </div>
            </div>

            {/* Aggregation 5 */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Aggregation 5</span>
              <h3 className="text-base font-bold text-white">Average Feedback Rating</h3>
              <p className="text-xs text-slate-400">Calculates average rating across all feedback entries using $avg.</p>

              <div className="bg-slate-950 p-3 rounded-xl text-xs font-mono text-slate-300 border border-slate-800 overflow-x-auto">
                <span className="text-slate-500">// MongoDB Shell Pipeline</span><br/>
                db.feedback.aggregate([<br/>
                &nbsp;&nbsp;&#123; $group: &#123; _id: null, avgRating: &#123; $avg: "$rating" &#125; &#125; &#125;<br/>
                ])
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs font-mono text-emerald-300">
                Result: {stats?.averageRating > 0 ? `${stats.averageRating} Stars Average` : 'No feedback ratings submitted yet'}
              </div>
            </div>

            {/* Aggregation 6 */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Aggregation 6</span>
              <h3 className="text-base font-bold text-white">Total Quantity of Food Donated</h3>
              <p className="text-xs text-slate-400">Unwinds embedded foodItems[] array and sums quantity field.</p>

              <div className="bg-slate-950 p-3 rounded-xl text-xs font-mono text-slate-300 border border-slate-800 overflow-x-auto">
                <span className="text-slate-500">// MongoDB Shell Pipeline</span><br/>
                db.donations.aggregate([<br/>
                &nbsp;&nbsp;&#123; $unwind: "$foodItems" &#125;,<br/>
                &nbsp;&nbsp;&#123; $group: &#123; _id: null, totalQty: &#123; $sum: "$foodItems.quantity" &#125; &#125; &#125;<br/>
                ])
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs font-mono text-emerald-300">
                Result: {stats ? `${stats.totalFoodQuantity} Units Total Food Donated` : '0 Units Total Food Donated'}
              </div>
            </div>

          </div>
        </div>
      )}
      </>
      )}

    </div>
  );
}
