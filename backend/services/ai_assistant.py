from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import statistics

class AIAssistant:
    """
    Intelligent AI Assistant for AGEWELL platform
    Monitors health, medication adherence, and generates contextual alerts
    """
    
    # Health thresholds
    HEALTH_THRESHOLDS = {
        'spo2': {'critical': 90, 'warning': 93, 'normal_min': 95},
        'heart_rate': {'critical_low': 50, 'warning_low': 55, 'normal_min': 60, 
                       'normal_max': 100, 'warning_high': 110, 'critical_high': 120},
        'temperature': {'critical_low': 35.0, 'warning_low': 35.5, 'normal_min': 36.1,
                       'normal_max': 37.2, 'warning_high': 37.8, 'critical_high': 38.5},
        'bp_systolic': {'critical_low': 90, 'warning_low': 100, 'normal_min': 110,
                       'normal_max': 130, 'warning_high': 140, 'critical_high': 160},
        'bp_diastolic': {'critical_low': 60, 'warning_low': 65, 'normal_min': 70,
                        'normal_max': 85, 'warning_high': 90, 'critical_high': 100}
    }
    
    def __init__(self, db):
        self.db = db
    
    def analyze_health_data(self, user_id: int, hours: int = 24) -> Dict:
        """
        Analyze recent health readings and detect anomalies
        """
        from models import HealthReading
        
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        readings = HealthReading.query.filter(
            HealthReading.user_id == user_id,
            HealthReading.timestamp >= cutoff_time
        ).order_by(HealthReading.timestamp.desc()).all()
        
        if not readings:
            return {
                'status': 'no_data',
                'message': 'No recent health data available',
                'alerts': []
            }
        
        analysis = {
            'status': 'normal',
            'readings_count': len(readings),
            'time_range': f'Last {hours} hours',
            'metrics': {},
            'trends': {},
            'alerts': [],
            'severity': 'low'
        }
        
        # Analyze each metric
        metrics_to_analyze = ['spo2', 'heart_rate', 'temperature', 
                             'blood_pressure_systolic', 'blood_pressure_diastolic']
        
        for metric in metrics_to_analyze:
            values = [getattr(r, metric) for r in readings if getattr(r, metric) is not None]
            if values:
                metric_analysis = self._analyze_metric(metric, values, readings)
                analysis['metrics'][metric] = metric_analysis
                
                if metric_analysis['alerts']:
                    analysis['alerts'].extend(metric_analysis['alerts'])
                    # Update overall severity
                    if metric_analysis['severity'] == 'critical':
                        analysis['severity'] = 'critical'
                    elif metric_analysis['severity'] == 'high' and analysis['severity'] != 'critical':
                        analysis['severity'] = 'high'
                    elif metric_analysis['severity'] == 'medium' and analysis['severity'] not in ['critical', 'high']:
                        analysis['severity'] = 'medium'
        
        # Determine overall status
        if analysis['alerts']:
            analysis['status'] = 'attention_needed'
        
        return analysis
    
    def _analyze_metric(self, metric: str, values: List[float], readings: List) -> Dict:
        """
        Analyze a specific health metric
        """
        result = {
            'current': values[0],
            'average': round(statistics.mean(values), 2),
            'min': min(values),
            'max': max(values),
            'trend': self._calculate_trend(values),
            'alerts': [],
            'severity': 'low'
        }
        
        # Map metric names to threshold keys
        threshold_map = {
            'spo2': 'spo2',
            'heart_rate': 'heart_rate',
            'temperature': 'temperature',
            'blood_pressure_systolic': 'bp_systolic',
            'blood_pressure_diastolic': 'bp_diastolic'
        }
        
        threshold_key = threshold_map.get(metric)
        if not threshold_key or threshold_key not in self.HEALTH_THRESHOLDS:
            return result
        
        thresholds = self.HEALTH_THRESHOLDS[threshold_key]
        current_value = values[0]
        
        # Check for critical conditions
        if threshold_key == 'spo2':
            if current_value < thresholds['critical']:
                result['alerts'].append({
                    'level': 'critical',
                    'message': f'SpO₂ critically low at {current_value}%'
                })
                result['severity'] = 'critical'
            elif current_value < thresholds['warning']:
                result['alerts'].append({
                    'level': 'warning',
                    'message': f'SpO₂ below normal at {current_value}%'
                })
                result['severity'] = 'medium'
            
            # Check for repeated low readings
            low_readings = [v for v in values if v < thresholds['warning']]
            if len(low_readings) >= 3:
                result['alerts'].append({
                    'level': 'high',
                    'message': f'SpO₂ dropped below {thresholds["warning"]}% {len(low_readings)} times in recent readings'
                })
                result['severity'] = 'high'
        
        else:
            # For metrics with both high and low thresholds
            if 'critical_low' in thresholds and current_value < thresholds['critical_low']:
                result['alerts'].append({
                    'level': 'critical',
                    'message': f'{metric.replace("_", " ").title()} critically low at {current_value}'
                })
                result['severity'] = 'critical'
            elif 'critical_high' in thresholds and current_value > thresholds['critical_high']:
                result['alerts'].append({
                    'level': 'critical',
                    'message': f'{metric.replace("_", " ").title()} critically high at {current_value}'
                })
                result['severity'] = 'critical'
            elif 'warning_low' in thresholds and current_value < thresholds['warning_low']:
                result['alerts'].append({
                    'level': 'warning',
                    'message': f'{metric.replace("_", " ").title()} below normal at {current_value}'
                })
                result['severity'] = 'medium'
            elif 'warning_high' in thresholds and current_value > thresholds['warning_high']:
                result['alerts'].append({
                    'level': 'warning',
                    'message': f'{metric.replace("_", " ").title()} above normal at {current_value}'
                })
                result['severity'] = 'medium'
        
        return result
    
    def _calculate_trend(self, values: List[float]) -> str:
        """
        Calculate trend direction from recent values
        """
        if len(values) < 3:
            return 'stable'
        
        recent = values[:3]
        older = values[3:6] if len(values) >= 6 else values[3:]
        
        if not older:
            return 'stable'
        
        recent_avg = statistics.mean(recent)
        older_avg = statistics.mean(older)
        
        diff_percent = ((recent_avg - older_avg) / older_avg) * 100
        
        if diff_percent > 5:
            return 'increasing'
        elif diff_percent < -5:
            return 'decreasing'
        else:
            return 'stable'
    
    def check_medication_adherence(self, user_id: int, days: int = 7) -> Dict:
        """
        Analyze medication adherence patterns
        """
        from models import AdherenceLog, Medication
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        logs = AdherenceLog.query.filter(
            AdherenceLog.user_id == user_id,
            AdherenceLog.scheduled_time >= cutoff_date
        ).all()
        
        if not logs:
            return {
                'status': 'no_data',
                'message': 'No medication schedule found',
                'alerts': []
            }
        
        total = len(logs)
        taken = len([l for l in logs if l.status == 'taken'])
        missed = len([l for l in logs if l.status == 'missed'])
        late = len([l for l in logs if l.status == 'late'])
        
        adherence_rate = (taken / total * 100) if total > 0 else 0
        
        analysis = {
            'status': 'good' if adherence_rate >= 90 else 'needs_attention',
            'adherence_rate': round(adherence_rate, 1),
            'total_doses': total,
            'taken': taken,
            'missed': missed,
            'late': late,
            'alerts': [],
            'severity': 'low'
        }
        
        # Generate alerts based on adherence
        if adherence_rate < 70:
            analysis['alerts'].append({
                'level': 'critical',
                'message': f'Poor medication adherence: only {adherence_rate:.1f}% of doses taken'
            })
            analysis['severity'] = 'critical'
        elif adherence_rate < 85:
            analysis['alerts'].append({
                'level': 'high',
                'message': f'Medication adherence below target: {adherence_rate:.1f}%'
            })
            analysis['severity'] = 'high'
        
        # Check for recent missed doses
        recent_missed = [l for l in logs if l.status == 'missed' and 
                        l.scheduled_time >= datetime.utcnow() - timedelta(days=1)]
        
        if recent_missed:
            for log in recent_missed:
                med = Medication.query.get(log.medication_id)
                analysis['alerts'].append({
                    'level': 'high',
                    'message': f'Missed dose: {med.name if med else "Unknown"} at {log.scheduled_time.strftime("%I:%M %p")}'
                })
                analysis['severity'] = 'high'
        
        # Check for repeated dispensing attempts
        repeated_attempts = [l for l in logs if l.dispensing_attempts > 2]
        if repeated_attempts:
            analysis['alerts'].append({
                'level': 'medium',
                'message': f'{len(repeated_attempts)} doses required multiple dispensing attempts'
            })
            if analysis['severity'] == 'low':
                analysis['severity'] = 'medium'
        
        return analysis
    
    def generate_alert(self, user_id: int, alert_type: str, 
                      health_analysis: Dict = None, 
                      adherence_analysis: Dict = None) -> Dict:
        """
        Generate contextual alerts for elderly users and caregivers
        """
        from models import Alert, User
        
        user = User.query.get(user_id)
        if not user:
            return None
        
        severity = 'medium'
        title = ''
        message_elderly = ''
        message_caregiver = ''
        triggered_by = {}
        
        if alert_type == 'health':
            severity = health_analysis.get('severity', 'medium')
            alerts = health_analysis.get('alerts', [])
            
            if not alerts:
                return None
            
            # Combine alert messages
            critical_alerts = [a for a in alerts if a.get('level') == 'critical']
            high_alerts = [a for a in alerts if a.get('level') == 'high']
            
            if critical_alerts:
                title = 'Urgent Health Alert'
                message_elderly = "We noticed some concerning health readings. Please rest and your caregiver will check on you soon."
                
                alert_details = '. '.join([a['message'] for a in critical_alerts[:2]])
                message_caregiver = f"URGENT: {alert_details}. Please check on {user.name} immediately."
            elif high_alerts:
                title = 'Health Attention Needed'
                message_elderly = "Your health readings need attention. Please take it easy and wait for your caregiver."
                
                alert_details = '. '.join([a['message'] for a in high_alerts[:2]])
                message_caregiver = f"Attention needed: {alert_details}. Recommend checking on {user.name} soon."
            else:
                title = 'Health Monitoring Alert'
                message_elderly = "We're keeping an eye on your health. Everything should be fine."
                message_caregiver = f"Minor health variations detected for {user.name}. Monitor if needed."
            
            triggered_by = {
                'type': 'health_analysis',
                'metrics': health_analysis.get('metrics', {}),
                'alerts': alerts
            }
        
        elif alert_type == 'medication':
            severity = adherence_analysis.get('severity', 'medium')
            alerts = adherence_analysis.get('alerts', [])
            
            if not alerts:
                return None
            
            missed_alerts = [a for a in alerts if 'Missed dose' in a.get('message', '')]
            
            if missed_alerts:
                title = 'Medication Reminder'
                message_elderly = "It's time for your medicine. Please press 'Taken' after you finish."
                
                missed_details = '. '.join([a['message'] for a in missed_alerts[:2]])
                message_caregiver = f"Medication alert: {missed_details}. Please remind {user.name} if this continues."
            else:
                title = 'Medication Adherence Alert'
                message_elderly = "Let's try to take your medicines on time. It helps you stay healthy!"
                
                adherence_rate = adherence_analysis.get('adherence_rate', 0)
                message_caregiver = f"Medication adherence for {user.name}: {adherence_rate:.1f}%. Consider intervention if pattern continues."
            
            triggered_by = {
                'type': 'medication_adherence',
                'adherence_rate': adherence_analysis.get('adherence_rate'),
                'alerts': alerts
            }
        
        elif alert_type == 'check_in':
            title = 'Daily Check-in Missed'
            message_elderly = "We missed your 'I'm OK' check-in today. Please let us know you're doing well!"
            message_caregiver = f"{user.name} has not completed today's check-in. Please verify their wellbeing."
            severity = 'high'
            triggered_by = {'type': 'missed_check_in'}
        
        # Create alert in database
        alert = Alert(
            user_id=user_id,
            alert_type=alert_type,
            severity=severity,
            title=title,
            message_elderly=message_elderly,
            message_caregiver=message_caregiver,
            triggered_by=triggered_by,
            status='active'
        )
        
        self.db.session.add(alert)
        self.db.session.commit()
        
        return alert.to_dict()
    
    def comprehensive_analysis(self, user_id: int) -> Dict:
        """
        Perform comprehensive analysis combining health and medication data
        """
        health_analysis = self.analyze_health_data(user_id, hours=24)
        adherence_analysis = self.check_medication_adherence(user_id, days=7)
        
        # Determine if combined factors warrant an alert
        combined_severity = 'low'
        combined_alerts = []
        
        # Check for concerning combinations
        if (health_analysis.get('severity') in ['high', 'critical'] and 
            adherence_analysis.get('adherence_rate', 100) < 85):
            combined_alerts.append({
                'level': 'critical',
                'message': 'Health concerns combined with poor medication adherence'
            })
            combined_severity = 'critical'
        
        return {
            'user_id': user_id,
            'timestamp': datetime.utcnow().isoformat(),
            'health': health_analysis,
            'medication_adherence': adherence_analysis,
            'combined_severity': combined_severity,
            'combined_alerts': combined_alerts,
            'recommendations': self._generate_recommendations(health_analysis, adherence_analysis)
        }
    
    def _generate_recommendations(self, health_analysis: Dict, adherence_analysis: Dict) -> List[str]:
        """
        Generate actionable recommendations based on analysis
        """
        recommendations = []
        
        # Health-based recommendations
        if health_analysis.get('severity') in ['high', 'critical']:
            recommendations.append("Monitor health readings more frequently (every 2-4 hours)")
            recommendations.append("Ensure user is resting comfortably")
            recommendations.append("Consider consulting healthcare provider if readings don't improve")
        
        # Adherence-based recommendations
        adherence_rate = adherence_analysis.get('adherence_rate', 100)
        if adherence_rate < 85:
            recommendations.append("Set up additional medication reminders")
            recommendations.append("Review medication schedule with user for any difficulties")
            recommendations.append("Consider simplifying medication routine if possible")
        
        if adherence_analysis.get('missed', 0) > 0:
            recommendations.append("Check if user needs help with medication dispensing device")
        
        return recommendations
