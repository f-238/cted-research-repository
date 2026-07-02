import { Download, Edit3, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import { api, openSignedUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const labels = {
  presentation: "Presentation",
  publication: "Publication",
  utilization: "Utilization"
};

const emptyTitles = {
  presentation: "No presentation records yet.",
  publication: "No publication records yet.",
  utilization: "No utilization records yet."
};

const typeOptions = {
  presentation: ["Local", "National", "International", "Institutional"],
  publication: ["Journal Article", "Book Chapter", "Conference Proceedings", "Institutional Publication", "Other"],
  utilization: ["Instructional Materials", "Community Extension", "Policy Adoption", "Training Program", "Other"]
};

const statuses = ["Pending", "Completed", "For Review", "Accepted", "Archived"];

export default function AccomplishmentReportTable({ type = "presentation" }) {
  const { user, isAdmin } = useAuth();
  const title = labels[type] || "Accomplishment";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm(type));

  const canWrite = user?.account_status === "approved";

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRows(await api.get(`/api/accomplishments?report_type=${type}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [type]);

  function openAddModal() {
    setModalMode("add");
    setEditing(null);
    setForm(defaultForm(type));
  }

  function openEditModal(row) {
    setModalMode("edit");
    setEditing(row);
    setForm({
      title: row.title,
      researcher: row.researcher,
      category: row.category,
      organization: row.organization,
      venue: row.venue || "",
      link: row.link || "",
      event_date: row.event_date,
      school_year: row.school_year,
      status: row.status,
      file: null
    });
  }

  async function saveRecord(event) {
    event.preventDefault();
    const data = new FormData();
    data.append("report_type", type);
    Object.entries(form).forEach(([key, value]) => {
      if (key === "file") {
        if (value) data.append("file", value);
      } else {
        data.append(key, value || "");
      }
    });
    try {
      if (modalMode === "edit") await api.patchForm(`/api/accomplishments/${editing.id}`, data);
      else await api.postForm("/api/accomplishments", data);
      closeModal();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteRecord(row) {
    if (!window.confirm("Delete this record?")) return;
    try {
      await api.del(`/api/accomplishments/${row.id}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function closeModal() {
    setModalMode(null);
    setEditing(null);
    setForm(defaultForm(type));
  }

  const columns = useMemo(() => getColumns(type), [type]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#071B4D]">{title} Reports</h1>
          <p className="mt-2 text-sm text-slate-500">Manage real {title.toLowerCase()} accomplishment records for CTED research outputs.</p>
        </div>
        {canWrite && <button className="btn-primary" onClick={openAddModal}><Plus size={18} /> Add Record</button>}
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      <section className="panel overflow-hidden">
        <div className="border-b border-[#E5E7EB] bg-white px-5 py-4">
          <p className="text-sm font-bold text-[#0B4EA2]">{title} Accomplishment Records</p>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading records...</div>
        ) : rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-[#F5F9FF] text-xs uppercase text-[#315a9e]">
                <tr>
                  {columns.map((column) => <th key={column.key} className="p-4">{column.label}</th>)}
                  <th className="p-4">Status</th>
                  <th className="p-4">File</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-[#E5E7EB]">
                    {columns.map((column) => <td key={column.key} className="p-4">{column.render(row)}</td>)}
                    <td className="p-4"><Status value={row.status} /></td>
                    <td className="p-4">
                      {row.original_filename ? <button className="btn-secondary px-3" onClick={() => openSignedUrl(`/api/accomplishments/${row.id}/download`)}><Download size={16} /></button> : <span className="text-slate-400">None</span>}
                    </td>
                    <td className="p-4"><Actions row={row} user={user} isAdmin={isAdmin} onEdit={openEditModal} onDelete={deleteRecord} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <EmptyState title={emptyTitles[type]} body="Records will appear only after approved users create actual records." />
          </div>
        )}
      </section>

      {modalMode && (
        <RecordModal title={`${modalMode === "edit" ? "Edit" : "Add"} ${title} Record`} onClose={closeModal} onSubmit={saveRecord}>
          <ReportForm type={type} form={form} setForm={setForm} />
        </RecordModal>
      )}
    </div>
  );
}

function getColumns(type) {
  const dateLabel = type === "presentation" ? "Date Presented" : type === "publication" ? "Date Published" : "Date Utilized";
  const categoryLabel = type === "presentation" ? "Presentation Type" : type === "publication" ? "Publication Type" : "Utilization Type";
  const orgLabel = type === "presentation" ? "Organization/Conference" : type === "publication" ? "Journal/Publisher" : "Beneficiary/Partner Agency";
  return [
    { key: "title", label: "Title", render: (row) => <span className="font-bold text-[#071B4D]">{row.title}</span> },
    { key: "researcher", label: "Researcher/Author", render: (row) => row.researcher },
    { key: "category", label: categoryLabel, render: (row) => row.category },
    { key: "organization", label: orgLabel, render: (row) => row.organization },
    { key: "event_date", label: dateLabel, render: (row) => row.event_date },
    { key: "school_year", label: "School Year", render: (row) => row.school_year }
  ];
}

function ReportForm({ type, form, setForm }) {
  const dateLabel = type === "presentation" ? "Date Presented" : type === "publication" ? "Date Published" : "Date Utilized";
  const categoryLabel = type === "presentation" ? "Presentation Type" : type === "publication" ? "Publication Type" : "Utilization Type";
  const orgLabel = type === "presentation" ? "Organization/Conference" : type === "publication" ? "Journal/Publisher" : "Beneficiary/Partner Agency";

  return (
    <>
      <Input className="md:col-span-2" label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
      <Input label="Researcher/Author" value={form.researcher} onChange={(value) => setForm({ ...form, researcher: value })} />
      <Select label={categoryLabel} value={form.category} options={typeOptions[type]} onChange={(value) => setForm({ ...form, category: value })} />
      <Input label={orgLabel} value={form.organization} onChange={(value) => setForm({ ...form, organization: value })} />
      {type === "presentation" && <Input label="Venue" value={form.venue} onChange={(value) => setForm({ ...form, venue: value })} />}
      {type === "publication" && <Input label="DOI or Publication Link, Optional" value={form.link} required={false} onChange={(value) => setForm({ ...form, link: value })} />}
      <Input label={dateLabel} type="date" value={form.event_date} onChange={(value) => setForm({ ...form, event_date: value })} />
      <Input label="School Year" value={form.school_year} onChange={(value) => setForm({ ...form, school_year: value })} />
      <Select label="Status" value={form.status} options={statuses} onChange={(value) => setForm({ ...form, status: value })} />
      <FileInput label="Supporting File, Optional" onChange={(value) => setForm({ ...form, file: value })} />
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

function Input({ label, value, onChange, type = "text", required = true, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-[#071B4D]">{label}</span>
      <input className="field" type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#071B4D]">{label}</span>
      <select className="field" value={value || ""} onChange={(event) => onChange(event.target.value)} required>
        <option value="">Select {label}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function FileInput({ label, onChange }) {
  return (
    <label className="block md:col-span-2">
      <span className="mb-2 block text-sm font-bold text-[#071B4D]">{label}</span>
      <input className="field" type="file" onChange={(event) => onChange(event.target.files?.[0] || null)} />
    </label>
  );
}

function Actions({ row, user, isAdmin, onEdit, onDelete }) {
  const canChange = isAdmin || (row.owner?.id === user?.id && row.status === "Pending");
  if (!canChange) return <span className="text-xs font-semibold text-slate-400">Locked</span>;
  return (
    <div className="flex gap-2">
      <button className="btn-secondary px-3" title="Edit" onClick={() => onEdit(row)}><Edit3 size={16} /></button>
      <button className="btn-secondary px-3 text-red-600 hover:bg-red-50" title="Delete" onClick={() => onDelete(row)}><Trash2 size={16} /></button>
    </div>
  );
}

function Status({ value }) {
  const done = value === "Completed" || value === "Accepted";
  return <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${done ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{value}</span>;
}

function defaultForm() {
  return {
    title: "",
    researcher: "",
    category: "",
    organization: "",
    venue: "",
    link: "",
    event_date: "",
    school_year: "",
    status: "Pending",
    file: null
  };
}
