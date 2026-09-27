"use client";

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  delay?: number;
}

export default function KPICard({ label, value, sub, accent = "#00d4ff", delay = 0 }: KPICardProps) {
  return (
    <div
      className={`card fade-up delay-${delay}`}
      style={{ padding: "24px", position: "relative", overflow: "hidden" }}
    >
      {/* accent line top */}
      <div style={{
        position: "absolute", top: 0, left: 24, right: 24, height: 2,
        background: `linear-gradient(90deg, ${accent}, transparent)`,
        borderRadius: 1,
      }} />

      <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 1.5, marginBottom: 12, textTransform: "uppercase" }}>
        {label}
      </div>
      <div className="mono" style={{ fontSize: 32, fontWeight: 700, color: accent, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>{sub}</div>
      )}
    </div>
  );
}
