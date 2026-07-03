import { Edit3, X } from "lucide-react";
import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { api, openSignedUrl } from "../lib/api";

const facultyGroups = [
  ["research_submissions", "Research Submissions"],
  ["presentations", "Presentations"],
  ["publications", "Publications"],
  ["utilizations", "Utilizations"]
];

export default function MySubmissions() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [facultyResults, setFacultyResults] = useState(defaultFacultyResults());
  const [courses, setCourses] = useState([]);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState({});
  const [form, setForm] = useState({});
  const [message, setMessage] = useState("");

  async function load() {
    if (user?.role === "faculty") {
      setFacultyResults(await api.get("/api/faculty/my-researches"));
    } else {
      setItems(await api.get("/api/submissions?mine=true"));
    }
  }

  useEffect(() => {
    if (!user) return;
    load();
    api.get("/api/courses").then(setCourses);
  }, [user]);

  function openEdit(item) {
    setEditing(item);
    setForm({
      title: item.title,
      authors: item.authors,
      course_id: item.course.id,
      section: item.section || "",
      adviser: item.adviser,
      school_year: item.school_year,
      submission_year: item.submission_year,
      keywords: item.keywords,
      abstract: item.abstract,
      file: null
    });
  }

  async function save(event) {
    event.preventDefault();
    if (form.file && form.file.size > 20 * 1024 * 1024) {
      setMessage("File exceeds the 20 MB upload limit.");
      return;
    }
    setMessage("Saving changes...");
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "file") {
        if (value) data.append("file", value);
      } else {
        data.append(key, value || "");
      }
    });
    try {
      await api.patchForm(`/api/submissions/${editing.id}`, data);
      setEditing(null);
      setMessage("Submission updated.");
      await load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold">My Researches</h1>
      {message && <div className="mt-4 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">{message}</div>}
      {user?.role === "faculty" ? (
        <FacultyResearchGroups results={facultyResults} />
      ) : (
        <>
      <div className="mt-5 grid gap-4">
        {items.map((item) => (
          <article key={item.id} className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{item.title}</h2>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span>Adviser: {item.adviser}</span>
                  <span>{item.course.name}</span>
                  <span>School Year {item.school_year}</span>
                  <span>Submission Year {item.submission_year}</span>
                  <span>Submitted {new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <StatusBadge status={item.status} />
            </div>
            {viewing[item.id] && (
              <>
                <p className="mt-3 text-sm text-slate-600">{item.abstract}</p>
                {item.format_check && <div className="mt-3 text-sm text-slate-600">{item.format_check.is_compliant ? "Format check passed." : item.format_check.warnings.join(" ")}</div>}
              </>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="btn-secondary" onClick={() => setViewing({ ...viewing, [item.id]: !viewing[item.id] })}>{viewing[item.id] ? "Hide" : "View"}</button>
              <button className="btn-secondary" onClick={() => openSignedUrl(`/api/submissions/${item.id}/download`)}>Download</button>
              {["Pending Review", "Needs Revision"].includes(item.status) && <button className="btn-secondary" onClick={() => openEdit(item)}><Edit3 size={16} /> Edit</button>}
            </div>
          </article>
        ))}
      </div>
      {!items.length && <div className="mt-4"><EmptyState title="No research submissions yet." body="Upload your first research document to start the review process." /></div>}
        </>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#071B4D]/50 px-4 backdrop-blur-sm">
          <form onSubmit={save} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_70px_rgba(7,27,77,0.25)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-extrabold text-[#071B4D]">Edit Pending Submission</h2>
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary px-3"><X size={18} /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input className="field md:col-span-2" placeholder="Research Title" value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <input className="field" placeholder="Author/s" value={form.authors || ""} onChange={(e) => setForm({ ...form, authors: e.target.value })} required />
              <input className="field" placeholder="Adviser" value={form.adviser || ""} onChange={(e) => setForm({ ...form, adviser: e.target.value })} required />
              <select className="field" value={form.course_id || ""} onChange={(e) => setForm({ ...form, course_id: e.target.value })} required>
                <option value="">Program/Course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input className="field" placeholder="Section, if applicable" value={form.section || ""} onChange={(e) => setForm({ ...form, section: e.target.value })} />
              <input className="field" placeholder="School Year" value={form.school_year || ""} onChange={(e) => setForm({ ...form, school_year: e.target.value })} required />
              <input className="field" placeholder="Submission Year" type="number" value={form.submission_year || ""} onChange={(e) => setForm({ ...form, submission_year: e.target.value })} required />
              <input className="field md:col-span-2" placeholder="Keywords" value={form.keywords || ""} onChange={(e) => setForm({ ...form, keywords: e.target.value })} required />
              <textarea className="field md:col-span-2" rows="5" placeholder="Abstract" value={form.abstract || ""} onChange={(e) => setForm({ ...form, abstract: e.target.value })} required />
              <input className="field md:col-span-2" type="file" accept=".docx,.pdf" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} />
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-[#E5E7EB] pt-5">
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
              <button className="btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function FacultyResearchGroups({ results }) {
  const total = facultyGroups.reduce((sum, [key]) => sum + (results[key]?.length || 0), 0);
  if (!total) {
    return <div className="mt-4"><EmptyState title="No matched research records yet." body="Records will appear here when your name is listed as an author, researcher, adviser, or contributor." /></div>;
  }

  return (
    <div className="mt-5 space-y-5">
      {facultyGroups.map(([key, label]) => (
        <section key={key} className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-white px-5 py-4">
            <h2 className="font-extrabold text-[#071B4D]">{label}</h2>
            <span className="rounded-full bg-[#F5F9FF] px-3 py-1 text-xs font-bold text-[#0B4EA2]">{results[key]?.length || 0}</span>
          </div>
          {results[key]?.length ? (
            <div className="divide-y divide-[#E5E7EB]">
              {results[key].map((item) => (
                <article key={`${item.type}-${item.id}`} className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <h3 className="font-bold text-[#071B4D]">{item.title}</h3>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span>{item.type}</span>
                      <span>School Year {item.school_year}</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={item.status} />
                    {item.download_url && <button className="btn-secondary" onClick={() => openSignedUrl(item.download_url)}>View/Download</button>}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-5 text-sm text-slate-500">No matches in this group.</div>
          )}
        </section>
      ))}
    </div>
  );
}

function defaultFacultyResults() {
  return {
    research_submissions: [],
    presentations: [],
    publications: [],
    utilizations: []
  };
}
