export function SurfaceCard({ children, className = "" }) {
  return <section className={`surface-card ${className}`.trim()}>{children}</section>;
}
