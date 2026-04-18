from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel
from datetime import datetime, timedelta
import os

router = APIRouter()
security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret")
ALGORITHM = "HS256"

class LoginRequest(BaseModel):
    password: str

@router.post("/login")
def login(req: LoginRequest):
    stored = os.getenv("ADMIN_PASSWORD")
    if req.password != stored:
        raise HTTPException(status_code=401, detail="Wrong password")
    token = jwt.encode(
        {"sub": "admin", "exp": datetime.utcnow() + timedelta(hours=24)},
        SECRET_KEY, algorithm=ALGORITHM
    )
    return {"access_token": token, "token_type": "bearer"}

def require_admin(creds: HTTPAuthorizationCredentials = Depends(security)):
    try:
        jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
