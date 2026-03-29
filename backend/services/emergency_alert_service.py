import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict, List, Optional

from supabase import Client, create_client

ALERTS_TABLE = "diagnosis_alerts"

_supabase_client: Optional[Client] = None


def _get_client() -> Client:
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_SERVICE_KEY", "").strip()

    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set for emergency alerts.")

    _supabase_client = create_client(url, key)
    return _supabase_client


def _get_auth_email(user_id: str) -> Optional[str]:
    try:
        response = _get_client().auth.admin.get_user_by_id(user_id)
    except Exception:
        return None

    user_obj = getattr(response, "user", None)
    if user_obj is None and isinstance(response, dict):
        user_obj = response.get("user")

    if user_obj is None:
        data_obj = getattr(response, "data", None)
        if isinstance(data_obj, dict):
            user_obj = data_obj.get("user")

    if isinstance(user_obj, dict):
        return user_obj.get("email")

    return getattr(user_obj, "email", None)


def _load_caregiver_profiles(caregiver_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    if not caregiver_ids:
        return {}

    client = _get_client()

    try:
        response = (
            client.table("profiles")
            .select("id, full_name, phone, email")
            .in_("id", caregiver_ids)
            .execute()
        )
    except Exception:
        response = (
            client.table("profiles")
            .select("id, full_name, phone")
            .in_("id", caregiver_ids)
            .execute()
        )

    rows = response.data or []
    return {row["id"]: row for row in rows if row.get("id")}


def get_family_contacts(patient_id: str) -> List[Dict[str, Any]]:
    """
    Returns caregivers linked to a patient. Uses caregiver_relationships when available,
    and falls back to profiles.linked_elderly_id.
    """
    client = _get_client()

    relation_rows: List[Dict[str, Any]] = []
    try:
        relationship_response = (
            client.table("caregiver_relationships")
            .select("caregiver_id, relation")
            .eq("elder_id", patient_id)
            .execute()
        )
        relation_rows = relationship_response.data or []
    except Exception:
        relation_rows = []

    if not relation_rows:
        try:
            fallback_response = (
                client.table("profiles")
                .select("id, full_name, phone")
                .eq("linked_elderly_id", patient_id)
                .eq("role", "caregiver")
                .execute()
            )
            relation_rows = [
                {
                    "caregiver_id": row.get("id"),
                    "relation": "Caregiver",
                    "full_name": row.get("full_name"),
                    "phone": row.get("phone"),
                }
                for row in (fallback_response.data or [])
                if row.get("id")
            ]
        except Exception:
            relation_rows = []

    caregiver_ids = [row.get("caregiver_id") for row in relation_rows if row.get("caregiver_id")]
    profile_map = _load_caregiver_profiles(caregiver_ids)

    contacts: List[Dict[str, Any]] = []
    for row in relation_rows:
        caregiver_id = row.get("caregiver_id")
        if not caregiver_id:
            continue

        profile = profile_map.get(caregiver_id, {})
        email = profile.get("email") or _get_auth_email(caregiver_id)

        contacts.append(
            {
                "id": caregiver_id,
                "name": row.get("full_name") or profile.get("full_name") or "Caregiver",
                "email": email,
                "phone": row.get("phone") or profile.get("phone"),
                "relation": row.get("relation") or "Family Member",
            }
        )

    return contacts


def send_emergency_email(contact: Dict[str, Any], patient_name: str, urgency_reason: str, session_id: str) -> bool:
    smtp_user = os.getenv("EMAIL_USER")
    smtp_pass = os.getenv("EMAIL_PASSWORD")

    if not smtp_user or not smtp_pass or not contact.get("email"):
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"URGENT - AgeWell Alert for {patient_name}"
        msg["From"] = f"AgeWell Alerts <{smtp_user}>"
        msg["To"] = contact["email"]

        html = f"""
        <div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;\">
          <div style=\"background:#dc2626;color:white;padding:20px;border-radius:8px 8px 0 0;\">
            <h1 style=\"margin:0;font-size:24px;\">Urgent Medical Alert</h1>
          </div>
          <div style=\"background:#fef2f2;padding:24px;border:1px solid #fecaca;border-radius:0 0 8px 8px;\">
            <p style=\"font-size:18px;font-weight:bold;color:#991b1b;\">{patient_name} may need immediate medical attention.</p>
            <p style=\"font-size:16px;color:#374151;background:white;padding:16px;border-radius:6px;border-left:4px solid #dc2626;\">{urgency_reason}</p>
            <p style=\"color:#6b7280;font-size:14px;\">Session ID: {session_id}</p>
            <p style=\"color:#6b7280;font-size:14px;\">This is a preliminary symptom assessment and not a medical diagnosis.</p>
          </div>
        </div>
        """

        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, contact["email"], msg.as_string())

        return True
    except Exception as exc:
        print(f"Email failed for {contact.get('email')}: {exc}")
        return False


