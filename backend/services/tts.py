"""Text-to-speech via Bhashini (Dhruva inference pipeline). Returns base64 WAV."""
import logging
import os
from typing import Dict, Optional

import requests

logger = logging.getLogger(__name__)

BHASHINI_URL = 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline'
TIMEOUT_SECONDS = float(os.getenv('BHASHINI_TIMEOUT_SECONDS', '8'))


def _api_key() -> str:
    return (os.getenv('BHASHINI_API_KEY') or os.getenv('BHASHINI_INFERNCE') or '').strip()


def text_to_speech(text: str, language: str = 'en-IN') -> Optional[Dict]:
    """Return {'audio_base64', 'audio_format', 'language'} or None on any failure."""
    key = _api_key()
    if not key:
        logger.error('BHASHINI_API_KEY is not set; skipping TTS')
        return None

    payload = {
        'pipelineTasks': [{
            'taskType': 'tts',
            'config': {
                'language': {'sourceLanguage': language.split('-')[0].lower()},  # en-IN -> en
                'gender': 'female',
            },
        }],
        'inputData': {'input': [{'source': text}]},
    }

    try:
        response = requests.post(
            BHASHINI_URL, json=payload, headers={'Authorization': key}, timeout=TIMEOUT_SECONDS
        )
        response.raise_for_status()
        audio = response.json()['pipelineResponse'][0]['audio'][0]['audioContent']
        return {'audio_base64': audio, 'audio_format': 'wav', 'language': language}
    except Exception as exc:  # TTS is optional: the caller falls back to text only
        logger.error('Bhashini TTS failed: %s', type(exc).__name__)
        return None


def generate_question_with_audio(question_text: str, language: str = 'en-IN') -> Dict:
    """Always returns 'text' and 'has_audio'; adds audio fields when TTS succeeds."""
    result = {'text': question_text, 'has_audio': False}
    audio = text_to_speech(question_text, language)
    if audio:
        result.update(audio_base64=audio['audio_base64'], audio_format=audio['audio_format'], has_audio=True)
    return result
