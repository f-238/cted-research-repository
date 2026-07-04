import { Download, Plus, RotateCcw, Save, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { api, downloadFile } from "../lib/api";

const defaultSettings = {
  repository: { visibility: "JRMSU Internal Only", auto_publish_approved: true, allow_public_downloads: false, require_login_download: true },
  submissions: { accepted_file_types: { pdf: true, docx: true }, max_upload_size_mb: 25, max_files_per_submission: 1 },
  format_policy: { paper_size: "A4", accepted_fonts: { times_new_roman: true, arial: true }, font_sizes: { times_new_roman: 12, arial: 11 }, line_spacing: "Double", minimum_pages: 5, maximum_pages: 12 },
  academic_defaults: { current_school_year: "2026-2027", auto_submission_year: true },
  review_workflow: { default_submission_status: "Pending Review", notify_submitter: { approval: true, needs_revision: true, rejection: true }, notify_adviser: true },
  notifications: {
    coordinator: { new_student_registration: true, new_faculty_registration: true, new_research_submission: true, new_presentation_submission: true, new_publication_submission: true, new_utilization_submission: true, new_completed_paper_submission: true },
    faculty: { presentation_approved: true, publication_approved: true, utilization_approved: true, completed_paper_approved: true, needs_revision: true, rejected: true },
    students: { research_approved: true, needs_revision: true, rejected: true }
  },
  branding: { jrmsu_logo: "", cted_logo: "", repository_name: "JRMSU Main Campus\nCollege of Teacher Education\nResearch Repository", footer_text: "", contact_email: "", research_office_contact_number: "" },
  backup: { automatic_weekly_backup: false, last_backup_date: "", backup_status: "Not scheduled" }
};

export default function Settings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [systemInfo, setSystemInfo] = useState({});
  const [programs, setPrograms] = useState([]);
  const [programForm, setProgramForm] = useState(defaultProgram());
  const [editingProgramId, setEditingProgramId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [settingsData, programData] = await Promise.all([
        api.get("/api/settings"),
        api.get("/api/programs?include_archived=true")
      ]);
      setSettings(settingsData.settings || defaultSettings);
      setSystemInfo(settingsData.system_info || {});
      setPrograms(programData);
    } catch (err) {
      setError(err.message || "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function update(path, value) {
    setSettings((current) => setNested(current, path, value));
  }

  async function saveSettings() {
    setMessage("");
    setError("");
    try {
      const data = await api.putJson("/api/settings", { settings });
      setSettings(data.settings || settings);
      setMessage("Settings saved successfully.");
    } catch (err) {
      setError(err.message || "Unable to save settings.");
    }
  }

  async function resetSettings() {
    if (!window.confirm("Reset administrative settings to default?")) return;
    setMessage("");
    setError("");
    try {
      const data = await api.postJson("/api/settings/reset", {});
      setSettings(data.settings || defaultSettings);
      setMessage("Settings reset to default.");
    } catch (err) {
      setError(err.message || "Unable to reset settings.");
    }
  }

  async function saveProgram(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      if (editingProgramId) await api.patchJson(`/api/programs/${editingProgramId}`, normalizeProgram(programForm));
      else await api.postJson("/api/programs", normalizeProgram(programForm));
      setProgramForm(defaultProgram());
      setEditingProgramId(null);
      setMessage("Program saved successfully.");
      await load();
    } catch (err) {
      setError(err.message || "Unable to save program.");
    }
  }

  async function archiveProgram(program) {
    await programAction(`/api/programs/${program.id}/archive`, "Program archived.");
  }

  async function restoreProgram(program) {
    await programAction(`/api/programs/${program.id}/restore`, "Program restored.");
  }

  async function deleteProgram(program) {
    if (!window.confirm(`Delete ${program.name}?`)) return;
    try {
      await api.del(`/api/programs/${program.id}`);
      setMessage("Program deleted.");
      await load();
    } catch (err) {
      setError(err.message || "Unable to delete program.");
    }
  }

  async function programAction(path, success) {
    setMessage("");
    setError("");
    try {
      await api.patchForm(path, new FormData());
      setMessage(success);
      await load();
    } catch (err) {
      setError(err.message || "Unable to update program.");
    }
  }

  async function moveProgram(program, direction) {
    const ordered = [...programs].sort((a, b) => a.display_order - b.display_order);
    const index = ordered.findIndex((item) => item.id === program.id);
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    const payload = ordered.map((item, orderIndex) => ({ id: item.id, display_order: orderIndex + 1 }));
    setPrograms(ordered.map((item, orderIndex) => ({ ...item, display_order: orderIndex + 1 })));
    await api.patchJson("/api/programs/reorder", { programs: payload });
    await load();
  }

  async function importPrograms(file) {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      const data = await api.postForm("/api/programs/import", form);
      setMessage(`${data.imported || 0} programs imported.`);
      await load();
    } catch (err) {
      setError(err.message || "Unable to import programs.");
    }
  }

  if (loading) return <div className="panel p-6 text-sm text-slate-500">Loading administrative settings...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#071B4D]">Administrative Settings</h1>
        <p className="mt-2 text-sm text-slate-500">JRMSU Main Campus - College of Teacher Education Research Repository configuration panel.</p>
      </div>

      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}

      <SettingsCard title="Repository Settings">
        <Select label="Repository Visibility" value={settings.repository.visibility} options={["Public", "JRMSU Internal Only", "Administrator Only"]} onChange={(value) => update("repository.visibility", value)} />
        <Toggle label="Automatically publish approved research" checked={settings.repository.auto_publish_approved} onChange={(value) => update("repository.auto_publish_approved", value)} />
        <Toggle label="Allow public downloads" checked={settings.repository.allow_public_downloads} onChange={(value) => update("repository.allow_public_downloads", value)} />
        <Toggle label="Require login before downloading" checked={settings.repository.require_login_download} onChange={(value) => update("repository.require_login_download", value)} />
      </SettingsCard>

      <SettingsCard title="Submission Settings">
        <Checkbox label="PDF" checked={settings.submissions.accepted_file_types.pdf} onChange={(value) => update("submissions.accepted_file_types.pdf", value)} />
        <Checkbox label="DOCX" checked={settings.submissions.accepted_file_types.docx} onChange={(value) => update("submissions.accepted_file_types.docx", value)} />
        <Input label="Maximum Upload Size (MB)" type="number" value={settings.submissions.max_upload_size_mb} onChange={(value) => update("submissions.max_upload_size_mb", Number(value))} />
        <Input label="Maximum Files Per Submission" type="number" value={settings.submissions.max_files_per_submission} onChange={(value) => update("submissions.max_files_per_submission", Number(value))} />
      </SettingsCard>

      <SettingsCard title="Research Format Policy">
        <Select label="Paper Size" value={settings.format_policy.paper_size} options={["A4", "Short Bond"]} onChange={(value) => update("format_policy.paper_size", value)} />
        <Checkbox label="Times New Roman" checked={settings.format_policy.accepted_fonts.times_new_roman} onChange={(value) => update("format_policy.accepted_fonts.times_new_roman", value)} />
        <Checkbox label="Arial" checked={settings.format_policy.accepted_fonts.arial} onChange={(value) => update("format_policy.accepted_fonts.arial", value)} />
        <Input label="Times New Roman Font Size" type="number" value={settings.format_policy.font_sizes.times_new_roman} onChange={(value) => update("format_policy.font_sizes.times_new_roman", Number(value))} />
        <Input label="Arial Font Size" type="number" value={settings.format_policy.font_sizes.arial} onChange={(value) => update("format_policy.font_sizes.arial", Number(value))} />
        <Select label="Line Spacing" value={settings.format_policy.line_spacing} options={["Single", "1.5", "Double"]} onChange={(value) => update("format_policy.line_spacing", value)} />
        <Input label="Minimum Pages" type="number" value={settings.format_policy.minimum_pages} onChange={(value) => update("format_policy.minimum_pages", Number(value))} />
        <Input label="Maximum Pages" type="number" value={settings.format_policy.maximum_pages} onChange={(value) => update("format_policy.maximum_pages", Number(value))} />
      </SettingsCard>

      <SettingsCard title="Academic Defaults">
        <Input label="Current School Year" value={settings.academic_defaults.current_school_year} onChange={(value) => update("academic_defaults.current_school_year", value)} />
        <Toggle label="Default Submission Year Automatically Uses Current Year" checked={settings.academic_defaults.auto_submission_year} onChange={(value) => update("academic_defaults.auto_submission_year", value)} />
      </SettingsCard>

      <SettingsCard title="Review Workflow">
        <Select label="Default Submission Status" value={settings.review_workflow.default_submission_status} options={["Pending Review", "Needs Revision", "Approved"]} onChange={(value) => update("review_workflow.default_submission_status", value)} />
        <Checkbox label="Notify submitter after Approval" checked={settings.review_workflow.notify_submitter.approval} onChange={(value) => update("review_workflow.notify_submitter.approval", value)} />
        <Checkbox label="Notify submitter after Needs Revision" checked={settings.review_workflow.notify_submitter.needs_revision} onChange={(value) => update("review_workflow.notify_submitter.needs_revision", value)} />
        <Checkbox label="Notify submitter after Rejection" checked={settings.review_workflow.notify_submitter.rejection} onChange={(value) => update("review_workflow.notify_submitter.rejection", value)} />
        <Toggle label="Automatically notify adviser" checked={settings.review_workflow.notify_adviser} onChange={(value) => update("review_workflow.notify_adviser", value)} />
      </SettingsCard>

      <NotificationSettings settings={settings} update={update} />
      <BrandingSettings settings={settings} update={update} />
      <ProgramManagement programs={programs} form={programForm} setForm={setProgramForm} editingId={editingProgramId} setEditingId={setEditingProgramId} onSubmit={saveProgram} onArchive={archiveProgram} onRestore={restoreProgram} onDelete={deleteProgram} onMove={moveProgram} onImport={importPrograms} />
      <SystemInformation info={systemInfo} settings={settings} update={update} />
      <BackupMaintenance settings={settings} update={update} onImport={importPrograms} />

      <div className="sticky bottom-0 z-20 flex flex-wrap justify-end gap-3 border-t border-[#E5E7EB] bg-[#F5F9FF]/95 py-4 backdrop-blur">
        <button className="btn-secondary" onClick={load}>Cancel</button>
        <button className="btn-secondary" onClick={resetSettings}><RotateCcw size={17} /> Reset to Default</button>
        <button className="btn-primary" onClick={saveSettings}><Save size={17} /> Save Settings</button>
      </div>
    </div>
  );
}

