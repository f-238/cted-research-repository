import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { api } from "../lib/api";
import AuthLayout from "../components/AuthLayout";

export default function Register() {
  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm_password: "", role: "student", course_id: "" });

  useEffect(() => { api.get("/api/courses").then(setCourses); }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    try {
      const { confirm_password, ...payload } = form;
      await api.postJson("/api/auth/register", { ...payload, course_id: Number(form.course_id) || null });
      setMessage("Registration submitted. Please wait for admin approval before logging in.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthLayout>
      <section className="w-full max-w-[620px] rounded-[24px] border border-[#E5E7EB] bg-white p-8 shadow-[0_24px_70px_rgba(7,27,77,0.12)]">
        <div className="mb-7">
          <div className="mb-5 h-1.5 w-20 rounded-full bg-[#D4A017]" />
          <h1 className="text-3xl font-extrabold text-[#071B4D]">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500">Register as student or faculty and wait for admin approval</p>
        </div>

        {message && <div className="mb-5 flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700"><CheckCircle2 size={19} /> {message}</div>}
        {error && <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Field icon={UserRound} label="Full name">
            <input className="field auth-input" placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          </Field>
          <Field icon={Mail} label="Email">
            <input className="field auth-input" placeholder="Email address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Field>
          <Field icon={LockKeyhole} label="Password">
            <input className="field auth-input" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </Field>
          <Field icon={LockKeyhole} label="Confirm password">
            <input className="field auth-input" placeholder="Confirm password" type="password" value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} required />
          </Field>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#071B4D]">Role</span>
            <select className="field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#071B4D]">Program</span>
            <select className="field" value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} required>
              <option value="">Select program</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{shortProgram(c.name)}</option>)}
            </select>
          </label>
          <button className="btn-primary mt-2 h-12 text-base md:col-span-2">Register</button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          Already have an account? <Link className="font-extrabold text-[#0B3D91] hover:text-[#062B63]" to="/login">Back to Login</Link>
        </p>
      </section>
    </AuthLayout>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#071B4D]">{label}</span>
      <div className="relative">
        <Icon className="auth-input-icon" size={19} />
        {children}
      </div>
    </label>
  );
}

function shortProgram(name) {
  if (name.includes("Major in English")) return "BSED English";
  if (name.includes("Major in Mathematics")) return "BSED Mathematics";
  if (name.includes("Major in Science")) return "BSED Science";
  if (name.includes("Major in Filipino")) return "BSED Filipino";
  if (name.includes("Major in Culture and Arts")) return "BSED Culture and Arts";
  if (name.includes("Major in Physical Education")) return "BSED Physical Education";
  if (name.includes("Major in Values Education")) return "BSED Values Education";
  if (name.includes("Elementary Education")) return "BEED";
  if (name.includes("Early Childhood Education")) return "BECED";
  return name;
}
