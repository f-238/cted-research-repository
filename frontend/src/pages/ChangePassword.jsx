import { KeyRound, Save } from "lucide-react";
import { useState } from "react";

export default function ChangePassword() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#071B4D]">Change Password</h1>
        <p className="mt-2 text-sm text-slate-500">Use a strong password to protect your CTED repository account.</p>
      </div>
      <form className="panel max-w-2xl space-y-5 p-7">
        <Field label="Current Password" value={form.current} onChange={(value) => setForm({ ...form, current: value })} />
        <Field label="New Password" value={form.next} onChange={(value) => setForm({ ...form, next: value })} />
        <Field label="Confirm Password" value={form.confirm} onChange={(value) => setForm({ ...form, confirm: value })} />
        <button type="button" className="btn-primary"><Save size={18} /> Save Changes</button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#071B4D]">{label}</span>
      <div className="relative">
        <KeyRound className="auth-input-icon" size={19} />
        <input className="field auth-input" type="password" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </label>
  );
}
