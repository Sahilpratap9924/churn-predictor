

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import joblib, json, os, sys

# ── make sure routes can import schemas ──────────────────────
sys.path.insert(0, os.path.dirname(__file__))

from routes import predict, customers, features
from db import engine, Base

ml = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Find model folder: works whether you run from /backend or project root
    here     = os.path.dirname(os.path.abspath(__file__))
    BASE     = os.path.join(here, "..", "ml", "model")
    BASE     = os.path.normpath(BASE)

    print(f"📂 Loading model from: {BASE}")

    ml["pipeline"]    = joblib.load(os.path.join(BASE, "pipeline.pkl"))
    ml["explainer"]   = joblib.load(os.path.join(BASE, "shap_explainer.pkl"))

    with open(os.path.join(BASE, "feature_names.json"))   as f: ml["features"]  = json.load(f)
    with open(os.path.join(BASE, "shap_importance.json")) as f: ml["shap"]      = json.load(f)
    with open(os.path.join(BASE, "metrics.json"))         as f: ml["metrics"]   = json.load(f)
    with open(os.path.join(BASE, "threshold.json"))       as f: ml["threshold"] = json.load(f)["threshold"]

    app.state.ml = ml
    print(f"✅ Model loaded | threshold = {ml['threshold']}")

    Base.metadata.create_all(bind=engine)
    yield
    ml.clear()

app = FastAPI(title="Churn Predictor API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router,   prefix="/api", tags=["Predict"])
app.include_router(customers.router, prefix="/api", tags=["Customers"])
app.include_router(features.router,  prefix="/api", tags=["Features"])

@app.get("/")
def root():
    return {"status": "ok", "message": "Churn Predictor API running"}

@app.get("/api/health")
def health():
    return {
        "status":    "ok",
        "threshold": ml.get("threshold"),
        "metrics":   ml.get("metrics"),
    }
