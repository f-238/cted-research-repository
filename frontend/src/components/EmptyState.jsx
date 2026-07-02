export default function EmptyState({ title = "Nothing here yet", body = "Records will appear once available." }) {
  return (
    <div className="panel p-8 text-center">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  );
}
