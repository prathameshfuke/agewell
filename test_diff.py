import requests
import json
import uuid

BASE_URL = "http://127.0.0.1:5001/api/diagnosis"
USER_ID = "1e0d1d57-fb75-4758-90bb-d429f5d9327c"

def test_case(name, complaint):
    print(f"\n{'='*50}\nTEST CASE: {name}\n{'='*50}")
    print(f"Patient says: '{complaint}'")

    res = requests.post(f"{BASE_URL}/start", json={"patient_id": USER_ID, "raw_complaint": complaint})

    if res.status_code == 429:
        print("Daily Limit Reached!")
        return

    data = res.json()
    if 'error' in data:
       print("ERROR:", data['error'])
       return
       
    print(f"\n> AI FIRST RESPONSE (Calm Down + First Aid + Question):")
    print(f"  {data.get('next_question')}")
    
    session_id = data.get('session_id')

    requests.post(f"{BASE_URL}/answer", json={"session_id": session_id, "current_question": data.get('next_question'), "answer": "yes"})

    print(f"\n> AI GENERATED MEDICAL REPORT:")
    rep = requests.post(f"{BASE_URL}/generate-report", json={"session_id": session_id, "medications": ["None"]})
    
    rep_data = rep.json()
    report = rep_data.get('report', {})

    print(f"  Urgency Level:   {rep_data.get('urgency_level')}")
    print(f"  Urgency Reason:  {report.get('urgency_reason')}")
    print(f"  Summary:         {report.get('symptom_summary')}")
    print(f"  Alert Triggered: {rep_data.get('alert_sent')}")

test_case("ROUTINE (Level 3)", "I have a bit of a runny nose and a small headache since yesterday.")
test_case("MEDIUM ALERT (Level 2)", "My stomach mildly hurts but I have been throwing up nonstop and cant keep water down.")
test_case("HIGH ALERT (Level 1)", "My chest feels like an elephant is sitting on it, and the pain goes to my jaw. I can barely breathe.")
