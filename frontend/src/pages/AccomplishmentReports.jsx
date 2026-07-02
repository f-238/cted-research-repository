import { Link } from "react-router-dom";
import { BookOpenCheck, Presentation, ScrollText } from "lucide-react";

const reportTypes = [
  ["/accomplishment-reports/presentation", Presentation, "Presentation", "Track research presentations, fora, and conference participation."],
  ["/accomplishment-reports/publication", ScrollText, "Publication", "Monitor published research outputs and scholarly dissemination."],
  ["/accomplishment-reports/utilization", BookOpenCheck, "Utilization", "Record adopted, implemented, or community-utilized research outputs."]
];

export default function AccomplishmentReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#071B4D]">Accomplishment Reports</h1>
        <p className="mt-2 text-sm text-slate-500">Organize CTED research accomplishments by presentation, publication, and utilization.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {reportTypes.map(([to, Icon, title, body]) => (
          <Link key={to} to={to} className="group rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-[0_16px_42px_rgba(7,27,77,0.07)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(7,27,77,0.12)]">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#F5F9FF] text-[#0B4EA2] ring-1 ring-blue-100">
              <Icon size={30} />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-[#071B4D]">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
            <div className="mt-5 h-1.5 rounded-full bg-[#D4A017]" />
          </Link>
        ))}
      </div>
    </div>
  );
}