def send_emergency_sms(contact: Dict[str, Any], patient_name: str, urgency_reason: str) -> bool:
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_PHONE_NUMBER")

    if not all([account_sid, auth_token, from_number, contact.get("phone")]):
        return False

    try:
        from twilio.rest import Client as TwilioClient

        client = TwilioClient(account_sid, auth_token)
        message = (
            "URGENT - AgeWell Alert\n"
            f"{patient_name} may need immediate attention.\n"
            f"Reason: {urgency_reason}\n"
            "Please check on them or call emergency services."
        )

        client.messages.create(body=message, from_=from_number, to=contact["phone"])
        return True
    except Exception as exc:
        print(f"SMS failed for {contact.get('phone')}: {exc}")
        return False


def _insert_in_app_alerts(patient_id: str, urgency_level: str, urgency_reason: str, contacts: List[Dict[str, Any]]) -> bool:
    client = _get_client()
    severity = "critical" if urgency_level == "GO_NOW" else "high"
    title = f"{'URGENT' if urgency_level == 'GO_NOW' else 'Important'}: Symptom Alert"

    target_user_ids = [patient_id]
    target_user_ids.extend([c.get("id") for c in contacts if c.get("id")])

    inserted = False
    for target_id in list(dict.fromkeys(target_user_ids)):
        try:
            client.table("alerts").insert(
                {
                    "user_id": target_id,
                    "alert_type": "health",
                    "severity": severity,
                    "title": title,
                    "message": urgency_reason,
                    "acknowledged": False,
                    "created_at": datetime.utcnow().isoformat(),
                }
            ).execute()
            inserted = True
        except Exception as exc:
            print(f"In-app alert insert failed for {target_id}: {exc}")

    return inserted


def trigger_emergency_alerts(
    patient_id: str,
    patient_name: str,
    session_id: str,
    urgency_level: str,
    urgency_reason: str,
    report_summary: str,
) -> Dict[str, Any]:
    if urgency_level not in ("GO_NOW", "CONSULT_SOON"):
        return {"sent": False, "reason": "Urgency level does not require alert"}

    contacts = get_family_contacts(patient_id)
    channels_used: List[str] = []
    recipients_notified: List[Dict[str, Any]] = []

    for contact in contacts:
        notified_via: List[str] = []

        if send_emergency_email(contact, patient_name, urgency_reason, session_id):
            notified_via.append("email")
            if "email" not in channels_used:
                channels_used.append("email")

        if urgency_level == "GO_NOW" and send_emergency_sms(contact, patient_name, urgency_reason):
            notified_via.append("sms")
            if "sms" not in channels_used:
                channels_used.append("sms")

        recipients_notified.append(
            {
                "id": contact.get("id"),
                "name": contact.get("name", "Caregiver"),
                "email": contact.get("email"),
                "phone": contact.get("phone"),
                "relation": contact.get("relation", "Family Member"),
                "channels": notified_via,
            }
        )

    if _insert_in_app_alerts(patient_id, urgency_level, urgency_reason, contacts):
        channels_used.append("in_app")

    alert_message = f"{urgency_level}: {urgency_reason}. Summary: {report_summary}"

    try:
        _get_client().table(ALERTS_TABLE).insert(
            {
                "session_id": session_id,
                "patient_id": patient_id,
                "alert_type": urgency_level,
                "channels_notified": channels_used,
                "recipients": recipients_notified,
                "alert_message": alert_message,
            }
        ).execute()
    except Exception as exc:
        print(f"Diagnosis alert log insert failed: {exc}")

    try:
        _get_client().table("diagnosis_sessions").update({"alert_sent": True}).eq("id", session_id).execute()
    except Exception as exc:
        print(f"Failed to mark diagnosis session as alert_sent: {exc}")

    return {
        "sent": len(channels_used) > 0,
        "channels": channels_used,
        "recipients_count": len(recipients_notified),
    }
