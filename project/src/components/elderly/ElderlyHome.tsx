import { useState } from 'react';
import { Heart, Thermometer, Wind, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTodaysMedications, useMedications } from '../../hooks/useMedications';
import { MedicationCard } from './MedicationCard';

export function ElderlyHome() {
  const { user } = useAuth();
  const todaysSchedule = useTodaysMedications(user?.id);
  const { logMedication } = useMedications(user?.id);
  const [showOkayFeedback, setShowOkayFeedback] = useState(false);

  const handleTakeMedication = async (medicationId: string, scheduledTime: string) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const fullScheduledTime = `${today}T${scheduledTime}:00`;
      await logMedication(medicationId, fullScheduledTime, 'taken');
    } catch (error) {
      console.error('Error logging medication:', error);
      alert('Failed to record medication. Please try again.');
    }
  };

  const handleSkipMedication = async (medicationId: string, scheduledTime: string) => {
    if (!user) return;

    const confirmed = window.confirm('Are you sure you want to skip this medication?');
    if (!confirmed) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const fullScheduledTime = `${today}T${scheduledTime}:00`;
      await logMedication(medicationId, fullScheduledTime, 'skipped', 'User chose to skip');
    } catch (error) {
      console.error('Error logging skip:', error);
      alert('Failed to record skip. Please try again.');
    }
  };

  const handleImOkay = () => {
    setShowOkayFeedback(true);
    setTimeout(() => setShowOkayFeedback(false), 3000);
  };

  const upcomingMeds = todaysSchedule.filter(item => !item.taken).slice(0, 3);
  const completedToday = todaysSchedule.filter(item => item.taken).length;
  const totalToday = todaysSchedule.length;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl shadow-xl p-10 border-4 border-emerald-400">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How are you feeling today?</h2>
          <button
            onClick={handleImOkay}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl py-8 px-16 text-4xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-200 active:scale-95"
          >
            <span className="flex items-center gap-4">
              <CheckCircle size={48} strokeWidth={3} />
              I'm OK!
            </span>
          </button>
          {showOkayFeedback && (
            <p className="text-3xl text-emerald-600 font-bold mt-6 animate-pulse">
              Great! Your caregiver has been notified.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border-2 border-red-200">
            <div className="flex items-center gap-4">
              <Heart size={40} className="text-red-500" strokeWidth={2.5} />
              <div>
                <p className="text-xl text-gray-600">Heart Rate</p>
                <p className="text-3xl font-bold text-gray-900">72 bpm</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-6 border-2 border-blue-200">
            <div className="flex items-center gap-4">
              <Thermometer size={40} className="text-blue-500" strokeWidth={2.5} />
              <div>
                <p className="text-xl text-gray-600">Room Temp</p>
                <p className="text-3xl font-bold text-gray-900">24°C</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
            <div className="flex items-center gap-4">
              <Wind size={40} className="text-green-500" strokeWidth={2.5} />
              <div>
                <p className="text-xl text-gray-600">Air Quality</p>
                <p className="text-3xl font-bold text-gray-900">Good</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-10 border-4 border-blue-400">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-bold text-gray-900">Today's Medications</h2>
          <div className="text-right">
            <p className="text-5xl font-bold text-blue-600">{completedToday}/{totalToday}</p>
            <p className="text-2xl text-gray-600">taken</p>
          </div>
        </div>

        {upcomingMeds.length === 0 && completedToday === totalToday && totalToday > 0 && (
          <div className="bg-green-50 border-4 border-green-400 rounded-3xl p-10 text-center">
            <CheckCircle size={64} className="text-green-600 mx-auto mb-4" strokeWidth={2.5} />
            <h3 className="text-4xl font-bold text-green-800">All done for today!</h3>
            <p className="text-2xl text-green-700 mt-3">You took all your medications. Great job!</p>
          </div>
        )}

        {upcomingMeds.length === 0 && totalToday === 0 && (
          <div className="bg-blue-50 border-4 border-blue-300 rounded-3xl p-10 text-center">
            <p className="text-3xl text-gray-700">No medications scheduled for today.</p>
          </div>
        )}

        <div className="space-y-6">
          {upcomingMeds.map((item) => (
            <MedicationCard
              key={`${item.medication.id}-${item.time}`}
              medication={item.medication}
              time={item.time}
              taken={item.taken}
              onTake={() => handleTakeMedication(item.medication.id, item.time)}
              onSkip={() => handleSkipMedication(item.medication.id, item.time)}
            />
          ))}
        </div>

        {completedToday > 0 && upcomingMeds.length > 0 && (
          <div className="mt-8 bg-green-50 border-2 border-green-300 rounded-2xl p-6">
            <p className="text-2xl text-green-800 text-center font-semibold">
              You've taken {completedToday} medication{completedToday !== 1 ? 's' : ''} today!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
