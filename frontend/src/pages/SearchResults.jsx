import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import { api } from "../lib/api";

const groups = [
  ["research_submissions", "Research Submissions"],
  ["presentations", "Presentations"],
  ["publications", "Publications"],
  ["utilizations", "Utilizations"]
];

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState(defaultResults());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const term = query.trim();
      setError("");
      if (!term) {
        setResults(defaultResults());
        return;
      }
      setLoading(true);
      try {
        setResults(await api.get(`/api/search?q=${encodeURIComponent(term)}`));
      } catch (err) {
        setError(err.message || "Unable to load search results.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [query]);

  const total = useMemo(
    () => groups.reduce((sum, [key]) => sum + (results[key]?.length || 0), 0),
    [results]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#071B4D]">Search Results</h1>
          <p className="mt-2 text-sm text-slate-500">
            {query ? `Showing real database matches for "${query}".` : "Enter a search term in the top navigation."}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-bold text-[#0B4EA2]">
          <Search size={17} />
          {loading ? "Searching..." : `${total} result${total === 1 ? "" : "s"}`}
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      {loading ? (
        <section className="panel p-6 text-sm text-slate-500">Loading search results...</section>
      ) : total > 0 ? (
        groups.map(([key, label]) => (
          <ResultGroup key={key} title={label} items={results[key] || []} />
        ))
      ) : (
        <EmptyState
          title={query ? "No matching records found." : "Search the repository"}
          body={query ? "Try another title, author, adviser, keyword, program, school year, or accomplishment detail." : "Results will appear here after you submit a search."}
        />
      )}
    </div>
  );
}

function ResultGroup({ title, items }) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-white px-5 py-4">
        <h2 className="font-extrabold text-[#071B4D]">{title}</h2>
        <span className="rounded-full bg-[#F5F9FF] px-3 py-1 text-xs font-bold text-[#0B4EA2]">{items.length}</span>
      </div>
      {items.length ? (
        <div className="divide-y divide-[#E5E7EB]">
          {items.map((item) => (
            <article key={`${item.type}-${item.id}`} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-[#071B4D]">{item.title}</h3>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#0B4EA2]">{item.type}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                  <span>{item.author}</span>
                  <span>School Year {item.school_year}</span>
                  <span>{item.status}</span>
                </div>
              </div>
              <Link className="btn-secondary w-fit" to={item.view_url}>View</Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="p-5 text-sm text-slate-500">No matches in this group.</div>
      )}
    </section>
  );
}

function defaultResults() {
  return {
    research_submissions: [],
    presentations: [],
    publications: [],
    utilizations: []
  };
}
