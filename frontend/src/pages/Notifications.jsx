import { useEffect, useState } from "react";
import { api } from "../lib/api";
import EmptyState from "../components/EmptyState";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      setItems(await api.get("/api/notifications"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  async function markRead(id) {
    await api.patchForm(`/api/notifications/${id}/read`, new FormData());
    window.dispatchEvent(new Event("notifications:changed"));
    load();
  }
  return (
    <>
      <h1 className="text-3xl font-extrabold text-[#071B4D]">Notifications</h1>
      <p className="mt-2 text-sm text-slate-500">Recent notifications, approval notices, submission updates, and registration approvals.</p>
      <div className="mt-5 grid gap-3">
        {loading ? (
          <div className="panel p-5 text-sm text-slate-500">Loading notifications...</div>
        ) : items.map((item) => (
          <article key={item.id} className={`panel p-4 ${item.is_read ? "opacity-70" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="font-semibold">{item.title}</h2><p className="mt-1 text-sm text-slate-600">{item.message}</p></div>
              {!item.is_read && <button className="btn-secondary" onClick={() => markRead(item.id)}>Mark read</button>}
            </div>
          </article>
        ))}
      </div>
      {!loading && !items.length && <div className="mt-4"><EmptyState title="No notifications" /></div>}
    </>
  );
}
