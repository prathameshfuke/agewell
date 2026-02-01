import { useState, useEffect } from 'react';
import { Users, Bell, Activity, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { PatientCard } from './PatientCard';
import { AlertsList } from './AlertsList';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type Alert = Database['public']['Tables']['alerts']['Row'];

export function CaregiverDashboard() {
  const { user, signOut } = useAuth();
  const [patients, setPatients] = useState<UserProfile[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'analytics'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPatients();
      loadAlerts();
    }
  }, [user]);

  const loadPatients = async () => {
    if (!user) return;

    try {
      const { data: relationships } = await supabase
        .from('caregiver_relationships')
        .select('elderly_id')
        .eq('caregiver_id', user.id);

      if (!relationships) return;

      const elderlyIds = relationships.map(r => r.elderly_id);

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', elderlyIds);

      setPatients(profiles || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    if (!user) return;

    try {
      const { data: relationships } = await supabase
        .from('caregiver_relationships')
        .select('elderly_id')
        .eq('caregiver_id', user.id);

      if (!relationships) return;

      const elderlyIds = relationships.map(r => r.elderly_id);

      const { data } = await supabase
        .from('alerts')
        .select('*')
        .in('user_id', elderlyIds)
        .in('status', ['pending', 'sent'])
        .order('created_at', { ascending: false })
        .limit(50);

      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'emergency');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AGEWELL Caregiver Portal</h1>
              <p className="text-sm text-gray-600 mt-1">Managing {patients.length} patient{patients.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 py-3">
            <button
              onClick={() => setActiveTab('overview')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                ${activeTab === 'overview'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <Users size={18} />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors relative
                ${activeTab === 'alerts'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <Bell size={18} />
              Alerts
              {criticalAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {criticalAlerts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                ${activeTab === 'analytics'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <Activity size={18} />
              Analytics
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'overview' && (
          <div>
            {criticalAlerts.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bell className="text-red-600" size={20} />
                  <p className="font-semibold text-red-800">
                    {criticalAlerts.length} critical alert{criticalAlerts.length !== 1 ? 's' : ''} requiring attention
                  </p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading patients...</p>
              </div>
            ) : patients.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Users size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Patients Yet</h3>
                <p className="text-gray-600 mb-4">You haven't been assigned to any patients yet.</p>
                <button className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
                  Add Patient
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {patients.map((patient) => (
                  <PatientCard key={patient.id} patient={patient} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <AlertsList alerts={alerts} onRefresh={loadAlerts} />
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Analytics Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                <TrendingUp className="text-blue-600 mb-2" size={32} />
                <p className="text-sm text-gray-600">Avg. Adherence Rate</p>
                <p className="text-3xl font-bold text-gray-900">94%</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                <Activity className="text-green-600 mb-2" size={32} />
                <p className="text-sm text-gray-600">Active Patients</p>
                <p className="text-3xl font-bold text-gray-900">{patients.length}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
                <Bell className="text-orange-600 mb-2" size={32} />
                <p className="text-sm text-gray-600">Open Alerts</p>
                <p className="text-3xl font-bold text-gray-900">{alerts.length}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
