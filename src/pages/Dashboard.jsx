import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Droplets, ShieldCheck, AlertTriangle, Users, ArrowRight, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { token, API_URL } = useAuth();
  const [overview, setOverview] = useState(null);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminDashboard = async () => {
      try {
        setLoading(true);
        const [overviewRes, locRes, usersRes] = await Promise.all([
          fetch(`${API_URL}/analytics/overview`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/water-locations`),
          fetch(`${API_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const overviewData = await overviewRes.json();
        const locData = await locRes.json();
        const usersData = await usersRes.json();

        if (overviewData.success) setOverview(overviewData.data);
        if (locData.success && Array.isArray(locData.data)) setLocations(locData.data);
        if (usersData.success && Array.isArray(usersData.data)) setUsers(usersData.data);
      } catch (err) {
        console.error("Error loading admin dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminDashboard();
  }, [token, API_URL]);

  const safeCount = overview?.water_locations?.safe ?? locations.filter((l) => l.status === "safe").length;
  const warningCount = overview?.water_locations?.warning ?? locations.filter((l) => l.status === "warning").length;
  const dangerCount = overview?.water_locations?.undrinkable ?? locations.filter((l) => l.status === "undrinkable" || l.status === "contaminated").length;

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-800 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">Central Control Hub</span>
          <h1 className="text-3xl font-extrabold text-white">System Administrator Console</h1>
          <p className="text-white/80 text-sm max-w-xl mt-1">
            Global management of Maasin City water quality records, user accounts, spatial forecasting weights, and compliance reports.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/users"
            className="px-5 py-2.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-semibold text-xs transition-all shadow hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-1.5"
          >
            <Users size={16} />
            <span>Manage Users</span>
          </Link>
          <Link
            to="/forecast-config"
            className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold text-xs transition-all"
          >
            Forecast Config
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Stations</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{locations.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Droplets size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Safe</p>
            <h3 className="text-3xl font-bold text-emerald-600 mt-1">{safeCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Warning Level</p>
            <h3 className="text-3xl font-bold text-amber-600 mt-1">{warningCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Users</p>
            <h3 className="text-3xl font-bold text-blue-600 mt-1">{users.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Sources + Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Latest Water Stations Registered</h2>
              <p className="text-xs text-slate-500">Live surveillance data from sanitization field inspectors</p>
            </div>
            <Link to="/water-sources" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View All Registry →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Station Name</th>
                  <th className="py-3 px-4">Barangay</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">E. Coli</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {locations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400">
                      {loading ? "Loading database..." : "No water stations registered yet."}
                    </td>
                  </tr>
                ) : (
                  locations.slice(0, 6).map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{l.name}</td>
                      <td className="py-3.5 px-4 text-slate-600">Brgy. {l.barangay}</td>
                      <td className="py-3.5 px-4 text-slate-600 capitalize">{l.source_type?.replace(/_/g, " ") || "Well"}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          l.status === "safe" ? "bg-emerald-100 text-emerald-800" : l.status === "warning" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">{l.e_coli_count ?? 0} CFU</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick System Navigation Cards */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Quick Shortcuts</h3>
            <div className="space-y-2 text-xs">
              <Link
                to="/users"
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-100 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Users size={16} className="text-blue-600" />
                  <span className="font-semibold text-slate-800 group-hover:text-blue-900">User Management</span>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600" />
              </Link>

              <Link
                to="/forecast-config"
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-100 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Activity size={16} className="text-cyan-600" />
                  <span className="font-semibold text-slate-800 group-hover:text-blue-900">ML Forecast Engine</span>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-cyan-900 rounded-3xl p-6 text-white shadow-md space-y-2">
            <h3 className="font-bold text-sm">Spatial Risk Prediction</h3>
            <p className="text-xs text-white/80 leading-relaxed">
              Household risk calculation algorithms are running with active buffer distances.
            </p>
            <Link
              to="/forecast-config"
              className="inline-block pt-2 text-xs font-semibold text-cyan-300 hover:text-white"
            >
              Configure ML Formula Weights →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
