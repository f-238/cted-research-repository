import { Bell, Menu, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import ProfileDropdown from "./ProfileDropdown";

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);

  useEffect(() => {
    if (location.pathname === "/search") setQuery(searchParams.get("q") || "");
  }, [location.pathname, searchParams]);

  async function loadUnreadCount() {
    setLoadingCount(true);
    try {
      const data = await api.get("/api/notifications/unread-count");
      setUnreadCount(data.unread_count || 0);
    } catch {
      setUnreadCount(0);
    } finally {
      setLoadingCount(false);
    }
  }

  useEffect(() => {
    loadUnreadCount();
    window.addEventListener("notifications:changed", loadUnreadCount);
    return () => window.removeEventListener("notifications:changed", loadUnreadCount);
  }, []);

  useEffect(() => {
    loadUnreadCount();
  }, [location.pathname]);

  function submitSearch(event) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    navigate(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <header className="sticky top-0 z-20 flex min-h-[84px] items-center justify-between border-b border-[#E5E7EB] bg-white/95 px-5 shadow-sm backdrop-blur lg:px-9">
      <div className="flex flex-1 items-center gap-4">
        <Menu className="text-academic lg:hidden" size={26} />
        <form className="relative w-full max-w-[560px]" onSubmit={submitSearch}>
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            className="h-[48px] w-full rounded-2xl border border-[#E5E7EB] bg-[#F5F9FF] py-3 pl-12 pr-4 text-sm text-ink outline-none transition placeholder:text-slate-500 focus:border-[#0B4EA2] focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder="Search research, authors, advisers, keywords..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>
      </div>

      <div className="ml-4 flex items-center gap-3">
        <Link to="/notifications" className="relative grid h-11 w-11 place-items-center rounded-xl border border-[#E5E7EB] bg-white text-[#071B4D] transition hover:bg-blue-50" title="Notifications">
          <Bell size={22} strokeWidth={2.1} />
          {!loadingCount && unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#D4A017] px-1 text-[11px] font-extrabold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
        <ProfileDropdown />
      </div>
    </header>
  );
}
