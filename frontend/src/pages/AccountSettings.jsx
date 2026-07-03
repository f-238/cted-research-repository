import { Camera, Save } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { getDisplayUser } from "../lib/userDisplay";

export default function AccountSettings() {
  const { user, updateUser } = useAuth();
  const display = getDisplayUser(user);
  const [form, setForm] = useState({ name: display.name, email: display.email });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveAccount(event) {
    event.preventDefault();
    const data = new FormData();
    data.append("full_name", form.name);
    data.append("email", form.email);
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const updated = await api.patchForm("/api/users/me", data);
      updateUser(updated);
      setMessage("Account details updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update account details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#071B4D]">Account Settings</h1>
        <p className="mt-2 text-sm text-slate-500">Update your name, email address, and profile picture.</p>
      </div>
      <form className="panel max-w-3xl space-y-5 p-7" onSubmit={saveAccount}>
        <div className="flex items-center gap-5">
          <Avatar src={display.avatarUrl} initial={display.initial} />
          <Link to="/profile" className="btn-secondary">
            <Camera size={18} /> Change Profile Photo
          </Link>
        </div>
        {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</div>}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-[#071B4D]">Name</span>
          <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-[#071B4D]">Email</span>
          <input className="field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <button className="btn-primary" disabled={saving}><Save size={18} /> {saving ? "Saving..." : "Save Changes"}</button>
      </form>
    </div>
  );
}

function Avatar({ src, initial }) {
  if (src) {
    return <img src={src} alt="Profile" className="h-20 w-20 rounded-full object-cover ring-4 ring-blue-50" />;
  }
  return <div className="grid h-20 w-20 place-items-center rounded-full bg-[#0B4EA2] text-3xl font-extrabold text-white ring-4 ring-blue-50">{initial}</div>;
}
