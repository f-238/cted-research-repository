import { Camera, Save } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getDisplayUser } from "../lib/userDisplay";

export default function AccountSettings() {
  const { user } = useAuth();
  const display = getDisplayUser(user);
  const [form, setForm] = useState({ name: display.name, email: display.email, picture: "" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#071B4D]">Account Settings</h1>
        <p className="mt-2 text-sm text-slate-500">Update your name, email address, and profile picture.</p>
      </div>
      <form className="panel max-w-3xl space-y-5 p-7">
        <div className="flex items-center gap-5">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-[#0B4EA2] text-3xl font-extrabold text-white ring-4 ring-blue-50">{display.initial}</div>
          <label className="btn-secondary cursor-pointer">
            <Camera size={18} /> Profile Picture
            <input type="file" className="hidden" accept="image/*" onChange={(e) => setForm({ ...form, picture: e.target.files?.[0]?.name || "" })} />
          </label>
          {form.picture && <span className="text-sm text-slate-500">{form.picture}</span>}
        </div>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-[#071B4D]">Name</span>
          <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-[#071B4D]">Email</span>
          <input className="field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <button type="button" className="btn-primary"><Save size={18} /> Save Changes</button>
      </form>
    </div>
  );
}
