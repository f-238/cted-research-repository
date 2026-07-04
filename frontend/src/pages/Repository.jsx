import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState";
import { api, openSignedUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Repository() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = () => api.get(`/api/repository?search=${encodeURIComponent(search)}`).then(setItems);
  useEffect(() => { load(); }, []);

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

  return (
    <>
      <h1 className="text-2xl font-bold">{isAdmin ? "Approved Research Repository" : "My Research Repository"}</h1>
      {message && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</div>}
      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
      <div className="panel mt-5 flex flex-col gap-3 p-4 sm:flex-row">
        <input className="field" placeholder="Search title, author, keywords, adviser, or school year" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-primary" onClick={load}>Search</button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="panel p-5">
            <h2 className="font-semibold">{item.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{item.authors}</p>
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
    </>
  );
}
