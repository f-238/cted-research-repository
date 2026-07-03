import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState";
import { api, openSignedUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Repository() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const load = () => api.get(`/api/repository?search=${encodeURIComponent(search)}`).then(setItems);
  useEffect(() => { load(); }, []);
  return (
    <>
      <h1 className="text-2xl font-bold">{isAdmin ? "Approved Research Repository" : "My Research Repository"}</h1>
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
            <button className="btn-secondary mt-4" onClick={() => openSignedUrl(`/api/submissions/${item.id}/download`)}>Download</button>
          </article>
        ))}
      </div>
      {!items.length && <div className="mt-4"><EmptyState title="No research submissions yet." body={isAdmin ? "Approved research will appear here after admin review." : "Your submitted research records will appear here after upload."} /></div>}
    </>
  );
}
