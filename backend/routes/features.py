# routes/features.py — GET /api/features

from fastapi import APIRouter, Request
from schemas import FeaturesResponse, ShapFeature

router = APIRouter()

@router.get("/features", response_model=FeaturesResponse)
def get_feature_importance(request: Request):
    ml = request.app.state.ml
    features = [
        ShapFeature(feature=f["feature"], importance=round(f["importance"], 4))
        for f in ml["shap"]
    ]
    return FeaturesResponse(features=features, metrics=ml["metrics"])
