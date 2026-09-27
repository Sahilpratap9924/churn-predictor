"use client";
import { useState } from "react";
import { predict, CustomerInput, PredictionResponse } from "@/lib/api";
import { Brain, AlertTriangle, CheckCircle, Loader } from "lucide-react";

const SELECT = "select";
const NUMBER = "number";

const fields: { key: keyof CustomerInput; label: string; type: string; options?: string[] }[] = [
  { key: "gender",           label: "Gender",            type: SELECT, options: ["Male", "Female"] },
  { key: "SeniorCitizen",    label: "Senior Citizen",    type: SELECT, options: ["0", "1"] },
  { key: "Partner",          label: "Partner",           type: SELECT, options: ["Yes", "No"] },
  { key: "Dependents",       label: "Dependents",        type: SELECT, options: ["Yes", "No"] },
  { key: "tenure",           label: "Tenure (months)",   type: NUMBER },
  { key: "Contract",         label: "Contract",          type: SELECT, options: ["Month-to-month", "One year", "Two year"] },
  { key: "InternetService",  label: "Internet Service",  type: SELECT, options: ["DSL", "Fiber optic", "No"] },
  { key: "PhoneService",     label: "Phone Service",     type: SELECT, options: ["Yes", "No"] },
  { key: "MultipleLines",    label: "Multiple Lines",    type: SELECT, options: ["Yes", "No", "No phone service"] },
  { key: "OnlineSecurity",   label: "Online Security",   type: SELECT, options: ["Yes", "No", "No internet service"] },
  { key: "OnlineBackup",     label: "Online Backup",     type: SELECT, options: ["Yes", "No", "No internet service"] },
  { key: "DeviceProtection", label: "Device Protection", type: SELECT, options: ["Yes", "No", "No internet service"] },
  { key: "TechSupport",      label: "Tech Support",      type: SELECT, options: ["Yes", "No", "No internet service"] },
  { key: "StreamingTV",      label: "Streaming TV",      type: SELECT, options: ["Yes", "No", "No internet service"] },
  { key: "StreamingMovies",  label: "Streaming Movies",  type: SELECT, options: ["Yes", "No", "No internet service"] },
  { key: "PaperlessBilling", label: "Paperless Billing", type: SELECT, options: ["Yes", "No"] },
  { key: "PaymentMethod",    label: "Payment Method",    type: SELECT, options: ["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"] },
  { key: "MonthlyCharges",   label: "Monthly Charges ($)", type: NUMBER },
  { key: "TotalCharges",     label: "Total Charges ($)",   type: NUMBER },
];

const defaults: CustomerInput = {
  gender: "Male", SeniorCitizen: 0, Partner: "Yes", Dependents: "No",
  tenure: 2, PhoneService: "Yes", MultipleLines: "No",
  InternetService: "Fiber optic", OnlineSecurity: "No", OnlineBackup: "No",
  DeviceProtection: "No", TechSupport: "No", StreamingTV: "Yes",
  StreamingMovies: "Yes", Contract: "Month-to-month", PaperlessBilling: "Yes",
  PaymentMethod: "Electronic check", MonthlyCharges: 85.5, TotalCharges: 171.0,
};

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 8,
  background: "#0d0f14", border: "1px solid #1e2330",
  color: "#e2e8f0", fontSize: 13, outline: "none",
  fontFamily: "DM Sans, sans-serif",
};

