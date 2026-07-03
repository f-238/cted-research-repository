import { CheckCircle2, Clock3, FileText, XCircle, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { api } from "../lib/api";

export default function StudentDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/submissions?mine=true")
      .then(setItems)
      .catch((err) => setError(err.message || "Unable to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => ({
    total: items.length,
    pending: items.filter((item) => item.status === "Pending Review").length,
    revision: items.filter((item) => item.status === "Needs Revision").length,
    approved: items.filter((item) => item.status === "Approved").length,
    disapproved: items.filter((item) => item.status === "Disapproved").length
  }), [items]);

  const recent = items.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-[#0B4EA2]">Dashboard</p>
        <h1 className="mt-1 text-3xl font-extrabold text-[#071B4D]">My Research Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">Track your submitted research and review status.</p>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard title="My Submitted Researches" value={counts.total} icon={FileText} />
        <SummaryCard title="Pending Review" value={counts.pending} icon={Clock3} />
        <SummaryCard title="Needs Revision" value={counts.revision} icon={AlertTriangle} />
        <SummaryCard title="Approved" value={counts.approved} icon={CheckCircle2} />
        <SummaryCard title="Disapproved" value={counts.disapproved} icon={XCircle} />
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      <section className="panel overflow-hidden">
        <div className="border-b border-[#E5E7EB] bg-white px-5 py-4">
          <h2 className="font-extrabold text-[#071B4D]">Recent Submission Status</h2>
        </div>
        {loading ? (
          <div className="p-5 text-sm text-slate-500">Loading submissions...</div>
        ) : recent.length ? (
          <div className="divide-y divide-[#E5E7EB]">
            {recent.map((item) => (
              <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <h3 className="font-bold text-[#071B4D]">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.course.name} - School Year {item.school_year} - Submitted {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </article>
            ))}
          </div>
        ) : (
          <div className="p-5">
            <EmptyState title="No submitted research yet." body="Upload your first research document to start the review process." />
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon }) {
  return (
    <article className="rounded-[20px] border border-[#E5E7EB] bg-white p-5 shadow-[0_16px_42px_rgba(7,27,77,0.07)]">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F5F9FF] text-[#0B4EA2] ring-1 ring-blue-100">
        <Icon size={24} />
      </div>
      <p className="mt-5 text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 text-4xl font-extrabold text-[#071B4D]">{value}</p>
    </article>
  );
}