function NotificationSettings({ settings, update }) {
  return (
    <SettingsCard title="Notification Settings">
      <Group title="Notify Research Coordinator when">
        {Object.entries(settings.notifications.coordinator).map(([key, value]) => <Checkbox key={key} label={labelize(key)} checked={value} onChange={(next) => update(`notifications.coordinator.${key}`, next)} />)}
      </Group>
      <Group title="Notify Faculty when">
        {Object.entries(settings.notifications.faculty).map(([key, value]) => <Checkbox key={key} label={labelize(key)} checked={value} onChange={(next) => update(`notifications.faculty.${key}`, next)} />)}
      </Group>
      <Group title="Notify Students when">
        {Object.entries(settings.notifications.students).map(([key, value]) => <Checkbox key={key} label={labelize(key)} checked={value} onChange={(next) => update(`notifications.students.${key}`, next)} />)}
      </Group>
    </SettingsCard>
  );
}

function BrandingSettings({ settings, update }) {
  return (
    <SettingsCard title="Repository Branding">
      <Input label="JRMSU Main Campus Logo" value={settings.branding.jrmsu_logo} onChange={(value) => update("branding.jrmsu_logo", value)} />
      <Input label="College of Teacher Education Logo" value={settings.branding.cted_logo} onChange={(value) => update("branding.cted_logo", value)} />
      <Textarea label="Repository Name" value={settings.branding.repository_name} onChange={(value) => update("branding.repository_name", value)} />
      <Input label="Footer Text" value={settings.branding.footer_text} onChange={(value) => update("branding.footer_text", value)} />
      <Input label="Contact Email" type="email" value={settings.branding.contact_email} onChange={(value) => update("branding.contact_email", value)} />
      <Input label="Research Office Contact Number" value={settings.branding.research_office_contact_number} onChange={(value) => update("branding.research_office_contact_number", value)} />
    </SettingsCard>
  );
}

