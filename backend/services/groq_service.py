import json
import os
from typing import Dict, List

try:
    from groq import Groq
except Exception:  # pragma: no cover - optional runtime dependency in dev
    Groq = None

MODEL = "llama-3.3-70b-versatile"


def _get_client(api_key: str = ""):
    resolved_key = (api_key or "").strip() or os.getenv("GROQ_API_KEY", "").strip()
    if not resolved_key or Groq is None:
        return None
    return Groq(api_key=resolved_key)


def _parse_json_response(text: str, fallback: Dict) -> Dict:
    if not text:
        return fallback

    cleaned = text.strip().replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except Exception:
        return fallback


def _simple_symptom_extract(raw_complaint: str) -> List[str]:
    keywords = [
        "fever", "cough", "chest pain", "headache", "dizziness", "nausea",
        "vomiting", "diarrhea", "fatigue", "weakness", "shortness of breath",
        "rash", "swelling", "pain", "sore throat", "runny nose"
    ]
    text = raw_complaint.lower()
    found = [k for k in keywords if k in text]

    if not found:
        words = [w.strip(".,!?") for w in text.split() if len(w) > 3]
        found = words[:3]

    return found[:5]


def _fallback_first_question(symptoms: List[str]) -> str:
    if not symptoms:
        return "Are your symptoms getting worse today?"

    primary = symptoms[0]
    if primary in ["chest pain", "shortness of breath", "dizziness"]:
        return "Are you feeling this symptom right now?"
    if primary in ["fever", "cough", "sore throat"]:
        return "Have you had this symptom for more than two days?"
    return "Did this symptom start suddenly?"


def extract_symptoms_and_first_question(raw_complaint: str, api_key: str = "") -> Dict:
    """
    Takes raw complaint text, returns extracted symptoms + first yes/no question.
    Returns: { extracted_symptoms: [], next_question: str }
    """
    symptoms = _simple_symptom_extract(raw_complaint)
    fallback = {
        "extracted_symptoms": symptoms,
        "next_question": _fallback_first_question(symptoms)
    }

    client = _get_client(api_key)
    if client is None:
        return fallback

    prompt = f"""
You are a medical intake assistant helping elderly patients.
Patient complaint: \"{raw_complaint}\"

Your tasks:
1. Extract the main symptom keywords (max 5, plain English, no jargon)
2. Generate ONE simple yes/no follow-up question to better understand the primary symptom
3. Keep language extremely simple — the patient is elderly

Return ONLY valid JSON, no explanation, no markdown:
{{"extracted_symptoms": ["..."], "next_question": "..."}}
"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.3
        )
        content = response.choices[0].message.content.strip()
        parsed = _parse_json_response(content, fallback)

        extracted = parsed.get("extracted_symptoms", symptoms)
        question = parsed.get("next_question", fallback["next_question"])

        return {
            "extracted_symptoms": extracted[:5] if isinstance(extracted, list) else symptoms,
            "next_question": question or fallback["next_question"]
        }
    except Exception:
        return fallback


def get_next_question(complaint: str, qa_pairs: List[Dict], api_key: str = "") -> Dict:
    """
    Given complaint and all Q&A so far, return next question or signal done.
    Returns: { next_question: str | null, done: bool }
    """
    if len(qa_pairs) >= 8:
        return {"next_question": None, "done": True}

    client = _get_client(api_key)
    if client is None:
        # Deterministic fallback question tree to keep flow working without API key
        fallback_questions = [
            "Do you feel this symptom right now?",
            "Did it start suddenly?",
            "Has it lasted more than two days?",
            "Is it worse than yesterday?",
            "Do you feel weak or very tired?",
            "Do you have trouble breathing?",
            "Do you feel chest discomfort?",
            "Do you want to speak to a doctor soon?"
        ]
        idx = min(len(qa_pairs), len(fallback_questions) - 1)
        if len(qa_pairs) >= 6:
            return {"next_question": None, "done": True}
        return {"next_question": fallback_questions[idx], "done": False}

    history = "\n".join([f"Q: {p.get('question', '')} A: {p.get('answer', '')}" for p in qa_pairs])
    prompt = f"""
Patient complaint: \"{complaint}\"
Q&A so far:
{history}

Generate the next most useful yes/no follow-up question to clarify their condition.
If you have enough information after {len(qa_pairs)} questions, return done.
Keep language very simple. One question only.

