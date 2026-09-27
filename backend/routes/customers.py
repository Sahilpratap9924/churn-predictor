# routes/customers.py

from fastapi import APIRouter, Request, Query, HTTPException, Depends
from sqlalchemy.orm import Session
from schemas import CustomersResponse, CustomerRisk
from db import get_db, CustomerDB
import pandas as pd
import numpy as np
import os

router = APIRouter()

def get_risk_label(prob: float) -> str:
    if prob >= 0.70:   return "High"
    elif prob >= 0.45: return "Medium"
    else:              return "Low"

def decode_contract(row: pd.Series) -> str:
    """Decode one-hot contract columns back to string."""
    if row.get("Contract_Two year", 0) == 1:  return "Two year"
    if row.get("Contract_One year",  0) == 1:  return "One year"
    return "Month-to-month"


@router.get("/customers", response_model=CustomersResponse)
def get_customers(
    request:   Request,
    page:      int = Query(1, ge=1),
    page_size: int = Query(20, ge=5, le=100),
    risk:      str = Query(None),
    sort_by:   str = Query("churn_probability"),
    order:     str = Query("desc"),
    db:        Session = Depends(get_db)
):
    query = db.query(CustomerDB)
    if risk:
        query = query.filter(CustomerDB.risk_label == risk)

    sort_col = getattr(CustomerDB, sort_by, CustomerDB.churn_probability)
    query    = query.order_by(sort_col.desc() if order == "desc" else sort_col.asc())

    total   = query.count()
    records = query.offset((page - 1) * page_size).limit(page_size).all()

    return CustomersResponse(
        total=total, page=page, page_size=page_size,
        customers=[
            CustomerRisk(
                customer_id       = r.customer_id,
                churn_probability = round(r.churn_probability, 4),
                risk_label        = r.risk_label,
                monthly_charges   = r.monthly_charges,
                tenure            = r.tenure,
                contract          = r.contract,
            )
            for r in records
        ]
    )


@router.post("/customers/score-all")
def score_all_customers(request: Request, db: Session = Depends(get_db)):
    """Score entire cleaned dataset and save to DB. Call once after training."""
    ml = request.app.state.ml
    try:
        here     = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.normpath(os.path.join(here, "..", "..", "ml", "data", "churn_cleaned.csv"))
        print(f"Loading: {csv_path}")

        df_raw = pd.read_csv(csv_path)
        # Convert bool columns to int
        df_raw = df_raw.astype({c: int for c in df_raw.columns if df_raw[c].dtype == bool})

        # ── Extract display columns from already-encoded data ──
        tenure          = df_raw["tenure"].values
        monthly_charges = df_raw["MonthlyCharges"].values
        contract        = df_raw.apply(decode_contract, axis=1).values

        # ── Build feature matrix ──
        X = df_raw.drop(columns=["Churn"], errors="ignore")
        for col in ml["features"]:
            if col not in X.columns:
                X[col] = 0
        X = X[ml["features"]]

        probs     = ml["pipeline"].predict_proba(X)[:, 1]
        threshold = ml["threshold"]

        # ── Save to DB ──
        db.query(CustomerDB).delete()
        for i, prob in enumerate(probs):
            db.add(CustomerDB(
                customer_id       = f"CUST-{i+1:04d}",
                tenure            = int(tenure[i]),
                monthly_charges   = float(monthly_charges[i]),
                total_charges     = 0.0,
                contract          = str(contract[i]),
                internet_service  = "",
                payment_method    = "",
                churn_probability = round(float(prob), 4),
                churn_prediction  = bool(prob >= threshold),
                risk_label        = get_risk_label(prob),
            ))
        db.commit()

        high   = int((probs >= 0.70).sum())
        medium = int(((probs >= 0.45) & (probs < 0.70)).sum())
        low    = int((probs < 0.45).sum())

        return {
            "status":     "ok",
            "scored":     len(probs),
            "high":       high,
            "medium":     medium,
            "low":        low,
            "churn_rate": round(float((probs >= threshold).mean()), 4),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/customers/summary")
def get_summary(request: Request, db: Session = Depends(get_db)):
    ml      = request.app.state.ml
    total   = db.query(CustomerDB).count()
    high    = db.query(CustomerDB).filter(CustomerDB.risk_label == "High").count()
    medium  = db.query(CustomerDB).filter(CustomerDB.risk_label == "Medium").count()
    churned = db.query(CustomerDB).filter(CustomerDB.churn_prediction == True).count()

    return {
        "total_customers": total,
        "high_risk":       high,
        "medium_risk":     medium,
        "predicted_churn": churned,
        "churn_rate":      round(churned / total, 4) if total else 0,
        "model_metrics":   ml.get("metrics", {}),
    }
