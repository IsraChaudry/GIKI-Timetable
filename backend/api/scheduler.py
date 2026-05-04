from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import require_admin
from models.schedule import Schedule
from models.faculty import Faculty
from engine.constants import ENGINE_TIMEOUT_SECONDS
import asyncio

router = APIRouter()

@router.post("/generate")
async def generate(scope: str, id: int,
                   db: Session = Depends(get_db), _=Depends(require_admin)):
    from engine.csp_backtracking import run_scheduler
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(run_scheduler, scope, id),
            timeout=ENGINE_TIMEOUT_SECONDS
        )
        return result
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Scheduler timed out after 120s")


@router.post("/generate-all")
async def generate_all(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Run the scheduler for every faculty one by one. Returns per-faculty results."""
    from engine.csp_backtracking import run_scheduler, run_scheduler_batches
    from models.department import Department
    from models.batch import Batch

    # Clear every draft before generation so each run starts clean.
    db.query(Schedule).filter(Schedule.status == "draft").delete(synchronize_session=False)
    db.commit()

    all_faculties = db.query(Faculty).all()

    def get_batches(f):
        dept_ids = [d.id for d in db.query(Department).filter(Department.faculty_id == f.id).all()]
        return db.query(Batch).filter(Batch.dept_id.in_(dept_ids)).order_by(Batch.student_count.desc()).all()

    def faculty_sort_key(f):
        batch_list = get_batches(f)
        max_students = max((b.student_count for b in batch_list), default=0)
        return (max_students, len(batch_list))

    faculties = sorted(all_faculties, key=faculty_sort_key, reverse=True)

    # Faculties with >= 8 batches are pre-split into two groups so their
    # batches don't compete for the same large rooms in a single CSP run.
    # Group A (largest batches by student count) schedules first and claims
    # big room slots; Group B fills the remaining slots.
    SPLIT_THRESHOLD = 8

    results = []
    for faculty in faculties:
        batch_list = get_batches(faculty)

        if len(batch_list) >= SPLIT_THRESHOLD:
            half = len(batch_list) // 2
            groups = [
                [b.id for b in batch_list[:half]],
                [b.id for b in batch_list[half:]],
            ]
            total_placed = 0
            overall_status = "success"
            first_msg = None
            for grp_ids in groups:
                try:
                    r = await asyncio.wait_for(
                        asyncio.to_thread(run_scheduler_batches, faculty.id, grp_ids),
                        timeout=ENGINE_TIMEOUT_SECONDS
                    )
                    total_placed += r.get("placed", 0)
                    if r["status"] != "success":
                        overall_status = r["status"]
                        if not first_msg:
                            first_msg = r.get("message")
                except asyncio.TimeoutError:
                    overall_status = "timeout"
                    first_msg = first_msg or f"Timed out after {ENGINE_TIMEOUT_SECONDS}s"
                except Exception as e:
                    overall_status = "error"
                    first_msg = first_msg or str(e)
            entry = {"faculty": faculty.name, "code": faculty.code,
                     "status": overall_status, "placed": total_placed}
            if first_msg:
                entry["message"] = first_msg
            results.append(entry)
        else:
            try:
                result = await asyncio.wait_for(
                    asyncio.to_thread(run_scheduler, "faculty", faculty.id),
                    timeout=ENGINE_TIMEOUT_SECONDS
                )
                results.append({"faculty": faculty.name, "code": faculty.code, **result})
            except asyncio.TimeoutError:
                results.append({
                    "faculty": faculty.name, "code": faculty.code,
                    "status": "timeout", "message": f"Timed out after {ENGINE_TIMEOUT_SECONDS}s"
                })
            except Exception as e:
                results.append({
                    "faculty": faculty.name, "code": faculty.code,
                    "status": "error", "message": str(e)
                })

    total_placed = sum(r.get("placed", 0) for r in results)
    failed = [r for r in results if r["status"] != "success"]
    return {
        "status": "done",
        "total_placed": total_placed,
        "faculties": results,
        "failed_count": len(failed),
    }

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


@router.delete("/clear-all-drafts")
def clear_all_drafts(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Delete every draft schedule across all batches/faculties."""
    deleted = db.query(Schedule).filter(Schedule.status == "draft").delete(synchronize_session=False)
    db.commit()
    return {"ok": True, "deleted": deleted}
