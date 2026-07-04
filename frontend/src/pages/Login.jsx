import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, LogIn, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import { dashboardPathForUser } from "../lib/authRoutes";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (submitting) return;

    setError("");
    setSubmitting(true);
    try {
      const user = await login(form.email, form.password, form.remember);
      navigate(dashboardPathForUser(user), { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <section className="w-full max-w-[500px] rounded-[24px] border border-[#E5E7EB] bg-white p-8 shadow-[0_24px_70px_rgba(7,27,77,0.12)]">
        <div className="mb-7">
          <div className="mb-5 h-1.5 w-20 rounded-full bg-[#D4A017]" />
          <h1 className="text-3xl font-extrabold text-[#071B4D]">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to continue to your dashboard</p>
        </div>

        {error && <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#071B4D]">Email</span>
            <div className="relative">
              <Mail className="auth-input-icon" size={19} />
              <input className="field auth-input" placeholder="Enter your email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#071B4D]">Password</span>
            <div className="relative">
              <LockKeyhole className="auth-input-icon" size={19} />
              <input className="field auth-input" placeholder="Enter your password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
          </label>

          <div className="flex items-center justify-between gap-3 text-sm">
            <label className="flex items-center gap-2 font-medium text-slate-600">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-[#0B3D91]" checked={form.remember} onChange={(e) => setForm({ ...form, remember: e.target.checked })} />
              Remember me
            </label>
            <a href="#" className="font-bold text-[#0B3D91] hover:text-[#062B63]">Forgot password?</a>
          </div>

          <button className="btn-primary h-12 w-full text-base" type="submit" disabled={submitting}>
            <LogIn size={19} />
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          No account yet? <Link className="font-extrabold text-[#0B3D91] hover:text-[#062B63]" to="/register">Register</Link>
        </p>
      </section>
    </AuthLayout>
  );
}