export default function PredictPage() {
  const [form, setForm]       = useState<CustomerInput>(defaults);
  const [result, setResult]   = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleChange = (key: keyof CustomerInput, val: string) => {
    setForm(f => ({
      ...f,
      [key]: key === "tenure" || key === "MonthlyCharges" || key === "TotalCharges" || key === "SeniorCitizen"
        ? Number(val) : val,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await predict(form);
      setResult(res);
    } catch (e: any) {
      setError(e.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const prob    = result ? result.churn_probability * 100 : 0;
  const color   = result?.risk_label === "High" ? "#ff3b6b" : result?.risk_label === "Medium" ? "#f59e0b" : "#00ff88";

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: "#00d4ff", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontFamily: "Space Mono" }}>
          PREDICTION ENGINE
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>Single Customer Predict</h1>
        <p style={{ color: "#64748b", marginTop: 6, fontSize: 14 }}>
          Enter customer attributes to get churn probability + top reasons
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
        {/* Form */}
        <div className="card fade-up delay-1" style={{ padding: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {fields.map(({ key, label, type, options }) => (
              <div key={key}>
                <label style={{ fontSize: 11, color: "#64748b", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  {label}
                </label>
                {type === SELECT ? (
                  <select value={String(form[key])} onChange={e => handleChange(key, e.target.value)} style={inputStyle}>
                    {options!.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type="number" value={Number(form[key])} onChange={e => handleChange(key, e.target.value)}
                    style={inputStyle} step={key === "tenure" ? 1 : 0.01} min={0} />
                )}
              </div>
            ))}
          </div>

          <button onClick={handleSubmit} disabled={loading}
            style={{
              marginTop: 24, width: "100%", padding: "14px",
              borderRadius: 8, border: "none", cursor: loading ? "not-allowed" : "pointer",
              background: loading ? "#1e2330" : "linear-gradient(135deg, #00d4ff, #00ff88)",
              color: loading ? "#64748b" : "#0a0c10",
              fontSize: 14, fontWeight: 700, letterSpacing: 0.5,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "opacity 0.2s",
            }}>
            {loading ? <><Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> Predicting...</> : <><Brain size={16} /> Run Prediction</>}
          </button>
          {error && <div style={{ marginTop: 12, color: "#ff3b6b", fontSize: 13, textAlign: "center" }}>{error}</div>}
        </div>

        {/* Result */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Probability gauge */}
          <div className={`card fade-up delay-2 ${result ? `glow-${result.risk_label === "High" ? "red" : result.risk_label === "Low" ? "green" : "cyan"}` : ""}`}
            style={{ padding: 28, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 }}>
              CHURN PROBABILITY
            </div>

            {/* Circle gauge */}
            <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
              <svg width={160} height={160} viewBox="0 0 160 160">
                <circle cx={80} cy={80} r={64} fill="none" stroke="#1e2330" strokeWidth={10} />
                <circle cx={80} cy={80} r={64} fill="none"
                  stroke={result ? color : "#1e2330"} strokeWidth={10}
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 64}`}
                  strokeDashoffset={`${2 * Math.PI * 64 * (1 - prob / 100)}`}
                  transform="rotate(-90 80 80)"
                  style={{ transition: "stroke-dashoffset 0.8s ease" }}
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
              }}>
                <div className="mono" style={{ fontSize: result ? 28 : 18, fontWeight: 700, color: result ? color : "#2e3548" }}>
                  {result ? `${prob.toFixed(1)}%` : "—"}
                </div>
                {result && (
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>probability</div>
                )}
              </div>
            </div>

            {result ? (
              <>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 16px", borderRadius: 20,
                  background: `${color}22`, color, border: `1px solid ${color}44`,
                  fontSize: 13, fontWeight: 600,
                }}>
                  {result.churn_prediction ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                  {result.churn_prediction ? "Will Churn" : "Will Retain"}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: "#64748b" }}>
                  {result.risk_label} Risk · threshold {result.threshold_used}
                </div>
              </>
            ) : (
              <div style={{ color: "#2e3548", fontSize: 13 }}>Run prediction to see results</div>
            )}
          </div>

          {/* Top reasons */}
          {result && (
            <div className="card fade-up" style={{ padding: 24 }}>
              <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>
                TOP CONTRIBUTING FACTORS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {result.top_reasons.map((r, i) => {
                  const positive = r.importance > 0;
                  const barColor = positive ? "#ff3b6b" : "#00ff88";
                  const maxImp   = Math.max(...result.top_reasons.map(x => Math.abs(x.importance)));
                  const pct      = (Math.abs(r.importance) / maxImp) * 100;
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>{r.feature}</span>
                        <span className="mono" style={{ fontSize: 11, color: barColor }}>
                          {positive ? "+" : ""}{r.importance.toFixed(3)}
                        </span>
                      </div>
                      <div style={{ height: 3, background: "#1e2330", borderRadius: 2 }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 2, transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 14, fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
                🔴 Positive = pushes toward churn &nbsp;·&nbsp; 🟢 Negative = retains
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #111318; }
      `}</style>
    </div>
  );
}
