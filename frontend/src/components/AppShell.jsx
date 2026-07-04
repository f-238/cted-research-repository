import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") setSidebarOpen(false);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");

    function closeOnDesktop(event) {
      if (event.matches) setSidebarOpen(false);
    }

    if (desktopQuery.matches) setSidebarOpen(false);
    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener("change", closeOnDesktop);
      return () => desktopQuery.removeEventListener("change", closeOnDesktop);
    }

    desktopQuery.addListener(closeOnDesktop);
    return () => desktopQuery.removeListener(closeOnDesktop);
  }, []);

  return (
    <div className="min-h-screen bg-portal text-ink lg:flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[1px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <main className="min-w-0 flex-1">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="mx-auto max-w-[1400px] px-5 py-5 lg:px-9">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
