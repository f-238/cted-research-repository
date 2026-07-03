export function getDisplayUser(user) {
  const isAdmin = user?.role === "admin";
  const name = user?.full_name || "User";
  const role = isAdmin ? "Research Coordinator" : user?.role || "User";
  return {
    name,
    role,
    email: user?.email || "",
    initial: name.trim().charAt(0).toUpperCase() || "U",
    avatarUrl: user?.avatar_url || "",
    accountStatus: user?.account_status || "approved",
    courseId: user?.course_id,
    joined: user?.created_at || null
  };
}
