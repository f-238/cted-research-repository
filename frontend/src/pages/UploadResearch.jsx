import { useEffect, useState } from "react";
import { UploadCloud } from "lucide-react";
import { api } from "../lib/api";

export default function UploadResearch() {
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    title: "",
    authors: "",
    course_id: "",
    section: "",
    adviser: "",
    school_year: "",
    submission_year: "",
    keywords: "",
    abstract: "",
    file: null
  });

  useEffect(() => { api.get("/api/courses").then(setCourses); }, []);

  async function submit(e) {
    e.preventDefault();
    if (form.file && form.file.size > 20 * 1024 * 1024) {
      setProgress("File exceeds the 20 MB upload limit.");
      return;
    }
    setProgress("Uploading and checking format...");
    const fd = new FormData();
    Object.entries(form).forEach(([key, value]) => value && fd.append(key, value));
    try {
      const data = await api.postForm("/api/submissions", fd);
      setResult(data);
      setProgress("Submitted for admin review.");
    } catch (err) {
      setProgress(err.message);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Upload Research</h1>
      <p className="text-sm text-slate-500">DOCX is recommended for accurate automatic format checking. PDF checking is limited.</p>
      <form onSubmit={submit} className="panel mt-5 grid gap-4 p-5 md:grid-cols-2">
        <input className="field md:col-span-2" placeholder="Research Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input className="field" placeholder="Author/s" value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} required />
        <input className="field" placeholder="Adviser" value={form.adviser} onChange={(e) => setForm({ ...form, adviser: e.target.value })} required />
        <select className="field" value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} required>
          <option value="">Program/Course</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="field" placeholder="Section, if applicable" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
        <input className="field" placeholder="School Year, e.g. 2025-2026" value={form.school_year} onChange={(e) => setForm({ ...form, school_year: e.target.value })} required />
        <input className="field" placeholder="Submission Year, e.g. 2026" type="number" value={form.submission_year} onChange={(e) => setForm({ ...form, submission_year: e.target.value })} required />
        <input className="field md:col-span-2" placeholder="Keywords" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} required />
        <textarea className="field md:col-span-2" rows="5" placeholder="Abstract" value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} required />
        <input className="field md:col-span-2" type="file" accept=".docx,.pdf" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} required />
        <p className="md:col-span-2 text-xs font-semibold text-slate-500">Accepted files: PDF or DOCX, up to 20 MB.</p>
        <button className="btn-primary md:col-span-2"><UploadCloud size={18} /> Submit Research</button>
      </form>
      {progress && <div className="mt-4 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">{progress}</div>}
      {result?.format_check && !result.format_check.is_compliant && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-900">Format warning detected</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-amber-800">{result.format_check.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}
    </>
  );
}
