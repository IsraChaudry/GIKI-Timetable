from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import require_admin
from models.schedule import Schedule
from engine.constants import ENGINE_TIMEOUT_SECONDS
import asyncio

router = APIRouter()

@router.post("/generate")
async def generate(scope: str, id: int,
                   db: Session = Depends(get_db), _=Depends(require_admin)):
    from engine.csp_backtracking import run_scheduler
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(run_scheduler, scope, id, db),
            timeout=ENGINE_TIMEOUT_SECONDS
        )
        return result
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Scheduler timed out after 28s")

@router.post("/publish/{batch_id}")
def publish(batch_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    db.query(Schedule).filter(
        Schedule.batch_id == batch_id,
        Schedule.status == "draft"
    ).update({"status": "published"})
    db.commit()
    return {"ok": True}

@router.delete("/clear/{batch_id}")
def clear(batch_id: int, force: bool = False,
          db: Session = Depends(get_db), _=Depends(require_admin)):
    q = db.query(Schedule).filter(Schedule.batch_id == batch_id)
    if not force:
        q = q.filter(Schedule.status == "draft")
    q.delete(synchronize_session=False)
    db.commit()
    return {"ok": True}
