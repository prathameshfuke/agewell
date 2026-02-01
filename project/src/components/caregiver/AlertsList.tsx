import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';

type Alert = Database['public']['Tables']['alerts']['Row'];

interface AlertsListProps {
  alerts: Alert[];
  onRefresh: () => void;
}

export function AlertsList({ alerts, onRefresh }: AlertsListProps) {
  const handleAcknowledge = async (alertId: string) => {
    await supabase
      .from('alerts')
      // @ts-expect-error Supabase type inference issue
      .update({
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    onRefresh();
  };

  const handleResolve = async (alertId: string) => {
    await supabase
      .from('alerts')
      // @ts-expect-error Supabase type inference issue
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    onRefresh();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'emergency':
        return 'bg-red-100 border-red-500 text-red-900';
      case 'critical':
        return 'bg-orange-100 border-orange-500 text-orange-900';
      case 'warning':
        return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-900';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'emergency':
      case 'critical':
        return <AlertCircle className="text-red-600" size={24} />;
      case 'warning':
        return <AlertCircle className="text-yellow-600" size={24} />;
      default:
        return <Clock className="text-blue-600" size={24} />;
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">All Clear!</h3>
        <p className="text-gray-600">No pending alerts at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`rounded-lg border-l-4 p-6 ${getSeverityColor(alert.severity)} shadow-md`}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              {getSeverityIcon(alert.severity)}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-1">{alert.title}</h3>
                  <p className="text-sm mb-2">{alert.message}</p>
                  <p className="text-xs opacity-75">
                    {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  {alert.status === 'pending' && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
