import os
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from supabase import Client, create_client

TABLE = "diagnosis_sessions"

_supabase_client: Optional[Client] = None


def _is_missing_column_error(exc: Exception, column_name: str) -> bool:
    message = str(exc).lower()
    return "pgrst204" in message and column_name.lower() in message


def _get_supabase_service_key() -> str:
    # Support both legacy and new Supabase naming.
    return (
        os.getenv("SUPABASE_SERVICE_KEY", "").strip()
        or os.getenv("SUPABASE_SECRET_KEY", "").strip()
        or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    )


def _get_client() -> Client:
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv("SUPABASE_URL", "").strip()
    key = _get_supabase_service_key()

    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_SECRET_KEY) must be set for diagnosis persistence.")

    _supabase_client = create_client(url, key)
    return _supabase_client


def create_session(patient_id: str, raw_complaint: str, extracted_symptoms: List[str]) -> Dict[str, Any]:
    session = {
        "id": str(uuid.uuid4()),
        "patient_id": patient_id,
        "raw_complaint": raw_complaint,
        "extracted_symptoms": extracted_symptoms,
        "qa_pairs": [],
        "image_observations": None,
        "image_flagged_urgent": False,
        "report_json": None,
        "urgency_level": None,
        "medication_flags": [],
        "alert_sent": False,
        "acknowledged": False,
        "created_at": datetime.utcnow().isoformat(),
    }

    try:
        _get_client().table(TABLE).insert(session).execute()
    except Exception as exc:
        # Backward compatibility for databases that have not yet added this column.
        if (
            _is_missing_column_error(exc, "acknowledged")
            or _is_missing_column_error(exc, "alert_sent")
            or _is_missing_column_error(exc, "image_flagged_urgent")
        ):
            fallback_session = {
                k: v
                for k, v in session.items()
                if k not in {"acknowledged", "alert_sent", "image_flagged_urgent"}
            }
            _get_client().table(TABLE).insert(fallback_session).execute()
            return fallback_session
        raise
    return session


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    response = _get_client().table(TABLE).select("*").eq("id", session_id).limit(1).execute()
    rows = response.data or []
    return rows[0] if rows else None


def update_session(session_id: str, updates: Dict[str, Any]) -> None:
    try:
        _get_client().table(TABLE).update(updates).eq("id", session_id).execute()
    except Exception as exc:
        missing_optional_columns = {
            "acknowledged",
            "alert_sent",
            "image_flagged_urgent",
        }
        if any(_is_missing_column_error(exc, column_name) for column_name in missing_optional_columns):
            fallback_updates = {
                key: value
                for key, value in updates.items()
                if key not in missing_optional_columns
            }
            if fallback_updates:
                _get_client().table(TABLE).update(fallback_updates).eq("id", session_id).execute()
            return
        raise


def append_qa(session_id: str, question: str, answer: str) -> Optional[Dict[str, Any]]:
    session = get_session(session_id)
    if not session:
        return None

    qa_pairs = list(session.get("qa_pairs") or [])
    qa_pairs.append({
        "question": question,
        "answer": answer,
        "timestamp": datetime.utcnow().isoformat(),
    })

    update_session(session_id, {"qa_pairs": qa_pairs})
    session["qa_pairs"] = qa_pairs
    return session


def get_patient_sessions(patient_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    select_columns = (
        "id, patient_id, raw_complaint, extracted_symptoms, urgency_level, "
        "created_at, report_json, exported_at, alert_sent, acknowledged"
    )

    try:
        response = (
            _get_client()
            .table(TABLE)
            .select(select_columns)
            .eq("patient_id", patient_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []
    except Exception as exc:
        # Backward compatibility for databases that have not yet added this column.
        if _is_missing_column_error(exc, "acknowledged") or _is_missing_column_error(exc, "alert_sent"):
            fallback_response = (
                _get_client()
                .table(TABLE)
                .select(
                    "id, patient_id, raw_complaint, extracted_symptoms, urgency_level, "
                    "created_at, report_json, exported_at"
                )
                .eq("patient_id", patient_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return fallback_response.data or []
        raise


def get_daily_count(patient_id: str) -> int:
    day_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    response = (
        _get_client()
        .table(TABLE)
        .select("id", count="exact")
        .eq("patient_id", patient_id)
        .gte("created_at", day_start)
        .execute()
    )

    if response.count is not None:
        return int(response.count)

    return len(response.data or [])
