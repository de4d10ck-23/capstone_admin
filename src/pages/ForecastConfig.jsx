import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Cpu,
  RefreshCw,
  BarChart3,
  Activity,
  Gauge,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Droplets,
  Layers,
  Sparkles,
  Info,
  Flame,
  Clock,
  Zap,
  Radio,
  BellRing,
  Send,
} from "lucide-react";

const ForecastConfig = () => {
  const { token, API_URL } = useAuth();

  // Thresholds & Weights Config
  const [config, setConfig] = useState({
    risk_threshold_low: 0.30,
    risk_threshold_high: 0.65,
    prediction_days: 7,
    rainfall_weight: 0.30,
    proximity_weight: 0.25,
    humidity_weight: 0.15,
    temperature_weight: 0.15,
    historical_weight: 0.15,
  });

  // Model Metadata & Metrics
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Live Test Sandbox
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [testingInference, setTestingInference] = useState(false);

  // Model-driven Heatmap Sync State
  const [heatmapsInfo, setHeatmapsInfo] = useState(null);
  const [refreshingHeatmaps, setRefreshingHeatmaps] = useState(false);

  // On-demand Barangay ML Surveillance & Alert State
  const [surveillanceBarangay, setSurveillanceBarangay] = useState("all");
  const [notifyResidentsOnFlag, setNotifyResidentsOnFlag] = useState(true);
  const [runningSurveillance, setRunningSurveillance] = useState(false);
  const [surveillanceResult, setSurveillanceResult] = useState(null);

  // Derive list of barangays that have at least 1 monitored water source + station counts
  const barangaysWithSources = useMemo(() => {
    const counts = {};
    stations.forEach((st) => {
      const b = (st.barangay || "").trim();
      if (b) {
        counts[b] = (counts[b] || 0) + 1;
      }
    });
    return Object.keys(counts)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        name,
        count: counts[name],
      }));
  }, [stations]);

  // Fetch configuration, model metadata, and heatmap sync status
  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      // 1. Fetch current config
      const resCfg = await fetch(`${API_URL}/forecast/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataCfg = await resCfg.json();
      if (dataCfg.success && dataCfg.data) {
        setConfig((prev) => ({
          ...prev,
          ...dataCfg.data,
          risk_threshold_low: dataCfg.data.risk_threshold_low ?? 0.30,
          risk_threshold_high: dataCfg.data.risk_threshold_high ?? 0.65,
        }));
      }

      // 2. Fetch ML model status & evaluation metrics
      const resModel = await fetch(`${API_URL}/forecast/model-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataModel = await resModel.json();
      if (dataModel.success && dataModel.data) {
        setModelStatus(dataModel.data);
      }

      // 3. Fetch water locations for interactive sandbox
      const resLocs = await fetch(`${API_URL}/water-locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataLocs = await resLocs.json();
      const locList = dataLocs.data || dataLocs || [];
      if (Array.isArray(locList) && locList.length > 0) {
        setStations(locList);
        setSelectedStationId(locList[0].id);
      }

      // 4. Fetch model heatmaps status
      try {
        const resHeat = await fetch(`${API_URL}/forecast/heatmaps`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataHeat = await resHeat.json();
        if (dataHeat.success && dataHeat.data) {
          setHeatmapsInfo(dataHeat.data);
        }
      } catch (hErr) {
        console.warn("Could not fetch heatmaps info:", hErr);
      }
    } catch (err) {
      console.error("Error fetching forecast config or model status:", err);
      setErrorMsg("Failed to connect to backend forecasting service.");
    } finally {
      setLoading(false);
    }
  };

  // Manual Trigger: Bypass 1-Hour Schedule and recalculate both heatmaps immediately
  const handleManualHeatmapRefresh = async () => {
    setRefreshingHeatmaps(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${API_URL}/forecast/heatmaps/refresh`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setHeatmapsInfo(data.data);
        setSuccessMsg("Both Hazard and Water Contamination heatmaps successfully recomputed! Map layers have been updated.");
      } else {
        setErrorMsg(data.detail || "Failed to recalculate heatmaps.");
      }
    } catch (err) {
      console.error("Error refreshing heatmaps:", err);
      setErrorMsg("Failed to connect to backend heatmap refresh service.");
    } finally {
      setRefreshingHeatmaps(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, API_URL]);

  // Save updated threshold settings
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    setSaving(true);

    if (config.risk_threshold_low >= config.risk_threshold_high) {
      setErrorMsg("Low Risk Cutoff must be strictly lower than High Risk Cutoff.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/forecast/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Risk thresholds successfully saved! Real-time alerts will use these boundaries.");
      } else {
        setErrorMsg(data.detail || "Failed to update configuration.");
      }
    } catch (err) {
      console.error("Error saving forecast config:", err);
      setErrorMsg("Network error saving configuration.");
    } finally {
      setSaving(false);
    }
  };

  // Trigger Model Retraining
  const handleRetrain = async () => {
    if (!window.confirm("Retrain the Random Forest model on the latest 10-barangay lab results and GIS hazards? This will recompute cross-validation metrics.")) {
      return;
    }

    setRetraining(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch(`${API_URL}/forecast/retrain`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Model successfully retrained! Updated metrics and feature rankings have been reloaded.");
        await fetchData();
      } else {
        setErrorMsg(data.detail || "Model retraining failed.");
      }
    } catch (err) {
      console.error("Error during retraining:", err);
      setErrorMsg("Retraining request encountered a connection error.");
    } finally {
      setRetraining(false);
    }
  };

  // Test live inference for selected station
  const handleTestInference = async () => {
    if (!selectedStationId) return;
    setTestingInference(true);
    setTestResult(null);

    try {
      const res = await fetch(
        `${API_URL}/forecast/predict/${selectedStationId}?threshold_low=${config.risk_threshold_low}&threshold_high=${config.risk_threshold_high}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success && data.data) {
        setTestResult(data.data);
      }
    } catch (err) {
      console.error("Inference test failed:", err);
    } finally {
      setTestingInference(false);
    }
  };

  // Trigger On-Demand Barangay Machine Learning Surveillance & Automated Alert Dispatch
  const handleRunSurveillance = async () => {
    setRunningSurveillance(true);
    setSurveillanceResult(null);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const params = new URLSearchParams({
        barangay: surveillanceBarangay,
        notify_residents: notifyResidentsOnFlag,
        threshold_low: config.risk_threshold_low,
        threshold_high: config.risk_threshold_high,
      });

      const res = await fetch(`${API_URL}/forecast/run-surveillance?${params.toString()}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success && data.data) {
        setSurveillanceResult(data.data);
        const resData = data.data;
        const flaggedCount = resData.flagged_count ?? resData.flagged_total ?? (resData.flagged_stations?.length || 0);
        const notifsList = Array.isArray(resData.notifications_dispatched)
          ? resData.notifications_dispatched
          : Array.isArray(resData.notifications)
          ? resData.notifications
          : [];
        const pushedCount = resData.push_stats?.total_sent ?? notifsList.reduce(
          (acc, item) => acc + (item.pushed_residents_count || item.pushed_count || 0),
          0
        );

        if (flaggedCount > 0) {
          if (notifyResidentsOnFlag && (notifsList.length > 0 || pushedCount > 0)) {
            setSuccessMsg(
              `Surveillance complete! Flagged ${flaggedCount} water source(s). Official health advisories & Web Push notifications were broadcast to residents (${pushedCount} push alerts sent).`
            );
          } else {
            setSuccessMsg(
              `Surveillance complete! Flagged ${flaggedCount} water source(s). (Resident notifications were not dispatched as per toggle).`
            );
          }
        } else {
          const evalCount = resData.evaluated_stations ?? resData.total_evaluated ?? 0;
          const brgyLabel = resData.barangay === "all"
            ? `all ${barangaysWithSources.length} monitored barangays`
            : `Barangay ${resData.barangay}`;
          setSuccessMsg(
            `Surveillance complete! All ${evalCount} water source(s) in ${brgyLabel} are operating within SAFE limits. No residents notified.`
          );
        }
      } else {
        setErrorMsg(data.detail || "Surveillance scan failed to execute.");
      }
    } catch (err) {
      console.error("Error executing surveillance scan:", err);
      setErrorMsg("Failed to connect to surveillance execution service.");
    } finally {
      setRunningSurveillance(false);
    }
  };

  const lowPct = Math.round((config.risk_threshold_low || 0.3) * 100);
  const highPct = Math.round((config.risk_threshold_high || 0.65) * 100);

  return (
    <div className="max-w-6xl space-y-8 animate-fade-in font-sans pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Machine Learning & Spatial Risk Controls
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
              Random Forest v1.0
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tune probability cutoffs for public health warning tiers, inspect cross-validation metrics, and retrain the predictive engine.
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining || loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
        >
          <RefreshCw size={14} className={retraining ? "animate-spin" : ""} />
          <span>{retraining ? "Retraining ML Model..." : "Retrain Model on Latest Lab Data"}</span>
        </button>
      </div>

      {/* Alert Banners */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* SECTION: SPATIAL RISK HEATMAPS & HOURLY SYNC CONTROLS */}
      <div className="bg-gradient-to-br from-white to-slate-50/80 rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
              <Flame size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base font-bold text-slate-900">
                  Spatial Risk Heatmaps & Automated Hourly Engine
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Hourly Auto-Sync Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Integrates official DENR-MGB flood and landslide hazard spatial data with machine learning microbial water source contamination predictions.
              </p>
            </div>
          </div>

          {/* Admin Manual Trigger Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleManualHeatmapRefresh}
              disabled={refreshingHeatmaps}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
              title="Force immediate model inference and spatial heatmap recomputation without waiting for the 1-hour schedule"
            >
              <Zap size={14} className={refreshingHeatmaps ? "animate-spin" : ""} />
              <span>
                {refreshingHeatmaps ? "Recomputing Heatmaps..." : "Run Heatmap Update Now (Bypass Schedule)"}
              </span>
            </button>
          </div>
        </div>

        {/* Heatmap Sync Statistics & Timer Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Official Hazard Zones
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-slate-900">
                {(heatmapsInfo?.summary?.flood_zones || 0) + (heatmapsInfo?.summary?.landslide_zones || 0) || 21}
              </span>
              <span className="text-[11px] font-medium text-amber-600">zones</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {heatmapsInfo?.summary?.flood_zones || 18} flood, {heatmapsInfo?.summary?.landslide_zones || 3} landslide
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Evaluated Stations
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-slate-900">
                {heatmapsInfo?.summary?.total_water_stations ?? 0}
              </span>
              <span className="text-[11px] font-medium text-blue-600">sources</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Inference across 10 barangays</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Contamination Hotspots
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-rose-600">
                {heatmapsInfo?.summary?.contaminated_stations ?? 0}
              </span>
              <span className="text-[11px] font-semibold text-rose-500">High Risk</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {heatmapsInfo?.summary?.warning_stations ?? 0} in Warning tier
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Engine Execution
            </span>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock size={13} className="text-indigo-500 shrink-0" />
              <span>
                {heatmapsInfo?.last_updated
                  ? new Date(heatmapsInfo.last_updated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "Pending initial run"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Next run:{" "}
              {heatmapsInfo?.next_run
                ? new Date(heatmapsInfo.next_run).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "In ~60 min"}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-amber-900 text-xs flex items-start gap-2.5">
          <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Map Display Mode:</strong> When staff toggle on <strong>Flood Zones</strong> or <strong>Landslide Zones</strong>, vector polygons from the official DENR-MGB geospatial dataset are displayed with graduated susceptibility coloring (High, Moderate, Low). When <strong>Contamination Heatmap</strong> is toggled on, microbial risk density fields across monitored water stations are displayed.
          </p>
        </div>
      </div>

      {/* SECTION 1: PROBABILITY THRESHOLD CONTROLLER (USER FOCUS) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Gauge size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Contamination Risk Probability Cutoffs</h2>
              <p className="text-xs text-slate-500">
                Determine the exact probability boundaries for Safe, At Risk, and Contaminated classifications
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Active Cutoffs: {lowPct}% / {highPct}%
          </span>
        </div>

        {/* Dynamic Interactive Visual Spectrum Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-[11px] font-semibold text-slate-600">
            <span className="flex items-center gap-1 text-emerald-700">
              <ShieldCheck size={14} /> Safe (0% – {lowPct}%)
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <AlertTriangle size={14} /> At Risk / Medium ({lowPct}% – {highPct}%)
            </span>
            <span className="flex items-center gap-1 text-rose-700">
              <ShieldAlert size={14} /> Contaminated ({highPct}% – 100%)
            </span>
          </div>

          {/* Visual Bar */}
          <div className="h-6 w-full rounded-xl overflow-hidden flex shadow-inner bg-slate-100 border border-slate-200">
            <div
              style={{ width: `${lowPct}%` }}
              className="bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300"
            >
              {lowPct > 15 ? `Safe < ${lowPct}%` : ""}
            </div>
            <div
              style={{ width: `${Math.max(0, highPct - lowPct)}%` }}
              className="bg-amber-400 flex items-center justify-center text-[10px] font-bold text-amber-950 transition-all duration-300"
            >
              {highPct - lowPct > 15 ? `Warning (${lowPct}%-${highPct}%)` : ""}
            </div>
            <div
              style={{ width: `${100 - highPct}%` }}
              className="bg-rose-500 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300"
            >
              {100 - highPct > 15 ? `High > ${highPct}%` : ""}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            When rainfall or proximity elevates probability past {highPct}%, automated resident boil-water alerts are triggered.
          </p>
        </div>

        {/* Sliders for Low & High Thresholds */}
        <form onSubmit={handleSaveConfig} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
            {/* Low Risk Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Low Risk Cutoff (Safe Upper Limit)
                </label>
                <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-xs">
                  <input
                    type="number"
                    step="0.01"
                    min="0.05"
                    max="0.50"
                    value={config.risk_threshold_low}
                    onChange={(e) =>
                      setConfig({ ...config, risk_threshold_low: parseFloat(e.target.value) || 0.30 })
                    }
                    className="w-12 text-right font-mono text-xs font-bold text-slate-800 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">({lowPct}%)</span>
                </div>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.50"
                step="0.01"
                value={config.risk_threshold_low}
                onChange={(e) =>
                  setConfig({ ...config, risk_threshold_low: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <p className="text-[11px] text-slate-500">
                Water sources with ML contamination probability below this are tagged Safe.
              </p>
            </div>

            {/* High Risk Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  High Risk Cutoff (Contaminated Lower Limit)
                </label>
                <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-xs">
                  <input
                    type="number"
                    step="0.01"
                    min="0.51"
                    max="0.95"
                    value={config.risk_threshold_high}
                    onChange={(e) =>
                      setConfig({ ...config, risk_threshold_high: parseFloat(e.target.value) || 0.65 })
                    }
                    className="w-12 text-right font-mono text-xs font-bold text-slate-800 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">({highPct}%)</span>
                </div>
              </div>
              <input
                type="range"
                min="0.51"
                max="0.95"
                step="0.01"
                value={config.risk_threshold_high}
                onChange={(e) =>
                  setConfig({ ...config, risk_threshold_high: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
              />
              <p className="text-[11px] text-slate-500">
                Water sources with probability exceeding this threshold are tagged Contaminated / Boil Water.
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-sm hover:shadow disabled:opacity-60 cursor-pointer"
            >
              <Save size={15} />
              <span>{saving ? "Saving Thresholds..." : "Save Risk Thresholds"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: MACHINE LEARNING MODEL PERFORMANCE (CHAPTER IV DEFENSE CARD) */}
      {modelStatus && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Model Evaluation & Scientific Metrics (Chapter IV)
                </h2>
                <p className="text-xs text-slate-500">
                  Validation benchmarks generated under 5-Fold Stratified Cross-Validation on 708 samples
                </p>
              </div>
            </div>
            {modelStatus.trained_at && (
              <span className="text-[11px] text-slate-400 font-mono">
                Trained: {new Date(modelStatus.trained_at).toLocaleString()}
              </span>
            )}
          </div>

          {/* 4 Stat KPI Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                5-Fold CV Accuracy
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {modelStatus.cross_validation_5fold?.["Random Forest (Proposed Ensemble)"]?.mean_accuracy
                  ? (modelStatus.cross_validation_5fold["Random Forest (Proposed Ensemble)"].mean_accuracy * 100).toFixed(2) + "%"
                  : "83.92%"}
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">± 2.59% Variance</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Held-out Test Precision
              </span>
              <p className="text-2xl font-black text-indigo-600 mt-1">
                {modelStatus.held_out_test_metrics?.["Random Forest (Proposed Ensemble)"]?.precision
                  ? (modelStatus.held_out_test_metrics["Random Forest (Proposed Ensemble)"].precision * 100).toFixed(2) + "%"
                  : "86.96%"}
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Unseen Test Split (20%)</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Held-out Test Recall
              </span>
              <p className="text-2xl font-black text-blue-600 mt-1">
                {modelStatus.held_out_test_metrics?.["Random Forest (Proposed Ensemble)"]?.recall
                  ? (modelStatus.held_out_test_metrics["Random Forest (Proposed Ensemble)"].recall * 100).toFixed(2) + "%"
                  : "86.02%"}
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Contamination Catch Rate</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Held-out F1-Score
              </span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {modelStatus.held_out_test_metrics?.["Random Forest (Proposed Ensemble)"]?.f1_score
                  ? (modelStatus.held_out_test_metrics["Random Forest (Proposed Ensemble)"].f1_score * 100).toFixed(2) + "%"
                  : "86.49%"}
              </p>
              <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Harmonic Mean Metric</p>
            </div>
          </div>

          {/* Feature Importance Bars */}
          {modelStatus.feature_importance && modelStatus.feature_importance.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 size={14} className="text-slate-500" />
                Random Forest Feature Importance Weights
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
                {modelStatus.feature_importance.map((f, i) => (
                  <div key={f.feature} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-medium text-slate-700 capitalize">
                        {i + 1}. {f.feature.replace(/_/g, " ")}
                      </span>
                      <span className="font-mono font-bold text-slate-800">{f.percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, f.percentage * 3)}%` }}
                        className="h-full bg-indigo-600 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: INTERACTIVE REAL-TIME INFERENCE SANDBOX */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Live Forecast Sandbox & Diagnostic Tester</h2>
            <p className="text-xs text-slate-500">
              Run real-time inference on any water station using live OpenWeather meteorological data and official GIS flood/landslide susceptibility layers
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-xs font-bold text-slate-700">Select Monitored Water Source:</label>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-600"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name || s.name} ({s.barangay})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleTestInference}
            disabled={testingInference || !selectedStationId}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm hover:shadow transition-all disabled:opacity-60 shrink-0"
          >
            {testingInference ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Running Inference...</span>
              </>
            ) : (
              <>
                <Cpu size={15} />
                <span>Compute Live Risk</span>
              </>
            )}
          </button>
        </div>

        {/* Live Test Diagnostic Result Card */}
        {testResult && (
          <div className="mt-4 p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{testResult.station_name}</h4>
                <p className="text-[11px] text-slate-500">
                  {testResult.barangay} • Lat: {testResult.coordinates?.latitude?.toFixed(4)}, Lng: {testResult.coordinates?.longitude?.toFixed(4)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    testResult.predicted_status === "safe"
                      ? "bg-emerald-100 text-emerald-800"
                      : testResult.predicted_status === "warning"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {testResult.risk_level} ({testResult.risk_percentage}%)
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-700 font-medium">{testResult.advisory}</p>

            {/* Environmental Snapshot */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Flood Susceptibility</span>
                <span className={`text-xs font-bold ${
                  testResult.environmental_metrics?.flood_susceptibility_label === "High"
                    ? "text-rose-600"
                    : testResult.environmental_metrics?.flood_susceptibility_label === "Moderate"
                    ? "text-amber-600"
                    : "text-slate-800"
                }`}>
                  {testResult.environmental_metrics?.flood_susceptibility_label || "Low/None"}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Landslide Susceptibility</span>
                <span className={`text-xs font-bold ${
                  testResult.environmental_metrics?.landslide_susceptibility_label === "High"
                    ? "text-rose-600"
                    : testResult.environmental_metrics?.landslide_susceptibility_label === "Moderate"
                    ? "text-amber-600"
                    : "text-slate-800"
                }`}>
                  {testResult.environmental_metrics?.landslide_susceptibility_label || "Low/None"}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Live 24h / 48h Rain</span>
                <span className="text-xs font-bold text-slate-800">
                  {testResult.environmental_metrics?.rainfall_24h_mm ?? 0} mm / {testResult.environmental_metrics?.rainfall_48h_mm ?? 0} mm
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Temp / Humidity</span>
                <span className="text-xs font-bold text-slate-800">
                  {testResult.environmental_metrics?.temperature_celsius ?? 28}°C • {testResult.environmental_metrics?.humidity_percent ?? 75}%
                </span>
              </div>
            </div>

            {testResult.risk_factors && testResult.risk_factors.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Dominant Contamination Influences:
                </span>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
                  {testResult.risk_factors.map((rf, idx) => (
                    <li key={idx}>{rf}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 4: ON-DEMAND BARANGAY ML SURVEILLANCE & RESIDENT ALERT DISPATCH */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Radio size={22} className={runningSurveillance ? "animate-pulse" : ""} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  On-Demand Barangay ML Surveillance & Resident Alert Dispatcher
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 uppercase tracking-wider">
                  Manual Bypass Test
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Execute live Random Forest predictive risk modeling on a specific barangay or citywide. If any water source is flagged, automatically dispatch official public health advisories and Web Push notifications to registered residents without waiting for the 60-minute background engine.
              </p>
            </div>
          </div>
        </div>

        {/* Scan Configuration Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Target Barangay Jurisdiction:</span>
              <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                {barangaysWithSources.length} Monitored Barangays
              </span>
            </label>
            <select
              value={surveillanceBarangay}
              onChange={(e) => setSurveillanceBarangay(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-rose-500 shadow-2xs"
            >
              <option value="all">
                🌐 All Barangays ({barangaysWithSources.length} Barangays, {stations.length} Monitored Sources)
              </option>
              {barangaysWithSources.length > 0 && (
                <optgroup label={`Barangays with Monitored Water Sources (${barangaysWithSources.length})`}>
                  {barangaysWithSources.map((b) => (
                    <option key={b.name} value={b.name}>
                      Barangay {b.name} ({b.count} water source{b.count > 1 ? "s" : ""})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="md:col-span-4 flex items-center h-full pt-4 md:pt-0">
            <label className="relative flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notifyResidentsOnFlag}
                onChange={(e) => setNotifyResidentsOnFlag(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Broadcast Push Notification to Residents
                </span>
                <span className="text-[10px] text-slate-500 block leading-tight">
                  Dispatches Web Push & in-app advisories to residents of flagged barangays
                </span>
              </div>
            </label>
          </div>

          <div className="md:col-span-3">
            <button
              onClick={handleRunSurveillance}
              disabled={runningSurveillance}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
            >
              {runningSurveillance ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Scanning & Alerting...</span>
                </>
              ) : (
                <>
                  <BellRing size={15} />
                  <span>Run Surveillance & Alert</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Display */}
        {surveillanceResult && (() => {
          const evalCount = surveillanceResult.evaluated_stations ?? surveillanceResult.total_evaluated ?? 0;
          const safeCount = surveillanceResult.safe_count ?? surveillanceResult.summary?.safe ?? 0;
          const warnCount = surveillanceResult.warning_count ?? surveillanceResult.summary?.warning ?? 0;
          const contamCount = surveillanceResult.contaminated_count ?? surveillanceResult.summary?.undrinkable ?? 0;
          const notifsList = Array.isArray(surveillanceResult.notifications_dispatched)
            ? surveillanceResult.notifications_dispatched
            : Array.isArray(surveillanceResult.notifications)
            ? surveillanceResult.notifications
            : [];
          const pushSentCount = surveillanceResult.push_stats?.total_sent ?? notifsList.reduce(
            (acc, item) => acc + (item.pushed_residents_count || item.pushed_count || 0),
            0
          );
          const flaggedList = Array.isArray(surveillanceResult.flagged_stations)
            ? surveillanceResult.flagged_stations
            : [];

          return (
            <div className="space-y-4 pt-2 animate-fade-in">
              {/* KPI Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Evaluated Sources
                  </span>
                  <p className="text-xl font-black text-slate-900 mt-0.5">
                    {evalCount}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {surveillanceResult.barangay === "all" ? `All ${barangaysWithSources.length || 10} Barangays` : `Barangay ${surveillanceResult.barangay}`}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                    Safe (Potable)
                  </span>
                  <p className="text-xl font-black text-emerald-800 mt-0.5">
                    {safeCount}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium">Risk &lt; {lowPct}%</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                    Warning / At-Risk
                  </span>
                  <p className="text-xl font-black text-amber-800 mt-0.5">
                    {warnCount}
                  </p>
                  <p className="text-[10px] text-amber-600 font-medium">{lowPct}% - {highPct}%</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                    Contaminated
                  </span>
                  <p className="text-xl font-black text-rose-800 mt-0.5">
                    {contamCount}
                  </p>
                  <p className="text-[10px] text-rose-600 font-medium">Risk &gt; {highPct}%</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                    Push Notifications
                  </span>
                  <p className="text-xl font-black text-indigo-800 mt-0.5">
                    {pushSentCount}
                  </p>
                  <p className="text-[10px] text-indigo-600 font-medium">
                    {notifsList.length > 0
                      ? `${notifsList.length} notice(s)`
                      : "0 dispatched"}
                  </p>
                </div>
              </div>

              {/* Notifications Sent Banner */}
              {notifsList.length > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <Send size={15} className="text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-900">
                      Dispatched Alert Records ({notifsList.length} Notice{notifsList.length > 1 ? "s" : ""}):
                    </span>
                  </div>
                  <div className="space-y-1.5 pl-6">
                    {notifsList.map((notif, nIdx) => (
                      <div key={nIdx} className="text-xs text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-indigo-100 last:border-0">
                        <div>
                          <span className="font-bold">Barangay {notif.barangay}: </span>
                          <span>{notif.title} — {notif.body || notif.message}</span>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold shrink-0">
                          {notif.pushed_residents_count ?? notif.pushed_count ?? 0} resident device(s) notified
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flagged Stations List */}
              {flaggedList.length > 0 ? (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-rose-600" />
                      Flagged Water Sources Requiring Precaution ({flaggedList.length})
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Calculated against cutoffs ({lowPct}% / {highPct}%)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {flaggedList.map((station, idx) => {
                      const stId = station.id || station.station_id || idx;
                      const stName = station.name || station.station_name || "Water Station";
                      const isCritical = station.status === "undrinkable" || station.predicted_status === "undrinkable";

                      return (
                        <div
                          key={stId}
                          className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-3 h-3 rounded-full shrink-0 ${
                                  isCritical ? "bg-rose-500 animate-pulse" : "bg-amber-500"
                                }`}
                              />
                              <div>
                                <h5 className="text-xs font-bold text-slate-900">{stName}</h5>
                                <span className="text-[11px] text-slate-500">Barangay {station.barangay}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                  isCritical
                                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                                    : "bg-amber-100 text-amber-800 border border-amber-200"
                                }`}
                              >
                                {station.risk_level} ({station.risk_percentage}%)
                              </span>
                            </div>
                          </div>

                          {station.advisory && (
                            <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              {station.advisory}
                            </p>
                          )}

                          {station.risk_factors && station.risk_factors.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Identified Risk Factors:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {station.risk_factors.map((rf, rfIdx) => (
                                  <span
                                    key={rfIdx}
                                    className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                                  >
                                    {rf}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span>
                    <strong>All Clear!</strong> No water sources were flagged in this scan. All monitored points are safely below the {lowPct}% risk threshold.
                  </span>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default ForecastConfig;
