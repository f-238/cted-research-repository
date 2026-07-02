import { Edit3, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDisplayUser } from "../lib/userDisplay";

export default function Profile() {
  const { user } = useAuth();
  const display = getDisplayUser(user);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#071B4D]">My Profile</h1>
        <p className="mt-2 text-sm text-slate-500">Manage your CTED Research Repository identity and account information.</p>
      </div>

      <section className="panel overflow-hidden">
        <div className="bg-gradient-to-r from-[#0B4EA2] to-[#062B63] px-7 py-8 text-white">
          <div className="flex flex-wrap items-center gap-5">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-4xl font-extrabold text-[#0B4EA2] shadow-xl ring-4 ring-white/30">{display.initial}</div>
            <div>
              <h2 className="text-3xl font-extrabold">{display.name}</h2>
              <p className="mt-1 text-blue-100">{display.role}</p>
            </div>
          </div>
        </div>

        <dl className="grid gap-5 p-7 text-sm md:grid-cols-2">
          <Info icon={UserRound} label="Full Name" value={display.name} />
          <Info icon={ShieldCheck} label="Role" value={display.role} />
          <Info icon={Mail} label="Email" value={display.email} />
          <Info icon={UserRound} label="Program" value={display.courseId ? `Program ID ${display.courseId}` : "Not applicable"} />
          <Info icon={ShieldCheck} label="Date Joined" value={display.joined ? new Date(display.joined).toLocaleDateString() : "System account"} />
          <Info icon={ShieldCheck} label="Account Status" value={display.accountStatus} />
        </dl>

        <div className="border-t border-[#E5E7EB] px-7 py-5">
          <Link to="/settings/account" className="btn-primary"><Edit3 size={18} /> Edit Profile</Link>
        </div>
      </section>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-[#F5F9FF] p-4">
      <dt className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500"><Icon size={15} /> {label}</dt>
      <dd className="mt-2 font-extrabold capitalize text-[#071B4D]">{value}</dd>
    </div>
  );
}
