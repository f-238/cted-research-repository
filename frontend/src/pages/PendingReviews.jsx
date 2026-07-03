import { useEffect, useState } from "react";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { api, openSignedUrl } from "../lib/api";

export default function PendingReviews() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ status: "", adviser: "", school_year: "", submission_year: "" });
  const [hasSubmissions, setHasSubmissions] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [viewing, setViewing] = useState({});
  const [review, setReview] = useState({});
  const buildQuery = (activeFilters) => {
    const params = new URLSearchParams();
    if (activeFilters.status) params.set("status", activeFilters.status);
    if (activeFilters.adviser) params.set("adviser", activeFilters.adviser);
    if (activeFilters.school_year) params.set("school_year", activeFilters.school_year);
    if (activeFilters.submission_year) params.set("submission_year", activeFilters.submission_year);
    const query = params.toString();
    return query ? `/api/submissions?${query}` : "/api/submissions";
  };
  const load = async (activeFilters = filters, applied = false) => {
    const data = await api.get(buildQuery(activeFilters));
    setItems(data);
    setFiltersApplied(applied);
    if (!applied) setHasSubmissions(data.length > 0);
  };
  useEffect(() => { load({ status: "", adviser: "", school_year: "", submission_year: "" }, false); }, []);

  async function submitReview(id, statusOverride = null) {
    const status = statusOverride || review[id]?.status || "Approved";
    const remarks = review[id]?.remarks || defaultRemark(status);
    await api.postJson(`/api/submissions/${id}/review`, { status, remarks });
    load(filters, filtersApplied);
  }

  function defaultRemark(status) {
    if (status === "Approved") return "Reviewed and approved.";
    if (status === "Needs Revision") return "Needs revision. Please see reviewer comments.";
    return "Reviewed and disapproved.";
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Pending Reviews</h1>
      <div className="panel mt-5 grid gap-3 p-4 md:grid-cols-5">
        <select className="field" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All Statuses</option><option>Pending Review</option><option>Needs Revision</option><option>Approved</option><option>Disapproved</option></select>
        <input className="field" placeholder="Adviser" value={filters.adviser} onChange={(e) => setFilters({ ...filters, adviser: e.target.value })} />
        <input className="field" placeholder="School Year" value={filters.school_year} onChange={(e) => setFilters({ ...filters, school_year: e.target.value })} />
        <input className="field" placeholder="Submission Year" value={filters.submission_year} onChange={(e) => setFilters({ ...filters, submission_year: e.target.value })} />
        <button className="btn-primary" onClick={() => load(filters, true)}>Apply Filters</button>
      </div>
      <div className="mt-5 grid gap-4">
        {items.map((item) => (
          <article key={item.id} className="panel p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="font-semibold">{item.title}</h2>
                <p className="text-sm text-slate-500">{item.authors} - {item.course.name} - School Year {item.school_year}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                  <span>Adviser: {item.adviser}</span>
                  <span>Submission Year: {item.submission_year}</span>
                  <span>Submitted: {new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <StatusBadge status={item.status} />
            </div>
            {viewing[item.id] && (
              <>
                <p className="mt-3 text-sm text-slate-600">{item.abstract}</p>
                {item.format_check && <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">{item.format_check.is_compliant ? "Format compliant" : item.format_check.warnings.join(" ")}</div>}
              </>
            )}
            <div className="mt-4 grid gap-3 md:grid-cols-[auto_auto_180px_1fr_auto]">
              <button className="btn-secondary" onClick={() => setViewing({ ...viewing, [item.id]: !viewing[item.id] })}>{viewing[item.id] ? "Hide" : "View"}</button>
              <button className="btn-secondary" onClick={() => openSignedUrl(`/api/submissions/${item.id}/download`)}>Download</button>
              <select className="field" value={review[item.id]?.status || "Approved"} onChange={(e) => setReview({ ...review, [item.id]: { ...(review[item.id] || {}), status: e.target.value } })}><option>Approved</option><option>Disapproved</option><option>Needs Revision</option></select>
              <input className="field" placeholder="Add remarks or correction comments" value={review[item.id]?.remarks || ""} onChange={(e) => setReview({ ...review, [item.id]: { ...(review[item.id] || {}), remarks: e.target.value } })} />
              <div className="flex flex-wrap gap-2">
                <button className="btn-secondary" onClick={() => submitReview(item.id, "Approved")}>Approve</button>
                <button className="btn-secondary" onClick={() => submitReview(item.id, "Needs Revision")}>Needs Revision</button>
                <button className="btn-secondary" onClick={() => submitReview(item.id, "Disapproved")}>Disapprove</button>
                <button className="btn-primary" onClick={() => submitReview(item.id)}>Add Remarks</button>
              </div>
            </div>
          </article>
        ))}
        {!items.length && (
          <EmptyState
            title={!hasSubmissions ? "No research submissions yet." : "No submissions match the selected filters."}
            body={!hasSubmissions ? "Submitted research documents will appear here after approved users upload them." : "Try changing the status, adviser, school year, or submission year filters."}
          />
        )}
      </div>
    </>
  );
}
