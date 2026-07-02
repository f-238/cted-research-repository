import { useEffect, useState } from "react";
import { BookOpen, Upload } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, openSignedUrl } from "../lib/api";

export default function Templates() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: "", instructions: "", file: null });
  const load = () => api.get("/api/templates").then(setItems);
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("instructions", form.instructions);
    if (form.file) fd.append("file", form.file);
    await api.postForm("/api/templates", fd);
    setForm({ title: "", instructions: "", file: null });
    load();
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Fixed Format Template</h1>
      <p className="text-sm text-slate-500">Download the official format before preparing your manuscript.</p>
      {isAdmin && (
        <form onSubmit={submit} className="panel mt-5 grid gap-3 p-5 md:grid-cols-2">
          <input className="field" placeholder="Template title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <input className="field" type="file" accept=".docx,.pdf" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} />
          <textarea className="field md:col-span-2" rows="4" placeholder="Formatting requirements and instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} required />
          <button className="btn-primary md:col-span-2"><Upload size={18} /> Upload Template</button>
        </form>
      )}
      <div className="mt-5 grid gap-4">
        {items.map((item) => (
          <article key={item.id} className="panel p-5">
            <div className="flex items-start gap-3"><BookOpen className="text-academic" /><div><h2 className="font-semibold">{item.title}</h2><p className="mt-1 text-sm text-slate-600">{item.instructions}</p>{item.original_filename && <button className="btn-secondary mt-4" onClick={() => openSignedUrl(`/api/templates/${item.id}/download`)}>Download Template</button>}</div></div>
          </article>
        ))}
      </div>
    </>
  );
}
