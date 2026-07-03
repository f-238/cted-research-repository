import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = () => api.get("/api/users").then(setUsers);
  useEffect(() => { load(); }, []);
  async function update(id, values) {
    setMessage("");
    setError("");
    const fd = new FormData();
    Object.entries(values).forEach(([key, value]) => fd.append(key, value));
    try {
      await api.patchForm(`/api/users/${id}`, fd);
      load();
    } catch (err) {
      setError(err.message || "Unable to update user.");
    }
  }
  async function remove() {
    if (!deleting) return;
    setMessage("");
    setError("");
    setDeleteBusy(true);
    try {
      await api.del(`/api/users/${deleting.id}`);
      setUsers((current) => current.filter((user) => user.id !== deleting.id));
      setDeleting(null);
      setMessage("User deleted successfully.");
    } catch (err) {
      setDeleting(null);
      setError(err.message || "Unable to delete user.");
    } finally {
      setDeleteBusy(false);
    }
  }
  return (
    <>
      <h1 className="text-2xl font-bold">User Management</h1>
      {message && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</div>}
      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
      <div className="panel mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Active</th><th className="p-3">Actions</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3 font-medium">{u.full_name}</td><td className="p-3">{u.email}</td><td className="p-3 capitalize">{u.role}</td><td className="p-3">{u.account_status}</td><td className="p-3">{u.is_active ? "Yes" : "No"}</td>
                <td className="space-x-2 p-3">
                  <button className="btn-secondary" onClick={() => update(u.id, { account_status: "approved" })}>Approve</button>
                  <button className="btn-secondary" onClick={() => update(u.id, { account_status: "rejected" })}>Reject</button>
                  <button className="btn-secondary" onClick={() => update(u.id, { is_active: String(!u.is_active) })}>{u.is_active ? "Deactivate" : "Activate"}</button>
                  <button className="btn-secondary" onClick={() => { setMessage(""); setError(""); setDeleting(u); }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {deleting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#071B4D]/50 px-4 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-6">
            <h2 className="text-xl font-extrabold text-[#071B4D]">Delete User</h2>
            <p className="mt-3 text-sm text-slate-600">Are you sure you want to permanently delete this user? This action cannot be undone.</p>
            <p className="mt-3 text-sm font-bold text-[#071B4D]">{deleting.full_name}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setDeleting(null)} disabled={deleteBusy}>Cancel</button>
              <button className="btn-secondary border-red-200 text-red-700 hover:bg-red-50" onClick={remove} disabled={deleteBusy}>{deleteBusy ? "Deleting..." : "Delete Permanently"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
