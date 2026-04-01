import os
import requests
import base64
from typing import Optional, Dict
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Get API key from environment
SARVAM_API_KEY = os.getenv('SARVAM_API_KEY')
SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech'


def text_to_speech(text: str, language: str = 'en-IN') -> Optional[Dict]:
    """
    Convert text to speech using Sarvam AI
    
    Args:
        text (str): Text to convert to speech
        language (str): Language code (en-IN, hi-IN, ta-IN, etc.)
    
    Returns:
        dict: Contains 'audio_base64', 'audio_format' if successful, None otherwise
    """
    if not SARVAM_API_KEY:
        logger.error("SARVAM_API_KEY not found in environment variables")
        return None
    
    try:
        headers = {
            'api-subscription-key': SARVAM_API_KEY,
            'Content-Type': 'application/json'
        }
        
        payload = {
            "inputs": [text],  # Sarvam expects array of strings
            "target_language_code": language,
            "speaker": "manisha",  # Female voice (options: meera, arvind)
            "pitch": 0,
            "pace": 1.0,
            "loudness": 1.5,
            "speech_sample_rate": 8000,
            "enable_preprocessing": True,
            "model": "bulbul:v2"
        }
        
        logger.info(f"Calling Sarvam TTS API for text: {text[:50]}...")
        
        response = requests.post(
            SARVAM_TTS_URL,
            json=payload,
            headers=headers,
            timeout=15  # 15 second timeout
        )
        
        if response.status_code == 200:
            # Sarvam returns audio as base64 in JSON response
            response_data = response.json()
            
            # Check if response contains audio
            if 'audios' in response_data and len(response_data['audios']) > 0:
                audio_base64 = response_data['audios'][0]
                
                logger.info("Successfully generated audio from Sarvam TTS")
                
                return {
                    'audio_base64': audio_base64,
                    'audio_format': 'wav',
                    'language': language
                }
            else:
                logger.error("No audio in Sarvam response")
                return None
        else:
            logger.error(f"Sarvam TTS Error: {response.status_code} - {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        logger.error("Sarvam TTS request timed out")
        return None
    except Exception as e:
        logger.error(f"Sarvam TTS Exception: {str(e)}")
        return None


def generate_question_with_audio(question_text: str, language: str = 'en-IN') -> Dict:
    """
    Generate question with optional audio
    
    Args:
        question_text (str): The question to convert
        language (str): Language code
    
    Returns:
        dict: Always contains 'text' and 'has_audio', optionally 'audio_base64'
    """
    result = {
        'text': question_text,
        'has_audio': False
    }
    
    # Try to generate audio
    audio_data = text_to_speech(question_text, language)
    
    if audio_data:
        result['audio_base64'] = audio_data['audio_base64']
        result['audio_format'] = audio_data['audio_format']
        result['has_audio'] = True
        logger.info("Question generated with audio successfully")
    else:
        logger.warning("Question generated without audio (TTS failed)")
    
    return result