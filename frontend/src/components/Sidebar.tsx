"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Brain, Activity } from "lucide-react";

const links = [
  { href: "/",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/customers",  label: "Customers",  icon: Users },
  { href: "/predict",    label: "Predict",    icon: Brain },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside style={{
      width: 220,
      background: "#0d0f14",
      borderRight: "1px solid #1e2330",
      display: "flex",
      flexDirection: "column",
      padding: "24px 0",
      position: "sticky",
      top: 0,
      height: "100vh",
    }}>
      {/* Logo */}
      <div style={{ padding: "0 24px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #00d4ff, #00ff88)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Activity size={16} color="#0a0c10" strokeWidth={2.5} />
          </div>
          <div>
            <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", letterSpacing: 1 }}>
              ChurnIQ
            </div>
            <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 0.5 }}>ML DASHBOARD</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {links.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px", borderRadius: 8, textDecoration: "none",
              background: active ? "rgba(0,212,255,0.08)" : "transparent",
              color: active ? "#00d4ff" : "#64748b",
              borderLeft: active ? "2px solid #00d4ff" : "2px solid transparent",
              fontSize: 13, fontWeight: 500,
              transition: "all 0.15s",
            }}>
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "0 24px", borderTop: "1px solid #1e2330", paddingTop: 16 }}>
        <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.6 }}>
          <div className="mono" style={{ color: "#2e3548", marginBottom: 4 }}>MODEL</div>
          <div>XGBoost + SHAP</div>
          <div style={{ color: "#00d4ff" }}>ROC-AUC 0.821</div>
        </div>
      </div>
    </aside>
  );
}
