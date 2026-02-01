import { Check, Clock, AlertCircle } from 'lucide-react';
import { Database } from '../../lib/database.types';

type Medication = Database['public']['Tables']['medications']['Row'];

interface MedicationCardProps {
  medication: Medication;
  time: string;
  taken: boolean;
  onTake: () => void;
  onSkip: () => void;
}

export function MedicationCard({ medication, time, taken, onTake, onSkip }: MedicationCardProps) {
  const isPastDue = () => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    return now > scheduledTime && !taken;
  };

  const getTimeDisplay = () => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const pillColors: Record<string, string> = {
    white: 'bg-white border-4 border-gray-300',
    pink: 'bg-pink-200 border-4 border-pink-400',
    blue: 'bg-blue-200 border-4 border-blue-400',
    yellow: 'bg-yellow-200 border-4 border-yellow-400',
    red: 'bg-red-200 border-4 border-red-400',
    green: 'bg-green-200 border-4 border-green-400',
    orange: 'bg-orange-200 border-4 border-orange-400',
  };

  const pillColor = pillColors[medication.pill_color?.toLowerCase() || 'white'] || pillColors.white;

  if (taken) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-8 border-4 border-green-400">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <Check size={48} className="text-white" strokeWidth={3} />
          </div>
          <div className="flex-1">
            <h3 className="text-3xl font-bold text-gray-900">{medication.name}</h3>
            <p className="text-2xl text-gray-600 mt-1">{medication.dosage}</p>
            <p className="text-xl text-green-600 font-semibold mt-2">
              Taken at {getTimeDisplay()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-white rounded-3xl shadow-xl p-8 border-4
        ${isPastDue() ? 'border-red-400 animate-pulse' : 'border-blue-400'}
      `}
    >
      <div className="flex items-start gap-6 mb-6">
        <div className={`w-24 h-24 rounded-full ${pillColor} flex items-center justify-center flex-shrink-0 shadow-lg`}>
          {isPastDue() ? (
            <AlertCircle size={48} className="text-red-600" strokeWidth={3} />
          ) : (
            <Clock size={48} className="text-gray-600" strokeWidth={3} />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-4xl font-bold text-gray-900">{medication.name}</h3>
          <p className="text-3xl text-gray-700 mt-2 font-semibold">{medication.dosage}</p>
          <div className="flex items-center gap-3 mt-3">
            <Clock size={28} className="text-blue-600" />
            <p className="text-2xl text-blue-600 font-bold">{getTimeDisplay()}</p>
          </div>
          {medication.pill_color && (
            <p className="text-xl text-gray-600 mt-2">
              {medication.pill_color} {medication.pill_shape || 'pill'}
              {medication.slot_number && ` • Slot ${medication.slot_number}`}
            </p>
          )}
        </div>
      </div>

      {medication.instructions && (
        <div className="bg-blue-50 rounded-2xl p-6 mb-6 border-2 border-blue-200">
          <p className="text-2xl text-gray-800 leading-relaxed">
            {medication.instructions}
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={onTake}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-2xl py-6 px-8 text-3xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
        >
          <span className="flex items-center justify-center gap-3">
            <Check size={36} strokeWidth={3} />
            I Took This
          </span>
        </button>
        <button
          onClick={onSkip}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-2xl py-6 px-8 text-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
        >
          Skip
        </button>
      </div>

      {isPastDue() && (
        <div className="mt-4 bg-red-50 border-2 border-red-400 rounded-2xl p-4">
          <p className="text-2xl text-red-700 font-bold text-center">
            This medication is overdue
          </p>
        </div>
      )}
    </div>
  );
}
