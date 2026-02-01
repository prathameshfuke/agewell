import re
from typing import Dict, List
from datetime import datetime, timedelta
from PIL import Image
import os

# Try to import pytesseract, but make it optional
try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    print("WARNING: pytesseract not available. OCR will use mock data.")

class PrescriptionOCRService:
    """
    OCR service for processing prescription images and extracting medication information
    """
    
    # Common medication patterns
    MEDICATION_PATTERNS = {
        'name': r'(?:Tab\.|Tablet|Cap\.|Capsule|Syrup|Suspension|Injection)\s+([A-Za-z\s]+?)(?:\s+\d+|\s+mg|\s+ml|$)',
        'dosage': r'(\d+(?:\.\d+)?)\s*(mg|ml|mcg|g|units?)',
        'frequency': r'(?:once|twice|thrice|\d+\s*times?)\s*(?:daily|a day|per day|daily)',
        'timing': r'(?:morning|afternoon|evening|night|before|after)\s*(?:meal|food|breakfast|lunch|dinner)?',
        'duration': r'(?:for|continue)\s*(\d+)\s*(days?|weeks?|months?)'
    }
    
    def __init__(self):
        self.tesseract_available = TESSERACT_AVAILABLE
        # Set tesseract path if needed (Windows)
        if self.tesseract_available and os.name == 'nt':
            # Common installation paths
            possible_paths = [
                r'D:\AGEWELL\Tesseract\tesseract.exe',  # Local installation
                r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
            ]
            for path in possible_paths:
                if os.path.exists(path):
                    pytesseract.pytesseract.tesseract_cmd = path
                    print(f"Tesseract found at: {path}")
                    break
            else:
                print("WARNING: Tesseract not found in common paths. OCR may not work.")
    
    def process_prescription_image(self, image_path: str) -> Dict:
        """
        Process prescription image and extract text using OCR
        """
        try:
            # If Tesseract not available, return mock data for testing
            if not self.tesseract_available:
                mock_data = {
                    'medications': [
                        {
                            'name': 'Lisinopril',
                            'dosage': '10 mg',
                            'type': 'pill',
                            'frequency': 'once daily',
                            'timing': 'morning',
                            'duration': '',
                            'special_instructions': 'Take with food',
                            'schedule_times': ['08:00']
                        },
                        {
                            'name': 'Metformin',
                            'dosage': '500 mg',
                            'type': 'pill',
                            'frequency': 'twice daily',
                            'timing': 'morning after meal',
                            'duration': '',
                            'special_instructions': 'Take after meals',
                            'schedule_times': ['08:00', '20:00']
                        }
                    ],
                    'total_count': 2,
                    'parsed_at': datetime.utcnow().isoformat()
                }
                return {
                    'success': True,
                    'ocr_text': '[Mock OCR - Tesseract not available]',
                    'parsed_data': mock_data,
                    'medications_found': 2
                }
            
            # Open and preprocess image
            image = Image.open(image_path)
            
            # Convert to grayscale for better OCR
            image = image.convert('L')
            
            # Extract text using Tesseract
            ocr_text = pytesseract.image_to_string(image)
            
            # Parse the extracted text
            parsed_data = self.parse_prescription_text(ocr_text)
            
            return {
                'success': True,
                'ocr_text': ocr_text,
                'parsed_data': parsed_data,
                'medications_found': len(parsed_data.get('medications', []))
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'ocr_text': None,
                'parsed_data': None
            }
    
    def parse_prescription_text(self, text: str) -> Dict:
        """
        Parse OCR text to extract structured medication information
        """
        medications = []
        lines = text.split('\n')
        
        current_med = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if line contains a medication name
            if self._is_medication_line(line):
                # Save previous medication if exists
                if current_med and current_med.get('name'):
                    medications.append(current_med)
                
                # Start new medication
                current_med = self._extract_medication_info(line)
            
            elif current_med:
                # Try to extract additional info from current line
                self._update_medication_info(current_med, line)
        
        # Add last medication
        if current_med and current_med.get('name'):
            medications.append(current_med)
        
        # Assign device slots
        medications = self._assign_device_slots(medications)
        
        return {
            'medications': medications,
            'total_count': len(medications),
            'parsed_at': datetime.utcnow().isoformat()
        }
    
    def _is_medication_line(self, line: str) -> bool:
        """
        Check if line likely contains a medication name
        """
        medication_keywords = ['tab', 'tablet', 'cap', 'capsule', 'syrup', 
                              'suspension', 'injection', 'drops', 'cream', 'ointment']
        
        line_lower = line.lower()
        return any(keyword in line_lower for keyword in medication_keywords)
    
    def _extract_medication_info(self, line: str) -> Dict:
        """
        Extract medication information from a line
        """
        med_info = {
            'name': '',
            'dosage': '',
            'type': 'pill',
            'frequency': '',
            'timing': '',
            'duration': '',
            'special_instructions': '',
            'schedule_times': []
        }
        
        # Extract medication name
        name_match = re.search(self.MEDICATION_PATTERNS['name'], line, re.IGNORECASE)
        if name_match:
            med_info['name'] = name_match.group(1).strip()
        else:
            # Fallback: take first few words
            words = line.split()
            med_info['name'] = ' '.join(words[:3])
        
        # Determine medication type
        line_lower = line.lower()
        if any(word in line_lower for word in ['syrup', 'suspension', 'drops', 'liquid']):
            med_info['type'] = 'liquid'
        
        # Extract dosage
        dosage_match = re.search(self.MEDICATION_PATTERNS['dosage'], line, re.IGNORECASE)
        if dosage_match:
            med_info['dosage'] = f"{dosage_match.group(1)} {dosage_match.group(2)}"
        
        # Extract frequency
        freq_match = re.search(self.MEDICATION_PATTERNS['frequency'], line, re.IGNORECASE)
        if freq_match:
            med_info['frequency'] = freq_match.group(0)
        
        # Extract timing
        timing_match = re.search(self.MEDICATION_PATTERNS['timing'], line, re.IGNORECASE)
        if timing_match:
            med_info['timing'] = timing_match.group(0)
        
        # Extract duration
        duration_match = re.search(self.MEDICATION_PATTERNS['duration'], line, re.IGNORECASE)
        if duration_match:
            med_info['duration'] = f"{duration_match.group(1)} {duration_match.group(2)}"
        
        return med_info
    
    def _update_medication_info(self, med_info: Dict, line: str):
        """
        Update medication info with additional details from subsequent lines
        """
        # Check for frequency if not already found
        if not med_info['frequency']:
            freq_match = re.search(self.MEDICATION_PATTERNS['frequency'], line, re.IGNORECASE)
            if freq_match:
                med_info['frequency'] = freq_match.group(0)
        
        # Check for timing
        if not med_info['timing']:
            timing_match = re.search(self.MEDICATION_PATTERNS['timing'], line, re.IGNORECASE)
            if timing_match:
                med_info['timing'] = timing_match.group(0)
        
        # Check for duration
        if not med_info['duration']:
            duration_match = re.search(self.MEDICATION_PATTERNS['duration'], line, re.IGNORECASE)
            if duration_match:
                med_info['duration'] = f"{duration_match.group(1)} {duration_match.group(2)}"
        
        # Add to special instructions if contains relevant keywords
        instruction_keywords = ['before', 'after', 'with', 'empty stomach', 'food']
        if any(keyword in line.lower() for keyword in instruction_keywords):
            if med_info['special_instructions']:
                med_info['special_instructions'] += '; ' + line
            else:
                med_info['special_instructions'] = line
    
    def _assign_device_slots(self, medications: List[Dict]) -> List[Dict]:
        """
        Assign device slots to medications
        Pills get slots 1-7, liquids get slots 8-10
        """
        pill_slot = 1
        liquid_slot = 8
        
        for med in medications:
            if med['type'] == 'pill' and pill_slot <= 7:
                med['slot_number'] = pill_slot
                pill_slot += 1
            elif med['type'] == 'liquid' and liquid_slot <= 10:
                med['slot_number'] = liquid_slot
                liquid_slot += 1
            else:
                med['slot_number'] = None  # No slot available
            
            # Generate schedule times based on frequency
            med['schedule_times'] = self._generate_schedule_times(med['frequency'], med['timing'])
        
        return medications
    
    def _generate_schedule_times(self, frequency: str, timing: str) -> List[str]:
        """
        Generate schedule times based on frequency and timing
        """
        schedule = []
        
        if not frequency:
            return ['08:00']  # Default morning time
        
        freq_lower = frequency.lower()
        timing_lower = timing.lower() if timing else ''
        
        # Parse frequency
        if 'once' in freq_lower or '1' in freq_lower:
            if 'morning' in timing_lower:
                schedule = ['08:00']
            elif 'evening' in timing_lower or 'night' in timing_lower:
                schedule = ['20:00']
            else:
                schedule = ['08:00']
        
        elif 'twice' in freq_lower or '2' in freq_lower:
            schedule = ['08:00', '20:00']
        
        elif 'thrice' in freq_lower or '3' in freq_lower:
            schedule = ['08:00', '14:00', '20:00']
        
        elif '4' in freq_lower:
            schedule = ['08:00', '12:00', '16:00', '20:00']
        
        else:
            schedule = ['08:00']  # Default
        
        return schedule
    
    def create_medications_from_prescription(self, user_id: int, parsed_data: Dict, db) -> List:
        """
        Create medication records from parsed prescription data
        """
        from models import Medication
        
        medications = []
        
        for med_data in parsed_data.get('medications', []):
            medication = Medication(
                user_id=user_id,
                name=med_data.get('name', 'Unknown Medication'),
                dosage=med_data.get('dosage', ''),
                frequency=med_data.get('frequency', ''),
                type=med_data.get('type', 'pill'),
                slot_number=med_data.get('slot_number'),
                schedule_times=med_data.get('schedule_times', []),
                special_instructions=med_data.get('special_instructions', ''),
                start_date=datetime.utcnow().date(),
                active=True
            )
            
            db.session.add(medication)
            medications.append(medication)
        
        db.session.commit()
        
        return medications
