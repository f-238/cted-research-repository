import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell() {
  return (
    <div className="min-h-screen bg-portal text-ink lg:flex">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Topbar />
        <div className="mx-auto max-w-[1400px] px-5 py-5 lg:px-9">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
