import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import CourseDashboard from "./pages/CourseDashboard";
import UploadResearch from "./pages/UploadResearch";
import MySubmissions from "./pages/MySubmissions";
import PendingReviews from "./pages/PendingReviews";
import Repository from "./pages/Repository";
import Templates from "./pages/Templates";
import UserManagement from "./pages/UserManagement";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import ReportsDashboard from "./pages/ReportsDashboard";
import AccountSettings from "./pages/AccountSettings";
import ChangePassword from "./pages/ChangePassword";
import AccomplishmentReports from "./pages/AccomplishmentReports";
import AccomplishmentReportTable from "./pages/AccomplishmentReportTable";
import CompletedPapers from "./pages/CompletedPapers";
import SearchResults from "./pages/SearchResults";
import { dashboardPathForUser } from "./lib/authRoutes";

function Protected({ admin = false, roles = null }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="p-8 text-sm text-slate-500">Loading application...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && !isAdmin) return <Navigate to={dashboardPathForUser(user)} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={dashboardPathForUser(user)} replace />;
  return <AppShell />;
}

function RoleDashboard() {
  const { user } = useAuth();
  return <Navigate to={dashboardPathForUser(user)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Protected />}>
        <Route path="/dashboard" element={<RoleDashboard />} />
        <Route path="/upload" element={<UploadResearch />} />
        <Route path="/my-submissions" element={<MySubmissions />} />
        <Route path="/repository" element={<Repository />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings/account" element={<AccountSettings />} />
        <Route path="/settings/password" element={<ChangePassword />} />
      </Route>
      <Route element={<Protected roles={["admin"]} />}>
        <Route path="/accomplishment-reports" element={<AccomplishmentReports />} />
        <Route path="/accomplishment-reports/presentation" element={<AccomplishmentReportTable type="presentation" />} />
        <Route path="/accomplishment-reports/publication" element={<AccomplishmentReportTable type="publication" />} />
        <Route path="/accomplishment-reports/utilization" element={<AccomplishmentReportTable type="utilization" />} />
        <Route path="/accomplishment-reports/completed-papers" element={<CompletedPapers />} />
      </Route>
      <Route element={<Protected roles={["admin", "faculty"]} />}>
        <Route path="/reports/dashboard" element={<ReportsDashboard />} />
      </Route>
      <Route element={<Protected admin />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/annual-trends" element={<ReportsDashboard />} />
        <Route path="/course/:courseId" element={<CourseDashboard />} />
        <Route path="/programs/:programId/years" element={<CourseDashboard />} />
        <Route path="/programs/:programId/years/:schoolYear/researches" element={<CourseDashboard />} />
        <Route path="/pending-reviews" element={<PendingReviews />} />
        <Route path="/users" element={<UserManagement />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
