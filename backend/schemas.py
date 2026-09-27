# schemas.py — Pydantic v2 compatible request/response models

from pydantic import BaseModel, Field
from typing import List
from enum import Enum

# ── Enums ────────────────────────────────────────────────────
class ContractType(str, Enum):
    month_to_month = "Month-to-month"
    one_year       = "One year"
    two_year       = "Two year"

class InternetService(str, Enum):
    dsl         = "DSL"
    fiber_optic = "Fiber optic"
    no          = "No"

class PaymentMethod(str, Enum):
    electronic_check = "Electronic check"
    mailed_check     = "Mailed check"
    bank_transfer    = "Bank transfer (automatic)"
    credit_card      = "Credit card (automatic)"

class YesNo(str, Enum):
    yes = "Yes"
    no  = "No"

class YesNoPhone(str, Enum):
    yes              = "Yes"
    no               = "No"
    no_phone_service = "No phone service"

class YesNoInternet(str, Enum):
    yes                 = "Yes"
    no                  = "No"
    no_internet_service = "No internet service"

# ── Request: single customer predict ────────────────────────
class CustomerInput(BaseModel):
    gender:           str             = Field(..., json_schema_extra={"example": "Male"})
    SeniorCitizen:    int             = Field(..., ge=0, le=1)
    Partner:          YesNo
    Dependents:       YesNo
    tenure:           int             = Field(..., ge=0, le=72)
    PhoneService:     YesNo
    MultipleLines:    YesNoPhone
    InternetService:  InternetService
    OnlineSecurity:   YesNoInternet
    OnlineBackup:     YesNoInternet
    DeviceProtection: YesNoInternet
    TechSupport:      YesNoInternet
    StreamingTV:      YesNoInternet
    StreamingMovies:  YesNoInternet
    Contract:         ContractType
    PaperlessBilling: YesNo
    PaymentMethod:    PaymentMethod
    MonthlyCharges:   float           = Field(..., ge=0)
    TotalCharges:     float           = Field(..., ge=0)

    model_config = {
        "json_schema_extra": {
            "example": {
                "gender":           "Male",
                "SeniorCitizen":    0,
                "Partner":          "Yes",
                "Dependents":       "No",
                "tenure":           2,
                "PhoneService":     "Yes",
                "MultipleLines":    "No",
                "InternetService":  "Fiber optic",
                "OnlineSecurity":   "No",
                "OnlineBackup":     "No",
                "DeviceProtection": "No",
                "TechSupport":      "No",
                "StreamingTV":      "Yes",
                "StreamingMovies":  "Yes",
                "Contract":         "Month-to-month",
                "PaperlessBilling": "Yes",
                "PaymentMethod":    "Electronic check",
                "MonthlyCharges":   85.5,
                "TotalCharges":     171.0
            }
        }
    }

# ── Response: prediction result ──────────────────────────────
class ShapFeature(BaseModel):
    feature:    str
    importance: float

class PredictionResponse(BaseModel):
    churn_probability: float
    churn_prediction:  bool
    risk_label:        str
    threshold_used:    float
    top_reasons:       List[ShapFeature]

# ── Response: customer list ──────────────────────────────────
class CustomerRisk(BaseModel):
    customer_id:       str
    churn_probability: float
    risk_label:        str
    monthly_charges:   float
    tenure:            int
    contract:          str

class CustomersResponse(BaseModel):
    total:     int
    page:      int
    page_size: int
    customers: List[CustomerRisk]

# ── Response: feature importance ────────────────────────────
class FeaturesResponse(BaseModel):
    features: List[ShapFeature]
    metrics:  dict
