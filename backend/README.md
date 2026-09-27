# Backend — Churn Predictor API

## Folder structure
```
backend/
├── main.py              # FastAPI app entry point
├── schemas.py           # Pydantic request/response models
├── db.py                # SQLAlchemy models + DB session
├── routes/
│   ├── predict.py       # POST /api/predict
│   ├── customers.py     # GET /api/customers + summary + score-all
│   └── features.py      # GET /api/features
├── .env                 # DB connection string
├── requirements.txt
└── README.md
```

## Setup
```bash
pip install -r requirements.txt
```

## Run
```bash
uvicorn main:app --reload
# API runs at http://localhost:8000
# Swagger UI at http://localhost:8000/docs
```

## First-time setup — populate DB
After starting the server, run once to score all customers:
```bash
curl -X POST http://localhost:8000/api/customers/score-all
```

## Endpoints

| Method | Endpoint                      | Description                        |
|--------|-------------------------------|------------------------------------|
| GET    | /                             | Health check                       |
| GET    | /api/health                   | Model status + metrics             |
| POST   | /api/predict                  | Predict churn for one customer     |
| GET    | /api/features                 | SHAP feature importances           |
| GET    | /api/customers                | Paginated customer risk list       |
| GET    | /api/customers/summary        | KPI totals for dashboard           |
| POST   | /api/customers/score-all      | Score entire dataset → save to DB  |

## Query params for GET /api/customers
- `page` — page number (default: 1)
- `page_size` — results per page (default: 20, max: 100)
- `risk` — filter by High | Medium | Low
- `sort_by` — field to sort (default: churn_probability)
- `order` — asc | desc (default: desc)

## Project structure expected
```
churn-predictor/
├── ml/          ← model artifacts live here
└── backend/     ← this folder
```
The backend loads model files from `../ml/model/` at startup.

## Switch to PostgreSQL
In .env, replace:
```
DATABASE_URL=postgresql://user:password@host:5432/churn_db
```
