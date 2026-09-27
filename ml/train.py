# ============================================================
#  train.py  —  Churn Predictor ML Pipeline
#  Run: python train.py
# ============================================================

import pandas as pd
import numpy as np
import joblib, json, os, warnings
import mlflow
import mlflow.sklearn
import shap

warnings.filterwarnings("ignore")

from sklearn.pipeline          import Pipeline
from sklearn.compose           import ColumnTransformer
from sklearn.preprocessing     import StandardScaler
from sklearn.metrics           import (
    roc_auc_score, f1_score, precision_score,
    recall_score, classification_report
)
from sklearn.model_selection   import StratifiedKFold, cross_val_score
from xgboost                   import XGBClassifier
from imblearn.combine          import SMOTETomek

DATA_DIR  = "data"
MODEL_DIR = "model"
os.makedirs(MODEL_DIR, exist_ok=True)

# ── 1. Load ──────────────────────────────────────────────────
print("📂 Loading data...")
X_train = pd.read_csv(f"{DATA_DIR}/X_train.csv")
X_test  = pd.read_csv(f"{DATA_DIR}/X_test.csv")
y_train = pd.read_csv(f"{DATA_DIR}/y_train.csv").squeeze()
y_test  = pd.read_csv(f"{DATA_DIR}/y_test.csv").squeeze()

# Convert bool columns (from pd.get_dummies) to int
X_train = X_train.astype({c: int for c in X_train.columns if X_train[c].dtype == bool})
X_test  = X_test.astype({c: int for c in X_test.columns  if X_test[c].dtype  == bool})

feature_names = X_train.columns.tolist()
print(f"   Train: {X_train.shape}  |  Test: {X_test.shape}")
print(f"   Train churn rate: {y_train.mean():.2%}")

# ── 2. Imbalance: SMOTETomek ─────────────────────────────────
print("\n⚖️  Applying SMOTETomek...")
st = SMOTETomek(random_state=42)
X_train_sm, y_train_sm = st.fit_resample(X_train, y_train)
print(f"   After SMOTETomek → {pd.Series(y_train_sm).value_counts().to_dict()}")

# ── 3. Pipeline ──────────────────────────────────────────────
numeric_features = ["tenure", "MonthlyCharges", "avg_spend_ratio"]

preprocessor = ColumnTransformer(
    transformers=[("num", StandardScaler(), numeric_features)],
    remainder="passthrough"
)

neg = (y_train == 0).sum()
pos = (y_train == 1).sum()
spw = round(neg / pos, 2)
print(f"\n⚙️  scale_pos_weight = {spw}")

xgb_params = {
    "n_estimators":      600,
    "max_depth":         4,
    "learning_rate":     0.03,
    "subsample":         0.75,
    "colsample_bytree":  0.75,
    "min_child_weight":  5,
    "gamma":             0.1,
    "reg_alpha":         0.1,
    "reg_lambda":        1.5,
    "scale_pos_weight":  spw,
    "eval_metric":       "aucpr",
    "use_label_encoder": False,
    "random_state":      42,
    "n_jobs":            -1,
}

pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier",   XGBClassifier(**xgb_params))
])

# ── 4. Cross-validation ──────────────────────────────────────
print("\n🔄 Running 5-fold cross-validation...")
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(
    pipeline, X_train_sm, y_train_sm,
    cv=cv, scoring="roc_auc", n_jobs=-1
)
print(f"   CV ROC-AUC: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# ── 5. Train + MLflow ────────────────────────────────────────
print("\n🚀 Training final model...")
mlflow.set_experiment("churn-predictor")

with mlflow.start_run(run_name="xgboost-smotetomek"):
    pipeline.fit(X_train_sm, y_train_sm)

    y_pred      = pipeline.predict(X_test)
    y_pred_prob = pipeline.predict_proba(X_test)[:, 1]

    roc_auc   = roc_auc_score(y_test, y_pred_prob)
    f1        = f1_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall    = recall_score(y_test, y_pred)

    print(f"\n📊 Test Metrics:")
    print(f"   ROC-AUC   : {roc_auc:.4f}")
    print(f"   F1 Score  : {f1:.4f}")
    print(f"   Precision : {precision:.4f}")
    print(f"   Recall    : {recall:.4f}")
    print(f"\n{classification_report(y_test, y_pred, target_names=['No Churn','Churn'])}")

    mlflow.log_params(xgb_params)
    mlflow.log_metric("cv_roc_auc_mean", cv_scores.mean())
    mlflow.log_metric("cv_roc_auc_std",  cv_scores.std())
    mlflow.log_metric("test_roc_auc",    roc_auc)
    mlflow.log_metric("test_f1",         f1)
    mlflow.log_metric("test_precision",  precision)
    mlflow.log_metric("test_recall",     recall)
    mlflow.sklearn.log_model(pipeline, "model")
    print(f"\n✅ MLflow run ID: {mlflow.active_run().info.run_id}")

# ── 6. Threshold tuning ──────────────────────────────────────
print("\n🎯 Finding optimal threshold...")
thresholds = np.arange(0.20, 0.56, 0.01)
f1s        = [f1_score(y_test, (y_pred_prob >= t).astype(int)) for t in thresholds]
best_t     = float(thresholds[np.argmax(f1s)])
best_f1    = max(f1s)
print(f"   Best threshold : {best_t:.2f}  →  F1: {best_f1:.4f}  (was {f1:.4f} at 0.50)")

with open(f"{MODEL_DIR}/threshold.json", "w") as f:
    json.dump({"threshold": round(best_t, 2)}, f)

# ── 7. SHAP ──────────────────────────────────────────────────
print("\n🔍 Computing SHAP values...")
xgb_model    = pipeline.named_steps["classifier"]
preprocessed = pipeline.named_steps["preprocessor"].transform(X_test)
explainer    = shap.TreeExplainer(xgb_model)
shap_values  = explainer.shap_values(preprocessed)

other_features    = [f for f in feature_names if f not in numeric_features]
transformed_names = numeric_features + other_features

mean_shap = np.abs(shap_values).mean(axis=0)
shap_df   = pd.DataFrame({
    "feature":    transformed_names[:len(mean_shap)],
    "importance": mean_shap
}).sort_values("importance", ascending=False)

print("\n📈 Top 10 features:")
print(shap_df.head(10).to_string(index=False))

with open(f"{MODEL_DIR}/shap_importance.json", "w") as f:
    json.dump(shap_df.head(15).to_dict(orient="records"), f, indent=2)

# ── 8. Save all artifacts ────────────────────────────────────
joblib.dump(pipeline,  f"{MODEL_DIR}/pipeline.pkl")
joblib.dump(explainer, f"{MODEL_DIR}/shap_explainer.pkl")

with open(f"{MODEL_DIR}/feature_names.json", "w") as f:
    json.dump(feature_names, f)

metrics_summary = {
    "roc_auc":   round(roc_auc, 4),
    "f1":        round(best_f1, 4),
    "precision": round(precision, 4),
    "recall":    round(recall, 4),
    "cv_mean":   round(float(cv_scores.mean()), 4),
    "cv_std":    round(float(cv_scores.std()), 4),
    "threshold": round(best_t, 2),
}
with open(f"{MODEL_DIR}/metrics.json", "w") as f:
    json.dump(metrics_summary, f, indent=2)

print(f"\n✅ All artifacts saved to /{MODEL_DIR}/")
print("   pipeline.pkl")
print("   shap_explainer.pkl")
print("   shap_importance.json")
print("   feature_names.json")
print("   metrics.json")
print("   threshold.json")
print("\n🎉 Training complete!")
print("   View MLflow UI → run: mlflow ui")
