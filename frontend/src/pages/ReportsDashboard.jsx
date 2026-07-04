import { BarChart3, BookOpenCheck, FileCheck2, FileSpreadsheet, Presentation, Printer, ScrollText, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function ReportsDashboard() {
  const { user, isAdmin } = useAuth();
  const [summary, setSummary] = useState({ presentations: 0, publications: 0, utilizations: 0, completed_papers: 0 });
  const [mySummary, setMySummary] = useState({ researches: 0, presentations: 0, publications: 0, utilizations: 0, completed_papers: 0 });
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const requests = [
      api.get("/api/dashboard/report-summary"),
      api.get("/api/reports/trends")
    ];
    if (user?.role === "faculty") requests.push(api.get("/api/faculty/accomplishment-summary"));

    Promise.all(requests).then(([summaryData, trends, facultySummary]) => {
      setSummary(summaryData);
      if (facultySummary) setMySummary(facultySummary);
      setTrendData(trends.map((item) => ({
        year: item.school_year,
        presentations: item.presentations,
        publications: item.publications,
        utilizations: item.utilizations,
        completed_papers: item.completed_papers
      })));
    }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [user]);

  const totals = useMemo(() => ({
    presentations: summary.presentations,
    publications: summary.publications,
    utilizations: summary.utilizations,
    completed_papers: summary.completed_papers,
    outputs: summary.presentations + summary.publications + summary.utilizations + summary.completed_papers
  }), [summary]);

  const hasChartData = trendData.some((item) => item.presentations || item.publications || item.utilizations || item.completed_papers);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#0B4EA2]">Reports</p>
          <h1 className="mt-1 text-3xl font-extrabold text-[#071B4D]">Research Accomplishment Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">Database-driven analytics for CTED research accomplishments and outputs.</p>
        </div>
        {isAdmin && <div className="flex flex-wrap gap-3">
          <button className="btn-secondary"><FileSpreadsheet size={17} /> Export</button>
          <button className="btn-secondary"><Printer size={17} /> Print</button>
        </div>}
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      {user?.role === "faculty" && (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#071B4D]">My Accomplishments</h2>
            <p className="mt-1 text-sm text-slate-500">Research-related records where your name appears as author, adviser, researcher, contributor, or associated faculty.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            <FacultySummaryCard title="My Researches" value={mySummary.researches} icon={Trophy} to="/my-submissions?type=research_submissions" button="View My Researches" />
            <FacultySummaryCard title="My Presentations" value={mySummary.presentations} icon={Presentation} to="/my-submissions?type=presentations" button="View My Presentations" />
            <FacultySummaryCard title="My Publications" value={mySummary.publications} icon={ScrollText} to="/my-submissions?type=publications" button="View My Publications" />
            <FacultySummaryCard title="My Utilizations" value={mySummary.utilizations} icon={BookOpenCheck} to="/my-submissions?type=utilizations" button="View My Utilizations" />
            <FacultySummaryCard title="My Completed Papers" value={mySummary.completed_papers} icon={FileCheck2} to="/my-submissions?type=completed_papers" button="View Completed Papers" />
          </div>
        </section>
      )}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard title="Total Presentations" value={totals.presentations} icon={Presentation} />
        <SummaryCard title="Total Publications" value={totals.publications} icon={ScrollText} />
        <SummaryCard title="Total Utilizations" value={totals.utilizations} icon={BookOpenCheck} />
        <SummaryCard title="Total Completed Papers" value={totals.completed_papers} icon={FileCheck2} />
        <SummaryCard title="Total Research Outputs" value={totals.outputs} icon={Trophy} />
      </section>

      {loading ? (
        <div className="panel p-6 text-sm text-slate-500">Loading report data...</div>
      ) : hasChartData ? (
        <>
          <ChartPanel title="Annual Research Output Trend" icon={BarChart3}>
            <ResponsiveContainer width="100%" height={330}>
              <LineChart data={trendData}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="presentations" stroke="#0B4EA2" strokeWidth={3} />
                <Line type="monotone" dataKey="publications" stroke="#D4A017" strokeWidth={3} />
                <Line type="monotone" dataKey="utilizations" stroke="#10B981" strokeWidth={3} />
                <Line type="monotone" dataKey="completed_papers" stroke="#7C3AED" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

          <section className="grid gap-6 xl:grid-cols-4">
            <TrendBar title="Presentation Trend" data={trendData} dataKey="presentations" color="#0B4EA2" />
            <TrendBar title="Publication Trend" data={trendData} dataKey="publications" color="#D4A017" />
            <TrendBar title="Utilization Trend" data={trendData} dataKey="utilizations" color="#10B981" />
            <TrendBar title="Completed Papers Trend" data={trendData} dataKey="completed_papers" color="#7C3AED" />
          </section>
        </>
      ) : (
        <EmptyState title="No chart data available yet." body="Charts will appear after real presentation, publication, utilization, or completed paper records are created." />
      )}
    </div>
  );
}

function FacultySummaryCard({ title, value, icon: Icon, to, button }) {
  return (
    <article className="rounded-[20px] border border-[#E5E7EB] bg-white p-5 shadow-[0_16px_42px_rgba(7,27,77,0.07)]">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F5F9FF] text-[#0B4EA2] ring-1 ring-blue-100">
        <Icon size={25} />
      </div>
      <p className="mt-5 text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 text-4xl font-extrabold text-[#071B4D]">{value}</p>
      <Link to={to} className="btn-secondary mt-4 w-full">{button}</Link>
    </article>
  );
}

function SummaryCard({ title, value, icon: Icon }) {
  return (
    <article className="rounded-[20px] border border-[#E5E7EB] bg-white p-5 shadow-[0_16px_42px_rgba(7,27,77,0.07)]">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F5F9FF] text-[#0B4EA2] ring-1 ring-blue-100">
        <Icon size={25} />
      </div>
      <p className="mt-5 text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 text-4xl font-extrabold text-[#071B4D]">{value}</p>
    </article>
  );
}

function ChartPanel({ title, icon: Icon, children }) {
  return (
    <article className="rounded-[20px] border border-[#E5E7EB] bg-white p-5 shadow-[0_16px_42px_rgba(7,27,77,0.07)]">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#F5F9FF] text-[#0B4EA2]">
          <Icon size={20} />
        </div>
        <h2 className="font-extrabold text-[#071B4D]">{title}</h2>
      </div>
      {children}
    </article>
  );
}

function TrendBar({ title, data, dataKey, color }) {
  return (
    <ChartPanel title={title} icon={BarChart3}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
