import { Bell, Menu, Plus, Search, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex min-h-[84px] items-center justify-between border-b border-[#E5E7EB] bg-white/95 px-5 shadow-sm backdrop-blur lg:px-9">
      <div className="flex flex-1 items-center gap-4">
        <Menu className="text-academic lg:hidden" size={26} />
        <div className="relative w-full max-w-[560px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            className="h-[48px] w-full rounded-2xl border border-[#E5E7EB] bg-[#F5F9FF] py-3 pl-12 pr-4 text-sm text-ink outline-none transition placeholder:text-slate-500 focus:border-[#0B4EA2] focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder="Search research, authors, advisers, keywords..."
          />
        </div>
      </div>

      <div className="ml-4 flex items-center gap-3">
        <Link to="/upload" className="hidden h-11 items-center gap-2 rounded-xl bg-[#0B4EA2] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#083D81] md:inline-flex">
          <UploadCloud size={18} /> Upload
        </Link>
        <button className="grid h-11 w-11 place-items-center rounded-xl border border-[#E5E7EB] bg-white text-[#0B4EA2] transition hover:bg-blue-50" title="Quick actions">
          <Plus size={21} />
        </button>
        <Link to="/notifications" className="relative grid h-11 w-11 place-items-center rounded-xl border border-[#E5E7EB] bg-white text-[#071B4D] transition hover:bg-blue-50" title="Notifications">
          <Bell size={22} strokeWidth={2.1} />
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#D4A017] px-1 text-[11px] font-extrabold text-white">3</span>
        </Link>
        <ProfileDropdown />
      </div>
    </header>
  );
}
