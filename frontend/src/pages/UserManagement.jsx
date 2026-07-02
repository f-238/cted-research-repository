import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const load = () => api.get("/api/users").then(setUsers);
  useEffect(() => { load(); }, []);
  async function update(id, values) {
    const fd = new FormData();
    Object.entries(values).forEach(([key, value]) => fd.append(key, value));
    await api.patchForm(`/api/users/${id}`, fd);
    load();
  }
  async function remove(id) {
    if (confirm("Delete this account?")) {
      await api.del(`/api/users/${id}`);
      load();
    }
  }
  return (
    <>
      <h1 className="text-2xl font-bold">User Management</h1>
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
                  <button className="btn-secondary" onClick={() => remove(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
