export function StatusBadge({ status, children }) {
  const value = status?.toLowerCase?.() || "neutral";
  return <span className={`status-badge status-badge--${value}`}>{children || status}</span>;
}
