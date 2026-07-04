import { useEffect, useState } from "react";
import { UploadCloud } from "lucide-react";
import { api } from "../lib/api";

const typeLabels = {
  research: {
    title: "Research Title",
    authors: "Author/s",
    adviser: "Adviser",
    keywords: "Keywords",
    abstract: "Abstract"
  },
  presentation: {
    title: "Presentation Title",
    authors: "Presenter/s or Author/s",
    adviser: "Organization/Conference",
    keywords: "Presentation Type or Keywords",
    abstract: "Summary"
  },
  publication: {
    title: "Publication Title",
    authors: "Author/s",
    adviser: "Journal/Publisher",
    keywords: "Publication Type or Keywords",
    abstract: "Abstract or Summary"
  },
  utilization: {
    title: "Utilization Title",
    authors: "Researcher/s",
    adviser: "Beneficiary/Partner Agency",
    keywords: "Utilization Type or Keywords",
    abstract: "Summary"
  }
};

export default function UploadResearch() {
  const [courses, setCourses] = useState([]);
  const [submissionSettings, setSubmissionSettings] = useState({ accepted_file_types: { pdf: true, docx: true }, max_upload_size_mb: 25 });
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    submission_type: "research",
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

  useEffect(() => {
    api.get("/api/courses").then(setCourses);
    api.get("/api/settings/public").then((data) => {
      setSubmissionSettings(data.submissions || submissionSettings);
      const defaults = data.academic_defaults || {};
      const currentYear = new Date().getFullYear();
      setForm((current) => ({
        ...current,
        school_year: current.school_year || defaults.current_school_year || "",
        submission_year: current.submission_year || (defaults.auto_submission_year ? String(currentYear) : "")
      }));
    }).catch(() => {});
  }, []);

  async function submit(e) {
    e.preventDefault();
    const maxUploadMb = Number(submissionSettings.max_upload_size_mb || 25);
    const allowedExtensions = Object.entries(submissionSettings.accepted_file_types || { pdf: true, docx: true })
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);
    if (!allowedExtensions.length) allowedExtensions.push("pdf", "docx");
    if (form.file && form.file.size > maxUploadMb * 1024 * 1024) {
      setProgress(`File exceeds the ${maxUploadMb} MB upload limit.`);
      return;
    }
    if (!form.file) {
      setProgress("A PDF or DOCX file is required.");
      return;
    }
    const allowedPattern = new RegExp(`\\.(${allowedExtensions.join("|")})$`, "i");
    if (!allowedPattern.test(form.file.name)) {
      setProgress(`Only ${allowedExtensions.map((value) => value.toUpperCase()).join(" or ")} files are accepted.`);
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
      <h1 className="text-2xl font-bold">Upload Submission</h1>
      <p className="text-sm text-slate-500">PDF or DOCX is required. Files are checked for IMRAD sections, page limit, paper size, font, and line spacing.</p>
      <form onSubmit={submit} className="panel mt-5 grid gap-4 p-5 md:grid-cols-2">
        <select className="field md:col-span-2" value={form.submission_type} onChange={(e) => setForm({ ...form, submission_type: e.target.value })} required>
          <option value="research">Research</option>
          <option value="presentation">Presentation</option>
          <option value="publication">Publication</option>
          <option value="utilization">Utilization</option>
        </select>
        <input className="field md:col-span-2" placeholder={typeLabels[form.submission_type].title} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input className="field" placeholder={typeLabels[form.submission_type].authors} value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} required />
        <input className="field" placeholder={typeLabels[form.submission_type].adviser} value={form.adviser} onChange={(e) => setForm({ ...form, adviser: e.target.value })} required />
        <select className="field" value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} required>
          <option value="">Program/Course</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="field" placeholder="Section, if applicable" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
        <input className="field" placeholder="School Year, e.g. 2025-2026" value={form.school_year} onChange={(e) => setForm({ ...form, school_year: e.target.value })} required />
        <input className="field" placeholder="Submission Year, e.g. 2026" type="number" value={form.submission_year} onChange={(e) => setForm({ ...form, submission_year: e.target.value })} required />
        <input className="field md:col-span-2" placeholder={typeLabels[form.submission_type].keywords} value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} required />
        <textarea className="field md:col-span-2" rows="5" placeholder={typeLabels[form.submission_type].abstract} value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} required />
        <input className="field md:col-span-2" type="file" accept={acceptedFileAccept(submissionSettings)} onChange={(e) => setForm({ ...form, file: e.target.files[0] })} required />
        <p className="md:col-span-2 text-xs font-semibold text-slate-500">Accepted files: {acceptedFileLabel(submissionSettings)}, up to {submissionSettings.max_upload_size_mb || 25} MB.</p>
        <button className="btn-primary md:col-span-2"><UploadCloud size={18} /> Submit for Review</button>
      </form>
      {progress && <div className="mt-4 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">{progress}</div>}
      {result?.format_check && (
        <div className={`mt-4 rounded-xl border p-4 ${formatStatus(result.format_check) === "Passed" ? "border-emerald-200 bg-emerald-50" : formatStatus(result.format_check) === "Failed" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
          <h2 className={`font-semibold ${formatStatus(result.format_check) === "Passed" ? "text-emerald-900" : formatStatus(result.format_check) === "Failed" ? "text-red-900" : "text-amber-900"}`}>
            Format compliance result: {formatStatus(result.format_check)}
          </h2>
          {result.format_check.warnings?.length > 0 && <ul className="mt-2 list-disc pl-5 text-sm text-amber-800">{result.format_check.warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
          {result.format_check.passed_items?.length > 0 && <ul className="mt-2 list-disc pl-5 text-sm text-emerald-800">{result.format_check.passed_items.map((w) => <li key={w}>{w}</li>)}</ul>}
        </div>
      )}
    </>
  );
}

function acceptedFileLabel(settings) {
  return Object.entries(settings.accepted_file_types || { pdf: true, docx: true })
    .filter(([, enabled]) => enabled)
    .map(([key]) => key.toUpperCase())
    .join(" or ") || "PDF or DOCX";
}

function acceptedFileAccept(settings) {
  return Object.entries(settings.accepted_file_types || { pdf: true, docx: true })
    .filter(([, enabled]) => enabled)
    .map(([key]) => `.${key}`)
    .join(",");
}

function formatStatus(formatCheck) {
  if (formatCheck?.is_compliant) return "Passed";
  const warnings = (formatCheck?.warnings || []).join(" ").toLowerCase();
  if (warnings.includes("missing imrad") || warnings.includes("more than 12") || warnings.includes("invalid paper") || warnings.includes("invalid font") || warnings.includes("line spacing is not double")) {
    return "Failed";
  }
  return "Warning";
}
