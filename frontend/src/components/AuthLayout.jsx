import { BookOpenCheck, CheckCircle2, CloudUpload, Database, FileText } from "lucide-react";
import logo from "../assets/cted-logo.png";

const watermarkIcons = [
  [BookOpenCheck, "left-10 top-28"],
  [FileText, "right-16 top-40"],
  [CloudUpload, "left-20 bottom-36"],
  [Database, "right-24 bottom-28"],
  [CheckCircle2, "right-1/3 top-24"]
];

export default function AuthLayout({ children }) {
  return (
    <main className="min-h-screen bg-[#F5F9FF] lg:grid lg:grid-cols-[minmax(420px,46%)_1fr]">
      <section className="relative flex min-h-[360px] overflow-hidden bg-gradient-to-br from-[#0B3D91] via-[#083574] to-[#062B63] px-8 py-8 text-white lg:min-h-screen lg:px-12 lg:py-12">
        <div className="absolute inset-0 opacity-10">
          {watermarkIcons.map(([Icon, position]) => (
            <Icon key={position} className={`absolute ${position}`} size={96} strokeWidth={1.4} />
          ))}
        </div>
        <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full border-[36px] border-white/10" />
        <div className="absolute -left-28 top-32 h-72 w-72 rounded-full border-[30px] border-[#D4A017]/20" />

        <div className="relative z-10 flex w-full flex-col">
          <div className="flex justify-center pt-4 lg:pt-2">
            <div className="grid h-[120px] w-[120px] place-items-center rounded-full border-2 border-white/25 bg-white/95 p-2 shadow-[0_0_44px_rgba(255,255,255,0.38)] backdrop-blur-md sm:h-[150px] sm:w-[150px] lg:h-[170px] lg:w-[170px]">
              <img src={logo} alt="CTED logo" className="h-full w-full rounded-full object-contain" />
            </div>
          </div>

          <div className="mx-auto my-auto max-w-xl py-10 text-center lg:pt-12">
            <div className="mx-auto mb-7 h-1.5 w-28 rounded-full bg-[#D4A017]" />
            <h1 className="text-4xl font-extrabold leading-tight tracking-normal lg:text-5xl">CTED Research Repository</h1>
            <p className="mx-auto mt-5 max-w-lg text-lg leading-8 text-blue-100">Research Submission, Review, and Repository Management System</p>
            <div className="mt-8 grid gap-3 text-sm text-blue-50 sm:grid-cols-2">
              <Feature icon={CloudUpload} label="Digital research submission" />
              <Feature icon={CheckCircle2} label="Admin review workflow" />
              <Feature icon={Database} label="Centralized repository" />
              <Feature icon={BookOpenCheck} label="Academic format compliance" />
            </div>
          </div>

          <p className="text-xs text-blue-100/80">College of Teacher Education • Institutional Research Management</p>
        </div>
      </section>

      <section className="flex min-h-[calc(100vh-360px)] items-center justify-center px-5 py-10 lg:min-h-screen lg:px-10">
        {children}
      </section>
    </main>
  );
}

function Feature({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 backdrop-blur">
      <Icon size={20} className="text-[#D4A017]" />
      <span className="font-semibold">{label}</span>
    </div>
  );
}
