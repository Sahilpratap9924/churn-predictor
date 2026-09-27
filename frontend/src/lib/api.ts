const BASE = "http://localhost:8000/api";

export interface CustomerInput {
  gender: string;
  SeniorCitizen: number;
  Partner: string;
  Dependents: string;
  tenure: number;
  PhoneService: string;
  MultipleLines: string;
  InternetService: string;
  OnlineSecurity: string;
  OnlineBackup: string;
  DeviceProtection: string;
  TechSupport: string;
  StreamingTV: string;
  StreamingMovies: string;
  Contract: string;
  PaperlessBilling: string;
  PaymentMethod: string;
  MonthlyCharges: number;
  TotalCharges: number;
}

export interface ShapFeature {
  feature: string;
  importance: number;
}

export interface PredictionResponse {
  churn_probability: number;
  churn_prediction: boolean;
  risk_label: string;
  threshold_used: number;
  top_reasons: ShapFeature[];
}

export interface CustomerRisk {
  customer_id: string;
  churn_probability: number;
  risk_label: string;
  monthly_charges: number;
  tenure: number;
  contract: string;
}

export interface CustomersResponse {
  total: number;
  page: number;
  page_size: number;
  customers: CustomerRisk[];
}

export interface Summary {
  total_customers: number;
  high_risk: number;
  medium_risk: number;
  predicted_churn: number;
  churn_rate: number;
  model_metrics: {
    roc_auc: number;
    f1: number;
    precision: number;
    recall: number;
    threshold: number;
  };
}

export interface FeaturesResponse {
  features: ShapFeature[];
  metrics: Record<string, number>;
}

export async function getSummary(): Promise<Summary> {
  const res = await fetch(`${BASE}/customers/summary`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}

export async function getCustomers(
  page = 1,
  pageSize = 20,
  risk?: string
): Promise<CustomersResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    ...(risk ? { risk } : {}),
  });
  const res = await fetch(`${BASE}/customers?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch customers");
  return res.json();
}

export async function getFeatures(): Promise<FeaturesResponse> {
  const res = await fetch(`${BASE}/features`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch features");
  return res.json();
}

export async function predict(data: CustomerInput): Promise<PredictionResponse> {
  const res = await fetch(`${BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Prediction failed");
  return res.json();
}
