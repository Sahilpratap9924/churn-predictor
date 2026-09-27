"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Props {
  high: number;
  medium: number;
  low: number;
}

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const r  = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x  = cx + r * Math.cos(-midAngle * RADIAN);
  const y  = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#0a0c10" textAnchor="middle" dominantBaseline="central"
      fontSize={12} fontFamily="Space Mono" fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function RiskDonut({ high, medium, low }: Props) {
  const data = [
    { name: "High Risk",   value: high,   color: "#ff3b6b" },
    { name: "Medium Risk", value: medium, color: "#f59e0b" },
    { name: "Low Risk",    value: low,    color: "#00ff88" },
  ];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data} cx="50%" cy="45%"
          innerRadius={70} outerRadius={110}
          labelLine={false} label={renderLabel}
          dataKey="value" strokeWidth={0}
        >
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#1a1d26", border: "1px solid #2e3548", borderRadius: 8, fontSize: 12 }}
          itemStyle={{ color: "#e2e8f0" }}
        />
        <Legend
          iconType="circle" iconSize={8}
          formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
