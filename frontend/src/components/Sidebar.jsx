import {
  Bell,
  BarChart3,
  ChevronDown,
  Database,
  ClipboardList,
  FileCheck2,
  FileUp,
  Home,
  Library,
  LogOut,
  X,
  Presentation,
  ScrollText,
  Settings,
  ShieldCheck,
  Layers,
  BookOpenCheck,
  UserCog
} from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/cted-logo.png";

const adminMenuGroups = [
  {
    label: "Main",
    items: [
      ["/admin", Home, "Dashboard"],
      ["/repository", Library, "Research Repository"],
      ["/upload", FileUp, "Upload Research"]
    ]
  },
  {
    label: "Management",
    items: [
      ["/pending-reviews", ClipboardList, "Pending Reviews"],
      ["/users", UserCog, "User Management"],
      ["/accomplishment-reports", Layers, "Accomplishment Reports", [
        ["/accomplishment-reports/presentation", Presentation, "Presentation"],
        ["/accomplishment-reports/publication", ScrollText, "Publication"],
        ["/accomplishment-reports/utilization", BookOpenCheck, "Utilization"],
        ["/accomplishment-reports/completed-papers", FileCheck2, "Completed Papers"]
      ]]
    ]
  },
  {
    label: "Reports",
    items: [
      ["/reports/dashboard", BarChart3, "Reports Dashboard"]
    ]
  },
  {
    label: "System",
    items: [
      ["/notifications", Bell, "Notifications"],
      ["/settings", Settings, "Settings"]
    ]
  }
];

const studentMenuGroups = [
  {
    label: "Student",
    items: [
      ["/my-submissions", Library, "My Researches"],
      ["/upload", FileUp, "Upload Submission"],
      ["/notifications", Bell, "Notifications"],
      ["/profile", UserCog, "My Profile"]
    ]
  }
];

const facultyMenuGroups = [
  {
    label: "Faculty",
    items: [
      ["/my-submissions", Library, "My Researches"],
      ["/upload", FileUp, "Upload Submission"],
      ["/reports/dashboard", BarChart3, "Reports Dashboard"],
      ["/notifications", Bell, "Notifications"],
      ["/profile", UserCog, "My Profile"]
    ]
  }
];

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState({ "Accomplishment Reports": true, Reports: true });
  const groups = isAdmin ? adminMenuGroups : user?.role === "faculty" ? facultyMenuGroups : studentMenuGroups;

  function handleLogout() {
    onClose();
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside
      id="app-sidebar"
      className={`fixed inset-y-0 left-0 z-50 flex w-[min(312px,86vw)] shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-gradient-to-b from-[#0B4EA2] via-[#083D81] to-[#062B63] px-5 py-6 text-white shadow-2xl transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-auto lg:min-h-screen lg:w-[312px] lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl bg-white/8 p-3 ring-1 ring-white/10">
          <img src={logo} alt="CTED logo" className="h-[66px] w-[66px] rounded-full bg-white object-cover p-1 shadow-lg" />
          <div>
            <p className="text-2xl font-extrabold leading-tight tracking-normal">CTED</p>
            <p className="text-sm font-medium text-blue-100">Research Repository</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Close sidebar"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white/20 lg:hidden"
          onClick={onClose}
        >
          <X size={22} strokeWidth={2.2} />
        </button>
      </div>

      <nav className="mt-8 space-y-7">
        {groups.map((group) => group.items.length > 0 && (
          <section key={group.label}>
            <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-200/80">{group.label}</p>
            <div className="space-y-1.5">
              {group.items.map(([to, Icon, label, children]) => children ? (
                <div key={to}>
                  <button
                    onClick={() => setOpenSections((value) => ({ ...value, [label]: !value[label] }))}
                    className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3.5 text-left text-[14px] font-semibold text-blue-50 transition duration-200 hover:bg-white/10 hover:text-white"
                  >
                    <Icon size={20} strokeWidth={2} />
                    <span className="flex-1">{label}</span>
                    <ChevronDown size={16} className={`transition ${openSections[label] ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-200 ${openSections[label] ? "mt-1 max-h-56 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="ml-5 space-y-1 border-l border-white/15 pl-3">
                      {children.map(([childTo, ChildIcon, childLabel]) => (
                        <NavLink
                          key={childTo}
                          to={childTo}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex min-h-10 items-center gap-2 rounded-lg px-3 text-[13px] font-semibold transition ${
                              isActive ? "bg-white text-[#0B4EA2]" : "text-blue-100 hover:bg-white/10 hover:text-white"
                            }`
                          }
                        >
                          <ChildIcon size={16} />
                          {childLabel}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex min-h-[48px] items-center gap-3 rounded-xl px-3.5 text-[14px] font-semibold transition duration-200 ${
                      isActive
                        ? "bg-white text-[#0B4EA2] shadow-lg shadow-blue-950/20"
                        : "text-blue-50 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <Icon size={20} strokeWidth={2} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </section>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        {isAdmin && <div className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-100">
            <ShieldCheck size={15} />
            Secure institutional system
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-blue-100/90">
            <Database size={15} />
            Repository services online
          </div>
        </div>}
        {!isAdmin && (
          <button
            onClick={handleLogout}
            className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3.5 text-left text-[14px] font-semibold text-blue-50 transition duration-200 hover:bg-white/10 hover:text-white"
          >
            <LogOut size={20} strokeWidth={2} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </aside>
  );
}
