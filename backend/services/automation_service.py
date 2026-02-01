from models import db, SmartDevice, ElderProfile, Alert
from datetime import datetime

class AutomationService:
    @staticmethod
    def evaluate_environment(user_id):
        """
        Evaluate user's profile conditions against current time/status
        and trigger device changes if necessary.
        """
        profile = ElderProfile.query.filter_by(user_id=user_id).first()
        if not profile:
            return []

        triggered_actions = []
        now = datetime.now()
        current_hour = now.hour
        
        # 1. Arthritis Logic: Morning/Evening Warmth
        # If user has arthritis and it's morning (6-9 AM) or evening (8-11 PM)
        if "Arthritis" in profile.medical_conditions:
            is_morning = 6 <= current_hour <= 9
            is_evening = 20 <= current_hour <= 23
            
            if is_morning or is_evening:
                # Set warmer temp
                ac = SmartDevice.query.filter_by(
                    user_id=user_id, device_type='ac', room='Living Room'
                ).first()
                
                if ac and ac.current_setting != "26°C":
                    ac.is_active = True
                    ac.current_setting = "26°C"
                    ac.last_automation_trigger = "Arthritis Comfort Mode (Warmth)"
                    ac.updated_at = datetime.utcnow()
                    triggered_actions.append(f"Adjusted AC to 26°C for Arthritis comfort")

        # 2. Respiratory Logic: Air Quality
        # If user has COPD/Asthma, ensure Purifier is ON
        if any(c in ["COPD", "Asthma"] for c in profile.medical_conditions):
            purifier = SmartDevice.query.filter_by(
                user_id=user_id, device_type='purifier'
            ).first()
            
            if purifier and not purifier.is_active:
                purifier.is_active = True
                purifier.current_setting = "Auto"
                purifier.last_automation_trigger = "Respiratory Care (Air Quality)"
                purifier.updated_at = datetime.utcnow()
                triggered_actions.append("Activated Air Purifier for Respiratory Care")

        # 3. Routine Logic: Bedtime
        # If passed bed_time, ensure lights are off/dimmed and doors locked
        # (Simplified logic parsing "HH:MM")
        try:
            bed_hour = int(profile.bed_time.split(':')[0])
            if current_hour >= bed_hour or current_hour < 5:
                # Locks
                lock = SmartDevice.query.filter_by(
                    user_id=user_id, device_type='lock'
                ).first()
                if lock and lock.current_setting != "Locked":
                    lock.current_setting = "Locked"
                    lock.last_automation_trigger = "Night Routine Security"
                    triggered_actions.append("Locked Front Door (Night Routine)")
        except:
            pass

        if triggered_actions:
            db.session.commit()
            
        return triggered_actions

    @staticmethod
    def trigger_emergency_protocol(user_id):
        """
        Triggered by SOS or Critical Fall.
        Unlocks doors, turns on all lights to max.
        """
        devices = SmartDevice.query.filter_by(user_id=user_id).all()
        actions = []
        
        for d in devices:
            if d.device_type == 'lock':
                d.current_setting = 'Unlocked'
                d.last_automation_trigger = 'EMERGENCY PROTOCOL'
                actions.append(f"Unlocked {d.device_name}")
            elif d.device_type == 'light':
                d.is_active = True
                d.current_setting = '100% Brightness'
                d.last_automation_trigger = 'EMERGENCY PROTOCOL'
                actions.append(f"Turned on {d.device_name}")
        
        db.session.commit()
        return actions

    @staticmethod
    def simulate_event(user_id, event_type):
        """
        Force specific automation scenarios for Demo Mode.
        Events: 'fall', 'cold', 'morning'
        """
        actions = []
        if event_type == 'fall':
            return AutomationService.trigger_emergency_protocol(user_id)
            
        elif event_type == 'cold':
            # Force Arthritis Warmth
            ac = SmartDevice.query.filter_by(user_id=user_id, device_type='ac').first()
            if ac:
                ac.is_active = True
                ac.current_setting = "26°C"
                ac.last_automation_trigger = "Simulated: Arthritis Comfort (Cold)"
                ac.updated_at = datetime.utcnow()
                actions.append("Adjusted AC to 26°C (Arthritis Simulation)")
                
        elif event_type == 'morning':
            # Force Morning Routine
            lights = SmartDevice.query.filter_by(user_id=user_id, device_type='light').all()
            for l in lights:
                l.is_active = True
                l.current_setting = "Cool White"
                l.last_automation_trigger = "Simulated: Morning Wake Up"
                actions.append(f"Turned onto Cool White {l.device_name}")
                
            ac = SmartDevice.query.filter_by(user_id=user_id, device_type='ac').first()
            if ac:
                ac.is_active = True
                ac.current_setting = "22°C"
                ac.last_automation_trigger = "Simulated: Morning Temp"
                actions.append("Set AC to 22°C")

        if actions:
            db.session.commit()
            
        return actions
