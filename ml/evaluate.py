# ============================================================
#  evaluate.py  —  Deep evaluation + charts
#  Run AFTER train.py: python evaluate.py
# ============================================================

import pandas as pd
import numpy as np
import joblib, json, warnings
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

warnings.filterwarnings("ignore")

from sklearn.metrics import (
    roc_curve, auc, precision_recall_curve,
    confusion_matrix, ConfusionMatrixDisplay,
    f1_score, precision_score, recall_score, roc_auc_score
)

# ── Load ──────────────────────────────────────────────────────
print("📂 Loading model and data...")
pipeline  = joblib.load("model/pipeline.pkl")
X_test    = pd.read_csv("data/X_test.csv")
y_test    = pd.read_csv("data/y_test.csv").squeeze()

# Convert bool cols
X_test = X_test.astype({c: int for c in X_test.columns if X_test[c].dtype == bool})

with open("model/threshold.json")       as f: threshold  = json.load(f)["threshold"]
with open("model/shap_importance.json") as f: shap_data  = json.load(f)

y_pred_prob = pipeline.predict_proba(X_test)[:, 1]
y_pred      = (y_pred_prob >= threshold).astype(int)

print(f"Using threshold: {threshold}")

# ── Plot layout ───────────────────────────────────────────────
fig = plt.figure(figsize=(16, 12))
fig.suptitle("Churn Model — Evaluation Report", fontsize=16, fontweight="bold", y=0.98)
gs  = gridspec.GridSpec(2, 3, figure=fig, hspace=0.4, wspace=0.35)

# 1. ROC Curve
ax1 = fig.add_subplot(gs[0, 0])
fpr, tpr, _ = roc_curve(y_test, y_pred_prob)
roc_auc     = auc(fpr, tpr)
ax1.plot(fpr, tpr, color="#6366f1", lw=2, label=f"AUC = {roc_auc:.3f}")
ax1.plot([0,1],[0,1],"k--", lw=1)
ax1.fill_between(fpr, tpr, alpha=0.08, color="#6366f1")
ax1.set(xlabel="False Positive Rate", ylabel="True Positive Rate", title="ROC Curve")
ax1.legend(loc="lower right")

# 2. Precision-Recall Curve
ax2 = fig.add_subplot(gs[0, 1])
prec, rec, _ = precision_recall_curve(y_test, y_pred_prob)
pr_auc       = auc(rec, prec)
ax2.plot(rec, prec, color="#f59e0b", lw=2, label=f"PR-AUC = {pr_auc:.3f}")
ax2.fill_between(rec, prec, alpha=0.08, color="#f59e0b")
ax2.set(xlabel="Recall", ylabel="Precision", title="Precision-Recall Curve")
ax2.legend()

# 3. Confusion Matrix
ax3 = fig.add_subplot(gs[0, 2])
cm  = confusion_matrix(y_test, y_pred)
ConfusionMatrixDisplay(cm, display_labels=["No Churn","Churn"]).plot(
    ax=ax3, colorbar=False, cmap="Blues"
)
ax3.set_title(f"Confusion Matrix (threshold={threshold})")

# 4. Score distribution
ax4 = fig.add_subplot(gs[1, 0])
ax4.hist(y_pred_prob[y_test==0], bins=30, alpha=0.6, color="#10b981", label="No Churn")
ax4.hist(y_pred_prob[y_test==1], bins=30, alpha=0.6, color="#ef4444", label="Churn")
ax4.axvline(threshold, color="black", linestyle="--", lw=1.5, label=f"Threshold {threshold}")
ax4.set(xlabel="Predicted Probability", ylabel="Count", title="Score Distribution")
ax4.legend()

# 5. SHAP bar chart
ax5 = fig.add_subplot(gs[1, 1:])
shap_df = pd.DataFrame(shap_data).head(15)
colors  = ["#6366f1" if i < 3 else "#94a3b8" for i in range(len(shap_df))]
ax5.barh(shap_df["feature"][::-1], shap_df["importance"][::-1], color=colors[::-1])
ax5.set(xlabel="Mean |SHAP value|", title="Top 15 Feature Importances (SHAP)")
ax5.spines[["top","right"]].set_visible(False)

plt.savefig("model/evaluation_report.png", dpi=150, bbox_inches="tight")
print("✅ Saved → model/evaluation_report.png")
plt.show()

# ── Threshold table ───────────────────────────────────────────
print(f"\n📊 Threshold sensitivity (current best = {threshold}):")
print(f"{'Threshold':>10} {'Precision':>10} {'Recall':>10} {'F1':>8} {'Flagged%':>10}")
print("─" * 52)
for t in np.arange(0.25, 0.56, 0.05):
    yp  = (y_pred_prob >= t).astype(int)
    p   = precision_score(y_test, yp, zero_division=0)
    r   = recall_score(y_test, yp)
    f   = f1_score(y_test, yp)
    pct = yp.mean() * 100
    marker = " ← best" if abs(t - threshold) < 0.01 else ""
    print(f"{t:>10.2f} {p:>10.3f} {r:>10.3f} {f:>8.3f} {pct:>9.1f}%{marker}")

print("\n🎉 Evaluation complete!")
