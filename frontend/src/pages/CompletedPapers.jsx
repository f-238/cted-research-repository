import { Download, Edit3, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState";
import { api, openSignedUrl } from "../lib/api";

const statuses = ["Completed", "Pending", "For Review", "Accepted", "Archived"];

export default function CompletedPapers() {
  const [rows, setRows] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ search: "", program_id: "", school_year: "", submission_year: "", adviser: "" });
  const [modalMode, setModalMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm());

  async function load() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    try {
      setRows(await api.get(`/api/completed-papers?${params.toString()}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    api.get("/api/courses").then(setCourses).catch(() => setCourses([]));
  }, []);

  function openAddModal() {
    setModalMode("add");
    setEditing(null);
    setForm(defaultForm());
  }

  function openEditModal(row) {
    setModalMode("edit");
    setEditing(row);
    setForm({
      title: row.title,
      authors: row.authors,
      adviser: row.adviser,
      program_id: row.program_id,
      school_year: row.school_year,
      submission_year: row.submission_year,
      completion_date: row.completion_date,
      abstract: row.abstract,
      keywords: row.keywords,
      remarks: row.remarks || "",
      status: row.status,
      file: null
    });
  }

  async function saveRecord(event) {
    event.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "file") {
        if (value) data.append("file", value);
      } else {
        data.append(key, value || "");
      }
    });
    try {
      if (modalMode === "edit") await api.patchForm(`/api/completed-papers/${editing.id}`, data);
      else await api.postForm("/api/completed-papers", data);
      closeModal();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteRecord(row) {
    if (!window.confirm("Delete this completed paper?")) return;
    try {
      await api.del(`/api/completed-papers/${row.id}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function closeModal() {
    setModalMode(null);
    setEditing(null);
    setForm(defaultForm());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#071B4D]">Completed Papers</h1>
          <p className="mt-2 text-sm text-slate-500">Manage completed CTED research papers and final paper records.</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}><Plus size={18} /> Add Record</button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      <section className="panel p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <input className="field" placeholder="Search completed papers" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
          <select className="field" value={filters.program_id} onChange={(event) => setFilters({ ...filters, program_id: event.target.value })}>
            <option value="">All Programs</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
          </select>
          <input className="field" placeholder="School Year" value={filters.school_year} onChange={(event) => setFilters({ ...filters, school_year: event.target.value })} />
          <input className="field" placeholder="Submission Year" type="number" value={filters.submission_year} onChange={(event) => setFilters({ ...filters, submission_year: event.target.value })} />
          <input className="field" placeholder="Adviser" value={filters.adviser} onChange={(event) => setFilters({ ...filters, adviser: event.target.value })} />
        </div>
        <div className="mt-3 flex justify-end">
          <button className="btn-primary" onClick={load}>Search</button>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-[#E5E7EB] bg-white px-5 py-4">
          <p className="text-sm font-bold text-[#0B4EA2]">Completed Papers Records</p>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading records...</div>
        ) : rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] text-left text-sm">
              <thead className="bg-[#F5F9FF] text-xs uppercase text-[#315a9e]">
                <tr>
                  <th className="p-4">Title</th>
                  <th className="p-4">Authors</th>
                  <th className="p-4">Adviser</th>
                  <th className="p-4">Program</th>
                  <th className="p-4">School Year</th>
                  <th className="p-4">Submission Year</th>
                  <th className="p-4">Date Completed</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">File</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-[#E5E7EB]">
                    <td className="p-4 font-bold text-[#071B4D]">{row.title}</td>
                    <td className="p-4">{row.authors}</td>
                    <td className="p-4">{row.adviser}</td>
                    <td className="p-4">{row.program?.name}</td>
                    <td className="p-4">{row.school_year}</td>
                    <td className="p-4">{row.submission_year}</td>
                    <td className="p-4">{row.completion_date}</td>
                    <td className="p-4"><Status value={row.status} /></td>
                    <td className="p-4">
                      {row.original_filename ? <button className="btn-secondary px-3" onClick={() => openSignedUrl(`/api/completed-papers/${row.id}/download`)}><Download size={16} /></button> : <span className="text-slate-400">None</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button className="btn-secondary px-3" title="Edit" onClick={() => openEditModal(row)}><Edit3 size={16} /></button>
                        <button className="btn-secondary px-3 text-red-600 hover:bg-red-50" title="Delete" onClick={() => deleteRecord(row)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <EmptyState title="No completed papers yet." body="Records will appear after completed papers are added." />
          </div>
        )}
      </section>

      {modalMode && (
        <RecordModal title={`${modalMode === "edit" ? "Edit" : "Add"} Completed Paper`} onClose={closeModal} onSubmit={saveRecord}>
          <CompletedPaperForm form={form} setForm={setForm} courses={courses} />
        </RecordModal>
      )}
    </div>
  );
}

function CompletedPaperForm({ form, setForm, courses }) {
  return (
    <>
      <Input className="md:col-span-2" label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
      <Input label="Authors" value={form.authors} onChange={(value) => setForm({ ...form, authors: value })} />
      <Input label="Adviser" value={form.adviser} onChange={(value) => setForm({ ...form, adviser: value })} />
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-[#071B4D]">Program</span>
        <select className="field" value={form.program_id || ""} onChange={(event) => setForm({ ...form, program_id: event.target.value })} required>
          <option value="">Select Program</option>
          {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
        </select>
      </label>
      <Input label="School Year" value={form.school_year} onChange={(value) => setForm({ ...form, school_year: value })} />
      <Input label="Submission Year" type="number" value={form.submission_year} onChange={(value) => setForm({ ...form, submission_year: value })} />
      <Input label="Date Completed" type="date" value={form.completion_date} onChange={(value) => setForm({ ...form, completion_date: value })} />
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-[#071B4D]">Status</span>
        <select className="field" value={form.status || ""} onChange={(event) => setForm({ ...form, status: event.target.value })} required>
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
      <Input className="md:col-span-2" label="Keywords" value={form.keywords} onChange={(value) => setForm({ ...form, keywords: value })} />
      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm font-bold text-[#071B4D]">Abstract</span>
        <textarea className="field" rows="5" value={form.abstract || ""} onChange={(event) => setForm({ ...form, abstract: event.target.value })} required />
      </label>
      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm font-bold text-[#071B4D]">Remarks</span>
        <textarea className="field" rows="3" value={form.remarks || ""} onChange={(event) => setForm({ ...form, remarks: event.target.value })} />
      </label>
      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm font-bold text-[#071B4D]">Uploaded File, Optional</span>
        <input className="field" type="file" accept=".pdf,.docx" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })} />
      </label>
    </>
  );
}

function RecordModal({ title, onClose, onSubmit, children }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#071B4D]/50 px-4 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_70px_rgba(7,27,77,0.25)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-extrabold text-[#071B4D]">{title}</h2>
          <button type="button" onClick={onClose} className="btn-secondary px-3"><X size={18} /></button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">{children}</div>
        <div className="mt-6 flex justify-end gap-3 border-t border-[#E5E7EB] pt-5">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button className="btn-primary">Save Record</button>
        </div>
      </form>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-[#071B4D]">{label}</span>
      <input className="field" type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} required />
    </label>
  );
}

function Status({ value }) {
  const done = value === "Completed" || value === "Accepted";
  return <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${done ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{value}</span>;
}

function defaultForm() {
  return {
    title: "",
    authors: "",
    adviser: "",
    program_id: "",
    school_year: "",
    submission_year: "",
    completion_date: "",
    abstract: "",
    keywords: "",
    remarks: "",
    status: "Completed",
    file: null
  };
}
