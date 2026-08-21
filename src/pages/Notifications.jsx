import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Bell, Send, CheckCircle2, AlertCircle, Users, Radio, Trash2 } from "lucide-react";
import { MAASIN_BARANGAYS as barangays } from "../constants/barangays";

const Notifications = () => {
  const { token, API_URL } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("warning");
  const [barangay, setBarangay] = useState("all");
  const [targetRole, setTargetRole] = useState("all");

  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token, API_URL]);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    setIsSending(true);

    try {
      const payload = {
        title,
        message,
        type,
        barangay: barangay === "all" ? null : barangay,
        target_roles: targetRole === "all" ? ["resident", "barangay_official", "sanitization_inspector", "city_health_officer"] : [targetRole]
      };

      const res = await fetch(`${API_URL}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Notification alert successfully broadcasted!");
        setTitle("");
        setMessage("");
        fetchNotifications();
      } else {
        setErrorMsg(data.detail || "Failed to send notification.");
      }
    } catch (err) {
      console.error("Error sending notification:", err);
      setErrorMsg("Network error broadcasting alert.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Broadcast Alerts & Health Advisories</h1>
          <p className="text-xs text-slate-500 mt-0.5">Send critical notices and contamination boil-water warnings to citizens and staff</p>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Broadcast Composer */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Radio size={20} className="text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Compose New Broadcast Alert</h2>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Alert Subject</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Boil Water Advisory for Purok 3"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Alert Severity</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="info">Information (Routine Notice)</option>
                  <option value="warning">Warning (Precautionary Advisory)</option>
                  <option value="critical">Critical (Emergency Boil Order)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Target Location</label>
                <select
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="all">Entire City (All Barangays)</option>
                  {barangays.map((b) => (
                    <option key={b} value={b}>Brgy. {b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Target Audience</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="all">Everyone (Residents & Officials)</option>
                <option value="resident">Residents Only</option>
                <option value="barangay_official">Barangay Officials Only</option>
                <option value="sanitization_inspector">Sanitization Inspectors Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Advisory Message</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type the full advisory instructions for the public..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 placeholder:text-slate-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3.5 rounded-full bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Transmitting Alert...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Broadcast Notification</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* History Stream */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Broadcast History ({notifications.length})</h2>
          </div>

          <div className="space-y-3 pt-2 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-10 text-slate-400 text-xs">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-400">
                No notifications broadcasted yet.
              </div>
            ) : (
              notifications.map((n) => {
                const isCritical = n.type === "critical";
                const isWarning = n.type === "warning";

                return (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCritical
                        ? "bg-red-50/60 border-red-200"
                        : isWarning
                        ? "bg-amber-50/60 border-amber-200"
                        : "bg-blue-50/60 border-blue-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          isCritical
                            ? "bg-red-200 text-red-900"
                            : isWarning
                            ? "bg-amber-200 text-amber-900"
                            : "bg-blue-200 text-blue-900"
                        }`}>
                          {n.type || "Notice"}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900">{n.title}</h4>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {n.created_at ? new Date(n.created_at).toLocaleDateString() : "Recent"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">{n.message}</p>
                    <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex justify-between text-[10px] text-slate-500 font-medium">
                      <span>Coverage: {n.barangay ? `Brgy. ${n.barangay}` : "All Barangays"}</span>
                      <span className="capitalize">Target: {n.target_roles?.join(", ") || "Public"}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