Return ONLY valid JSON:
{{"next_question": "...", "done": false}}
OR if enough info:
{{"next_question": null, "done": true}}
"""

    fallback = {"next_question": "Do you feel worse right now?", "done": False}

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.3
        )
        content = response.choices[0].message.content.strip()
        parsed = _parse_json_response(content, fallback)

        done = bool(parsed.get("done", False))
        next_question = parsed.get("next_question")
        if done:
            return {"next_question": None, "done": True}

        return {
            "next_question": next_question or fallback["next_question"],
            "done": False
        }
    except Exception:
        return fallback


def _infer_urgency(complaint: str, qa_pairs: List[Dict], image_observations: str) -> str:
    text = " ".join([
        complaint or "",
        image_observations or "",
        " ".join([f"{p.get('question', '')} {p.get('answer', '')}" for p in qa_pairs])
    ]).lower()

    urgent_terms = [
        "chest pain", "shortness of breath", "faint", "unconscious",
        "severe bleeding", "stroke", "can not breathe", "very high fever"
    ]

    consult_terms = [
        "fever", "persistent", "worse", "pain", "dizziness", "vomiting", "swelling"
    ]

    if any(term in text for term in urgent_terms):
        return "GO_NOW"
    if any(term in text for term in consult_terms):
        return "CONSULT_SOON"
    return "ROUTINE"


def _medication_flags_from_text(text: str, medications: List[str]) -> List[str]:
    if not medications:
        return []

    flags = []
    low_text = text.lower()
    side_effect_markers = {
        "dizziness": "Possible dizziness side effect",
        "nausea": "Possible nausea side effect",
        "fatigue": "Possible fatigue side effect",
        "rash": "Possible allergic skin reaction"
    }

    for marker, msg in side_effect_markers.items():
        if marker in low_text:
            flags.append(msg)

    # keep concise and unique
    uniq = []
    for f in flags:
        if f not in uniq:
            uniq.append(f)
    return uniq[:3]


def generate_diagnosis_report(
    complaint: str,
    qa_pairs: List[Dict],
    image_observations: str,
    medications: List[str],
    api_key: str = "",
) -> Dict:
    """
    Generates the final preliminary report.
    Returns structured report JSON.
    """
    med_list = ", ".join(medications) if medications else "None recorded"
    history = "\n".join([f"Q: {p.get('question', '')} A: {p.get('answer', '')}" for p in qa_pairs])
    img_section = f"Image/report observations: {image_observations}" if image_observations else ""

    fallback_urgency = _infer_urgency(complaint, qa_pairs, image_observations)
    base_text = " ".join([complaint or "", image_observations or "", history])
    fallback_flags = _medication_flags_from_text(base_text, medications)

    fallback = {
        "symptom_summary": "The patient reported symptoms that need medical review.",
        "possible_conditions": [
            "Condition to discuss with your doctor",
            "Another possible explanation to discuss"
        ],
        "medication_flags": fallback_flags,
        "urgency_level": fallback_urgency,
        "urgency_reason": "Based on reported symptoms and answers, a doctor should guide next steps.",
        "doctor_questions": [
            "What tests should I do now?",
            "Could this be related to my current medicines?",
            "What warning signs mean I should seek urgent care?"
        ],
        "disclaimer": "This summary is for informational purposes only and is not a medical diagnosis. Consult a qualified doctor."
    }

    client = _get_client(api_key)
    if client is None:
        fallback["symptom_summary"] = (
            "The patient described symptoms through intake questions. "
            "Please review this summary with a qualified doctor to confirm the cause and treatment plan."
        )
        return fallback

    prompt = f"""
You are generating a preliminary symptom summary for a doctor's review. This is NOT a diagnosis.

Patient complaint: \"{complaint}\"
Symptom Q&A:
{history}
{img_section}
Current medications: {med_list}

Generate a structured medical intake summary with:
1. symptom_summary: 2-3 sentence plain English summary of what the patient described
2. possible_conditions: list of 2-3 conditions to discuss with doctor (with disclaimer these are not diagnoses)
3. medication_flags: list any symptoms that could be side effects of listed medications (empty list if none)
4. urgency_level: one of ROUTINE / CONSULT_SOON / GO_NOW
5. urgency_reason: one sentence explaining the urgency level
6. doctor_questions: 3 questions the patient should ask their doctor
7. disclaimer: always \"This summary is for informational purposes only and is not a medical diagnosis. Consult a qualified doctor.\"

Return ONLY valid JSON matching exactly this schema. No markdown, no explanation.
"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.2
        )
        content = response.choices[0].message.content.strip()
        parsed = _parse_json_response(content, fallback)

        parsed.setdefault("disclaimer", fallback["disclaimer"])
        parsed.setdefault("urgency_level", fallback_urgency)
        parsed.setdefault("medication_flags", fallback_flags)
        parsed.setdefault("doctor_questions", fallback["doctor_questions"])
        parsed.setdefault("possible_conditions", fallback["possible_conditions"])
        parsed.setdefault("symptom_summary", fallback["symptom_summary"])
        parsed.setdefault("urgency_reason", fallback["urgency_reason"])

        if parsed.get("urgency_level") not in ["ROUTINE", "CONSULT_SOON", "GO_NOW"]:
            parsed["urgency_level"] = fallback_urgency

        return parsed
    except Exception:
        return fallback
