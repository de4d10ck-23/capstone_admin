import React, { useState, useEffect, useRef } from "react";
import ErrorNotice from "../components/ErrorNotice";
import { useAuth } from "../context/AuthContext";
import { Droplets, Plus, Search, Edit2, Trash2, ArchiveRestore, MapPin, CheckCircle, AlertCircle, X, ShieldCheck, AlertTriangle, Calendar, Clock } from "lucide-react";
import { MAASIN_BARANGAYS as barangays } from "../constants/barangays";

const WaterSources = () => {
  const { token, API_URL } = useAuth();
  const [sources, setSources] = useState([]);
  const [archivedSources, setArchivedSources] = useState([]);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [editingSource, setEditingSource] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    source_type: "deep_well",
    barangay: "Combado",
    latitude: 10.1330,
    longitude: 124.8700,
    status: "safe",
    e_coli_present: false,
    e_coli_count: 0,
    coliform_count: 0,
    sample_date: "",
    sample_time: "",
    description: ""
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchSources = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/water-locations`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(typeof data.detail === "string" ? data.detail : "Could not load water sources. Please retry.");
      if (data.success && Array.isArray(data.data)) {
        setSources(data.data);
      }
    } catch (err) {
      console.error("Error fetching water sources:", err);
      setErrorMsg(err.message || "Could not load water sources.");
    } finally {
      setLoading(false);
    }
  };

  const fetchArchive = async () => {
    setArchiveLoading(true);
    try {
      const res = await fetch(`${API_URL}/water-locations/archive`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.detail || "Could not load archived stations.");
      setArchivedSources(data.data || []);
    } catch (err) {
      setErrorMsg(err.message || "Could not load archived stations.");
    } finally { setArchiveLoading(false); }
  };

  useEffect(() => {
    fetchSources();
  }, [API_URL]);

  const handleOpenModal = (sourceToEdit = null) => {
    setErrorMsg("");
    setSuccessMsg("");
    if (sourceToEdit) {
      const rawStatus = (sourceToEdit.status || "safe").toLowerCase();
      const normalizedStatus = rawStatus === "undrinkable" ? "contaminated" : rawStatus;
      const isUnknown = normalizedStatus === "unknown" || sourceToEdit.e_coli === null || sourceToEdit.e_coli === undefined;
      const eColiPresent = isUnknown
        ? "unknown"
        : Boolean(sourceToEdit.e_coli || (sourceToEdit.e_coli_count && Number(sourceToEdit.e_coli_count) > 0))
        ? "present"
        : "not_present";
      setEditingSource(sourceToEdit);

      setFormData({
        name: sourceToEdit.name || sourceToEdit.full_name || "",
        source_type: sourceToEdit.source_type || "unknown",
        barangay: sourceToEdit.barangay || "Combado",
        latitude: sourceToEdit.latitude || 10.1330,
        longitude: sourceToEdit.longitude || 124.8700,
        status: normalizedStatus,
        e_coli_present: eColiPresent,
        e_coli_count: eColiPresent === "present" ? 1 : 0,
        coliform_count: eColiPresent === "present" ? 1 : 0,
        sample_date: sourceToEdit.sample_date || "",
        sample_time: sourceToEdit.sample_time || "",
        description: sourceToEdit.description || ""
      });
    } else {
      setEditingSource(null);
      setFormData({
        name: "",
        source_type: "deep_well",
        barangay: "Combado",
        latitude: 10.1330,
        longitude: 124.8700,
        status: "safe",
        e_coli_present: false,
        e_coli_count: 0,
        coliform_count: 0,
        sample_date: "",
        sample_time: "",
        description: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (savingRef.current) return;
    setErrorMsg("");
    setSuccessMsg("");
    savingRef.current = true;
    setSaving(true);
    try {
      const url = editingSource ? `${API_URL}/water-locations/${editingSource.id}` : `${API_URL}/water-locations`;
      const method = editingSource ? "PUT" : "POST";

      const isPresent = formData.e_coli_present === "present" || formData.e_coli_present === true;
      const isEColiUnknown = formData.e_coli_present === "unknown" || formData.e_coli_present === null;
      const isContaminated = formData.status === "contaminated" || formData.status === "undrinkable";
      const isSafe = formData.status === "safe";
      const isUnknown = formData.status === "unknown" || isEColiUnknown;

      const payload = {
        ...formData,
        status: isContaminated ? "contaminated" : (isUnknown ? "unknown" : (isSafe ? "safe" : "warning")),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        e_coli: (isUnknown || isEColiUnknown) ? null : isPresent,
        e_coli_count: (isUnknown || isEColiUnknown) ? 0 : (isPresent ? 1 : 0),
        coliform_count: (isUnknown || isEColiUnknown) ? 0 : (isPresent ? 1 : 0),
        coliform_bacteria: (isUnknown || isEColiUnknown) ? null : isPresent,
        bacteriological_exam: (isUnknown || isEColiUnknown) ? "untested" : (isPresent || isContaminated ? "failed" : "passed")
      };


      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(editingSource ? "Water source updated!" : "New water station registered!");
        setIsModalOpen(false);
        fetchSources();
      } else {
        setErrorMsg(data.detail || "Operation failed.");
      }
    } catch (err) {
      console.error("Error saving water source:", err);
      setErrorMsg("Network error saving water source.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Archive this water station? You can restore it with its history later.")) return;

    try {
      const res = await fetch(`${API_URL}/water-locations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Water station archived. Its history is preserved.");
        fetchSources();
        if (archiveOpen) fetchArchive();
      } else {
        setErrorMsg(data.detail || "Failed to delete location.");
      }
    } catch (err) {
      console.error("Error deleting location:", err);
      setErrorMsg("Could not archive the station. Check your connection and retry.");
    }
  };

  const handleRestore = async (id) => {
    setArchiveBusy(id);
    setErrorMsg("");
    try {
      const res = await fetch(`${API_URL}/water-locations/${id}/restore`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.detail || "Could not restore station.");
      setSuccessMsg("Water station restored with its original status history.");
      await Promise.all([fetchSources(), fetchArchive()]);
    } catch (err) { setErrorMsg(err.message || "Could not restore station."); }
    finally { setArchiveBusy(""); }
  };

  const filtered = sources.filter((s) => {
    const matchQuery = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       s.barangay?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchBarangay = selectedBarangay === "all" || s.barangay === selectedBarangay;
    const sStat = s.status?.toLowerCase() === "undrinkable" ? "contaminated" : (s.status?.toLowerCase() || "");
    const matchStatus = selectedStatus === "all" || sStat === selectedStatus.toLowerCase();
    return matchQuery && matchBarangay && matchStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Water Sources Registry</h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage tested water stations, wells, taps, and laboratory metrics</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={archiveOpen} onClick={() => { if (!archiveOpen) fetchArchive(); setArchiveOpen(!archiveOpen); }} className={`inline-flex items-center gap-2 border px-4 py-2.5 rounded-full text-xs font-semibold transition-colors ${archiveOpen ? "bg-blue-900 hover:bg-blue-800 text-white border-blue-900 shadow-sm" : "bg-white hover:bg-slate-50 text-slate-800 border-slate-300"}`}>
            <ArchiveRestore size={16} />Archived Stations
          </button>
          <button onClick={() => handleOpenModal()} className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-md hover:shadow-lg transition-all">
            <Plus size={16} /><span>Register New Water Station</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {!isModalOpen && <ErrorNotice error={errorMsg} />}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search station or barangay..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Barangay:</span>
            <select
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
            >
              <option value="all">All Barangays</option>
              {barangays.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="safe">Safe Only</option>
              <option value="warning">Warning Level</option>
              <option value="contaminated">Contaminated</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </div>
      </div>

      {archiveOpen ? <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100"><h2 className="font-bold text-slate-900">Archived water sources</h2><p className="text-xs text-slate-500 mt-1">Restore a station with its original record and status history.</p></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase"><tr><th className="px-6 py-3">Station</th><th className="px-6 py-3">Barangay</th><th className="px-6 py-3">Status when archived</th><th className="px-6 py-3">Archived</th><th className="px-6 py-3 text-right">Action</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {archiveLoading ? <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading archive...</td></tr>
              : archivedSources.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-500">No archived stations.</td></tr>
              : archivedSources.map((source) => <tr key={source.id}>
                <td className="px-6 py-4 font-semibold text-slate-900">{source.full_name || source.name}</td><td className="px-6 py-4 text-slate-600">Brgy. {source.barangay}</td>
                <td className="px-6 py-4 capitalize text-slate-600">{source.status || "Unknown"}</td>
                <td className="px-6 py-4 text-slate-600">{source.archived_at ? new Date(source.archived_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" }) : ""}<span className="block text-slate-400">{source.archived_by_name || "Staff"}</span></td>
                <td className="px-6 py-4 text-right"><button type="button" disabled={Boolean(archiveBusy)} onClick={() => handleRestore(source.id)} className="inline-flex items-center gap-1.5 rounded-full bg-blue-900 text-white px-3 py-2 font-semibold disabled:opacity-50"><ArchiveRestore size={14} />{archiveBusy === source.id ? "Restoring..." : "Restore"}</button></td>
              </tr>)}
          </tbody>
        </table></div>
      </section> : <>
      {/* Sources Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Station Name</th>
                <th className="py-3.5 px-6">Barangay</th>
                <th className="py-3.5 px-6">Source Type</th>
                <th className="py-3.5 px-6">Safety Status</th>
                <th className="py-3.5 px-6">Sample Date & Time</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">Loading water sources...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">No water sources found.</td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isSafe = s.status?.toLowerCase() === "safe";
                  const isWarning = s.status?.toLowerCase() === "warning";
                  const isUnknown = s.status?.toLowerCase() === "unknown";
                  const isContaminated = s.status?.toLowerCase() === "contaminated" || s.status?.toLowerCase() === "undrinkable";
                  const displayStatus = isSafe 
                    ? "Safe" 
                    : isWarning 
                    ? "Warning" 
                    : isContaminated 
                    ? "Contaminated" 
                    : isUnknown 
                    ? "Unknown" 
                    : (s.status || "Unknown");

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">{s.name}</td>
                      <td className="py-4 px-6 text-slate-700 font-medium">Brgy. {s.barangay}</td>
                      <td className="py-4 px-6 text-slate-600 capitalize">{s.source_type?.replace(/_/g, " ") || "Unknown"}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isSafe 
                            ? "bg-emerald-100 text-emerald-800" 
                            : isWarning 
                            ? "bg-amber-100 text-amber-800" 
                            : isUnknown
                            ? "bg-slate-100 text-slate-700 border border-slate-200"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{s.sample_date || "—"}</span>
                        </div>
                        {s.sample_time && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-mono mt-0.5">
                            <Clock size={11} className="text-slate-400" />
                            <span>{s.sample_time}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">

                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleOpenModal(s)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                            title="Edit Station"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Station"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      </>}
      {/* Add / Edit Water Source Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-slate-100 relative animate-fade-in max-h-[92vh] overflow-y-auto">
            <button
              disabled={saving}
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {editingSource ? "Edit Water Station" : "Register New Water Station"}
            </h2>
            <p className="text-xs text-slate-500 mb-6">Enter GPS coordinates, laboratory testing numbers, and location</p>

            <form onSubmit={handleSave} className="space-y-4">
              <ErrorNotice error={errorMsg} />
              <fieldset disabled={saving} className="contents">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Station Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Purok 2 Communal Spring"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Source Type</label>
                  <select
                    value={formData.source_type}
                    onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="unknown">Unknown / Not recorded</option>
                    <option value="deep_well">Deep Well</option>
                    <option value="spring">Natural Spring</option>
                    <option value="piped_tap">Piped Water (Tap)</option>
                    <option value="shallow_well">Shallow Well</option>
                    <option value="refilling_station">Water Refilling Station</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Barangay</label>
                  <select
                    value={formData.barangay}
                    onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    {barangays.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Latitude (GPS)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Longitude (GPS)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Safety Status</label>
                  <select
                    value={formData.status === "undrinkable" ? "contaminated" : formData.status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        status: newStatus,
                        e_coli_present: (newStatus === "contaminated" || newStatus === "undrinkable")
                          ? "present"
                          : newStatus === "safe"
                          ? "not_present"
                          : newStatus === "unknown"
                          ? "unknown"
                          : prev.e_coli_present
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  >
                    <option value="safe">Safe (Drinkable)</option>
                    <option value="warning">Warning Level</option>
                    <option value="contaminated">Contaminated</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    E. Coli Presence
                  </label>
                  <select
                    value={
                      formData.status === "unknown" || formData.e_coli_present === "unknown" || formData.e_coli_present === null
                        ? "unknown"
                        : (formData.e_coli_present === "present" || formData.e_coli_present === true ? "present" : "not_present")
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        e_coli_present: val,
                        e_coli_count: val === "present" ? 1 : 0,
                        coliform_count: val === "present" ? 1 : 0,
                        status: val === "present" && (prev.status === "safe" || prev.status === "unknown")
                          ? "contaminated"
                          : val === "unknown"
                          ? "unknown"
                          : prev.status
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  >
                    <option value="not_present">Not Present</option>
                    <option value="present">Present</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Sample / Test Date</label>
                  <input
                    type="date"
                    value={formData.sample_date}
                    onChange={(e) => setFormData({ ...formData, sample_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Sample / Test Time</label>
                  <input
                    type="time"
                    step="1"
                    value={formData.sample_time}
                    onChange={(e) => setFormData({ ...formData, sample_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-full border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-full bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs shadow-md"
                >
                  {saving ? "Saving..." : editingSource ? "Save Changes" : "Register Station"}
                </button>
              </div>
              </fieldset>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterSources;
