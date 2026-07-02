import { useEffect, useState } from "react";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { api, openSignedUrl } from "../lib/api";

export default function PendingReviews() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ status: "Pending Review", adviser: "", school_year: "", submission_year: "" });
  const [review, setReview] = useState({});
  const load = () => api.get(`/api/submissions?status=${encodeURIComponent(filters.status)}&adviser=${filters.adviser}&school_year=${filters.school_year}&submission_year=${filters.submission_year}`).then(setItems);
  useEffect(() => { load(); }, []);

  async function submitReview(id) {
    await api.postJson(`/api/submissions/${id}/review`, review[id] || { status: "Approved", remarks: "Reviewed and approved." });
    load();
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Pending Reviews</h1>
      <div className="panel mt-5 grid gap-3 p-4 md:grid-cols-5">
        <select className="field" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option>Pending Review</option><option>Needs Revision</option><option>Approved</option><option>Disapproved</option></select>
        <input className="field" placeholder="Adviser" value={filters.adviser} onChange={(e) => setFilters({ ...filters, adviser: e.target.value })} />
        <input className="field" placeholder="School Year" value={filters.school_year} onChange={(e) => setFilters({ ...filters, school_year: e.target.value })} />
        <input className="field" placeholder="Submission Year" value={filters.submission_year} onChange={(e) => setFilters({ ...filters, submission_year: e.target.value })} />
        <button className="btn-primary" onClick={load}>Apply Filters</button>
      </div>
      <div className="mt-5 grid gap-4">
        {items.map((item) => (
          <article key={item.id} className="panel p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="font-semibold">{item.title}</h2>
                <p className="text-sm text-slate-500">{item.authors} - {item.course.name} - School Year {item.school_year}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-3 text-sm text-slate-600">{item.abstract}</p>
            {item.format_check && <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">{item.format_check.is_compliant ? "Format compliant" : item.format_check.warnings.join(" ")}</div>}
            <div className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto_auto]">
              <select className="field" value={review[item.id]?.status || "Approved"} onChange={(e) => setReview({ ...review, [item.id]: { ...(review[item.id] || {}), status: e.target.value } })}><option>Approved</option><option>Disapproved</option><option>Needs Revision</option></select>
              <input className="field" placeholder="Remarks or correction comments" value={review[item.id]?.remarks || ""} onChange={(e) => setReview({ ...review, [item.id]: { ...(review[item.id] || {}), remarks: e.target.value } })} />
              <button className="btn-secondary" onClick={() => openSignedUrl(`/api/submissions/${item.id}/download`)}>Download</button>
              <button className="btn-primary" onClick={() => submitReview(item.id)}>Save Review</button>
            </div>
          </article>
        ))}
        {!items.length && <EmptyState title="No research submissions yet." body="Pending reviews will appear after approved users upload research documents." />}
      </div>
    </>
  );
}
