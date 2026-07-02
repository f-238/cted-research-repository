import { useEffect, useState } from "react";
import { api } from "../lib/api";
import CourseCard from "../components/CourseCard";

const courseOrder = [
  "English",
  "Mathematics",
  "Science",
  "Filipino",
  "Culture and Arts",
  "Physical Education",
  "Elementary Education",
  "Early Childhood Education",
  "Social Studies"
];

function sortCourses(items) {
  return [...items].sort((a, b) => {
    const ai = courseOrder.findIndex((name) => a.course_name.includes(name));
    const bi = courseOrder.findIndex((name) => b.course_name.includes(name));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState([]);
  useEffect(() => {
    api.get("/api/dashboard/course-stats").then(setStats);
  }, []);
  const displayedStats = sortCourses(stats);

  return (
    <div className="space-y-4">
      <nav className="text-sm font-bold text-[#0B4EA2]">Dashboard</nav>

      <section className="rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-[0_14px_40px_rgba(7,27,77,0.07)] lg:p-6">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {displayedStats.map((item) => <CourseCard key={item.course_id} course={item} />)}
        </div>
      </section>

    </div>
  );
}
