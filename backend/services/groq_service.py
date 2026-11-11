import json
import logging
import os
import re
from typing import Dict, List
from .tts import generate_question_with_audio

try:
    from groq import Groq
except Exception:  # pragma: no cover - optional runtime dependency in dev
    Groq = None

logger = logging.getLogger(__name__)

# Groq retires models without notice (llama-3.3-70b-versatile did): override with GROQ_MODEL, no redeploy of code.
MODEL = os.getenv("GROQ_MODEL", "").strip() or "openai/gpt-oss-120b"
DEVANAGARI = re.compile(r"[\u0900-\u097F]")


def language_for(text: str) -> str:
    """'hi' when the patient wrote in Devanagari, else 'en'. Questions and TTS follow the complaint language."""
    return "hi" if DEVANAGARI.search(text or "") else "en"


def _lang_rule(lang: str) -> str:
    return "Write every patient-facing sentence in simple Hindi (Devanagari script)." if lang == "hi" else ""


def _chat(client, prompt: str, max_tokens: int, temperature: float) -> str:
    """One JSON-mode completion. gpt-oss spends tokens on reasoning, so keep it low and leave headroom."""
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=temperature,
        response_format={"type": "json_object"},
        reasoning_effort="low",
    )
    return (response.choices[0].message.content or "").strip()


def _get_client(api_key: str = ""):
    resolved_key = (api_key or "").strip() or os.getenv("GROQ_API_KEY", "").strip()
    if not resolved_key:
        logger.warning("Groq api_key is empty after resolution.")
        return None
    if Groq is None:
        logger.warning("'groq' module is not installed or import failed.")
        return None
    return Groq(api_key=resolved_key, timeout=20, max_retries=1)


def _parse_json_response(text: str, fallback: Dict) -> Dict:
    if not text:
        return fallback

    cleaned = text.strip().replace("```json", "").replace("```", "").strip()
    
    start_idx = cleaned.find('{')
    end_idx = cleaned.rfind('}')
    if start_idx != -1 and end_idx != -1 and end_idx >= start_idx:
        cleaned = cleaned[start_idx:end_idx + 1]

    try:
        return json.loads(cleaned)
    except Exception as e:
        logger.error("Groq JSON parse error: %s", type(e).__name__)
        return fallback


def _normalize_question(text: str) -> str:
    return " ".join((text or "").strip().lower().split())


def _complaint_focus_phrase(raw_complaint: str) -> str:
    symptoms = _simple_symptom_extract(raw_complaint)
    if symptoms:
        return symptoms[0]

    words = [w.strip(".,!?") for w in (raw_complaint or "").split() if w.strip(".,!?")]
    return " ".join(words[:5]).lower() or "your symptoms"


def _next_dynamic_question(complaint: str, qa_pairs: List[Dict]) -> Dict:
    """Non-hardcoded fallback that still adapts to complaint text."""
    if len(qa_pairs) >= 8:
        return {"next_question": None, "done": True}

    asked = {
        _normalize_question(pair.get("question", ""))
        for pair in (qa_pairs or [])
        if _normalize_question(pair.get("question", ""))
    }

    focus = _complaint_focus_phrase(complaint)
    probes = [
        "क्या आपकी तकलीफ़ आज पहले से ज़्यादा है?",
        "क्या यह तकलीफ़ अचानक शुरू हुई थी?",
        "क्या यह तकलीफ़ बढ़ती जा रही है?",
        "क्या इस तकलीफ़ से आपके रोज़ के काम मुश्किल हो रहे हैं?",
        "क्या आपको घर पर अकेले रहना सुरक्षित नहीं लग रहा?",
    ] if language_for(complaint) == "hi" else [
        f"Is your {focus} more severe than earlier today?",
        f"Did your {focus} begin suddenly?",
        f"Has your {focus} lasted most of the day?",
        f"Is your {focus} getting worse over time?",
        f"Is your {focus} affecting your normal daily activities?",
        f"Do you feel unsafe staying at home with {focus}?",
        f"Would you like urgent medical help for {focus}?",
    ]

    for question in probes:
        if _normalize_question(question) not in asked:
            return {"next_question": question, "done": False}

    return {"next_question": None, "done": True}


