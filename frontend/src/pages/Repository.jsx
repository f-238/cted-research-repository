import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState";
import { api, openSignedUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Repository() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const load = () => api.get(`/api/repository?search=${encodeURIComponent(search)}`).then(setItems);
  useEffect(() => { load(); }, []);

  const allSelected = isAdmin && items.length > 0 && selectedIds.length === items.length;
  const selectedCount = selectedIds.length;

  function toggleSelected(id) {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  function toggleAll(checked) {
    setSelectedIds(checked ? items.map((item) => item.id) : []);
  }

  async function deleteResearch() {
    if (!deleting) return;
    setMessage("");
    setError("");
    setDeleteBusy(true);
    try {
      await api.del(`/api/research/${deleting.id}`);
      setItems((current) => current.filter((item) => item.id !== deleting.id));
      setDeleting(null);
      setMessage("Research deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete research record.");
    } finally {
      setDeleteBusy(false);
    }
  }

  async function deleteSelectedResearch() {
    if (!bulkDeleting?.length) return;
    setMessage("");
    setError("");
    setDeleteBusy(true);
    try {
      const data = await api.delJson("/api/research/bulk", { research_ids: bulkDeleting });
      const deleted = data.deleted ?? bulkDeleting.length;
      setItems((current) => current.filter((item) => !bulkDeleting.includes(item.id)));
      setSelectedIds([]);
      setBulkDeleting(null);
      setMessage(`${deleted} research record${deleted === 1 ? "" : "s"} deleted successfully.`);
      load();
    } catch (err) {
      setBulkDeleting(null);
      setError(err.message || "Unable to delete selected research records.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold">{isAdmin ? "Approved Research Repository" : "My Research Repository"}</h1>
      {message && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</div>}
      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
      <div className="panel mt-5 flex flex-col gap-3 p-4 sm:flex-row">
        {isAdmin && (
          <label className="flex min-h-12 items-center gap-2 whitespace-nowrap text-sm font-bold text-[#071B4D]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 accent-[#0B3D91]"
              checked={allSelected}
              onChange={(event) => toggleAll(event.target.checked)}
              disabled={!items.length}
            />
            Select All
          </label>
        )}
        <input className="field" placeholder="Search title, author, keywords, adviser, or school year" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-primary" onClick={load}>Search</button>
      </div>
      {isAdmin && selectedCount > 0 && (
        <div className="panel mt-3 flex flex-wrap items-center gap-3 p-4">
          <span className="text-sm font-extrabold text-[#071B4D]">Selected: {selectedCount} researches</span>
          <button className="btn-secondary border-red-200 text-red-700 hover:bg-red-50" onClick={() => setBulkDeleting(selectedIds)} disabled={deleteBusy}>Delete Selected</button>
          <button className="btn-secondary" onClick={() => setSelectedIds([])} disabled={deleteBusy}>Cancel Selection</button>
        </div>
      )}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="panel p-5">
            <div className="flex items-start gap-3">
              {isAdmin && (
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#0B3D91]"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleSelected(item.id)}
                />
              )}
              <div className="min-w-0">
                <h2 className="font-semibold">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{item.authors}</p>
              </div>
            </div>
            <p className="mt-3 line-clamp-4 text-sm text-slate-600">{item.abstract}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
              <span>{item.course.name}</span><span>School Year {item.school_year}</span><span>Submission Year {item.submission_year}</span><span>{item.adviser}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={() => openSignedUrl(`/api/submissions/${item.id}/download`)}>Download</button>
              {isAdmin && (
                <button className="btn-secondary border-red-200 text-red-700 hover:bg-red-50" onClick={() => { setMessage(""); setError(""); setDeleting(item); }}>
                  Delete
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {!items.length && <div className="mt-4"><EmptyState title="No research submissions yet." body={isAdmin ? "Approved research will appear here after admin review." : "Your submitted research records will appear here after upload."} /></div>}
      {deleting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#071B4D]/50 px-4 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-6">
            <h2 className="text-xl font-extrabold text-[#071B4D]">Delete Research</h2>
            <p className="mt-3 text-sm text-slate-600">Are you sure you want to permanently delete this research record? This action cannot be undone.</p>
            <p className="mt-3 text-sm font-bold text-[#071B4D]">{deleting.title}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setDeleting(null)} disabled={deleteBusy}>Cancel</button>
              <button className="btn-secondary border-red-200 text-red-700 hover:bg-red-50" onClick={deleteResearch} disabled={deleteBusy}>
                {deleteBusy ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
      {bulkDeleting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#071B4D]/50 px-4 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-6">
            <h2 className="text-xl font-extrabold text-[#071B4D]">Delete Research Records</h2>
            <p className="mt-3 text-sm text-slate-600">Delete {bulkDeleting.length} research records?</p>
            <p className="mt-2 text-sm text-slate-600">This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setBulkDeleting(null)} disabled={deleteBusy}>Cancel</button>
              <button className="btn-secondary border-red-200 text-red-700 hover:bg-red-50" onClick={deleteSelectedResearch} disabled={deleteBusy}>
                {deleteBusy ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