function ProgramManagement({ programs, form, setForm, editingId, setEditingId, onSubmit, onArchive, onRestore, onDelete, onMove, onImport }) {
  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-[#E5E7EB] bg-white px-5 py-4">
        <h2 className="text-xl font-extrabold text-[#071B4D]">Program Management</h2>
        <p className="mt-1 text-sm text-slate-500">Manage academic programs used by registration, submissions, repository filters, dashboard, and reports.</p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-3 p-5 md:grid-cols-5">
        <Input label="Program Code" value={form.code} onChange={(value) => setForm({ ...form, code: value })} />
        <Input label="Program Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
        <Input label="Department" required={false} value={form.department} onChange={(value) => setForm({ ...form, department: value })} />
        <Select label="Status" value={form.status} options={["Active", "Archived"]} onChange={(value) => setForm({ ...form, status: value })} />
        <Input label="Display Order" type="number" value={form.display_order} onChange={(value) => setForm({ ...form, display_order: Number(value) })} />
        <div className="flex gap-2 md:col-span-5">
          <button className="btn-primary"><Plus size={17} /> {editingId ? "Save Program" : "Add Program"}</button>
          {editingId && <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm(defaultProgram()); }}>Cancel Edit</button>}
          <label className="btn-secondary cursor-pointer">
            <UploadCloud size={17} /> Import Programs
            <input className="hidden" type="file" accept=".xlsx" onChange={(event) => onImport(event.target.files?.[0])} />
          </label>
          <button type="button" className="btn-secondary" onClick={() => downloadFile("/api/programs/export", "cted-programs.xlsx")}><Download size={17} /> Export Programs</button>
        </div>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-[#F5F9FF] text-xs uppercase text-[#315a9e]"><tr><th className="p-4">Order</th><th className="p-4">Code</th><th className="p-4">Program Name</th><th className="p-4">Department</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead>
          <tbody>
            {programs.map((program) => (
              <tr key={program.id} className="border-t border-[#E5E7EB]">
                <td className="p-4">{program.display_order}</td>
                <td className="p-4 font-bold text-[#071B4D]">{program.code}</td>
                <td className="p-4">{program.name}</td>
                <td className="p-4">{program.department || "-"}</td>
                <td className="p-4">{program.status}</td>
                <td className="space-x-2 p-4">
                  <button className="btn-secondary" onClick={() => { setEditingId(program.id); setForm(program); }}>Edit</button>
                  <button className="btn-secondary" onClick={() => onMove(program, -1)}>Up</button>
                  <button className="btn-secondary" onClick={() => onMove(program, 1)}>Down</button>
                  {program.status === "Archived" ? <button className="btn-secondary" onClick={() => onRestore(program)}>Restore</button> : <button className="btn-secondary" onClick={() => onArchive(program)}>Archive</button>}
                  <button className="btn-secondary text-red-700 hover:bg-red-50" onClick={() => onDelete(program)}><Trash2 size={16} /> Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SystemInformation({ info }) {
  return (
    <SettingsCard title="System Information">
      {["institution", "campus", "college", "system_name", "system_version", "database", "storage", "backend", "frontend", "hosting", "last_backup_date"].map((key) => (
        <ReadOnly key={key} label={labelize(key)} value={info[key] || "-"} />
      ))}
    </SettingsCard>
  );
}

function BackupMaintenance({ settings, update }) {
  async function restoreBackup(file) {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      const data = await api.postForm("/api/maintenance/restore", form);
      window.alert(data.message || "Backup file received.");
    } catch (err) {
      window.alert(err.message || "Unable to restore backup.");
    }
  }

  return (
    <SettingsCard title="Backup & Maintenance">
      <button className="btn-secondary" onClick={() => downloadFile("/api/maintenance/database-backup", "cted-database-backup.json")}><Download size={17} /> Download Database Backup</button>
      <button className="btn-secondary" onClick={() => downloadFile("/api/maintenance/repository-metadata", "repository-metadata.xlsx")}><Download size={17} /> Download Repository Metadata (Excel)</button>
      <label className="btn-secondary cursor-pointer">
        <UploadCloud size={17} /> Restore Database Backup
        <input className="hidden" type="file" onChange={(event) => restoreBackup(event.target.files?.[0])} />
      </label>
      <Toggle label="Schedule Automatic Weekly Backup" checked={settings.backup.automatic_weekly_backup} onChange={(value) => update("backup.automatic_weekly_backup", value)} />
      <ReadOnly label="Last Backup Date" value={settings.backup.last_backup_date || "-"} />
      <ReadOnly label="Backup Status" value={settings.backup.backup_status || "Not scheduled"} />
    </SettingsCard>
  );
}

function SettingsCard({ title, children }) {
  return (
    <section className="panel p-5">
      <h2 className="text-xl font-extrabold text-[#071B4D]">{title}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

function Group({ title, children }) {
  return <div className="space-y-3 rounded-2xl border border-[#E5E7EB] p-4"><p className="text-sm font-extrabold text-[#071B4D]">{title}</p>{children}</div>;
}

function Input({ label, value, onChange, type = "text", required = true }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-[#071B4D]">{label}</span><input className="field" type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} required={required} /></label>;
}

function Textarea({ label, value, onChange }) {
  return <label className="block md:col-span-2"><span className="mb-2 block text-sm font-bold text-[#071B4D]">{label}</span><textarea className="field" rows="4" value={value || ""} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Select({ label, value, options, onChange }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-[#071B4D]">{label}</span><select className="field" value={value || ""} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function Checkbox({ label, checked, onChange }) {
  return <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-[#0B3D91]" checked={!!checked} onChange={(event) => onChange(event.target.checked)} /> {label}</label>;
}

function Toggle({ label, checked, onChange }) {
  return <label className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-bold text-[#071B4D]"><span>{label}</span><input type="checkbox" className="h-5 w-5 accent-[#0B3D91]" checked={!!checked} onChange={(event) => onChange(event.target.checked)} /></label>;
}

function ReadOnly({ label, value }) {
  return <div className="rounded-xl border border-[#E5E7EB] bg-[#F5F9FF] p-4"><p className="text-xs font-bold uppercase text-[#315a9e]">{label}</p><p className="mt-1 text-sm font-semibold text-[#071B4D]">{value}</p></div>;
}

function setNested(source, path, value) {
  const keys = path.split(".");
  const clone = structuredClone(source);
  let target = clone;
  keys.slice(0, -1).forEach((key) => {
    target[key] = target[key] || {};
    target = target[key];
  });
  target[keys.at(-1)] = value;
  return clone;
}

function labelize(value) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function defaultProgram() {
  return { code: "", name: "", department: "", status: "Active", display_order: 0 };
}

function normalizeProgram(program) {
  return { code: program.code, name: program.name, department: program.department || null, status: program.status || "Active", display_order: Number(program.display_order) || 0 };
}
