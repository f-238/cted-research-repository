import { useEffect, useState } from "react";
import { api } from "../lib/api";
import EmptyState from "../components/EmptyState";
import { Trash2 } from "lucide-react";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      setItems(await api.get("/api/notifications"));
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const selectedCount = selectedIds.length;

  function toggleSelected(id) {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  function toggleAll(checked) {
    setSelectedIds(checked ? items.map((item) => item.id) : []);
  }

  async function markRead(id) {
    await api.patchForm(`/api/notifications/${id}/read`, new FormData());
    window.dispatchEvent(new Event("notifications:changed"));
    load();
  }

  async function updateReadState(isRead) {
    if (!selectedIds.length) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await api.patchJson("/api/notifications/bulk-read", { notification_ids: selectedIds, is_read: isRead });
      setItems((current) => current.map((item) => selectedIds.includes(item.id) ? { ...item, is_read: isRead } : item));
      setSelectedIds([]);
      window.dispatchEvent(new Event("notifications:changed"));
    } catch (err) {
      setError(err.message || "Unable to update notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteNotifications(ids) {
    if (!ids.length) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const data = await api.delJson("/api/notifications/bulk", { notification_ids: ids });
      const deleted = data.deleted ?? ids.length;
      setItems((current) => current.filter((item) => !ids.includes(item.id)));
      setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
      setDeleteConfirm(null);
      setMessage(`${deleted} notification${deleted === 1 ? "" : "s"} deleted successfully.`);
      window.dispatchEvent(new Event("notifications:changed"));
    } catch (err) {
      setDeleteConfirm(null);
      setError(err.message || "Unable to delete notifications.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="text-3xl font-extrabold text-[#071B4D]">Notifications</h1>
      <p className="mt-2 text-sm text-slate-500">Recent notifications, approval notices, submission updates, and registration approvals.</p>
      {message && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</div>}
      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
      <label className="panel mt-5 flex items-center gap-3 p-4">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 accent-[#0B3D91]"
          checked={allSelected}
          onChange={(event) => toggleAll(event.target.checked)}
          disabled={!items.length || loading}
        />
        <span className="text-sm font-bold text-[#071B4D]">Select All</span>
      </label>
      {selectedCount > 0 && (
        <div className="panel mt-3 flex flex-wrap items-center gap-3 p-4">
          <span className="text-sm font-extrabold text-[#071B4D]">Selected: {selectedCount}</span>
          <button className="btn-secondary border-red-200 text-red-700 hover:bg-red-50" onClick={() => setDeleteConfirm(selectedIds)} disabled={busy}>Delete Selected</button>
          <button className="btn-secondary" onClick={() => updateReadState(true)} disabled={busy}>Mark as Read</button>
          <button className="btn-secondary" onClick={() => updateReadState(false)} disabled={busy}>Mark as Unread</button>
          <button className="btn-secondary" onClick={() => setSelectedIds([])} disabled={busy}>Cancel Selection</button>
        </div>
      )}
      <div className="mt-5 grid gap-3">
        {loading ? (
          <div className="panel p-5 text-sm text-slate-500">Loading notifications...</div>
        ) : items.map((item) => (
          <article key={item.id} className={`group panel p-4 ${item.is_read ? "opacity-70" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#0B3D91]"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleSelected(item.id)}
                />
                <div className="min-w-0"><h2 className="font-semibold">{item.title}</h2><p className="mt-1 text-sm text-slate-600">{item.message}</p></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {!item.is_read && <button className="btn-secondary" onClick={() => markRead(item.id)}>Mark read</button>}
                <button className="btn-secondary px-3 text-red-600 opacity-100 hover:bg-red-50 sm:opacity-0 sm:transition sm:group-hover:opacity-100" title="Delete" onClick={() => setDeleteConfirm([item.id])}><Trash2 size={16} /></button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!loading && !items.length && <div className="mt-4"><EmptyState title="No notifications" /></div>}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#071B4D]/50 px-4 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-6">
            <h2 className="text-xl font-extrabold text-[#071B4D]">Delete Notifications</h2>
            <p className="mt-3 text-sm text-slate-600">Delete {deleteConfirm.length} selected notifications?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={busy}>Cancel</button>
              <button className="btn-secondary border-red-200 text-red-700 hover:bg-red-50" onClick={() => deleteNotifications(deleteConfirm)} disabled={busy}>{busy ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
