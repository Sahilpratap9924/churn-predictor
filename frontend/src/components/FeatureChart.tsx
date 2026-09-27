"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ShapFeature } from "@/lib/api";

const COLORS = ["#00d4ff","#00c4ee","#00b4de","#00a4ce","#0094be",
                "#0084ae","#00749e","#00648e","#00547e","#00446e",
                "#00346e","#00245e","#00144e","#00043e","#00003e"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: "#1a1d26", border: "1px solid #2e3548",
        borderRadius: 8, padding: "10px 14px", fontSize: 12,
      }}>
        <div style={{ color: "#64748b", marginBottom: 4 }}>{payload[0].payload.feature}</div>
        <div style={{ color: "#00d4ff", fontFamily: "Space Mono" }}>
          {payload[0].value.toFixed(4)}
        </div>
      </div>
    );
  }
  return null;
};

export default function FeatureChart({ features }: { features: ShapFeature[] }) {
  const data = [...features].slice(0, 12).reverse();

  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
        <XAxis
          type="number" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Space Mono" }}
          axisLine={{ stroke: "#1e2330" }} tickLine={false}
        />
        <YAxis
          type="category" dataKey="feature" width={190}
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          axisLine={false} tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
