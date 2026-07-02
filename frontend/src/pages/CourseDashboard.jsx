import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, FolderOpen } from "lucide-react";
import { api } from "../lib/api";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { shortCourseName } from "../components/CourseCard";

function encodeSchoolYear(value) {
  return value.replaceAll("-", "_");
}

function decodeSchoolYear(value) {
  return value?.replaceAll("_", "-");
}

export default function CourseDashboard() {
  const { courseId, programId, schoolYear } = useParams();
  const activeProgramId = programId || courseId;
  const decodedSchoolYear = decodeSchoolYear(schoolYear);
  const [courses, setCourses] = useState([]);
  const [years, setYears] = useState([]);
  const [items, setItems] = useState([]);
  const course = useMemo(() => courses.find((c) => c.id === Number(activeProgramId)), [courses, activeProgramId]);

  useEffect(() => {
    api.get("/api/courses").then(setCourses);
  }, []);

  useEffect(() => {
    if (!activeProgramId) return;
    api.get(`/api/programs/${activeProgramId}/years`).then(setYears);
  }, [activeProgramId]);

  useEffect(() => {
    if (!activeProgramId || !decodedSchoolYear) {
      setItems([]);
      return;
    }
    api.get(`/api/programs/${activeProgramId}/years/${encodeSchoolYear(decodedSchoolYear)}/researches`).then(setItems);
  }, [activeProgramId, decodedSchoolYear]);

  if (decodedSchoolYear) {
    return (
      <div className="space-y-7">
        <div>
          <Link to={`/programs/${activeProgramId}/years`} className="inline-flex items-center gap-2 text-sm font-bold text-[#0B4EA2] hover:text-[#062B63]">
            <ArrowLeft size={17} /> Back to school years
          </Link>
          <h1 className="mt-3 text-3xl font-extrabold text-ink">{shortCourseName(course?.name || "Program")} Researches</h1>
          <p className="mt-1 text-sm text-[#315a9e]">School Year {decodedSchoolYear}</p>
        </div>

        <div className="panel overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F5F9FF] text-xs uppercase text-[#315a9e]">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Authors</th>
                <th className="p-4">Adviser</th>
                <th className="p-4">Submission Year</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-[#E5E7EB]">
                  <td className="p-4 font-semibold text-ink">{item.title}</td>
                  <td className="p-4">{item.authors}</td>
                  <td className="p-4">{item.adviser}</td>
                  <td className="p-4">{item.submission_year}</td>
                  <td className="p-4"><StatusBadge status={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!items.length && <EmptyState title="No researches for this school year" />}
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-[#0B4EA2] hover:text-[#062B63]">
          <ArrowLeft size={17} /> Back to dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold text-ink">{shortCourseName(course?.name || "Program")}</h1>
        <p className="mt-1 text-sm text-[#315a9e]">Choose a school year folder to view research submissions.</p>
      </div>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {years.map((year) => (
          <Link
            key={`${year.school_year}-${year.submission_year}`}
            to={`/programs/${activeProgramId}/years/${encodeSchoolYear(year.school_year)}/researches`}
            className="group rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-[0_16px_42px_rgba(7,27,77,0.07)] transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_60px_rgba(7,27,77,0.12)]"
          >
            <div className="flex items-start justify-between">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#F5F9FF] text-[#0B4EA2] ring-1 ring-blue-100">
                <FolderOpen size={30} />
              </div>
              <CalendarDays size={22} className="text-[#D4A017]" />
            </div>
            <p className="mt-6 text-xl font-extrabold text-ink">School Year {year.school_year}</p>
            <p className="mt-2 text-sm text-slate-500">Submission Year {year.submission_year}</p>
            <p className="mt-5 text-sm text-slate-500"><span className="text-2xl font-extrabold text-[#0B4EA2]">{year.total}</span> Researches</p>
            <div className="mt-5 h-1.5 rounded-full bg-[#D4A017]" />
          </Link>
        ))}
      </section>

      {!years.length && <EmptyState title="No school year folders yet" body="Folders will appear after research submissions are uploaded for this program." />}
    </div>
  );
}
