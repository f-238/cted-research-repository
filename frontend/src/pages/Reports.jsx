import { BarChart3, FileCheck2, Library, UsersRound } from "lucide-react";

const cards = [
  ["Total Research Records", Library],
  ["Review Activity", FileCheck2],
  ["User Participation", UsersRound],
  ["Program Trends", BarChart3]
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-ink">Reports</h1>
        <p className="mt-2 text-sm text-[#315a9e]">Summary views for CTED research monitoring and repository activity.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([title, Icon]) => (
          <article key={title} className="rounded-2xl border border-line bg-white p-6 shadow-[0_14px_34px_rgba(7,27,77,0.08)]">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-academic">
              <Icon size={28} />
            </div>
            <h2 className="mt-5 text-lg font-bold text-ink">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">Report widgets can be expanded with charts, exports, and date filters.</p>
            <div className="mt-5 h-1.5 rounded-full bg-gold" />
          </article>
        ))}
      </div>
    </div>
  );
}
