import os
import requests
from typing import Dict, List
from datetime import datetime

class NotificationService:
    """
    Service for sending notifications via WhatsApp and push notifications
    """
    
    def __init__(self):
        self.whatsapp_api_key = os.getenv('WHATSAPP_API_KEY', '')
        self.whatsapp_api_url = os.getenv('WHATSAPP_API_URL', 'https://api.whatsapp.com/send')
        self.push_notification_key = os.getenv('PUSH_NOTIFICATION_KEY', '')
    
    def send_alert_notification(self, alert: Dict, user_phone: str, caregiver_phone: str = None):
        """
        Send alert notifications to user and caregiver
        """
        notifications_sent = []
        
        # Send to elderly user (gentle, supportive message)
        if user_phone and alert.get('message_elderly'):
            user_notification = self._send_whatsapp(
                phone=user_phone,
                message=alert['message_elderly'],
                priority='normal'
            )
            notifications_sent.append({
                'recipient': 'user',
                'phone': user_phone,
                'success': user_notification.get('success', False)
            })
        
        # Send to caregiver (detailed, actionable message)
        if caregiver_phone and alert.get('message_caregiver'):
            # Add severity indicator for caregiver
            severity_emoji = self._get_severity_emoji(alert.get('severity', 'medium'))
            caregiver_message = f"{severity_emoji} {alert['title']}\n\n{alert['message_caregiver']}"
            
            caregiver_notification = self._send_whatsapp(
                phone=caregiver_phone,
                message=caregiver_message,
                priority='high' if alert.get('severity') in ['high', 'critical'] else 'normal'
            )
            notifications_sent.append({
                'recipient': 'caregiver',
                'phone': caregiver_phone,
                'success': caregiver_notification.get('success', False)
            })
        
        return notifications_sent
    
    def send_medication_reminder(self, user_phone: str, medication_name: str, time: str):
        """
        Send medication reminder to user
        """
        message = f"🔔 Medication Reminder\n\nIt's time for your medicine: {medication_name}\n\nPlease take it now and press 'Taken' in the app."
        
        return self._send_whatsapp(
            phone=user_phone,
            message=message,
            priority='normal'
        )
    
    def send_check_in_reminder(self, user_phone: str, user_name: str):
        """
        Send daily check-in reminder
        """
        message = f"👋 Good morning, {user_name}!\n\nPlease tap the 'I'm OK' button in your app to let us know you're doing well today."
        
        return self._send_whatsapp(
            phone=user_phone,
            message=message,
            priority='normal'
        )
    
    def send_missed_check_in_alert(self, caregiver_phone: str, user_name: str):
        """
        Alert caregiver about missed check-in
        """
        message = f"⚠️ Missed Check-in Alert\n\n{user_name} has not completed today's 'I'm OK' check-in.\n\nPlease verify their wellbeing."
        
        return self._send_whatsapp(
            phone=caregiver_phone,
            message=message,
            priority='high'
        )
    
    def _send_whatsapp(self, phone: str, message: str, priority: str = 'normal') -> Dict:
        """
        Send WhatsApp message using API
        Note: This is a placeholder implementation. 
        In production, integrate with services like Twilio, WhatsApp Business API, or similar
        """
        try:
            # For development/testing, just log the message
            print(f"\n{'='*60}")
            print(f"WhatsApp Notification [{priority.upper()}]")
            print(f"To: {phone}")
            print(f"Message: {message}")
            print(f"Timestamp: {datetime.utcnow().isoformat()}")
            print(f"{'='*60}\n")
            
            # In production, uncomment and configure:
            # if self.whatsapp_api_key:
            #     response = requests.post(
            #         self.whatsapp_api_url,
            #         headers={
            #             'Authorization': f'Bearer {self.whatsapp_api_key}',
            #             'Content-Type': 'application/json'
            #         },
            #         json={
            #             'phone': phone,
            #             'message': message,
            #             'priority': priority
            #         }
            #     )
            #     return {
            #         'success': response.status_code == 200,
            #         'response': response.json()
            #     }
            
            return {
                'success': True,
                'message': 'Notification logged (development mode)',
                'timestamp': datetime.utcnow().isoformat()
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _send_push_notification(self, device_token: str, title: str, body: str, data: Dict = None) -> Dict:
        """
        Send push notification to mobile app
        Note: Placeholder for Firebase Cloud Messaging or similar service
        """
        try:
            print(f"\n{'='*60}")
            print(f"Push Notification")
            print(f"Device: {device_token}")
            print(f"Title: {title}")
            print(f"Body: {body}")
            if data:
                print(f"Data: {data}")
            print(f"{'='*60}\n")
            
            # In production, integrate with FCM or similar:
            # if self.push_notification_key:
            #     response = requests.post(
            #         'https://fcm.googleapis.com/fcm/send',
            #         headers={
            #             'Authorization': f'key={self.push_notification_key}',
            #             'Content-Type': 'application/json'
            #         },
            #         json={
            #             'to': device_token,
            #             'notification': {
            #                 'title': title,
            #                 'body': body
            #             },
            #             'data': data or {}
            #         }
            #     )
            #     return {
            #         'success': response.status_code == 200,
            #         'response': response.json()
            #     }
            
            return {
                'success': True,
                'message': 'Push notification logged (development mode)'
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _get_severity_emoji(self, severity: str) -> str:
        """
        Get emoji based on alert severity
        """
        emoji_map = {
            'low': 'ℹ️',
            'medium': '⚠️',
            'high': '🚨',
            'critical': '🆘'
        }
        return emoji_map.get(severity, 'ℹ️')
    
    def send_prescription_processed_notification(self, user_phone: str, caregiver_phone: str, 
                                                 medication_count: int):
        """
        Notify about successfully processed prescription
        """
        user_message = f"✅ Your prescription has been processed!\n\n{medication_count} medication(s) have been added to your schedule."
        
        caregiver_message = f"✅ Prescription Processed\n\n{medication_count} medication(s) added to schedule.\n\nPlease review and load medications into the device slots as indicated in the app."
        
        results = []
        
        if user_phone:
            results.append(self._send_whatsapp(user_phone, user_message))
        
        if caregiver_phone:
            results.append(self._send_whatsapp(caregiver_phone, caregiver_message))
        
        return results
