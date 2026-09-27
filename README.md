# Churn Predictor

A churn prediction dashboard built with Next.js, FastAPI, and XGBoost.

## Run locally

Requires Python 3.12 and Node.js. Start the backend and frontend in separate PowerShell terminals.

### Backend

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:DATABASE_URL = "sqlite:///./churn.db"
python -m uvicorn main:app --reload
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the app at <http://localhost:3000>. API docs: <http://localhost:8000/docs>.

To load dashboard data, run `POST /api/customers/score-all` once in the API docs. This replaces existing customer rows in the database.

