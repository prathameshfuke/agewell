import { useState, useEffect } from 'react';
import { Heart, Pill, AlertTriangle, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { useMedicationLogs } from '../../hooks/useMedications';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface PatientCardProps {
  patient: UserProfile;
}

export function PatientCard({ patient }: PatientCardProps) {
  const { getAdherenceRate } = useMedicationLogs(patient.id);
  const [recentAlerts, setRecentAlerts] = useState<number>(0);
  const [healthStatus, setHealthStatus] = useState<'good' | 'warning' | 'critical'>('good');

  useEffect(() => {
    loadPatientData();
  }, [patient.id]);

  const loadPatientData = async () => {
    const { data: alerts } = await supabase
      .from('alerts')
      .select('severity')
      .eq('user_id', patient.id)
      .in('status', ['pending', 'sent'])
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (alerts) {
      setRecentAlerts(alerts.length);
      const hasCritical = alerts.some(a => a.severity === 'critical' || a.severity === 'emergency');
      const hasWarning = alerts.some(a => a.severity === 'warning');

      if (hasCritical) {
        setHealthStatus('critical');
      } else if (hasWarning) {
        setHealthStatus('warning');
      } else {
        setHealthStatus('good');
      }
    }
  };

  const adherenceRate = getAdherenceRate(7);

  const statusColors = {
    good: 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50',
    warning: 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50',
    critical: 'border-red-400 bg-gradient-to-br from-red-50 to-pink-50',
  };

  const statusIcons = {
    good: <Heart className="text-green-600" size={24} />,
    warning: <AlertTriangle className="text-yellow-600" size={24} />,
    critical: <AlertTriangle className="text-red-600" size={24} />,
  };

  return (
    <div className={`rounded-xl shadow-lg p-6 border-2 ${statusColors[healthStatus]} transition-all hover:shadow-xl cursor-pointer`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{patient.display_name}</h3>
          <p className="text-sm text-gray-600">Patient ID: {patient.id.slice(0, 8)}</p>
        </div>
        {statusIcons[healthStatus]}
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between bg-white rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Pill size={18} className="text-blue-600" />
            <span className="text-sm text-gray-700">Adherence (7d)</span>
          </div>
          <span className={`font-bold ${adherenceRate >= 90 ? 'text-green-600' : adherenceRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
            {adherenceRate}%
          </span>
        </div>

        {recentAlerts > 0 && (
          <div className="flex items-center justify-between bg-white rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-600" />
              <span className="text-sm text-gray-700">Recent Alerts</span>
            </div>
            <span className="font-bold text-orange-600">{recentAlerts}</span>
          </div>
        )}
      </div>

      <button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 px-4 font-medium transition-colors flex items-center justify-center gap-2">
        View Details
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
