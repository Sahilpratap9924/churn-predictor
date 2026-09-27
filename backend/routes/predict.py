# routes/predict.py — POST /api/predict

from fastapi import APIRouter, Request, HTTPException
from schemas import CustomerInput, PredictionResponse, ShapFeature
import pandas as pd
import numpy as np

router = APIRouter()

def get_risk_label(prob: float) -> str:
    if prob >= 0.70:   return "High"
    elif prob >= 0.45: return "Medium"
    else:              return "Low"


def preprocess_input(data: CustomerInput, feature_names: list) -> pd.DataFrame:
    """
    Reproduce the exact same preprocessing done in the training notebook.
    Feature set: 33 columns matching X_train.csv
    """
    d = data.dict()

    # ── Binary encodings ──────────────────────────────────────
    yes_no = {"Yes": 1, "No": 0}
    row = {
        "SeniorCitizen":    d["SeniorCitizen"],
        "Partner":          yes_no.get(d["Partner"], 0),
        "Dependents":       yes_no.get(d["Dependents"], 0),
        "tenure":           d["tenure"],
        "PhoneService":     yes_no.get(d["PhoneService"], 0),
        "PaperlessBilling": yes_no.get(d["PaperlessBilling"], 0),
        "MonthlyCharges":   d["MonthlyCharges"],
    }

    # ── Engineered features ───────────────────────────────────
    total = d["TotalCharges"] if d["TotalCharges"] > 0 else d["MonthlyCharges"]
    row["avg_spend_ratio"] = d["MonthlyCharges"] / (total + 1)

    # num_services: count of active services
    svc_fields = ["PhoneService", "MultipleLines", "OnlineSecurity",
                  "OnlineBackup", "DeviceProtection", "TechSupport",
                  "StreamingTV", "StreamingMovies"]
    row["num_services"] = sum(
        1 for f in svc_fields if d.get(f) == "Yes"
    )

    # ── One-hot: MultipleLines ────────────────────────────────
    row["MultipleLines_No phone service"] = int(d["MultipleLines"] == "No phone service")
    row["MultipleLines_Yes"]              = int(d["MultipleLines"] == "Yes")

    # ── One-hot: InternetService ──────────────────────────────
    row["InternetService_Fiber optic"] = int(d["InternetService"] == "Fiber optic")
    row["InternetService_No"]          = int(d["InternetService"] == "No")

    # ── One-hot: OnlineSecurity ───────────────────────────────
    row["OnlineSecurity_No internet service"] = int(d["OnlineSecurity"] == "No internet service")
    row["OnlineSecurity_Yes"]                 = int(d["OnlineSecurity"] == "Yes")

    # ── One-hot: OnlineBackup ─────────────────────────────────
    row["OnlineBackup_No internet service"] = int(d["OnlineBackup"] == "No internet service")
    row["OnlineBackup_Yes"]                 = int(d["OnlineBackup"] == "Yes")

    # ── One-hot: DeviceProtection ─────────────────────────────
    row["DeviceProtection_No internet service"] = int(d["DeviceProtection"] == "No internet service")
    row["DeviceProtection_Yes"]                 = int(d["DeviceProtection"] == "Yes")

    # ── One-hot: TechSupport ──────────────────────────────────
    row["TechSupport_No internet service"] = int(d["TechSupport"] == "No internet service")
    row["TechSupport_Yes"]                 = int(d["TechSupport"] == "Yes")

    # ── One-hot: StreamingTV ──────────────────────────────────
    row["StreamingTV_No internet service"] = int(d["StreamingTV"] == "No internet service")
    row["StreamingTV_Yes"]                 = int(d["StreamingTV"] == "Yes")

    # ── One-hot: StreamingMovies ──────────────────────────────
    row["StreamingMovies_No internet service"] = int(d["StreamingMovies"] == "No internet service")
    row["StreamingMovies_Yes"]                 = int(d["StreamingMovies"] == "Yes")

    # ── One-hot: Contract ─────────────────────────────────────
    row["Contract_One year"] = int(d["Contract"] == "One year")
    row["Contract_Two year"] = int(d["Contract"] == "Two year")

    # ── One-hot: PaymentMethod ────────────────────────────────
    row["PaymentMethod_Credit card (automatic)"] = int(d["PaymentMethod"] == "Credit card (automatic)")
    row["PaymentMethod_Electronic check"]        = int(d["PaymentMethod"] == "Electronic check")
    row["PaymentMethod_Mailed check"]            = int(d["PaymentMethod"] == "Mailed check")

    # ── One-hot: gender ───────────────────────────────────────
    row["gender_Male"] = int(d["gender"] == "Male")

    # ── One-hot: tenure_group ─────────────────────────────────
    tenure = d["tenure"]
    row["tenure_group_mid"]   = int(12 < tenure <= 36)
    row["tenure_group_loyal"] = int(tenure > 36)

    # ── Build DataFrame in exact feature order ─────────────────
    df = pd.DataFrame([row])
    for col in feature_names:
        if col not in df.columns:
            df[col] = 0
    return df[feature_names]


@router.post("/predict", response_model=PredictionResponse)
def predict_churn(data: CustomerInput, request: Request):
    ml = request.app.state.ml

    try:
        df        = preprocess_input(data, ml["features"])
        threshold = ml["threshold"]

        prob       = float(ml["pipeline"].predict_proba(df)[0, 1])
        prediction = prob >= threshold

        # ── SHAP top reasons ──────────────────────────────────
        preprocessed = ml["pipeline"].named_steps["preprocessor"].transform(df)
        shap_vals    = ml["explainer"].shap_values(preprocessed)[0]

        numeric_features  = ["tenure", "MonthlyCharges", "avg_spend_ratio"]
        other_features    = [f for f in ml["features"] if f not in numeric_features]
        transformed_names = numeric_features + other_features

        indices = np.argsort(np.abs(shap_vals))[::-1][:5]
        top_reasons = [
            ShapFeature(
                feature    = transformed_names[i] if i < len(transformed_names) else f"feature_{i}",
                importance = round(float(shap_vals[i]), 4)
            )
            for i in indices
        ]

        return PredictionResponse(
            churn_probability = round(prob, 4),
            churn_prediction  = bool(prediction),
            risk_label        = get_risk_label(prob),
            threshold_used    = threshold,
            top_reasons       = top_reasons,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
