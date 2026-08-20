import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Droplets, Plus, Search, Edit2, Trash2, MapPin, CheckCircle, AlertCircle, X, ShieldCheck, AlertTriangle } from "lucide-react";

const WaterSources = () => {
  const { token, API_URL } = useAuth();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    source_type: "deep_well",
    barangay: "Combado",
    latitude: 10.1330,
    longitude: 124.8700,
    status: "safe",
    e_coli_count: 0,
    coliform_count: 0,
    description: ""
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchSources = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/water-locations`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSources(data.data);
      }
    } catch (err) {
      console.error("Error fetching water sources:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [API_URL]);

  const handleOpenModal = (sourceToEdit = null) => {
    setErrorMsg("");
    setSuccessMsg("");
    if (sourceToEdit) {
      setEditingSource(sourceToEdit);
      setFormData({
        name: sourceToEdit.name,
        source_type: sourceToEdit.source_type || "deep_well",
        barangay: sourceToEdit.barangay || "Combado",
        latitude: sourceToEdit.latitude || 10.1330,
        longitude: sourceToEdit.longitude || 124.8700,
        status: sourceToEdit.status || "safe",
        e_coli_count: sourceToEdit.e_coli_count ?? 0,
        coliform_count: sourceToEdit.coliform_count ?? 0,
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
        e_coli_count: 0,
        coliform_count: 0,
        description: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const url = editingSource ? `${API_URL}/water-locations/${editingSource.id}` : `${API_URL}/water-locations`;
      const method = editingSource ? "PUT" : "POST";

      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        e_coli_count: parseInt(formData.e_coli_count) || 0,
        coliform_count: parseInt(formData.coliform_count) || 0
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
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this water source from the system?")) return;

    try {
      const res = await fetch(`${API_URL}/water-locations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Water location deleted.");
        fetchSources();
      } else {
        setErrorMsg(data.detail || "Failed to delete location.");
      }
    } catch (err) {
      console.error("Error deleting location:", err);
    }
  };

  const filtered = sources.filter((s) => {
    const matchQuery = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       s.barangay?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchBarangay = selectedBarangay === "all" || s.barangay === selectedBarangay;
    const matchStatus = selectedStatus === "all" || s.status?.toLowerCase() === selectedStatus.toLowerCase();
    return matchQuery && matchBarangay && matchStatus;
  });

  const barangays = [
    "Combado", "Batuan", "Rizal", "Hantag", "Malapoc Sur", "Malapoc Norte",
    "Matin-ao", "San Isidro", "Tagnipa", "Abgao", "Asuncion", "Canturing",
    "Dongon", "Guadalupe", "Ibarra", "Mantahan", "Tunga-tunga"
  ];

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Water Sources Registry</h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage tested water stations, wells, taps, and laboratory metrics</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-md hover:shadow-lg transition-all"
        >
          <Plus size={16} />
          <span>Register New Water Station</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

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
              <option value="undrinkable">Contaminated</option>
            </select>
          </div>
        </div>
      </div>

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
                <th className="py-3.5 px-6">Coliform</th>
                <th className="py-3.5 px-6">E. Coli</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">Loading water sources...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">No water sources found.</td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isSafe = s.status?.toLowerCase() === "safe";
                  const isWarning = s.status?.toLowerCase() === "warning";

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">{s.name}</td>
                      <td className="py-4 px-6 text-slate-700 font-medium">Brgy. {s.barangay}</td>
                      <td className="py-4 px-6 text-slate-600 capitalize">{s.source_type?.replace(/_/g, " ") || "Deep Well"}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isSafe ? "bg-emerald-100 text-emerald-800" : isWarning ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                        }`}>
                          {s.status || "Unknown"}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-700">{s.coliform_count ?? 0} MPN</td>
                      <td className="py-4 px-6 font-mono text-slate-700">{s.e_coli_count ?? 0} CFU</td>
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

      {/* Add / Edit Water Source Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-slate-100 relative animate-fade-in">
            <button
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
                    <option value="deep_well">Deep Well</option>
                    <option value="spring">Natural Spring</option>
                    <option value="piped_water">Piped Water (Tap)</option>
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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="safe">Safe (Drinkable)</option>
                    <option value="warning">Warning Level</option>
                    <option value="undrinkable">Contaminated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Coliform Count</label>
                  <input
                    type="number"
                    value={formData.coliform_count}
                    onChange={(e) => setFormData({ ...formData, coliform_count: e.target.value })}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">E. Coli Count</label>
                  <input
                    type="number"
                    value={formData.e_coli_count}
                    onChange={(e) => setFormData({ ...formData, e_coli_count: e.target.value })}
                    placeholder="0"
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
                  {editingSource ? "Save Changes" : "Register Station"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterSources;
