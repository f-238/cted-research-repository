import { Camera, Edit3, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { getDisplayUser } from "../lib/userDisplay";

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 2 * 1024 * 1024;

export default function Profile() {
  const { user, updateUser } = useAuth();
  const display = getDisplayUser(user);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function chooseImage(event) {
    const file = event.target.files?.[0];
    setMessage("");
    setError("");
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    if (!file) return;
    if (!allowedImageTypes.includes(file.type)) {
      setError("Only JPG, JPEG, PNG, and WEBP images are allowed.");
      return;
    }
    if (file.size > maxImageSize) {
      setError("Profile image must be 2 MB or smaller.");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function uploadImage() {
    if (!selectedFile) return;
    const form = new FormData();
    form.append("file", selectedFile);
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const updated = await api.postForm("/api/users/me/profile-image", form);
      updateUser(updated);
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      setMessage("Profile photo updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to upload profile photo.");
    } finally {
      setUploading(false);
    }
  }

  const avatarSrc = previewUrl || display.avatarUrl;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#071B4D]">My Profile</h1>
        <p className="mt-2 text-sm text-slate-500">Manage your CTED Research Repository identity and account information.</p>
      </div>

      <section className="panel overflow-hidden">
        <div className="bg-gradient-to-r from-[#0B4EA2] to-[#062B63] px-7 py-8 text-white">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar src={avatarSrc} initial={display.initial} />
            <div className="min-w-0">
              <h2 className="text-3xl font-extrabold">{display.name}</h2>
              <p className="mt-1 text-blue-100">{display.role}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#0B4EA2] shadow-sm transition hover:bg-blue-50">
                  <Camera size={18} /> Change Profile Photo
                  <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={chooseImage} />
                </label>
                {selectedFile && (
                  <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-[#D4A017] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#B88910] disabled:cursor-not-allowed disabled:opacity-70" onClick={uploadImage} disabled={uploading}>
                    <Save size={18} /> {uploading ? "Uploading..." : "Save Photo"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {(message || error || selectedFile) && (
          <div className="border-b border-[#E5E7EB] px-7 py-4">
            {selectedFile && <p className="text-sm font-semibold text-[#0B4EA2]">Previewing {selectedFile.name}. Save to update your profile photo.</p>}
            {message && <p className="text-sm font-semibold text-emerald-700">{message}</p>}
            {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
          </div>
        )}

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

function Avatar({ src, initial }) {
  if (src) {
    return <img src={src} alt="Profile" className="h-24 w-24 rounded-full bg-white object-cover shadow-xl ring-4 ring-white/30" />;
  }
  return <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-4xl font-extrabold text-[#0B4EA2] shadow-xl ring-4 ring-white/30">{initial}</div>;
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-[#F5F9FF] p-4">
      <dt className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500"><Icon size={15} /> {label}</dt>
      <dd className="mt-2 font-extrabold capitalize text-[#071B4D]">{value}</dd>
    </div>
  );
}
