import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Users, UserPlus, Search, Edit2, Trash2, Shield, CheckCircle, AlertCircle, X } from "lucide-react";

const UserManagement = () => {
  const { token, API_URL } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    email: "",
    role: "sanitization_inspector",
    barangay: "Combado"
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token, API_URL]);

  const handleOpenModal = (userToEdit = null) => {
    setErrorMsg("");
    setSuccessMsg("");
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        username: userToEdit.username,
        password: "",
        full_name: userToEdit.full_name || "",
        email: userToEdit.email || "",
        role: userToEdit.role || "sanitization_inspector",
        barangay: userToEdit.barangay || "Combado"
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: "",
        password: "",
        full_name: "",
        email: "",
        role: "sanitization_inspector",
        barangay: "Combado"
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const url = editingUser ? `${API_URL}/users/${editingUser.id}` : `${API_URL}/users`;
      const method = editingUser ? "PUT" : "POST";

      const bodyData = { ...formData };
      if (bodyData.role !== "resident" && bodyData.role !== "barangay_official") {
        bodyData.barangay = null;
      }
      if (editingUser && !bodyData.password) {
        delete bodyData.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(editingUser ? "User updated successfully!" : "New user created successfully!");
        setIsModalOpen(false);
        fetchUsers();
      } else {
        setErrorMsg(data.detail || "Operation failed.");
      }
    } catch (err) {
      console.error("Error saving user:", err);
      setErrorMsg("Network error saving user.");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to permanently delete this user account?")) return;

    try {
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("User account deleted.");
        fetchUsers();
      } else {
        setErrorMsg(data.detail || "Failed to delete user.");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchQuery =
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.barangay?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = selectedRole === "all" || u.role === selectedRole;
    return matchQuery && matchRole;
  });

  const barangays = [
    "Combado", "Batuan", "Rizal", "Hantag", "Malapoc Sur", "Malapoc Norte",
    "Matin-ao", "San Isidro", "Tagnipa", "Abgao", "Asuncion", "Canturing",
    "Dongon", "Guadalupe", "Ibarra", "Mantahan", "Tunga-tunga"
  ];

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage credentials, permissions, and roles for staff and residents</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-md hover:shadow-lg transition-all"
        >
          <UserPlus size={16} />
          <span>Create New Staff / Admin</span>
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
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, username, or barangay..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Filter Role:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="city_health_officer">City Health Officer</option>
            <option value="sanitization_inspector">Sanitization Inspector</option>
            <option value="barangay_official">Barangay Official</option>
            <option value="resident">Resident</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">User / Name</th>
                <th className="py-3.5 px-6">Username</th>
                <th className="py-3.5 px-6">Assigned Role</th>
                <th className="py-3.5 px-6">Barangay</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-400">Loading user database...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-400">No users found matching query.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isRoleAdmin = u.role === "admin";
                  const isRoleCHO = u.role === "city_health_officer";
                  const isRoleInspector = u.role === "sanitization_inspector";
                  const isRoleBarangay = u.role === "barangay_official";

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                            {u.full_name?.charAt(0) || u.username?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.full_name || "N/A"}</p>
                            <p className="text-[11px] text-slate-400">{u.email || "No email on file"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-700">{u.username}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isRoleAdmin
                            ? "bg-purple-100 text-purple-800"
                            : isRoleCHO
                            ? "bg-blue-100 text-blue-800"
                            : isRoleInspector
                            ? "bg-cyan-100 text-cyan-800"
                            : isRoleBarangay
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {u.role?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-700 font-medium">
                        {u.barangay ? `Brgy. ${u.barangay}` : "City Wide"}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleOpenModal(u)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                            title="Edit User"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-1.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete User"
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

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-100 relative animate-fade-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {editingUser ? "Edit User Account" : "Create New User"}
            </h2>
            <p className="text-xs text-slate-500 mb-6">Assign system privileges and location coverage</p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Dr. Maria Santos"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="msantos"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    {editingUser ? "New Password (Optional)" : "Password"}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    required={!editingUser}
                  />
                </div>
              </div>

              {/* Role Selection & Conditional Barangay */}
              <div className={`grid ${formData.role === "resident" || formData.role === "barangay_official" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-4`}>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">System Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      const needsBrgy = newRole === "resident" || newRole === "barangay_official";
                      setFormData({ 
                        ...formData, 
                        role: newRole,
                        barangay: needsBrgy ? (formData.barangay || "Combado") : ""
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="admin">Administrator</option>
                    <option value="city_health_officer">City Health Officer</option>
                    <option value="sanitization_inspector">Sanitization Inspector</option>
                    <option value="barangay_official">Barangay Official</option>
                    <option value="resident">Resident</option>
                  </select>
                </div>

                {(formData.role === "resident" || formData.role === "barangay_official") && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Assigned Barangay <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.barangay}
                      onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                      required
                    >
                      {barangays.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@maasincity.gov.ph"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
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
                  {editingUser ? "Save Changes" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