def _simple_symptom_extract(raw_complaint: str) -> List[str]:
    keywords = [
        "coughing up blood", "coughing blood", "blood in cough", "blood in sputum",
        "shortness of breath", "chest pain", "sore throat", "runny nose",
        "severe bleeding", "fever", "cough", "headache", "dizziness", "nausea",
        "vomiting", "diarrhea", "fatigue", "weakness", "rash", "swelling", "pain"
    ]
    text = raw_complaint.lower()
    found = []

    for keyword in keywords:
        if keyword not in text:
            continue
        if any(keyword in existing for existing in found):
            continue
        found.append(keyword)

    if not found:
        words = [w.strip(".,!?") for w in text.split() if len(w) > 3]
        found = words[:3]

    return found[:5]


def _fallback_first_question(symptoms: List[str]) -> str:
    if not symptoms:
        return "Are your symptoms getting worse today?"

    primary = symptoms[0]
    if primary in ["coughing up blood", "coughing blood", "blood in cough", "blood in sputum", "severe bleeding"]:
        return "Are you coughing up blood right now?"
    if primary in ["chest pain", "shortness of breath", "dizziness"]:
        return "Are you feeling this symptom right now?"
    if primary in ["fever", "cough", "sore throat"]:
        return "Have you had this symptom for more than two days?"
    return "Did this symptom start suddenly?"


def _first_problem_specific_question(raw_complaint: str) -> str:
    symptoms = _simple_symptom_extract(raw_complaint)
    if symptoms and symptoms[0] in ["coughing up blood", "coughing blood", "blood in cough", "blood in sputum", "severe bleeding"]:
        return _fallback_first_question(symptoms)

    next_item = _next_dynamic_question(raw_complaint, [])
    return next_item.get("next_question") or _fallback_first_question(symptoms)


def extract_symptoms_and_first_question(raw_complaint: str, api_key: str = "") -> Dict:
    """
    Takes raw complaint text, returns extracted symptoms + first yes/no question.
    Returns: { extracted_symptoms: [], next_question: str }
    """
    symptoms = _simple_symptom_extract(raw_complaint)
    fallback = {
        "extracted_symptoms": symptoms,
        "next_question": _first_problem_specific_question(raw_complaint),
        "has_audio": False
    }

    client = _get_client(api_key)
    if client is None:
        return fallback

    lang = language_for(raw_complaint)
    prompt = f"""
You are a medical triage assistant helping elderly patients.
Patient complaint: \"{raw_complaint}\"

Your tasks:
1. Extract the main symptom keywords (max 5, plain English, no jargon).
2. Generate the bot's response message (`next_question`), which MUST include:
   - A short, highly empathetic calming phrase to settle their nerves.
   - A preliminary safe first-aid instruction based on their symptoms (e.g., \"Please sit down and rest\", \"Take a few slow, deep breaths\", \"Sip some water\").
   - ONE simple yes/no follow-up question to better understand the primary symptom.
   Combine these smoothly into one string, perhaps using emojis to separate the advice from the question.
3. Keep language extremely simple — the patient is elderly. {_lang_rule(lang)}

Return ONLY valid JSON, no explanation, no markdown:
{{"extracted_symptoms": ["..."], "next_question": "..."}}
"""

    try:
        content = _chat(client, prompt, 600, 0.3)
        parsed = _parse_json_response(content, fallback)

        extracted = parsed.get("extracted_symptoms", symptoms)
        question = parsed.get("next_question", fallback["next_question"])

        q_text = question or fallback["next_question"]
        
        # Guard: Skip TTS for local fallback text.
        if q_text == fallback["next_question"]:
            return {
                "extracted_symptoms": extracted[:5] if isinstance(extracted, list) else symptoms,
                "next_question": q_text,
                "has_audio": False
            }

        question_with_audio = generate_question_with_audio(q_text, language='hi-IN' if lang == 'hi' else 'en-IN')
        return {
            "extracted_symptoms": extracted[:5] if isinstance(extracted, list) else symptoms,
            "next_question": question_with_audio['text'],
            "audio_base64": question_with_audio.get('audio_base64'),
            "has_audio": question_with_audio['has_audio'],
            "audio_format": question_with_audio.get('audio_format', 'wav')
        }
    except Exception as e:
        logger.error("Groq call failed in extract_symptoms_and_first_question: %s", type(e).__name__)
        return fallback


