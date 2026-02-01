import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { ElderlyLayout } from './components/elderly/ElderlyLayout';
import { ElderlyHome } from './components/elderly/ElderlyHome';
import { CaregiverDashboard } from './components/caregiver/CaregiverDashboard';
import { mqttService } from './services/mqttService';

function App() {
  const { user, profile, loading } = useAuth();
  const [elderlyTab, setElderlyTab] = useState('home');

  useEffect(() => {
    if (user && profile?.role === 'elderly') {
      mqttService.connect(user.id);

      return () => {
        mqttService.disconnect();
      };
    }
  }, [user, profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mb-4"></div>
          <p className="text-2xl text-gray-700 font-semibold">Loading AGEWELL...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthPage />;
  }

  if (profile.role === 'elderly') {
    return (
      <ElderlyLayout activeTab={elderlyTab} onTabChange={setElderlyTab}>
        {elderlyTab === 'home' && <ElderlyHome />}
        {elderlyTab === 'medications' && (
          <div className="bg-white rounded-3xl shadow-xl p-10 border-4 border-blue-400">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">All My Medications</h2>
            <p className="text-2xl text-gray-600">Medication management interface coming soon...</p>
          </div>
        )}
        {elderlyTab === 'health' && (
          <div className="bg-white rounded-3xl shadow-xl p-10 border-4 border-green-400">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">My Health</h2>
            <p className="text-2xl text-gray-600">Health monitoring interface coming soon...</p>
          </div>
        )}
        {elderlyTab === 'alerts' && (
          <div className="bg-white rounded-3xl shadow-xl p-10 border-4 border-orange-400">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">My Alerts</h2>
            <p className="text-2xl text-gray-600">Alerts interface coming soon...</p>
          </div>
        )}
      </ElderlyLayout>
    );
  }

  if (profile.role === 'caregiver' || profile.role === 'doctor') {
    return <CaregiverDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-xl text-gray-700">Unknown user role</p>
    </div>
  );
}

export default App;
