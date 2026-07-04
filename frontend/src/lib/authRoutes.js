export function dashboardPathForUser(user) {
  if (user?.role === "admin") return "/admin";
  if (user?.role === "faculty") return "/my-submissions";
  return "/my-submissions";
}
