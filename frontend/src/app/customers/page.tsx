"use client";
import { useEffect, useState, useCallback } from "react";
import { getCustomers, CustomerRisk } from "@/lib/api";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

const riskColor: Record<string, string> = {
  High:   "#ff3b6b",
  Medium: "#f59e0b",
  Low:    "#00ff88",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRisk[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [risk, setRisk]           = useState<string>("");
  const [loading, setLoading]     = useState(true);

  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomers(page, PAGE_SIZE, risk || undefined);
      setCustomers(res.customers);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [page, risk]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: "#00d4ff", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontFamily: "Space Mono" }}>
          CUSTOMER DATA
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>At-Risk Customers</h1>
        <p style={{ color: "#64748b", marginTop: 6, fontSize: 14 }}>
          {total.toLocaleString()} customers · sorted by churn probability
        </p>
      </div>

      {/* Filters */}
      <div className="fade-up delay-1" style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {["", "High", "Medium", "Low"].map((r) => (
          <button key={r} onClick={() => { setRisk(r); setPage(1); }}
            style={{
              padding: "8px 18px", borderRadius: 6, fontSize: 12, fontWeight: 500,
              cursor: "pointer", transition: "all 0.15s",
              background: risk === r ? (r === "High" ? "#ff3b6b" : r === "Medium" ? "#f59e0b" : r === "Low" ? "#00ff88" : "#00d4ff") : "transparent",
              color: risk === r ? "#0a0c10" : "#64748b",
              border: `1px solid ${risk === r ? "transparent" : "#1e2330"}`,
            }}>
            {r || "All"}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div className="mono" style={{ fontSize: 11, color: "#64748b", alignSelf: "center" }}>
          Page {page} of {totalPages}
        </div>
      </div>

      {/* Table */}
      <div className="card fade-up delay-2" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1e2330" }}>
              {["Customer ID", "Risk Level", "Churn Probability", "Monthly Charges", "Tenure", "Contract"].map(h => (
                <th key={h} style={{
                  padding: "14px 20px", textAlign: "left", fontSize: 11,
                  color: "#64748b", letterSpacing: 1, textTransform: "uppercase", fontWeight: 500,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #1e2330" }}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} style={{ padding: "16px 20px" }}>
                      <div style={{
                        height: 14, borderRadius: 4,
                        background: "linear-gradient(90deg, #1e2330, #2e3548, #1e2330)",
                        backgroundSize: "200%",
                        width: j === 0 ? 80 : j === 2 ? 100 : 60,
                        animation: "shimmer 1.5s infinite",
                      }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : customers.map((c, i) => (
              <tr key={c.customer_id}
                style={{
                  borderBottom: "1px solid #1e2330",
                  background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,212,255,0.04)")}
                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)")}
              >
                <td style={{ padding: "14px 20px" }}>
                  <span className="mono" style={{ fontSize: 12, color: "#94a3b8" }}>{c.customer_id}</span>
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <span className={`badge-${c.risk_label.toLowerCase()}`} style={{
                    padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                  }}>
                    {c.risk_label}
                  </span>
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 80, height: 4, background: "#1e2330", borderRadius: 2, overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${c.churn_probability * 100}%`, height: "100%",
                        background: riskColor[c.risk_label], borderRadius: 2,
                      }} />
                    </div>
                    <span className="mono" style={{ fontSize: 12, color: riskColor[c.risk_label] }}>
                      {(c.churn_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <span className="mono" style={{ fontSize: 13, color: "#e2e8f0" }}>
                    ${c.monthly_charges.toFixed(2)}
                  </span>
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{ fontSize: 13, color: "#94a3b8" }}>{c.tenure} mo</span>
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{
                    fontSize: 11, color: "#64748b",
                    background: "#0d0f14", padding: "3px 8px", borderRadius: 4,
                  }}>{c.contract}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 8,
          padding: "20px", borderTop: "1px solid #1e2330",
        }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{
              padding: "8px 14px", borderRadius: 6, cursor: page === 1 ? "not-allowed" : "pointer",
              background: "transparent", border: "1px solid #1e2330",
              color: page === 1 ? "#2e3548" : "#94a3b8",
              display: "flex", alignItems: "center", gap: 4,
            }}>
            <ChevronLeft size={14} /> Prev
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            return (
              <button key={p} onClick={() => setPage(p)}
                style={{
                  padding: "8px 14px", borderRadius: 6, cursor: "pointer", minWidth: 40,
                  background: p === page ? "#00d4ff" : "transparent",
                  border: `1px solid ${p === page ? "#00d4ff" : "#1e2330"}`,
                  color: p === page ? "#0a0c10" : "#64748b",
                  fontFamily: "Space Mono", fontSize: 12,
                }}>{p}</button>
            );
          })}

          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{
              padding: "8px 14px", borderRadius: 6, cursor: page === totalPages ? "not-allowed" : "pointer",
              background: "transparent", border: "1px solid #1e2330",
              color: page === totalPages ? "#2e3548" : "#94a3b8",
              display: "flex", alignItems: "center", gap: 4,
            }}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
