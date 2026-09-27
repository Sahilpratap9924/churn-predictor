# db.py — SQLAlchemy database setup

from sqlalchemy import create_engine, Column, String, Float, Integer, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./churn.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ── Customer table ───────────────────────────────────────────
class CustomerDB(Base):
    __tablename__ = "customers"

    customer_id        = Column(String, primary_key=True, index=True)
    tenure             = Column(Integer)
    monthly_charges    = Column(Float)
    total_charges      = Column(Float)
    contract           = Column(String)
    internet_service   = Column(String)
    payment_method     = Column(String)
    churn_probability  = Column(Float)
    churn_prediction   = Column(Boolean)
    risk_label         = Column(String)
    created_at         = Column(DateTime, default=datetime.utcnow)

# ── Dependency ───────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
