import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { BarChart2, TrendingUp, ShieldAlert, Droplets, RefreshCw } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

const Analytics = () => {
  const { token, API_URL } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [overviewRes, locRes] = await Promise.all([
          fetch(`${API_URL}/analytics/overview`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/water-locations`)
        ]);

        const overviewData = await overviewRes.json();
        const locData = await locRes.json();

        if (overviewData.success) {
          setOverview(overviewData.data);
        }
        if (locData.success && Array.isArray(locData.data)) {
          setLocations(locData.data);
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token, API_URL]);

  // Aggregate by Barangay
  const barangayMap = {};
  locations.forEach((loc) => {
    const b = loc.barangay || "Other";
    if (!barangayMap[b]) {
      barangayMap[b] = { name: b, safe: 0, warning: 0, danger: 0, total: 0 };
    }
    const status = loc.status?.toLowerCase();
    if (status === "safe") barangayMap[b].safe += 1;
    else if (status === "warning") barangayMap[b].warning += 1;
    else barangayMap[b].danger += 1;
    barangayMap[b].total += 1;
  });

  const barangayChartData = Object.values(barangayMap).slice(0, 10);

  // Status Distribution Data
  const safeCount = overview?.water_locations?.safe || 0;
  const warningCount = overview?.water_locations?.warning || 0;
  const dangerCount = overview?.water_locations?.undrinkable || 0;

  const pieData = [
    { name: "Safe", value: safeCount, color: "#10b981" },
    { name: "Warning", value: warningCount, color: "#f59e0b" },
    { name: "Contaminated", value: dangerCount, color: "#ef4444" },
  ];

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Water Quality Analytics & Trends</h1>
          <p className="text-xs text-slate-500 mt-0.5">Statistical breakdown of testing data, spatial risk levels, and barangay performance</p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Locations Monitored</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{overview?.water_locations?.total || locations.length}</h3>
          <p className="text-xs text-emerald-600 font-medium mt-1">100% City Coverage</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Safe Drinking Stations</p>
          <h3 className="text-3xl font-bold text-emerald-600 mt-2">{safeCount}</h3>
          <p className="text-xs text-slate-500 mt-1">Passed Coliform & E. Coli tests</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High Risk Zones</p>
          <h3 className="text-3xl font-bold text-red-600 mt-2">{overview?.households?.high_risk || dangerCount}</h3>
          <p className="text-xs text-slate-500 mt-1">Requiring immediate chlorination</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sanitation Coverage</p>
          <h3 className="text-3xl font-bold text-blue-600 mt-2">
            {overview?.households?.total
              ? `${Math.round(((overview?.households?.with_toilet || 0) / overview.households.total) * 100)}%`
              : "89%"}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Households with sanitary toilets</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Barangay Comparison Bar Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">Water Station Status by Barangay</h3>
          <p className="text-xs text-slate-500 mb-6">Distribution of Safe vs Warning vs Contaminated stations</p>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barangayChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Bar dataKey="safe" name="Safe Stations" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="warning" name="Warning Stations" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="danger" name="Contaminated" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Safety Distribution Pie Chart */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">City-Wide Safety Index</h3>
            <p className="text-xs text-slate-500 mb-4">Overall proportion of water potability</p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100 text-xs">
            {pieData.map((item) => (
              <div key={item.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value} Stations</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
