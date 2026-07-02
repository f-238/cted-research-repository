export function getDisplayUser(user) {
  const isAdmin = user?.role === "admin";
  return {
    name: isAdmin ? "Femar" : user?.full_name || "Femar",
    role: isAdmin ? "Research Coordinator" : user?.role || "Research Coordinator",
    email: user?.email || "admin@cte.edu",
    initial: "F",
    accountStatus: user?.account_status || "approved",
    courseId: user?.course_id,
    joined: user?.created_at || null
  };
}
