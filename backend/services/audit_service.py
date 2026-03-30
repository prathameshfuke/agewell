import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from supabase import Client, create_client

TABLE = "symptom_audit_log"

_supabase_client: Optional[Client] = None


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
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_SECRET_KEY) must be set for audit logging.")

    _supabase_client = create_client(url, key)
    return _supabase_client


def log_event(patient_id: str, session_id: str, event_type: str, event_data: Dict[str, Any] = None) -> None:
    """
    Non-blocking audit logger. Errors are intentionally swallowed.
    """
    payload = {
        "patient_id": patient_id,
        "session_id": session_id,
        "event_type": event_type,
        "event_data": event_data or {},
        "created_at": datetime.utcnow().isoformat(),
    }

    try:
        _get_client().table(TABLE).insert(payload).execute()
    except Exception as exc:
        print(f"Audit log failed (non-blocking): {exc}")


def get_session_audit_log(session_id: str) -> List[Dict[str, Any]]:
    response = (
        _get_client()
        .table(TABLE)
        .select("*")
        .eq("session_id", session_id)
        .order("created_at")
        .execute()
    )
    return response.data or []
