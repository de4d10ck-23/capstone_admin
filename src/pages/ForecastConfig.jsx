import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Settings, Save, CheckCircle2, AlertCircle, Cpu, Sliders } from "lucide-react";

const ForecastConfig = () => {
  const { token, API_URL } = useAuth();
  const [config, setConfig] = useState({
    distance_weight: 0.4,
    toilet_weight: 0.35,
    coliform_weight: 0.25,
    buffer_radius_meters: 500,
    high_risk_threshold: 25.0
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/forecast/config`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setConfig(data.data);
        }
      } catch (err) {
        console.error("Error fetching forecast config:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [token, API_URL]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    setSaving(true);

    try {
      const res = await fetch(`${API_URL}/forecast/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Spatial forecasting weights updated and applied to risk model!");
      } else {
        setErrorMsg(data.detail || "Failed to update config.");
      }
    } catch (err) {
      console.error("Error saving forecast config:", err);
      setErrorMsg("Network error saving configuration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Spatial Risk & Machine Learning Model Config</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tune algorithmic weights for household contamination vulnerability and proximity algorithms
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-8">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Cpu size={24} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Risk Calculation Formula Parameters</h2>
            <p className="text-xs text-slate-500">Weights should sum up to 1.0 (100% influence)</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Distance to Contaminated Well Weight: {Math.round(config.distance_weight * 100)}%
                </label>
                <span className="font-mono text-xs font-bold text-blue-600">{config.distance_weight}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.distance_weight}
                onChange={(e) => setConfig({ ...config, distance_weight: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Unhygienic Toilet Proximity Weight: {Math.round(config.toilet_weight * 100)}%
                </label>
                <span className="font-mono text-xs font-bold text-blue-600">{config.toilet_weight}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.toilet_weight}
                onChange={(e) => setConfig({ ...config, toilet_weight: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Coliform Severity Multiplier Weight: {Math.round(config.coliform_weight * 100)}%
                </label>
                <span className="font-mono text-xs font-bold text-blue-600">{config.coliform_weight}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.coliform_weight}
                onChange={(e) => setConfig({ ...config, coliform_weight: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Surveillance Buffer Radius (Meters)
              </label>
              <input
                type="number"
                value={config.buffer_radius_meters}
                onChange={(e) => setConfig({ ...config, buffer_radius_meters: parseInt(e.target.value) || 500 })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">Surveillance distance around positive water wells</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                High Risk Threshold Index
              </label>
              <input
                type="number"
                step="0.5"
                value={config.high_risk_threshold}
                onChange={(e) => setConfig({ ...config, high_risk_threshold: parseFloat(e.target.value) || 25.0 })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">Score above which triggers an automated outbreak alert</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-70"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Configuration...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save ML Model Parameters</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForecastConfig;
