import { getSummary, getFeatures } from "@/lib/api";
import KPICard from "@/components/KPICard";
import FeatureChart from "@/components/FeatureChart";
import RiskDonut from "@/components/RiskDonut";

export default async function DashboardPage() {
  let summary, features;
  try {
    [summary, features] = await Promise.all([getSummary(), getFeatures()]);
  } catch {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
        <div style={{ color: "#ff3b6b", fontSize: 14, fontFamily: "Space Mono" }}>⚠ Cannot connect to backend</div>
        <div style={{ color: "#64748b", fontSize: 12 }}>Make sure uvicorn is running on localhost:8000</div>
        <div style={{ color: "#64748b", fontSize: 12 }}>Then run: curl -X POST http://localhost:8000/api/customers/score-all</div>
      </div>
    );
  }

  const low = summary.total_customers - summary.high_risk - summary.medium_risk;

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, color: "#00d4ff", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontFamily: "Space Mono" }}>
          OVERVIEW
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>
          Customer Churn Intelligence
        </h1>
        <p style={{ color: "#64748b", marginTop: 6, fontSize: 14 }}>
          XGBoost model · {summary.total_customers.toLocaleString()} customers scored · threshold {summary.model_metrics?.threshold ?? "0.47"}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <KPICard
          label="Total Customers"
          value={summary.total_customers.toLocaleString()}
          sub="scored by model"
          accent="#00d4ff"
          delay={1}
        />
        <KPICard
          label="Predicted Churn"
          value={summary.predicted_churn.toLocaleString()}
          sub={`${(summary.churn_rate * 100).toFixed(1)}% churn rate`}
          accent="#ff3b6b"
          delay={2}
        />
        <KPICard
          label="High Risk"
          value={summary.high_risk.toLocaleString()}
          sub="prob ≥ 70%"
          accent="#ff3b6b"
          delay={3}
        />
        <KPICard
          label="ROC-AUC Score"
          value={summary.model_metrics?.roc_auc ?? "—"}
          sub={`F1: ${summary.model_metrics?.f1 ?? "—"}`}
          accent="#00ff88"
          delay={4}
        />
      </div>

      {/* Model metrics row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        <KPICard label="Precision" value={summary.model_metrics?.precision ?? "—"} sub="of flagged, actually churn" accent="#f59e0b" delay={1} />
        <KPICard label="Recall"    value={summary.model_metrics?.recall ?? "—"}    sub="of churners caught"           accent="#a78bfa" delay={2} />
        <KPICard label="Medium Risk" value={summary.medium_risk.toLocaleString()} sub="45% ≤ prob < 70%"             accent="#f59e0b" delay={3} />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
        {/* Feature importance */}
        <div className="card fade-up delay-2" style={{ padding: 28 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>SHAP Analysis</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Top Feature Importances</div>
          </div>
          <FeatureChart features={features.features} />
        </div>

        {/* Risk distribution */}
        <div className="card fade-up delay-3" style={{ padding: 28 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Distribution</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Risk Segments</div>
          </div>
          <RiskDonut high={summary.high_risk} medium={summary.medium_risk} low={low} />

          {/* Legend counts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
            {[
              { label: "High",   val: summary.high_risk,   color: "#ff3b6b" },
              { label: "Medium", val: summary.medium_risk, color: "#f59e0b" },
              { label: "Low",    val: low,                 color: "#00ff88" },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ textAlign: "center", padding: "10px 4px", background: "#0d0f14", borderRadius: 8 }}>
                <div className="mono" style={{ fontSize: 16, fontWeight: 700, color }}>{val.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
