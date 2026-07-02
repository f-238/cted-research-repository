import { Link } from "react-router-dom";
import {
  ArrowRight,
  Atom,
  BookOpen,
  Calculator,
  Feather,
  GraduationCap,
  Palette,
  ScrollText,
  Sprout,
  UsersRound,
  Volleyball
} from "lucide-react";

const iconMap = {
  english: BookOpen,
  mathematics: Calculator,
  science: Atom,
  filipino: Feather,
  culture: Palette,
  physical: Volleyball,
  elementary: GraduationCap,
  childhood: UsersRound,
  social: ScrollText
};

function getIcon(name) {
  const lower = name.toLowerCase();
  if (lower.includes("english")) return iconMap.english;
  if (lower.includes("mathematics")) return iconMap.mathematics;
  if (lower.includes("science")) return iconMap.science;
  if (lower.includes("filipino")) return iconMap.filipino;
  if (lower.includes("culture")) return iconMap.culture;
  if (lower.includes("physical")) return iconMap.physical;
  if (lower.includes("elementary")) return iconMap.elementary;
  if (lower.includes("early childhood")) return iconMap.childhood;
  if (lower.includes("social studies")) return iconMap.social;
  return Sprout;
}

export function shortCourseName(name) {
  if (name.includes("Major in English")) return "BSED English";
  if (name.includes("Major in Mathematics")) return "BSED Mathematics";
  if (name.includes("Major in Science")) return "BSED Science";
  if (name.includes("Major in Filipino")) return "BSED Filipino";
  if (name.includes("Major in Culture and Arts")) return "BSED Culture and Arts";
  if (name.includes("Major in Physical Education")) return "BSED Physical Education";
  if (name.includes("Major in Social Studies")) return "BSED Social Studies";
  if (name.includes("Elementary Education")) return "BEED";
  if (name.includes("Early Childhood Education")) return "BECED";
  return name;
}

export default function CourseCard({ course }) {
  const Icon = getIcon(course.course_name || course.name);
  const title = shortCourseName(course.course_name || course.name);
  return (
    <Link
      to={`/programs/${course.course_id || course.id}/years`}
      className="group relative flex min-h-[302px] cursor-pointer flex-col overflow-hidden rounded-[22px] border border-[#E5E7EB] bg-white p-7 shadow-[0_16px_40px_rgba(7,27,77,0.08)] transition duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-[0_24px_60px_rgba(7,27,77,0.14)]"
    >
      <div className="absolute inset-x-0 top-0 h-2 bg-[#D4A017]" />
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="grid h-[94px] w-[94px] place-items-center rounded-[24px] bg-[#F5F9FF] text-[#0B4EA2] ring-1 ring-blue-100 transition duration-300 group-hover:scale-105 group-hover:bg-[#0B4EA2] group-hover:text-white">
          <Icon size={60} strokeWidth={2.15} />
        </div>
        <h3 className="mt-6 min-h-[56px] text-balance text-[22px] font-extrabold leading-tight text-ink">{title}</h3>
        <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500">
          <UsersRound size={17} className="text-[#0B4EA2]" />
          <span className="text-lg font-extrabold text-[#0B4EA2]">{course.total ?? 0}</span>
          <span>Researches</span>
        </div>
      </div>
      <span className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-[#F5F9FF] px-4 text-sm font-bold text-[#0B4EA2] transition group-hover:border-[#0B4EA2] group-hover:bg-[#0B4EA2] group-hover:text-white">
        View Repository <ArrowRight size={16} />
      </span>
    </Link>
  );
}
