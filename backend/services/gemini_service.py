import io
import json
import os

from PIL import Image

try:
    import google.generativeai as genai
except Exception:  # pragma: no cover - optional runtime dependency in dev
    genai = None


def _clean_json_text(text: str) -> str:
    return (text or "").strip().replace("```json", "").replace("```", "").strip()


def _fallback_observation(image_bytes: bytes):
    size_kb = round(len(image_bytes) / 1024, 1)
    return {
        "observations": f"Image uploaded successfully ({size_kb} KB). A clinician should review this image directly.",
        "flagged_urgent": False
    }


def analyze_medical_image(image_bytes: bytes, api_key: str = "") -> dict:
    """
    Analyzes uploaded medical image or report scan.
    Returns: { observations: str, flagged_urgent: bool }
    """
    if not image_bytes:
        return {
            "observations": "No image data was provided.",
            "flagged_urgent": False
        }

    # Validate image bytes early to match existing image handling reliability
    try:
        image = Image.open(io.BytesIO(image_bytes))
    except Exception:
        return {
            "observations": "The uploaded file could not be read as an image.",
            "flagged_urgent": False
        }

    resolved_key = (api_key or "").strip() or os.getenv("GEMINI_API_KEY", "").strip()
    if not resolved_key or genai is None:
        return _fallback_observation(image_bytes)

    try:
        genai.configure(api_key=resolved_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        prompt = """
You are analyzing a medical image or report scan uploaded by an elderly patient for preliminary intake only.
Describe what you observe in plain English. Note visible symptoms, lab values, or any findings.
Do NOT diagnose. Flag anything that appears abnormal or potentially urgent.
Return ONLY valid JSON:
{"observations": "...", "flagged_urgent": false}
"""
        response = model.generate_content([prompt, image])
        text = _clean_json_text(getattr(response, "text", ""))

        parsed = json.loads(text)
        return {
            "observations": parsed.get("observations", "No clear observations generated."),
            "flagged_urgent": bool(parsed.get("flagged_urgent", False))
        }
    except Exception:
        return _fallback_observation(image_bytes)