def get_next_question(complaint: str, qa_pairs: List[Dict], api_key: str = "") -> Dict:
    """
    Given complaint and all Q&A so far, return next question or signal done.
    Returns: { next_question: str | null, done: bool }
    """
    if len(qa_pairs) >= 8:
        return {"next_question": None, "done": True}

    fallback = {
        **_next_dynamic_question(complaint, qa_pairs),
        "has_audio": False
    }

    client = _get_client(api_key)
    if client is None:
        return fallback

    lang = language_for(complaint)
    history = "\n".join([f"Q: {p.get('question', '')} A: {p.get('answer', '')}" for p in qa_pairs])
    prompt = f"""
Patient complaint: \"{complaint}\"
Q&A so far:
{history}

Generate the next most useful yes/no follow-up question to clarify their condition.
The question must be directly tied to the patient's complaint and previous answers.
Do not repeat or paraphrase a previously asked question.
If you have enough information after {len(qa_pairs)} questions, return done.
Keep language very simple. One question only. {_lang_rule(lang)}

Return ONLY valid JSON:
{{"next_question": "...", "done": false}}
OR if enough info:
{{"next_question": null, "done": true}}
"""

    try:
        content = _chat(client, prompt, 400, 0.3)
        parsed = _parse_json_response(content, fallback)

        done = bool(parsed.get("done", False))
        next_question = (parsed.get("next_question") or "").strip()

        # Guard: If blank, treat as done
        if not next_question:
            return {"next_question": None, "done": True, "has_audio": False}

        # Guard: Deduplicate against history
        norm_next = _normalize_question(next_question)
        for pair in qa_pairs:
            if _normalize_question(pair.get("question", "")) == norm_next:
                return {"next_question": None, "done": True, "has_audio": False}

        if done:
            return {
                "next_question": None,
                "done": True,
                "has_audio": False
            }

        question_with_audio = generate_question_with_audio(next_question, language='hi-IN' if lang == 'hi' else 'en-IN')
        return {
            "next_question": question_with_audio['text'],
            "audio_base64": question_with_audio.get('audio_base64'),
            "has_audio": question_with_audio['has_audio'],
            "audio_format": question_with_audio.get('audio_format', 'wav'),
            "done": False
        }
    except Exception as e:
        logger.error("Groq call failed in get_next_question: %s", type(e).__name__)
        return fallback


def _infer_urgency(complaint: str, qa_pairs: List[Dict], image_observations: str) -> str:
    text = " ".join([
        complaint or "",
        image_observations or "",
        " ".join([f"{p.get('question', '')} {p.get('answer', '')}" for p in qa_pairs])
    ]).lower()

    urgent_terms = [
        "chest pain", "shortness of breath", "faint", "unconscious",
        "severe bleeding", "coughing blood", "coughing up blood", "blood in cough",
        "blood in sputum", "stroke", "can not breathe", "very high fever",
        "सीने में दर्द", "सांस", "साँस", "बेहोश", "खून", "लकवा"
    ]

    consult_terms = [
        "fever", "persistent", "worse", "pain", "dizziness", "vomiting", "swelling",
        "बुखार", "दर्द", "चक्कर", "उल्टी", "सूजन"
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
        "symptom_summary": f"Patient reported: {complaint}. Follow-up answers and any uploaded images should be reviewed by a qualified clinician.",
        "possible_conditions": [
            "Requires clinician review",
            "Symptom cause not determined by this app"
        ],
        "medication_flags": fallback_flags,
        "urgency_level": fallback_urgency,
        "urgency_reason": "Urgency estimated from reported warning symptoms because the AI service was unavailable.",
        "doctor_questions": [
            "What could be causing these symptoms?",
            "Do I need urgent tests or treatment today?",
            "Could any current medicines be related to these symptoms?"
        ],
        "disclaimer": "This summary is for informational purposes only and is not a medical diagnosis. Consult a qualified doctor."
    }

    client = _get_client(api_key)
    if client is None:
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
4. urgency_level: Must be exactly one of: 
   - GO_NOW: Level 1 (High Alert) - Serious condition requiring immediately calling an ambulance/emergency treatment.
   - CONSULT_SOON: Level 2 (Medium Alert) - Patient is unwell or unresponsive; family must be alerted immediately and doctor messaged.
   - ROUTINE: Level 3 (Normal Level) - Routine symptoms, monitor safely and rest.
5. urgency_reason: one sentence explaining the urgency level
6. doctor_questions: 3 questions the patient should ask their doctor
7. disclaimer: always "This summary is for informational purposes only and is not a medical diagnosis. Consult a qualified doctor."

Return ONLY valid JSON matching exactly this schema. No markdown, no explanation.
"""

    try:
        content = _chat(client, prompt, 1600, 0.2)
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
    except Exception as e:
        logger.error("Groq call failed in generate_diagnosis_report: %s", type(e).__name__)
        return fallback
