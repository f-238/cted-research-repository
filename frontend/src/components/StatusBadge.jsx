export default function StatusBadge({ status }) {
  const key = status === "Approved" ? "approved" : status === "Disapproved" ? "disapproved" : status === "Needs Revision" ? "revision" : "pending";
  return <span className={`status status-${key}`}>{status}</span>;
}
