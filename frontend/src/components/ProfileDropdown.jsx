import { Bell, ChevronDown, KeyRound, LogOut, Settings, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getDisplayUser } from "../lib/userDisplay";

const menuItems = [
  ["/profile", UserRound, "My Profile"],
  ["/settings/account", Settings, "Account Settings"],
  ["/settings/password", KeyRound, "Change Password"],
  ["/notifications", Bell, "Notifications"]
];

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const display = getDisplayUser(user);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex h-14 items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white py-2 pl-2 pr-3 text-left transition hover:bg-blue-50 sm:min-w-[218px]"
      >
        <Avatar initial={display.initial} src={display.avatarUrl} />
        <div className="hidden min-w-0 flex-1 sm:block">
          <p className="truncate text-sm font-extrabold text-[#071B4D]">{display.name}</p>
          <p className="truncate text-xs font-medium text-slate-500">{display.role}</p>
        </div>
        <ChevronDown size={18} className={`hidden text-[#0B4EA2] transition sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      <div
        className={`absolute right-0 top-[calc(100%+12px)] z-50 w-72 origin-top-right rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-[0_24px_70px_rgba(7,27,77,0.18)] transition duration-150 ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-3 py-3">
          <Avatar initial={display.initial} src={display.avatarUrl} large />
          <div>
            <p className="font-extrabold text-[#071B4D]">{display.name}</p>
            <p className="text-xs font-medium text-slate-500">{display.role}</p>
          </div>
        </div>

        <div className="py-2">
          {menuItems.map(([to, Icon, label]) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[#071B4D] transition hover:bg-[#F5F9FF] hover:text-[#0B4EA2]"
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </div>

        <div className="border-t border-[#E5E7EB] pt-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-extrabold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

function Avatar({ initial, src, large = false }) {
  const size = large ? "h-12 w-12 text-lg" : "h-10 w-10 text-sm";
  if (src) {
    return <img src={src} alt="Profile" className={`${size} shrink-0 rounded-full object-cover shadow-sm ring-4 ring-blue-50`} />;
  }
  return (
    <div className={`${size} grid shrink-0 place-items-center rounded-full bg-[#0B4EA2] font-extrabold text-white shadow-sm ring-4 ring-blue-50`}>
      {initial}
    </div>
  );
}
